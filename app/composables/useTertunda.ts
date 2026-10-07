// composables/useTertunda.ts
import { ref } from "vue";

export interface PengirimTertunda {
  position_id: string;
  position_text: string;
  organization_text: string;
  nama: string;
}

export interface PenerimaTertunda {
  position_id: string;
  position_text: string;
  nama: string;
}

export interface NaskahTertunda {
  id_naskah: string;
  id_sirkulasi: string;
  jenis: string;
  jenis_label: string;
  nomor: string;
  tanggal: string;
  perihal: string;
  sifat: string;
  status: string;
  lampiran: number;
  favorit: boolean;
  note: boolean;
  note_text: string | null;
  arsip: boolean;
  is_locked: boolean;
  is_tindak_lanjut: boolean;
  pengirim: PengirimTertunda;
  penerima: PenerimaTertunda[];
  created_at: string;
  updated_at: string | null;
}

export interface TertundaItem {
  id: string;
  naskahId: string;
  id_sirkulasi: string;
  category: string;
  category_label: string;
  nomor: string;
  subject: string;
  from: string;
  body: string;
  fullDate: string;
  sifat: string;
  status: string;
  lampiran: number;
  penerima: PenerimaTertunda[];
  fullRecipients: string;
  isStarred: boolean;
  isArsip: boolean;
  isLocked: boolean;
  isNote: boolean;
  noteText: string;
  labels: string[];
  originalData: NaskahTertunda;
}

export interface TertundaPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TertundaSummary {
  total_semua: number;
  total_per_jenis: Record<string, number>;
}

