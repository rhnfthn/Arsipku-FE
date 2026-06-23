<template>
  <div class="space-y-6 pt-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <PageHeader title="Pedoman" :items="items" />
    </div>

    <!-- OUTER CARD -->
    <div
      class="rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
    >
      <!-- HERO -->
      <div
        class="px-8 md:px-12 py-12 text-center bg-gradient-to-br from-primary-100 from-45% to-primary dark:from-primary-900/40 dark:to-primary-700 transition-colors"
      >
        <div class="max-w-2xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">
            Pedoman
            <span
              class="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-300 dark:to-primary-200 bg-clip-text text-transparent"
            >
              Kearsipan
            </span>
          </h2>

          <p class="text-gray-500 dark:text-gray-300 mt-3">
            Peraturan Direksi, Keputusan Direksi, dan SOP tentang Kearsipan
          </p>

          <div class="mt-6 relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari pedoman..."
              class="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="bg-white dark:bg-gray-900 px-2 md:px-6 py-6 transition-colors">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Sidebar Jenis -->
          <div
            class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xl space-y-3 transition-colors"
          >
            <h3
              class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide"
            >
              Jenis Dokumen
            </h3>

            <button
              @click="selectedJenis = ''"
              :class="[
                'w-full text-left px-4 py-2 rounded-xl text-sm transition',
                selectedJenis === ''
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              ]"
            >
              Semua
            </button>

            <button
              v-for="opt in jenisOptions"
              :key="opt.value"
              @click="selectedJenis = opt.value"
              :class="[
                'w-full text-left px-4 py-2 rounded-xl text-sm transition',
                selectedJenis === opt.value
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- PEDOMAN LIST -->
          <div class="lg:col-span-3 space-y-4">
            <div v-if="loading" class="flex justify-center py-12">
              <div
                class="w-6 h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"
              />
            </div>

            <div
              v-else-if="filteredPedoman.length === 0"
              class="text-center text-gray-400 dark:text-gray-500 py-12 text-sm"
            >
              Tidak ada pedoman yang ditemukan.
            </div>

            <div
              v-else
              v-for="pedoman in filteredPedoman"
              :key="pedoman.id"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg dark:shadow-md dark:shadow-black/20 overflow-hidden transition-colors"
            >
              <div class="px-6 py-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getJenisBadgeClass(pedoman.jenis)"
                      >
                        {{ pedoman.jenis }}
                      </span>
                      <span
                        v-if="pedoman.nomorDokumen"
                        class="text-xs text-gray-400 dark:text-gray-500"
                      >
                        No. {{ pedoman.nomorDokumen }}
                      </span>
                    </div>

                    <h3 class="font-medium text-gray-700 dark:text-gray-100 mb-1">
                      {{ pedoman.judul }}
                    </h3>

                    <!-- Expandable Deskripsi -->
                    <div class="relative">
                      <p
                        class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-300 ease-in-out"
                        :class="{
                          'line-clamp-3': !expandedCards[pedoman.id],
                        }"
                      >
                        {{ pedoman.deskripsi }}
                      </p>
                      <button
                        v-if="isTextLong(pedoman.deskripsi)"
                        @click="toggleExpand(pedoman.id)"
                        class="mt-1 text-xs font-medium text-primary hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
                      >
                        <span>{{ expandedCards[pedoman.id] ? 'Sembunyikan' : 'Lihat Selengkapnya' }}</span>
                        <ChevronDown
                          class="w-3.5 h-3.5 transition-transform duration-200"
                          :class="{ 'rotate-180': expandedCards[pedoman.id] }"
                        />
                      </button>
                    </div>

                    <!-- Lampiran Preview -->
                    <div
                      v-if="pedoman.lampiranUrl && pedoman.lampiranName"
                      class="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                    >
                      <!-- Image preview -->
                      <div v-if="isImageFile(pedoman.lampiranName)" class="space-y-2">
                        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <ImageIcon class="w-3.5 h-3.5" />
                          <span>{{ pedoman.lampiranName }}</span>
                        </div>
                        <img
                          :src="getLampiranPreviewUrl(pedoman.lampiranUrl)"
                          :alt="pedoman.lampiranName"
                          class="max-h-48 rounded-lg object-contain border border-gray-200 dark:border-gray-600"
                          @error="handleImgError"
                        />
                      </div>
                      <!-- File preview (non-image) -->
                      <div v-else class="flex items-center gap-3">
                        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                          <FileText class="w-5 h-5 text-primary dark:text-primary-300" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                            {{ pedoman.lampiranName }}
                          </p>
                          <p class="text-xs text-gray-400 dark:text-gray-500">
                            {{ getFileExtension(pedoman.lampiranName).toUpperCase() }}
                          </p>
                        </div>
                        <a
                          :href="getLampiranPreviewUrl(pedoman.lampiranUrl)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        >
                          <ExternalLink class="w-3.5 h-3.5" />
                          Buka
                        </a>
                      </div>
                    </div>

                    <div class="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
                      <span v-if="pedoman.tanggalBerlaku" class="flex items-center gap-1">
                        <Calendar class="w-3.5 h-3.5" />
                        Berlaku: {{ formatDate(pedoman.tanggalBerlaku) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Clock class="w-3.5 h-3.5" />
                        Diperbarui: {{ formatDate(pedoman.updated_at) }}
                      </span>
                    </div>
                  </div>

                  <a
                    v-if="pedoman.fileUrl"
                    :href="pedoman.fileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors shrink-0"
                  >
                    <ExternalLink class="w-4 h-4" />
                    Lihat Dokumen
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { Search, Calendar, Clock, ExternalLink, ChevronDown, ImageIcon, FileText } from 'lucide-vue-next';
import { usePedoman, PEDOMAN_JENIS_OPTIONS } from '@/composables/usePedoman';
import type { PedomanJenis } from '@/composables/usePedoman';

definePageMeta({ middleware: 'auth' });

const { pedomanList, loading, fetchPedoman } = usePedoman();
const config = useRuntimeConfig();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pedoman', to: '/pedoman/menu' }
] satisfies BreadcrumbItem[];

const jenisOptions = PEDOMAN_JENIS_OPTIONS;

const selectedJenis = ref('');
const searchQuery = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ── Expandable cards ────────────────────────────────────────────
const expandedCards = reactive<Record<string, boolean>>({});

const toggleExpand = (id: string) => {
  expandedCards[id] = !expandedCards[id];
};

const isTextLong = (text: string): boolean => {
  // Approximately 3 lines at ~80 chars/line
  return text.length > 200;
};

// ── Lampiran helpers ────────────────────────────────────────────
const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const getLampiranPreviewUrl = (lampiranUrl: string): string => {
  if (lampiranUrl.startsWith('http')) return lampiranUrl;
  // Use preview-file endpoint or direct MinIO path
  return `${config.public.apiBaseUrl}/pedoman/preview-lampiran/${encodeURIComponent(lampiranUrl)}`;
};

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

// ── Filtered ────────────────────────────────────────────────────
const filteredPedoman = computed(() => {
  if (!selectedJenis.value) return pedomanList.value;
  return pedomanList.value.filter((p) => p.jenis === selectedJenis.value);
});

const getJenisBadgeClass = (jenis: PedomanJenis): string => {
  switch (jenis) {
    case 'Peraturan Direksi':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'Keputusan Direksi':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'SOP Kearsipan':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

watch(searchQuery, (q) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    await fetchPedoman({ search: q.trim() || undefined });
  }, 350);
});

watch(selectedJenis, async (jenis) => {
  await fetchPedoman({ jenis: jenis || undefined, search: searchQuery.value.trim() || undefined });
});

onMounted(async () => {
  await fetchPedoman();
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>