// ~/composables/useInbox.ts
import { ref, watch, isRef } from "vue";
import { useApi } from "~/composables/useApi";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  const tanggal = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${tanggal} ${jam}`;
};

const DETAIL_ENDPOINT_BY_JENIS: Record<string, string> = {
  ND: "/ND",
  DI: "/DI",
  SDI: "/SDI",
  SDE: "/SDE",
};

export function useInbox(positionId: any) {
  const { apiGet, apiPut, apiPatch } = useApi();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  const fetchInbox = async (id: string | null) => {
    if (!id) {
      items.value = [];
      return;
    }

    pending.value = true;
    error.value = null;

    try {
      const res = await apiGet(
        `/naskah_sirkulasi/inbox/${encodeURIComponent(id)}`,
      );

      const rawItems = res?.data?.items || [];

      items.value = rawItems.map((it: any) => {
        const position = it.pengirim?.position_text || "-";
        const name = it.pengirim?.nama || "-";

        return {
          id: it.id_sirkulasi,
          naskahId: it.id_naskah,
          sifat: it.sifat || null,

          category: it.jenis,
          category_label: it.jenis_label,
          nomor: it.nomor,
          date: formatDateTime(it.created_at),
          subject: (it.perihal || it.nomor || "").toString().trim(),

          from: position,
          fromPosition: position,
          fromName: name,

          initial:
            name !== "-"
              ? name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
              : "?",

          // Status
          isRead: it.status_baca === "terbaca",
          isStarred: it.is_favorit,
          isArsip: it.is_arsip,
          isNote: it.is_note,

          pengirim: it.pengirim,
          kepada: Array.isArray(it.kepada) ? it.kepada : [],
          penerimaAktif: it.penerima || null,

          raw: it,
        };
      });
    } catch (err) {
      console.error("useInbox error:", err);
      error.value = err;
      items.value = [];
    } finally {
      pending.value = false;
    }
  };

  if (isRef(positionId)) {
    watch(positionId, (newId) => fetchInbox(newId), { immediate: true });
  }

  const refresh = () => {
    const id = isRef(positionId) ? positionId.value : positionId;
    return fetchInbox(id);
  };

  const markAsRead = async (mail: any, positionId: string) => {
    if (mail.isRead) return;

    try {
      await apiPut("/naskah_sirkulasi/update-read-status", {
        id_naskah: mail.naskahId,
        position_id: positionId,
      });

      mail.isRead = true;
      mail.raw.status_baca = "terbaca";
      mail.raw.read_time = new Date().toISOString();
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
        id_sirkulasi: mail.id,
        flag_type: flagType,
      });

      const newValue = res?.data?.new_value;

      // Update state lokal
      if (flagType === "favorit") mail.isStarred = newValue;
      if (flagType === "arsip") mail.isArsip = newValue;
      if (flagType === "note") mail.isNote = newValue;

      // sync raw
      if (mail.raw) {
        if (flagType === "favorit") mail.raw.is_favorit = newValue;
        if (flagType === "arsip") mail.raw.is_arsip = newValue;
        if (flagType === "note") mail.raw.is_note = newValue;
      }
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

      if (!basePath) {
        throw new Error(`Jenis naskah tidak dikenali: ${jenis}`);
      }

      const res = await apiGet(`${basePath}/${encodeURIComponent(idNaskah)}`);

      // Pastikan mengambil objek data yang benar.
      // Jika respons API dibungkus (misal: res.data.data atau res.data.flow[0]), sesuaikan di sini.
      // Asumsi di sini: res.data adalah objek surat langsung.
      const d = res?.data;

      if (!d) return null;

      return {
        id: d.id,
        jenis: d.jenis,
        jenis_label:
          d.jenis_label ||
          d.jenisLabel ||
          d.jenis_text ||
          JENIS_LABEL_MAP[d.jenis] ||
          "-",

        // --- PERBAIKAN DI SINI ---
        // Tambahkan field-field ini agar terbaca di template:
        sifat: d.sifat, // "terbatas", "biasa", dll
        status: d.status, // "final", "draft"
        kepada_yth: d.kepada_yth, // String jabatan tujuan utama (khusus Disposisi)
        disposisi: d.disposisi, // Isi instruksi disposisi
        catatan: d.catatan, // Isi catatan (HTML)
        final_pdf_url: d.final_pdf_url, // URL PDF utama
        // ------------------------

        nomor: d.nomor,
        tanggal: d.tanggal,
        perihal: d.perihal,
        konten: d.konten,
        lampiran_files: d.lampiran_files || [],
        pengirim: d.pengirim,

        // Mapping penerima array
        kepada: Array.isArray(d.penerima) ? d.penerima : [],
        tembusan: d.tembusan || [],

        // Simpan data mentah untuk jaga-jaga
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
    pending,
    error,
    refresh,
    markAsRead,
    toggleFlag,
    fetchInboxDetail,
    fetchInbox
  };
}
