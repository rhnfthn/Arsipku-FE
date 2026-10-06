<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <PageHeader title="Penandatanganan" :items="breadcrumbItems" />

    <div class="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p class="text-sm font-semibold text-blue-900 dark:text-blue-200">BAC menunggu tanda tangan</p>
          <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Halaman ini menampilkan Berita Acara yang menunjuk Anda sebagai Pejabat Pihak Pertama.
          </p>
        </div>
      </div>
    </div>

    <div class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div v-if="loading" class="space-y-3 p-5">
        <div v-for="n in 3" :key="n" class="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
      </div>

      <div v-else-if="rows.length === 0" class="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
        <UIcon name="i-lucide-pen-line" class="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p class="text-sm">Tidak ada BAC yang menunggu tanda tangan.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#457fb6] text-left text-white">
            <tr>
              <th class="px-5 py-3 font-semibold">Nomor Usulan</th>
              <th class="px-5 py-3 font-semibold">Arsip</th>
              <th class="px-5 py-3 font-semibold">Nomor BAC</th>
              <th class="px-5 py-3 font-semibold">Tanggal</th>
              <th class="px-5 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-b border-gray-100 last:border-0 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <td class="whitespace-nowrap px-5 py-4 font-medium text-gray-800 dark:text-gray-100">
                {{ row.nomorUsulan }}
              </td>
              <td class="max-w-md px-5 py-4 text-gray-600 dark:text-gray-300">
                <div class="font-medium">{{ row.arsipKode || '-' }}</div>
                <div class="truncate text-xs text-gray-500 dark:text-gray-400">{{ row.arsipPerihal }}</div>
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                {{ row.beritaAcaraNomor || '-' }}
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                {{ formatDate(row.tanggalUsulan) }}
              </td>
              <td class="px-5 py-4 text-center">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    @click="navigateTo(`/maintenance/transfer-active-to-inactive-file/${row.id}`)"
                  >
                    <UIcon name="i-lucide-eye" class="h-3.5 w-3.5" /> Detail
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                    @click="openSign(row)"
                  >
                    <UIcon name="i-lucide-pen-tool" class="h-3.5 w-3.5" /> Tanda Tangani
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DigsigPassphraseModal
      :open="isModalOpen"
      :signer-info="signerInfo"
      :is-loading="signing"
      :hide-qr="true"
      :hide-basah="true"
      @update:open="(value: boolean) => (isModalOpen = value)"
      @submit="submitSign"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DigsigPassphraseModal from '~/components/Tulis/DigsigPassphraseModal.vue';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import { formatDate } from '~/utils/transfer-status';

definePageMeta({ middleware: ['auth'] });

interface SigningRow {
  id: string;
  nomorUsulan: string;
  arsipPerihal: string;
  arsipKode: string | null;
  tanggalUsulan: string;
  status: string;
  beritaAcaraNomor: string | null;
  beritaAcaraUrl: string | null;
  bacPihakPertamaName: string | null;
  bacPihakPertamaJabatan: string | null;
  bacTembusanCount: number;
}

const { apiGet, apiPost } = useApi();
const { user } = useAuth();
const toast = useToast();
const rows = ref<SigningRow[]>([]);
const loading = ref(false);
const signing = ref(false);
const isModalOpen = ref(false);
const selectedRow = ref<SigningRow | null>(null);

const breadcrumbItems = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/penandatanganan' },
  { label: 'Penandatanganan', to: '/maintenance/penandatanganan' },
];

const signerInfo = computed(() => ({
  name: user.value?.nama ?? '-',
  role: user.value?.positionText ?? '-',
  label: 'Berita Acara Serah Terima',
}));

const loadRows = async () => {
  loading.value = true;
  try {
    const res: any = await apiGet('/transfer-active-to-inactive/signing-list', {}, { skipCache: true });
    rows.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    console.error('Gagal memuat BAC untuk penandatanganan:', error);
    rows.value = [];
    toast.add({ title: 'Gagal memuat data', description: 'Daftar BAC tidak dapat dimuat.', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const openSign = (row: SigningRow) => {
  selectedRow.value = row;
  isModalOpen.value = true;
};

const submitSign = async (payload: { method: string; passphrase?: string }) => {
  if (!selectedRow.value || !payload.passphrase) return;
  signing.value = true;
  try {
    await apiPost(`/digsig/bac/${selectedRow.value.id}/sign`, {
      passphrase: payload.passphrase,
    });
    isModalOpen.value = false;
    toast.add({
      title: 'BAC berhasil ditandatangani',
      description: 'Tembusan telah diberi tahu saat BAC tersedia.',
      color: 'success',
    });
    await loadRows();
  } catch (error: any) {
    console.error('Gagal menandatangani BAC:', error);
    toast.add({
      title: 'Gagal menandatangani BAC',
      description: error?.response?.data?.message || error?.message || 'Periksa passphrase Anda.',
      color: 'error',
    });
  } finally {
    signing.value = false;
  }
};

onMounted(loadRows);
</script>
