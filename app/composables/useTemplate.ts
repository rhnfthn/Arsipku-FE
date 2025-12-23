// composables/useTemplate.ts
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
  const { apiGet, apiDelete, api } = useApi();
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

      // ❌ JANGAN kirim field tanggal - API tidak menerima field ini

      console.log("📤 POST to /templates with FormData");
      console.log("Form data:", {
        nama_template: payload.nama_template,
        file_name: payload.file.name,
        file_size: payload.file.size,
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

      // Jika error message adalah array, join jadi string
      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      toast.add({
        title: "Gagal",
        description: finalMessage,
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
        // Jika tidak ada file baru, kirim JSON biasa (hanya nama template)
        const jsonData = {
          nama_template: payload.nama_template,
        };

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

      // Jika error message adalah array, join jadi string
      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      toast.add({
        title: "Gagal",
        description: finalMessage,
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

      // Jika error message adalah array, join jadi string
      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      toast.add({
        title: "Gagal",
        description: finalMessage,
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
