export const KORESPONDENSI_LIST_QUERY_KEYS = [
  'tab',
  'source',
  'filter',
  'sort',
  'date',
  'page',
  'limit',
  'search',
  'start_date',
  'end_date',
] as const;

type ListQueryValue = string | number | null | undefined;

type WritableState<T> = {
  value: T;
};

type ListState = {
  activeTab?: string;
  activeSourceValue?: string;
  activeFilterType?: string;
  activeSortLabel?: string;
  activeDateLabel?: string;
  currentPage?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  startDateInput?: string;
  endDateInput?: string;
};

type ApplyState = {
  activeTab?: WritableState<string>;
  activeSourceValue?: WritableState<string>;
  activeFilterType?: WritableState<string>;
  activeSortLabel?: WritableState<string>;
  activeDateLabel?: WritableState<string>;
  currentPage?: WritableState<number>;
  itemsPerPage?: WritableState<number>;
  searchQuery?: WritableState<string>;
  startDateInput?: WritableState<string>;
  endDateInput?: WritableState<string>;
};

type ApplyOptions = {
  tabs?: string[];
  sources?: string[];
  filters?: string[];
  sorts?: string[];
  dates?: string[];
  pageSizes?: number[];
};

const firstQueryValue = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined || raw === '') return undefined;
  return String(raw);
};

const setQueryValue = (query: Record<string, string>, key: string, value: ListQueryValue) => {
  if (value === null || value === undefined || value === '') return;
  query[key] = String(value);
};

const validValue = (value: string | undefined, validList?: string[], extraValid: string[] = []) => {
  if (!value) return false;
  if (!validList?.length) return true;
  return validList.includes(value) || extraValid.includes(value);
};

export const buildKorespondensiListQuery = (state: ListState) => {
  const query: Record<string, string> = {};

  if (state.activeTab && state.activeTab !== 'ALL' && state.activeTab !== 'Semua') {
    setQueryValue(query, 'tab', state.activeTab);
  }
  if (state.activeSourceValue && state.activeSourceValue !== 'ALL' && state.activeSourceValue !== 'Semua') {
    setQueryValue(query, 'source', state.activeSourceValue);
  }
  if (state.activeFilterType && state.activeFilterType !== 'Semua') {
    setQueryValue(query, 'filter', state.activeFilterType);
  }
  if (state.activeSortLabel && state.activeSortLabel !== 'Terbaru') {
    setQueryValue(query, 'sort', state.activeSortLabel);
  }
  if (state.activeDateLabel && state.activeDateLabel !== 'Semua') {
    setQueryValue(query, 'date', state.activeDateLabel);
  }
  if (state.currentPage && state.currentPage > 1) {
    setQueryValue(query, 'page', state.currentPage);
  }
  if (state.itemsPerPage && state.itemsPerPage !== 10) {
    setQueryValue(query, 'limit', state.itemsPerPage);
  }
  if (state.searchQuery?.trim()) {
    setQueryValue(query, 'search', state.searchQuery.trim());
  }
  if (state.activeDateLabel === 'Custom') {
    setQueryValue(query, 'start_date', state.startDateInput);
    setQueryValue(query, 'end_date', state.endDateInput);
  }

  return query;
};

export const pickKorespondensiListQuery = (source: Record<string, unknown>) => {
  const query: Record<string, string> = {};

  KORESPONDENSI_LIST_QUERY_KEYS.forEach((key) => {
    const value = firstQueryValue(source[key]);
    if (value) query[key] = value;
  });

  return query;
};

export const applyKorespondensiListQuery = (
  source: Record<string, unknown>,
  state: ApplyState,
  options: ApplyOptions = {},
) => {
  const query = pickKorespondensiListQuery(source);

  if (state.activeTab && validValue(query.tab, options.tabs)) state.activeTab.value = query.tab;
  if (state.activeSourceValue && validValue(query.source, options.sources)) state.activeSourceValue.value = query.source;
  if (state.activeFilterType && validValue(query.filter, options.filters)) state.activeFilterType.value = query.filter;
  if (state.activeSortLabel && validValue(query.sort, options.sorts)) state.activeSortLabel.value = query.sort;
  if (state.activeDateLabel && validValue(query.date, options.dates, ['Custom'])) state.activeDateLabel.value = query.date;
  if (state.searchQuery && query.search !== undefined) state.searchQuery.value = query.search;
  if (state.startDateInput && query.start_date) state.startDateInput.value = query.start_date;
  if (state.endDateInput && query.end_date) state.endDateInput.value = query.end_date;

  const page = Number(query.page);
  if (state.currentPage && Number.isInteger(page) && page > 0) state.currentPage.value = page;

  const limit = Number(query.limit);
  if (
    state.itemsPerPage &&
    Number.isInteger(limit) &&
    limit > 0 &&
    (!options.pageSizes?.length || options.pageSizes.includes(limit))
  ) {
    state.itemsPerPage.value = limit;
  }
};

export const replaceCurrentKorespondensiListQuery = async (
  router: { replace: (location: { path: string; query: Record<string, string> }) => Promise<unknown> },
  route: { path: string; query: Record<string, unknown> },
  state: ListState,
) => {
  const listQuery = buildKorespondensiListQuery(state);
  const query: Record<string, string> = {};

  Object.entries(route.query).forEach(([key, value]) => {
    if (KORESPONDENSI_LIST_QUERY_KEYS.includes(key as any)) return;
    const stringValue = firstQueryValue(value);
    if (stringValue) query[key] = stringValue;
  });

  const nextQuery = { ...query, ...listQuery };

  if (typeof window !== 'undefined' && window.history?.replaceState) {
    const search = new URLSearchParams(nextQuery).toString();
    const url = search ? `${route.path}?${search}` : route.path;
    window.history.replaceState(window.history.state, '', url);
  } else {
    await router.replace({
      path: route.path,
      query: nextQuery,
    });
  }

  return listQuery;
};
