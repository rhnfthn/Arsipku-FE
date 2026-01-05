import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

export const useTerkirimDetail = () => {
  const { get } = useApi();

  const detail = ref<any>(null); // Gunakan any agar fleksibel untuk ND/SDI/SDE
  const isLoading = ref(false);

  // State PDF
  const pdfBlob = ref<Blob | null>(null);
  const pdfUrl = ref<string>('');
  const isPdfLoading = ref(false);
  const showPdfModal = ref(false);

  // Base URL API (Sebaiknya dipindahkan ke .env / runtime config)
  const BASE_API_URL = "http://172.20.16.115:3011";

  // --- 1. FETCH DETAIL ---
  const fetchDetail = async (id: string, jenis: string = 'ND') => {
    isLoading.value = true;
    detail.value = null;

    try {
      let endpoint = '';

      // Tentukan endpoint berdasarkan jenis naskah
      switch (jenis.toUpperCase()) {
        case 'ND':
          endpoint = `/ND/${id}`;
          break;
        case 'INTERNAL':
        case 'SDI':
          endpoint = `/SDI/${id}`;
          break;
        case 'EXTERNAL':
        case 'SDE':
          endpoint = `/SDE/${id}`;
          break;
        case 'DI':
        case 'DISPOSISI':
          endpoint = `/DI/${id}`;
          break;
        default:
          endpoint = `/ND/${id}`;
      }

      const response = await get(endpoint);

      if (response.success) {
        // Inject 'jenis' ke dalam data detail agar bisa dipakai fungsi lain (PDF)
        detail.value = {
          ...response.data,
          jenis: jenis.toUpperCase() // Normalisasi ke uppercase
        };
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

    showPdfModal.value = true;

    // Cache: jika URL sudah ada, tidak perlu fetch ulang
    if (pdfUrl.value) return;

    isPdfLoading.value = true;

    try {
      const d = detail.value;
      const jenis = d.jenis;

      let pdfEndpoint = '';
      let pdfPayload: any = {};

      // --- LOGIC PAYLOAD BERDASARKAN JENIS ---

      if (jenis === 'ND') {
        // --- NOTA DINAS ---
        pdfEndpoint = `${BASE_API_URL}/ND/generate-pdf`;
        pdfPayload = {
          penerima: d.penerima?.map((p: any) => p.position_text || p.nama_sirkuler) || [],
          tembusan: [], // Sesuaikan jika ada
          tgl: d.tanggal,
          perihal: d.perihal,
          sifat: d.sifat,
          htmlContent: d.konten,
          penandatangan: d.pengirim?.nama_sirkuler || d.pengirim?.nama,
          nama_jabatan: d.pengirim?.position_text,
          nama_tempat: d.nama_tempat || "Tangerang",
          nomor: d.nomor
        };

      } else if (jenis === 'INTERNAL' || jenis === 'SDI') {
        // --- SURAT DINAS INTERNAL ---
        pdfEndpoint = `${BASE_API_URL}/SDI/preview-pdf`;

        pdfPayload = {
          id_naskah: d.id, // Backend mungkin bisa generate dari ID saja
          perihal: d.perihal,
          konten: d.konten,
          pengirim: d.pengirim?.position || d.pengirim?.id,
          // Mapping penerima (array of IDs untuk SDI)
          tertuju: d.penerima?.map((p:any) => p.position || p.id) || [],
          tembusan: d.tembusan?.map((t:any) => t.position || t.id) || [],
          sifat: d.sifat,
          klasifikasi: d.klasifikasi,
          tgl: d.tanggal, // Format YYYY-MM-DD
          nama_tempat: d.nama_tempat || "Tangerang",
          nama_jabatan: d.pengirim?.position_text,
          nama_lengkap: d.pengirim?.nama,
          english: false
        };

      } else if (jenis === 'EXTERNAL' || jenis === 'SDE') {
        // --- SURAT DINAS EKSTERNAL ---
        pdfEndpoint = `${BASE_API_URL}/SDE/preview-pdf`;

        // SDE butuh detail penerima object, bukan cuma ID
        // Gunakan JSON.stringify jika backend meminta JSON string di dalam body
        pdfPayload = {
          id_naskah: d.id,
          perihal: d.perihal,
          konten: d.konten,
          pengirim: d.pengirim?.position || d.pengirim?.id,
          // SDE Penerima biasanya array of object {nama, alamat}
          penerima: d.penerima || [],
          tembusan: d.tembusan?.map((t:any) => t.position || t.id) || [], // Tembusan biasanya internal (ID)
          sifat: d.sifat,
          klasifikasi: d.klasifikasi,
          tgl: d.tanggal,
          nama_tempat: d.nama_tempat || "Tangerang",
          nama_jabatan: d.pengirim?.position_text,
          nama_lengkap: d.pengirim?.nama,
          english: false
        };
      }

      // --- REQUEST PDF ---
      // Perhatikan: SDI/SDE di menu 'Tulis' menggunakan FormData.
      // Jika endpoint 'preview-pdf' di backend mengharuskan FormData, gunakan logic ini:
      /* const formData = new FormData();
      Object.keys(pdfPayload).forEach(key => {
         const val = pdfPayload[key];
         if (typeof val === 'object') formData.append(key, JSON.stringify(val));
         else formData.append(key, val);
      });
      body: formData (dan hapus header Content-Type agar browser set boundary)
      */

      // Jika backend terima JSON raw:
      const response = await fetch(pdfEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfPayload),
      });

      if (!response.ok) throw new Error(`Gagal generate PDF (${response.status})`);

      const blob = await response.blob();
      pdfBlob.value = blob;
      pdfUrl.value = URL.createObjectURL(blob);

    } catch (error) {
      console.error("PDF Generate Error:", error);
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
    showPdfModal
  };
};
