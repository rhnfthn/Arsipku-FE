<script setup lang="ts">
import { Users } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import EmptyState from '~/components/EmptyState.vue';
import ConfirmPopup from '~/components/ConfirmPopup.vue';
import TugasKanbanColumn from '~/components/tugas/TugasKanbanColumn.vue';
import TugasTaskCard from '~/components/tugas/TugasTaskCard.vue';
import TugasTaskDetailModal from '~/components/tugas/TugasTaskDetailModal.vue';
import TugasMemberModal from '~/components/tugas/TugasMemberModal.vue';
import { useTugas, mapTugasError } from '~/composables/useTugas';
import type {
  TugasBoardDetail,
  TugasActivityItem,
  TugasMember,
  TugasTask,
  TugasTaskPriority,
  TugasReferenceType,
  TugasTaskReference,
  TugasTaskStatus,
} from '~/types/tugas';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const { hasPermission } = useAuth();
const {
  boardDetails,
  isLoadingBoard,
  boardError,
  boardTasks,
  fetchBoardDetail,
  fetchTasks,
  createTask,
  updateTask,
  moveTask,
  archiveTask,
  unarchiveTask,
  deleteTask,
  addBoardMember,
  removeBoardMember,
  updateBoard,
  fetchTaskReferences,
  addTaskReference,
  removeTaskReference,
  fetchBoardActivity,
} = useTugas();

const boardId = computed(() => String(route.params.id));

// ─── Permission ───────────────────────────────────────────────────────────────

const canRead = computed(() => hasPermission('tugas', 'read'));
const canCreateTask = computed(() => hasPermission('tugas', 'create-task'));
const canUpdateTask = computed(() => hasPermission('tugas', 'update-task'));
const canMoveTask = computed(() => hasPermission('tugas', 'move-task'));
const canDeleteTask = computed(() => hasPermission('tugas', 'delete-task'));
const canManageMembers = computed(() => hasPermission('tugas', 'manage-members'));

// ─── Data ─────────────────────────────────────────────────────────────────────

const board = computed<TugasBoardDetail | null>(() => boardDetails.value[boardId.value] ?? null);
const tasks = computed<TugasTask[]>(() => boardTasks.value[boardId.value] ?? []);
const showArchived = ref(false);
const archivedTasks = computed(() => tasks.value.filter((task) => Boolean(task.archivedAt)));
const members = computed<TugasMember[]>(() => board.value?.members ?? []);
let refreshActivity = async () => undefined;

const loadBoard = async () => {
  try {
    await fetchBoardDetail(boardId.value);
    await fetchTasks(boardId.value, { limit: 100, includeArchived: showArchived.value });
    await refreshActivity();
  } catch {
    // boardError sudah di-set composable.
  }
};

onMounted(() => loadBoard());

watch(showArchived, () => loadBoard());

// ─── Realtime (Phase 6) ─────────────────────────────────────────────────────

const {
  subscribeTugasBoard,
  unsubscribeTugasBoard,
  tugasBoardUpdate,
  tugasTaskMoved,
  tugasTaskUpdate,
} = useRealtimeSocket();

// Subscribe room board saat halaman aktif; reference-count di composable
// mencegah unsubscribe terlalu dini saat mount ganda.
onMounted(() => subscribeTugasBoard(boardId.value));
onBeforeUnmount(() => unsubscribeTugasBoard(boardId.value));

// Revision server menjadi sumber kebenaran. Guard revision mencegah event
// duplikat board-updated/task-moved memicu dua refetch untuk perubahan sama.
let realtimeRevisionRequested = 0;
const refreshFromRealtime = (event: { boardId: string; revision: number } | null) => {
  if (!event || event.boardId !== boardId.value) return;
  if (event.revision <= boardRevision.value || event.revision <= realtimeRevisionRequested) return;
  realtimeRevisionRequested = event.revision;
  loadBoard();
};

watch(tugasBoardUpdate, refreshFromRealtime);
watch(tugasTaskMoved, refreshFromRealtime);
watch(tugasTaskUpdate, refreshFromRealtime);

// ─── Grouping per status ──────────────────────────────────────────────────────

const tasksByStatus = computed<Record<TugasTaskStatus, TugasTask[]>>(() => {
  const grouped: Record<TugasTaskStatus, TugasTask[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const task of tasks.value) {
    if (task.archivedAt) continue;
    grouped[task.status]?.push(task);
  }
  for (const status of Object.keys(grouped) as TugasTaskStatus[]) {
    grouped[status].sort((a, b) => a.urutan - b.urutan);
  }
  return grouped;
});

