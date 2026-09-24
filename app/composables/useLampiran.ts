import { useApi } from "@/composables/useApi";

export const useLampiran = () => {
  const { api } = useApi();

  const uploadLampiran = async (
    files: File[],
    onProgress?: (percent: number) => void,
  ) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("lampiran_files", file);
    });

    try {
      const response = await api.post("/upload-temporary", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      console.error("Gagal upload lampiran:", error);
      throw error;
    }
  };

  const deleteLampiran = async (id: string) => {
    try {
      const response = await api.delete(`/file-temporary/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Gagal hapus lampiran ${id}:`, error);
      throw error;
    }
  };

  const previewLampiran = async (id: string): Promise<Blob> => {
    const response = await api.get(`/preview-file/${id}`, {
      responseType: "blob",
    });
    return response.data;
  };

  return {
    uploadLampiran,
    deleteLampiran,
    previewLampiran,
  };
};
