import { useApi } from "@/composables/useApi"; // Sesuaikan path
import type {
  KonsepPayload,
  RejectPayload,
  KonsepDetail,
} from "~/types/konsep";

export const useKonsep = () => {
  const { apiGet, apiPost } = useApi();

  // Fetch Detail Konsep
  const getKonsepDetail = async (id: string) => {
    return await apiGet<{ success: boolean; data: KonsepDetail }>(
      `/konsep/${id}`,
    );
  };

  // Fetch Recipients (Managerial / BOD)
  const getManagerialRecipients = async () => {
    return await apiGet<{ success: boolean; data: any[] }>(
      "/org-data/pengirim/managerial",
    );
  };

  // Generate PDF Preview
  const previewPdf = async (formData: FormData) => {
    const res = await useApi().api.post("/KONSEP/preview-pdf", formData, {
      responseType: "blob",
    });
    return res.data;
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

  return {
    getKonsepDetail,
    getManagerialRecipients,
    previewPdf,
    finalizeKonsep,
    forwardKonsep,
    rejectKonsep,
  };
};
