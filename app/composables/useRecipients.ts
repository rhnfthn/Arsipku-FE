// composables/useRecipients.ts
import { useApi } from "~/composables/useApi";
import type {
  RecipientItem,
  RecipientApiResponse,
  RecipientApiData,
} from "~/types/recipients";

export const useRecipients = () => {
  const { apiGet } = useApi();

  /**
   * Normalize recipients → menjadi array flat + group
   */
  const normalizeRecipients = (
    raw: RecipientApiData | undefined,
  ): RecipientItem[] => {
    if (!raw || !raw.recipients) return [];

    const groups = raw.recipients;
    const list: RecipientItem[] = [];

    Object.keys(groups).forEach((groupName) => {
      groups[groupName].forEach((item) => {
        list.push({
          ...item,
          group: groupName,
        });
      });
    });

    return list;
  };

  /**
   * GET /ND/get-recipient/{positionId}
   */
  const getRecipients = async (
    positionId: number,
  ): Promise<{
    sender: RecipientApiData["sender"] | null;
    recipients: RecipientItem[];
  }> => {
    if (!positionId) throw new Error("positionId kosong");

    // tipe otomatis jadi RecipientApiResponse
    const res = await apiGet<RecipientApiResponse>(
      `/ND/get-recipient/${positionId}`,
    );

    return {
      sender: res?.data?.sender ?? null,
      recipients: normalizeRecipients(res?.data),
    };
  };

  return { getRecipients };
};
