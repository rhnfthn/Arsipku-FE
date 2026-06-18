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
   * Fetch dashboard data from API - Updated to use /dashboard/ without positionId
   */
  const fetchDashboardData = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      console.log("🔍 Fetching dashboard data from /dashboard/");

      const response = await apiGet<DashboardResponse>("/dashboard/");

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
          error.value = "Endpoint tidak ditemukan. Pastikan API valid.";
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
   * Get stat cards configuration - Updated with new fields and navigation links
   */
  const stats = computed<StatCard[]>(() => {
    if (!dashboardData.value?.summary) {
      return [
        {
          label: "Perlu Tindak Lanjut",
          value: "0",
          subtitle: "",
          icon: "i-heroicons-clock",
          bgSolid: "bg-orange-100",
          borderColor: "bg-orange-500",
          iconColor: "text-orange-600",
          link: "/korespondensi/kotak-masuk",
        },
        {
          label: "Disposisi Belum Dibaca",
          value: "0",
          subtitle: "",
          icon: "i-heroicons-eye-slash",
          bgSolid: "bg-purple-100",
          borderColor: "bg-purple-500",
          iconColor: "text-purple-600",
          link: "/korespondensi/kotak-masuk",
        },
        {
          label: "Disposisi Belum Tindak Lanjut",
          value: "0",
          subtitle: "",
          icon: "i-lucide-signature",
          bgSolid: "bg-blue-100",
          borderColor: "bg-blue-500",
          iconColor: "text-blue-600",
          link: "/korespondensi/kotak-masuk",
        },
        {
          label: "Menunggu Tanda Tangan",
          value: "0",
          subtitle: "",
          icon: "i-heroicons-document-check",
          bgSolid: "bg-green-100",
          borderColor: "bg-green-500",
          iconColor: "text-green-600",
          link: "/digsig/penandatanganan",
        },
      ];
    }

    const summary = dashboardData.value.summary;
    return [
      {
        label: "Perlu Tindak Lanjut",
        value: summary.perlu_tindak_lanjut || 0,
        subtitle: "",
        icon: "i-heroicons-clock",
        bgSolid: "bg-orange-100",
        borderColor: "bg-orange-500",
        iconColor: "text-orange-600",
        link: "/korespondensi/kotak-masuk?filter=Belum+Tinjut",
      },
      {
        label: "Disposisi Belum Dibaca",
        value: summary.disposisi_belum_dibaca || 0,
        subtitle: `dari ${summary.disposisi_masuk || 0} total`,
        icon: "i-heroicons-eye-slash",
        bgSolid: "bg-purple-100",
        borderColor: "bg-purple-500",
        iconColor: "text-purple-600",
        link: "/korespondensi/kotak-masuk?tab=DI&filter=Belum+Dibaca",
      },
      {
        label: "Disposisi Belum Tindak Lanjut",
        value: summary.disposisi_belum_tinjut || 0,
        subtitle: "",
        icon: "i-heroicons-document-check",
        bgSolid: "bg-blue-100",
        borderColor: "bg-blue-500",
        iconColor: "text-blue-600",
        link: "/korespondensi/kotak-masuk?tab=DI&filter=Belum+Tinjut",
      },
      {
        label: "Menunggu Tanda Tangan",
        value: summary.digsig_menunggu_ttd || 0,
        subtitle: "",
        icon: "i-lucide-signature",
        bgSolid: "bg-green-100",
        borderColor: "bg-green-500",
        iconColor: "text-green-600",
        link: "/digsig/penandatanganan",
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
   * Get chart data for statistics - Updated with surat_sudah_ditinjut
   */
  const chartData = computed(() => {
    if (!dashboardData.value?.statistik_bulanan) {
      return {
        labels: [],
        suratMasuk: [],
        suratTerkirim: [],
        suratDitinjut: [],
      };
    }

    return {
      labels: dashboardData.value.statistik_bulanan.map((item) => item.bulan),
      suratMasuk: dashboardData.value.statistik_bulanan.map(
        (item) => item.surat_masuk,
      ),
      suratTerkirim: dashboardData.value.statistik_bulanan.map(
        (item) => item.surat_terkirim,
      ),
      suratDitinjut: dashboardData.value.statistik_bulanan.map(
        (item) => item.surat_sudah_ditinjut || 0,
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
      SDE: "bg-green-500", // Surat Dinas Eksternal
      SDI: "bg-indigo-500", // Surat Dinas Internal
      KA: "bg-pink-500", // Kajian
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
