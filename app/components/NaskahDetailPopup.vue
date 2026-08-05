<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[90vh] overflow-hidden z-10 flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <UIcon name="i-lucide-file-text" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </span>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Detail Naskah</h3>
          </div>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto">
          <!-- Loading -->
          <div v-if="detailLoading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
          </div>

          <template v-else>
            <!-- Perihal + meta -->
            <div class="mb-5">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {{ perihal || detailData?.perihal || detailData?.subject || 'Tanpa perihal' }}
              </h2>
              <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span v-if="nomorSurat || detailData?.nomor" class="font-mono font-semibold text-gray-700 dark:text-gray-300">
                  {{ nomorSurat || detailData?.nomor || '-' }}
                </span>
                <span v-if="tanggalNaskah || detailData?.tanggal || detailData?.created_at" class="flex items-center gap-1">
                  <span>•{{ formatDate(tanggalNaskah || detailData?.tanggal || detailData?.created_at) }}</span>
                  <span v-if="detailData?.created_at || detailData?.createdAt">•{{ formatTime(detailData?.created_at || detailData?.createdAt) }} WIB</span>
                </span>
                <span v-if="detailData?.sifat" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{{ detailData.sifat }}</span>
                <span v-if="jenisLabel !== '-'" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white dark:bg-blue-700">{{ jenisLabel }}</span>
                <span v-if="detailData?.ttd" class="text-gray-400">•{{ detailData.ttd }}</span>
              </div>
            </div>

            <!-- Pengirim (tanpa label) -->
            <div v-if="pengirimText" class="mb-4 flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div class="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-700 text-white text-xs font-bold shrink-0">
                {{ getInitials(pengirimText) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ pengirimText }}</p>
                <p v-if="pengirimName" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ pengirimName }}</p>
              </div>
            </div>

            <!-- Tertuju -->
            <div v-if="tertujuList.length > 0" class="mb-4 flex flex-col md:flex-row gap-2">
              <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
                Tertuju
              </div>
              <div class="flex flex-col gap-0.5 max-w-full min-w-0">
                <div
                  v-for="(t, idx) in tertujuList"
                  :key="idx"
                  class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0"
                >
                  <span class="text-gray-400 dark:text-gray-500 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                  <div class="truncate min-w-0">
                    <span class="font-medium">{{ t.position_text || t.positionText || '-' }}</span>
                    <span v-if="t.nama || t.name" class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama || t.name }})</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tembusan -->
            <div v-if="tembusanList.length > 0" class="mb-4 flex flex-col md:flex-row gap-2">
              <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
                Tembusan
              </div>
              <div class="flex flex-col gap-0.5 w-full min-w-0">
                <div
                  v-for="(t, idx) in tembusanList"
                  :key="idx"
                  class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0"
                >
                  <span class="text-gray-400 dark:text-gray-500 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                  <div class="truncate min-w-0">
                    <span class="font-medium">{{ t.position_text || t.positionText || '-' }}</span>
                    <span v-if="t.nama || t.name" class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama || t.name }})</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Isi Naskah (tanpa label) -->
            <div v-if="isiNaskah" class="mb-4">
              <div
                class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                v-html="isiNaskah"
              ></div>
            </div>

            <!-- Card info berkas induk -->
            <div v-if="berkasKode || berkasNama" class="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-lg p-4 text-xs text-primary-600 dark:text-primary-400">
              <UIcon name="i-lucide-info" class="w-4 h-4 inline mr-1" />
              Naskah ini bagian dari berkas
              <span class="font-mono font-semibold">{{ berkasKode || '-' }}</span>
              — {{ berkasNama || '-' }}
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end shrink-0">
          <button @click="close" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  nomorSurat?: string;
  tanggalNaskah?: string;
  perihal?: string;
  jenis?: string;
  sumber?: string;
  berkasKode?: string;
  berkasNama?: string;
  detail?: any;
  detailLoading?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>();

const close = () => emit('update:modelValue', false);

const JENIS_MAP: Record<string, string> = {
  ND: 'Nota Dinas',
  DI: 'Disposisi',
  SDI: 'Surat Dinas Internal',
  SDE: 'Surat Dinas Eksternal',
  KJ: 'Kajian',
  NU: 'Naskah Umum',
  K: 'Konsep',
  KN: 'Konsep',
};

const detailData = computed(() => props.detail || {});

const jenisLabel = computed(() => {
  const j = (props.jenis || detailData.value?.jenis || '').toUpperCase();
  return JENIS_MAP[j] || props.jenis || detailData.value?.jenis_label || '-';
});

const sumberLabel = computed(() => {
  const s = (props.sumber || '').toLowerCase();
  if (s === 'terkirim') return 'Terkirim';
  if (s === 'kotak_masuk' || s === 'inbox') return 'Kotak Masuk';
  return s || '-';
});

const sumberIcon = computed(() => {
  const s = (props.sumber || '').toLowerCase();
  return s === 'terkirim' ? 'i-lucide-send' : 'i-lucide-inbox';
});

const pengirimText = computed(() => {
  const d = detailData.value;
  return d?.pengirim?.position_text || d?.pengirim?.positionText || d?.from?.position_text || d?.from?.positionText || '';
});

const pengirimName = computed(() => {
  const d = detailData.value;
  return d?.pengirim?.nama || d?.pengirim?.name || d?.from?.nama || d?.from?.name || '';
});

const tertujuList = computed(() => {
  const d = detailData.value;
  return d?.to || d?.kepada || d?.penerima || d?.naskah_penerima || [];
});

const tembusanList = computed(() => {
  const d = detailData.value;
  return d?.cc || d?.tembusan || d?.naskah_tembusan || [];
});

const isiNaskah = computed(() => {
  const d = detailData.value;
  return d?.konten || d?.htmlContent || d?.content || d?.isi || null;
});

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};
</script>