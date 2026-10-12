<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="pageTitle"
        :items="breadcrumbItems"
      />
      <button
        @click="$router.back()"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="berkas">
      <!-- Info Berkas -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 mb-5">
        <button
          type="button"
          class="mb-4 flex w-full items-center justify-between gap-3 text-left"
          :aria-expanded="infoBerkasOpen"
          @click="infoBerkasOpen = !infoBerkasOpen"
        >
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Berkas</h3>
          <UIcon :name="infoBerkasOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4 shrink-0 text-gray-500" />
        </button>
        <div v-show="infoBerkasOpen" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nama Berkas</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.judulBerkas }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
            <p class="text-gray-900 dark:text-white font-medium font-mono">{{ berkas.kodeBerkas || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.klasifikasiTeks || berkas.klasifikasi || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Lokasi</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.lokasi || berkas.lokasiFisik || berkas.lokasi_fisik || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Aktif</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.retensiAktifTahun || 0 }} Tahun</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Inaktif</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.retensiInaktifTahun || 0 }} Tahun</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nasib Akhir</span>
            <p class="text-gray-900 dark:text-white font-medium">
              <span
                v-if="berkas.tindakanPenyusutanAkhir"
                :class="berkas.tindakanPenyusutanAkhir.toLowerCase() === 'musnah' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'"
                class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
              >{{ berkas.tindakanPenyusutanAkhir }}</span>
              <span v-else>-</span>
            </p>
          </div>
          <div v-if="berkas.tanggalDibuat">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Dibuat</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(berkas.tanggalDibuat) }}</p>
          </div>
          <div v-if="berkas.tanggalDitutup">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Ditutup</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(berkas.tanggalDitutup) }}</p>
          </div>
          <div class="md:col-span-2">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Uraian</span>
            <p class="text-gray-900 dark:text-white text-sm mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{{ berkas.isiRingkas || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Daftar Isi Berkas -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            Daftar Isi Berkas
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ naskahList.length }}</span>
          </h2>
          <div class="flex items-center gap-1">
            <button
              type="button"
              @click="printDaftarIsi"
              class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
              title="Print Daftar Isi Berkas"
              aria-label="Print Daftar Isi Berkas"
            >
              <UIcon name="i-lucide-printer" class="h-4 w-4" />
            </button>
            <button
              type="button"
              @click="daftarIsiOpen = !daftarIsiOpen"
              class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
              :title="daftarIsiOpen ? 'Lipat Daftar Isi Berkas' : 'Buka Daftar Isi Berkas'"
              :aria-expanded="daftarIsiOpen"
            >
              <UIcon :name="daftarIsiOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
            </button>
          </div>
        </div>
        <div v-show="daftarIsiOpen" id="preview-daftar-isi-print" class="w-full overflow-hidden">
          <table class="w-full table-fixed border-collapse text-xs">
            <thead class="bg-[#457fb6] text-white">
              <tr>
                <th class="w-[4%] px-1.5 py-3 text-center font-semibold">No</th>
                <th class="w-[14%] px-1.5 py-3 text-center font-semibold">Nomor Naskah</th>
                <th class="w-[10%] px-1.5 py-3 text-center font-semibold">Kode Berkas</th>
                <th class="w-[14%] px-1.5 py-3 text-center font-semibold">Kode Klasifikasi</th>
                <th class="w-[20%] px-1.5 py-3 text-center font-semibold">Uraian Informasi Isi Berkas</th>
                <th class="w-[9%] px-1.5 py-3 text-center font-semibold">Tanggal</th>
                <th class="w-[5%] px-1.5 py-3 text-center font-semibold">Jumlah</th>
                <th class="w-[9%] px-1.5 py-3 text-center font-semibold">Lokasi Simpan</th>
                <th class="w-[11%] px-1.5 py-3 text-center font-semibold">Klasifikasi Keamanan</th>
                <th class="print-action w-[6%] px-1.5 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="10" class="px-3 py-8 text-center text-gray-500">Memuat data…</td>
              </tr>
              <tr v-else-if="daftarIsiRows.length === 0">
                <td colspan="10" class="px-3 py-8 text-center text-gray-400">Belum ada isi berkas.</td>
              </tr>
              <tr v-for="row in daftarIsiRows" :key="row.id" class="border-b border-gray-100 odd:bg-white even:bg-gray-50/70 dark:border-gray-700 dark:odd:bg-gray-800 dark:even:bg-gray-700/30">
                <td class="break-words px-1.5 py-3 text-center text-gray-700 dark:text-gray-200">{{ row.no }}</td>
                <td class="break-words px-1.5 py-3 font-mono font-semibold text-gray-900 dark:text-white">{{ row.nomorSurat }}</td>
                <td class="break-words px-1.5 py-3 font-mono text-gray-700 dark:text-gray-200">{{ row.kodeBerkas }}</td>
                <td class="break-words px-1.5 py-3 text-gray-700 dark:text-gray-200">
                  <div class="font-semibold">{{ row.klasifikasiNama }}</div>
                  <div class="mt-0.5 text-[10px] text-gray-400">{{ row.kodeKlasifikasi }}</div>
                </td>
                <td class="break-words px-1.5 py-3 text-gray-800 dark:text-gray-200">{{ row.uraianInformasi }}</td>
                <td class="break-words px-1.5 py-3 text-center text-gray-700 dark:text-gray-200">{{ formatDate(row.tanggalNaskah) }}</td>
                <td class="break-words px-1.5 py-3 text-center text-gray-700 dark:text-gray-200">{{ row.jumlahHalaman ?? '-' }}</td>
                <td class="break-words px-1.5 py-3 text-gray-700 dark:text-gray-200">{{ row.lokasiSimpan }}</td>
                <td class="break-words px-1.5 py-3 text-center text-gray-700 dark:text-gray-200">{{ row.klasifikasiKeamanan }}</td>
                <td class="print-action px-1.5 py-3 text-center">
                  <button type="button" @click="openNaskahPdf(row.naskah)" class="inline-flex p-1 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300" title="Lihat naskah">
                    <UIcon name="i-lucide-eye" class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      <UIcon name="i-lucide-file-x" class="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p>Berkas tidak ditemukan</p>
    </div>

    <!-- PDF Viewer Full Page (preview & cetak) -->
    <Teleport to="body">
      <div
        v-if="showPdfViewer"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ pdfViewerTitle }}</p>
          </div>
          <button
            @click="closePdfViewer"
            class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors shrink-0"
            title="Tutup"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <!-- PDF Content -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <div v-if="isLoadingPdf" class="absolute inset-0 flex items-center justify-center z-10">
            <div class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Memuat dokumen…</p>
            </div>
          </div>
          <iframe
            v-if="pdfViewerUrl"
            :key="pdfViewerUrl"
            :src="pdfViewerUrl"
            class="w-full h-full border-none"
            @load="isLoadingPdf = false"
          />
          <div v-else-if="!isLoadingPdf" class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
            <UIcon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">PDF tidak tersedia.</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  <SharedSharePdfViewer
    v-model="tablePdfPreviewOpen"
    :url="tablePdfPreviewUrl"
    :title="tablePdfPreviewTitle"
    :loading="tablePdfPreviewLoading"
    @close="closeTablePdfPreview"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useArsipDinamis } from '~/composables/useArsipDinamis';
