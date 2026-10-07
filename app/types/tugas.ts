// Type response Tugas — mengikuti DTO backend (tugas-response.mapper.ts),
// bukan bentuk entity internal.

export type TugasBoardType = 'personal' | 'bersama';
export type TugasBoardFilter = 'semua' | 'saya-buat' | 'saya-ikut';
export type TugasBoardMemberRole = 'owner' | 'member';
export type TugasTaskStatus = 'todo' | 'in_progress' | 'done';
export type TugasTaskPriority = 'rendah' | 'sedang' | 'tinggi';
export type TugasMyTaskScope = 'semua' | 'terlambat' | 'hari-ini' | 'mendatang' | 'selesai';

export interface TugasPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TugasTaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

export interface TugasMember {
  id: string;
  persnum: number;
  positionId: string;
  nama: string;
  positionText: string | null;
  role: TugasBoardMemberRole;
}

export interface TugasBoardSummary {
  id: string;
  nama: string;
  deskripsi: string | null;
  tipe: TugasBoardType;
  /** Nama ikon lucide (mis. 'rocket') — null = default KanbanSquare. */
  icon: string | null;
  warna: string;
  revision: number;
  /** Pembuat papan (member dengan role owner) — untuk PIC di kartu. */
  owner: {
    persnum: number;
    nama: string;
    positionText: string | null;
  } | null;
  counts: TugasTaskCounts;
  createdAt: string;
  updatedAt: string;
}

export interface TugasBoardDetail extends TugasBoardSummary {
  members: TugasMember[];
}

export interface TugasTask {
  id: string;
  boardId: string;
  judul: string;
  deskripsi: string | null;
  status: TugasTaskStatus;
  urutan: number;
  prioritas: TugasTaskPriority | null;
  tenggat: string | null;
  assignee: TugasMember | null;
  /** Member yang membuat task — dipakai untuk read-only task milik orang lain. */
  createdByMemberId: string | null;
  /** Fallback ownership untuk data lama ketika membership pembuat sudah tidak tersedia. */
  createdByPersnum: number;
  selesaiAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TugasTaskWithRevision extends TugasTask {
  revision: number;
}

export interface TugasMyTaskItem extends TugasTask {
  board: {
    id: string;
    nama: string;
    warna: string;
    revision: number;
  };
}

export interface TugasMyTaskCounts {
  terlambat: number;
  hariIni: number;
  mendatang: number;
  selesai: number;
}

export interface TugasMemberCandidate {
  positionId: string;
  persnum: number;
  nama: string;
  positionText: string;
}

export interface TugasActivityItem {
  id: string;
  boardId: string;
  taskId: string | null;
  aksi: string;
  detail: Record<string, unknown> | null;
  actorPersnum: number;
  actorPositionId: string;
  actor: {
    persnum: number;
    positionId: string;
    nama: string;
    positionText: string | null;
  };
  createdAt: string;
}

export type TugasReferenceType =
  | 'naskah_masuk'
  | 'naskah_terkirim'
  | 'disposisi'
  | 'naskah_lainnya';

export interface TugasTaskReference {
  id: string;
  referenceType: TugasReferenceType;
  referenceId: string;
  labelSnapshot: string;
  route: string;
  available: boolean;
  createdAt: string;
}

export interface TugasTaskEvidence {
  id: string;
  originalName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileSize: number;
  uploadedByPersnum: number;
  createdAt: string;
  url: string;
}

export interface TugasTaskComment {
  id: string;
  boardId: string;
  /** Task yang di-tag — null bila komentar umum tanpa rujukan task. */
  taskId: string | null;
  /** Judul task saat komentar dibuat — untuk render chip tag. */
  taskJudul: string | null;
  memberId: string;
  isi: string;
  actorPersnum: number;
  actorPositionId: string;
  /** Pesan sudah dihapus untuk seluruh anggota dan ditampilkan sebagai tombstone. */
  isDeletedForEveryone: boolean;
  actor: {
    persnum: number;
    positionId: string;
    nama: string;
    positionText: string | null;
  };
  createdAt: string;
}

export interface TugasTaskCommentPage {
  data: TugasTaskComment[];
  meta: TugasPageMeta;
}

export interface TugasBoardPage {
  data: TugasBoardSummary[];
  meta: TugasPageMeta;
}

export interface TugasTaskPage {
  data: TugasTask[];
  meta: TugasPageMeta;
}

export interface TugasMyTaskPage {
  data: TugasMyTaskItem[];
  counts: TugasMyTaskCounts;
  meta: TugasPageMeta;
}

export interface TugasMemberCandidatePage {
  data: TugasMemberCandidate[];
  meta: TugasPageMeta;
}

export interface TugasActivityPage {
  data: TugasActivityItem[];
  meta: TugasPageMeta;
}

// ─── Payload ─────────────────────────────────────────────────────────────────

export interface TugasCreateBoardPayload {
  nama: string;
  deskripsi?: string;
  tipe?: TugasBoardType;
  icon?: string;
  warna?: string;
}

export interface TugasUpdateBoardPayload {
  nama?: string;
  deskripsi?: string;
  tipe?: TugasBoardType;
  icon?: string;
  warna?: string;
}

export interface TugasCreateTaskPayload {
  judul: string;
  deskripsi?: string | null;
  prioritas?: TugasTaskPriority | null;
  tenggat?: string | null;
  assigneeMemberId?: string | null;
  referenceType?: TugasReferenceType | null;
  referenceId?: string | null;
}

export interface TugasUpdateTaskPayload {
  judul?: string;
  deskripsi?: string | null;
  prioritas?: TugasTaskPriority | null;
  tenggat?: string | null;
  assigneeMemberId?: string | null;
}

export interface TugasMoveTaskPayload {
  status: TugasTaskStatus;
  urutan: number;
  expectedRevision: number;
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface TugasBoardQuery {
  filter?: TugasBoardFilter;
  q?: string;
  page?: number;
  limit?: number;
}

export interface TugasTaskQuery {
  status?: TugasTaskStatus;
  prioritas?: TugasTaskPriority;
  q?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface TugasMyTaskQuery extends TugasTaskQuery {
  scope?: TugasMyTaskScope;
  boardId?: string;
}

export interface TugasReferenceCandidate {
  referenceType: TugasReferenceType;
  referenceId: string;
  label: string;
}
