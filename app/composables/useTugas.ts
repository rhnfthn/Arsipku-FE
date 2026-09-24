import { ref } from 'vue';
import { useApi } from '~/composables/useApi';
import type {
  TugasActivityPage,
  TugasBoardDetail,
  TugasBoardPage,
  TugasBoardQuery,
  TugasCreateBoardPayload,
  TugasCreateTaskPayload,
  TugasMemberCandidatePage,
  TugasMoveTaskPayload,
  TugasMyTaskPage,
  TugasMyTaskQuery,
  TugasReferenceType,
  TugasTaskComment,
  TugasTaskCommentPage,
  TugasTaskPage,
  TugasTaskQuery,
  TugasTaskEvidence,
  TugasTaskReference,
  TugasTaskWithRevision,
  TugasUpdateBoardPayload,
  TugasUpdateTaskPayload,
} from '~/types/tugas';

// ─── Error mapping ────────────────────────────────────────────────────────────

/**
 * Pesan error user-facing berbahasa Indonesia, konsisten untuk seluruh modul
 * Tugas. Tidak membocorkan detail query/schema dari server.
 */
export const mapTugasError = (error: unknown): string => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
  if (code === 'TUGAS_REVISION_CONFLICT') {
    return 'Papan telah berubah. Muat ulang data terbaru.';
  }
  if (status === 403) return 'Anda tidak memiliki akses ke fitur Tugas.';
  if (status === 404) return 'Data tidak ditemukan.';
  if (status === 400) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message;
    return typeof message === 'string' && message ? message : 'Permintaan tidak valid.';
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
};

// ─── Composable ───────────────────────────────────────────────────────────────

