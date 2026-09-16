<script setup lang="ts">
import { X, UserPlus, Trash2, Search, Crown, UsersRound } from 'lucide-vue-next';
import type { TugasMember, TugasMemberCandidate } from '~/types/tugas';

const props = defineProps<{
  modelValue: boolean;
  boardId: string;
  members: TugasMember[];
  isBersama: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'add-member', positionId: string): void;
  (e: 'remove-member', memberId: string): void;
  (e: 'change-type'): void;
}>();

const { t } = useI18n();
const toast = useToast();
const { fetchMemberCandidates } = useTugas();

const searchQuery = ref('');
const candidates = ref<TugasMemberCandidate[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const addingPositionId = ref<string | null>(null);

const close = () => emit('update:modelValue', false);

// Debounce pencarian kandidat (min 2 karakter sesuai kontrak backend)
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  candidates.value = [];
  hasSearched.value = false;
  const trimmed = value.trim();
  if (trimmed.length < 2) return;
  searchTimer = setTimeout(async () => {
    isSearching.value = true;
    try {
      const res = await fetchMemberCandidates(props.boardId, trimmed, 1, 10);
      const payload = (res as { data?: unknown }).data ?? res;
      const inner = payload as { data?: TugasMemberCandidate[] };
      candidates.value = Array.isArray(inner?.data) ? inner.data : [];
      hasSearched.value = true;
    } catch (error) {
      // 400 = board masih personal; error lain tampil generik.
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 400) {
        toast.add({ title: t('gagal_memuat'), color: 'error' });
      }
    } finally {
      isSearching.value = false;
    }
  }, 400);
});

const addMember = async (candidate: TugasMemberCandidate) => {
  addingPositionId.value = candidate.positionId;
  emit('add-member', candidate.positionId);
  // Reset pencarian setelah emit (parent yang menangani API + refresh).
  searchQuery.value = '';
  candidates.value = [];
  hasSearched.value = false;
  addingPositionId.value = null;
};

const initials = (nama: string) => {
  if (!nama) return '?';
  const parts = nama.trim().split(' ');
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      @click.self="close"
    >
      <div
        class="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
            >
              <UsersRound class="h-5 w-5" />
            </span>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ t('tugas_kelola_anggota') }}
              </h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ t('tugas_kelola_anggota_desc') }}
              </p>
            </div>
          </div>
          <button
            class="text-gray-500 hover:text-gray-800 dark:hover:text-white"
            aria-label="Tutup"
            @click="close"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <!-- Info tipe papan -->
          <div
            v-if="!isBersama"
            class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {{ t('tugas_papan_personal_info') }}
            <button
              class="ml-1 font-semibold underline underline-offset-2"
              @click="emit('change-type')"
            >
              {{ t('tugas_ubah_ke_bersama') }}
            </button>
          </div>

          <!-- Search kandidat -->
          <div v-if="isBersama">
            <div class="relative">
              <Search
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('tugas_cari_anggota_placeholder')"
                class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <p
              v-if="searchQuery.trim().length > 0 && searchQuery.trim().length < 2"
              class="mt-1 text-[11px] text-gray-400"
            >
              {{ t('tugas_min_karakter') }}
            </p>

            <!-- Hasil pencarian -->
            <div v-if="isSearching" class="mt-2 space-y-1.5">
              <USkeleton class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <USkeleton class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
            <div v-else-if="candidates.length" class="mt-2 space-y-1.5">
              <button
                v-for="candidate in candidates"
                :key="candidate.positionId"
                class="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-600 dark:hover:bg-gray-700/50"
                @click="addMember(candidate)"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ candidate.nama }}
                  </p>
                  <p class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {{ candidate.positionText }}
                  </p>
                </div>
                <UserPlus class="h-4 w-4 shrink-0 text-primary-500" />
              </button>
            </div>
            <p v-else-if="hasSearched" class="mt-2 text-xs text-gray-400">
              {{ t('tugas_kandidat_kosong') }}
            </p>
          </div>

          <!-- Daftar anggota -->
          <div>
            <p
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              {{ t('tugas_daftar_anggota') }} ({{ members.length }})
            </p>
            <div class="space-y-1.5">
              <div
                v-for="member in members"
                :key="member.id"
                class="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                  >
                    {{ initials(member.nama) }}
                  </span>
                  <div class="min-w-0">
                    <p
                      class="flex items-center gap-1 truncate text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ member.nama }}
                      <Crown v-if="member.role === 'owner'" class="h-3 w-3 text-amber-500" />
                    </p>
                    <p class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {{ member.positionText ?? member.positionId }}
                    </p>
                  </div>
                </div>
                <button
                  v-if="member.role !== 'owner'"
                  class="shrink-0 text-gray-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                  :aria-label="t('tugas_hapus_anggota')"
                  @click="emit('remove-member', member.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <UButton color="neutral" variant="outline" @click="close">
            {{ t('tutup_modal', 'Tutup') }}
          </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
