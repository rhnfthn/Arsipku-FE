// composables/usePenomoran.ts
import { useApi } from "./useApi";
import type { PenomoranPayload, PenomoranResponse } from "~/types/penomoran";

export const usePenomoran = () => {
  const { get, post } = useApi();
  const toast = useToast();
  const isLoadingPenomoran = ref(false);
  const isLoadingBooking = ref(false);

  const savePenomoran = async (
    payload: PenomoranPayload,
  ): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true;

    try {
      console.log("📤 Mengirim payload:", payload);

      // ✅ PERBAIKAN: Hapus field pengirim & convert tanggal ke Date
      const formattedPayload = {
        position_id: payload.position_id,
        tanggal: new Date(payload.tanggal), // ✅ Harus Date instance
        jenis: payload.jenis,
        klasifikasi: payload.klasifikasi,
        perihal: payload.perihal,
        jumlah: Number(payload.jumlah),
        // ❌ HAPUS pengirim - tidak ada di schema BE
      };

      console.log("📤 Formatted payload:", formattedPayload);

      const response = await post("/nomor-request", formattedPayload);

      console.log("✅ Response dari BE:", response);

      toast.add({
        title: "Berhasil",
        description: "Penomoran berhasil disimpan.",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 2500,
      });

      return response;
    } catch (error: any) {
      console.error("❌ Error Simpan Penomoran:", error);
      console.error("❌ Error Response:", error.response);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menyimpan penomoran.";

      toast.add({
        title: "Gagal",
        description: errorMessage,
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingPenomoran.value = false;
    }
  };

  const bookingPenomoran = async (id: number, files: any[]) => {
    try {
      const response = await post(`/nomor-request/${id}/booking`, {
        files,
      });

      toast.add({
        title: "Berhasil",
        description: "Berhasil upload file.",
        color: "green",
      });

      return response;
    } catch (err: any) {
      toast.add({
        title: "Gagal",
        description: err.response?.data?.message || "Upload gagal.",
        color: "red",
      });
      throw err;
    }
  };

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
  ): Promise<any> => {
    isLoadingBooking.value = true;

    try {
      console.log("📤 Mengirim booking:", payload);

      const formData = new FormData();
      payload.files.forEach((file, idx) => {
        const blob = new Blob([file.file_text], { type: "application/pdf" });
        formData.append(`files[${idx}]`, blob, file.file_name);
      });

      const response = await post(
        `/nomor-request/${id_request}/booking`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.add({
        title: "Berhasil",
        description: "Booking penomoran berhasil dikirim.",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 2500,
      });

      return response;
    } catch (error: any) {
      console.error("❌ Error Booking Penomoran:", error);

      toast.add({
        title: "Gagal",
        description:
          error.response?.data?.message || "Gagal mengirim booking penomoran.",
        icon: "i-heroicons-exclamation-circle",
        color: "red",
      });

      throw error;
    } finally {
      isLoadingBooking.value = false;
    }
  };

  const isLoadingList = ref(false);

  const getListUsulan = async () => {
    isLoadingList.value = true;

    try {
      const res = await get("/admin/nomor-request");
      return res.data ?? [];
    } catch (e) {
      console.error("❌ Error ambil list:", e);
      return [];
    } finally {
      isLoadingList.value = false;
    }
  };

  const getDetailUsulan = async (id: string) => {
    const response = await get(`/admin/nomor-request/${id}`);
    return response.data; // karena backend bentuknya { success, message, data }
  };
  const getKlasifikasi = async () => {
    try {
      const res = await get("/persuratan/klasifikasi");
      return res.data ?? [];
    } catch (e) {
      console.error("❌ Error fetch klasifikasi:", e);
      return [];
    }
  };

  const isLoadingSubmitted = ref(false);

  const getListSubmitted = async () => {
    isLoadingSubmitted.value = true;

    try {
      const res = await get("/admin/nomor-request-submitted");
      return res.data ?? [];
    } catch (e) {
      console.error("❌ Error ambil list submitted:", e);
      return [];
    } finally {
      isLoadingSubmitted.value = false;
    }
  };

  return {
    savePenomoran,
    isLoadingPenomoran,
    submitBooking,
    bookingPenomoran,
    isLoadingBooking,
    getListUsulan,
    isLoadingList,
    getDetailUsulan,
    getKlasifikasi,
    getListSubmitted,
    isLoadingSubmitted,
  };
};
