import { ref } from "vue";
import { useApi } from "@/composables/useApi";

export interface SwitchCompany {
  relationSpId: string;
  company: number;
  companyText: string;
  startDate: string;
  endDate: string;
  isCurrentCompany: boolean;
}

export const useSwitch = () => {
  const { apiGet, apiPost } = useApi();

  const loading = ref(false);
  const switchingId = ref<string | null>(null);
  const companies = ref<SwitchCompany[]>([]);

  const getAvailableCompanies = async () => {
    loading.value = true;
    try {
      const res = await apiGet<{
        success: boolean;
        companies: SwitchCompany[];
      }>("/company-switch/available-companies");

      companies.value = res.companies;
    } finally {
      loading.value = false;
    }
  };

const switchCompany = async (relationSpId: string) => {
  switchingId.value = relationSpId;
  try {
    const res = await apiPost<{
      data: {
        accessToken: string;
        activeCompany: {
          company: number;
          companyText: string;
        };
      };
    }>("/company-switch/switch", {
      relationSpId,
    });

    if (res?.data?.accessToken) {
      localStorage.setItem("token", res.data.accessToken);
    }

    return res;
  } finally {
    switchingId.value = null;
  }
};

const resetCompany = async () => {
  loading.value = true;
  try {
    const res = await apiPost("/company-switch/reset");

    if (res?.data?.accessToken) {
      localStorage.setItem("token", res.data.accessToken);
    }

    return res;
  } finally {
    loading.value = false;
  }
};

  return {
    loading,
    switchingId,
    companies,
    getAvailableCompanies,
    switchCompany,
    resetCompany,
  };
};
