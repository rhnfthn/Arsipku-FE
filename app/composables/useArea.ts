import { useApi } from "~/composables/useApi";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export const useArea = () => {
  const { apiGet } = useApi();

  const getAreasByCompany = (companyId: string) => {
    return apiGet<ApiResponse<any[]>>(`/area/company/${companyId}`);
  };

  const getSubAreasByCompanyAndArea = (companyId: string, areaCode: string) => {
    return apiGet<ApiResponse<any[]>>(
      `/areasub/company/${companyId}/area/${areaCode}`,
    );
  };

  const getSubAreasByCompany = (companyId: string) => {
    return apiGet<ApiResponse<any[]>>(`/areasub/company/${companyId}`);
  };

  return {
    getAreasByCompany,
    getSubAreasByCompanyAndArea,
    getSubAreasByCompany,
  };
};