const todayJakarta = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

// ─── Optimistic move dengan expectedRevision ─────────────────────────────────

const movingTaskIds = ref(new Set<string>());
const boardRevision = ref(0);

watch(
  board,
  (value) => {
    if (value) boardRevision.value = value.revision;
  },
  { immediate: true }
);

const handleDrop = async (taskId: string, targetStatus: TugasTaskStatus, beforeTaskId?: string) => {
  const task = tasks.value.find((item) => item.id === taskId);
  if (!task || beforeTaskId === taskId) return;
  if (!canMoveTask.value) {
    toast.add({ title: t('tugas_akses_ditolak_desc'), color: 'error' });
    return;
  }
  if (movingTaskIds.value.has(taskId)) return; // cegah double-submit
  const sourceStatus = task.status;

  // Snapshot untuk rollback (error non-conflict).
  const affected = tasks.value
    .filter((item) => item.status === task.status || item.status === targetStatus)
    .map((item) => ({ id: item.id, status: item.status, urutan: item.urutan }));
  const targetList = tasksByStatus.value[targetStatus].filter((item) => item.id !== taskId);
  const targetIndex = beforeTaskId
    ? Math.max(
        0,
        targetList.findIndex((item) => item.id === beforeTaskId)
      )
    : targetList.length;

  // Optimistic: pindahkan lokal + set revision baru.
  movingTaskIds.value.add(taskId);
  task.status = targetStatus;
  targetList.splice(targetIndex, 0, task);
  targetList.forEach((item, index) => (item.urutan = index));
  if (sourceStatus !== targetStatus) {
    tasksByStatus.value[sourceStatus]
      .filter((item) => item.id !== taskId)
      .forEach((item, index) => (item.urutan = index));
  }
  const expectedRevision = boardRevision.value;

  try {
    const res = await moveTask(taskId, {
      status: targetStatus,
      urutan: targetIndex,
      expectedRevision,
    });
    const payload = (res as { data?: unknown }).data ?? res;
    const inner = payload as { data?: { revision?: number } };
    const revision = inner?.data?.revision ?? (payload as { revision?: number })?.revision;
    if (typeof revision === 'number') boardRevision.value = revision;
    toast.add({ title: t('tugas_task_berhasil_dipindahkan'), color: 'success' });
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 409) {
      // Konflik revision: JANGAN rollback — refetch agar state = server.
      toast.add({ title: mapTugasError(error), color: 'warning' });
      await loadBoard();
    } else {
      // Error non-conflict: rollback hanya jika belum ada perubahan lebih baru.
      for (const previous of affected) {
        const current = tasks.value.find((item) => item.id === previous.id);
        if (current) {
          current.status = previous.status;
          current.urutan = previous.urutan;
        }
      }
      toast.add({ title: mapTugasError(error), color: 'error' });
    }
  } finally {
    movingTaskIds.value.delete(taskId);
  }
};

// ─── Modal detail task ────────────────────────────────────────────────────────

const showTaskModal = ref(false);
const activeTask = ref<TugasTask | null>(null);
const isSavingTask = ref(false);
const isMovingStatus = ref(false);
const isAddingReference = ref(false);
const taskReferences = ref<TugasTaskReference[]>([]);
let referenceRequest = 0;

const openTask = async (task: TugasTask) => {
  const request = ++referenceRequest;
  activeTask.value = task;
  taskReferences.value = [];
  showTaskModal.value = true;
  try {
    const references = await fetchTaskReferences(task.id);
    if (request === referenceRequest && activeTask.value?.id === task.id) {
      taskReferences.value = references;
    }
  } catch {
    if (request === referenceRequest) {
      toast.add({ title: t('tugas_referensi_gagal_dimuat'), color: 'error' });
    }
  }
};

const handleRemoveReference = async (referenceId: string) => {
  if (!activeTask.value || isSavingTask.value) return;
  isSavingTask.value = true;
  try {
    await removeTaskReference(activeTask.value.id, referenceId);
    taskReferences.value = taskReferences.value.filter((item) => item.id !== referenceId);
    toast.add({ title: t('tugas_referensi_berhasil_dihapus'), color: 'success' });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSavingTask.value = false;
  }
};

const handleAddReference = async (referenceType: TugasReferenceType, referenceId: string) => {
  if (!activeTask.value || isAddingReference.value) return;
  isAddingReference.value = true;
  try {
    await addTaskReference(activeTask.value.id, referenceType, referenceId);
    taskReferences.value = await fetchTaskReferences(activeTask.value.id);
    toast.add({ title: t('tugas_referensi_berhasil_ditambahkan'), color: 'success' });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isAddingReference.value = false;
  }
};

