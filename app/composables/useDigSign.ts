import { useApi } from "./useApi";

export const useDigSign = () => {
  const { get } = useApi();

  const getKtp = async () => {
    const response = await get("/digsig/ktp");
    return response.data;
  };

  return { getKtp };
};
