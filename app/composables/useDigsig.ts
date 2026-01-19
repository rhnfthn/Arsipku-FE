import { ref } from "vue";
import type {
  DigsigLog,
  DigsigLogResponse,
  BsreHealthResponse,
  DigsigLogParams,
  DigsigDocument,
  DigsigDocumentResponse,
  DigsigDocumentDetailResponse,
  DigsigDocumentParams,
  CreateDocumentPayload,
  UpdateDocumentPayload,
  Klasifikasi,
  KlasifikasiResponse,
  JenisNaskah,
  JenisNaskahResponse,
  Verifikator,
  VerifikatorResponse,
  CekDokumenResponse,
} from "~/types/digsig";

export const useDigsig = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();

  const logs = ref<DigsigLog[]>([]);
  const documents = ref<DigsigDocument[]>([]);
  const documentDetail = ref<DigsigDocument | null>(null);
  const documentCheck = ref<CekDokumenResponse | null>(null);
  const meta = ref<any>(null);
  const bsreHealth = ref<BsreHealthResponse["data"] | null>(null);

  // Dropdown data
  const klasifikasiList = ref<Klasifikasi[]>([]);
  const jenisNaskahList = ref<JenisNaskah[]>([]);
  const verifikatorList = ref<Verifikator[]>([]);

  const loading = ref(false);
  const loadingHealth = ref(false);
  const loadingDetail = ref(false);
  const loadingKlasifikasi = ref(false);
  const loadingJenisNaskah = ref(false);
  const loadingVerifikator = ref(false);
  const loadingCheck = ref(false);
  const error = ref<string | null>(null);

  /* ======================
   * FETCH LOGS
   * GET /digsig/log
   * ====================== */
  const fetchLogs = async (params?: DigsigLogParams) => {
    loading.value = true;
    error.value = null;

    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);

      const url = `/digsig/log${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await apiGet<DigsigLogResponse>(url);

      if (res.success && res.data) {
        logs.value = res.data.data;
        meta.value = res.data.meta;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch logs";
      console.error("❌ fetchLogs error:", err);
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * FETCH BSRE HEALTH
   * GET /digsig/log/bsre-health
   * ====================== */
  const fetchBsreHealth = async () => {
    loadingHealth.value = true;
    error.value = null;

    try {
      const res = await apiGet<BsreHealthResponse>("/digsig/log/bsre-health");

      if (res.success && res.data) {
        bsreHealth.value = res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch BsrE health status";
      console.error("❌ fetchBsreHealth error:", err);
    } finally {
      loadingHealth.value = false;
    }
  };

  /* ======================
   * FETCH DOCUMENTS
   * GET /digsig/document
   * ====================== */
  const fetchDocuments = async (params?: DigsigDocumentParams) => {
    loading.value = true;
    error.value = null;

    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);

      const url = `/digsig/document${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await apiGet<DigsigDocumentResponse>(url);

      if (res.success && res.data) {
        documents.value = res.data.data;
        meta.value = {
          total: res.data.total,
          page: res.data.page,
          limit: res.data.limit,
          totalPages: res.data.totalPages,
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch documents";
      console.error("❌ fetchDocuments error:", err);
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * FETCH DOCUMENT DETAIL
   * GET /digsig/document/:id
   * ====================== */
  const fetchDocumentDetail = async (id: string) => {
    loadingDetail.value = true;
    error.value = null;

    try {
      const res = await apiGet<DigsigDocumentDetailResponse>(
        `/digsig/document/${id}`,
      );

      if (res.success && res.data) {
        documentDetail.value = res.data;
        return res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch document detail";
      console.error("❌ fetchDocumentDetail error:", err);
      return null;
    } finally {
      loadingDetail.value = false;
    }
  };

  /* ======================
   * CREATE DOCUMENT
   * POST /digsig/document
   * ====================== */
  const createDocument = async (payload: CreateDocumentPayload) => {
    loading.value = true;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append("tanggalDokumen", payload.tanggalDokumen);
      formData.append("klasifikasi", payload.klasifikasi);
      formData.append("jenisNaskah", payload.jenisNaskah);
      formData.append("nomorDokumen", payload.nomorDokumen);
      formData.append("perihal", payload.perihal);
      formData.append("file", payload.file);
      formData.append("visibleSign", payload.visibleSign.toString());
      formData.append("signers", JSON.stringify(payload.signers));

      const res = await api.post<DigsigDocumentDetailResponse>(
        "/digsig/document",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error("Failed to create document");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to create document";
      console.error("❌ createDocument error:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * UPDATE DOCUMENT
   * PUT /digsig/document/:id
   * ====================== */
  const updateDocument = async (id: string, payload: UpdateDocumentPayload) => {
    loading.value = true;
    error.value = null;

    try {
      const formData = new FormData();

      if (payload.tanggalDokumen)
        formData.append("tanggalDokumen", payload.tanggalDokumen);
      if (payload.klasifikasi)
        formData.append("klasifikasi", payload.klasifikasi);
      if (payload.jenisNaskah)
        formData.append("jenisNaskah", payload.jenisNaskah);
      if (payload.nomorDokumen)
        formData.append("nomorDokumen", payload.nomorDokumen);
      if (payload.perihal) formData.append("perihal", payload.perihal);
      if (payload.file) formData.append("file", payload.file);
      if (payload.visibleSign !== undefined)
        formData.append("visibleSign", payload.visibleSign.toString());
      if (payload.signers)
        formData.append("signers", JSON.stringify(payload.signers));

      const res = await api.put<DigsigDocumentDetailResponse>(
        `/digsig/document/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error("Failed to update document");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to update document";
      console.error("❌ updateDocument error:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * DELETE DOCUMENT
   * DELETE /digsig/document/:id
   * ====================== */
  const deleteDocument = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const res = await apiDelete(`/digsig/document/${id}`);

      if (res.success) {
        return true;
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to delete document";
      console.error("❌ deleteDocument error:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * CHECK DOCUMENT
   * POST /digsig/cek-dokumen/upload
   * ====================== */
  const checkDocument = async (file: File) => {
    loadingCheck.value = true;
    error.value = null;
    documentCheck.value = null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post<CekDokumenResponse>(
        "/digsig/cek-dokumen/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success && res.data.data) {
        documentCheck.value = res.data;
        return res.data;
      } else {
        throw new Error(res.data.message || "Failed to check document");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to check document";
      console.error("❌ checkDocument error:", err);
      throw err;
    } finally {
      loadingCheck.value = false;
    }
  };

  /* ======================
   * FETCH KLASIFIKASI
   * GET /persuratan/klasifikasi
   * ====================== */
  const fetchKlasifikasi = async () => {
    loadingKlasifikasi.value = true;
    error.value = null;

    try {
      const res = await apiGet<KlasifikasiResponse>("/persuratan/klasifikasi");

      if (res.success && res.data) {
        klasifikasiList.value = res.data.filter(
          (k) => !k.klasifikasi.includes("."),
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch klasifikasi";
      console.error("❌ fetchKlasifikasi error:", err);
    } finally {
      loadingKlasifikasi.value = false;
    }
  };

  /* ======================
   * FETCH JENIS NASKAH
   * GET /jenis
   * ====================== */
  const fetchJenisNaskah = async () => {
    loadingJenisNaskah.value = true;
    error.value = null;

    try {
      const res = await apiGet<JenisNaskahResponse>("/jenis");

      if (res.success && res.data) {
        jenisNaskahList.value = res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch jenis naskah";
      console.error("❌ fetchJenisNaskah error:", err);
    } finally {
      loadingJenisNaskah.value = false;
    }
  };

  /* ======================
   * FETCH VERIFIKATOR
   * GET /digsig/document/verifikator
   * ====================== */
  const fetchVerifikator = async () => {
    loadingVerifikator.value = true;
    error.value = null;

    try {
      const res = await apiGet<VerifikatorResponse>(
        "/digsig/document/verifikator",
      );

      if (res.success && res.data) {
        verifikatorList.value = res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch verifikator";
      console.error("❌ fetchVerifikator error:", err);
    } finally {
      loadingVerifikator.value = false;
    }
  };

  return {
    // State
    logs,
    documents,
    documentDetail,
    documentCheck,
    meta,
    bsreHealth,
    klasifikasiList,
    jenisNaskahList,
    verifikatorList,
    loading,
    loadingHealth,
    loadingDetail,
    loadingKlasifikasi,
    loadingJenisNaskah,
    loadingVerifikator,
    loadingCheck,
    error,

    // Methods
    fetchLogs,
    fetchBsreHealth,
    fetchDocuments,
    fetchDocumentDetail,
    createDocument,
    updateDocument,
    deleteDocument,
    checkDocument,
    fetchKlasifikasi,
    fetchJenisNaskah,
    fetchVerifikator,
  };
};
