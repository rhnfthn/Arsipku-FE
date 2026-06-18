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
  let suggestionAbortController: AbortController | null = null;
  let suggestionTimeout: ReturnType<typeof setTimeout> | null = null;

  const fetchSuggestions = async (q: string, type: "pengirim" | "penerima") => {
    if (suggestionTimeout) clearTimeout(suggestionTimeout);
    if (suggestionAbortController) {
      suggestionAbortController.abort();
      suggestionAbortController = null;
    }

    const trimmed = q?.trim();
    if (!trimmed || trimmed.length < 2) {
      suggestions.value = [];
      isSuggestionsLoading.value = false;
      return;
    }

    isSuggestionsLoading.value = true;
    suggestions.value = [];

    suggestionTimeout = setTimeout(async () => {
      suggestionAbortController = new AbortController();
      try {
        const response = await apiGet(
          "/search/v3/suggestions",
          {
            params: { q: trimmed, type },
            signal: suggestionAbortController.signal,
          },
          { skipCache: true }
        );
        if (response.success) {
          suggestions.value = response.data?.items ?? [];
        } else {
          suggestions.value = [];
        }
      } catch (err: any) {
        if (err?.name !== "AbortError" && err?.code !== "ERR_CANCELED") {
          suggestions.value = [];
        }
      } finally {
        if (suggestionAbortController && !suggestionAbortController.signal.aborted) {
          isSuggestionsLoading.value = false;
        }
        suggestionAbortController = null;
      }
    }, 300);
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
