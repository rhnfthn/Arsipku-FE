import { ref } from 'vue';
import { useApi } from './useApi';
import { useAuth } from './useAuth';
import type {
  VerifikasiUsulanItem,
  VerifikasiFilter,
  VerifikasiSummary,
  VerifikasiActionPayload,
  RejectPayload,
  JenisUsulan,
} from '~/types/verifikasi-usulan';

/**
 * Composable untuk dashboard Verifikasi Usulan (gabungan inaktif + aktif ke inaktif).
 * Menggunakan 2 endpoint existing dan menggabungkan hasilnya di frontend.
 */
export const useVerifikasiUsulan = () => {
  const { apiGet, apiPatch, apiPost } = useApi();
  const { user } = useAuth();

  const list = ref<VerifikasiUsulanItem[]>([]);
  const summary = ref<VerifikasiSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const isAtasan = ref(false);

  /** Cek apakah user login pernah dipilih sebagai atasan managerial. */
  const checkIsAtasan = async (): Promise<boolean> => {
    try {
      const res: any = await apiGet(
        '/transfer-active-to-inactive/is-atasan',
        {},
        { skipCache: true }
      );
      isAtasan.value = res?.data?.isAtasan ?? false;
      return isAtasan.value;
    } catch {
      isAtasan.value = false;
      return false;
    }
  };

  /** Normalisasi item dari endpoint inaktif / aktif-ke-inaktif ke format gabungan. */
  const normalize = (raw: any, jenis: JenisUsulan): VerifikasiUsulanItem => ({
    id: raw.id,
    jenis,
    nomorUsulan: raw.nomorUsulan ?? '-',
    tanggalUsulan: raw.tanggalUsulan ?? raw.tanggal_usulan ?? raw.createdAt,
    sekretarisName: raw.sekretarisName ?? raw.sekretaris_name ?? '-',
    sekretarisPersnum: raw.sekretarisPersnum ?? raw.sekretaris_persnum,
    atasanName: raw.atasanName ?? raw.atasan_name ?? '-',
    atasanPersnum: raw.atasanPersnum ?? raw.atasan_persnum,
    arsipId: raw.arsipId ?? raw.arsip_id ?? '',
    arsipPerihal: raw.arsipPerihal ?? raw.arsip_perihal ?? '-',
    arsipKode: raw.arsipKode ?? raw.arsip_kode ?? null,
    tanggalRetensiAktifHabis:
      raw.tanggalRetensiAktifHabis ?? raw.tanggal_retensi_aktif_habis ?? null,
    keterangan: raw.keterangan ?? null,
    status: raw.status,
    rejectedNote: raw.rejectedNote ?? raw.rejected_note ?? null,
    verifyNote: raw.verifyNote ?? raw.verify_note ?? null,
    finalVerifyNote: raw.finalVerifyNote ?? raw.final_verify_note ?? null,
    beritaAcaraUrl: raw.beritaAcaraUrl ?? raw.berita_acara_url ?? null,
    beritaAcaraNomor: raw.beritaAcaraNomor ?? raw.berita_acara_nomor ?? null,
    approvedAt: raw.approvedAt ?? raw.approved_at ?? null,
    finalVerifiedAt: raw.finalVerifiedAt ?? raw.final_verified_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    currentApprovalLevel: raw.currentApprovalLevel ?? raw.current_approval_level ?? 1,
    totalApprovalLevels: raw.totalApprovalLevels ?? raw.total_approval_levels ?? 1,
    approvalLevels: Array.isArray(raw.approvalLevels)
      ? raw.approvalLevels.map((l: any) => ({
          id: l.id,
          atasanPersnum: l.atasanPersnum ?? l.atasan_persnum,
          atasanName: l.atasanName ?? l.atasan_name ?? '-',
          atasanPositionText: l.atasanPositionText ?? l.atasan_position_text ?? null,
          urutan: l.urutan,
          status: l.status,
          verifiedAt: l.verifiedAt ?? l.verified_at ?? null,
          catatan: l.catatan ?? null,
        }))
      : undefined,
  });

  /** Fetch gabungan dari 2 endpoint. */
  const fetchList = async (filter: VerifikasiFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
      });

      const jenis = params.jenis;
      delete params.jenis;

      // Pagination dilakukan di frontend (setelah filter DRAFT)
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      delete params.page;
      delete params.limit;

      // Ambil semua data dari backend (limit besar) untuk filter DRAFT di frontend
      params.limit = 999;

      const tasks: Promise<{ data: any[]; meta?: any; jenis: JenisUsulan }>[] = [];

      // Hanya panggil endpoint Pemindahan Arsip Aktif ke Inaktif
      if (!jenis || jenis === 'aktif_ke_inaktif') {
        tasks.push(
          apiGet('/transfer-active-to-inactive', { params }, { skipCache: true })
            .then((r: any) => {
              const data = Array.isArray(r) ? r : (r?.data ?? []);
              return { data, meta: null, jenis: 'aktif_ke_inaktif' as JenisUsulan };
            })
            .catch((e) => {
              console.error('[useVerifikasiUsulan] Error:', e);
              return { data: [], meta: null, jenis: 'aktif_ke_inaktif' as JenisUsulan };
            })
        );
      }

      const results = await Promise.all(tasks);

      // Gabungkan dan normalisasi, filter DRAFT
      const combined: VerifikasiUsulanItem[] = [];
      for (const r of results) {
        for (const raw of r.data) {
          const item = normalize(raw, r.jenis);
          if (item.status === 'DRAFT') continue;
          combined.push(item);
        }
      }

      // Sort by createdAt DESC
      combined.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      // Pagination di frontend
      const totalAll = combined.length;
      const startIdx = (page - 1) * limit;
      const pagedData = combined.slice(startIdx, startIdx + limit);

      // Enrich: cek isCurrentTurn
      const userPersnum = (user as any)?.persnum;
      if (userPersnum) {
        await Promise.all(
          pagedData.map(async (item) => {
            if (
              item.jenis === 'aktif_ke_inaktif' &&
              (item.status === 'MENUNGGU_VERIFIKASI_ATASAN' || item.status === 'DISETUJUI_ATASAN')
            ) {
              item.isCurrentTurn = await checkIsCurrentTurn(item.id, item.jenis);
            } else {
              item.isCurrentTurn = false;
            }
          })
        );
      }

      list.value = pagedData;
      meta.value = {
        page,
        limit,
        total: totalAll,
        totalPages: Math.ceil(totalAll / limit),
      };
      return { data: pagedData, meta: meta.value };
    } catch (e: any) {
      console.error('[useVerifikasiUsulan] fetchList error:', e);
      error.value = e?.message || 'Gagal memuat data';
      list.value = [];
      meta.value = null;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /** Summary hanya dari endpoint Pemindahan Arsip Aktif ke Inaktif. */
  const fetchSummary = async (): Promise<VerifikasiSummary | null> => {
    try {
      const activeRes: any = await apiGet(
        '/transfer-active-to-inactive/summary',
        {},
        { skipCache: true }
      ).catch(() => null);

      const a = activeRes?.data ?? {};

      const sum: VerifikasiSummary = {
        menungguVerifikasi: a.menungguVerifikasi ?? 0,
        menungguVerifikasiTerakhir: a.menungguFinal ?? 0,
        disetujui: a.disetujui ?? 0,
        ditolak: a.ditolak ?? 0,
        selesai: a.selesai ?? 0,
        total: a.total ?? 0,
      };
      summary.value = sum;
      return sum;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan';
      throw e;
    }
  };

  /** Detail usulan berdasarkan jenis. */
  const fetchDetail = async (
    id: string,
    jenis: JenisUsulan
  ): Promise<VerifikasiUsulanItem | null> => {
    try {
      const endpoint =
        jenis === 'aktif_ke_inaktif' ? '/transfer-active-to-inactive' : '/transfer-inactive-file';
      const res: any = await apiGet(`${endpoint}/${id}`, {}, { skipCache: true });
      return normalize(res?.data, jenis);
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail';
      throw e;
    }
  };

  /** Verifikasi (approve) — gunakan endpoint /verify (multi-level berjenjang). */
  const verify = async (id: string, jenis: JenisUsulan, payload: VerifikasiActionPayload) => {
    const endpoint =
      jenis === 'aktif_ke_inaktif'
        ? `/transfer-active-to-inactive/${id}/verify`
        : `/transfer-inactive-file/${id}/approve`;
    const r: any = await apiPatch(endpoint, { verifyNote: payload.catatanVerifikasi });
    return r?.data;
  };

  /** Cek apakah user login sedang giliran verifikasi. */
  const checkIsCurrentTurn = async (id: string, jenis: JenisUsulan): Promise<boolean> => {
    if (jenis !== 'aktif_ke_inaktif') return false;
    try {
      const r: any = await apiGet(
        `/transfer-active-to-inactive/${id}/is-current-turn`,
        {},
        { skipCache: true }
      );
      return r?.data?.isCurrentTurn ?? false;
    } catch {
      return false;
    }
  };

  /** Verifikasi terakhir → DISETUJUI_VERIFIKASI_TERAKHIR. */
  const finalVerify = async (id: string, jenis: JenisUsulan, payload: VerifikasiActionPayload) => {
    const endpoint =
      jenis === 'aktif_ke_inaktif'
        ? `/transfer-active-to-inactive/${id}/final-verify`
        : `/transfer-inactive-file/${id}/final-verify`;
    const r: any = await apiPatch(endpoint, { finalVerifyNote: payload.catatanVerifikasi });
    return r?.data;
  };

  /** Tolak usulan → DITOLAK_ATASAN (wajib alasan). */
  const reject = async (id: string, jenis: JenisUsulan, payload: RejectPayload) => {
    const endpoint =
      jenis === 'aktif_ke_inaktif'
        ? `/transfer-active-to-inactive/${id}/reject`
        : `/transfer-inactive-file/${id}/reject`;
    const r: any = await apiPatch(endpoint, { rejectedNote: payload.alasanPenolakan });
    return r?.data;
  };

  /** Generate Berita Acara. */
  const generateBeritaAcara = async (id: string, jenis: JenisUsulan) => {
    const endpoint =
      jenis === 'aktif_ke_inaktif'
        ? `/transfer-active-to-inactive/${id}/berita-acara`
        : `/transfer-inactive-file/${id}/berita-acara`;
    const r: any = await apiPost(endpoint, {});
    return r?.data;
  };

  /** Atasan klik "Kirim Usul Pindah" → USUL_PINDAH_DIKIRIM */
  const kirimUsulPindah = async (id: string, jenis: JenisUsulan) => {
    const endpoint = `/transfer-active-to-inactive/${id}/kirim-usul-pindah`;
    const r: any = await apiPatch(endpoint, {});
    return r?.data;
  };

  /** Atasan/Sekretaris klik "Siapkan Berkas Fisik" → SIAPKAN_BERKAS_FISIK */
  const siapkanBerkasFisik = async (id: string, jenis: JenisUsulan) => {
    const endpoint = `/transfer-active-to-inactive/${id}/siapkan-berkas-fisik`;
    const r: any = await apiPatch(endpoint, {});
    return r?.data;
  };

  /** Upload Berkas Fisik & Berita Acara */
  const uploadBerkas = async (
    id: string,
    jenis: JenisUsulan,
    payload: { berkasFisikUrl?: string; beritaAcaraSerahTerimaUrl?: string }
  ) => {
    const endpoint = `/transfer-active-to-inactive/${id}/upload-berkas`;
    const r: any = await apiPatch(endpoint, payload);
    return r?.data;
  };

  /** Selesaikan usulan → kirim ke TU (MENUNGGU_PENERIMAAN) */
  const selesaikanUsulan = async (id: string, jenis: JenisUsulan) => {
    const endpoint = `/transfer-active-to-inactive/${id}/selesai`;
    const r: any = await apiPatch(endpoint, {});
    return r?.data;
  };

  /** Atasan Managerial TU setujui penerimaan → SELESAI */
  const approveReceipt = async (id: string, jenis: JenisUsulan) => {
    const endpoint = `/transfer-active-to-inactive/${id}/approve-receipt`;
    const r: any = await apiPatch(endpoint, {});
    return r?.data;
  };

  return {
    list,
    summary,
    loading,
    error,
    meta,
    isAtasan,
    checkIsAtasan,
    fetchList,
    fetchSummary,
    fetchDetail,
    verify,
    finalVerify,
    reject,
    generateBeritaAcara,
    kirimUsulPindah,
    siapkanBerkasFisik,
    uploadBerkas,
    selesaikanUsulan,
    approveReceipt,
    checkIsCurrentTurn,
  };
};
