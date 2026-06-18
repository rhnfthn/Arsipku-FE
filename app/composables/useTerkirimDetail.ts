import { ref } from "vue";
import { useApi } from "@/composables/useApi";

export const useTerkirimDetail = () => {
  const { get, post } = useApi(); // Asumsi useApi punya 'post' helper juga

  const detail = ref<any>(null);
  const isLoading = ref(false);

  // State PDF
  const pdfBlob = ref<Blob | null>(null);
  const pdfUrl = ref<string>("");
  const isPdfLoading = ref(false);
  const showPdfModal = ref(false);

  // --- 1. FETCH DETAIL ---
  const fetchDetail = async (id: string, jenis: string = "ND") => {
    isLoading.value = true;
    detail.value = null;

    try {
      const type = jenis.toUpperCase();
      let endpoint = "";

      // Konsep tetap menggunakan endpoint khusus karena struktur JSON yang unik
      // if (["KA", "KAJIAN", "K"].includes(type)) {
      //   endpoint = `/konsep/${id}`;
      // } else {
        // ND, DI, SDI, SDE sekarang menggunakan satu endpoint utama
        endpoint = `/persuratan/naskah/${id}`;
      // }

      const response = await get(endpoint);

      if (response.success) {
        if (["KA", "KAJIAN", "K"].includes(type)) {
          // Mapping khusus Konsep (sesuai logika lama Anda)
          const resData = response.data;
          detail.value = {
            ...resData.naskah,
            pengirim: resData.current_workflow?.pengirim,
            penerima: resData.penerima || [],
            tembusan: resData.tembusan || [],
            final_pdf_url:
              resData.riwayat?.[resData.riwayat.length - 1]?.pdf_snapshot ||
              null,
            jenis: "KA",
            lampiran_files:
              resData.lampiran?.map((file: any) => ({
                id: file.id,
                fileName: file.name,
                fileUrl: file.url,
              })) || [],
          };
        } else {
          // Mapping untuk endpoint baru (Data berupa Array sesuai contoh respon Anda)
          // Kita ambil index [0]
          const rawData = response.data[0];
          detail.value = {
            ...rawData,
            jenis: rawData.jenis || type,
          };
        }
      }
    } catch (error) {
      console.error(`Gagal mengambil detail [${jenis}]:`, error);
    } finally {
      isLoading.value = false;
    }
  };

  // --- 2. GENERATE PDF ---
  const openPdfPreview = async () => {
    if (!detail.value) return;

    // [FIX] Jika final_pdf_url sudah ada dari backend, pakai itu saja
    if (detail.value.final_pdf_url) {
      // Cek apakah URL valid/bisa diakses
      activePdfUrl.value = detail.value.final_pdf_url;
      showPdfModal.value = true;
      return;
    }

    showPdfModal.value = true;

    // Cache: jika URL Blob lokal sudah ada, tidak perlu fetch ulang
    if (pdfUrl.value) return;

    isPdfLoading.value = true;

    try {
      const d = detail.value;
      const jenis = d.jenis;

      let pdfEndpoint = "";
      const formData = new FormData();

      // Helper untuk append FormData aman
      const append = (key: string, val: any) => {
        if (val === undefined || val === null) return;
        if (Array.isArray(val) || typeof val === "object") {
          formData.append(key, JSON.stringify(val));
        } else {
          formData.append(key, String(val));
        }
      };

      if (jenis === "ND") {
        pdfEndpoint = "/ND/generate-pdf";
        // ND biasanya JSON body, tapi kita coba standarisasi FormData dulu
        // atau sesuaikan kembali ke JSON jika backend ND menolak FormData
        append(
          "penerima",
          d.penerima?.map((p: any) => p.position_text || p.nama_sirkuler) || [],
        );
        append("tgl", d.tanggal);
        append("perihal", d.perihal);
        append("sifat", d.sifat);
        append("htmlContent", d.konten);
        append("penandatangan", d.pengirim?.nama_sirkuler || d.pengirim?.nama);
        append("nama_jabatan", d.pengirim?.position_text);
        append("nama_tempat", d.nama_tempat || "Tangerang");
        append("nomor", d.nomor);
      } else if (jenis === "INTERNAL" || jenis === "SDI") {
        pdfEndpoint = "/SDI/preview-pdf";
        append("id_naskah", d.id);
        append("perihal", d.perihal);
        append("konten", d.konten);
        append("pengirim", d.pengirim?.position_id || d.pengirim?.id);
        // SDI Map IDs
        const tertujuIds =
          d.penerima?.map((p: any) => p.position_id || p.id) || [];
        append("tertuju", tertujuIds);
        const tembusanIds =
          d.tembusan?.map((t: any) => t.position_id || t.id) || [];
        append("tembusan", tembusanIds);
        append("sifat", d.sifat);
        append("nama_jabatan", d.pengirim?.position_text);
        append("nama_lengkap", d.pengirim?.nama);
      } else if (jenis === "EXTERNAL" || jenis === "SDE") {
        pdfEndpoint = "/SDE/preview-pdf";
        append("id_naskah", d.id);
        append("perihal", d.perihal);
        append("konten", d.konten);
        append("pengirim", d.pengirim?.position_id || d.pengirim?.id);
        // SDE butuh object utuh untuk penerima
        append("penerima", d.penerima || []);
        const tembusanIds =
          d.tembusan?.map((t: any) => t.position_id || t.id) || [];
        append("tembusan", tembusanIds);
        append("nama_jabatan", d.pengirim?.position_text);
        append("nama_lengkap", d.pengirim?.nama);
      } else if (jenis === "DI" || jenis === "DISPOSISI") {
        // [FIX] Tambahkan logic PDF Disposisi
        pdfEndpoint = "/DI/preview-pdf";
        append("nomor", d.nomor);
        append("sifat", d.sifat);
        // ... field lain sesuai kebutuhan endpoint DI PDF
        // Biasanya DI endpoint PDF butuh ID saja jika data sudah di DB
        // append('id', d.id);
      }

      // Gunakan useApi post dengan responseType blob
      // Pastikan useApi Anda mendukung config axios tambahan (responseType)
      // Jika tidak, fallback ke fetch native seperti kode lama Anda.

      // Gunakan runtime config untuk base URL agar tidak hardcoded
      const config = useRuntimeConfig();
      const BASE_URL = config.public.apiBaseUrl;

      const response = await fetch(`${BASE_URL}${pdfEndpoint}`, {
        method: "POST",
        // Header Content-Type jangan di-set manual saat pakai FormData!
        // headers: { "Authorization": `Bearer ${token}` }, // Jika butuh token
        body: formData,
      });

      if (!response.ok) throw new Error("Gagal generate PDF");

      const blob = await response.blob();
      pdfBlob.value = blob;
      pdfUrl.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error("PDF Generate Error:", error);
      // Fallback: tampilkan pesan error di UI
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
