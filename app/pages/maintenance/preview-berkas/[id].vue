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
            <span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Aktif</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.retensiAktifTahun || 0 }} Tahun</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Inaktif</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.retensiInaktifTahun || 0 }} Tahun</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Tindakan Penyusutan Akhir</span>
            <p class="text-gray-900 dark:text-white font-medium">{{ berkas.tindakanPenyusutanAkhir || '-' }}</p>
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

      <!-- Daftar Naskah -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <UIcon name="i-lucide-file-text" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </span>
            <div>
              <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                Daftar Naskah
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ naskahList.length }}</span>
              </h2>
            </div>
          </div>
        </div>
        <DataTable
          :columns="naskahColumns"
          :rows="naskahList"
          :loading="loading"
          empty-message="Belum ada naskah dalam berkas ini."
        >
          <template #cell-nomorSurat="{ row }">
            <div class="min-w-40">
              <p class="font-mono text-xs font-semibold text-gray-900 dark:text-white">{{ row.nomorSurat || row.nomor || '-' }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.tanggalNaskah || row.tanggal) }}</p>
            </div>
          </template>
          <template #cell-perihal="{ row }">
            <p class="min-w-64 max-w-xl font-medium text-gray-800 dark:text-gray-200">{{ row.perihal || 'Tanpa perihal' }}</p>
          </template>
          <template #cell-naskahTipe="{ row }">
            <span class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{{ row.naskahTipe || row.jenis || '-' }}</span>
          </template>
          <template #cell-sumber="{ row }">
            <span class="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
              <UIcon :name="row.sumber === 'terkirim' ? 'i-lucide-send' : 'i-lucide-inbox'" class="h-3.5 w-3.5" />
              {{ row.sumber === 'terkirim' ? 'Terkirim' : 'Kotak Masuk' }}
            </span>
          </template>
          <template #cell-aksi="{ row }">
            <button
              type="button"
              @click="openNaskahPdf(row)"
              class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
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
  if (fromPage.value === 'penyusutan') {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
      { label: 'Detail Berkas' },
    ];
  }
  if (fromPage.value === 'tu' && nomorUsulan.value && usulanId.value) {
    return [
      { label: 'Beranda', to: '/' },
      { label: 'Penerimaan Usulan', to: '/maintenance/notifikasi-usulan-pindah-arsip' },
      { label: nomorUsulan.value, to: `/maintenance/verifikasi-berkas-fisik/${usulanId.value}` },
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

const berkas = ref<any>(null);
const naskahList = ref<any[]>([]);
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
  // Ambil detail naskah untuk mendapatkan final_pdf_url
  isLoadingPdf.value = true;
  try {
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

const naskahColumns = [
  { key: 'nomorSurat', label: 'Nomor & Tanggal' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Jenis' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'aksi', label: 'Aksi' },
];

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
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

onMounted(async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;

    // 1. Coba fetch dari DB inti (arsip-dinamis). Jika gagal (mis. berkas
    //    sudah soft-deleted karena musnah), lanjut ke fallback DB arsip.
    try {
      const res: any = await getBerkasById(id);
      berkas.value = res?.data ?? res;
      const naskahRes: any = await getDaftarNaskah(id, { limit: 50 });
      const raw = naskahRes?.data?.data ?? naskahRes?.data ?? [];
      naskahList.value = Array.isArray(raw) ? raw : [];
    } catch (e) {
      console.warn('Berkas tidak ditemukan di DB inti, coba DB arsip:', e);
      berkas.value = null;
    }

    // Jika berkas tidak ditemukan di DB inti (sudah soft-deleted, mis. musnah),
    // fallback ke DB arsip (arsipku_arsip_local) agar tetap bisa dilihat.
    if (!berkas.value) {
      try {
        const arsipRes: any = await apiGet(`/api/arsip/berkas/${id}`, {}, { skipCache: true });
        // Backend: { success, data: { status, data: { berkas, naskah } } }
        const arsipData = arsipRes?.data?.data ?? arsipRes?.data ?? arsipRes;
        const arsipBerkas = arsipData?.berkas;
        if (arsipBerkas) {
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
        }
      } catch (e) {
        console.error('Gagal memuat berkas dari DB arsip:', e);
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