// ─── Timeline aktivitas ──────────────────────────────────────────────────────

const activities = ref<TugasActivityItem[]>([]);
const activityPage = ref(1);
const activityLastPage = ref(1);
const isLoadingActivity = ref(false);

const loadActivity = async (reset = true) => {
  if (isLoadingActivity.value) return;
  isLoadingActivity.value = true;
  const page = reset ? 1 : activityPage.value + 1;
  try {
    const response = await fetchBoardActivity(boardId.value, page, 20);
    const payload = (response as { data?: unknown }).data ?? response;
    const result = payload as { data?: TugasActivityItem[]; meta?: { totalPages?: number } };
    const rows = Array.isArray(result.data) ? result.data : [];
    activities.value = reset ? rows : [...activities.value, ...rows];
    activityPage.value = page;
    activityLastPage.value = result.meta?.totalPages ?? page;
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isLoadingActivity.value = false;
  }
};

refreshActivity = () => loadActivity();

const activityLabel = (action: string) =>
  t(`tugas_aktivitas_${action}`, action.replaceAll('_', ' '));

const formatActivityDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));

// Deep link ?task=:taskId — buka modal hanya setelah task terverifikasi ada.
watch(
  () => [route.query.task, tasks.value.length] as const,
  ([taskId]) => {
    if (!taskId || showTaskModal.value) return;
    const task = tasks.value.find((item) => item.id === taskId);
    if (task) openTask(task);
  },
  { immediate: true }
);

const saveTask = async (payload: {
  judul: string;
  deskripsi: string;
  prioritas: TugasTaskPriority | null;
  tenggat: string | null;
  assigneeMemberId: string | null;
}) => {
  if (!activeTask.value) return;
  isSavingTask.value = true;
  try {
    await updateTask(activeTask.value.id, payload);
    toast.add({ title: t('tugas_task_berhasil_diubah'), color: 'success' });
    showTaskModal.value = false;
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSavingTask.value = false;
  }
};

const moveStatusFromModal = async (status: TugasTaskStatus) => {
  if (!activeTask.value) return;
  isMovingStatus.value = true;
  try {
    await handleDrop(activeTask.value.id, status);
    showTaskModal.value = false;
  } finally {
    isMovingStatus.value = false;
  }
};

const archiveTaskById = async (task: TugasTask) => {
  isSavingTask.value = true;
  try {
    await archiveTask(task.id);
    toast.add({ title: t('tugas_task_berhasil_diarsipkan'), color: 'success' });
    showTaskModal.value = false;
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSavingTask.value = false;
  }
};

// Arsip dari kartu Kanban (task dikirim komponen) — tidak bergantung modal.
const archiveFromCard = (task: TugasTask) => archiveTaskById(task);

// Arsip dari modal detail (pakai activeTask).
const archiveFromModal = () => {
  if (!activeTask.value) return;
  return archiveTaskById(activeTask.value);
};

const unarchiveTaskById = async (task: TugasTask) => {
  isSavingTask.value = true;
  try {
    await unarchiveTask(task.id);
    toast.add({ title: t('tugas_task_berhasil_dikembalikan'), color: 'success' });
    showTaskModal.value = false;
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSavingTask.value = false;
  }
};

const unarchiveFromModal = () => {
  if (!activeTask.value) return;
  return unarchiveTaskById(activeTask.value);
};

// ─── Modal hapus task ─────────────────────────────────────────────────────────

const showDeleteTaskModal = ref(false);
const isDeletingTask = ref(false);

const requestDeleteTask = () => {
  showDeleteTaskModal.value = true;
};

const confirmDeleteTask = async () => {
  if (!activeTask.value) return;
  isDeletingTask.value = true;
  try {
    await deleteTask(activeTask.value.id);
    toast.add({ title: t('tugas_task_berhasil_dihapus'), color: 'success' });
    showDeleteTaskModal.value = false;
    showTaskModal.value = false;
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isDeletingTask.value = false;
  }
};

// ─── Buat task cepat ──────────────────────────────────────────────────────────

const isCreatingTask = ref(false);
const isCreateModal = ref(false);

/**
 * Tombol "Tambah Task" hanya MEMBUKA modal form kosong (mode create).
 * Task baru dibuat server-side hanya saat user klik "Buat Task" di modal —
 * menutup modal tanpa simpan tidak meninggalkan task sampah.
 */
const handleCreateTask = () => {
  isCreateModal.value = true;
  showTaskModal.value = true;
};

