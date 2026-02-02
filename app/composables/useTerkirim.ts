// ~/composables/useTerkirim.ts
import { ref } from "vue";
import { useApi } from "./useApi";

// Helper format tanggal (dipindahkan agar lebih bersih)
const formatDateTime = (value: string | null | undefined): string => {
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
}

export const useSirkulasi = () => {
  const { apiGet, post } = useApi();

  const items = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

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
      if (params.jenis && !["ALL", "Semua"].includes(params.jenis)) {
        query.append("jenis", params.jenis);
      }
      if (params.status_baca && params.status_baca !== "Semua") {
        query.append("status_baca", params.status_baca);
      }
      if (params.search) query.append("search", params.search);

      const res = await apiGet(`/naskah_sirkulasi/sent/?${query.toString()}`);

      // Normalisasi response
      const responseBody = res?.data?.pagination ? res.data : res;
      const rawItems = Array.isArray(responseBody?.data)
        ? responseBody.data
        : [];

      items.value = rawItems.map((item: any) => {
        const listPenerima = item.penerima || [];
        const jenisSurat = (item.jenis || "").toUpperCase();
        const isSDE = ["SDE", "EXTERNAL", "EKSTERNAL"].includes(jenisSurat);

        let displayRecipient = "Tanpa Penerima";
        let fullRecipientList = "Tanpa Penerima";
        let firstRecipientTitle = "Tanpa Penerima";
        let initialLetter = "?";

        if (listPenerima.length > 0) {
          const firstPerson = listPenerima[0];

          // Penentuan Nama Utama
          const primaryName =
            (isSDE
              ? firstPerson.nama
              : firstPerson.position_text || firstPerson.nama) || "Tanpa Nama";

          firstRecipientTitle =
            firstPerson.position_text || firstPerson.nama || "Tanpa Penerima";
          initialLetter = primaryName.charAt(0).toUpperCase();

          displayRecipient =
            listPenerima.length > 1
              ? `${primaryName} +${listPenerima.length - 1} lainnya`
              : primaryName;

          fullRecipientList = listPenerima
            .map((p: any, idx: number) => {
              const pName = isSDE ? p.nama : p.position_text || p.nama;
              return `${idx + 1}. ${pName}`;
            })
            .join("\n");
        }

        return {
          id: item.id_naskah,
          naskahId: item.id_naskah,
          fullRecipients: fullRecipientList,
          from: displayRecipient,
          email: firstRecipientTitle,
          subject: item.perihal || "-",
          body: item.nomor || "-",
          category: item.jenis,
          category_label: item.jenis_label,
          date: formatDateTime(item.created_at),
          fullDate: item.created_at || item.tanggal,
          initial: initialLetter,
          viewCount: item.summary_baca?.terbaca || 0,
          isRead: true,
          isFlagged: ["rahasia", "penting", "segera"].includes(
            (item.sifat || "").toLowerCase(),
          ),
          isLocked: ["final_tte", "final"].includes(item.status),
          isArchived: item.arsip,
          recipient: listPenerima
            .map((p: any) => p.position_text || p.nama)
            .join(", "),
          labels: item.labels || [],
          originalData: item,
        };
      });

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
    } finally {
      isLoading.value = false;
    }
  };

  return {
    items,
    pagination,
    summary,
    isLoading,
    error,
    fetchSentBox,
    bulkActionSent,
  };
};
