import { useApi } from "~/composables/useApi";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export const useArea = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();
  //area
  const getAreasByCompany = (companyId: string) => {
    return apiGet<ApiResponse<any[]>>(`/area/company/${companyId}`, {}, { skipCache: true });
  };

  const getSubAreasByCompanyAndArea = (companyId: string, areaCode: string) => {
    return apiGet<ApiResponse<any[]>>(
      `/areasub/company/${companyId}/area/${areaCode}`, {}, { skipCache: true }
    );
  };

  const createAreaByCompany = (companyId: string, payload: any) =>
    apiPost<ApiResponse<any>>(`/area/company/${companyId}`, payload);

  const updateAreaByCompany = (
    companyId: string,
    areaId: string | number,
    payload: any,
  ) =>
    apiPut<ApiResponse<any>>(`/area/company/${companyId}/${areaId}`, payload);

  const deleteArea = (areaId: string | number) =>
    apiDelete<ApiResponse<any>>(`/area/${areaId}`);

  //subarea
  const getSubAreasByCompany = (companyId: string) => {
    return apiGet<ApiResponse<any[]>>(`/areasub/company/${companyId}`, {}, { skipCache: true });
  };

  const createSubAreaByCompany = (companyId: string, payload: any) =>
    apiPost(`/areasub/company/${companyId}`, payload);

  const updateSubAreaByCompany = (
    companyId: string,
    subAreaId: string | number,
    payload: any,
  ) =>
    apiPut<ApiResponse<any>>(
      `/areasub/company/${companyId}/${subAreaId}`,
      payload,
    );

  const deleteSubArea = (subAreaId: string | number) =>
    apiDelete<ApiResponse<any>>(`/areasub/${subAreaId}`);

  return {
    getAreasByCompany,
    getSubAreasByCompanyAndArea,
    createAreaByCompany,
    updateAreaByCompany,
    deleteArea,

    getSubAreasByCompany,
    createSubAreaByCompany,
    updateSubAreaByCompany,
    deleteSubArea,
  };
};
