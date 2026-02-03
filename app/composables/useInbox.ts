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
export interface InboxParams {
  page?: number;
  limit?: number;
  jenis?: string;
  status_baca?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  preset?: string;
}

export function useInbox() {
  const { apiGet, apiPut, apiPatch } = useApi();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

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
      if (params.preset) {
        query.append("preset", params.preset);
      }
      if (params.start_date) {
        query.append("start_date", params.start_date);
      }
      if (params.end_date) {
        query.append("end_date", params.end_date);
      }

      const res = await apiGet(`/naskah_sirkulasi/inbox/?${query.toString()}`);

      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data)
        ? responseBody.data
        : [];

      items.value = rawItems.map((it: any) => {
        const pengirimName = it.pengirim?.nama || "-";
        const pengirimPos = it.pengirim?.position_text || "-";
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
          sirkulasiId: it.id_sirkulasi,
          naskahId: it.id_naskah,

          jenis: it.jenis,
          category: it.jenis,
          category_label: it.jenis_label,
          nomor: it.nomor,
          date: formatDateTime(it.created_at),
          subject: (it.perihal || "").toString().trim(),
          fullRecipients: fullRecipientList,
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

          isRead: it.status_baca === "terbaca",
          isStarred: it.is_favorit,
          isArsip: it.is_arsip,
          isNote: it.is_note,
          isTinjut: it.is_tindak_lanjut,
          isLocked: it.is_locked,
          labels: it.labels || [],
          pengirim: it.pengirim,
          kepada: listKepada,
          penerimaAktif: it.penerima || null,
          raw: it,
        };
      });

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
      if (summary.value.total_belum_dibaca > 0) {
        summary.value.total_belum_dibaca--;
      }
    } catch (err) {
      console.error("Gagal update status baca:", err);
    }
  };

  // --- PERBAIKAN TOGGLE FLAG ---
  const toggleFlag = async (
    mail: any,
    flagType: "favorit" | "arsip" | "note",
  ) => {
    // 1. Simpan state lama (Optimistic UI)
    const oldVal =
      flagType === "favorit"
        ? mail.isStarred
        : flagType === "arsip"
          ? mail.isArsip
          : mail.isNote;

    // 2. Update UI duluan
    if (flagType === "favorit") mail.isStarred = !oldVal;
    if (flagType === "arsip") mail.isArsip = !oldVal;
    if (flagType === "note") mail.isNote = !oldVal;

    try {
      // 3. Gunakan 'sirkulasiId' yang sudah di-mapping di fetchInbox
      // BUKAN mail.id_sirkulasi (karena id_sirkulasi ada di mail.raw, tapi di root object kita map ke sirkulasiId)
      const idToSend = mail.sirkulasiId || mail.raw?.id_sirkulasi;

      if (!idToSend) throw new Error("ID Sirkulasi tidak ditemukan");

      const res: any = await apiPatch("/naskah_sirkulasi/toggle-flag", {
        id_sirkulasi: idToSend,
        flag_type: flagType,
        // action: !oldVal ? "add" : "delete", // Sesuaikan action add/delete
      });

      // Jika backend mengembalikan nilai baru, pastikan sinkron (opsional)
      // const newValue = res?.data?.new_value;
    } catch (err) {
      // 4. Revert jika error
      console.error("Gagal toggle flag:", flagType, err);
      if (flagType === "favorit") mail.isStarred = oldVal;
      if (flagType === "arsip") mail.isArsip = oldVal;
      if (flagType === "note") mail.isNote = oldVal;
    }
  };

  // ... (fetchInboxDetail tetap sama) ...
  const JENIS_LABEL_MAP: Record<string, string> = {
    ND: "Nota Dinas",
    DI: "Disposisi",
    SDI: "Surat Dinas Internal",
    SDE: "Surat Dinas Eksternal",
  };

  const fetchInboxDetail = async (idNaskah: string, jenis?: string) => {
    // ... (kode fetchInboxDetail Anda tetap sama)
    pending.value = true;
    error.value = null;
    try {
      const res = await apiGet(
        `/persuratan/naskah/${encodeURIComponent(idNaskah)}`,
      );
      const d = res?.data && Array.isArray(res.data) ? res.data[0] : res?.data;
      if (!d) return null;
      return {
        id: d.id,
        jenis: d.jenis,
        jenis_label: d.jenis_label || JENIS_LABEL_MAP[d.jenis] || d.jenis,
        nomor: d.nomor,
        tanggal: d.tanggal,
        perihal: d.perihal,
        sifat: d.sifat,
        status: d.status,
        pengirim: d.pengirim,
        kepada: Array.isArray(d.penerima) ? d.penerima : d.kepada || [],
        tembusan: d.tembusan || [],
        kepada_yth: d.detail?.kepada_yth || d.kepada_yth,
        disposisi: d.detail?.disposisi || d.disposisi,
        catatan: d.detail?.catatan || d.catatan,
        konten: d.konten,
        lampiran_files: d.lampiran_files || [],
        final_pdf_url: d.final_pdf_url || d.final_pdf,
        raw: d,
      };
    } catch (err: any) {
      console.error("fetchInboxDetail error:", err);
      error.value = err;
      return null;
    } finally {
      pending.value = false;
    }
  };

  return {
    items,
    pagination,
    summary,
    pending,
    error,
    fetchInbox,
    markAsRead,
    toggleFlag,
    fetchInboxDetail,
  };
}
