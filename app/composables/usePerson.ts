import { useApi } from "~/composables/useApi";

export const usePerson = () => {
  const { apiGet } = useApi();

  const getPersons = () => {
    return apiGet<{
      success: boolean;
      data: any[];
    }>("/person");
  };

  return { getPersons };
};
