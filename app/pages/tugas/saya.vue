<script setup lang="ts">
import { ListTodo, Search, CalendarClock, CircleCheckBig, RefreshCw, Inbox } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import EmptyState from '~/components/EmptyState.vue';
import DataPagination from '~/components/DataPagination.vue';
import DataToolbar from '~/components/DataToolbar.vue';
import { useTugas } from '~/composables/useTugas';
import type { TugasMyTaskItem, TugasMyTaskScope, TugasTaskPriority } from '~/types/tugas';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { hasPermission } = useAuth();
const {
  myTasks,
  myTaskCounts,
  myTasksMeta,
  isLoadingMyTasks,
  myTasksError,
  fetchMyTasks,
} = useTugas();

const canRead = computed(() => hasPermission('tugas', 'read'));

// ─── Filter (URL query sinkron) ───────────────────────────────────────────────

const activeScope = computed<TugasMyTaskScope>(() => {
  const raw = String(route.query.scope ?? 'semua');
  return ['semua', 'terlambat', 'hari-ini', 'mendatang', 'selesai'].includes(raw)
    ? (raw as TugasMyTaskScope)
    : 'semua';
});
const activeSearch = computed(() => String(route.query.q ?? ''));
const toolbarSearch = ref(activeSearch.value);
const activePrioritas = computed<TugasTaskPriority | null>(() => {
  const raw = String(route.query.prioritas ?? '');
  return ['rendah', 'sedang', 'tinggi'].includes(raw) ? (raw as TugasTaskPriority) : null;
});
const currentPage = computed(() => Number(route.query.page ?? 1) || 1);

// ─── Opsi dropdown filter (USelectMenu) ─────────────────────────────────────
// Sentinel '__ALL__' untuk opsi "semua" — Reka UI Combobox crash jika ada
// item dengan value string kosong (sama perilaku dengan USelect).
const ALL_FILTER = '__ALL__';

const scopeOptions = computed(() => [
  { label: t('tugas_scope_semua'), value: 'semua' },
  { label: t('tugas_scope_terlambat'), value: 'terlambat' },
  { label: t('tugas_scope_hari_ini'), value: 'hari-ini' },
  { label: t('tugas_scope_mendatang'), value: 'mendatang' },
  { label: t('tugas_scope_selesai'), value: 'selesai' },
]);

const prioritasOptions = computed(() => [
  { label: t('tugas_semua_prioritas'), value: ALL_FILTER },
  { label: t('tugas_prioritas_tinggi'), value: 'tinggi' },
  { label: t('tugas_prioritas_sedang'), value: 'sedang' },
  { label: t('tugas_prioritas_rendah'), value: 'rendah' },
]);

const selectedScope = computed({
  get: () => activeScope.value,
  set: (value: TugasMyTaskScope) => setScope(value),
});

const selectedPrioritas = computed({
  get: () => activePrioritas.value ?? ALL_FILTER,
  set: (value: string) =>
    setPrioritas((value === ALL_FILTER ? null : value) as TugasTaskPriority | null),
});

const setScope = (scope: TugasMyTaskScope) => {
  router.replace({ query: { ...route.query, scope, page: '1' } });
};

const setPrioritas = (prioritas: TugasTaskPriority | null) => {
  router.replace({
    query: { ...route.query, prioritas: prioritas ?? undefined, page: '1' },
  });
};

const setPage = (page: number) => {
  router.replace({ query: { ...route.query, page: String(page) } });
};

// ─── Data loading ─────────────────────────────────────────────────────────────

const loadMyTasks = async () => {
  await fetchMyTasks({
    scope: activeScope.value,
    prioritas: activePrioritas.value ?? undefined,
    q: activeSearch.value || undefined,
    page: currentPage.value,
    limit: 20,
  });
};

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(toolbarSearch, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    router.replace({
      query: {
        ...route.query,
        q: toolbarSearch.value.trim() || undefined,
        page: '1',
      },
    });
  }, 350);
});

watch(activeSearch, (value) => {
  if (value !== toolbarSearch.value) toolbarSearch.value = value;
});

watch([activeScope, activePrioritas, activeSearch, currentPage], () =>
  loadMyTasks()
);

onMounted(() => loadMyTasks());

// ─── Tanggal lokal (tenggat YYYY-MM-DD tidak boleh bergeser) ──────────────────

/**
 * Parse tenggat YYYY-MM-DD sebagai tanggal lokal murni (tanpa konversi UTC)
 * agar tidak bergeser satu hari pada timezone browser manapun.
 */
const formatTenggat = (tenggat: string | null): string => {
  if (!tenggat) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tenggat);
  if (!match) return '-';
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

// Hari ini dalam Asia/Jakarta (konsisten dengan batas scope backend).
const todayInJakarta = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts;
};

const isOverdue = (task: TugasMyTaskItem): boolean => {
  if (!task.tenggat || task.status === 'done') return false;
  return task.tenggat < todayInJakarta();
};

// ─── UI helpers ───────────────────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  todo: t('tugas_status_todo'),
  in_progress: t('tugas_status_in_progress'),
  done: t('tugas_status_done'),
};

