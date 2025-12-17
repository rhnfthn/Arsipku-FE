import { ref, computed } from "vue";
import type {
  DashboardData,
  DashboardResponse,
  StatCard,
  SuratMasukTerbaru,
} from "@/types/dashboard";

export const useDashboard = () => {
  const { apiGet } = useApi();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const dashboardData = ref<DashboardData | null>(null);

  /**
   * Fetch dashboard data from API
   */
  const fetchDashboardData = async (positionId: string) => {
    if (!positionId) {
      error.value = "Position ID is required";
      console.error("❌ Position ID not found");
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      console.log("🔍 Fetching dashboard data for position:", positionId);

      const response = await apiGet<DashboardResponse>(
        `/dashboard/user/${positionId}`,
      );

      console.log("📦 Raw API Response:", response);

      if (response.success && response.data) {
        dashboardData.value = response.data;
        console.log(
          "✅ Dashboard data loaded successfully:",
          dashboardData.value,
        );
      } else {
        const errorMsg = response.message || "Failed to load dashboard data";
        error.value = errorMsg;
        console.error("❌ API returned error:", errorMsg);
      }
    } catch (err: any) {
      // Handle different error types
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const data = err.response.data;

        console.error("❌ Server Error:", {
          status,
          data,
          url: err.config?.url,
        });

        if (status === 404) {
          error.value = `Endpoint tidak ditemukan. Pastikan position_id "${positionId}" valid.`;
        } else if (status === 401) {
          error.value = "Tidak terautentikasi. Silakan login kembali.";
        } else if (status === 403) {
          error.value = "Akses ditolak. Anda tidak memiliki izin.";
        } else {
          error.value = data?.message || `Server error: ${status}`;
        }
      } else if (err.request) {
        // Request made but no response
        console.error("❌ No response from server:", err.request);
        error.value =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      } else {
        // Something else happened
        console.error("❌ Error:", err.message);
        error.value = err.message || "Terjadi kesalahan yang tidak diketahui";
      }
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get stat cards configuration
   */
  const stats = computed<StatCard[]>(() => {
    if (!dashboardData.value?.summary) {
      return [
        {
          label: "Surat Masuk",
          value: "0",
          icon: "i-heroicons-inbox",
          bgSolid: "bg-blue-100",
          borderColor: "bg-blue-500",
          iconColor: "text-blue-600",
        },
        {
          label: "Terkirim",
          value: "0",
          icon: "i-heroicons-paper-airplane",
          bgSolid: "bg-green-100",
          borderColor: "bg-green-500",
          iconColor: "text-green-600",
        },
        {
          label: "Draft Tersimpan",
          value: "0",
          icon: "i-heroicons-document",
          bgSolid: "bg-purple-100",
          borderColor: "bg-purple-500",
          iconColor: "text-purple-600",
        },
        {
          label: "Disposisi Masuk",
          value: "0",
          icon: "i-lucide-signature",
          bgSolid: "bg-yellow-100",
          borderColor: "bg-yellow-500",
          iconColor: "text-yellow-600",
        },
      ];
    }

    const summary = dashboardData.value.summary;
    return [
      {
        label: "Surat Masuk",
        value: summary.total_pesan_masuk || 0,
        icon: "i-heroicons-inbox",
        bgSolid: "bg-blue-100",
        borderColor: "bg-blue-500",
        iconColor: "text-blue-600",
      },
      {
        label: "Terkirim",
        value: summary.surat_terkirim || 0,
        icon: "i-heroicons-paper-airplane",
        bgSolid: "bg-green-100",
        borderColor: "bg-green-500",
        iconColor: "text-green-600",
      },
      {
        label: "Draft Tersimpan",
        value: summary.draft_tersimpan || 0,
        icon: "i-heroicons-document",
        bgSolid: "bg-purple-100",
        borderColor: "bg-purple-500",
        iconColor: "text-purple-600",
      },
      {
        label: "Disposisi Masuk",
        value: summary.disposisi_masuk || 0,
        icon: "i-lucide-signature",
        bgSolid: "bg-yellow-100",
        borderColor: "bg-yellow-500",
        iconColor: "text-yellow-600",
      },
    ];
  });

  /**
   * Get recent mails (limited to 10)
   */
  const recentMails = computed<SuratMasukTerbaru[]>(() => {
    if (!dashboardData.value?.surat_masuk_terbaru) return [];
    return dashboardData.value.surat_masuk_terbaru.slice(0, 10);
  });

  /**
   * Get chart data for statistics
   */
  const chartData = computed(() => {
    if (!dashboardData.value?.statistik) {
      return {
        labels: [],
        suratMasuk: [],
        suratTerkirim: [],
      };
    }

    return {
      labels: dashboardData.value.statistik.map((item) => item.bulan),
      suratMasuk: dashboardData.value.statistik.map((item) => item.surat_masuk),
      suratTerkirim: dashboardData.value.statistik.map(
        (item) => item.surat_terkirim,
      ),
    };
  });

  /**
   * Get accent color based on mail type
   */
  const getAccentColor = (jenis: string): string => {
    const colors: Record<string, string> = {
      ND: "bg-blue-500", // Naskah Dinas
      DI: "bg-orange-500", // Disposisi
      SK: "bg-purple-500", // Surat Keputusan
      default: "bg-gray-400",
    };
    return colors[jenis] || colors.default;
  };

  /**
   * Reset dashboard data
   */
  const resetDashboard = () => {
    dashboardData.value = null;
    error.value = null;
    isLoading.value = false;
  };

  return {
    // State
    isLoading,
    error,
    dashboardData,

    // Computed
    stats,
    recentMails,
    chartData,

    // Methods
    fetchDashboardData,
    getAccentColor,
    resetDashboard,
  };
};