export interface FetchTertundaParams {
  page?: number;
  limit?: number;
  jenis?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  arsip?: boolean;
  favorite?: boolean;
  note?: boolean;
  lock?: boolean;
  priority?: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const mapToTertundaItem = (raw: NaskahTertunda): TertundaItem => {
  const recipientNames = (raw.penerima || [])
    .map((p) => p.position_text || p.nama)
    .join("\n");

  return {
    id: raw.id_naskah,
    naskahId: raw.id_naskah,
    id_sirkulasi: raw.id_sirkulasi,
    category: raw.jenis,
    category_label: raw.jenis_label,
    nomor: raw.nomor,
    subject: raw.perihal,
    from: (raw.penerima || []).map((p) => p.position_text || p.nama).join(", "),
    body: raw.nomor,
    fullDate: raw.created_at,
    sifat: raw.sifat,
    status: raw.status,
    lampiran: raw.lampiran,
    penerima: raw.penerima || [],
    fullRecipients: recipientNames,
    isStarred: raw.favorit,
    isArsip: raw.arsip,
    isLocked: raw.is_locked,
    isNote: raw.note,
    noteText: raw.note_text || "",
    labels: [],
    originalData: raw,
  };
};

export const useTertunda = () => {
  const { apiGet, apiPost, apiPatch } = useApi();
  const { fetchInboxDetail } = useInbox();

  const items = ref<TertundaItem[]>([]);
  const pagination = ref<TertundaPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const summary = ref<TertundaSummary>({
    total_semua: 0,
    total_per_jenis: {},
  });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ── LIST ─────────────────────────────────────────────────────────────────
  const fetchTertunda = async (params: FetchTertundaParams = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const query: Record<string, any> = {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      };
      if (params.jenis) query.jenis = params.jenis;
      if (params.search) query.search = params.search;
      if (params.start_date) query.start_date = params.start_date;
      if (params.end_date) query.end_date = params.end_date;
      if (params.arsip) query.arsip = true;
      if (params.favorite) query.favorite = true;
      if (params.note) query.note = true;
      if (params.lock) query.lock = true;
      if (params.priority) query.priority = true;

      const res = await apiGet("/naskah_sirkulasi/tertunda", { params: query }, { skipCache: true });

      if (res?.success) {
        items.value = (res.data || []).map(mapToTertundaItem);
        pagination.value = res.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 };
        summary.value = res.summary ?? { total_semua: 0, total_per_jenis: {} };
      }
    } catch (err: any) {
      error.value = err?.message ?? "Gagal memuat data tertunda";
      console.error("useTertunda fetchTertunda error:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // ── DETAIL: GET /persuratan/naskah/:id ───────────────────────────────────
  const fetchTertundaDetail = async (id: string, jenis: string) => {
    const response = await fetchInboxDetail(id, jenis);
    const dataArray: any[] = Array.isArray(response) ? response : response ? [response] : [];
    if (dataArray.length === 0) return null;

    // buildChainFlow mengembalikan ancestor chain (root → parent → viewed).
    // dataArray[0] adalah root (mis. ND induk), bukan naskah yang sedang
    // dibuka. Cari node yang id-nya sama dengan route id agar final_pdf_url,
    // lampiran, perihal, dll milik naskah yang sedang dilihat (mis. SDE).
    const viewed =
      dataArray.find((n: any) => String(n?.id) === String(id)) ||
      dataArray.find((n: any) => String(n?.raw?.id) === String(id)) ||
      dataArray[0];
    return viewed?.raw ?? viewed ?? null;
  };

  const fetchTertundaNavigation = async (idNaskah: string, jenis?: string) => {
    try {
      const query = new URLSearchParams();
      if (jenis && !["ALL", "Semua"].includes(jenis)) query.append("jenis", jenis);
      const res: any = await apiGet(
        `/naskah_sirkulasi/tertunda/${encodeURIComponent(idNaskah)}/navigation${query.toString() ? `?${query.toString()}` : ""}`,
        {},
        { skipCache: true },
      );

      const navData = res?.data ?? res;
      return {
        current: navData?.current ?? null,
        previous: navData?.previous ?? null,
        next: navData?.next ?? null,
      };
    } catch (err) {
      console.error("fetchTertundaNavigation error:", err);
      return { current: null, previous: null, next: null };
    }
  };

  // ── VALIDASI FILE ─────────────────────────────────────────────────────────
  const validateTtdFile = (file: File): string => {
    if (file.type !== "application/pdf") return "File harus berformat PDF.";
    if (file.size > MAX_FILE_SIZE_BYTES)
      return `Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB.`;
    return "";
  };

  // ── KIRIM: POST /persuratan/naskah/:id/finalize-pending ──────────────────
  // body: FormData { file: <pdf> }
  const finalizePending = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return await apiPost(`/persuratan/naskah/${id}/finalize-pending`, fd);
  };

  // ── TOGGLE FLAG (favorit/arsip/lock/note) ─────────────────────────────────
  const toggleFlag = async (
    mail: any,
    flagType: 'favorit' | 'arsip' | 'lock' | 'note',
    noteText?: string,
  ) => {
    const oldValMap: Record<string, any> = {
      favorit: mail.isStarred,
      arsip: mail.isArsip,
      lock: mail.isLocked,
      note: mail.isNote,
    };
    const oldVal = oldValMap[flagType];
    try {
      const idToSend = mail.id_sirkulasi || mail.originalData?.id_sirkulasi || mail.naskahId || mail.id;
      if (!idToSend) throw new Error('ID sirkulasi tidak ditemukan');
      const payload: any = { id_sirkulasi: idToSend, flag_type: flagType };
      if (flagType === 'note' && noteText !== undefined) {
        payload.note_text = noteText;
        // Set nilai flag secara eksplisit agar update catatan tidak men-toggle
        // flagNote jadi 0 (catatan hilang).
        payload.new_value = !!(noteText && noteText.trim().length > 0);
      }
      await apiPatch('/naskah_sirkulasi/toggle-flag', payload);
    } catch (err) {
      console.error('Gagal toggle flag:', flagType, err);
      if (flagType === 'favorit') mail.isStarred = oldVal;
      else if (flagType === 'arsip') mail.isArsip = oldVal;
      else if (flagType === 'lock') mail.isLocked = oldVal;
      else if (flagType === 'note') mail.isNote = oldVal;
      throw err;
    }
  };

  return {
    items,
    pagination,
    summary,
    isLoading,
    error,
    MAX_FILE_SIZE_MB,
    fetchTertunda,
    fetchTertundaDetail,
    fetchTertundaNavigation,
    validateTtdFile,
    finalizePending,
    toggleFlag,
  };
};
