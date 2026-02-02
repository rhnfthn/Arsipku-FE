// ~/composables/useInbox.ts
import { ref, watch, isRef } from "vue";
import { useApi } from "~/composables/useApi";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const DETAIL_ENDPOINT_BY_JENIS: Record<string, string> = {
  ND: "/ND",
  DI: "/DI",
  SDI: "/SDI",
  SDE: "/SDE",
};

export interface InboxParams {
  page?: number;
  limit?: number;
  jenis?: string; // ND, DI, SDI, SDE
  status_baca?: string; // terbaca, belum_terbaca
  search?: string;
}

export function useInbox() {
  const { apiGet, apiPut, apiPatch } = useApi();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  // New State for Server-side Pagination & Summary
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const summary = ref({
    total_semua: 0,
    total_belum_dibaca: 0,
    total_per_jenis: {},
  });

  const fetchInbox = async (params: InboxParams = {}) => {
    pending.value = true;
    error.value = null;

    try {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.jenis && !["ALL", "Semua"].includes(params.jenis)) {
        query.append("jenis", params.jenis);
      }
      if (params.status_baca) {
        query.append("status_baca", params.status_baca);
      }
      if (params.search) {
        query.append("search", params.search);
      }

      const res = await apiGet(`/naskah_sirkulasi/inbox/?${query.toString()}`);

      // Normalisasi response
      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data)
        ? responseBody.data
        : [];

      items.value = rawItems.map((it: any) => {
        const pengirimName = it.pengirim?.nama || "-";
        const pengirimPos = it.pengirim?.position_text || "-";

        // --- LOGIKA FULL RECIPIENTS ---
        // Inbox biasanya menggunakan field 'kepada' untuk daftar penerima
        const listKepada = it.kepada || [];
        const isSDE = ["SDE", "EXTERNAL", "EKSTERNAL"].includes(
          (it.jenis || "").toUpperCase(),
        );

        const fullRecipientList =
          listKepada.length > 0
            ? listKepada
                .map((p: any, idx: number) => {
                  const pName = isSDE ? p.nama : p.position_text || p.nama;
                  return `${idx + 1}. ${pName}`;
                })
                .join("\n")
            : "Tanpa Penerima";

        return {
          // Mapping ID
          id: it.id_naskah,
          naskahId: it.id_naskah,

          // Kategori
          jenis: it.jenis,
          category: it.jenis,
          category_label: it.jenis_label,

          // Konten Utama
          nomor: it.nomor,
          date: formatDateTime(it.created_at),
          subject: (it.perihal || "").toString().trim(),

          // Penerima (Baru ditambahkan)
          fullRecipients: fullRecipientList,

          // Pengirim
          from: pengirimPos,
          fromPosition: pengirimPos,
          fromName: pengirimName,
          initial:
            pengirimName !== "-"
              ? pengirimName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
              : "?",

          // Status & Flags
          isRead: it.status_baca === "terbaca",
          isStarred: it.is_favorit,
          isArsip: it.is_arsip,
          isNote: it.is_note,
          isTinjut: it.is_tindak_lanjut,
          isLocked: it.is_locked,

          // Labels
          labels: it.labels || [],

          // Original Objects
          pengirim: it.pengirim,
          kepada: listKepada,
          penerimaAktif: it.penerima || null,

          raw: it,
        };
      });

      // Update Pagination & Summary
      if (responseBody?.pagination) pagination.value = responseBody.pagination;
      if (responseBody?.summary) summary.value = responseBody.summary;
    } catch (err: any) {
      console.error("useInbox error:", err);
      error.value = err.message || "Terjadi kesalahan";
      items.value = [];
    } finally {
      pending.value = false;
    }
  };

  const markAsRead = async (mail: any, positionId: string) => {
    if (mail.isRead) return;

    try {
      await apiPut("/naskah_sirkulasi/update-read-status", {
        id_naskah: mail.naskahId,
        position_id: positionId,
      });

      mail.isRead = true;
      if (mail.raw) {
        mail.raw.status_baca = "terbaca";
        mail.raw.read_time = new Date().toISOString();
      }

      // Optional: Update summary count locally
      if (summary.value.total_belum_dibaca > 0) {
        summary.value.total_belum_dibaca--;
      }
    } catch (err) {
      console.error("Gagal update status baca:", err);
    }
  };

  const toggleFlag = async (
    mail: any,
    flagType: "favorit" | "arsip" | "note",
  ) => {
    try {
      const res: any = await apiPatch("/naskah_sirkulasi/toggle-flag", {
        id_sirkulasi: mail.id, // Ensure this uses id_sirkulasi
        flag_type: flagType,
      });

      const newValue = res?.data?.new_value;

      // Update state local
      if (flagType === "favorit") mail.isStarred = newValue;
      if (flagType === "arsip") mail.isArsip = newValue;
      if (flagType === "note") mail.isNote = newValue;
    } catch (err) {
      console.error("Gagal toggle flag:", flagType, err);
    }
  };

  const fetchInboxDetail = async (idNaskah: string, jenis: string) => {
    const JENIS_LABEL_MAP: Record<string, string> = {
      ND: "Nota Dinas",
      DI: "Disposisi",
      SDI: "Surat Dinas Internal",
      SDE: "Surat Dinas Eksternal",
    };

    pending.value = true;
    error.value = null;

    try {
      const basePath = DETAIL_ENDPOINT_BY_JENIS[jenis];
      if (!basePath) throw new Error(`Jenis naskah tidak dikenali: ${jenis}`);

      const res = await apiGet(`${basePath}/${encodeURIComponent(idNaskah)}`);
      const d = res?.data;

      if (!d) return null;

      return {
        id: d.id,
        jenis: d.jenis,
        jenis_label: d.jenis_label || JENIS_LABEL_MAP[d.jenis] || "-",
        sifat: d.sifat,
        status: d.status,
        kepada_yth: d.kepada_yth,
        disposisi: d.disposisi,
        catatan: d.catatan,
        final_pdf_url: d.final_pdf_url,
        nomor: d.nomor,
        tanggal: d.tanggal,
        perihal: d.perihal,
        konten: d.konten,
        lampiran_files: d.lampiran_files || [],
        pengirim: d.pengirim,
        kepada: Array.isArray(d.penerima) ? d.penerima : [],
        tembusan: d.tembusan || [],
        raw: d,
      };
    } catch (err) {
      console.error("fetchInboxDetail error:", err);
      error.value = err;
      return null;
    } finally {
      pending.value = false;
    }
  };

  return {
    items,
    pagination, // Export pagination
    summary, // Export summary
    pending,
    error,
    fetchInbox, // Updated signature
    markAsRead,
    toggleFlag,
    fetchInboxDetail,
  };
}
