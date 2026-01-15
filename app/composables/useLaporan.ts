import { useApi } from "~/composables/useApi";

export const useLaporan = () => {
  const { apiGet } = useApi();

  const getRekapNaskah = (params?: {
    tahun?: number;
    area?: string;
    status?: string;
  }) => {
    return apiGet("/rekap-naskah", { params });
  };

  const getAreaList = () => {
    return apiGet("/area");
  };

  const getJenisList = () => {
    return apiGet("/jenis");
  };

  return {
    getRekapNaskah,
    getAreaList,
    getJenisList,
  };
};
