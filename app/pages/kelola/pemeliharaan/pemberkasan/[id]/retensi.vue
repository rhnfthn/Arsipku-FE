<template>
  <div class="bg-gray-50 dark:bg-gray-900 pt-5 min-h-screen px-5">
    <PageHeader
      title="Detail Retensi Aktif"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: '/kelola/pemeliharaan/pemberkasan/berkas-saya' },
        { label: 'Retensi' },
      ]"
    />
    <div v-if="pending" class="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
    <div v-else-if="berkas" class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ berkas.judulBerkas }}</h2>
        <StatusBadge :status="berkas.status" />
      </div>

      <!-- Retensi Aktif Berjalan -->
      <UCard :ui="{ body: 'p-5' }">
        <div class="flex items-center gap-2 mb-4">
          <Clock3 class="h-5 w-5 text-primary-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white">Retensi Aktif Berjalan</h3>
        </div>
        <div class="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div class="h-full bg-primary-500" :style="{ width: retensiProgress + '%' }" />
        </div>
        <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">{{ retensiInfo }}</p>
      </UCard>

      <!-- Rantai Verifikasi -->
      <UCard :ui="{ body: 'p-5' }">
        <div class="flex items-center gap-2 mb-4">
          <History class="h-5 w-5 text-primary-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white">Rantai Verifikasi</h3>
        </div>
        <ol v-if="verifikasiList.length" class="space-y-4">
          <li v-for="v in verifikasiList" :key="v.id" class="flex gap-3">
            <div class="flex flex-col items-center">
              <span class="mt-1 h-3 w-3 rounded-full" :class="v.status === 'approved' ? 'bg-success-500' : v.status === 'rejected' ? 'bg-error-500' : 'bg-warning-500'" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ v.jabatanVerifikator || `Verifikator ${v.urutan}` }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ v.status }}{{ v.actionAt ? ` · ${formatDate(v.actionAt)}` : '' }}</p>
              <p v-if="v.catatan" class="mt-1 text-xs text-gray-600 dark:text-gray-300">"{{ v.catatan }}"</p>
            </div>
          </li>
        </ol>
        <p v-else class="text-sm text-gray-500">Belum ada data verifikasi.</p>
      </UCard>

      <!-- Statistik Retensi -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UCard :ui="{ body: 'p-4' }"><p class="text-xs text-gray-500">JRA Aktif</p><p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ berkas.retensiAktifTahun || 0 }} Tahun</p></UCard>
        <UCard :ui="{ body: 'p-4' }"><p class="text-xs text-gray-500">Sisa Waktu</p><p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ sisaWaktu }}</p></UCard>
        <UCard :ui="{ body: 'p-4' }"><p class="text-xs text-gray-500">Jatuh Tempo Inaktif</p><p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(berkas.tanggalRetensiInaktifBerakhir) }}</p></UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Clock3, History } from 'lucide-vue-next';

definePageMeta({ middleware: 'auth' });
const route = useRoute();
const { getBerkasById, getVerifikasiDetail } = useArsipDinamis();
const toast = useToast();

const berkas = ref<any>(null);
const verifikasiList = ref<any[]>([]);
const pending = ref(true);

const formatDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Belum tersedia';

const retensiProgress = computed(() => {
  const start = berkas.value?.tanggalDitutup;
  const end = berkas.value?.tanggalRetensiAktifBerakhir;
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now >= e) return 100;
  if (now <= s) return 0;
  return Math.round(((now - s) / (e - s)) * 100);
});

const retensiInfo = computed(() => {
  const end = berkas.value?.tanggalRetensiAktifBerakhir;
  if (!end) return 'Tanggal jatuh tempo retensi belum dihitung.';
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Masa retensi aktif telah berakhir.';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return `Tersisa ${years} tahun ${months} bulan dari total masa retensi aktif ${berkas.value?.retensiAktifTahun || 0} tahun.`;
});

const sisaWaktu = computed(() => {
  const end = berkas.value?.tanggalRetensiAktifBerakhir;
  if (!end) return '-';
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return days <= 0 ? 'Lewat' : `${days} hari`;
});

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [b, v] = await Promise.all([getBerkasById(id), getVerifikasiDetail(id)]);
    berkas.value = b?.data ?? b;
    const vp = v?.data ?? v;
    verifikasiList.value = Array.isArray(vp) ? vp : [];
  } catch (e: any) {
    toast.add({ title: 'Gagal memuat retensi', description: e?.message || 'Coba lagi.', color: 'error' });
  } finally {
    pending.value = false;
  }
});
</script>
