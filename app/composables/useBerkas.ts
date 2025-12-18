import type {
  Berkas,
  BerkasCreateInput,
  BerkasUpdateInput,
} from "~/types/berkas";

export const useBerkas = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  /**
   * Mengambil semua data berkas
   * Endpoint: GET /api/berkas
   */
  const getBerkasList = async (params?: any): Promise<Berkas[]> => {
    return await apiGet<Berkas[]>("/berkas", params);
  };

  /**
   * Mengambil detail satu berkas berdasarkan ID
   * Endpoint: GET /berkas/:id
   */
  const getBerkasById = async (id: string | number): Promise<Berkas> => {
    return await apiGet<Berkas>(`/berkas/${id}`);
  };

  /**
   * Membuat berkas baru
   * Endpoint: POST /berkas
   */
  const createBerkas = async (data: BerkasCreateInput): Promise<Berkas> => {
    return await apiPost<Berkas>("/berkas", data);
  };

  /**
   * Mengupdate data berkas
   * Endpoint: PUT /berkas/:id
   */
  const updateBerkas = async (
    id: string | number,
    data: BerkasUpdateInput,
  ): Promise<Berkas> => {
    return await apiPut<Berkas>(`/berkas/${id}`, data);
  };

  /**
   * Menghapus berkas
   * Endpoint: DELETE /berkas/:id
   */
  const deleteBerkas = async (
    id: string | number,
  ): Promise<{ message: string }> => {
    return await apiDelete(`/berkas/${id}`);
  };

  return {
    getBerkasList,
    getBerkasById,
    createBerkas,
    updateBerkas,
    deleteBerkas,
  };
};