import { useApi } from '~/composables/useApi';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const { apiGet } = useApi();
const { getBerkasById, getDaftarNaskah, getNaskahDetailInBerkas } = useArsipDinamis();

const nomorUsulan = computed(() => (route.query.nomor_usulan as string) || '');
const usulanId = computed(() => (route.query.usulan_id as string) || '');

const pageTitle = computed(() =>
  nomorUsulan.value ? `Detail Usulan ${nomorUsulan.value}` : 'Detail Berkas'
);

// Set tab title ke nama berkas agar tidak "about:blank"
const berkas = ref<any>(null);
const daftarIsiMetadata = ref<any[]>([]);
const daftarBerkasMetadata = ref<any[]>([]);
const infoBerkasOpen = ref(true);
const daftarIsiOpen = ref(true);
const unitKerjaPihakPertama = ref('');
const tablePdfPreviewOpen = ref(false);
const tablePdfPreviewLoading = ref(false);
const tablePdfPreviewUrl = ref('');
const tablePdfPreviewTitle = ref('Preview Daftar Isi Berkas');
useHead(() => ({
  title: berkas.value?.judulBerkas
    ? `${berkas.value.judulBerkas} — Detail Berkas`
    : berkas.value?.kodeBerkas
      ? `${berkas.value.kodeBerkas} — Detail Berkas`
      : 'Detail Berkas',
}));