const statusClasses: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  done: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const prioritasClasses: Record<string, string> = {
  tinggi: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  sedang: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  rendah: 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const openTask = (task: TugasMyTaskItem) => {
  router.push(`/tugas/${task.board.id}?task=${task.id}`);
};

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tugas'), to: '/tugas' },
  { label: t('tugas_saya'), to: '/tugas/saya' },
]);
</script>

<template>
  <div>
    <PageHeader :title="t('tugas_saya')" :items="breadcrumbs" />

    <div v-if="!canRead" class="py-20">
      <EmptyState :title="t('akses_ditolak')" :description="t('tugas_akses_ditolak_desc')" />
    </div>

    <template v-else>
      <!-- Toolbar (DataToolbar existing: refresh + search + dropdown filter) -->
      <div
        class="mb-5 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <DataToolbar
          v-model:search="toolbarSearch"
          :search-placeholder="t('tugas_cari_task')"
          :show-rows="false"
          :show-export="false"
          :refresh-label="t('muat_ulang')"
          @refresh="loadMyTasks"
        >
          <template #actions>
            <!-- Filter scope: Semua / Terlambat / Hari Ini / Mendatang / Selesai -->
            <USelectMenu
              v-model="selectedScope"
              :items="scopeOptions"
              value-key="value"
              label-key="label"
              :search-input="false"
              class="w-36 shrink-0"
              :ui="{
                base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
              }"
              aria-label="Filter Status Task"
            />

            <!-- Filter prioritas -->
            <USelectMenu
              v-model="selectedPrioritas"
              :items="prioritasOptions"
              value-key="value"
              label-key="label"
              :search-input="false"
              class="w-36 shrink-0"
              :ui="{
                base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
              }"
              aria-label="Filter Prioritas"
            />
          </template>
        </DataToolbar>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingMyTasks && myTasks.length === 0" class="space-y-2">
        <USkeleton v-for="n in 6" :key="n" class="h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>

      <!-- Error -->
      <div v-else-if="myTasksError" class="py-12">
        <EmptyState
          :title="t('gagal_memuat')"
          :description="myTasksError"
          action-label="Coba Lagi"
          action-color="primary"
          action-variant="solid"
          @action="loadMyTasks"
        />
      </div>

      <!-- Empty -->
      <div v-else-if="myTasks.length === 0" class="py-12">
        <EmptyState
          :icon="ListTodo"
          :title="t('tugas_saya_kosong')"
          :description="t('tugas_saya_kosong_desc')"
          icon-wrapper-class="bg-primary-50 dark:bg-primary-900/30"
          icon-class="text-primary-500"
        />
      </div>

      <!-- List task -->
      <template v-else>
        <div class="space-y-2">
          <button
            v-for="task in myTasks"
            :key="task.id"
            class="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-700"
            @click="openTask(task)"
          >
            <!-- Status dot berwarna board -->
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :style="{
                backgroundColor: `${task.board.warna}1A`,
                color: task.board.warna,
              }"
            >
              <component
                :is="task.status === 'done' ? CircleCheckBig : task.status === 'in_progress' ? RefreshCw : Inbox"
                :class="task.status === 'in_progress' ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
              />
            </span>

            <!-- Konten -->
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-medium text-gray-900 group-hover:text-primary dark:text-white"
                :title="task.judul"
              >
                {{ task.judul }}
              </p>
              <div
                class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400"
              >
                <span class="inline-flex items-center gap-1">
                  <span
                    class="inline-block h-2 w-2 rounded-full"
                    :style="{ backgroundColor: task.board.warna }"
                  />
                  {{ task.board.nama }}
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                  :class="statusClasses[task.status]"
                >
                  {{ statusLabels[task.status] }}
                </span>
                <span
                  v-if="task.prioritas"
                  class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                  :class="prioritasClasses[task.prioritas]"
                >
                  {{ t(`tugas_prioritas_${task.prioritas}`) }}
                </span>
              </div>
            </div>

            <!-- Tenggat -->
            <div
              v-if="task.tenggat"
              class="flex shrink-0 flex-col items-end gap-0.5"
            >
              <span
                class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500"
              >
                {{ t('tugas_tenggat') }}
              </span>
              <span
                class="inline-flex items-center gap-1 text-xs"
                :class="
                  isOverdue(task)
                    ? 'font-semibold text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                "
              >
                <CalendarClock class="h-3.5 w-3.5" />
                {{ formatTenggat(task.tenggat) }}
              </span>
            </div>
            <CircleCheckBig
              v-else-if="task.status === 'done'"
              class="h-5 w-5 shrink-0 text-green-500"
            />
          </button>
        </div>

        <!-- Pagination -->
        <div
          v-if="myTasksMeta && myTasksMeta.totalPages > 1"
          class="mt-6 -mx-4 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mx-0"
        >
          <DataPagination
            :current-page="myTasksMeta.page"
            :total-items="myTasksMeta.total"
            :per-page="myTasksMeta.limit"
            @update:current-page="setPage"
          />
        </div>
      </template>
    </template>
  </div>
</template>
