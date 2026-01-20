import { z } from "zod";
import {
  DelegasiResponseSchema,
  JabatanResponseSchema,
  PersonilSchema,
  PositionStatusSchema,
  type DelegasiPayload,
} from "~/types/delegasi";

export const useDelegasi = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  // GET LIST
  const getDelegasiList = async (params: any) => {
    const res = await apiGet("/delegasi", { params });
    // Validasi opsional dengan Zod, atau return langsung
    return DelegasiResponseSchema.parse(res);
  };

  // GET DROPDOWN PERSONIL
  const getPersonilList = async () => {
    const res = await apiGet<{ data: any[] }>("/delegasi/personil");
    return z.array(PersonilSchema).parse(res.data);
  };

  // GET DROPDOWN JABATAN
  const getJabatanList = async () => {
    const res = await apiGet("/delegasi/jabatan");
    const parsed = JabatanResponseSchema.parse(res);
    return parsed.data;
  };

  // GET DROPDOWN STATUS JABATAN (Sebagai)
  const getPositionStatuses = async () => {
    const res = await apiGet<{ data: any[] }>("/delegasi/position-statuses");
    return z.array(PositionStatusSchema).parse(res.data);
  };

  // CREATE
  const createDelegasi = async (payload: DelegasiPayload) => {
    return await apiPost("/delegasi", payload);
  };

  // UPDATE
  const updateDelegasi = async (id: string, payload: DelegasiPayload) => {
    return await apiPut(`/delegasi/${id}`, payload);
  };

  // DELETE
  const deleteDelegasi = async (id: string) => {
    return await apiDelete(`/delegasi/${id}`);
  };

  // GET AVAILABLE ROLES (Untuk Dropdown di Navbar)
  const getAvailableRoles = async () => {
    const res = await apiGet<{
      success: boolean;
      data: { delegations: any[] };
    }>("/delegasi/available-roles");
    // Anda bisa membuat Zod Schema khusus untuk ini jika perlu validasi ketat
    return res.data.delegations || [];
  };

  // SWITCH ROLE
  // const switchRole = async (roleId: string) => {
  //   // Sesuaikan endpoint backend untuk switch role
  //   return await apiPost("/delegasi/switch-role", { id: roleId });
  // };

  return {
    getAvailableRoles,
    // switchRole,
    getDelegasiList,
    getPersonilList,
    getPositionStatuses,
    createDelegasi,
    updateDelegasi,
    deleteDelegasi,
    getJabatanList,
  };
};
