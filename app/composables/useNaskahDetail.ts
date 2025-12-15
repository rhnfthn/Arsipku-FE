import { ref } from "vue";
import { useApi } from "@/composables/useApi";
import type { NaskahDetail } from "~/types/naskah";

export const useTerkirimDetail = () => {
  const { get } = useApi();

  const detail = ref<NaskahDetail | null>(null);
  const isLoading = ref(false);

  // State untuk PDF Preview
  const pdfBlob = ref<Blob | null>(null);
  const pdfUrl = ref<string>("");
  const isPdfLoading = ref(false);
  const showPdfModal = ref(false);

  // 1. Fetch Detail Naskah
  const fetchDetail = async (id: string) => {
    isLoading.value = true;
    try {
      const response = await get(`/persuratan/naskah/detail/${id}`);
      if (response.success) {
        detail.value = response.data;
      }
    } catch (error) {
      console.error("Gagal mengambil detail:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // 2. Generate PDF Preview (On Demand)
  const openPdfPreview = async () => {
    if (!detail.value) return;

    showPdfModal.value = true;

    // Jika sudah ada URL, tidak perlu generate ulang (caching sederhana)
    if (pdfUrl.value) return;

    isPdfLoading.value = true;
    try {
      // Payload mapping sesuai kebutuhan endpoint generate-pdf
      const pdfPayload = {
        penerima: detail.value.penerima.map(
          (p) => p.position_text || p.nama_sirkuler,
        ),
        tembusan: [],
        tgl: detail.value.tanggal,
        perihal: detail.value.perihal,
        sifat: detail.value.sifat,
        htmlContent: detail.value.konten, // Konten dari API dikirim ke generator
        penandatangan: detail.value.pengirim.nama_sirkuler,
        nama_jabatan: detail.value.pengirim.position_text,
        nama_tempat: "Tangerang",
        nomor: detail.value.nomor,
      };

      // Gunakan URL absolute/env sesuai konfigurasi Anda
      const response = await fetch(
        "http://172.20.16.115:3011/ND/generate-pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pdfPayload),
        },
      );

      if (!response.ok) throw new Error("Gagal generate PDF");

      const blob = await response.blob();
      pdfBlob.value = blob;
      pdfUrl.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error("PDF Generate Error:", error);
      // Opsional: Show toast error here
    } finally {
      isPdfLoading.value = false;
    }
  };

  const closePdfPreview = () => {
    showPdfModal.value = false;
  };

  return {
    detail,
    isLoading,
    fetchDetail,
    openPdfPreview,
    closePdfPreview,
    pdfUrl,
    isPdfLoading,
    showPdfModal,
  };
};
