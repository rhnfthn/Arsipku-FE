export const useGrupPenerima = () => {
  const { apiGet, apiPost, apiPut, apiDelete, clearApiCache } = useApi();

  /** GET /persuratan/grup-penerima — list all groups */
  const getGrupPenerima = async (params?: { company?: string; area?: string; jenis?: string }) => {
    const query = new URLSearchParams();
    if (params?.company) query.set('company', params.company);
    if (params?.area) query.set('area', params.area);
    if (params?.jenis) query.set('jenis', params.jenis);
    const qs = query.toString();
    query.set('includeInactive', 'true');
    const finalQuery = query.toString();
    return await apiGet(`/persuratan/grup-penerima?${finalQuery}`, {}, { skipCache: true });
  };

  /** GET /persuratan/grup-penerima/:id — get single group */
  const getGrupPenerimaDetail = async (id: string) => {
    return await apiGet(`/persuratan/grup-penerima/${id}`, {}, { skipCache: true });
  };

  /** POST /persuratan/grup-penerima — create group */
  const createGrupPenerima = async (payload: {
    company: string;
    nama: string;
    deskripsi?: string;
    deskripsi_english?: string;
    aktif?: boolean;
  }) => {
    const res = await apiPost('/persuratan/grup-penerima', payload);
    clearApiCache();
    return res;
  };

  /** PUT /persuratan/grup-penerima/:id — update group */
  const updateGrupPenerima = async (
    id: string,
    payload: Partial<{
      company: string;
      nama: string;
      deskripsi: string;
      deskripsi_english: string;
      aktif: boolean;
    }>
  ) => {
    const res = await apiPut(`/persuratan/grup-penerima/${id}`, payload);
    clearApiCache();
    return res;
  };

  /** PUT /persuratan/grup-penerima/:id/toggle-aktif — toggle active */
  const toggleAktifGrupPenerima = async (id: string) => {
    const res = await apiPut(`/persuratan/grup-penerima/${id}/toggle-aktif`, {});
    // Clear cache agar fetchData mendapat data fresh
    clearApiCache();
    return res;
  };

  /** DELETE /persuratan/grup-penerima/:id — delete group */
  const deleteGrupPenerima = async (id: string) => {
    const res = await apiDelete(`/persuratan/grup-penerima/${id}`);
    clearApiCache();
    return res;
  };

  /** GET /persuratan/grup-penerima/:id/check-usage */
  const checkGrupPenerimaUsage = async (id: string) => {
    return await apiGet<{ canDelete: boolean; reason?: string; details?: any }>(
      `/persuratan/grup-penerima/${id}/check-usage`,
      {},
      { skipCache: true },
    );
  };

  /** GET /persuratan/grup-penerima/:id/members — list members */
  const getGrupPenerimaMembers = async (id: string) => {
    return await apiGet(`/persuratan/grup-penerima/${id}/members`, {}, { skipCache: true });
  };

  /** POST /persuratan/grup-penerima/:id/members — add member */
  const addGrupPenerimaMember = async (id: string, position: string | number) => {
    return await apiPost(`/persuratan/grup-penerima/${id}/members`, {
      id_grup_penerima: id,
      position: String(position),
    });
  };

  /** PUT /persuratan/grup-penerima/members/:detailId — update member */
  const updateGrupPenerimaMember = async (detailId: string, position: string | number) => {
    return await apiPut(`/persuratan/grup-penerima/members/${detailId}`, {
      position: String(position),
    });
  };

  /** DELETE /persuratan/grup-penerima/:id/members/:detailId — remove member */
  const deleteGrupPenerimaMember = async (id: string, detailId: string) => {
    const res = await apiDelete(`/persuratan/grup-penerima/${id}/members/${detailId}`);
    clearApiCache();
    return res;
  };

  return {
    getGrupPenerima,
    getGrupPenerimaDetail,
    createGrupPenerima,
    updateGrupPenerima,
    toggleAktifGrupPenerima,
    deleteGrupPenerima,
    checkGrupPenerimaUsage,
    getGrupPenerimaMembers,
    addGrupPenerimaMember,
    updateGrupPenerimaMember,
    deleteGrupPenerimaMember,
  };
};
