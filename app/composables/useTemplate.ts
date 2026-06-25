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
      const response = await apiGet<TemplateListResponse>("/templates", {}, { skipCache: true });

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetch templates:", error);

      toast.add({
        title: "Gagal memuat data",
        description: error?.message || "Tidak dapat mengambil daftar template",
        color: "error",
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

      if (!response.success || !response.data) {
        throw new Error("Template not found");
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetch template detail:", error);

      toast.add({
        title: "Gagal memuat detail",
        description: error?.message || "Tidak dapat mengambil detail template",
        color: "error",
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
      if (!payload.nama_template || !payload.file) {
        throw new Error("Nama template dan file wajib diisi");
      }

      const formData = new FormData();
      formData.append("nama_template", payload.nama_template);
      formData.append("file", payload.file);

      const response = await api.post<TemplateDetailResponse>(
        "/templates",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.add({
        title: "Berhasil ditambahkan",
        description: `Template "${payload.nama_template}" berhasil ditambahkan.`,
        color: "success",
      });

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error create template:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menambahkan template";

      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      toast.add({
        title: "Gagal menambahkan",
        description: finalMessage,
        color: "error",
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
      if (!payload.nama_template) {
        throw new Error("Nama template wajib diisi");
      }

      let response;

      if (payload.file instanceof File) {
        const formData = new FormData();
        formData.append("nama_template", payload.nama_template);
        formData.append("file", payload.file);

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
        response = await api.put<TemplateDetailResponse>(`/templates/${id}`, {
          nama_template: payload.nama_template,
        });
      }

      toast.add({
        title: "Berhasil diperbarui",
        description: `Template "${payload.nama_template}" berhasil diperbarui.`,
        color: "success",
      });

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error update template:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal memperbarui template";

      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      toast.add({
        title: "Gagal memperbarui",
        description: finalMessage,
        color: "error",
      });

      throw error;
    } finally {
      isLoadingUpdate.value = false;
    }
  };

  /** ===========================
   * DELETE TEMPLATE
   * =========================== */
  const deleteTemplate = async (
    id: string,
    name?: string,
  ): Promise<boolean> => {
    isLoadingDelete.value = true;
    try {
      const response = await apiDelete<TemplateDeleteResponse>(
        `/templates/${id}`,
      );

      toast.add({
        title: "Berhasil dihapus",
        description: name
          ? `Template "${name}" berhasil dihapus.`
          : response?.message || "Template berhasil dihapus.",
        color: "error",
      });

      return true;
    } catch (error: any) {
      console.error("❌ Error delete template:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menghapus template";

      const finalMessage = Array.isArray(errorMessage)
        ? errorMessage.join(", ")
        : errorMessage;

      toast.add({
        title: "Gagal menghapus",
        description: finalMessage,
        color: "error",
      });

      throw error;
    } finally {
      isLoadingDelete.value = false;
    }
  };

  return {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isLoadingList,
    isLoadingDetail,
    isLoadingCreate,
    isLoadingUpdate,
    isLoadingDelete,
  };
};
