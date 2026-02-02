import { useApi } from "~/composables/useApi";

export const useStruktur = () => {
  const { apiGet } = useApi();

  const getCompanyTree = (companyId: string | number) => {
    return apiGet<{
      success: boolean;
      data: {
        companyId: number;
        tree: any[];
      };
    }>(`/organization/company/${companyId}/tree`);
  };

    const getPositionsByOrganization = (organizationId: string | number) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/position/organization/${organizationId}`);
  };

    const getPersonsByPosition = (positionId: string | number) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/person/position/${positionId}`);
  };

  return {
    getCompanyTree,
    getPositionsByOrganization,
    getPersonsByPosition,
  };
};
