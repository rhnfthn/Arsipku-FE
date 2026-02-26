// composables/useSearch.ts
export const useSearch = () => {
  const { apiGet } = useApi();
  const isLoading = ref(false);
  const error = ref(null);

  const results = ref<any[]>([]);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  interface SearchParams {
    keyword?: string;
    page?: number;
    limit?: number;
    [key: string]: any;
  }

  const fetchSearch = async (params: SearchParams) => {
    isLoading.value = true;
    error.value = null;

    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null && v !== ""),
      );

      const response = await apiGet("/search/v3", {
        // ← ganti di sini
        params: cleanParams,
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

  const suggestions = ref<{ nama: string; jabatan: string }[]>([]);
  const isSuggestionsLoading = ref(false);

  const fetchSuggestions = async (q: string, type: "pengirim" | "penerima") => {
    if (!q || q.trim().length < 2) {
      suggestions.value = [];
      return;
    }
    isSuggestionsLoading.value = true;
    try {
      const response = await apiGet("/search/v3/suggestions", {
        params: { q: q.trim(), type },
      });
      if (response.success) {
        suggestions.value = response.data?.items ?? []; // ← fix: .items
      } else {
        suggestions.value = [];
      }
    } catch {
      suggestions.value = [];
    } finally {
      isSuggestionsLoading.value = false;
    }
  };

  return {
    fetchSearch,
    results,
    pagination,
    isLoading,
    error,
    suggestions,
    isSuggestionsLoading,
    fetchSuggestions,
  };
};
