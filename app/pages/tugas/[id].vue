<script setup lang="ts">
import PageHeader from '~/components/PageHeader.vue';
import EmptyState from '~/components/EmptyState.vue';
import ConfirmModal from '~/components/ConfirmModal.vue';
import TugasKanbanColumn from '~/components/tugas/TugasKanbanColumn.vue';
import TugasTaskCard from '~/components/tugas/TugasTaskCard.vue';
import TugasTaskDetailModal from '~/components/tugas/TugasTaskDetailModal.vue';
import TugasMemberModal from '~/components/tugas/TugasMemberModal.vue';
import TugasTaskForum from '~/components/tugas/TugasTaskForum.vue';
import { resolveTugasBoardIcon } from '~/utils/tugas-board-icon';
import { useTugas, mapTugasError } from '~/composables/useTugas';
import type {
  TugasBoardDetail,
  TugasActivityItem,
  TugasMember,
  TugasTask,
  TugasTaskComment,
  TugasCommentReaction,
  TugasTaskPriority,
  TugasReferenceType,
  TugasTaskReference,
  TugasTaskEvidence,
  TugasTaskStatus,
} from '~/types/tugas';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { hasPermission, user } = useAuth();
const { notifications: globalNotifications, markAsRead: markNotificationAsRead } =
  useNotifications();
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
  fetchTaskEvidences,
  addTaskEvidence,
  removeTaskEvidence,
  fetchBoardActivity,
  fetchBoardComments,
  fetchCommentReactions,
  setCommentReaction,
  addBoardComment,
  removeBoardComment,
} = useTugas();

const boardId = computed(() => String(route.params.id));
type BoardDetailTab = 'board' | 'overview' | 'anggota' | 'forum';
const boardTabs: BoardDetailTab[] = ['board', 'overview', 'anggota', 'forum'];
const activeTab = computed<BoardDetailTab>(() => {
  const tab = String(route.query.tab ?? 'board') as BoardDetailTab;
  return boardTabs.includes(tab) ? tab : 'board';
});

const setActiveTab = (tab: BoardDetailTab) => {
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'board' ? undefined : tab,
      task: undefined,
    },
  });
};

const handleTabChange = (value: string | number) => {
  const tab = String(value) as BoardDetailTab;
  if (boardTabs.includes(tab)) setActiveTab(tab);
};

// ─── Permission ───────────────────────────────────────────────────────────────

const canRead = computed(() => hasPermission('tugas', 'read-board'));
const canCreateTask = computed(() => hasPermission('tugas', 'create-task'));
const canUpdateTask = computed(() => hasPermission('tugas', 'update-task'));
const canMoveTask = computed(() => hasPermission('tugas', 'move-task'));
const canDeleteTask = computed(() => hasPermission('tugas', 'delete-task'));
const canManageMembers = computed(() => hasPermission('tugas', 'manage-members'));

// ─── Data ─────────────────────────────────────────────────────────────────────

const board = computed<TugasBoardDetail | null>(() => boardDetails.value[boardId.value] ?? null);
const boardIcon = computed(() => resolveTugasBoardIcon(board.value?.icon));
const tasks = computed<TugasTask[]>(() => boardTasks.value[boardId.value] ?? []);
const showArchived = ref(false);
const archivedTasks = computed(() => tasks.value.filter((task) => Boolean(task.archivedAt)));
const members = computed<TugasMember[]>(() => board.value?.members ?? []);
const ownerMember = computed(() => members.value.find((member) => member.role === 'owner') ?? null);
const completionPercent = computed(() => {
  const counts = board.value?.counts;
  if (!counts?.total) return 0;
  return Math.round((counts.done / counts.total) * 100);
});
const activeTaskCount = computed(
  () => (board.value?.counts.todo ?? 0) + (board.value?.counts.inProgress ?? 0)
);
const userPositionId = computed(() =>
  String(user.value?.position ?? user.value?.position_id ?? '')
);
const userPersnum = computed(() => Number(user.value?.persnum ?? 0));

/** Member saya di papan ini — null bila data belum termuat. */
const myMember = computed<TugasMember | null>(
  () => members.value.find((member) => member.positionId === userPositionId.value) ?? null
);

/**
 * Kepemilikan papan: hanya owner yang boleh mengubah papan dan mengelola
 * anggota — backend memvalidasi via assertBoardOwner, jadi tombol aksi
 * disembunyikan untuk anggota biasa papan milik orang lain.
 */
const isBoardOwner = computed(() => myMember.value?.role === 'owner');

