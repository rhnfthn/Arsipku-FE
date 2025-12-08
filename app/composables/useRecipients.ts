// composables/useRecipients.ts

export const useRecipients = (id: number | string) => {
  // const config = useRuntimeConfig(); // Tidak butuh config URL eksternal lagi disini

  // Perhatikan URL-nya: Kita ganti domain asli dengan '/api/proxy'
  return useFetch<RawApiResponse, FormattedRecipientData>(
    `/api/proxy/DI/get-recipient/${id}`,
    {
      // Hapus baseURL karena kita menggunakan relative path ke proxy server sendiri
      // baseURL: config.public.API_URL, <--- HAPUS INI

      key: `recipient-list-${id}`,
      timeout: 10000,

      transform: (data) => {
        // ... logika transform sama seperti sebelumnya ...
        const rawAtasan = data?.recipients?.ATASAN || [];
        const rawBawahan = data?.recipients?.BAWAHAN || [];

        const formatRecipient = (
          r: RawRecipient,
          group: "ATASAN" | "BAWAHAN",
        ): RecipientOption => ({
          label: `${r.persnum_person_text} - ${r.position_text}`,
          value: r.position,
          suffix: r.position_text,
          group,
        });

        const atasans = rawAtasan.map((r) => formatRecipient(r, "ATASAN"));
        const bawahans = rawBawahan.map((r) => formatRecipient(r, "BAWAHAN"));

        return {
          sender: data?.sender || {},
          recipients: {
            ATASAN: atasans,
            BAWAHAN: bawahans,
            ALL: [...atasans, ...bawahans],
          },
        };
      },

      onResponseError({ response }) {
        console.error(
          "Failed to fetch recipients via Proxy:",
          response.statusText,
        );
      },
    },
  );
};