/** Submit dari modal mode create → baru panggil API create. */
const createTaskFromModal = async (payload: {
  judul: string;
  deskripsi: string;
  prioritas: TugasTaskPriority | null;
  tenggat: string | null;
  assigneeMemberId: string | null;
}) => {
  isCreatingTask.value = true;
  try {
    const res = await createTask(boardId.value, {
      judul: payload.judul,
      deskripsi: payload.deskripsi || undefined,
      prioritas: payload.prioritas,
      tenggat: payload.tenggat,
      assigneeMemberId: payload.assigneeMemberId,
    });
    const response = (res as { data?: unknown }).data ?? res;
    const inner = response as { data?: TugasTask };
    const created = inner?.data;
    toast.add({ title: t('tugas_task_berhasil_dibuat'), color: 'success' });
    showTaskModal.value = false;
    isCreateModal.value = false;
    await loadBoard();
    if (created) openTask(created);
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isCreatingTask.value = false;
  }
};

// ─── Modal anggota ────────────────────────────────────────────────────────────

const showMemberModal = ref(false);
const isProcessingMember = ref(false);
const showRemoveMemberConfirm = ref(false);
const pendingMemberId = ref<string | null>(null);

const handleAddMember = async (positionId: string) => {
  isProcessingMember.value = true;
  try {
    await addBoardMember(boardId.value, positionId);
    toast.add({ title: t('tugas_anggota_berhasil_ditambahkan'), color: 'success' });
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isProcessingMember.value = false;
  }
};

const requestRemoveMember = (memberId: string) => {
  pendingMemberId.value = memberId;
  showRemoveMemberConfirm.value = true;
};

const confirmRemoveMember = async () => {
  if (!pendingMemberId.value) return;
  isProcessingMember.value = true;
  try {
    await removeBoardMember(boardId.value, pendingMemberId.value);
    toast.add({ title: t('tugas_anggota_berhasil_dihapus'), color: 'success' });
    showRemoveMemberConfirm.value = false;
    pendingMemberId.value = null;
    // Refresh member + task: beberapa task bisa menjadi unassigned.
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isProcessingMember.value = false;
  }
};

const changeToBersama = async () => {
  isProcessingMember.value = true;
  try {
    await updateBoard(boardId.value, { tipe: 'bersama' });
    toast.add({ title: t('tugas_papan_berhasil_diubah'), color: 'success' });
    await loadBoard();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isProcessingMember.value = false;
  }
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tugas'), to: '/tugas' },
  { label: board.value?.nama ?? '...', to: `/tugas/${boardId.value}` },
]);

const columnTitles: Record<TugasTaskStatus, string> = {
  todo: t('tugas_status_todo'),
  in_progress: t('tugas_status_in_progress'),
  done: t('tugas_status_done'),
};
</script>

