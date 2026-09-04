import { useApi } from "~/composables/useApi";

export const useStruktur = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  const getCompanyTree = (companyId: string | number) => {
    return apiGet<{
      success: boolean;
      data: {
        companyId: number;
        tree: any[];
      };
    }>(`/organization/company/${companyId}/tree`);
  };

  const searchOrganization = (
    companyId: string | number,
    searchQuery: string,
    signal?: AbortSignal,
  ) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/organization/company/${companyId}`, {
      params: {
        search: searchQuery,
      },
      signal,
    });
  };

  const searchPosition = (
    companyId: string | number,
    searchQuery: string,
    signal?: AbortSignal,
  ) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/position/company/${companyId}`, {
      params: {
        search: searchQuery,
      },
      signal,
    });
  };

  const searchPerson = (
    companyId: string | number,
    searchQuery: string,
    signal?: AbortSignal,
  ) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/person/company/${companyId}`, {
      params: {
        search: searchQuery,
      },
      signal,
    });
  };

  const getOrganizationChildren = (parentOrgId: string | number) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/organization/${parentOrgId}/children`);
  };

  const getPositionsByOrganization = (
    organizationId: string | number,
    companyId?: string | number
  ) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/position/organization/${organizationId}`, {
      params: companyId ? { company: companyId } : undefined
    });
  };

  const getPersonsByPosition = (positionId: string | number, companyId?: string | number) => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>(`/person/position/${positionId}`, {
      params: companyId ? { company: companyId } : undefined
    });
  };

  const createOrganization = (payload: {
    company: number;
    organization: number;
    shortText: string;
    longText: string;
    abbreviation: string;
    subArea: number;
    subAreaText: string;
    parentOrganization?: number | null;
    startDate: string;
    endDate: string;
  }) => {
    return apiPost("/organization", payload);
  };

  const deleteOrganization = (id: string) => {
    return apiDelete(`/organization/${id}`);
  };

  const updateOrganization = (
    id: string,
    payload: {
      shortText: string;
      longText: string;
      abbreviation: string;
      subArea: number;
      subAreaText: string;
      startDate: string;
      endDate: string;
    },
  ) => {
    return apiPut(`/organization/${id}`, payload);
  };

  const createPosition = (payload: {
    company: number;
    position: number;
    shortText: string;
    longText: string;
    abbreviation: string;
    organization: number;
    bodTag?: string | null;
    startDate: string;
    endDate: string;
  }) => {
    return apiPost("/position", payload);
  };

  const deletePosition = (id: string) => {
    return apiDelete(`/position/${id}`);
  };

  const updatePosition = (
    id: string,
    payload: {
      company?: number;
      position?: number;
      shortText?: string;
      longText: string;
      abbreviation?: string;
      organization?: number;
      bodTag?: string | null;
      startDate: string;
      endDate: string;
    },
  ) => {
    return apiPut(`/position/${id}`, payload);
  };

  const assignPersonToPosition = (payload: {
    persnum: number;
    company: number;
    position: number;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiPost("/person/assign-position", payload);
  };

  const deletePerson = (idRelationSp: string) =>
    apiDelete(`/person/assign-position/${idRelationSp}`);

  const updateAssignPerson = (
    idRelation: string,
    payload: {
      startDate?: string;
      endDate?: string;
    },
  ) => {
    return apiPut(`/person/assign-position/${idRelation}`, payload);
  };

  return {
    getCompanyTree,
    searchOrganization,
    searchPosition,
    searchPerson,
    getOrganizationChildren,
    createOrganization,
    deleteOrganization,
    updateOrganization,

    getPositionsByOrganization,
    createPosition,
    deletePosition,
    updatePosition,

    getPersonsByPosition,
    assignPersonToPosition,
    deletePerson,
    updateAssignPerson,
  };
};