/** Pembuat tetap menjadi pemilik task, termasuk hak hapus. */
const isTaskCreator = (task: TugasTask | null): boolean => {
  if (!task || !myMember.value) return false;
  if (task.createdByMemberId) return task.createdByMemberId === myMember.value.id;
  return Boolean(userPersnum.value) && task.createdByPersnum === userPersnum.value;
};

/** PIC aktif boleh mengubah detail dan progres, tetapi bukan menghapus task. */
const isTaskAssignee = (task: TugasTask | null): boolean =>
  Boolean(task?.assignee?.id && task.assignee.id === myMember.value?.id);
const canEditTask = (task: TugasTask | null): boolean =>
  isTaskCreator(task) || isTaskAssignee(task);
const isTaskReadOnly = (task: TugasTask | null): boolean => Boolean(task) && !canEditTask(task);
let refreshActivity: () => Promise<void> = async () => undefined;

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
  tugasCommentAdded,
  tugasCommentReactionChanged,
  tugasCommentDeleted,
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
  if (!canEditTask(task)) {
    toast.add({ title: t('tugas_task_readonly_desc'), color: 'warning' });
    return;
  }
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
const isAddingReference = ref(false);
const taskReferences = ref<TugasTaskReference[]>([]);
const taskEvidences = ref<TugasTaskEvidence[]>([]);
const isUploadingEvidence = ref(false);
const removingEvidenceIds = ref(new Set<string>());
let referenceRequest = 0;

// Jangan biarkan deep-link task tersisa setelah modal ditutup karena dapat
// membukanya kembali saat query tab berubah.
watch(showTaskModal, (open) => {
  if (open || !route.query.task) return;
  router.replace({
    query: {
      ...route.query,
      task: undefined,
    },
  });
});

const openTask = async (task: TugasTask) => {
  const request = ++referenceRequest;
  // Pastikan modal selalu mode edit saat membuka task yang sudah ada,
  // meski sebelumnya user membuka lalu membatalkan modal create.
  isCreateModal.value = false;
  activeTask.value = task;
  taskReferences.value = [];
  taskEvidences.value = [];
  showTaskModal.value = true;
  const [references, evidences] = await Promise.allSettled([
    fetchTaskReferences(task.id),
    fetchTaskEvidences(task.id),
  ]);
  if (request === referenceRequest && activeTask.value?.id === task.id) {
    if (references.status === 'fulfilled') {
      taskReferences.value = references.value;
    } else {
      toast.add({ title: t('tugas_referensi_gagal_dimuat'), color: 'error' });
    }
    if (evidences.status === 'fulfilled') {
      taskEvidences.value = evidences.value;
    } else {
      toast.add({ title: t('tugas_evidence_gagal_dimuat'), color: 'error' });
    }
  }
};

const handleRemoveReference = async (referenceId: string) => {
  if (
    !activeTask.value ||
    !canUpdateTask.value ||
    !canEditTask(activeTask.value) ||
    isSavingTask.value
  )
    return;
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

const handleAddReference = async (
  referenceType: TugasReferenceType,
  referenceNumber: string,
  onAdded?: () => void
) => {
  if (
    !activeTask.value ||
    !canUpdateTask.value ||
    !canEditTask(activeTask.value) ||
    isAddingReference.value
  )
    return;
  const taskId = activeTask.value.id;
  isAddingReference.value = true;
  try {
    await addTaskReference(taskId, referenceType, referenceNumber);
    const references = await fetchTaskReferences(taskId);
    if (activeTask.value?.id === taskId) {
      taskReferences.value = references;
      onAdded?.();
    }
    toast.add({ title: t('tugas_referensi_berhasil_ditambahkan'), color: 'success' });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isAddingReference.value = false;
  }
};

const handleAddEvidence = async (file: File, onSettled?: () => void) => {
  if (
    !activeTask.value ||
    !canUpdateTask.value ||
    !canEditTask(activeTask.value) ||
    isUploadingEvidence.value
  ) {
    onSettled?.();
    return;
  }
  isUploadingEvidence.value = true;
  try {
    await addTaskEvidence(activeTask.value.id, file);
    taskEvidences.value = await fetchTaskEvidences(activeTask.value.id);
    toast.add({ title: t('tugas_evidence_berhasil_ditambahkan'), color: 'success' });
    await refreshActivity();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isUploadingEvidence.value = false;
    onSettled?.();
  }
};

const handleRemoveEvidence = async (evidenceId: string) => {
  if (
    !activeTask.value ||
    !canUpdateTask.value ||
    !canEditTask(activeTask.value) ||
    removingEvidenceIds.value.has(evidenceId)
  )
    return;
  removingEvidenceIds.value.add(evidenceId);
  try {
    await removeTaskEvidence(activeTask.value.id, evidenceId);
    taskEvidences.value = taskEvidences.value.filter((item) => item.id !== evidenceId);
    toast.add({ title: t('tugas_evidence_berhasil_dihapus'), color: 'success' });
    await refreshActivity();
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    removingEvidenceIds.value.delete(evidenceId);
  }
};

const handleInvalidEvidence = () => {
  toast.add({ title: t('tugas_evidence_tidak_valid'), color: 'warning' });
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

const activitySubject = (activity: TugasActivityItem): string => {
  const detail = activity.detail;
  if (!detail) return '';
  const value = detail.judul ?? detail.nama ?? detail.originalName ?? detail.label;
  return typeof value === 'string' ? value.trim() : '';
};

const activityActorName = (activity: TugasActivityItem): string =>
  activity.actor?.nama || `Pengguna ${activity.actorPersnum}`;

const formatActivityDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));

const formatBoardDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));

const memberInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''}`.toUpperCase();
};

// ─── Forum diskusi papan ──────────────────────────────────────────────────────

/**
 * Forum diskusi umum papan: satu channel untuk seluruh anggota.
 * Komentar dapat men-tag task tertentu sebagai rujukan diskusi.
 * Realtime: event socket comment-added/deleted memicu refresh komentar
 * (tanpa refetch penuh board).
 */
const forumComments = ref<TugasTaskComment[]>([]);
const forumPage = ref(1);
const forumLastPage = ref(1);
const isLoadingForum = ref(false);
const isLoadingMoreForum = ref(false);
const isSendingComment = ref(false);
const removingCommentIds = ref(new Set<string>());
let forumRequestId = 0;
let forumLoadedOnce = false;

/**
 * Gabungkan komentar berdasarkan ID. Event socket dapat tiba sebelum response
 * POST komentar sendiri, dan pagination dapat bergeser saat ada pesan baru.
 * Keduanya tidak boleh menghasilkan kartu chat ganda.
 */
const mergeForumComments = (items: TugasTaskComment[]) => {
  const unique = new Map<string, TugasTaskComment>();
  for (const item of items) unique.set(item.id, item);
  return [...unique.values()].sort((a, b) => {
    const dateDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return dateDiff || a.id.localeCompare(b.id);
  });
};

const unreadForumMentions = computed(() =>
  globalNotifications.value.filter((notification) => {
    const data = notification.data ?? {};
    const relatedBoardId = data.boardId ?? data.board_id;
    return (
      !notification.isRead &&
      notification.type === 'TUGAS_TAGGED' &&
      String(relatedBoardId ?? '') === boardId.value
    );
  })
);

const markCurrentBoardForumMentionsAsRead = async () => {
  if (!unreadForumMentions.value.length) return;
  await Promise.allSettled(
    unreadForumMentions.value.map((notification) => markNotificationAsRead(notification.id))
  );
};

const loadForumComments = async (reset = true) => {
  const requestId = ++forumRequestId;
  if (reset) isLoadingForum.value = true;
  else isLoadingMoreForum.value = true;
  const page = reset ? 1 : forumPage.value + 1;
  try {
    const result = await fetchBoardComments(boardId.value, page, 50);
    if (requestId !== forumRequestId) return;
    // API mengembalikan terbaru duluan; urutkan ascending agar chat
    // mengalir dari atas (terlama) ke bawah (terbaru).
    const rows = [...result.data].reverse();
    forumComments.value = mergeForumComments(reset ? rows : [...rows, ...forumComments.value]);
    forumPage.value = page;
    forumLastPage.value = result.meta.totalPages ?? page;
  } catch (error) {
    if (requestId === forumRequestId) {
      toast.add({ title: t('tugas_forum_gagal_dimuat'), color: 'error' });
    }
  } finally {
    if (requestId === forumRequestId) {
      isLoadingForum.value = false;
      isLoadingMoreForum.value = false;
    }
  }
};

const handleSendComment = async (isi: string, taskId: string | null) => {
  if (isSendingComment.value) return;
  isSendingComment.value = true;
  try {
    const res = await addBoardComment(boardId.value, isi, taskId);
    const payload = (res as { data?: unknown }).data ?? res;
    const inner = payload as { data?: TugasTaskComment };
    const comment = inner?.data;
    if (comment) {
      forumComments.value = mergeForumComments([...forumComments.value, comment]);
    }
    toast.add({ title: t('tugas_forum_berhasil_dikirim'), color: 'success' });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSendingComment.value = false;
  }
};

const handleRemoveComment = async (commentId: string, scope: 'me' | 'everyone' = 'me') => {
  if (removingCommentIds.value.has(commentId)) return;
  removingCommentIds.value.add(commentId);
  try {
    await removeBoardComment(boardId.value, commentId, scope);
    if (scope === 'everyone') {
      // Backend mempertahankan row sebagai tombstone; muat ulang agar pesan
      // langsung berubah menjadi "pesan telah dihapus" untuk pengirim.
      await loadForumComments();
    } else {
      forumComments.value = forumComments.value.filter((item) => item.id !== commentId);
    }
    toast.add({
      title:
        scope === 'everyone'
          ? t('tugas_forum_berhasil_dihapus_semua')
          : t('tugas_forum_berhasil_dihapus'),
      color: 'success',
    });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    removingCommentIds.value.delete(commentId);
  }
};

const reactingCommentIds = ref(new Set<string>());
const reactionRequestVersions = new Map<string, number>();

const updateCommentReactions = async (commentId: string, emoji?: string, active?: boolean) => {
  const version = (reactionRequestVersions.get(commentId) ?? 0) + 1;
  reactionRequestVersions.set(commentId, version);
  const response = emoji
    ? await setCommentReaction(boardId.value, commentId, emoji, !!active)
    : await fetchCommentReactions(boardId.value, commentId);
  if (reactionRequestVersions.get(commentId) !== version) return;
  const payload = ((response as { data?: unknown }).data ?? response) as { data?: TugasCommentReaction[] };
  const comment = forumComments.value.find((item) => item.id === commentId);
  if (comment && Array.isArray(payload?.data)) comment.reactions = payload.data;
};

const handleReactComment = async (commentId: string, emoji: string, active: boolean) => {
  if (reactingCommentIds.value.has(commentId)) return;
  reactingCommentIds.value.add(commentId);
  try {
    await updateCommentReactions(commentId, emoji, active);
  } catch {
    toast.add({ title: t('tugas_forum_reaksi_gagal'), color: 'error' });
  } finally {
    reactingCommentIds.value.delete(commentId);
  }
};

watch(tugasCommentReactionChanged, (event) => {
  if (!event || event.boardId !== boardId.value || !forumComments.value.some((item) => item.id === event.commentId)) return;
  void updateCommentReactions(event.commentId).catch(() => undefined);
});

const handleLoadMoreComments = () => loadForumComments(false);

// Muat komentar saat tab forum dibuka pertama kali.
watch(
  activeTab,
  (tab) => {
    if (tab !== 'forum') return;
    if (!forumLoadedOnce) {
      forumLoadedOnce = true;
      loadForumComments();
    }
    void markCurrentBoardForumMentionsAsRead();
  },
  { immediate: true }
);

// Notifikasi dapat tiba setelah tab forum sudah terbuka. Tandai langsung
// sebagai dibaca karena pengguna sedang melihat diskusi papan tersebut.
watch(
  () => unreadForumMentions.value.map((notification) => notification.id).join(','),
  () => {
    if (activeTab.value === 'forum') void markCurrentBoardForumMentionsAsRead();
  }
);

// Realtime: komentar baru/dihapus anggota lain → refresh forum papan.
watch(tugasCommentAdded, (event) => {
  if (!event || event.boardId !== boardId.value) return;
  // Komentar sendiri sudah di-append optimistik — hindari duplikat.
  if (forumComments.value.some((item) => item.id === event.commentId)) return;
  loadForumComments();
});

watch(tugasCommentDeleted, (event) => {
  if (!event || event.boardId !== boardId.value) return;
  // Hapus untuk semua orang mempertahankan row sebagai tombstone.
  loadForumComments();
});

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
  if (!activeTask.value || !canUpdateTask.value || !canEditTask(activeTask.value)) return;
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

const archiveTaskById = async (task: TugasTask) => {
  if (!canUpdateTask.value || !canEditTask(task)) return;
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
  if (!canUpdateTask.value || !canEditTask(task)) return;
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
  if (!canDeleteTask.value || !isTaskCreator(activeTask.value)) return;
  showDeleteTaskModal.value = true;
};

const confirmDeleteTask = async () => {
  if (!activeTask.value || !canDeleteTask.value || !isTaskCreator(activeTask.value)) return;
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
  // Bersihkan state task aktif agar modal create benar-benar kosong
  // (tanpa referensi/detail task yang sebelumnya dilihat).
  activeTask.value = null;
  taskReferences.value = [];
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

const detailTabs = computed(() => [
  { value: 'board' as const, label: t('tugas_tab_board'), icon: 'i-lucide-kanban-square' },
  {
    value: 'overview' as const,
    label: t('tugas_tab_overview'),
    icon: 'i-lucide-chart-no-axes-combined',
  },
  {
    value: 'anggota' as const,
    label: t('tugas_tab_anggota'),
    icon: 'i-lucide-users',
    badge: members.value.length,
  },
  {
    value: 'forum' as const,
    label: t('tugas_forum'),
    icon: 'i-lucide-message-square',
    badge: unreadForumMentions.value.length || undefined,
  },
]);
</script>

<template>
  <div>
    <PageHeader :title="t('tugas_detail_papan')" :items="breadcrumbs" back-to="/tugas" />

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
      <div class="flex flex-col gap-5">
        <!-- Ringkasan proyek selalu terlihat di semua tab. -->
        <section
          class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <span class="absolute inset-y-0 left-0 w-1" :style="{ backgroundColor: board.warna }" />
          <div class="flex flex-wrap items-start justify-between gap-5">
            <div class="flex min-w-0 items-start gap-4">
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                :style="{ backgroundColor: `${board.warna}1A`, color: board.warna }"
              >
                <component :is="boardIcon" class="h-7 w-7" />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <Heading
                    variant="heading8b"
                    as="h2"
                    class="truncate text-gray-900 dark:text-white"
                  >
                    {{ board.nama }}
                  </Heading>
                  <UBadge
                    :color="board.tipe === 'bersama' ? 'primary' : 'neutral'"
                    variant="subtle"
                    size="sm"
                  >
                    {{
                      board.tipe === 'bersama'
                        ? t('tugas_papan_bersama')
                        : t('tugas_papan_personal')
                    }}
                  </UBadge>
                </div>
                <div
                  class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  <span v-if="board.owner" class="inline-flex min-w-0 items-center gap-1.5">
                    <ProfileAvatar
                      size="2xs"
                      :persnum="board.owner.persnum"
                      :alt="board.owner.nama"
                      avatar-class="shrink-0 bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                    >
                      {{ memberInitials(board.owner.nama) }}
                    </ProfileAvatar>
                    {{ t('tugas_assignee') }}:
                    <strong class="truncate font-semibold text-gray-700 dark:text-gray-200">
                      {{ board.owner.nama }}
                    </strong>
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-users" class="h-3.5 w-3.5" />
                    {{ members.length }} {{ t('tugas_anggota') }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-circle-check-big" class="h-3.5 w-3.5 text-success-500" />
                    {{ board.counts.done }}/{{ board.counts.total }} {{ t('tugas_selesai') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <UButton
                v-if="canCreateTask"
                icon="i-lucide-plus"
                color="primary"
                size="sm"
                :loading="isCreatingTask"
                @click="handleCreateTask"
              >
                {{ t('tugas_tambah_task') }}
              </UButton>
            </div>
          </div>

          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between gap-3">
              <Paragraph variant="body3m" class="text-gray-600 dark:text-gray-300">
                {{ t('tugas_overall_progress') }}
              </Paragraph>
              <Paragraph variant="body3sb" class="text-gray-700 dark:text-gray-200">
                {{ completionPercent }}%
              </Paragraph>
            </div>
            <UProgress :model-value="completionPercent" :max="100" color="primary" size="sm" />
          </div>
        </section>

        <!-- Sub-tab detail board. -->
        <div class="custom-scrollbar overflow-x-auto">
          <UTabs
            :model-value="activeTab"
            :items="detailTabs"
            :content="false"
            color="primary"
            variant="link"
            size="lg"
            class="min-w-max sm:min-w-0"
            :ui="{
              list: 'gap-2 border-gray-200 dark:border-gray-700',
              trigger: 'shrink-0 px-4',
              indicator: 'h-0.5 bg-primary-500',
            }"
            @update:model-value="handleTabChange"
          />
        </div>

        <!-- Board: Kanban drag & drop. -->
        <div v-if="activeTab === 'board'" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Heading variant="heading9b" as="h2" class="text-gray-900 dark:text-white">
                {{ t('tugas_papan_task') }}
              </Heading>
              <Paragraph variant="body3" class="mt-1 text-gray-500 dark:text-gray-400">
                {{ t('tugas_papan_task_desc') }}
              </Paragraph>
            </div>
            <UButton
              icon="i-lucide-archive"
              color="neutral"
              variant="outline"
              size="sm"
              @click="showArchived = !showArchived"
            >
              {{ showArchived ? t('tugas_sembunyikan_arsip') : t('tugas_tampilkan_arsip') }}
            </UButton>
          </div>

          <div
            class="custom-scrollbar grid grid-flow-col auto-cols-[minmax(280px,86vw)] gap-4 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-3 lg:auto-cols-auto lg:overflow-x-visible lg:pb-0"
          >
            <TugasKanbanColumn
              v-for="(statusTasks, status) in tasksByStatus"
              :key="status"
              :status="status"
              :title="columnTitles[status]"
              :tasks="statusTasks"
              :can-create-task="canCreateTask"
              :is-moving-task="movingTaskIds.size > 0"
              @drop-task="handleDrop"
              @create-task="handleCreateTask"
            >
              <TugasTaskCard
                v-for="task in statusTasks"
                :key="task.id"
                :task="task"
                :is-moving="movingTaskIds.has(task.id)"
                :can-move="canMoveTask && canEditTask(task)"
                :can-archive="canUpdateTask && canEditTask(task)"
                :read-only="!canEditTask(task)"
                :today-jakarta="todayJakarta"
                @open="openTask"
                @archive="archiveFromCard"
                @drop-before="(taskId, beforeTaskId) => handleDrop(taskId, status, beforeTaskId)"
              />
            </TugasKanbanColumn>
          </div>

          <section
            v-if="showArchived"
            class="custom-scrollbar max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <Heading variant="heading10sb" as="h3" class="mb-3 text-gray-900 dark:text-white">
              {{ t('tugas_task_diarsipkan') }} ({{ archivedTasks.length }})
            </Heading>
            <div v-if="archivedTasks.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TugasTaskCard
                v-for="task in archivedTasks"
                :key="task.id"
                :task="task"
                :is-moving="false"
                :can-move="false"
                :can-archive="false"
                :read-only="!canEditTask(task)"
                :today-jakarta="todayJakarta"
                @open="openTask"
              />
            </div>
            <Paragraph v-else variant="body2" class="text-gray-500 dark:text-gray-400">
              {{ t('tugas_arsip_kosong') }}
            </Paragraph>
          </section>
        </div>

        <!-- Overview: detail proyek, status, dan aktivitas. -->
        <div
          v-else-if="activeTab === 'overview'"
          class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
        >
          <section
            class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="mb-5 flex items-center gap-3">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              >
                <UIcon name="i-lucide-file-text" class="h-5 w-5" />
              </span>
              <Heading variant="heading9b" as="h2" class="text-gray-900 dark:text-white">
                {{ t('tugas_project_details') }}
              </Heading>
            </div>

            <div class="space-y-5">
              <div>
                <Paragraph
                  variant="caption1sb"
                  class="uppercase tracking-wide text-gray-400 dark:text-gray-500"
                >
                  {{ t('tugas_deskripsi_papan') }}
                </Paragraph>
                <Paragraph
                  variant="body2"
                  class="mt-1.5 whitespace-pre-line text-gray-700 dark:text-gray-300"
                >
                  {{ board.deskripsi || t('tugas_tidak_ada_deskripsi') }}
                </Paragraph>
              </div>

              <dl
                class="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 dark:border-gray-700"
              >
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">
                    {{ t('tugas_tipe_papan') }}
                  </dt>
                  <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{
                      board.tipe === 'bersama'
                        ? t('tugas_papan_bersama')
                        : t('tugas_papan_personal')
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">
                    {{ t('tugas_pemilik_papan') }}
                  </dt>
                  <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ ownerMember?.nama ?? '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">
                    {{ t('tugas_tanggal_dibuat') }}
                  </dt>
                  <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ formatBoardDate(board.createdAt) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">
                    {{ t('tugas_terakhir_diperbarui') }}
                  </dt>
                  <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ formatBoardDate(board.updatedAt) }}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="mb-5 flex items-center gap-3">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <UIcon name="i-lucide-chart-no-axes-combined" class="h-5 w-5" />
              </span>
              <Heading variant="heading9b" as="h2" class="text-gray-900 dark:text-white">
                {{ t('tugas_ringkasan_status') }}
              </Heading>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-900/40">
                <p class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {{ board.counts.todo }}
                </p>
                <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {{ t('tugas_status_todo') }}
                </p>
              </div>
              <div class="rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                <p class="text-xl font-semibold text-blue-700 dark:text-blue-300">
                  {{ board.counts.inProgress }}
                </p>
                <p class="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
                  {{ t('tugas_status_in_progress') }}
                </p>
              </div>
              <div class="rounded-xl bg-green-50 p-3 text-center dark:bg-green-900/20">
                <p class="text-xl font-semibold text-green-700 dark:text-green-300">
                  {{ board.counts.done }}
                </p>
                <p class="mt-1 text-[11px] text-green-600 dark:text-green-400">
                  {{ t('tugas_status_done') }}
                </p>
              </div>
            </div>

            <div class="mt-5 space-y-3 border-t border-gray-100 pt-5 dark:border-gray-700">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('tugas_total_task') }}</span>
                <strong class="text-gray-800 dark:text-gray-100">{{ board.counts.total }}</strong>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{
                  t('tugas_task_aktif_summary')
                }}</span>
                <strong class="text-amber-600 dark:text-amber-400">{{ activeTaskCount }}</strong>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{
                  t('tugas_overall_progress')
                }}</span>
                <strong class="text-primary-600 dark:text-primary-400"
                  >{{ completionPercent }}%</strong
                >
              </div>
            </div>
          </section>

          <section
            class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2"
          >
            <div class="mb-4 flex shrink-0 items-center justify-between gap-3">
              <Heading variant="heading9b" as="h2" class="text-gray-900 dark:text-white">
                {{ t('tugas_aktivitas_terbaru') }}
              </Heading>
              <UIcon name="i-lucide-activity" class="h-5 w-5 text-gray-400" />
            </div>
            <div class="custom-scrollbar max-h-96 overflow-y-auto pr-2">
              <ol class="divide-y divide-gray-100 dark:divide-gray-700">
                <li v-for="activity in activities" :key="activity.id" class="flex items-start gap-3 py-3 first:pt-0">
                  <ProfileAvatar
                    size="sm"
                    :persnum="activity.actor?.persnum ?? activity.actorPersnum"
                    :alt="activityActorName(activity)"
                    avatar-class="shrink-0 bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  >
                    {{ memberInitials(activityActorName(activity)) }}
                  </ProfileAvatar>
                  <div class="min-w-0 flex-1">
                    <p class="break-words text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                      {{ activityActorName(activity) }}
                    </p>
                    <p class="mt-1 break-words text-sm leading-5 text-gray-700 dark:text-gray-200">
                      {{ activityLabel(activity.aksi) }}{{ activitySubject(activity) ? ` “${activitySubject(activity)}”` : '' }}
                    </p>
                    <p class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      <span v-if="activity.actor?.positionText" class="break-words">
                        {{ activity.actor.positionText }}
                      </span>
                      <span v-if="activity.actor?.positionText" aria-hidden="true">·</span>
                      <time :datetime="activity.createdAt">{{ formatActivityDate(activity.createdAt) }}</time>
                    </p>
                  </div>
                </li>
              </ol>
              <Paragraph
                v-if="!activities.length && !isLoadingActivity"
                variant="body2"
                class="text-gray-500 dark:text-gray-400"
              >
                {{ t('tugas_aktivitas_kosong') }}
              </Paragraph>
            </div>
            <button
              v-if="activityPage < activityLastPage"
              type="button"
              class="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 transition-all duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
              :disabled="isLoadingActivity"
              @click="loadActivity(false)"
            >
              <UIcon
                v-if="isLoadingActivity"
                name="i-lucide-loader-circle"
                class="h-4 w-4 animate-spin"
              />
              <UIcon v-else name="i-lucide-chevron-down" class="h-4 w-4" />
              {{ t('tugas_muat_aktivitas_lagi') }}
            </button>
          </section>
        </div>

        <!-- Anggota board. Pengelolaan tetap memakai modal existing. -->
        <div v-else-if="activeTab === 'anggota'" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Heading variant="heading9b" as="h2" class="text-gray-900 dark:text-white">
                {{ t('tugas_daftar_anggota') }}
              </Heading>
              <Paragraph variant="body3" class="mt-1 text-gray-500 dark:text-gray-400">
                {{ t('tugas_anggota_tab_desc', { count: members.length }) }}
              </Paragraph>
            </div>
            <UButton
              v-if="canManageMembers && isBoardOwner"
              icon="i-lucide-user-plus"
              color="primary"
              size="sm"
              @click="showMemberModal = true"
            >
              {{ t('tugas_kelola_anggota') }}
            </UButton>
          </div>

          <div
            class="custom-scrollbar grid max-h-[36rem] gap-4 overflow-y-auto pr-2 sm:grid-cols-2 xl:grid-cols-3"
          >
            <article
              v-for="member in members"
              :key="member.id"
              class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-800"
            >
              <div class="flex items-start gap-3">
                <ProfileAvatar
                  size="md"
                  :persnum="member.persnum"
                  :alt="member.nama"
                  avatar-class="shrink-0 bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                >
                  {{ memberInitials(member.nama) }}
                </ProfileAvatar>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {{ member.nama }}
                    </p>
                    <UIcon
                      v-if="member.role === 'owner'"
                      name="i-lucide-crown"
                      class="h-4 w-4 shrink-0 text-amber-500"
                    />
                  </div>
                  <p class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {{ member.positionText ?? member.positionId }}
                  </p>
                </div>
              </div>
              <div
                class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700"
              >
                <UBadge
                  :color="member.role === 'owner' ? 'warning' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{
                    member.role === 'owner' ? t('tugas_peran_pemilik') : t('tugas_peran_anggota')
                  }}
                </UBadge>
                <span
                  v-if="member.id === myMember?.id"
                  class="text-xs font-medium text-primary-600 dark:text-primary-400"
                >
                  {{ t('tugas_anda') }}
                </span>
              </div>
            </article>
          </div>
        </div>

        <!-- Forum: diskusi umum seluruh anggota papan. -->
        <div v-else-if="activeTab === 'forum'" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Heading variant="heading9b" as="h2" class="text-gray-900 dark:text-white">
                {{ t('tugas_forum') }}
              </Heading>
            </div>
          </div>

          <!-- Area chat umum papan. -->
          <section
            class="flex h-[36rem] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <TugasTaskForum
              :board-id="boardId"
              :tasks="tasks"
              :members="members"
              :comments="forumComments"
              :loading="isLoadingForum"
              :sending="isSendingComment"
              :removing-ids="removingCommentIds"
              :reacting-ids="reactingCommentIds"
              :has-more="forumPage < forumLastPage"
              :loading-more="isLoadingMoreForum"
              :current-position-id="userPositionId"
              @send="handleSendComment"
              @react="handleReactComment"
              @remove="handleRemoveComment"
              @load-more="handleLoadMoreComments"
            />
          </section>
        </div>
      </div>
    </template>

    <!-- Modal detail task -->
    <TugasTaskDetailModal
      v-model="showTaskModal"
      :task="activeTask"
      :board-type="board?.tipe ?? 'personal'"
      :board-icon="board?.icon"
      :members="members"
      :saving="isSavingTask || isCreatingTask"
      :can-create-task="canCreateTask"
      :can-update-task="canUpdateTask"
      :can-delete-task="canDeleteTask && isTaskCreator(activeTask)"
      :references="taskReferences"
      :adding-reference="isAddingReference"
      :evidences="taskEvidences"
      :uploading-evidence="isUploadingEvidence"
      :removing-evidence-ids="removingEvidenceIds"
      :mode="isCreateModal ? 'create' : 'edit'"
      :read-only="isTaskReadOnly(activeTask)"
      @save="saveTask"
      @create="createTaskFromModal"
      @archive="archiveFromModal"
      @unarchive="unarchiveFromModal"
      @delete="requestDeleteTask"
      @remove-reference="handleRemoveReference"
      @add-reference="handleAddReference"
      @add-evidence="handleAddEvidence"
      @remove-evidence="handleRemoveEvidence"
      @invalid-evidence="handleInvalidEvidence"
    />

    <!-- Modal konfirmasi hapus task -->
    <ConfirmModal
      v-model="showDeleteTaskModal"
      variant="danger"
      :title="t('tugas_hapus_task')"
      :description="t('tugas_hapus_task_konfirmasi')"
      confirm-text="Hapus"
      cancel-text="Batal"
      :loading="isDeletingTask"
      @confirm="confirmDeleteTask"
    />

    <ConfirmModal
      v-model="showRemoveMemberConfirm"
      variant="danger"
      :title="t('tugas_hapus_anggota')"
      :description="t('tugas_hapus_anggota_konfirmasi')"
      confirm-text="Hapus"
      cancel-text="Batal"
      :loading="isProcessingMember"
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
