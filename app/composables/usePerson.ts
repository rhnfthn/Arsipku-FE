import { useApi } from "~/composables/useApi";

export interface PersonSuggestion {
  id: string;
  persnum: number;
  name: string;
  gender: string;
  position_text?: string;
}

export const usePerson = () => {
  const { apiGet } = useApi();

  const getPersons = () => {
    return apiGet<{
      success: boolean;
      data: {
        data: PersonSuggestion[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/person");
  };

  const searchPersons = (search: string) => {
    return apiGet<{
      success: boolean;
      data: {
        data: PersonSuggestion[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>("/person", { params: { search } });
  };

  return { getPersons, searchPersons };
};
