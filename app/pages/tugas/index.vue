<script setup lang="ts">
import { KanbanSquare } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import EmptyState from '~/components/EmptyState.vue';
import ConfirmModal from '~/components/ConfirmModal.vue';
import DataPagination from '~/components/DataPagination.vue';
import DataToolbar from '~/components/DataToolbar.vue';
import TugasBoardCard from '~/components/tugas/TugasBoardCard.vue';
import TugasBoardFormModal from '~/components/tugas/TugasBoardFormModal.vue';
import { useTugas, mapTugasError } from '~/composables/useTugas';
import type { TugasBoardFilter, TugasBoardSummary } from '~/types/tugas';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { hasPermission } = useAuth();
const {
  boards,
  boardsMeta,
  isLoadingBoards,
  boardsError,
  fetchBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
} = useTugas();

// ─── Permission ──────────────────────────────────────────────────────────────

const canRead = computed(() => hasPermission('tugas', 'read-board'));
const canCreateBoard = computed(() => true);
const canUpdateBoard = computed(() => hasPermission('tugas', 'update-board'));
const canDeleteBoard = computed(() => hasPermission('tugas', 'delete-board'));

const { user } = useAuth();

/**
 * Kepemilikan papan: hanya pembuat (owner) yang boleh mengubah/menghapus
 * papan — backend memvalidasi via assertBoardOwner, jadi tombol edit/hapus
 * di kartu disembunyikan untuk anggota biasa papan milik orang lain.
 */
const isBoardOwner = (board: TugasBoardSummary): boolean => {
  const myPersnum = Number(user.value?.persnum ?? 0);
  return Boolean(myPersnum) && board.owner?.persnum === myPersnum;
};

// ─── Filter (URL query sinkron agar back/forward bekerja) ─────────────────────

const activeFilter = computed<TugasBoardFilter>(() => {
  const raw = String(route.query.filter ?? 'semua');
  return ['semua', 'saya-buat', 'saya-ikut'].includes(raw) ? (raw as TugasBoardFilter) : 'semua';
});
const activeSearch = computed(() => String(route.query.q ?? ''));
const currentPage = computed(() => Number(route.query.page ?? 1) || 1);

// Toolbar state — sinkron dengan URL query agar back/forward bekerja.
const toolbarSearch = ref(activeSearch.value);

// Search dari DataToolbar → debounce → URL query (reset ke halaman 1).
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

// Sinkron balik saat URL berubah (back/forward, deep-link).
watch(activeSearch, (value) => {
  if (value !== toolbarSearch.value) toolbarSearch.value = value;
});

// ─── Limit responsif (grid selalu terlihat penuh) ──────────────────────────
// Jumlah papan per halaman otomatis mengikuti breakpoint grid Tailwind
// (sm:2 / lg:3 / xl:4 kolom) — selalu kelipatan jumlah kolom agar
// baris terakhir tidak menyisakan kartu menggantung.
const viewportWidth = ref(0);
const responsiveLimit = computed(() => {
  if (viewportWidth.value >= 1280) return 12; // xl — 4 kolom × 3 baris
  if (viewportWidth.value >= 1024) return 9; // lg — 3 kolom × 3 baris
  return 8; // sm — 2 kolom × 4 baris; mobile — 1 kolom × 8 baris
});

const onViewportResize = () => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  viewportWidth.value = window.innerWidth;
  window.addEventListener('resize', onViewportResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportResize);
});

const filterOptions = computed(() => [
  { label: t('tugas_filter_semua'), value: 'semua' as const, icon: 'i-lucide-layout-grid' },
  { label: t('tugas_filter_saya_buat'), value: 'saya-buat' as const, icon: 'i-lucide-user-round' },
  { label: t('tugas_filter_saya_ikut'), value: 'saya-ikut' as const, icon: 'i-lucide-users-round' },
]);

const setFilter = (filter: TugasBoardFilter) => {
  if (filter === activeFilter.value) return;
  router.replace({ query: { ...route.query, filter, page: '1' } });
};

const selectedFilter = computed<TugasBoardFilter>({
  get: () => activeFilter.value,
  set: setFilter,
});

const setPage = (page: number) => {
  router.replace({ query: { ...route.query, page: String(page) } });
};

// ─── Data loading ─────────────────────────────────────────────────────────────

const loadBoards = async () => {
  await fetchBoards({
    filter: activeFilter.value,
    q: activeSearch.value || undefined,
    page: currentPage.value,
    limit: responsiveLimit.value,
  });
  // Clamp: setelah limit berubah (resize), halaman aktif bisa melebihi
  // totalPages — pindahkan ke halaman terakhir yang valid.
  const meta = boardsMeta.value;
  if (
    boards.value.length === 0 &&
    meta &&
    meta.totalPages > 0 &&
    currentPage.value > meta.totalPages
  ) {
    setPage(meta.totalPages);
  }
};

watch([activeFilter, activeSearch, currentPage], () => loadBoards());

// Limit berubah saat viewport menyeberang breakpoint → muat ulang.
watch(responsiveLimit, () => loadBoards());

onMounted(() => loadBoards());

// ─── Modal create/edit ────────────────────────────────────────────────────────

const showFormModal = ref(false);
const editingBoard = ref<TugasBoardSummary | null>(null);
const isSaving = ref(false);

const openCreate = () => {
  editingBoard.value = null;
  showFormModal.value = true;
};

const openEdit = (board: TugasBoardSummary) => {
  editingBoard.value = board;
  showFormModal.value = true;
};