<template>
  <div>
    <PageHeader
      :title="board?.nama ?? t('tugas')"
      :subtitle="board?.deskripsi ?? ''"
      :items="breadcrumbs"
      back-to="/tugas"
    />

    <div v-if="!canRead" class="py-20">
      <EmptyState :title="t('akses_ditolak')" :description="t('tugas_akses_ditolak_desc')" />
    </div>

    <!-- Loading -->
    <div v-else-if="isLoadingBoard && !board" class="grid gap-4 lg:grid-cols-3">
      <USkeleton v-for="n in 3" :key="n" class="h-72 rounded-2xl bg-gray-200 dark:bg-gray-800" />
    </div>

    <!-- Error / 404 -->
    <div v-else-if="boardError && !board" class="py-12">
      <EmptyState
        :title="t('gagal_memuat')"
        :description="boardError"
        action-label="Coba Lagi"
        action-color="primary"
        action-variant="solid"
        @action="loadBoard"
      />
    </div>

    <template v-else-if="board">
      <!-- Toolbar papan -->
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            :class="
              board.tipe === 'bersama'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            "
          >
            <Users v-if="board.tipe === 'bersama'" class="h-3.5 w-3.5" />
            {{ board.tipe === 'bersama' ? t('tugas_papan_bersama') : t('tugas_papan_personal') }}
          </span>
          <span v-if="board.tipe === 'bersama'" class="text-xs text-gray-500 dark:text-gray-400">
            {{ members.length }} {{ t('tugas_anggota') }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-archive"
            color="neutral"
            variant="outline"
            size="sm"
            @click="showArchived = !showArchived"
          >
            {{ showArchived ? t('tugas_sembunyikan_arsip') : t('tugas_tampilkan_arsip') }}
          </UButton>
          <UButton
            v-if="canManageMembers"
            icon="i-lucide-users"
            color="neutral"
            variant="outline"
            size="sm"
            @click="showMemberModal = true"
          >
            {{ t('tugas_kelola_anggota') }}
          </UButton>
          <UButton
            v-if="canCreateTask"
            icon="i-lucide-plus"
            size="sm"
            :loading="isCreatingTask"
            @click="handleCreateTask"
          >
            {{ t('tugas_tambah_task') }}
          </UButton>
        </div>
      </div>

      <!-- Kanban 3 kolom -->
      <div class="grid gap-4 lg:grid-cols-3">
        <TugasKanbanColumn
          v-for="(statusTasks, status) in tasksByStatus"
          :key="status"
          :status="status"
          :title="columnTitles[status]"
          :tasks="statusTasks"
          :can-create-task="canCreateTask"
          :is-moving-task="movingTaskIds.size > 0"
          @drop-task="handleDrop"
        >
          <TugasTaskCard
            v-for="task in statusTasks"
            :key="task.id"
            :task="task"
            :is-moving="movingTaskIds.has(task.id)"
            :can-archive="canUpdateTask"
            :today-jakarta="todayJakarta"
            @open="openTask"
            @archive="archiveFromCard"
            @drop-before="(taskId, beforeTaskId) => handleDrop(taskId, status, beforeTaskId)"
          />
        </TugasKanbanColumn>
      </div>

      <section
        v-if="showArchived"
        class="mt-6 rounded-2xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {{ t('tugas_task_diarsipkan') }} ({{ archivedTasks.length }})
        </h2>
        <div v-if="archivedTasks.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TugasTaskCard
            v-for="task in archivedTasks"
            :key="task.id"
            :task="task"
            :is-moving="false"
            :can-archive="false"
            :today-jakarta="todayJakarta"
            @open="openTask"
          />
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('tugas_arsip_kosong') }}
        </p>
      </section>

      <section class="mt-6 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
        <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {{ t('tugas_timeline_aktivitas') }}
        </h2>
        <div v-if="activities.length" class="space-y-3">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="border-l-2 border-primary-200 pl-3 dark:border-primary-800"
          >
            <p class="text-sm font-medium capitalize text-gray-800 dark:text-gray-100">
              {{ activityLabel(activity.aksi) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatActivityDate(activity.createdAt) }}
            </p>
          </div>
        </div>
        <p v-else-if="!isLoadingActivity" class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('tugas_aktivitas_kosong') }}
        </p>
        <UButton
          v-if="activityPage < activityLastPage"
          class="mt-3"
          size="xs"
          color="neutral"
          variant="outline"
          :loading="isLoadingActivity"
          @click="loadActivity(false)"
        >
          {{ t('tugas_muat_aktivitas_lagi') }}
        </UButton>
      </section>
    </template>

    <!-- Modal detail task -->
    <TugasTaskDetailModal
      v-model="showTaskModal"
      :task="activeTask"
      :members="members"
      :saving="isSavingTask || isCreatingTask"
      :moving="isMovingStatus"
      :can-update-task="canUpdateTask"
      :can-delete-task="canDeleteTask"
      :references="taskReferences"
      :adding-reference="isAddingReference"
      :mode="isCreateModal ? 'create' : 'edit'"
      @save="saveTask"
      @create="createTaskFromModal"
      @move="moveStatusFromModal"
      @archive="archiveFromModal"
      @unarchive="unarchiveFromModal"
      @delete="requestDeleteTask"
      @remove-reference="handleRemoveReference"
      @add-reference="handleAddReference"
    />

    <!-- Modal konfirmasi hapus task -->
    <ConfirmPopup
      v-model="showDeleteTaskModal"
      type="danger"
      :title="t('tugas_hapus_task')"
      :message="t('tugas_hapus_task_konfirmasi')"
      confirm-text="HAPUS"
      :is-loading="isDeletingTask"
      @confirm="confirmDeleteTask"
    />

    <ConfirmPopup
      v-model="showRemoveMemberConfirm"
      type="danger"
      :title="t('tugas_hapus_anggota')"
      :message="t('tugas_hapus_anggota_konfirmasi')"
      confirm-text="HAPUS"
      :is-loading="isProcessingMember"
      @confirm="confirmRemoveMember"
    />

    <!-- Modal kelola anggota -->
    <TugasMemberModal
      v-model="showMemberModal"
      :board-id="boardId"
      :members="members"
      :is-bersama="board?.tipe === 'bersama'"
      :loading="isProcessingMember"
      @add-member="handleAddMember"
      @remove-member="requestRemoveMember"
      @change-type="changeToBersama"
    />
  </div>
</template>
