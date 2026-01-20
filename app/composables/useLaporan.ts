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

  const getRekapNaskahDetail = (params?: {
    tahun?: number;
    area?: string;
    status?: string;
    jenis?: string;
  }) => {
    return apiGet("/rekap-naskah/detail", { params });
  };

  return {
    getRekapNaskah,
    getAreaList,
    getJenisList,
    getRekapNaskahDetail,
  };
};
