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
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Berkas</h3>
          <span
            class="px-2.5 py-0.5 text-xs rounded-full font-medium inline-flex items-center gap-1 border"
            :style="statusStyle(berkas.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: statusStyle(berkas.status).dot }" />
            {{ statusStyle(berkas.status).label }}
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
            <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
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
        <div class="flex flex-col gap-3 px-5 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div>
              <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                Daftar Isi Berkas
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ naskahList.length }}</span>
              </h2>
            </div>
          </div>
        </div>
        <DataTable
          :columns="daftarIsiColumns"
          :rows="daftarIsiRows"
          :loading="loading"
          empty-message="Belum ada isi berkas."
          header-class="bg-[#457fb6] text-white text-left"
          row-class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <template #cell-nomorSurat="{ row }">
            <div class="min-w-40">
              <p class="font-mono text-xs font-semibold text-gray-900 dark:text-white">{{ row.nomorSurat || '-' }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.tanggalNaskah) }}</p>
            </div>
          </template>
          <template #cell-kodeKlasifikasi="{ row }">
            <p class="text-gray-700 dark:text-gray-200">{{ row.kodeKlasifikasi }}</p>
          </template>
          <template #cell-jumlah="{ row }">
            <p class="text-gray-700 dark:text-gray-200">{{ row.jumlahHalaman ?? '-' }}</p>
          </template>
          <template #cell-uraianInformasi="{ row }">
            <p class="min-w-64 max-w-xl font-medium text-gray-800 dark:text-gray-200">{{ row.uraianInformasi }}</p>
          </template>
          <template #cell-aksi="{ row }">
            <button
              type="button"
              @click="openNaskahPdf(row.naskah)"
              class="inline-flex p-1 text-black transition-colors hover:text-[#3a6d9c] dark:text-white"
              title="Lihat naskah"
            >
              <UIcon name="i-lucide-eye" class="h-4 w-4" />
            </button>
          </template>
        </DataTable>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useArsipDinamis } from '~/composables/useArsipDinamis';
import { useApi } from '~/composables/useApi';
import DataTable from '~/components/DataTable.vue';

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
      { label: 'Pemeliharaan', to: '/maintenance/transfer-active-to-inactive-file' },
      { label: 'Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/transfer-active-to-inactive-file' },
      { label: nomorUsulan.value, to: `/maintenance/transfer-active-to-inactive-file/${usulanId.value}` },
      { label: 'Detail Berkas' },
    ];
  }
  if (fromPage.value === 'tu' && nomorUsulan.value && usulanId.value) {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Penerimaan Arsip', to: '/maintenance/penerimaan-usulan' },
      { label: nomorUsulan.value, to: `/maintenance/penerimaan-usulan/${usulanId.value}` },
      { label: 'Detail Berkas' },
    ];
  }
  if (nomorUsulan.value && usulanId.value) {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Verifikasi Usulan', to: '/maintenance/verifikasi-usulan' },
      { label: nomorUsulan.value, to: `/maintenance/verifikasi-usulan/${usulanId.value}?jenis=aktif_ke_inaktif` },
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

const daftarIsiColumns = [
  { key: 'nomorSurat', label: 'Nomor & Tanggal' },
  { key: 'kodeKlasifikasi', label: 'Kode Klasifikasi' },
  { key: 'uraianInformasi', label: 'Uraian Informasi Isi Berkas' },
  { key: 'jumlah', label: 'Jumlah', headerClass: 'text-left' },
  { key: 'aksi', label: 'Aksi', headerClass: 'text-center' },
];

const daftarIsiRows = computed(() => naskahList.value.map((naskah, index) => ({
  id: naskah.id ?? naskah.naskahId ?? index,
  nomorSurat: naskah.nomorSurat ?? naskah.nomor_surat ?? '-',
  kodeKlasifikasi: berkas.value?.klasifikasi ?? '-',
  uraianInformasi: naskah.perihal || naskah.nomorSurat || 'Tanpa uraian',
  jumlahHalaman: naskah.jumlahHalaman ?? naskah.jumlah_halaman ?? null,
  tanggalNaskah: naskah.tanggalNaskah ?? naskah.tanggal_naskah ?? naskah.tanggal ?? null,
  naskah,
})));

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  aktif: { label: 'Terbuka', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', dot: '#15803D' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', dot: '#B45309' },
  menunggu_verifikasi_atasan: { label: 'Menunggu Persetujuan', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  menunggu_verifikasi_terakhir: { label: 'Menunggu Verifikasi', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  disetujui_atasan: { label: 'Menunggu Verifikasi', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  disetujui_verifikasi_terakhir: { label: 'Menunggu Verifikasi', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  dikirim: { label: 'Menunggu Verifikasi', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  selesai: { label: 'Selesai', bg: '#D1FAE5', text: '#059669', border: '#6EE7B7', dot: '#059669' },
  ditolak_atasan: { label: 'Ditolak', bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', dot: '#DC2626' },
  ditolak: { label: 'Ditolak', bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', dot: '#DC2626' },
  closed_retensi_aktif: { label: 'Tertutup', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB', dot: '#9CA3AF' },
  permanen: { label: 'Permanen', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD', dot: '#2563EB' },
  musnah: { label: 'Musnah', bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', dot: '#DC2626' },
  // Unit Dokumen → Atasan Unit Dokumen = Menunggu Penerimaan
  menunggu_verifikasi_persetujuan_tu: { label: 'Menunggu Penerimaan', bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE', dot: '#7E22CE' },
  disetujui_persetujuan_tu: { label: 'Menunggu Penerimaan', bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE', dot: '#7E22CE' },
  menunggu_persetujuan_terakhir_tu: { label: 'Menunggu Penerimaan', bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE', dot: '#7E22CE' },
  disetujui_persetujuan_terakhir_tu: { label: 'Selesai', bg: '#D1FAE5', text: '#059669', border: '#6EE7B7', dot: '#059669' },
  arsip_inaktif_diterima: { label: 'Selesai', bg: '#D1FAE5', text: '#059669', border: '#6EE7B7', dot: '#059669' },
  penataan_arsip_inaktif: { label: 'Selesai', bg: '#D1FAE5', text: '#059669', border: '#6EE7B7', dot: '#059669' },
};

const statusStyle = (status: string) => {
  // Jika ada usulan terkait, override status berkas dengan status usulan
  const effectiveStatus = usulanStatus.value || status;
  const key = (effectiveStatus || '').toLowerCase().replace(/[\s-]+/g, '_');
  const s = STATUS_STYLE[key] || { label: effectiveStatus || status || '-', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB', dot: '#9CA3AF' };
  return { label: s.label, backgroundColor: s.bg, color: s.text, borderColor: s.border, dot: s.dot };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
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
        if (usulanRes?.data?.status) {
          usulanStatus.value = usulanRes.data.status;
        }

      } catch {
        // Ignore — fallback to berkas status
      }
    }
  } catch (e) {
    console.error('Gagal memuat berkas:', e);
  } finally {
    loading.value = false;
  }
});
</script>
