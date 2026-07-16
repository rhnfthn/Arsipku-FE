export const useGrupPenerima = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();

  /** GET /persuratan/grup-penerima — list all groups */
  const getGrupPenerima = async (params?: { company?: string; area?: string; jenis?: string }) => {
    const query = new URLSearchParams();
    if (params?.company) query.set('company', params.company);
    if (params?.area) query.set('area', params.area);
    if (params?.jenis) query.set('jenis', params.jenis);
    const qs = query.toString();
    return await apiGet(`/persuratan/grup-penerima${qs ? `?${qs}` : ''}`);
  };

  /** GET /persuratan/grup-penerima/:id — get single group */
  const getGrupPenerimaDetail = async (id: string) => {
    return await apiGet(`/persuratan/grup-penerima/${id}`);
  };

  /** POST /persuratan/grup-penerima — create group */
  const createGrupPenerima = async (payload: {
    company: string;
    area: string;
    nama: string;
    deskripsi?: string;
    deskripsi_english?: string;
    urutan?: number;
    aktif?: boolean;
  }) => {
    return await apiPost('/persuratan/grup-penerima', payload);
  };

  /** PUT /persuratan/grup-penerima/:id — update group */
  const updateGrupPenerima = async (id: string, payload: Partial<{
    company: string;
    area: string;
    nama: string;
    deskripsi: string;
    deskripsi_english: string;
    urutan: number;
    aktif: boolean;
  }>) => {
    return await apiPut(`/persuratan/grup-penerima/${id}`, payload);
  };

  /** PUT /persuratan/grup-penerima/:id/toggle-aktif — toggle active */
  const toggleAktifGrupPenerima = async (id: string) => {
    return await apiPut(`/persuratan/grup-penerima/${id}/toggle-aktif`, {});
  };

  /** DELETE /persuratan/grup-penerima/:id — delete group */
  const deleteGrupPenerima = async (id: string) => {
    return await apiDelete(`/persuratan/grup-penerima/${id}`);
  };

  /** GET /persuratan/grup-penerima/:id/members — list members */
  const getGrupPenerimaMembers = async (id: string) => {
    return await apiGet(`/persuratan/grup-penerima/${id}/members`);
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
    return await apiPut(`/persuratan/grup-penerima/members/${detailId}`, { position: String(position) });
  };

  /** DELETE /persuratan/grup-penerima/:id/members/:detailId — remove member */
  const deleteGrupPenerimaMember = async (id: string, detailId: string) => {
    return await apiDelete(`/persuratan/grup-penerima/${id}/members/${detailId}`);
  };

  return {
    getGrupPenerima,
    getGrupPenerimaDetail,
    createGrupPenerima,
    updateGrupPenerima,
    toggleAktifGrupPenerima,
    deleteGrupPenerima,
    getGrupPenerimaMembers,
    addGrupPenerimaMember,
    updateGrupPenerimaMember,
    deleteGrupPenerimaMember,
  };
};