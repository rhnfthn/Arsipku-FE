import { useApi } from "~/composables/useApi";

export const useCompany = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  const getCompanies = () =>
    apiGet<{ success: boolean; data: any[] }>("/company");

  const getCompanyByCode = async (companyCode: string) => {
    const res = await getCompanies();
    return res.data.find((c) => String(c.company) === String(companyCode));
  };

  const createCompany = (payload: CreateCompanyPayload) =>
    apiPost("/company", payload);

  const updateCompany = (id: string, payload: UpdateCompanyPayload) =>
    apiPut(`/company/${id}`, payload);

  const deleteCompany = (id: string) => apiDelete(`/company/${id}`);

  return {
    getCompanies,
    getCompanyByCode,
    createCompany,
    updateCompany,
    deleteCompany,
  };
};
