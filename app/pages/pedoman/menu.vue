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
                <!-- Header row: badge + chevron -->
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

                    <!-- Expandable Deskripsi (clamp 4 lines, toggle via chevron only) -->
                    <p
                      class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                      :class="{
                        'line-clamp-4': !expandedCards[pedoman.id],
                      }"
                    >
                      {{ pedoman.deskripsi }}
                    </p>
                  </div>

                  <!-- Chevron toggle (pojok kanan atas, no hover effect) -->
                  <button
                    v-if="isTextLong(pedoman.deskripsi)"
                    @click="toggleExpand(pedoman.id)"
                    class="p-1 rounded shrink-0"
                    :title="expandedCards[pedoman.id] ? 'Sembunyikan' : 'Tampilkan selengkapnya'"
                  >
                    <ChevronDown
                      class="w-5 h-5 text-gray-400 transition-transform duration-200"
                      :class="{ 'rotate-180': expandedCards[pedoman.id] }"
                    />
                  </button>
                </div>

                <!-- Lampirans & Link (paling bawah, di atas tanggal, horizontal) -->
                <div
                  v-if="(pedoman.lampirans && pedoman.lampirans.length > 0) || pedoman.fileUrl"
                  class="flex items-center gap-2 mt-3 flex-wrap"
                >
                  <!-- Multiple lampirans -->
                  <template v-for="(lampiran, idx) in (pedoman.lampirans || [])" :key="idx">
                    <!-- Image lampiran (nama file, klik buka lightbox) -->
                    <button
                      v-if="isImageFile(lampiran.name)"
                      @click="openLightbox(getLampiranPreviewUrl(lampiran.url), lampiran.name)"
                      class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                    >
                      <ImageIcon class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                      <span class="truncate max-w-[100px]">{{ lampiran.name }}</span>
                    </button>

                    <!-- Non-image lampiran (file icon kecil) -->
                    <a
                      v-else
                      :href="getLampiranPreviewUrl(lampiran.url)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                    >
                      <FileText class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                      <span class="truncate max-w-[100px]">{{ lampiran.name }}</span>
                    </a>
                  </template>

                  <!-- Link dokumen eksternal -->
                  <a
                    v-if="pedoman.fileUrl"
                    :href="pedoman.fileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <ExternalLink class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                    <span class="truncate max-w-[150px]">{{ pedoman.fileUrl }}</span>
                  </a>
                </div>

                <!-- Tanggal (paling bawah) -->
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
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          @click.self="closeLightbox"
        >
          <!-- Close button -->
          <button
            @click="closeLightbox"
            class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Tutup"
          >
            <X class="w-6 h-6" />
          </button>

          <!-- Download button -->
          <a
            :href="lightboxUrl"
            download
            class="absolute top-4 right-16 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Download"
          >
            <Download class="w-6 h-6" />
          </a>

          <!-- Image -->
          <img
            :src="lightboxUrl"
            :alt="lightboxTitle"
            class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { Search, Calendar, Clock, ExternalLink, ChevronDown, ImageIcon, FileText, X, Download } from 'lucide-vue-next';
import { usePedoman, PEDOMAN_JENIS_OPTIONS } from '@/composables/usePedoman';
import type { PedomanJenis } from '@/composables/usePedoman';

definePageMeta({ middleware: 'auth' });

const { pedomanList, loading, fetchPedoman } = usePedoman();
const config = useRuntimeConfig();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pedoman', to: '/pedoman/menu' }
];

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
  // More than 4 lines (~80 chars/line)
  return text.length > 320;
};

// ── Lampiran helpers ────────────────────────────────────────────
const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

const getLampiranPreviewUrl = (lampiranUrl: string): string => {
  if (!lampiranUrl) return '';
  if (lampiranUrl.startsWith('http')) return lampiranUrl;
  // Use query parameter format to avoid NestJS wildcard routing issues
  return `${config.public.apiBaseUrl}/pedoman/preview-lampiran?path=${encodeURIComponent(lampiranUrl)}`;
};

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

// ── Image Lightbox ──────────────────────────────────────────────
const lightboxOpen = ref(false);
const lightboxUrl = ref('');
const lightboxTitle = ref('');

const openLightbox = (url: string, title: string) => {
  lightboxUrl.value = url;
  lightboxTitle.value = title;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
  lightboxUrl.value = '';
  lightboxTitle.value = '';
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
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>