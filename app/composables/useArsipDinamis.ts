/**
 * Composable untuk modul Arsip Dinamis — Pemberkasan Arsip Aktif
 * Endpoint: /arsip-dinamis/*
 */
export const useArsipDinamis = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  // ── Berkas CRUD ─────────────────────────────────────────────────

  const getBerkasList = async (params?: Record<string, any>) => {
    return await apiGet('/arsip-dinamis/berkas', { params }, { skipCache: true });
  };

  const getBerkasStatistik = async () => {
    return await apiGet('/arsip-dinamis/berkas/statistik');
  };

  const getBerkasById = async (id: string) => {
    return await apiGet(`/arsip-dinamis/berkas/${id}`);
  };

  const createBerkas = async (data: Record<string, any>) => {
    return await apiPost('/arsip-dinamis/berkas', data);
  };

  const updateBerkas = async (id: string, data: Record<string, any>) => {
    return await apiPut(`/arsip-dinamis/berkas/${id}`, data);
  };

  const deleteBerkas = async (id: string) => {
    return await apiDelete(`/arsip-dinamis/berkas/${id}`);
  };

  // ── File pendukung berkas (foto lokasi fisik & dokumen pendukung) ──

  const uploadBerkasFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiPost('/arsip-dinamis/berkas/upload-file', formData);
  };

  const fetchBerkasFileBlob = async (key: string): Promise<Blob> => {
    return await apiGet(
      '/arsip-dinamis/berkas/file',
      { params: { key }, responseType: 'blob' },
      { skipCache: true }
    );
  };

  // ── Klasifikasi (auto-fill retensi) ─────────────────────────────

  const getKlasifikasiDenganRetensi = async () => {
    return await apiGet('/arsip-dinamis/klasifikasi');
  };

  // ── Naskah dalam Berkas ─────────────────────────────────────────

  const getDaftarNaskah = async (berkasId: string, params?: Record<string, any>) => {
    return await apiGet(
      `/arsip-dinamis/berkas/${berkasId}/naskah`,
      { params },
      { skipCache: true }
    );
  };

  // Detail naskah TUNGGAL dalam konteks berkas (sebagai anggota pemberkasan/
  // persetujuan) — tanpa cek peserta korespondensi. Return envelope { data }.
  const getNaskahDetailInBerkas = async (berkasId: string, naskahId: string) => {
    return await apiGet(
      `/arsip-dinamis/berkas/${berkasId}/naskah/${naskahId}/detail`,
      {},
      { skipCache: true }
    );
  };

  // Presigned URL PDF final naskah (untuk preview di modal Tambah Naskah,
  // sebelum naskah masuk berkas). Return envelope { data: { url } }.
  const getNaskahPdfUrl = async (naskahId: string) => {
    return await apiGet(`/arsip-dinamis/naskah/${naskahId}/pdf`, {}, { skipCache: true });
  };

  const getNaskahPdfBlob = async (naskahId: string): Promise<Blob> => {
    return await apiGet(
      `/arsip-dinamis/naskah/${naskahId}/pdf/file`,
      { responseType: 'blob' },
      { skipCache: true }
    );
  };

  const addNaskahToBerkas = async (
    berkasId: string,
    data: { naskah_ids: string[]; sumber: string }
  ) => {
    return await apiPost(`/arsip-dinamis/berkas/${berkasId}/naskah`, data);
  };

  const removeNaskahFromBerkas = async (berkasId: string, naskahId: string) => {
    return await apiDelete(`/arsip-dinamis/berkas/${berkasId}/naskah/${naskahId}`);
  };

  const getNaskahSiapArsip = async (berkasId: string, params?: Record<string, any>) => {
    return await apiGet(
      `/arsip-dinamis/berkas/${berkasId}/naskah-siap-arsip`,
      { params },
      { skipCache: true }
    );
  };

  const getBerkasStatusByNaskah = async (naskahIds: string[]) => {
    const ids = [...new Set(naskahIds.filter(Boolean))];
    if (ids.length === 0) return { success: true, data: [] };

    // Jangan kirim seluruh daftar UUID dalam satu query string. Daftar kandidat
    // dapat berisi 100 naskah dan melewati batas request line/proxy (431), yang
    // kemudian tampak di browser sebagai error CORS karena respons 431 tidak
    // sempat melewati middleware CORS aplikasi.
    const MAX_IDS_PER_REQUEST = 25;
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
      batches.push(ids.slice(i, i + MAX_IDS_PER_REQUEST));
    }

    const responses = await Promise.all(
      batches.map((batch) =>
        apiGet<any>(
          '/arsip-dinamis/berkas-naskah',
          { params: { naskah_ids: batch.join(',') } },
          { skipCache: true }
        )
      )
    );

    const data = responses.flatMap((response) => {
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data)) return response.data;
      return [];
    });

    return { success: true, data };
  };

  // ── Penutupan & Verifikasi ──────────────────────────────────────

  const ajukanTutupBerkas = async (
    berkasId: string,
    data: { verifikator: any[]; catatan?: string }
  ) => {
    return await apiPost(`/arsip-dinamis/berkas/${berkasId}/ajukan-tutup`, data);
  };

  const getVerifikasiDetail = async (berkasId: string) => {
    return await apiGet(`/arsip-dinamis/berkas/${berkasId}/verifikasi`);
  };

  const approveVerifikasi = async (berkasId: string, catatan: string) => {
    return await apiPost(`/arsip-dinamis/berkas/${berkasId}/approve`, { catatan });
  };

  const rejectVerifikasi = async (berkasId: string, catatan: string) => {
    return await apiPost(`/arsip-dinamis/berkas/${berkasId}/reject`, { catatan });
  };

  // ── Manager Views ───────────────────────────────────────────────

  const getPengajuanPenutupan = async (params?: Record<string, any>) => {
    return await apiGet('/arsip-dinamis/persetujuan', { params }, { skipCache: true });
  };

  const getRiwayatPersetujuan = async (params?: Record<string, any>) => {
    return await apiGet('/arsip-dinamis/persetujuan/riwayat', { params }, { skipCache: true });
  };

  const getPersetujuanSaya = async (params?: Record<string, any>) => {
    return await apiGet('/arsip-dinamis/persetujuan/saya', { params }, { skipCache: true });
  };

  const getRiwayatRetensi = async (params?: Record<string, any>) => {
    return await apiGet('/arsip-dinamis/riwayat-retensi', { params }, { skipCache: true });
  };

  const getNaskahSaya = async (tab: 'kotak_masuk' | 'terkirim', params?: Record<string, any>) => {
    return await apiGet(
      '/arsip-dinamis/naskah-saya',
      { params: { tab, ...params } },
      { skipCache: true }
    );
  };

  const getNaskahLainnyaKandidat = async (berkasId: string, params?: Record<string, any>) => {
    return await apiGet(
      `/arsip-dinamis/berkas/${berkasId}/naskah-lainnya-kandidat`,
      { params },
      { skipCache: true }
    );
  };

  const getStatistikPersetujuan = async () => {
    return await apiGet('/arsip-dinamis/persetujuan/statistik');
  };

  return {
    // Berkas
    getBerkasList,
    getBerkasStatistik,
    getBerkasById,
    createBerkas,
    updateBerkas,
    deleteBerkas,
    uploadBerkasFile,
    fetchBerkasFileBlob,
    // Klasifikasi
    getKlasifikasiDenganRetensi,
    // Naskah
    getDaftarNaskah,
    getNaskahDetailInBerkas,
    getNaskahPdfBlob,
    getNaskahPdfUrl,
    addNaskahToBerkas,
    removeNaskahFromBerkas,
    getNaskahSiapArsip,
    // Penutupan & Verifikasi
    ajukanTutupBerkas,
    getVerifikasiDetail,
    approveVerifikasi,
    rejectVerifikasi,
    // Manager
    getPengajuanPenutupan,
    getRiwayatPersetujuan,
    getPersetujuanSaya,
    getRiwayatRetensi,
    getNaskahSaya,
    getNaskahLainnyaKandidat,
    getStatistikPersetujuan,
    // Status Berkas by Naskah
    getBerkasStatusByNaskah,
  };
};
