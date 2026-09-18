// composables/useMandatoryRoutingCc.ts
import { watch, type Ref } from 'vue';

/**
 * Tembusan wajib routing persuratan — auto-fill di form.
 *
 * Backend tetap menjadi sumber kebenaran saat pengiriman (resolveSdiRouting
 * selalu menambahkan tembusan wajib); composable ini hanya mencerminkan
 * konsekuensi tersebut di UI: ketika penerima dari section "Tambahan"
 * (routing_source === 'configured', bukan tembusan wajib) dipilih di Tertuju,
 * seluruh tembusan wajib (routing_mandatory === true) otomatis ditambahkan ke
 * Tembusan. Ketika tidak ada lagi penerima "Tambahan" yang dipilih, tembusan
 * wajib dilepas kembali dari form.
 */
export const useMandatoryRoutingCc = (options: {
  /** Daftar item dropdown lengkap (penerima + tembusan) dengan metadata routing */
  recipientItems: Ref<any[]>;
  selectedTertuju: Ref<any[]>;
  selectedTembusan: Ref<any[]>;
}) => {
  const { recipientItems, selectedTertuju, selectedTembusan } = options;

  // Metadata routing bisa berada di level atas item atau di item.raw
  // (mengikuti pola mapping halaman pemanggil).
  const routingMeta = (item: any) => ({
    routing_source: item?.routing_source ?? item?.raw?.routing_source,
    routing_mandatory: item?.routing_mandatory ?? item?.raw?.routing_mandatory,
  });

  const syncMandatoryCc = () => {
    const items = recipientItems.value ?? [];
    const tertuju = selectedTertuju.value ?? [];
    const tembusan = selectedTembusan.value ?? [];
    const tertujuIds = new Set(tertuju.map((i: any) => String(i.value)));
    const tembusanIds = new Set(tembusan.map((i: any) => String(i.value)));

    // Penerima "Tambahan" (configured, bukan tembusan wajib) yang sedang dipilih
    const hasConfiguredRecipient = items.some((item: any) => {
      const meta = routingMeta(item);
      return (
        meta.routing_source === 'configured' &&
        meta.routing_mandatory !== true &&
        tertujuIds.has(String(item.value))
      );
    });

    // Tembusan wajib hasil routing persuratan
    const mandatoryCcItems = items.filter(
      (item: any) => routingMeta(item).routing_mandatory === true
    );
    if (!mandatoryCcItems.length) return;

    if (!hasConfiguredRecipient) {
      // Tidak ada penerima "Tambahan" → lepas tembusan wajib dari form
      const nextTembusan = tembusan.filter(
        (i: any) =>
          !mandatoryCcItems.some(
            (cc: any) => String(cc.value) === String(i.value)
          )
      );
      if (nextTembusan.length !== tembusan.length)
        selectedTembusan.value = nextTembusan;
      return;
    }

    // Ada penerima "Tambahan" → pastikan seluruh tembusan wajib terisi.
    // Lewati yang sudah dipilih sebagai penerima utama (backend menghapus
    // tembusan yang bentrok dengan penerima).
    const additions = mandatoryCcItems
      .filter(
        (cc: any) =>
          !tembusanIds.has(String(cc.value)) &&
          !tertujuIds.has(String(cc.value))
      )
      .map((cc: any) => ({
        ...cc,
        routing_source: routingMeta(cc).routing_source,
        routing_mandatory: routingMeta(cc).routing_mandatory,
      }));
    if (additions.length) selectedTembusan.value = [...tembusan, ...additions];
  };

  watch(selectedTertuju, syncMandatoryCc, { deep: true });
  // Sinkronkan ulang bila daftar item berganti (mis. setelah muat penerima)
  watch(recipientItems, syncMandatoryCc);

  return { syncMandatoryCc };
};