const fromPage = computed(() => (route.query.from as string) || '');

const breadcrumbItems = computed(() => {
  if (fromPage.value === 'transfer' && nomorUsulan.value && usulanId.value) {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Pemeliharaan', to: '/kelola/pemeliharaan/pemindahan-arsip' },
      { label: 'Pemindahan Arsip Aktif ke Inaktif', to: '/kelola/pemeliharaan/pemindahan-arsip' },
      { label: nomorUsulan.value, to: `/kelola/pemeliharaan/pemindahan-arsip/${usulanId.value}` },
      { label: 'Detail Berkas' },
    ];
  }
  if (fromPage.value === 'tu' && nomorUsulan.value && usulanId.value) {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Penerimaan Arsip', to: '/kelola/pemeliharaan/penerimaan-arsip' },
      { label: nomorUsulan.value, to: `/kelola/pemeliharaan/penerimaan-arsip/${usulanId.value}` },
      { label: 'Detail Berkas' },
    ];
  }
  if (nomorUsulan.value && usulanId.value) {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Verifikasi Usulan', to: '/pemeliharaan/pemindahan' },
      { label: nomorUsulan.value, to: `/pemeliharaan/pemindahan/${usulanId.value}?jenis=aktif_ke_inaktif` },
      { label: 'Detail Berkas' },
    ];
  }
  return [
    { label: 'Beranda', to: '/' },
    { label: 'Detail Berkas' },
  ];
});

const naskahList = ref<any[]>([]);
const isArchived = ref(false);
const isMusnah = ref(false);
const loading = ref(true);
const usulanStatus = ref<string>('');

// ── PDF Viewer Full Page (preview & cetak, bukan tab baru) ──
const showPdfViewer = ref(false);
const pdfViewerUrl = ref<string | null>(null);
const pdfViewerTitle = ref('Naskah');
const isLoadingPdf = ref(false);

const closePdfViewer = () => {
  showPdfViewer.value = false;
  pdfViewerUrl.value = '';
  isLoadingPdf.value = false;
};

/** Buka PDF naskah dalam viewer full-page (bisa preview & cetak). */
const openNaskahPdf = async (naskah: any) => {
  // Jika berkas sudah dimusnahkan (jenis musnah), naskah tidak bisa dibuka.
  // Untuk permanen, naskah tetap bisa dilihat meski sudah di-arsipkan.
  if (isMusnah.value) {
    alert('Naskah telah dimusnahkan.');
    return;
  }
  // Ambil detail naskah untuk mendapatkan final_pdf_url
  isLoadingPdf.value = true;
  try {
    // Jika berkas dari DB arsip (permanen), naskah sudah punya final_pdf
    // dari snapshot — ambil presigned URL dari endpoint arsip.
    if (isArchived.value) {
      if (!naskah.final_pdf) {
        alert('PDF naskah tidak tersedia (final_pdf kosong).');
        return;
      }
      const pdfRes: any = await apiGet(
        `/api/arsip/naskah/pdf`,
        { params: { key: naskah.final_pdf } },
        { skipCache: true },
      );
      const pdfUrl = pdfRes?.data?.data?.url ?? pdfRes?.data?.url ?? null;
      if (!pdfUrl) {
        alert('PDF naskah tidak tersedia.');
        return;
      }
      pdfViewerTitle.value = naskah.perihal || 'Naskah';
      pdfViewerUrl.value = pdfUrl;
      showPdfViewer.value = true;
      return;
    }

    const res: any = await getNaskahDetailInBerkas(
      route.params.id as string,
      naskah.naskahId || naskah.id,
    );
    const detail = res?.data ?? res;
    const d = Array.isArray(detail) ? detail?.[0] : detail;
    const pdfUrl = d?.final_pdf_url || d?.finalPdfUrl || d?.final_pdf || null;
    if (!pdfUrl) {
      alert('PDF naskah tidak tersedia.');
      return;
    }
    pdfViewerTitle.value = d?.perihal || naskah.perihal || 'Naskah';
    pdfViewerUrl.value = pdfUrl;
    showPdfViewer.value = true;
  } catch (e) {
    console.error('Gagal memuat PDF naskah:', e);
    alert('Gagal memuat PDF naskah.');
  } finally {
    isLoadingPdf.value = false;
  }
};

