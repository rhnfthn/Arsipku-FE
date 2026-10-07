<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="item ? `Detail Usulan ${item.nomorUsulan}` : 'Usul Pindah Arsip'"
        :items="breadcrumbItems"
      />
      <NuxtLink
        to="/maintenance/transfer-active-to-inactive-file"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8"
    >
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else>
      <div class="space-y-5">
        <!-- Semua bagian ditampilkan vertikal dan dapat dilipat. -->
        <TransferDetailCard
          v-if="item"
          :transfer="item"
          :daftar-berkas="daftarIsi"
          :collapsible="true"
          :show-header-status="false"
        />

        <!-- Mode berkas (belum jadi usulan): card Informasi Berkas -->
        <div
          v-else-if="berkas"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 text-left"
            :aria-expanded="berkasInfoOpen"
            @click="berkasInfoOpen = !berkasInfoOpen"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Berkas</h3>
            <div class="flex items-center gap-3">
              <StatusBadge v-if="berkas.status" :status="berkas.status" />
              <UIcon
                :name="berkasInfoOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="h-4 w-4 text-gray-400"
              />
            </div>
          </button>
          <div v-show="berkasInfoOpen" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-4">
            <div v-for="m in berkasMetadata" :key="m.label">
              <span class="text-gray-500 dark:text-gray-400 text-xs">{{ m.label }}</span>
              <p class="text-gray-900 dark:text-white font-medium">{{ m.value }}</p>
            </div>
          </div>
        </div>

        <!-- Timeline ditaruh di bawah seluruh detail, tidak lagi sticky di samping. -->
        <TimelineRiwayat v-if="item" :item="item" />

        <!-- Button: Ajukan ke Atasan -->
        <button
          v-if="showForm"
          @click="isAjukanModalOpen = true"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors inline-flex items-center gap-2"
        >
          <UIcon name="i-lucide-send" class="w-4 h-4" />
          Ajukan ke Atasan
        </button>

        <!-- Info: usulan sudah diajukan (bukan DRAFT) -->
        <div
          v-else-if="item && item.status === 'MENUNGGU_VERIFIKASI_ATASAN'"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Menunggu Verifikasi Atasan
              </h3>
              <p class="text-sm text-blue-600 dark:text-blue-400">
                Usulan dikirim ke {{ item.atasanName }}. Menunggu verifikasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div
      v-if="!loading && !item && !berkas"
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500"
    >
      Data tidak ditemukan.
    </div>

    <!-- Modal: Ajukan ke Atasan Managerial -->
    <AjukanAtasanModal
      v-model="isAjukanModalOpen"
      :usulan="item"
      :berkas="berkas"
      @submitted="onSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue';
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue';
import AjukanAtasanModal from '~/components/transfer-active-to-inactive/AjukanAtasanModal.vue';
import StatusBadge from '~/components/StatusBadge.vue';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth', 'division-secretary-only'] });

const route = useRoute();
const { getBerkasById } = useArsipDinamis();
const { fetchDetail } = useTransferActiveToInactive();
const { apiGet } = useApi();
const toast = useToast();

const loading = ref(true);
/** Mode usulan: id = usulan ID (DRAFT) → tampilkan TransferDetailCard + Timeline. */
const item = ref<TransferActiveToInactive | null>(null);
/** Mode berkas: id = berkas ID (belum jadi usulan) → tampilkan info berkas. */
const berkas = ref<any | null>(null);
const daftarIsi = ref<any[]>([]);

const isAjukanModalOpen = ref(false);
const berkasInfoOpen = ref(true);

const breadcrumbItems = computed(() => [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/transfer-active-to-inactive-file' },
  {
    label: 'Pemindahan Arsip Aktif ke Inaktif',
    to: '/maintenance/transfer-active-to-inactive-file',
  },
  { label: item.value?.nomorUsulan ?? 'Usul Pindah Arsip' },
]);

/** Form ajukan tampil jika: mode berkas (belum usulan) ATAU usulan masih DRAFT. */
const showForm = computed(
  () => !loading.value && (berkas.value || (item.value && item.value.status === 'DRAFT'))
);

/** Metadata berkas untuk mode belum-usulan. */
const berkasMetadata = computed(() => {
  const b = berkas.value;
  if (!b) return [];
  const fmt = (v: any) => {
    if (!v) return '-';
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? String(v)
      : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return [
    { label: 'Nama Berkas', value: b.judulBerkas ?? '-' },
    { label: 'Kode Berkas', value: b.kodeBerkas ?? '-' },
    {
      label: 'Klasifikasi',
      value:
        [b.klasifikasi, b.klasifikasiTeks ?? b.klasifikasi_text].filter(Boolean).join(' — ') || '-',
    },
    { label: 'Retensi Aktif', value: `${b.retensiAktifTahun ?? 0} Tahun` },
    { label: 'Retensi Inaktif', value: `${b.retensiInaktifTahun ?? 0} Tahun` },
    { label: 'Lokasi Fisik', value: b.lokasi ?? '-' },
    { label: 'Tanggal Dibuat', value: fmt(b.tanggalDibuat) },
    { label: 'Retensi Aktif Berakhir', value: fmt(b.tanggalRetensiAktifBerakhir) },
    { label: 'Retensi Inaktif Berakhir', value: fmt(b.tanggalRetensiInaktifBerakhir) },
    { label: 'Status', value: b.status ?? '-' },
  ];
});

const load = async () => {
  loading.value = true;
  const id = route.params.id as string;
  try {
    // 1. Coba load sebagai usulan (id = usulan ID, mis. baris DRAFT).
    try {
      const usulan = await fetchDetail(id);
      if (usulan?.arsipId) {
        item.value = usulan;
        await loadDaftarIsi(id);
        return;
      }
    } catch {
      // Bukan usulan ID → lanjut sebagai berkas ID.
    }
    // 2. id = berkas ID (baris belum-usulan).
    const res: any = await getBerkasById(id);
    const payload = res?.data ?? res;
    berkas.value = payload ?? null;
  } catch (e) {
    console.error('Gagal memuat data:', e);
  } finally {
    loading.value = false;
  }
};

const loadDaftarIsi = async (id: string) => {
  try {
    const res: any = await apiGet(
      `/transfer-active-to-inactive/${id}/daftar-isi`,
      {},
      { skipCache: true },
    );
    daftarIsi.value = res?.data?.daftarIsi ?? [];
  } catch (e) {
    console.error('Gagal memuat daftar isi berkas:', e);
    daftarIsi.value = [];
  }
};

/** Callback setelah modal submit sukses → toast + kembali ke index. */
const onSubmitted = () => {
  toast.add({
    title: 'Usulan berhasil diajukan',
    description: 'Usulan pemindahan arsip telah dikirim ke atasan managerial.',
    color: 'success',
  });
  navigateTo('/maintenance/transfer-active-to-inactive-file');
};

onMounted(() => {
  load();
});
</script>
