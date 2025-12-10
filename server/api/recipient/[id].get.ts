// Ganti defineEventHandler menjadi defineCachedEventHandler
export default defineCachedEventHandler(async (event) => {
  const { id } = event.context.params!;
  const config = useRuntimeConfig();

  try {
    // GET from external API
    const data = await $fetch(`/DI/get-recipient/${id}`, {
      baseURL: config.public.API_URL,
      // Timeout agar server tidak hang selamanya jika API eksternal down
      timeout: 10000
    });

    const rawAtasan = data?.recipients?.ATASAN || [];
    const rawBawahan = data?.recipients?.BAWAHAN || [];

    // Format recipients
    const bawahans = rawBawahan.map((r: any) => ({
      label: `${r.persnum_person_text} - ${r.position_text}`,
      value: r.position,
      suffix: r.position_text // Tambahan untuk pencarian lebih akurat jika perlu
    }));

    const atasans = rawAtasan .map((r: any) => ({
      label: `${r.persnum_person_text} - ${r.position_text}`,
      value: r.position,
      suffix: r.position_text
    }));

    return {
      sender: data?.sender || {},
      recipients: {
        ATASAN: atasans,
        BAWAHAN: bawahans,
      },
    };
  } catch (error) {
    console.error('Failed to fetch recipients:', error);
    // Return struktur kosong agar frontend tidak crash
    return {
      sender: {},
      recipients: { ATASAN: [], BAWAHAN: [] }
    };
  }
}, {
  // Konfigurasi Cache
  maxAge: 60 * 60, // Cache selama 1 jam (3600 detik)
  name: 'recipient-list',
  getKey: (event) => event.context.params!.id, // Cache unik berdasarkan ID param
});