const handleSave = async (payload: {
  nama: string;
  deskripsi: string;
  tipe: TugasBoardFilter extends never ? never : TugasBoardSummary['tipe'];
  icon?: string;
  warna: string;
  memberPositionIds?: string[];
}) => {
  isSaving.value = true;
  try {
    if (editingBoard.value) {
      await updateBoard(editingBoard.value.id, {
        nama: payload.nama,
        deskripsi: payload.deskripsi || undefined,
        tipe: payload.tipe,
        icon: payload.icon,
        warna: payload.warna,
      });
      toast.add({ title: t('tugas_papan_berhasil_diubah'), color: 'success' });
    } else {
      const res = await createBoard({
        nama: payload.nama,
        deskripsi: payload.deskripsi || undefined,
        tipe: payload.tipe,
        icon: payload.icon,
        warna: payload.warna,
      });
      toast.add({ title: t('tugas_papan_berhasil_dibuat'), color: 'success' });

      // Papan bersama: tambahkan anggota terpilih setelah board dibuat.
      // Kegagalan satu anggota tidak membatalkan papan — laporkan via toast.
      const response = (res as { data?: unknown }).data ?? res;
      const inner = response as { data?: { id?: string } };
      const boardId = inner?.data?.id;
      if (boardId && payload.memberPositionIds?.length) {
        const failed: string[] = [];
        for (const positionId of payload.memberPositionIds) {
          try {
            await addBoardMember(boardId, positionId);
          } catch {
            failed.push(positionId);
          }
        }
        if (failed.length) {
          toast.add({
            title: t('tugas_anggota_gagal_ditambahkan', {
              n: failed.length,
            }),
            color: 'warning',
          });
        } else {
          toast.add({
            title: t('tugas_anggota_berhasil_ditambahkan'),
            color: 'success',
          });
        }
      }
    }
    showFormModal.value = false;
    await loadBoards();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSaving.value = false;
  }
};

// ─── Modal delete ─────────────────────────────────────────────────────────────

const showDeleteModal = ref(false);
const boardToDelete = ref<TugasBoardSummary | null>(null);
const isDeleting = ref(false);

const openDelete = (board: TugasBoardSummary) => {
  boardToDelete.value = board;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!boardToDelete.value) return;
  isDeleting.value = true;
  try {
    await deleteBoard(boardToDelete.value.id);
    toast.add({ title: t('tugas_papan_berhasil_dihapus'), color: 'success' });
    showDeleteModal.value = false;
    boardToDelete.value = null;
    await loadBoards();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isDeleting.value = false;
  }
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tugas'), to: '/tugas' },
]);
</script>

<template>
  <div>
    <PageHeader :title="t('tugas')" :items="breadcrumbs" />

    <!-- Akses ditolak -->
    <div v-if="!canRead" class="py-20">
      <EmptyState :title="t('akses_ditolak')" :description="t('tugas_akses_ditolak_desc')" />
    </div>

    <template v-else>
      <!-- Toolbar (DataToolbar existing: refresh + search + filter papan) -->
      <div
        class="mb-5 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <DataToolbar
          v-model:search="toolbarSearch"
          :search-placeholder="t('tugas_cari_papan')"
          :show-rows="false"
          :show-export="false"
          :refresh-label="t('muat_ulang')"
          @refresh="loadBoards"
        >
          <template #actions>
            <USelectMenu
              v-model="selectedFilter"
              :items="filterOptions"
              value-key="value"
              label-key="label"
              :search-input="false"
              class="w-44 shrink-0"
              :ui="{
                base: 'h-8 w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
              }"
              :aria-label="t('tugas_filter_semua')"
            />

            <UButton
              v-if="canCreateBoard && boards.length > 0"
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              @click="openCreate"
            >
              {{ t('tugas_buat_papan') }}
            </UButton>
          </template>
        </DataToolbar>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoadingBoards && boards.length === 0"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton v-for="n in 8" :key="n" class="h-44 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>

      <!-- Error + retry -->
      <div v-else-if="boardsError" class="py-12">
        <EmptyState
          :title="t('gagal_memuat')"
          :description="boardsError"
          action-label="Coba Lagi"
          action-color="primary"
          action-variant="solid"
          @action="loadBoards"
        />
      </div>

      <!-- Empty state -->
      <div v-else-if="boards.length === 0" class="py-12">
        <EmptyState
          :icon="KanbanSquare"
          :title="t('tugas_kosong')"
          :description="t('tugas_kosong_desc')"
          icon-wrapper-class="bg-primary-50 dark:bg-primary-900/30"
          icon-class="text-primary-500"
        />
      </div>

      <!-- Grid papan -->
      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TugasBoardCard
            v-for="board in boards"
            :key="board.id"
            :board="board"
            :can-manage="
              (canUpdateBoard || canDeleteBoard) && isBoardOwner(board)
            "
            @edit="openEdit"
            @delete="openDelete"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="boardsMeta && boardsMeta.totalPages > 1"
          class="mt-6 -mx-4 rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mx-0"
        >
          <DataPagination
            :current-page="boardsMeta.page"
            :total-items="boardsMeta.total"
            :per-page="boardsMeta.limit"
            @update:current-page="setPage"
          />
        </div>
      </template>
    </template>

    <!-- Modal create/edit papan -->
    <TugasBoardFormModal
      v-model="showFormModal"
      :board="editingBoard"
      :saving="isSaving"
      @save="handleSave"
    />

    <!-- Modal konfirmasi hapus -->
    <ConfirmModal
      v-model="showDeleteModal"
      variant="danger"
      :title="t('tugas_hapus_papan')"
      :description="t('tugas_hapus_papan_konfirmasi', { nama: boardToDelete?.nama ?? '' })"
      confirm-text="Hapus"
      cancel-text="Batal"
      :loading="isDeleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
