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
    positionId?: string | number,
  ): Promise<{
    sender: RecipientApiData["sender"] | null;
    recipients: RecipientItem[];
  }> => {
    const url = positionId
      ? `/ND/get-recipient/${positionId}`
      : `/ND/get-recipient/`;

    const res = await apiGet<RecipientApiResponse>(url);

    return {
      sender: res?.data?.sender ?? null,
      recipients: normalizeRecipients(res?.data),
    };
  };

  const getRecipientGroups = async (jenis?: string) => {
    const endpoint = jenis
      ? `/persuratan/grup-penerima?jenis=${jenis}`
      : "/persuratan/grup-penerima";
    const res = await apiGet<{ success: boolean; data: any[] }>(endpoint);
    return res?.data || [];
  };

  return { getRecipients, getRecipientGroups };
};
