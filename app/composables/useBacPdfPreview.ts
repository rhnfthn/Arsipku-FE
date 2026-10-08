import { onBeforeUnmount, ref } from 'vue';
import { useApi } from '~/composables/useApi';

/**
 * Satu jalur preview PDF untuk seluruh Berita Acara pemindahan arsip.
 * PDF selalu diambil melalui backend agar URL MinIO internal tidak pernah
 * diberikan langsung kepada iframe browser.
 */
export const useBacPdfPreview = () => {
  const { apiGet } = useApi();
  const toast = useToast();
  const bacPreviewOpen = ref(false);
  const bacPreviewLoading = ref(false);
  const bacPreviewUrl = ref('');
  const bacPreviewTitle = ref('Preview Berita Acara');

  const toPdfBlob = (value: unknown): Blob => {
    // Beberapa adapter/interceptor mengembalikan payload langsung, sedangkan
    // adapter lain membungkusnya sebagai { data }. Terima keduanya.
    let payload = value;
    if (
      payload &&
      typeof payload === 'object' &&
      !(payload instanceof Blob) &&
      'data' in payload
    ) {
      payload = (payload as { data: unknown }).data;
    }

    if (payload instanceof Blob) return payload;
    if (payload instanceof ArrayBuffer) {
      return new Blob([payload], { type: 'application/pdf' });
    }
    if (ArrayBuffer.isView(payload)) {
      const bytes = new Uint8Array(
        payload.buffer,
        payload.byteOffset,
        payload.byteLength,
      );
      return new Blob([bytes], { type: 'application/pdf' });
    }

    throw new Error('Respons Berita Acara bukan data PDF yang dapat dibaca.');
  };

  const closeBacPreview = () => {
    if (bacPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(bacPreviewUrl.value);
    }
    bacPreviewUrl.value = '';
  };

  const openBacPreview = async (
    transferId: string,
    documentNumber?: string | null,
  ) => {
    closeBacPreview();
    bacPreviewTitle.value = `Berita Acara ${documentNumber || ''}`.trim();
    bacPreviewOpen.value = true;
    bacPreviewLoading.value = true;

    try {
      const response = await apiGet<unknown>(
        `/transfer-active-to-inactive/${transferId}/berita-acara.pdf`,
        {
          responseType: 'blob',
          headers: { Accept: 'application/pdf' },
        },
        { skipCache: true },
      );

      const pdfBlob = toPdfBlob(response);
      if (pdfBlob.size === 0) {
        throw new Error('PDF Berita Acara kosong atau tidak valid.');
      }

      const signature = await pdfBlob.slice(0, 5).text();
      if (signature !== '%PDF-') {
        throw new Error('Respons Berita Acara bukan dokumen PDF.');
      }

      bacPreviewUrl.value = URL.createObjectURL(pdfBlob);
    } catch (error: any) {
      let description = error?.response?.data?.message || error?.message;
      const errorBody = error?.response?.data;
      if (errorBody instanceof Blob) {
        try {
          const parsed = JSON.parse(await errorBody.text());
          description = parsed?.message || description;
        } catch {
          // Gunakan pesan fallback bila body bukan JSON.
        }
      }
      toast.add({
        title: 'Preview Berita Acara gagal dibuka',
        description: description || 'Silakan coba kembali.',
        color: 'error',
      });
    } finally {
      bacPreviewLoading.value = false;
    }
  };

  onBeforeUnmount(closeBacPreview);

  return {
    bacPreviewOpen,
    bacPreviewLoading,
    bacPreviewUrl,
    bacPreviewTitle,
    openBacPreview,
    closeBacPreview,
  };
};
