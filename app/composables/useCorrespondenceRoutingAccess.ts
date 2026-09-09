export interface CorrespondenceRoutingCapabilities {
  feature_enabled: boolean;
  can_create_sdi: boolean;
  matched_role_codes: string[];
  matched_rule_ids: string[];
}

const defaultCapabilities = (): CorrespondenceRoutingCapabilities => ({
  feature_enabled: false,
  can_create_sdi: false,
  matched_role_codes: [],
  matched_rule_ids: [],
});

const CAPABILITY_CACHE_MS = 30_000;
const inflightCapabilities = new Map<string, Promise<CorrespondenceRoutingCapabilities>>();

export const useCorrespondenceRoutingAccess = () => {
  const { apiGet } = useApi();
  const { user } = useAuth();
  const capabilities = useState<CorrespondenceRoutingCapabilities>(
    'correspondence-routing-capabilities',
    defaultCapabilities
  );
  const loadedForPosition = useState<string | null>(
    'correspondence-routing-capabilities-position',
    () => null
  );
  const loadedAt = useState<number>('correspondence-routing-capabilities-loaded-at', () => 0);

  const invalidateCapabilities = () => {
    loadedForPosition.value = null;
    loadedAt.value = 0;
  };

  const fetchCapabilities = async (force = false) => {
    const position = String(user.value?.position ?? user.value?.position_id ?? '');
    const company = String(user.value?.company ?? '');
    const cacheKey = position && company ? `${company}:${position}` : '';
    if (!cacheKey) {
      capabilities.value = defaultCapabilities();
      loadedForPosition.value = null;
      loadedAt.value = 0;
      return capabilities.value;
    }
    if (
      !force &&
      loadedForPosition.value === cacheKey &&
      Date.now() - loadedAt.value < CAPABILITY_CACHE_MS
    )
      return capabilities.value;
    const inflight = inflightCapabilities.get(cacheKey);
    if (inflight) return inflight;

    const request = (async () => {
      try {
        const response: any = await apiGet(
          '/correspondence-routing/me/capabilities',
          {},
          { skipCache: true }
        );
        const data = response?.data?.data ?? response?.data ?? response;
        const latestPosition = String(user.value?.position ?? user.value?.position_id ?? '');
        const latestCompany = String(user.value?.company ?? '');
        if (`${latestCompany}:${latestPosition}` !== cacheKey) return capabilities.value;
        capabilities.value = {
          feature_enabled: data?.feature_enabled === true,
          can_create_sdi: data?.can_create_sdi === true,
          matched_role_codes: Array.isArray(data?.matched_role_codes)
            ? data.matched_role_codes
            : [],
          matched_rule_ids: Array.isArray(data?.matched_rule_ids) ? data.matched_rule_ids : [],
        };
        loadedForPosition.value = cacheKey;
        loadedAt.value = Date.now();
      } catch {
        // Fail closed: kegagalan capability tambahan tidak mengubah akses existing.
        const latestPosition = String(user.value?.position ?? user.value?.position_id ?? '');
        const latestCompany = String(user.value?.company ?? '');
        if (`${latestCompany}:${latestPosition}` !== cacheKey) return capabilities.value;
        capabilities.value = defaultCapabilities();
        loadedForPosition.value = cacheKey;
        loadedAt.value = Date.now();
      }
      return capabilities.value;
    })();

    inflightCapabilities.set(cacheKey, request);
    try {
      return await request;
    } finally {
      if (inflightCapabilities.get(cacheKey) === request) inflightCapabilities.delete(cacheKey);
    }
  };

  return {
    capabilities: readonly(capabilities),
    canCreateSdi: computed(() => capabilities.value.can_create_sdi),
    fetchCapabilities,
    invalidateCapabilities,
  };
};
