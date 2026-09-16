<script setup lang="ts">
import {
  X,
  KanbanSquare,
  UserRound,
  UsersRound,
  Check,
  Search,
  UserPlus,
  LoaderCircle,
} from 'lucide-vue-next';
import type { TugasBoardType, TugasBoardSummary } from '~/types/tugas';

/** Kandidat anggota yang dipilih user di form (belum tersimpan). */
export interface TugasBoardFormMember {
  positionId: string;
  persnum: number;
  nama: string;
  positionText: string;
}

const props = defineProps<{
  modelValue: boolean;
  board: TugasBoardSummary | null; // null = mode create
  saving: boolean;
  /** Anggota existing saat edit papan bersama (info saja, tidak diubah di sini). */
  existingMembers?: { id: string; nama: string; positionText?: string | null; role: string }[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'save',
    payload: {
      nama: string;
      deskripsi: string;
      tipe: TugasBoardType;
      icon?: string;
      warna: string;
      /** PositionId anggota terpilih — parent menambahkan setelah board dibuat. */
      memberPositionIds: string[];
    }
  ): void;
}>();

const { t } = useI18n();
const { apiGet } = useApi();

const isEditing = computed(() => Boolean(props.board));

const form = ref({
  nama: '',
  deskripsi: '',
  tipe: 'personal' as TugasBoardType,
  icon: null as string | null,
  warna: '#3B82F6',
});

// ─── Anggota (tipe bersama) ───────────────────────────────────────────────────

const selectedMembers = ref<TugasBoardFormMember[]>([]);
const memberSearch = ref('');
const memberCandidates = ref<TugasBoardFormMember[]>([]);
const isSearchingMembers = ref(false);
const hasSearchedMembers = ref(false);

const existingPositionIds = computed(
  () => new Set((props.existingMembers ?? []).map((m) => String(m.id)))
);

const isMemberSelected = (candidate: TugasBoardFormMember) =>
  selectedMembers.value.some((m) => m.positionId === candidate.positionId);

const addMember = (candidate: TugasBoardFormMember) => {
  if (isMemberSelected(candidate)) return;
  selectedMembers.value.push(candidate);
  memberSearch.value = '';
  memberCandidates.value = [];
  hasSearchedMembers.value = false;
};

const removeMember = (positionId: string) => {
  selectedMembers.value = selectedMembers.value.filter(
    (m) => m.positionId !== positionId
  );
};

// Debounce pencarian kandidat via /tugas/member-candidates (min 2 karakter).
// Endpoint ini mencakup SEMUA posisi aktif (managerial & staf) dalam company
// actor — bukan hanya managerial seperti /person/with-position/all.
let memberSearchTimer: ReturnType<typeof setTimeout> | null = null;
watch(memberSearch, (value) => {
  if (memberSearchTimer) clearTimeout(memberSearchTimer);
  memberCandidates.value = [];
  hasSearchedMembers.value = false;
  const trimmed = value.trim();
  if (trimmed.length < 2) return;
  memberSearchTimer = setTimeout(async () => {
    isSearchingMembers.value = true;
    try {
      const res = await apiGet<any>(
        '/tugas/member-candidates',
        { params: { q: trimmed, page: 1, limit: 10 } },
        { skipCache: true }
      );
      const payload = (res?.data ?? res) as { data?: TugasBoardFormMember[] };
      const rows = payload?.data ?? [];
      memberCandidates.value = (Array.isArray(rows) ? rows : [])
        .filter(
          (row) =>
            row.positionId &&
            !isMemberSelected(row) &&
            !existingPositionIds.value.has(String(row.positionId))
        )
        .map((row) => ({
          positionId: String(row.positionId),
          persnum: Number(row.persnum),
          nama: String(row.nama ?? ''),
          positionText: String(row.positionText ?? ''),
        }));
      hasSearchedMembers.value = true;
    } catch {
      memberCandidates.value = [];
      hasSearchedMembers.value = true;
    } finally {
      isSearchingMembers.value = false;
    }
  }, 400);
});

// ─── Sinkronkan form saat modal dibuka ───────────────────────────────────────

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (props.board) {
      form.value = {
        nama: props.board.nama,
        deskripsi: props.board.deskripsi ?? '',
        tipe: props.board.tipe,
        icon: props.board.icon ?? null,
        warna: props.board.warna,
      };
    } else {
      form.value = {
        nama: '',
        deskripsi: '',
        tipe: 'personal',
        icon: null,
        warna: '#3B82F6',
      };
    }
    selectedMembers.value = [];
    memberSearch.value = '';
    memberCandidates.value = [];
    hasSearchedMembers.value = false;
  }
);

const close = () => emit('update:modelValue', false);

const save = () => {
  if (!form.value.nama.trim()) return;
  emit('save', {
    nama: form.value.nama.trim(),
    deskripsi: form.value.deskripsi.trim(),
    tipe: form.value.tipe,
    icon: form.value.icon ?? undefined,
    warna: form.value.warna,
    memberPositionIds:
      form.value.tipe === 'bersama'
        ? selectedMembers.value.map((m) => m.positionId)
        : [],
  });
};

