// composables/useTemplate.ts
import type { TemplateSurat, TemplatePayload } from "~/types/templates";

export const useTemplate = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  // GET: Ambil template berdasarkan Position ID
  const getTemplatesByPosition = async (
    positionId: string,
  ): Promise<TemplateSurat[]> => {
    try {
      const res = await apiGet<any>(`/templates/position/${positionId}`);
      return Array.isArray(res) ? res : res.data || [];
    } catch (error) {
      console.error("Gagal mengambil template:", error);
      throw error;
    }
  };

  // POST: Simpan template baru
  const createTemplate = async (payload: TemplatePayload) => {
    return await apiPost("/templates", payload);
  };

  // PUT: Edit template
  const updateTemplate = async (id: string, payload: TemplatePayload) => {
    return await apiPut(`/templates/${id}`, payload);
  };

  // DELETE: Hapus template
  const deleteTemplateById = async (id: string) => {
    return await apiDelete(`/templates/${id}`);
  };

  return {
    getTemplatesByPosition,
    createTemplate,
    updateTemplate,
    deleteTemplateById,
import { ref } from "vue";
import { useApi } from "./useApi";
import type {
  Template,
  TemplateListResponse,
  TemplateDetailResponse,
  TemplateCreatePayload,
  TemplateUpdatePayload,
  TemplateDeleteResponse,
} from "~/types/template";

export const useTemplate = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();
  const toast = useToast();

  const isLoadingList = ref(false);
  const isLoadingDetail = ref(false);
  const isLoadingCreate = ref(false);
  const isLoadingUpdate = ref(false);
  const isLoadingDelete = ref(false);

  /** ===========================
   * GET LIST TEMPLATES
   * =========================== */
  const getTemplates = async (): Promise<Template[]> => {
    isLoadingList.value = true;
    try {
      const response = await apiGet<TemplateListResponse>("/templates");

      console.log("✅ Templates loaded:", response);

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetch templates:", error);

      toast.add({
        title: "Gagal memuat data",
        description: error?.message || "Tidak dapat mengambil daftar template",
        color: "red",
      });

      return [];
    } finally {
      isLoadingList.value = false;
    }
  };

  /** ===========================
   * GET TEMPLATE DETAIL
   * =========================== */
  const getTemplateById = async (id: string): Promise<Template | null> => {
    isLoadingDetail.value = true;
    try {
      const response = await apiGet<TemplateDetailResponse>(`/templates/${id}`);

      console.log("✅ Template detail loaded:", response);

      if (!response.success || !response.data) {
        throw new Error("Template not found");
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetch template detail:", error);

      toast.add({
        title: "Gagal memuat detail",
        description: error?.message || "Tidak dapat mengambil detail template",
        color: "red",
      });

      return null;
    } finally {
      isLoadingDetail.value = false;
    }
  };

  /** ===========================
   * CREATE TEMPLATE
   * =========================== */
  const createTemplate = async (
    payload: TemplateCreatePayload,
  ): Promise<Template | null> => {
    isLoadingCreate.value = true;
    try {
      console.log("🚀 Creating template:", payload);

      // Validasi
      if (!payload.nama_template || !payload.file) {
        throw new Error("Nama template dan file wajib diisi");
      }

      // Buat FormData untuk upload file
      const formData = new FormData();
      formData.append("nama_template", payload.nama_template);
      formData.append("file", payload.file);

      // Tambahkan tanggal jika ada, jika tidak gunakan tanggal hari ini
      const tanggal = payload.tanggal || new Date().toISOString().split("T")[0];
      formData.append("tanggal", tanggal);

      console.log("📤 POST to /templates with FormData");
      console.log("Form data:", {
        nama_template: payload.nama_template,
        file_name: payload.file.name,
        file_size: payload.file.size,
        tanggal: tanggal,
      });

      // Gunakan axios langsung untuk multipart/form-data
      const response = await api.post<TemplateDetailResponse>(
        "/templates",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("✅ Template created:", response.data);

      toast.add({
        title: "Berhasil",
        description: "Template berhasil ditambahkan",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error create template:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menambahkan template";

      toast.add({
        title: "Gagal",
        description: errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingCreate.value = false;
    }
  };

  /** ===========================
   * UPDATE TEMPLATE
   * =========================== */
  const updateTemplate = async (
    id: string,
    payload: TemplateUpdatePayload,
  ): Promise<Template | null> => {
    isLoadingUpdate.value = true;
    try {
      console.log("🔄 Updating template:", id, payload);

      // Validasi
      if (!payload.nama_template) {
        throw new Error("Nama template wajib diisi");
      }

      let response;

      // Jika ada file baru (File object), gunakan FormData
      if (payload.file instanceof File) {
        const formData = new FormData();
        formData.append("nama_template", payload.nama_template);
        formData.append("file", payload.file);

        console.log("📤 PUT to /templates/" + id + " with new file");
        console.log("Form data:", {
          nama_template: payload.nama_template,
          file_name: payload.file.name,
          file_size: payload.file.size,
        });

        response = await api.put<TemplateDetailResponse>(
          `/templates/${id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      } else {
        // Jika tidak ada file baru, kirim JSON biasa
        const jsonData: any = {
          nama_template: payload.nama_template,
        };

        // Hanya kirim file jika ada (file path string)
        if (payload.file && typeof payload.file === "string") {
          jsonData.file = payload.file;
        }

        console.log("📤 PUT to /templates/" + id + " (JSON only)");
        console.log("JSON data:", jsonData);

        response = await api.put<TemplateDetailResponse>(
          `/templates/${id}`,
          jsonData,
        );
      }

      console.log("✅ Template updated:", response.data);

      toast.add({
        title: "Berhasil",
        description: "Template berhasil diperbarui",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error update template:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal memperbarui template";

      toast.add({
        title: "Gagal",
        description: errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingUpdate.value = false;
    }
  };

  /** ===========================
   * DELETE TEMPLATE
   * =========================== */
  const deleteTemplate = async (id: string): Promise<boolean> => {
    isLoadingDelete.value = true;
    try {
      console.log("🗑️ Deleting template:", id);

      const response = await apiDelete<TemplateDeleteResponse>(
        `/templates/${id}`,
      );

      console.log("✅ Template deleted:", response);

      toast.add({
        title: "Berhasil",
        description: response?.message || "Template berhasil dihapus",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      return true;
    } catch (error: any) {
      console.error("❌ Error delete template:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menghapus template";

      toast.add({
        title: "Gagal",
        description: errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingDelete.value = false;
    }
  };

  return {
    // Functions
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Loading states
    isLoadingList,
    isLoadingDetail,
    isLoadingCreate,
    isLoadingUpdate,
    isLoadingDelete,
  };
};
