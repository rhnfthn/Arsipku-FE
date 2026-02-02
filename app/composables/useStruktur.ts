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

  const getOrganizationChildren = (parentOrgId: string | number) => {
  return apiGet<{
    success: boolean;
    data: any[];
  }>(`/organization/${parentOrgId}/children`);
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
    shortText: string;
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

const createPerson = (payload: {
  persnum: number;
  name: string;
  gender: string;
  company: number;
  position: number;
  startDate: string;
  endDate: string;
}) => {
  return apiPost("/person", payload);
}

const deletePerson = (id: string) => {
  return apiDelete(`/person/${id}`);
};

const updatePerson = (
  id: string,
  payload: {
    persnum: number;
    name: string;
    gender: string;
    company: number;
    position: number;
    startDate: string;
    endDate: string;
  },
) => {
  return apiPut(`/person/${id}`, payload);
};

  return {
    getCompanyTree,
    getOrganizationChildren,
    createOrganization,
    deleteOrganization,
    updateOrganization,

    getPositionsByOrganization,
    createPosition,
    deletePosition,
    updatePosition,

    getPersonsByPosition,
    createPerson,
    deletePerson,
    updatePerson,
  };
};