const colorOptions = [
  '#3B82F6', // biru
  '#10B981', // hijau
  '#F59E0B', // amber
  '#EF4444', // merah
  '#8B5CF6', // ungu
  '#EC4899', // pink
  '#6B7280', // abu
  '#0EA5E9', // sky
];

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
        class="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
            >
              <KanbanSquare class="h-5 w-5" />
            </span>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ isEditing ? t('tugas_ubah_papan') : t('tugas_buat_papan') }}
              </h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ isEditing ? t('tugas_ubah_papan_desc') : t('tugas_buat_papan_desc') }}
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
        <form class="flex-1 space-y-4 overflow-y-auto px-5 py-5" @submit.prevent="save">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_nama_papan') }} <span class="text-error-500">*</span>
            </label>
            <UInput
              v-model="form.nama"
              maxlength="150"
              class="w-full"
              :placeholder="t('tugas_nama_papan_placeholder')"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_deskripsi_papan') }}
            </label>
            <UTextarea
              v-model="form.deskripsi"
              :rows="3"
              maxlength="5000"
              autoresize
              class="w-full"
              :placeholder="t('tugas_deskripsi_papan_placeholder')"
            />
          </div>

          <!-- Tipe papan: kartu pilihan dengan ikon lucide -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_tipe_papan') }}
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="relative rounded-lg border p-3 text-left transition-all"
                :class="
                  form.tipe === 'personal'
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-500 dark:bg-primary-900/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500'
                "
                @click="form.tipe = 'personal'"
              >
                <Check
                  v-if="form.tipe === 'personal'"
                  class="absolute right-2 top-2 h-3.5 w-3.5 text-primary-600 dark:text-primary-400"
                />
                <UserRound
                  class="mb-2 h-5 w-5"
                  :class="
                    form.tipe === 'personal'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  "
                />
                <span class="block text-sm font-medium text-gray-900 dark:text-white">
                  {{ t('tugas_papan_personal') }}
                </span>
                <span class="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                  {{ t('tugas_papan_personal_desc') }}
                </span>
              </button>
              <button
                type="button"
                class="relative rounded-lg border p-3 text-left transition-all"
                :class="
                  form.tipe === 'bersama'
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-500 dark:bg-primary-900/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500'
                "
                @click="form.tipe = 'bersama'"
              >
                <Check
                  v-if="form.tipe === 'bersama'"
                  class="absolute right-2 top-2 h-3.5 w-3.5 text-primary-600 dark:text-primary-400"
                />
                <UsersRound
                  class="mb-2 h-5 w-5"
                  :class="
                    form.tipe === 'bersama'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  "
                />
                <span class="block text-sm font-medium text-gray-900 dark:text-white">
                  {{ t('tugas_papan_bersama') }}
                </span>
                <span class="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                  {{ t('tugas_papan_bersama_desc') }}
                </span>
              </button>
            </div>
          </div>

          <!-- Form tambah anggota — muncul saat tipe bersama -->
          <div v-if="form.tipe === 'bersama'" class="space-y-2">
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_tambah_anggota_papan') }}
            </label>

            <!-- Anggota terpilih (chips) -->
            <div v-if="selectedMembers.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="member in selectedMembers"
                :key="member.positionId"
                class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-1.5 pr-2 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700 dark:bg-primary-800 dark:text-primary-200"
                >
                  {{ initials(member.nama) }}
                </span>
                {{ member.nama }}
                <button
                  type="button"
                  class="text-primary-400 transition-colors hover:text-error-500"
                  :aria-label="t('tugas_hapus_anggota')"
                  @click="removeMember(member.positionId)"
                >
                  <X class="h-3 w-3" />
                </button>
              </span>
            </div>

            <!-- Pencarian kandidat -->
            <div class="relative">
              <Search
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="memberSearch"
                type="text"
                :placeholder="t('tugas_cari_anggota_placeholder')"
                class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:bg-gray-600"
              />
            </div>
            <p
              v-if="memberSearch.trim().length > 0 && memberSearch.trim().length < 2"
              class="text-[11px] text-gray-400"
            >
              {{ t('tugas_min_karakter') }}
            </p>

            <!-- Loading -->
            <div
              v-if="isSearchingMembers"
              class="flex items-center gap-2 px-1 py-2 text-xs text-gray-400"
            >
              <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
              {{ t('memuat') }}
            </div>

            <!-- Hasil pencarian -->
            <div v-else-if="memberCandidates.length" class="space-y-1">
              <button
                v-for="candidate in memberCandidates"
                :key="candidate.positionId"
                type="button"
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
            <p v-else-if="hasSearchedMembers" class="text-xs text-gray-400">
              {{ t('tugas_kandidat_kosong') }}
            </p>

            <!-- Anggota existing (mode edit) -->
            <div
              v-if="isEditing && existingMembers?.length"
              class="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700"
            >
              <p
                class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
              >
                {{ t('tugas_daftar_anggota') }} ({{ existingMembers.length }})
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="member in existingMembers"
                  :key="member.id"
                  class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1.5 pr-2 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200"
                  >
                    {{ initials(member.nama) }}
                  </span>
                  {{ member.nama }}
                </span>
              </div>
            </div>
          </div>

          <!-- Ikon papan (lucide picker) -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_ikon_papan') }}
            </label>
            <TugasBoardIconPicker v-model="form.icon" />
          </div>

          <!-- Warna papan dengan ikon check -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_warna_papan') }}
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in colorOptions"
                :key="color"
                type="button"
                class="relative h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                :class="
                  form.warna === color
                    ? 'border-gray-900 dark:border-white'
                    : 'border-transparent'
                "
                :style="{ backgroundColor: color }"
                :aria-label="color"
                @click="form.warna = color"
              >
                <Check
                  v-if="form.warna === color"
                  class="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white"
                />
              </button>
            </div>
          </div>
        </form>

        <!-- Footer -->
        <div class="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-4">
          <UButton color="neutral" variant="outline" :disabled="saving" @click="close">
            {{ t('batal') }}
          </UButton>
          <UButton color="primary" :loading="saving" :disabled="!form.nama.trim()" @click="save">
            {{ isEditing ? t('simpan_perubahan') : t('tugas_buat_papan') }}
          </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
