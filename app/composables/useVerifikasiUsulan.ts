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

const CURRENT_VERIFIER_STATUSES = [
  'MENUNGGU_VERIFIKASI_ATASAN',
  'DISETUJUI_ATASAN',
  'MENUNGGU_VERIFIKASI_TERAKHIR',
  'DISETUJUI_VERIFIKASI_TERAKHIR',
];

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
  const normalize = (raw: any, jenis: JenisUsulan): VerifikasiUsulanItem => {
    const rawBacTembusan = raw.bacTembusan ?? raw.bac_tembusan;
    let parsedBacTembusan = rawBacTembusan;
    if (typeof parsedBacTembusan === 'string') {
      try {
        parsedBacTembusan = JSON.parse(parsedBacTembusan);
      } catch {
        parsedBacTembusan = null;
      }
    }

    return {
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
    arsipKlasifikasi: raw.arsipKlasifikasi ?? raw.arsip_klasifikasi ?? null,
    arsipKlasifikasiKode: raw.arsipKlasifikasiKode ?? raw.arsip_klasifikasi_kode ?? null,
    arsipLokasiFisik:
      raw.arsipLokasiFisik ?? raw.arsip_lokasi_fisik ?? raw.lokasiFisik ?? raw.lokasi_fisik ?? null,
    arsipTindakanPenyusutan: raw.arsipTindakanPenyusutan ?? raw.arsip_tindakan_penyusutan ?? null,
    tanggalRetensiAktifHabis:
      raw.tanggalRetensiAktifHabis ?? raw.tanggal_retensi_aktif_habis ?? null,
    keterangan: raw.keterangan ?? null,
    status: raw.status,
    rejectedNote: raw.rejectedNote ?? raw.rejected_note ?? null,
    verifyNote: raw.verifyNote ?? raw.verify_note ?? null,
    finalVerifyNote: raw.finalVerifyNote ?? raw.final_verify_note ?? null,
    beritaAcaraUrl: raw.beritaAcaraUrl ?? raw.berita_acara_url ?? null,
    beritaAcaraNomor: raw.beritaAcaraNomor ?? raw.berita_acara_nomor ?? null,
    // Pejabat pihak pertama BAC dipilih Sekretaris Divisi dan disimpan pada
    // usulan. Jangan mengambilnya dari atasan verifikasi atau metadata naskah.
    bacPihakPertamaPersnum:
      raw.bacPihakPertamaPersnum ?? raw.bac_pihak_pertama_persnum ?? null,
    bacPihakPertamaName:
      raw.bacPihakPertamaName ?? raw.bac_pihak_pertama_name ?? null,
    bacPihakPertamaJabatan:
      raw.bacPihakPertamaJabatan ?? raw.bac_pihak_pertama_jabatan ?? null,
    bacPihakKeduaPersnum:
      raw.bacPihakKeduaPersnum ?? raw.bac_pihak_kedua_persnum ?? null,
    bacPihakKeduaName:
      raw.bacPihakKeduaName ?? raw.bac_pihak_kedua_name ?? null,
    bacPihakKeduaJabatan:
      raw.bacPihakKeduaJabatan ?? raw.bac_pihak_kedua_jabatan ?? null,
    bacTembusan: Array.isArray(parsedBacTembusan)
      ? parsedBacTembusan.map((copy: any) => ({
          persnum: Number(copy?.persnum ?? copy?.personum ?? 0),
          name: copy?.name ?? copy?.nama ?? '-',
          jabatan: copy?.jabatan ?? copy?.positionText ?? copy?.position_text ?? '-',
        }))
      : null,
    bacSignedAt: raw.bacSignedAt ?? raw.bac_signed_at ?? null,
    bacSignedBy: raw.bacSignedBy ?? raw.bac_signed_by ?? null,
    bacSignatureQr: raw.bacSignatureQr ?? raw.bac_signature_qr ?? null,
    bacPihakKeduaSignedAt:
      raw.bacPihakKeduaSignedAt ?? raw.bac_pihak_kedua_signed_at ?? null,
    bacPihakKeduaSignedBy:
      raw.bacPihakKeduaSignedBy ?? raw.bac_pihak_kedua_signed_by ?? null,
    bacPihakKeduaSignatureQr:
      raw.bacPihakKeduaSignatureQr ?? raw.bac_pihak_kedua_signature_qr ?? null,
    approvedAt: raw.approvedAt ?? raw.approved_at ?? null,
    finalVerifiedAt: raw.finalVerifiedAt ?? raw.final_verified_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    currentApprovalLevel: raw.currentApprovalLevel ?? raw.current_approval_level ?? 1,
    totalApprovalLevels: raw.totalApprovalLevels ?? raw.total_approval_levels ?? 1,
    approvalLevels: Array.isArray(raw.approvalLevels ?? raw.approval_levels)
      ? (raw.approvalLevels ?? raw.approval_levels).map((l: any) => ({
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
    tuApprovalLevels: Array.isArray(raw.tuApprovalLevels)
      ? raw.tuApprovalLevels.map((l: any) => ({
          persnum: l.persnum,
          name: l.name ?? '-',
          jabatan: l.jabatan ?? l.positionText ?? null,
          urutan: l.urutan,
          status: l.status,
          verifiedAt: l.verifiedAt ?? l.verified_at ?? null,
          catatan: l.catatan ?? null,
        }))
      : undefined,
    };
  };

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

      // Status "MENUNGGU_VERIFIKASI" adalah pseudo-status (gabungan beberapa
      // status menunggu). Jangan kirim ke backend — filter di frontend.
      const statusFilter = params.status;
      delete params.status;

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

      // Gabungkan dan normalisasi, filter DRAFT dan usulan milik sendiri
      const userPersnum = user.value?.persnum;
      const filterKlasifikasi = params.klasifikasi;
      const combined: VerifikasiUsulanItem[] = [];
      for (const r of results) {
        for (const raw of r.data) {
          const item = normalize(raw, r.jenis);
          if (item.status === 'DRAFT') continue;
          // Sembunyikan usulan yang dibuat oleh user sendiri sebagai Sekretaris
          // (halaman verifikasi hanya untuk usulan di mana user adalah atasan)
          if (userPersnum && Number(item.sekretarisPersnum) === Number(userPersnum)) continue;

          // Filter status (client-side) — pseudo-status
          if (statusFilter) {
            if (statusFilter === 'MENUNGGU_PERSETUJUAN') {
              const menunggu = [
                'MENUNGGU_VERIFIKASI_ATASAN',
                'DISETUJUI_ATASAN',
                'MENUNGGU_VERIFIKASI_TERAKHIR',
              ];
              if (!menunggu.includes(item.status)) continue;
            } else if (statusFilter === 'MENUNGGU_VERIFIKASI') {
              const menunggu = [
                'DISETUJUI_VERIFIKASI_TERAKHIR',
                'USUL_PINDAH_DIKIRIM',
                'SIAPKAN_BERKAS_FISIK',
                'DIKIRIM',
                'MENUNGGU_VERIFIKASI_BERKAS_FISIK',
                'BERKAS_FISIK_SESUAI',
              ];
              if (!menunggu.includes(item.status)) continue;
            } else if (statusFilter === 'MENUNGGU_PENERIMAAN') {
              const menunggu = [
                'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU',
                'DISETUJUI_PERSETUJUAN_TU',
                'MENUNGGU_PERSETUJUAN_TERAKHIR_TU',
              ];
              if (!menunggu.includes(item.status)) continue;
            } else if (item.status !== statusFilter) {
              continue;
            }
          }
          // Filter klasifikasi (client-side) — cocokkan kode ATAU teks
          if (filterKlasifikasi) {
            const fk = filterKlasifikasi.toLowerCase();
            const kode = (item.arsipKlasifikasiKode ?? '').toLowerCase();
            const teks = (item.arsipKlasifikasi ?? '').toLowerCase();
            if (kode !== fk && !teks.includes(fk) && !kode.includes(fk)) continue;
          }
          combined.push(item);
        }
      }

      // Dahulukan transaksi yang paling baru berubah status/datanya.
      combined.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      // Pagination di frontend
      const totalAll = combined.length;
      const startIdx = (page - 1) * limit;
      const pagedData = combined.slice(startIdx, startIdx + limit);

      // Enrich: cek isCurrentTurn
      if (userPersnum) {
        await Promise.all(
          pagedData.map(async (item) => {
            if (item.jenis === 'aktif_ke_inaktif' && CURRENT_VERIFIER_STATUSES.includes(item.status)) {
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