const daftarIsiRows = computed(() => naskahList.value.map((naskah, index) => {
  const naskahId = naskah.naskahId ?? naskah.id;
  const metadata = daftarIsiMetadata.value.find((row) =>
    String(row.naskahId ?? '') === String(naskahId ?? '')
      && String(row.id ?? route.params.id) === String(route.params.id),
  ) ?? daftarIsiMetadata.value.find((row) => String(row.id ?? '') === String(route.params.id));
  const archiveMetadata = daftarBerkasMetadata.value.find((row) => String(row.id ?? '') === String(route.params.id));

  return {
    id: naskah.id ?? naskah.naskahId ?? index,
    no: index + 1,
    nomorSurat: naskah.nomorSurat ?? naskah.nomor_surat ?? metadata?.nomorSurat ?? '-',
    kodeBerkas: berkas.value?.kodeBerkas ?? berkas.value?.kode_berkas ?? metadata?.kode ?? '-',
    klasifikasiNama: archiveMetadata?.klasifikasi ?? berkas.value?.klasifikasiTeks ?? '-',
    kodeKlasifikasi: archiveMetadata?.kodeKlasifikasi ?? metadata?.kodeKlasifikasi ?? berkas.value?.klasifikasi ?? '-',
    uraianInformasi: naskah.perihal || naskah.nomorSurat || metadata?.uraianInformasi || 'Tanpa uraian',
    jumlahHalaman: naskah.jumlahHalaman ?? naskah.jumlah_halaman ?? naskah.jumlahHalamanPdf ?? naskah.jumlah_halaman_pdf ?? naskah.pageCount ?? naskah.page_count ?? metadata?.jumlah ?? null,
    tanggalNaskah: naskah.tanggalNaskah ?? naskah.tanggal_naskah ?? naskah.tanggal ?? naskah.createdAt ?? naskah.created_at ?? metadata?.tanggal ?? null,
    lokasiSimpan: metadata?.lokasiSimpan ?? berkas.value?.lokasi ?? berkas.value?.lokasiSimpan ?? berkas.value?.lokasi_simpan ?? berkas.value?.lokasiFisik ?? berkas.value?.lokasi_fisik ?? '-',
    klasifikasiKeamanan: metadata?.klasifikasiKeamanan ?? berkas.value?.klasifikasiKeamanan ?? berkas.value?.klasifikasi_keamanan ?? berkas.value?.keamananKlasifikasi?.keamanan ?? berkas.value?.klasifikasi?.keamanan ?? '-',
    naskah,
  };
}));

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const closeTablePdfPreview = () => {
  if (tablePdfPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(tablePdfPreviewUrl.value);
  tablePdfPreviewUrl.value = '';
  tablePdfPreviewOpen.value = false;
};

onBeforeUnmount(closeTablePdfPreview);

const printDaftarIsi = async () => {
  const table = document.querySelector<HTMLTableElement>('#preview-daftar-isi-print table');
  if (!table) return;

  closeTablePdfPreview();
  tablePdfPreviewTitle.value = 'Preview Daftar Isi Berkas';
  tablePdfPreviewOpen.value = true;
  tablePdfPreviewLoading.value = true;

  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = 12;
    const pageWidth = 297;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin * 2;
    const headers = Array.from(table.querySelectorAll('thead th'))
      .filter((cell) => !cell.classList.contains('print-action'))
      .map((cell) => (cell.textContent || '').trim());
    const rows = Array.from(table.querySelectorAll('tbody tr'))
      .filter((row) => row.querySelector('td') && !row.querySelector('td[colspan]'))
      .map((row) => Array.from(row.querySelectorAll('td'))
        .filter((cell) => !cell.classList.contains('print-action'))
        .map((cell) => ((cell as HTMLElement).innerText || cell.textContent || '').trim().replace(/\s*\n\s*/g, ' ') || '-'));
    const weights = headers.map((label) => {
      if (/uraian|informasi/i.test(label)) return 3;
      if (/nomor/i.test(label)) return 1.7;
      if (/kode|lokasi|keamanan/i.test(label)) return 1.25;
      return 0.8;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    const widths = weights.map((weight) => (weight / totalWeight) * contentWidth);
    const xPositions = widths.map((_, index) => margin + widths.slice(0, index).reduce((sum, width) => sum + width, 0));
    const drawHeading = () => {
      pdf.setTextColor(20, 20, 20);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(15);
      pdf.text('Daftar Isi Berkas', pageWidth / 2, 15, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Unit Kerja: ${unitKerjaPihakPertama.value || '........................'}`, pageWidth / 2, 22, { align: 'center' });
      return 32;
    };
    const drawRow = (cells: string[], y: number, isHeader = false) => {
      pdf.setFont('times', isHeader ? 'bold' : 'normal');
      pdf.setFontSize(9);
      const lines = widths.map((width, index) => pdf.splitTextToSize(cells[index] || '-', Math.max(8, width - 4)) as string[]);
      const rowHeight = Math.max(8, ...lines.map((cellLines) => cellLines.length * 4 + 4));
      const fontHeight = pdf.getFontSize() * 0.3528;
      cells.forEach((_, index) => {
        const x = xPositions[index];
        const width = widths[index];
        const textHeight = (lines[index].length - 1) * 4 + fontHeight;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(40, 40, 40);
        pdf.rect(x, y, width, rowHeight, 'FD');
        pdf.setTextColor(20, 20, 20);
        pdf.text(lines[index], x + width / 2, y + (rowHeight - textHeight) / 2 + fontHeight, {
          align: 'center', maxWidth: width - 4, lineHeightFactor: 1.1,
        });
      });
      return rowHeight;
    };

    let y = drawHeading();
    y += drawRow(headers, y, true);
    for (const row of rows) {
      const estimatedHeight = Math.max(8, ...row.map((text, index) =>
        pdf.splitTextToSize(text, Math.max(8, widths[index] - 4)).length * 4 + 4,
      ));
      if (y + estimatedHeight > pageHeight - margin) {
        pdf.addPage();
        y = drawHeading();
        y += drawRow(headers, y, true);
      }
      y += drawRow(row, y);
    }
    tablePdfPreviewUrl.value = URL.createObjectURL(pdf.output('blob'));
  } catch (error: any) {
    useToast().add({ title: 'Preview PDF gagal dibuat', description: error?.message || 'Silakan coba kembali.', color: 'error' });
    tablePdfPreviewOpen.value = false;
  } finally {
    tablePdfPreviewLoading.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;

    // 1. Cek DB arsip DULU. Jika berkas sudah diarsipkan (permanen/musnah),
    //    baca berkas + naskah dari DB arsip (newarsipku_arsip), bukan DB inti.
    //    Untuk permanen, relasi berkas_naskah di DB inti sudah dihapus saat
    //    arsipkan, sehingga naskah hanya tersedia di DB arsip.
    let arsipLoaded = false;
    try {
      const arsipRes: any = await apiGet(`/api/arsip/berkas/${id}`, {}, { skipCache: true });
      const arsipData = arsipRes?.data?.data ?? arsipRes?.data ?? arsipRes;
      const arsipBerkas = arsipData?.berkas;
      if (arsipBerkas) {
        isArchived.value = true;
        isMusnah.value = arsipBerkas.is_musnah === true || arsipBerkas.is_musnah === 1 || arsipBerkas.status_akhir === 'musnah';
        berkas.value = {
          id: arsipBerkas.source_berkas_id,
          judulBerkas: arsipBerkas.judul_berkas,
          kodeBerkas: arsipBerkas.kode_berkas,
          klasifikasi: arsipBerkas.klasifikasi,
          klasifikasiTeks: arsipBerkas.klasifikasi_text,
          retensiAktifTahun: arsipBerkas.retensi_aktif_tahun,
          retensiInaktifTahun: arsipBerkas.retensi_inaktif_tahun,
          tindakanPenyusutanAkhir: arsipBerkas.tindakan_penyusutan_akhir,
          isiRingkas: arsipBerkas.isi_ringkas,
          lokasi: arsipBerkas.lokasi_fisik,
          tanggalDibuat: arsipBerkas.tanggal_dibuat,
          tanggalDitutup: arsipBerkas.tanggal_ditutup,
          status: arsipBerkas.status_akhir,
        };
        naskahList.value = (arsipData?.naskah ?? []).map((n: any) => ({
          id: n.id,
          naskahId: n.naskahId,
          naskahTipe: n.naskahTipe,
          nomorSurat: n.nomorSurat,
          perihal: n.perihal,
          tanggalNaskah: n.tanggalNaskah,
          sumber: n.sumber,
          urutan: n.urutan,
          final_pdf: n.finalPdf,
          status: n.status,
        }));
        arsipLoaded = true;
      }
    } catch (e) {
      console.warn('Gagal cek DB arsip:', e);
    }

    // 2. Jika tidak diarsipkan, baca dari DB inti (arsip-dinamis).
    if (!arsipLoaded) {
      try {
        const res: any = await getBerkasById(id);
        berkas.value = res?.data ?? res;
        const naskahRes: any = await getDaftarNaskah(id, { limit: 50 });
        const raw = naskahRes?.data?.data ?? naskahRes?.data ?? [];
        naskahList.value = Array.isArray(raw) ? raw : [];
      } catch (e) {
        console.warn('Berkas tidak ditemukan di DB inti:', e);
        berkas.value = null;
      }
    }

    // Jika ada usulan_id, ambil status usulan untuk override status berkas
    const usulanId = (route.query.usulan_id as string) || '';
    if (usulanId) {
      try {
        const usulanRes: any = await apiGet(`/transfer-active-to-inactive/${usulanId}`, {}, { skipCache: true });
        const usulanData = usulanRes?.data?.data ?? usulanRes?.data ?? usulanRes;
        if (usulanData?.status) usulanStatus.value = usulanData.status;
        let beritaAcara: any = {};
        try {
          const beritaAcaraRes: any = await apiGet(
            `/transfer-active-to-inactive/${usulanId}/berita-acara-data`,
            {},
            { skipCache: true },
          );
          beritaAcara = beritaAcaraRes?.data?.data ?? beritaAcaraRes?.data ?? beritaAcaraRes;
        } catch {
          // Gunakan informasi unit kerja yang tersedia pada detail usulan sebagai fallback.
        }
        unitKerjaPihakPertama.value = beritaAcara?.unitKerjaPengusul
          || beritaAcara?.pengirim?.divisi
          || beritaAcara?.pihakPertama?.unitKerja
          || usulanData?.unitKerjaPihakPertama
          || usulanData?.unit_kerja_pihak_pertama
          || usulanData?.divisiName
          || usulanData?.unitKerja
          || '';

      } catch {
        // Ignore — fallback to berkas status
      }

      try {
        const daftarRes: any = await apiGet(`/transfer-active-to-inactive/${usulanId}/daftar-isi`, {}, { skipCache: true });
        const daftarData = daftarRes?.data?.data ?? daftarRes?.data ?? daftarRes;
        daftarIsiMetadata.value = Array.isArray(daftarData?.daftarIsi) ? daftarData.daftarIsi : [];
        daftarBerkasMetadata.value = Array.isArray(daftarData?.daftarBerkas) ? daftarData.daftarBerkas : [];
      } catch (error) {
        console.warn('Metadata klasifikasi keamanan daftar isi gagal dimuat:', error);
      }
    }
  } catch (e) {
    console.error('Gagal memuat berkas:', e);
  } finally {
    loading.value = false;
  }

  // Jika halaman dibuka dari aksi pada satu baris daftar isi, langsung tampilkan PDF naskah tersebut.
  const targetNaskahId = route.query.naskah_id as string | undefined;
  if (targetNaskahId) {
    const targetNaskah = naskahList.value.find((naskah) =>
      String(naskah.naskahId ?? naskah.id) === targetNaskahId,
    );
    if (targetNaskah) await openNaskahPdf(targetNaskah);
  }
});
</script>
