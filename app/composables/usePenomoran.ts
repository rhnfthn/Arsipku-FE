// composables/usePenomoran.ts
import { ref, computed } from "vue";
import { useApi } from "./useApi";
import type { PenomoranPayload, PenomoranResponse } from "~/types/penomoran";

export const usePenomoran = () => {
  const { get, post, del, api } = useApi();
  const toast = useToast();

  const isLoadingPenomoran = ref(false);
  const isLoadingBooking = ref(false);
  const isLoadingList = ref(false);
  const isLoadingSubmitted = ref(false);

  /* ===========================
   * STATE - PISAHKAN ADMIN & USER
   * =========================== */
  const adminCounts = ref({
    menunggu_verifikasi: 0,
    disetujui: 0,
    ditolak: 0,
    belum_diajukan: 0,
    total: 0,
  });

  const userCounts = ref({
    position_id: null as number | null,
    menunggu_verifikasi: 0,
    disetujui: 0,
    ditolak: 0,
    belum_diajukan: 0,
    total: 0,
  });

  // Computed untuk backward compatibility
  const nomorCounts = computed(() => {
    const { user } = useAuth();
    const isAdmin =
      user.value?.role === "admin" || user.value?.role === "superadmin";

    console.log("📊 nomorCounts computed:", {
      role: user.value?.role,
      isAdmin,
      adminCounts: adminCounts.value,
      userCounts: userCounts.value,
      returning: isAdmin ? "adminCounts" : "userCounts",
    });

    return isAdmin ? adminCounts.value : userCounts.value;
  });

  /* ===========================
   * GET COUNT (ADMIN)
   * endpoint: /admin/nomor-request-count
   * =========================== */
  const getNomorRequestCountAdmin = async () => {
    try {
      console.log("📤 Fetching admin counts...");
      const res = await get("/admin/nomor-request-count");

      console.log("📥 Admin count response:", res);

      if (res?.success && res?.data) {
        adminCounts.value = {
          menunggu_verifikasi: res.data.menunggu_verifikasi ?? 0,
          disetujui: res.data.disetujui ?? 0,
          ditolak: res.data.ditolak ?? 0,
          belum_diajukan: res.data.belum_diajukan ?? 0,
          total: res.data.total ?? 0,
        };

        console.log("✅ Admin counts updated:", adminCounts.value);
      }

      return adminCounts.value;
    } catch (e) {
      console.error("❌ Admin count error:", e);
      return adminCounts.value;
    }
  };

  /* ===========================
   * GET COUNT (USER)
   * endpoint: /nomor-request-count/{{position_id}}
   * =========================== */
  const getNomorRequestCountUser = async (positionId: number | string) => {
    try {
      if (!positionId) {
        console.warn("⚠️ Position ID is empty, skipping user count fetch");
        return userCounts.value;
      }

      const numericPositionId = Number(positionId);

      if (isNaN(numericPositionId) || numericPositionId <= 0) {
        console.error(
          "❌ Invalid position ID:",
          positionId,
          "Converted:",
          numericPositionId,
        );
        return userCounts.value;
      }

      console.log("📤 Fetching user counts for position:", numericPositionId);

      const endpoint = `/nomor-request-count/${numericPositionId}`;
      const res = await get(endpoint);

      console.log("📥 User count response:", res);

      if (res?.success && res?.data) {
        userCounts.value = {
          position_id: res.data.position_id ?? numericPositionId,
          menunggu_verifikasi: res.data.menunggu_verifikasi ?? 0,
          disetujui: res.data.disetujui ?? 0,
          ditolak: res.data.ditolak ?? 0,
          belum_diajukan: res.data.belum_diajukan ?? 0,
          total: res.data.total ?? 0,
        };

        console.log("✅ User counts updated:", userCounts.value);
      }

      return userCounts.value;
    } catch (e: any) {
      console.error("❌ User count error:", e);

      if (e.response?.status !== 404) {
        toast.add({
          title: "Gagal mengambil count",
          description: e.response?.data?.message || "Silakan refresh halaman",
          color: "red",
        });
      }

      return userCounts.value;
    }
  };

  /* ===========================
   * HELPER UNIVERSAL
   * =========================== */
  const fetchNomorRequestCount = async (payload: {
    role: "admin" | "user";
    positionId?: number | string;
  }) => {
    if (payload.role === "admin") {
      return await getNomorRequestCountAdmin();
    }

    if (payload.role === "user" && payload.positionId) {
      return await getNomorRequestCountUser(payload.positionId);
    }

    return nomorCounts.value;
  };

  /** ===========================
   * CREATE PENOMORAN FINAL (ADMIN ONLY)
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

      const { user } = useAuth();
      if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id);
      }

      return response.data ?? response;
    } finally {
      isLoadingPenomoran.value = false;
    }
  };

  /** ===========================
   * SUBMIT BOOKING WITH FILES (USER)
   * ✅ UPDATED: Support both user and admin endpoints
   * User endpoint: POST /nomor-request/:id_request/booking
   * Admin endpoint: POST /admin/nomor-request/:id_request/booking
   * =========================== */
  const submitBooking = async (
    id_request: string | number,
    formData: FormData,
    isAdmin: boolean = false,
  ) => {
    isLoadingBooking.value = true;

    try {
      console.log("📤 Submitting booking for request:", id_request);
      console.log("📍 Mode:", isAdmin ? "Admin" : "User");

      // Log FormData content
      console.log("📦 FormData content:");
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(
            `  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`,
          );
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      // Determine endpoint based on role
      const endpoint = isAdmin
        ? `/admin/nomor-request/${id_request}/booking`
        : `/nomor-request/${id_request}/booking`;

      console.log("📍 Using endpoint:", endpoint);

      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Booking response:", response.data);

      toast.add({
        title: "Berhasil",
        description:
          response.data?.message ||
          "Usulan berhasil dikirim. Status diperbarui menjadi 'Menunggu Verifikasi'.",
        color: "green",
      });

      // Refresh count sesuai role
      const { user } = useAuth();
      if (
        isAdmin ||
        user.value?.role === "admin" ||
        user.value?.role === "superadmin"
      ) {
        await getNomorRequestCountAdmin();
      } else if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error submit booking:", error);
      console.error("❌ Error response:", error.response?.data);

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
   * GET DETAIL NOMOR BY ID (ADMIN)
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
      return null;
    }
  };

  /** ===========================
   * GET LIST NOMOR (ADMIN)
   * ✅ UPDATED: Support backend pagination, search & sorting
   * endpoint: /nomor?search=&page=1&limit=10&sort_by=&sort_order=
   * =========================== */
  const getListNomor = async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    isLoadingList.value = true;
    try {
      // Build query params sesuai dokumentasi API
      const queryParams = new URLSearchParams();
      if (params?.search) {
        queryParams.append("search", params.search);
      }
      if (params?.page) {
        queryParams.append("page", String(params.page));
      }
      if (params?.limit) {
        queryParams.append("limit", String(params.limit));
      }
      if (params?.sort_by) {
        queryParams.append("sort_by", params.sort_by);
      }
      if (params?.sort_order) {
        queryParams.append("sort_order", params.sort_order);
      }

      const queryString = queryParams.toString();
      const endpoint = `/nomor${queryString ? `?${queryString}` : ""}`;

      console.log("📤 Fetching nomor data with params:", params);
      console.log("📍 Full endpoint:", endpoint);

      const res = await get(endpoint);
      console.log("✅ Nomor data received:", res);

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null,
      };
    } catch (e: any) {
      console.error("❌ Error ambil list nomor:", e);
      toast.add({
        title: "Gagal fetch data",
        description: e.message || "Gagal mengambil daftar nomor",
        color: "red",
      });
      return { data: [], pagination: null };
    } finally {
      isLoadingList.value = false;
    }
  };

  /** ===========================
   * GET LIST USULAN (USER - by position)
   * =========================== */
  const getListUsulanByPosition = async (positionId: string | number) => {
    isLoadingList.value = true;
    try {
      console.log("📤 Fetching usulan for position:", positionId);
      const res = await get(`/nomor-request/${positionId}`);
      console.log("✅ Usulan data received:", res);
      return res.data ?? res;
    } catch (e: any) {
      console.error("❌ Error ambil list usulan:", e);
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
   * GET LIST USULAN (ADMIN - by position ID)
   * ✅ FIXED: Support backend pagination, search, filter & sorting dengan parameter yang benar
   * endpoint: /admin/nomor-request-by-position/{{position_id}}?search=&page=1&limit=15&status=&sort_by=&sort_order=
   * =========================== */
  const getListUsulan = async (
    positionId: string | number,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
      status?: string;
      sort_by?: string;
      sort_order?: string;
    },
  ) => {
    isLoadingList.value = true;
    try {
      if (!positionId) {
        console.error("❌ Position ID is required");
        return { data: [], pagination: null };
      }

      // Build query params sesuai dokumentasi API
      const queryParams = new URLSearchParams();
      if (params?.search) {
        queryParams.append("search", params.search);
      }
      if (params?.page) {
        queryParams.append("page", String(params.page));
      }
      if (params?.limit) {
        queryParams.append("limit", String(params.limit));
      }
      if (params?.status && params.status !== "Semua") {
        queryParams.append("status", params.status);
      }
      // ✅ FIX: Gunakan sort_by dan sort_order, BUKAN sortBy
      if (params?.sort_by) {
        queryParams.append("sort_by", params.sort_by);
      }
      if (params?.sort_order) {
        queryParams.append("sort_order", params.sort_order);
      }

      const queryString = queryParams.toString();
      const endpoint = `/admin/nomor-request-by-position/${positionId}${queryString ? `?${queryString}` : ""}`;

      console.log(
        "📤 Fetching usulan for position (admin):",
        positionId,
        "with params:",
        params,
      );
      console.log("📍 Full endpoint:", endpoint);

      const res = await get(endpoint);
      console.log("✅ Admin usulan data received:", res);

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null,
      };
    } catch (e: any) {
      console.error("❌ Error ambil list usulan (admin):", e);
      toast.add({
        title: "Gagal fetch data",
        description: e.message || "Gagal mengambil daftar usulan",
        color: "red",
      });
      return { data: [], pagination: null };
    } finally {
      isLoadingList.value = false;
    }
  };

  /** ===========================
   * GET DETAIL USULAN (ADMIN)
   * =========================== */
  const getDetailUsulan = async (id?: string) => {
    if (!id) {
      console.error("❌ getDetailUsulan dipanggil tanpa ID");
      return null;
    }

    try {
      console.log("📤 GET DETAIL ID:", id);

      const res = await get(`/admin/nomor-request/${id}`);

      console.log("📥 RAW RESPONSE:", res);

      const data = res?.data;

      if (Array.isArray(data)) {
        throw new Error("Endpoint mengembalikan LIST, bukan DETAIL");
      }

      return data;
    } catch (e: any) {
      console.error("❌ Error in getDetailUsulan:", e);

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
   * GET LIST SUBMITTED (ADMIN)
   * ✅ UPDATED: Support backend pagination, search, filter & sorting
   * endpoint: /admin/nomor-request-submitted?search=&page=1&limit=10&status=&sort_by=&sort_order=
   * =========================== */
  const getListSubmitted = async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    isLoadingSubmitted.value = true;
    try {
      // Build query params sesuai dokumentasi API
      const queryParams = new URLSearchParams();
      if (params?.search) {
        queryParams.append("search", params.search);
      }
      if (params?.page) {
        queryParams.append("page", String(params.page));
      }
      if (params?.limit) {
        queryParams.append("limit", String(params.limit));
      }
      if (params?.status && params.status !== "Semua") {
        queryParams.append("status", params.status);
      }
      if (params?.sort_by) {
        queryParams.append("sort_by", params.sort_by);
      }
      if (params?.sort_order) {
        queryParams.append("sort_order", params.sort_order);
      }

      const queryString = queryParams.toString();
      const endpoint = `/admin/nomor-request-submitted${queryString ? `?${queryString}` : ""}`;

      console.log("📤 Fetching submitted data with params:", params);
      console.log("📍 Full endpoint:", endpoint);

      const res = await get(endpoint);
      console.log("✅ Submitted data received:", res);

      return {
        data: res.data ?? [],
        pagination: res.pagination ?? null,
      };
    } catch (e: any) {
      console.error("❌ Error ambil list submitted:", e);
      toast.add({
        title: "Gagal fetch submitted",
        description: e.message || "Gagal mengambil data submitted",
        color: "red",
      });
      return { data: [], pagination: null };
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
   * DELETE USULAN (USER - delete by ID)
   * =========================== */
  const deleteUsulanUser = async (id: string) => {
    try {
      const res = await del(`/admin/nomor-request/${id}`);

      console.log("✅ Delete response:", res);

      toast.add({
        title: "Berhasil",
        description:
          res?.data?.message || res?.message || "Usulan berhasil dihapus",
        icon: "i-heroicons-check-circle",
        color: "green",
      });

      const { user } = useAuth();
      if (user.value?.position?.id) {
        await getNomorRequestCountUser(user.value.position.id);
      }

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
   * DELETE USULAN (ADMIN)
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

      await getNomorRequestCountAdmin();

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
   * DELETE NOMOR (ADMIN)
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

  /** ===========================
   * APPROVE BULK NOMOR (ADMIN)
   * =========================== */
  const approveBulkNomor = async (detailIds: string[]) => {
    try {
      if (!detailIds || detailIds.length === 0) {
        throw new Error("Detail IDs tidak boleh kosong");
      }

      const validIds = detailIds.filter(
        (id) => id !== null && id !== undefined && id !== "",
      );

      if (validIds.length === 0) {
        throw new Error("Tidak ada detail ID yang valid");
      }

      console.log("📤 Approve bulk nomor:", validIds);

      const response = await post("/admin/nomor-request-detail/approve-bulk", {
        detail_ids: validIds,
      });

      console.log("✅ Approve bulk response:", response);

      toast.add({
        title: "Berhasil",
        description: response?.message || "Nomor berhasil disetujui",
        color: "green",
      });

      await getNomorRequestCountAdmin();

      return response;
    } catch (e: any) {
      console.error("❌ Error approve bulk:", e);

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Gagal menyetujui nomor";

      toast.add({
        title: "Gagal",
        description: errorMsg,
        color: "red",
      });

      throw e;
    }
  };

  /** ===========================
   * REJECT NOMOR REQUEST (ADMIN)
   * =========================== */
  const rejectNomorRequest = async (
    requestId: string,
    detailIds: string[],
    keterangan: string,
  ) => {
    try {
      if (!requestId) {
        throw new Error("Request ID tidak boleh kosong");
      }

      if (!keterangan || !keterangan.trim()) {
        throw new Error("Keterangan penolakan harus diisi");
      }

      console.log("📤 Reject nomor request:", {
        requestId,
        detailIds,
        keterangan,
      });

      const response = await post(
        `/admin/nomor-request/${requestId}/reject-nomor`,
        {
          detail_ids: detailIds,
          keterangan: keterangan,
        },
      );

      console.log("✅ Reject response:", response);

      toast.add({
        title: "Berhasil",
        description: response?.message || "Nomor berhasil ditolak",
        color: "green",
      });

      await getNomorRequestCountAdmin();

      return response;
    } catch (e: any) {
      console.error("❌ Error reject nomor:", e);

      const errorMsg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Gagal menolak nomor";

      toast.add({
        title: "Gagal",
        description: errorMsg,
        color: "red",
      });

      throw e;
    }
  };

  /** ===========================
   * GET DETAIL VERIFIKASI REQUEST (ADMIN)
   * =========================== */
  const getDetailVerifikasiRequest = async (requestId: string) => {
    try {
      const mainRes = await get(`/admin/nomor-request/${requestId}`);

      if (!mainRes?.success) {
        toast.add({
          title: "Gagal",
          description: "Tidak dapat mengambil detail usulan",
          color: "red",
        });
        return null;
      }

      const mainData = mainRes.data;

      const detailRes = await get(`/admin/detail-nomor-request/${requestId}`);
      const existingDetails = detailRes?.success
        ? detailRes.data?.details || []
        : [];

      const jumlah = mainData.jumlah || 0;
      const template_nomor = mainData.template_nomor || null;

      let details = [];

      if (existingDetails.length > 0) {
        details = existingDetails.slice(0, jumlah).map((d: any) => ({
          id: d.id,
          nomor: d.nomor || null,
          template_nomor: template_nomor,
          status: d.status || "booking",
          checked: d.status !== "ditolak" && d.status !== "hangus",
          file_name: d.file_name || null,
          file_text: d.file_text || null,
          file_url: d.file_url || null,
        }));

        const remaining = jumlah - details.length;
        for (let i = 0; i < remaining; i++) {
          details.push({
            id: null,
            nomor: null,
            template_nomor: template_nomor,
            status: "pending",
            checked: true,
            file_name: null,
            file_text: null,
            file_url: null,
          });
        }
      } else {
        for (let i = 0; i < jumlah; i++) {
          details.push({
            id: null,
            nomor: null,
            template_nomor: template_nomor,
            status: "pending",
            checked: true,
            file_name: null,
            file_text: null,
            file_url: null,
          });
        }
      }

      return {
        ...mainData,
        jumlah: jumlah,
        details: details,
      };
    } catch (error) {
      console.error("❌ Error fetch detail verifikasi:", error);
      toast.add({
        title: "Gagal",
        description: "Terjadi kesalahan saat mengambil detail",
        color: "red",
      });
      return null;
    }
  };

  /** ===========================
   * UPLOAD DETAIL FILE (ADMIN)
   * ✅ UPDATED: Support uploading/replacing files regardless of status
   * Endpoint: POST /admin/nomor-request-detail/:detail_id/file
   * =========================== */
  const uploadDetailFile = async (detailId: string, file: File) => {
    try {
      console.log("📤 Uploading file for detail ID:", detailId);
      console.log("📄 File:", file.name, file.size, "bytes");

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/admin/nomor-request-detail/${detailId}/file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("✅ Upload response:", response.data);

      if (response.data?.success) {
        toast.add({
          title: "Berhasil",
          description:
            response.data?.message ||
            "File berhasil diupload, status menjadi final",
          color: "green",
        });

        return response.data.data;
      }

      throw new Error(response.data?.message || "Gagal upload file");
    } catch (error: any) {
      console.error("❌ Upload file error:", error);
      console.error("❌ Error response:", error.response?.data);

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal upload file";

      toast.add({
        title: "Gagal",
        description: errorMsg,
        color: "red",
      });

      throw error;
    }
  };

  /** ===========================
   * HANGUS DETAIL NOMOR (ADMIN)
   * Endpoint: POST /admin/nomor-request-detail/:detail_id/hangus
   * =========================== */
  const hangusDetailNomor = async (detailId: string) => {
    try {
      console.log(`🗑️ Hangus nomor for detail ID: ${detailId}`);

      const response = await post(
        `/admin/nomor-request-detail/${detailId}/hangus`,
        {},
      );

      console.log("✅ Hangus response:", response);

      if (response?.success) {
        toast.add({
          title: "Berhasil",
          description:
            response?.message || "Status berhasil diubah menjadi hangus",
          color: "green",
        });

        return response.data;
      } else {
        throw new Error(response?.message || "Gagal menghanguskan nomor");
      }
    } catch (error: any) {
      console.error("❌ Error hangus nomor:", error);

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Gagal menghanguskan nomor";

      toast.add({
        title: "Gagal",
        description: errorMsg,
        color: "red",
      });

      throw error;
    }
  };

  return {
    // STATE - TERPISAH
    adminCounts,
    userCounts,
    nomorCounts,

    // COUNT
    getNomorRequestCountAdmin,
    getNomorRequestCountUser,
    fetchNomorRequestCount,

    // USULAN FLOW (USER)
    createUsulanDraft,
    submitBooking,
    getListUsulanByPosition,
    deleteUsulanUser,

    // USULAN FLOW (ADMIN)
    getListUsulan,
    getDetailUsulan,
    deleteUsulan,

    // VERIFIKASI (ADMIN)
    getListSubmitted,
    getDetailVerifikasiRequest,
    approveBulkNomor,
    rejectNomorRequest,
    uploadDetailFile,
    hangusDetailNomor,

    // PENOMORAN FINAL (ADMIN)
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