export const useTugas = () => {
  const { get, getFresh, post, patch, del } = useApi();

  // State daftar papan
  const boards = ref<TugasBoardPage['data']>([]);
  const boardsMeta = ref<TugasBoardPage['meta'] | null>(null);
  const isLoadingBoards = ref(false);
  const boardsError = ref<string | null>(null);

  // State detail papan (keyed by ID agar dua tab board tidak saling menimpa)
  const boardDetails = ref<Record<string, TugasBoardDetail>>({});
  const isLoadingBoard = ref(false);
  const boardError = ref<string | null>(null);

  // State task per papan
  const boardTasks = ref<Record<string, TugasTaskPage['data']>>({});
  const isLoadingTasks = ref(false);
  const tasksError = ref<string | null>(null);

  // State Tugas Saya
  const myTasks = ref<TugasMyTaskPage['data']>([]);
  const myTaskCounts = ref<TugasMyTaskPage['counts']>({
    terlambat: 0,
    hariIni: 0,
    mendatang: 0,
    selesai: 0,
  });
  const myTasksMeta = ref<TugasMyTaskPage['meta'] | null>(null);
  const isLoadingMyTasks = ref(false);
  const myTasksError = ref<string | null>(null);
  let boardsRequestId = 0;
  let myTasksRequestId = 0;
  const boardDetailRequestIds = new Map<string, number>();
  const boardTaskRequestIds = new Map<string, number>();

  // ─── Papan ─────────────────────────────────────────────────────────────────

  const fetchBoards = async (query: TugasBoardQuery = {}) => {
    const requestId = ++boardsRequestId;
    isLoadingBoards.value = true;
    boardsError.value = null;
    try {
      // Response dibungkus TransformResponseInterceptor: { success, data: { data, meta } }
      const res = await get<TugasBoardPage>('/tugas/boards', {
        params: {
          filter: query.filter,
          q: query.q || undefined,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
        },
      });
      const payload = res.data ?? res;
      if (requestId === boardsRequestId) {
        boards.value = Array.isArray(payload.data) ? payload.data : [];
        boardsMeta.value = payload.meta ?? null;
      }
    } catch (error) {
      if (requestId === boardsRequestId) {
        boardsError.value = mapTugasError(error);
        boards.value = [];
        boardsMeta.value = null;
      }
    } finally {
      if (requestId === boardsRequestId) isLoadingBoards.value = false;
    }
  };

  const fetchBoardDetail = async (boardId: string) => {
    const requestId = (boardDetailRequestIds.get(boardId) ?? 0) + 1;
    boardDetailRequestIds.set(boardId, requestId);
    isLoadingBoard.value = true;
    boardError.value = null;
    try {
      // Service mengembalikan { status, message, data } lalu dibungkus interceptor.
      // skipCache: data board harus selalu fresh (realtime refetch + revision check).
      const res = await getFresh<{ data: TugasBoardDetail }>(`/tugas/boards/${boardId}`);
      const payload = res.data ?? res;
      const detail = payload.data ?? payload;
      if (boardDetailRequestIds.get(boardId) === requestId) {
        boardDetails.value[boardId] = detail;
      }
      return detail;
    } catch (error) {
      if (boardDetailRequestIds.get(boardId) === requestId) {
        boardError.value = mapTugasError(error);
      }
      throw error;
    } finally {
      if (boardDetailRequestIds.get(boardId) === requestId) {
        isLoadingBoard.value = false;
      }
    }
  };

  const createBoard = async (payload: TugasCreateBoardPayload) => {
    return post<{ data: TugasBoardDetail }>('/tugas/boards', payload);
  };

  const updateBoard = async (boardId: string, payload: TugasUpdateBoardPayload) => {
    return patch<{ data: TugasBoardDetail }>(`/tugas/boards/${boardId}`, payload);
  };

  const deleteBoard = async (boardId: string) => {
    return del(`/tugas/boards/${boardId}`);
  };

  const restoreBoard = async (boardId: string) => {
    return post(`/tugas/boards/${boardId}/restore`);
  };

  // ─── Task ──────────────────────────────────────────────────────────────────

  const fetchTasks = async (boardId: string, query: TugasTaskQuery = {}) => {
    const requestId = (boardTaskRequestIds.get(boardId) ?? 0) + 1;
    boardTaskRequestIds.set(boardId, requestId);
    isLoadingTasks.value = true;
    tasksError.value = null;
    try {
      // skipCache: daftar task harus fresh (realtime refetch + optimistic move
      // tidak boleh tertimpa snapshot lama).
      const res = await getFresh<TugasTaskPage>(`/tugas/boards/${boardId}/tasks`, {
        params: {
          status: query.status,
          prioritas: query.prioritas,
          q: query.q || undefined,
          includeArchived: query.includeArchived || undefined,
          page: query.page ?? 1,
          limit: query.limit ?? 50,
        },
      });
      const payload = res.data ?? res;
      if (boardTaskRequestIds.get(boardId) === requestId) {
        boardTasks.value[boardId] = Array.isArray(payload.data) ? payload.data : [];
      }
      return payload;
    } catch (error) {
      if (boardTaskRequestIds.get(boardId) === requestId) {
        tasksError.value = mapTugasError(error);
      }
      throw error;
    } finally {
      if (boardTaskRequestIds.get(boardId) === requestId) {
        isLoadingTasks.value = false;
      }
    }
  };

  const fetchTask = async (taskId: string) => {
    const res = await get<{ data: TugasTaskWithRevision }>(`/tugas/tasks/${taskId}`);
    return res.data;
  };

  const createTask = async (boardId: string, payload: TugasCreateTaskPayload) => {
    return post<{ data: TugasTaskWithRevision }>(`/tugas/boards/${boardId}/tasks`, payload);
  };

  const updateTask = async (taskId: string, payload: TugasUpdateTaskPayload) => {
    return patch<{ data: TugasTaskWithRevision }>(`/tugas/tasks/${taskId}`, payload);
  };

  const moveTask = async (taskId: string, payload: TugasMoveTaskPayload) => {
    return patch<{ data: TugasTaskWithRevision }>(`/tugas/tasks/${taskId}/move`, payload);
  };

  const archiveTask = async (taskId: string) => {
    return post(`/tugas/tasks/${taskId}/archive`);
  };

  const unarchiveTask = async (taskId: string) => {
    return post(`/tugas/tasks/${taskId}/unarchive`);
  };

  const deleteTask = async (taskId: string) => {
    return del(`/tugas/tasks/${taskId}`);
  };

  // ─── Tugas Saya ────────────────────────────────────────────────────────────

  const fetchMyTasks = async (query: TugasMyTaskQuery = {}) => {
    const requestId = ++myTasksRequestId;
    isLoadingMyTasks.value = true;
    myTasksError.value = null;
    try {
      const res = await get<TugasMyTaskPage>('/tugas/my-tasks', {
        params: {
          scope: query.scope,
          boardId: query.boardId || undefined,
          status: query.status,
          prioritas: query.prioritas,
          q: query.q || undefined,
          page: query.page ?? 1,
          limit: query.limit ?? 50,
        },
      });
      const payload = res.data ?? res;
      if (requestId === myTasksRequestId) {
        myTasks.value = Array.isArray(payload.data) ? payload.data : [];
        myTaskCounts.value = payload.counts || {
          terlambat: 0,
          hariIni: 0,
          mendatang: 0,
          selesai: 0,
        };
        myTasksMeta.value = payload.meta ?? null;
      }
    } catch (error) {
      if (requestId === myTasksRequestId) {
        myTasksError.value = mapTugasError(error);
        myTasks.value = [];
        myTasksMeta.value = null;
      }
    } finally {
      if (requestId === myTasksRequestId) isLoadingMyTasks.value = false;
    }
  };

  // ─── Anggota (dipakai Phase 5, disiapkan sejak Phase 4) ────────────────────

  const fetchMemberCandidates = async (boardId: string, q: string, page = 1, limit = 10) => {
    const res = await get<TugasMemberCandidatePage>(`/tugas/boards/${boardId}/member-candidates`, {
      params: { q, page, limit },
    });
    return res;
  };

  const addBoardMember = async (boardId: string, positionId: string) => {
    return post(`/tugas/boards/${boardId}/members`, { positionId });
  };

  const removeBoardMember = async (boardId: string, memberId: string) => {
    return del(`/tugas/boards/${boardId}/members/${memberId}`);
  };

  // ─── Timeline (dipakai Phase 5) ────────────────────────────────────────────

  const fetchBoardActivity = async (boardId: string, page = 1, limit = 20) => {
    const res = await get<TugasActivityPage>(`/tugas/boards/${boardId}/activity`, {
      params: { page, limit },
    });
    return res;
  };

  // ─── Referensi (Phase 7) ──────────────────────────────────────────────────

  const fetchTaskReferences = async (taskId: string) => {
    const res = await getFresh<TugasTaskReference[]>(`/tugas/tasks/${taskId}/references`);
    const payload = res.data ?? res;
    return Array.isArray(payload) ? payload : [];
  };

  const addTaskReference = async (
    taskId: string,
    referenceType: TugasReferenceType,
    referenceNumber: string
  ) => {
    return post(`/tugas/tasks/${taskId}/references`, {
      referenceType,
      referenceNumber,
    });
  };

  const removeTaskReference = async (taskId: string, referenceId: string) => {
    return del(`/tugas/tasks/${taskId}/references/${referenceId}`);
  };

  // ─── Evidence task ────────────────────────────────────────────────────────

  const fetchTaskEvidences = async (taskId: string) => {
    const res = await getFresh<TugasTaskEvidence[]>(`/tugas/tasks/${taskId}/evidences`);
    const payload = res.data ?? res;
    return Array.isArray(payload) ? payload : [];
  };

  const addTaskEvidence = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return post(`/tugas/tasks/${taskId}/evidences`, formData);
  };

  const removeTaskEvidence = async (taskId: string, evidenceId: string) => {
    return del(`/tugas/tasks/${taskId}/evidences/${evidenceId}`);
  };

  // ─── Forum diskusi papan (komentar) ────────────────────────────────────────

  const fetchBoardComments = async (
    boardId: string,
    page = 1,
    limit = 50,
    taskId?: string | null
  ) => {
    const res = await getFresh<TugasTaskCommentPage>(`/tugas/boards/${boardId}/comments`, {
      params: { page, limit, taskId: taskId || undefined },
    });
    const payload = res.data ?? res;
    const inner = payload as { data?: TugasTaskComment[]; meta?: TugasTaskCommentPage['meta'] };
    return {
      data: Array.isArray(inner?.data) ? inner.data : [],
      meta: inner?.meta ?? { page, limit, total: 0, totalPages: 1 },
    };
  };

  const addBoardComment = async (
    boardId: string,
    isi: string,
    taskId?: string | null
  ) => {
    return post<{ data: TugasTaskComment }>(`/tugas/boards/${boardId}/comments`, {
      isi,
      taskId: taskId || undefined,
    });
  };

  /**
   * Hapus komentar dengan scope:
   * - 'me': sembunyikan hanya untuk membership aktif (kapan saja).
   * - 'everyone': hapus permanen (penulis, maks 5 menit setelah kirim).
   */
  const removeBoardComment = async (
    boardId: string,
    commentId: string,
    scope: 'me' | 'everyone' = 'me'
  ) => {
    return del(`/tugas/boards/${boardId}/comments/${commentId}?scope=${scope}`);
  };

  return {
    // state papan
    boards,
    boardsMeta,
    isLoadingBoards,
    boardsError,
    boardDetails,
    isLoadingBoard,
    boardError,
    // state task
    boardTasks,
    isLoadingTasks,
    tasksError,
    // state Tugas Saya
    myTasks,
    myTaskCounts,
    myTasksMeta,
    isLoadingMyTasks,
    myTasksError,
    // papan
    fetchBoards,
    fetchBoardDetail,
    createBoard,
    updateBoard,
    deleteBoard,
    restoreBoard,
    // task
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    moveTask,
    archiveTask,
    unarchiveTask,
    deleteTask,
    // Tugas Saya
    fetchMyTasks,
    // anggota
    fetchMemberCandidates,
    addBoardMember,
    removeBoardMember,
    // timeline
    fetchBoardActivity,
    // referensi
    fetchTaskReferences,
    addTaskReference,
    removeTaskReference,
    // evidence
    fetchTaskEvidences,
    addTaskEvidence,
    removeTaskEvidence,
    // forum diskusi
    fetchBoardComments,
    addBoardComment,
    removeBoardComment,
    // util
    mapTugasError,
  };
};
