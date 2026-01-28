// ~/composables/useTerkirim.ts
import { ref } from "vue";
import { useApi } from "./useApi";

// Helper format tanggal (sama dengan view)
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

export interface SentParams {
  page?: number;
  limit?: number;
  jenis?: string;
  status_baca?: string;
  search?: string;
  // start_date?: string;
  // end_date?: string;
}

export const useSirkulasi = () => {
  const { apiGet, post } = useApi(); // Asumsi apiGet wrapper axios/fetch

  const items = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // State Pagination & Summary dari Server
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const summary = ref({
    total_semua: 0,
    total_belum_dibaca: 0,
    total_per_jenis: {} as Record<string, number>,
  });

  const fetchSentBox = async (params: SentParams = {}) => {
    isLoading.value = true;
    error.value = null;

    try {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.jenis && params.jenis !== "ALL" && params.jenis !== "Semua") {
        query.append("jenis", params.jenis);
      }
      if (params.status_baca && params.status_baca !== "Semua") {
        query.append("status_baca", params.status_baca);
      }
      if (params.search) {
        query.append("search", params.search);
      }
      // Support Custom Date Range
      // if (params.start_date && params.end_date) {
      //   query.append("start_date", params.start_date);
      //   query.append("end_date", params.end_date);
      // }

      // Endpoint baru tanpa positionId di URL
      const res = await apiGet(`/naskah_sirkulasi/sent/?${query.toString()}`);

      // Normalisasi response
      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data)
        ? responseBody.data
        : [];

      items.value = rawItems.map((item: any) => {
        // Mapping Data sesuai struktur UI
        const daftarPenerima = item.penerima || [];
        let displayRecipient = "Tanpa Penerima";
        let firstRecipientTitle = "Tanpa Jabatan";

        if (daftarPenerima.length > 0) {
          const firstPerson = daftarPenerima[0];
          const title = firstPerson.position_text || firstPerson.nama;
          firstRecipientTitle = title;
          displayRecipient =
            daftarPenerima.length > 1
              ? `${title} +${daftarPenerima.length - 1} lainnya`
              : title;
        }

        return {
          id: item.id_naskah, // atau item.id_sirkulasi
          naskahId: item.id_naskah,
          from: displayRecipient, // Di Sentbox, 'from' ditampilkan sebagai Penerima Utama
          email: firstRecipientTitle,

          subject: item.perihal || "-",
          body: item.nomor || "-",

          category: item.jenis,
          category_label: item.jenis_label,

          date: formatDateTime(item.created_at),
          fullDate: item.created_at || item.tanggal, // Untuk sorting client-side jika perlu

          initial:
            daftarPenerima[0]?.nama?.substring(0, 1).toUpperCase() || "?",
          viewCount: item.summary_baca?.terbaca || 0,

          isRead: true, // Sentbox selalu dianggap read oleh pengirim
          isFlagged: ["rahasia", "penting", "segera"].includes(
            (item.sifat || "").toLowerCase(),
          ),
          isLocked: item.status === "final_tte" || item.status === "final",
          isArchived: item.arsip,

          recipient: daftarPenerima
            .map((p: any) => p.position_text || p.nama)
            .join(", "),
          labels: item.labels || [],

          originalData: item,
        };
      });

      // Set Pagination & Summary
      if (responseBody?.pagination) pagination.value = responseBody.pagination;
      if (responseBody?.summary) summary.value = responseBody.summary;
    } catch (err: any) {
      console.error("Fetch Sent Box Error:", err);
      error.value = err.message || "Terjadi kesalahan jaringan";
      items.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const bulkActionSent = async (payload: {
    position_id: number;
    naskah_ids: string[];
    action: string;
  }) => {
    isLoading.value = true;
    try {
      return await post("/naskah_sirkulasi/sent/bulk-action", payload);
    } catch (err: any) {
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    items,
    pagination,
    summary,
    isLoading, // mapping ke pending di view
    error,
    fetchSentBox,
    bulkActionSent,
  };
};
