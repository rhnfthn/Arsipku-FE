// composables/useSearch.ts
export const useSearch = () => {
  const { apiGet } = useApi(); // Menggunakan useApi yang Anda buat
  const isLoading = ref(false);
  const error = ref(null);

  // State untuk hasil
  const results = ref<any[]>([]);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Interface params (sesuaikan dengan kebutuhan filter advanced nanti)
  interface SearchParams {
    keyword?: string;
    page?: number;
    limit?: number;
    // Tambahkan parameter advanced lain jika perlu (perihal, tanggal, dll)
    [key: string]: any;
  }

  const fetchSearch = async (params: SearchParams) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Bersihkan params yang kosong/null
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null && v !== "")
      );

      // Panggil endpoint search
      const response = await apiGet('/search', {
        params: cleanParams
      });

      if (response.success) {
        results.value = response.data.items;
        pagination.value = response.data.pagination;
      } else {
        results.value = [];
      }
    } catch (err: any) {
      console.error("Search Error:", err);
      error.value = err;
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    fetchSearch,
    results,
    pagination,
    isLoading,
    error
  };
};
