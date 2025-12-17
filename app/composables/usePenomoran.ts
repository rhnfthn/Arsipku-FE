// composables/usePenomoran.ts
import { ref } from "vue";
import { useApi } from "./useApi";
import type { PenomoranPayload, PenomoranResponse } from "~/types/penomoran";

export const usePenomoran = () => {
  const { get, post, del } = useApi();
  const toast = useToast();

  const isLoadingPenomoran = ref(false);
  const isLoadingBooking = ref(false);
  const isLoadingList = ref(false);
  const isLoadingSubmitted = ref(false);

  /** ===========================
   * SAVE PENOMORAN - NEW ENDPOINT
   * =========================== */
  const savePenomoran = async (
    payload: PenomoranPayload,
  ): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true;

    try {
      console.log(
        "🚀 savePenomoran called with:",
        JSON.stringify(payload, null, 2),
      );

      if (!payload.tanggal) throw new Error("Tanggal tidak boleh kosong");

      // ✅ Format payload untuk endpoint baru: /admin/nomor
      const formattedPayload = {
        position_id: parseInt(String(payload.position_id), 10),
        tanggal:
          payload.tanggal instanceof Date
            ? payload.tanggal.toISOString().split("T")[0]
            : String(payload.tanggal),
        jenis: String(payload.jenis),
        klasifikasi: String(payload.klasifikasi),
        perihal: String(payload.perihal),
        jumlah: parseInt(String(payload.jumlah), 10),
        penandatangan: String(payload.penandatangan),
        id_position_penandatangan: parseInt(
          String(payload.id_position_penandatangan),
          10,
        ),
      };

      // Validasi final
      if (isNaN(formattedPayload.id_position_penandatangan)) {
        throw new Error(
          `id_position_penandatangan tidak valid: ${payload.id_position_penandatangan}`,
        );
      }

      if (isNaN(formattedPayload.position_id)) {
        throw new Error(`position_id tidak valid: ${payload.position_id}`);
      }

      console.log(
        "📤 POST to /admin/nomor:",
        JSON.stringify(formattedPayload, null, 2),
      );
      console.log("🔍 Types check:", {
        position_id: typeof formattedPayload.position_id,
        id_position_penandatangan:
          typeof formattedPayload.id_position_penandatangan,
        jumlah: typeof formattedPayload.jumlah,
        tanggal: typeof formattedPayload.tanggal,
      });

      // ✅ Call NEW endpoint
      const response = await post("/admin/nomor", formattedPayload);

      console.log("✅ Response from backend:", response);

      toast.add({
        title: "Berhasil",
        description: "Penomoran berhasil disimpan.",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 2500,
      });

      return response.data ?? response;
    } catch (error: any) {
      console.error("❌ savePenomoran error:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error data:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menyimpan penomoran.";

      toast.add({
        title: "Gagal",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingPenomoran.value = false;
    }
  };

  /** ===========================
   * SAVE PENOMORAN REQUEST - OLD ENDPOINT (Keep for backward compatibility)
   * =========================== */
  const savePenomoranRequest = async (
    payload: PenomoranPayload,
  ): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true;

    try {
      console.log(
        "🚀 savePenomoranRequest called with:",
        JSON.stringify(payload, null, 2),
      );

      if (!payload.tanggal) throw new Error("Tanggal tidak boleh kosong");

      // ✅ Pastikan semua field adalah tipe data yang benar
      const formattedPayload = {
        position_id: parseInt(String(payload.position_id), 10),
        tanggal: String(payload.tanggal),
        jenis: String(payload.jenis),
        klasifikasi: String(payload.klasifikasi),
        perihal: String(payload.perihal),
        penandatangan: String(payload.penandatangan),
        id_position_penandatangan: parseInt(
          String(payload.id_position_penandatangan),
          10,
        ),
        jumlah: parseInt(String(payload.jumlah), 10),
      };

      // Validasi final
      if (isNaN(formattedPayload.id_position_penandatangan)) {
        throw new Error(
          `id_position_penandatangan tidak valid: ${payload.id_position_penandatangan}`,
        );
      }

      console.log(
        "📤 POST to /nomor-request:",
        JSON.stringify(formattedPayload, null, 2),
      );

      const response = await post("/nomor-request", formattedPayload);

      console.log("✅ Response from backend:", response);

      toast.add({
        title: "Berhasil",
        description: "Penomoran berhasil disimpan.",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 2500,
      });

      return response.data ?? response;
    } catch (error: any) {
      console.error("❌ savePenomoranRequest error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menyimpan penomoran.";

      toast.add({
        title: "Gagal",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingPenomoran.value = false;
    }
  };

  /** ===========================
   * SUBMIT BOOKING
   * =========================== */
  interface BookingFile {
    file_name: string;
    file_text: string;
  }
  interface BookingPayload {
    files: BookingFile[];
  }

  const submitBooking = async (
    id_request: number | string,
    payload: BookingPayload,
  ) => {
    isLoadingBooking.value = true;

    try {
      const formData = new FormData();

      payload.files.forEach((file) => {
        if (file?.file_text) {
          const byteString = atob(file.file_text);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const uint8Array = new Uint8Array(arrayBuffer);

          for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
          }

          const blob = new Blob([uint8Array], {
            type: "application/octet-stream",
          });

          formData.append("files", blob, file.file_name);
        }
      });

      const response = await post(
        `/admin/nomor-request/${id_request}/booking`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.add({
        title: "Berhasil",
        description:
          "Usulan berhasil dikirim. Status diperbarui menjadi 'Menunggu Verifikasi'.",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      return response.data ?? response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal mengirim usulan.";

      toast.add({
        title: "Gagal",
        description: errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingBooking.value = false;
    }
  };

  /** ===========================
   * GET LIST NOMOR (For Table)
   * =========================== */
  const getListNomor = async () => {
    isLoadingList.value = true;
    try {
      const res = await get("/admin/nomor");
      return res.data ?? [];
    } catch (e: any) {
      console.error("❌ Error ambil list nomor:", e);
      toast.add({
        title: "Gagal fetch data",
        description: e.message || "Gagal mengambil daftar nomor",
        color: "red",
      });
      return [];
    } finally {
      isLoadingList.value = false;
    }
  };

  /** ===========================
   * GET LIST USULAN
   * =========================== */
  const getListUsulan = async () => {
    isLoadingList.value = true;
    try {
      const res = await get("/admin/nomor-request");
      return res.data ?? [];
    } catch (e: any) {
      console.error("❌ Error ambil list:", e);
      toast.add({
        title: "Gagal fetch data",
        description: e.message || "Gagal mengambil daftar usulan",
        color: "red",
      });
      return [];
    } finally {
      isLoadingList.value = false;
    }
  };

  /** ===========================
   * GET DETAIL USULAN
   * =========================== */
  const getDetailUsulan = async (id: string) => {
    try {
      const res = await get(`/admin/nomor-request/${id}`);

      // Handle berbagai struktur response
      if (res?.data?.data) {
        return res.data.data;
      } else if (res?.data) {
        return res.data;
      } else {
        return res;
      }
    } catch (e: any) {
      console.error("❌ Error fetch detail:", e);
      toast.add({
        title: "Gagal fetch detail",
        description: e.message || "Gagal memuat detail usulan",
        color: "red",
      });
      return null;
    }
  };

  /** ===========================
   * GET KLASIFIKASI
   * =========================== */
  const getKlasifikasi = async () => {
    try {
      const res = await get("/persuratan/klasifikasi");

      // Response sudah dalam format { success: true, data: [...] }
      const rawData = res.data ?? res;
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.data ?? []);

      // Transform data untuk menampilkan "CODE - TEXT"
      return dataArray.map((item: any) => ({
        code: item.klasifikasi,
        text: item.klasifikasi_text,
        display: `${item.klasifikasi} - ${item.klasifikasi_text}`,
        id: item.id,
      }));
    } catch (e: any) {
      console.error("❌ Error fetch klasifikasi:", e);
      toast.add({
        title: "Gagal fetch klasifikasi",
        description: e.message || "Gagal mengambil klasifikasi",
        color: "red",
      });
      return [];
    }
  };

  /** ===========================
   * GET LIST SUBMITTED
   * =========================== */
  const getListSubmitted = async () => {
    isLoadingSubmitted.value = true;
    try {
      const res = await get("/admin/nomor-request-submitted");
      return res.data ?? [];
    } catch (e: any) {
      console.error("❌ Error ambil list submitted:", e);
      toast.add({
        title: "Gagal fetch submitted",
        description: e.message || "Gagal mengambil data submitted",
        color: "red",
      });
      return [];
    } finally {
      isLoadingSubmitted.value = false;
    }
  };

  /** ===========================
   * GET PERSON WITH POSITION
   * =========================== */
  const getPersonWithPosition = async () => {
    try {
      const res = await get("/person/with-position/all");
      return res.data ?? [];
    } catch (e: any) {
      console.error("❌ Error fetch person with position:", e);
      toast.add({
        title: "Gagal fetch person",
        description: e.message || "Gagal mengambil data person",
        color: "red",
      });
      return [];
    }
  };

  /** ===========================
   * DELETE USULAN
   * =========================== */
  const deleteUsulan = async (id: string) => {
    try {
      const res = await del(`/admin/nomor-request/${id}`);

      console.log("✅ Delete response:", res);

      toast.add({
        title: "Berhasil",
        description: res?.data?.message || "Usulan berhasil dihapus",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      return res.data ?? res;
    } catch (e: any) {
      console.error("❌ Error delete usulan:", e);

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Gagal menghapus usulan";

      toast.add({
        title: "Gagal",
        description: errorMsg,
        color: "red",
      });

      throw e;
    }
  };

  /** ===========================
   * DELETE NOMOR
   * =========================== */
  const deleteNomor = async (id: string) => {
    try {
      const res = await del(`/admin/nomor/${id}`);

      console.log("✅ Delete nomor response:", res);

      toast.add({
        title: "Berhasil",
        description: res?.data?.message || "Nomor berhasil dihapus",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      return res.data ?? res;
    } catch (e: any) {
      console.error("❌ Error delete nomor:", e);

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Gagal menghapus nomor";

      toast.add({
        title: "Gagal",
        description: errorMsg,
        color: "red",
      });

      throw e;
    }
  };

  return {
    // NEW Endpoint (Primary)
    savePenomoran,
    getListNomor,
    deleteNomor,

    // OLD Endpoints (Backward Compatibility)
    savePenomoranRequest,
    isLoadingPenomoran,
    submitBooking,
    isLoadingBooking,
    getListUsulan,
    isLoadingList,
    getDetailUsulan,
    getKlasifikasi,
    getListSubmitted,
    isLoadingSubmitted,
    getPersonWithPosition,
    deleteUsulan,
  };
};
