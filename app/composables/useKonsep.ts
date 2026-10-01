import { useApi } from "@/composables/useApi";
import type {
  KonsepPayload,
  RejectPayload,
  KonsepDetail,
} from "~/types/konsep";

export const useKonsep = () => {
  const { apiGet, apiGetFresh, apiPost, apiPut, api } = useApi();

  const multipartConfig = {
    headers: { 'Content-Type': 'multipart/form-data' },
  };

  interface KonsepDetail {
    konsep: any;
    disposisi_referensi: any;
    current_workflow: any;
    naskah: any;
    penerima: any[];
    tembusan: any[];
    riwayat: any[];
    lampiran: any[];
    [key: string]: any;
  }

  // Fetch Detail Konsep
  const getKonsepDetail = async (id: string) => {
    return await apiGet<{ success: boolean; data: KonsepDetail }>(
      `/konsep/${id}`,
    );
  };

  // Fetch Recipients (Managerial / BOD)
  const getSendersById = async (pengirimId: string | number) => {
    return await apiGet<{ success: boolean; data: any[] }>(
      `/ND/get-senders?pengirim=${pengirimId}`,
    );
  };

  // Generate PDF Preview
  const previewPdf = async (formData: FormData) => {
    const res = await useApi().api.post("/KONSEP/preview-pdf", formData, {
      responseType: "blob",
    });
    return res.data;
  };

  const createKonsep = async (formData: FormData) => {
    // Endpoint sesuai request: /KONSEP/create
    return await apiPost("/KONSEP/create", formData);
  };

  // Draft KONSEP
  const createDraft = async (formData: FormData) => {
    return await apiPost("/KONSEP/draft/create", formData, multipartConfig);
  };

  const updateDraft = async (id: string, formData: FormData) => {
    return await apiPut(`/KONSEP/draft/update/${id}`, formData, multipartConfig);
  };

  const getKonsepDraftDetail = async (id: string) => {
    return await apiGetFresh<{ success: boolean; data: any }>(`/KONSEP/draft/detail/${id}`);
  };

  const getForwardTargetByPosition = async (
    positionId: string | number,
  ): Promise<any | null> => {
    const activePositionId = Number(positionId);
    if (!Number.isInteger(activePositionId) || activePositionId <= 0) return null;

    const currentResponse: any = await apiGetFresh(
      `/org-data/my-position?position_id=${encodeURIComponent(String(activePositionId))}`,
    );
    const currentPosition = currentResponse?.data?.position
      ? currentResponse.data
      : currentResponse;
    const directManagerId = Number(
      currentPosition?.direct_manager ?? currentPosition?.directManager,
    );
    let managerPosition: any = null;

    if (Number.isInteger(directManagerId) && directManagerId > 0) {
      const managerResponse: any = await apiGetFresh(
        `/org-data/my-position?position_id=${encodeURIComponent(String(directManagerId))}`,
      );
      managerPosition = managerResponse?.data?.position
        ? managerResponse.data
        : managerResponse;
    } else {
      // Sebagian posisi managerial (termasuk VP Legal) tidak memiliki
      // direct_manager pada organization_build. Gunakan atasan managerial
      // terdekat dalam divisi/direktorat yang sama sebagai sumber resmi.
      const hierarchyResponse: any = await apiGetFresh(
        `/org-data/atasan-managerial/${encodeURIComponent(String(activePositionId))}`,
      );
      managerPosition = Array.isArray(hierarchyResponse?.data)
        ? hierarchyResponse.data[0]
        : null;
    }

    const managerId = Number(managerPosition?.position || directManagerId);
    if (!Number.isInteger(managerId) || managerId <= 0) return null;

    return {
      position_id: String(managerPosition?.position || managerId),
      position_text:
        managerPosition?.position_text ||
        managerPosition?.positionText ||
        currentPosition?.direct_manager_text ||
        '',
      nama:
        managerPosition?.persnum_person_text ||
        managerPosition?.nama ||
        null,
      persnum:
        managerPosition?.persnum_person ||
        managerPosition?.persnum ||
        null,
    };
  };

  // Actions
const finalizeKonsep = async (id: string, formData: FormData) => {
  return await apiPost(`/KONSEP/finalize/${id}`, formData);
};

  const forwardKonsep = async (id: string, formData: FormData) => {
    return await apiPost(`/KONSEP/forward/${id}`, formData);
  };

  const rejectKonsep = async (id: string, payload: RejectPayload) => {
    return await apiPost(`/KONSEP/reject/${id}`, payload);
  };

  const getRecipientsBySender = async (senderPositionId: string | number) => {
    return await apiGet<{ success: boolean; data: any }>(
      `/ND/get-recipient?pengirim=${senderPositionId}`,
    );
  };

  return {
    getKonsepDetail,
    previewPdf,
    finalizeKonsep,
    forwardKonsep,
    rejectKonsep,
    createKonsep,
    getSendersById,
    getRecipientsBySender,
    createDraft,
    updateDraft,
    getKonsepDraftDetail,
    getForwardTargetByPosition,
  };
};
