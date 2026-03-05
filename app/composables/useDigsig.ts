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
  PenandatangananDocument,
  PenandatangananResponse,
  PenandatangananDetailResponse,
  DigsigConfigResponse,
} from "~/types/digsig";

export const useDigsig = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();

  const logs = ref<DigsigLog[]>([]);
  const documents = ref<DigsigDocument[]>([]);
  const documentDetail = ref<DigsigDocument | null>(null);
  const documentCheck = ref<CekDokumenResponse | null>(null);
  const meta = ref<any>(null);
  const bsreHealth = ref<BsreHealthResponse["data"] | null>(null);

  // BsrE Alert state
  const bsreAlert = ref<{
    isActive: boolean;
    message: string | null;
    activatedAt: string | null;
    activatedByName: string | null;
  } | null>(null);

  // --- NEW: Digsig Config State ---
  const digsigConfig = ref<any[]>([]);

  // Penandatanganan
  const penandatanganDocuments = ref<PenandatangananDocument[]>([]);
  const penandatanganDetail = ref<PenandatangananDocument | null>(null);
  const penandatanganMeta = ref<any>(null);
  const penandatanganSummary = ref<any>(null);

  // Dropdown data
  const klasifikasiList = ref<Klasifikasi[]>([]);
  const jenisNaskahList = ref<JenisNaskah[]>([]);
  const verifikatorList = ref<Verifikator[]>([]);
  const userEnik = ref<string | null>(null);
  const klasifikasiDetail = ref<Klasifikasi | null>(null);

  const loading = ref(false);
  const loadingHealth = ref(false);
  const loadingDetail = ref(false);
  const loadingKlasifikasi = ref(false);
  const loadingJenisNaskah = ref(false);
  const loadingVerifikator = ref(false);
  const loadingCheck = ref(false);
  const loadingEnik = ref(false);
  const loadingAlert = ref(false);
  const loadingDigsigConfig = ref(false); // New Loading State
  const error = ref<string | null>(null);

  /* ======================
   * FETCH DIGSIG CONFIG
   * GET /admin/config/digsig
   * ====================== */
  const fetchDigsigConfig = async () => {
    loadingDigsigConfig.value = true;
    error.value = null;

    try {
      const res = await apiGet<{ success: boolean; data: any[] }>("/admin/config/digsig");
      if (res.success && res.data) {
        digsigConfig.value = res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch digsig config";
      console.error("❌ fetchDigsigConfig error:", err);
    } finally {
      loadingDigsigConfig.value = false;
    }
  };

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
      if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

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
   * FETCH BSRE ALERT
   * GET /digsig/log/bsre-alert
   * ====================== */
  const fetchBsreAlert = async () => {
    loadingAlert.value = true;
    error.value = null;

    try {
      const res = await apiGet<{
        success: boolean;
        data: {
          isActive: boolean;
          message: string | null;
          activatedAt: string | null;
          activatedByName: string | null;
        };
      }>("/digsig/log/bsre-alert");

      if (res.success && res.data) {
        bsreAlert.value = res.data;
        console.log("✅ BsrE Alert status:", res.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch BsrE alert status";
      console.error("❌ fetchBsreAlert error:", err);
    } finally {
      loadingAlert.value = false;
    }
  };

  /* ======================
   * ACTIVATE BSRE ALERT
   * POST /digsig/log/bsre-alert/activate
   * ====================== */
  const activateBsreAlert = async (message: string) => {
    loadingAlert.value = true;
    error.value = null;

    try {
      console.log("📤 Activating BsrE alert:", { message });

      const res = await apiPost<{
        success: boolean;
        message: string;
        data: {
          isActive: boolean;
          message: string;
          activatedAt: string;
          activatedByName: string;
        };
      }>("/digsig/log/bsre-alert/activate", { message });

      console.log("✅ BsrE Alert activated:", res);

      if (res.success && res.data) {
        bsreAlert.value = res.data;
        return res;
      } else {
        throw new Error(res.message || "Failed to activate BsrE alert");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to activate BsrE alert";
      console.error("❌ activateBsreAlert error:", err);
      useToast().add({
        title: "Gagal",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Gagal mengaktifkan alert",
        color: "error",
      });
      throw err;
    } finally {
      loadingAlert.value = false;
    }
  };

  /* ======================
   * DEACTIVATE BSRE ALERT
   * POST /digsig/log/bsre-alert/deactivate
   * ====================== */
  const deactivateBsreAlert = async () => {
    loadingAlert.value = true;
    error.value = null;

    try {
      console.log("📤 Deactivating BsrE alert");

      const res = await apiPost<{
        success: boolean;
        message: string;
        data: {
          isActive: boolean;
          message: null;
          activatedAt: null;
          activatedByName: null;
        };
      }>("/digsig/log/bsre-alert/deactivate", {});

      console.log("✅ BsrE Alert deactivated:", res);

      if (res.success && res.data) {
        bsreAlert.value = res.data;
        return res;
      } else {
        throw new Error(res.message || "Failed to deactivate BsrE alert");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to deactivate BsrE alert";
      console.error("❌ deactivateBsreAlert error:", err);
      useToast().add({
        title: "Gagal",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Gagal menonaktifkan alert",
        color: "error",
      });
      throw err;
    } finally {
      loadingAlert.value = false;
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
      useToast().add({
        title: "Gagal",
        description: err?.message || "Gagal memuat dokumen",
        color: "error",
      });
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
      useToast().add({
        title: "Gagal",
        description: err?.message || "Gagal memuat detail dokumen",
        color: "error",
      });
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

      const cleanSigners = payload.signers.map((s) => ({
        urutan: Number(s.urutan),
        persnum: Number(s.persnum),
      }));

      formData.append("signers", JSON.stringify(cleanSigners));

      console.log("📤 Creating document with signers:", cleanSigners);

      const res = await api.post<DigsigDocumentDetailResponse>(
        "/digsig/document",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("✅ Document created:", res.data);

      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || "Failed to create document");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create document";
      console.error("❌ createDocument error:", err);
      console.error("❌ Error response:", err?.response?.data);
      useToast().add({
        title: "Gagal",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Gagal menyimpan dokumen",
        color: "error",
      });
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

      if (payload.signers) {
        const cleanSigners = payload.signers.map((s) => ({
          urutan: Number(s.urutan),
          persnum: Number(s.persnum),
        }));
        formData.append("signers", JSON.stringify(cleanSigners));

        console.log("📤 Updating document with signers:", cleanSigners);
      }

      const res = await api.put<DigsigDocumentDetailResponse>(
        `/digsig/document/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("✅ Document updated:", res.data);

      if (res.data.success) {
        return res.data.data;
      } else {
        throw new Error(res.data.message || "Failed to update document");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update document";
      console.error("❌ updateDocument error:", err);
      console.error("❌ Error response:", err?.response?.data);
      useToast().add({
        title: "Gagal",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Gagal menyimpan dokumen",
        color: "error",
      });
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
   * FETCH PENANDATANGANAN DOCUMENTS
   * GET /digsig/penandatanganan
   * ====================== */
  const fetchPenandatanganDocuments = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status) queryParams.append("status", params.status);

      const url = `/digsig/penandatanganan${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const res = await apiGet<PenandatangananResponse>(url);

      if (res.success && res.data) {
        penandatanganDocuments.value = res.data.data;
        penandatanganMeta.value = {
          total: res.data.total,
          page: res.data.page,
          limit: res.data.limit,
          totalPages: res.data.totalPages,
        };
        penandatanganSummary.value = res.data.summary;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch penandatanganan documents";
      console.error("❌ fetchPenandatanganDocuments error:", err);
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * FETCH PENANDATANGANAN DETAIL
   * GET /digsig/penandatanganan/:id
   * ====================== */
  const fetchPenandatanganDetail = async (id: string) => {
    loadingDetail.value = true;
    error.value = null;
    penandatanganDetail.value = null;

    try {
      const url = `/digsig/penandatanganan/${id}`;
      const res = await apiGet<PenandatangananDetailResponse>(url);

      if (res.success && res.data) {
        penandatanganDetail.value = res.data;
        return res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch penandatanganan detail";
      console.error("❌ fetchPenandatanganDetail error:", err);
      return null;
    } finally {
      loadingDetail.value = false;
    }
  };

  /* ======================
   * SIGN DOCUMENT
   * POST /digsig/penandatanganan/:id/sign
   * ====================== */
  const signDocument = async (
    id: string,
    payload: { passphrase: string; keterangan?: string },
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const body: any = {
        passphrase: payload.passphrase,
      };

      if (payload.keterangan) {
        body.keterangan = payload.keterangan;
      }

      console.log("📤 Signing document:", id, body);

      const res = await apiPost(`/digsig/penandatanganan/${id}/sign`, body);

      console.log("✅ Document signed:", res);

      if (res.success) {
        return res;
      } else {
        throw new Error(res.message || "Failed to sign document");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to sign document";
      console.error("❌ signDocument error:", err);
      useToast().add({
        title: "Gagal",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Gagal menandatangani dokumen",
        color: "error",
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * REJECT DOCUMENT
   * POST /digsig/penandatanganan/:id/reject
   * ====================== */
  const rejectDocument = async (id: string, alasan: string) => {
    loading.value = true;
    error.value = null;

    try {
      console.log("📤 Rejecting document:", id, { alasan });

      const res = await apiPost(`/digsig/penandatanganan/${id}/reject`, {
        alasan,
      });

      console.log("✅ Document rejected:", res);

      if (res.success) {
        return res;
      } else {
        throw new Error(res.message || "Failed to reject document");
      }
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reject document";
      console.error("❌ rejectDocument error:", err);
      throw err;
    } finally {
      loading.value = false;
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
        console.log("✅ Klasifikasi loaded:", klasifikasiList.value.length);
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
   * FETCH KLASIFIKASI DETAIL
   * GET /persuratan/klasifikasi/:id
   * ====================== */
  const fetchKlasifikasiDetail = async (id: string) => {
    loadingKlasifikasi.value = true;
    error.value = null;

    try {
      const res = await apiGet<{ success: boolean; data: Klasifikasi }>(
        `/persuratan/klasifikasi/${id}`,
      );

      if (res.success && res.data) {
        klasifikasiDetail.value = res.data;
        console.log("✅ Klasifikasi detail loaded:", res.data);
        return res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch klasifikasi detail";
      console.error("❌ fetchKlasifikasiDetail error:", err);
      useToast().add({
        title: "Gagal",
        description: err?.message || "Gagal memuat detail klasifikasi",
        color: "error",
      });
      return null;
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
        console.log("✅ Jenis Naskah loaded:", jenisNaskahList.value.length);
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
        console.log("✅ Verifikator loaded:", verifikatorList.value.length);
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

  /* ======================
   * FETCH USER E-NIK
   * GET /digsig/ktp
   * ====================== */
  const fetchUserEnik = async () => {
    loadingEnik.value = true;
    error.value = null;

    try {
      const res = await apiGet<{ success: boolean; data: { noktp: string } }>(
        "/digsig/ktp",
      );

      if (res.success && res.data) {
        userEnik.value = res.data.noktp;
        console.log("✅ User E-NIK loaded:", userEnik.value);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch E-NIK";
      console.error("❌ fetchUserEnik error:", err);
    } finally {
      loadingEnik.value = false;
    }
  };

  /* ======================
   * TOAST HELPERS — UI LEVEL
   * ====================== */
  const showToastSignerAdded = (nama: string) => {
    useToast().add({
      title: "Berhasil",
      description: `${nama} ditambahkan sebagai Penanda Tangan`,
      color: "success",
    });
  };

  const showToastSignerRemoved = (nama: string) => {
    useToast().add({
      title: "Info",
      description: `${nama} dihapus dari daftar Penanda Tangan`,
      color: "warning",
    });
  };

  const showToastFileTooLarge = () => {
    useToast().add({
      title: "Gagal",
      description: "Ukuran file maksimal 10MB",
      color: "error",
    });
  };

  const showToastFileSelected = (nama: string) => {
    useToast().add({
      title: "Berhasil",
      description: `File "${nama}" berhasil dipilih`,
      color: "success",
    });
  };

  const showToastFileNotAvailable = () => {
    useToast().add({
      title: "Gagal",
      description: "File pratinjau tidak tersedia",
      color: "error",
    });
  };

  const showToastGagalPreview = () => {
    useToast().add({
      title: "Gagal",
      description: "Gagal memuat pratinjau dokumen",
      color: "error",
    });
  };

  const showToastValidasiForm = (field: string) => {
    useToast().add({
      title: "Gagal",
      description: field,
      color: "error",
    });
  };

  const showToastDokumenCreated = () => {
    useToast().add({
      title: "Berhasil",
      description: "Dokumen berhasil dibuat",
      color: "success",
    });
  };

  const showToastDokumenUpdated = () => {
    useToast().add({
      title: "Berhasil",
      description: "Dokumen berhasil diperbarui",
      color: "success",
    });
  };

  const showToastAlertPesanKosong = () => {
    useToast().add({
      title: "Gagal",
      description: "Pesan alert tidak boleh kosong",
      color: "error",
    });
  };

  const showToastAlertActivated = () => {
    useToast().add({
      title: "Berhasil",
      description: "Alert gangguan BsrE berhasil diaktifkan",
      color: "success",
    });
  };

  const showToastAlertDeactivated = () => {
    useToast().add({
      title: "Berhasil",
      description: "Alert gangguan BsrE berhasil dinonaktifkan",
      color: "success",
    });
  };

  const showToastDataTidakValid = () => {
    useToast().add({
      title: "Gagal",
      description: "Data dokumen tidak valid",
      color: "error",
    });
  };

  const showToastDokumenSigned = () => {
    useToast().add({
      title: "Berhasil",
      description: "Dokumen berhasil ditandatangani",
      color: "success",
    });
  };

  const showToastDokumenRejected = () => {
    useToast().add({
      title: "Berhasil",
      description: "Dokumen berhasil ditolak",
      color: "success",
    });
  };

  const getConfigDigsig = async (param: string): Promise<DigsigConfigResponse> => {
    try {
      const response = await apiGet<DigsigConfigResponse>(`/config/digsig/${param}`);
      return response;
    } catch (error) {
      console.error(`[useDigsig] Gagal mengambil config digsig untuk ${param}:`, error);
      throw error;
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
    bsreAlert,
    digsigConfig, // EXPORTED CONFIG STATE
    klasifikasiList,
    klasifikasiDetail,
    jenisNaskahList,
    verifikatorList,
    userEnik,
    getConfigDigsig,

    // Penandatanganan state
    penandatanganDocuments,
    penandatanganDetail,
    penandatanganMeta,
    penandatanganSummary,

    loading,
    loadingHealth,
    loadingDetail,
    loadingKlasifikasi,
    loadingJenisNaskah,
    loadingVerifikator,
    loadingCheck,
    loadingEnik,
    loadingAlert,
    loadingDigsigConfig, // EXPORTED CONFIG LOADING
    error,

    // Methods
    fetchDigsigConfig, // EXPORTED CONFIG METHOD
    fetchLogs,
    fetchBsreHealth,
    fetchBsreAlert,
    activateBsreAlert,
    deactivateBsreAlert,
    fetchDocuments,
    fetchDocumentDetail,
    createDocument,
    updateDocument,
    deleteDocument,
    checkDocument,

    // Penandatanganan methods
    fetchPenandatanganDocuments,
    fetchPenandatanganDetail,
    signDocument,
    rejectDocument,

    fetchKlasifikasi,
    fetchKlasifikasiDetail,
    fetchJenisNaskah,
    fetchVerifikator,
    fetchUserEnik,

    // Toast helpers
    showToastSignerAdded,
    showToastSignerRemoved,
    showToastFileTooLarge,
    showToastFileSelected,
    showToastFileNotAvailable,
    showToastGagalPreview,
    showToastValidasiForm,
    showToastDokumenCreated,
    showToastDokumenUpdated,
    showToastAlertPesanKosong,
    showToastAlertActivated,
    showToastAlertDeactivated,
  };
};
