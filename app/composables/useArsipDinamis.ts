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
    return await apiGet(
      '/arsip-dinamis/berkas-naskah',
      {
        params: { naskah_ids: naskahIds.join(',') },
      },
      { skipCache: true }
    );
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
    getStatistikPersetujuan,
    // Status Berkas by Naskah
    getBerkasStatusByNaskah,
  };
};
