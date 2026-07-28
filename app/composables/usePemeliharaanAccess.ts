import { computed } from 'vue';
import { useAuth } from './useAuth';

export type PemeliharaanAccess = 'pemberkasan' | 'persetujuan';

const PEMBERKASAN_ACTORS = new Set(['SE', 'PS']);
const PERSETUJUAN_ACTORS = new Set(['PT', 'PH']);
const MANAGERIAL_TAGS = new Set(['BOD', 'BOD-1', 'BOD-2', 'BOD-3']);

export const usePemeliharaanAccess = () => {
  const { user } = useAuth();

  const effectiveRole = computed<PemeliharaanAccess | null>(() => {
    const ps = user.value?.position_status ?? null;
    if (ps && PEMBERKASAN_ACTORS.has(ps)) return 'pemberkasan';
    if (ps && PERSETUJUAN_ACTORS.has(ps)) return 'persetujuan';
    if (ps === 'VI' || ps === 'EXT') return null;
    const tag = user.value?.bodTag ?? '';
    if (MANAGERIAL_TAGS.has(tag)) return 'persetujuan';
    return 'pemberkasan'; // bodTag kosong → non-managerial
  });

  const canPemberkasan = computed(() => effectiveRole.value === 'pemberkasan');
  const canPersetujuan = computed(() => effectiveRole.value === 'persetujuan');

  return { effectiveRole, canPemberkasan, canPersetujuan };
};
