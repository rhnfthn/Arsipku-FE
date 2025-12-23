// composables/usePenomoran.ts
import { ref } from "vue";
import { useApi } from "./useApi";
import type { PenomoranPayload, PenomoranResponse } from "~/types/penomoran";

export const usePenomoran = () => {
  const { get, post, del, api } = useApi();
  const toast = useToast();

  const isLoadingPenomoran = ref(false);
  const isLoadingBooking = ref(false);
  const isLoadingList = ref(false);
  const isLoadingSubmitted = ref(false);

  /** ===========================
   * CREATE PENOMORAN FINAL
   * =========================== */
  const createPenomoranFinal = async (
    payload: PenomoranPayload,
  ): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true;

    try {
      if (!payload.tanggal) throw new Error("Tanggal tidak boleh kosong");

      const formattedPayload = {
        position_id: Number(payload.position_id),
        tanggal:
          payload.tanggal instanceof Date
            ? payload.tanggal.toISOString().split("T")[0]
            : String(payload.tanggal),
        jenis: String(payload.jenis),
        klasifikasi: String(payload.klasifikasi),
        perihal: String(payload.perihal),
        jumlah: Number(payload.jumlah),
        penandatangan: String(payload.penandatangan),
        id_position_penandatangan: Number(payload.id_position_penandatangan),
      };

      console.log("📤 POST to /admin/nomor:", formattedPayload);

      const response = await post("/admin/nomor", formattedPayload);

      console.log("✅ Response from /admin/nomor:", response);

      toast.add({
        title: "Berhasil",
        description: response?.message || "Penomoran final berhasil dibuat.",
        color: "green",
      });

      return response;
    } catch (error: any) {
      console.error("❌ Error create penomoran:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal membuat penomoran";

      toast.add({
        title: "Gagal",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
        color: "red",
      });

      throw error;
    } finally {
      isLoadingPenomoran.value = false;
    }
  };

  /** ===========================
   * CREATE USULAN (DRAFT)
   * =========================== */
  const createUsulanDraft = async (
    payload: PenomoranPayload,
  ): Promise<PenomoranResponse> => {
    isLoadingPenomoran.value = true;

    try {
      if (!payload.tanggal) throw new Error("Tanggal tidak boleh kosong");

      const formattedPayload = {
        position_id: Number(payload.position_id),
        tanggal: String(payload.tanggal),
        jenis: String(payload.jenis),
        klasifikasi: String(payload.klasifikasi),
        perihal: String(payload.perihal),
        penandatangan: String(payload.penandatangan),
        id_position_penandatangan: Number(payload.id_position_penandatangan),
        jumlah: Number(payload.jumlah),
      };

      const response = await post("/nomor-request", formattedPayload);

      toast.add({
        title: "Berhasil",
        description: "Usulan berhasil disimpan (Belum Diajukan).",
        color: "green",
      });

      return response.data ?? response;
    } finally {
      isLoadingPenomoran.value = false;
    }
  };

  /** ===========================
   * SUBMIT BOOKING WITH FILES
   * =========================== */
  const submitBooking = async (
    id_request: string | number,
    formData: FormData,
  ) => {
    isLoadingBooking.value = true;

    try {
      console.log("📤 Submitting booking for request:", id_request);

      // Log FormData contents for debugging
      for (const pair of formData.entries()) {
        console.log(`📎 FormData: ${pair[0]} =`, pair[1]);
      }

      const response = await api.post(
        `/nomor-request/${id_request}/booking`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("✅ Booking response:", response.data);

      toast.add({
        title: "Berhasil",
        description:
          response.data?.message ||
          "Usulan berhasil dikirim. Status diperbarui menjadi 'Menunggu Verifikasi'.",
        color: "green",
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error submit booking:", error);

      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal mengirim usulan.";

      toast.add({
        title: "Gagal",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        color: "red",
      });

      throw error;
    } finally {
      isLoadingBooking.value = false;
    }
  };

  /** ===========================
   * GET DETAIL NOMOR BY ID
   * =========================== */
  const getDetailNomor = async (id: string) => {
    try {
      const res = await get(`/nomor/${id}`);

      console.log("✅ Detail nomor loaded:", res);

      if (!res?.success) {
        throw new Error("Gagal mengambil detail nomor");
      }

      return res.data;
    } catch (e: any) {
      console.error("❌ Error fetch detail nomor:", e);
      toast.add({
        title: "Gagal fetch detail",
        description: e.message || "Gagal memuat detail nomor",
        color: "red",
      });
      return null;
    }
  };

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

      const rawData = res.data ?? res;
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.data ?? []);

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
    // USULAN FLOW
    createUsulanDraft,
    submitBooking,
    getListUsulan,
    getDetailUsulan,
    deleteUsulan,

    // VERIFIKASI
    getListSubmitted,

    // PENOMORAN FINAL
    createPenomoranFinal,
    getListNomor,
    getDetailNomor,
    deleteNomor,

    // MASTER DATA
    getKlasifikasi,
    getPersonWithPosition,

    // LOADING
    isLoadingPenomoran,
    isLoadingBooking,
    isLoadingList,
    isLoadingSubmitted,
  };
};
