import { useApi } from "@/composables/useApi"; // Sesuaikan path
import type {
  KonsepPayload,
  RejectPayload,
  KonsepDetail,
} from "~/types/konsep";

export const useKonsep = () => {
  const { apiGet, apiPost } = useApi();

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
    return await apiGet<{ success: boolean; data: any[] }>(
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
  };
};
