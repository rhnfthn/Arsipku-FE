<template>
  <div class="space-y-6 pt-5">
    <EmptyState
      v-if="!canAccessPage()"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat halaman ini. Hubungi administrator."
    />
    <template v-else>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <PageHeader title="FAQ" :items="items" />
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
            Dapatkan bantuan
            <span
              class="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-300 dark:to-primary-200 bg-clip-text text-transparent"
            >
              apa pun
            </span>
            tentang Arsipku
          </h2>

          <p class="text-gray-500 dark:text-gray-300 mt-3">Ajukan pertanyaan. Temukan jawaban.</p>

          <div class="mt-6 relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Apa masalah Anda?"
              class="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="bg-white dark:bg-gray-900 px-2 md:px-6 py-6 transition-colors">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Sidebar -->
          <div
            class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-xl space-y-3 transition-colors"
          >
            <h3
              class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide"
            >
              Kategori
            </h3>

            <div
              v-if="categories.length === 0"
              class="text-xs text-gray-400 dark:text-gray-500 italic px-2"
            >
              Memuat kategori...
            </div>
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="selectedCategoryId = cat.id"
              :class="[
                'w-full text-left px-4 py-2 rounded-xl text-sm transition capitalize',
                selectedCategoryId === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              ]"
            >
              {{ cat.nama }}
            </button>
          </div>

          <!-- FAQ LIST -->
          <div class="lg:col-span-3 space-y-4">
            <div v-if="loading" class="flex justify-center py-12">
              <div
                class="w-6 h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"
              />
            </div>

            <div
              v-else-if="faqs.length === 0"
              class="text-center text-gray-400 dark:text-gray-500 py-12 text-sm"
            >
              Tidak ada FAQ untuk kategori ini.
            </div>

            <div
              v-else
              v-for="(faq, index) in faqs"
              :key="faq.id"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg dark:shadow-md dark:shadow-black/20 overflow-hidden transition-colors"
            >
              <!-- Question -->
              <button
                @click="toggle(index)"
                class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span class="font-medium text-gray-700 dark:text-gray-100">
                  {{ faq.pertanyaan }}
                </span>

                <ChevronDown
                  class="w-5 h-5 transition-all duration-300 shrink-0 ml-3"
                  :class="
                    isOpen(index)
                      ? 'rotate-180 text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  "
                />
              </button>

              <!-- Answer -->
              <transition name="fade">
                <div
                  v-if="isOpen(index)"
                  class="px-6 pb-6 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 transition-colors"
                >
                  <div class="mt-4 leading-relaxed faq-prose" v-html="faq.deskripsi" />

                  <!-- Lampirans & Link -->
                  <div
                    v-if="(faq.lampirans && faq.lampirans.length > 0) || faq.fileUrl"
                    class="flex items-center gap-2 mt-4 flex-wrap"
                  >
                    <template v-for="(lampiran, idx) in (faq.lampirans || [])" :key="idx">
                      <button
                        v-if="isImageFile(lampiran.name)"
                        @click="openLightbox(getLampiranPreviewUrl(lampiran.url), lampiran.name)"
                        class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <ImageIcon class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                        <span class="truncate max-w-[100px]">{{ lampiran.name }}</span>
                      </button>
                      <button
                        v-else-if="isPdfFile(lampiran.name)"
                        @click="openPdfPreview(getLampiranPreviewUrl(lampiran.url), lampiran.name)"
                        class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <FileText class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                        <span class="truncate max-w-[100px]">{{ lampiran.name }}</span>
                      </button>
                      <a
                        v-else
                        :href="getLampiranPreviewUrl(lampiran.url)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <FileText class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                        <span class="truncate max-w-[100px]">{{ lampiran.name }}</span>
                      </a>
                    </template>
                    <a
                      v-if="faq.fileUrl"
                      :href="faq.fileUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 transition-colors"
                    >
                      <ExternalLink class="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                      <span class="truncate max-w-[150px]">{{ faq.fileUrl }}</span>
                    </a>
                  </div>

                  <div class="flex gap-3 mt-5">
                    <button
                      @click="handleVote(faq, 'puas')"
                      :disabled="votingId === faq.id"
                      :class="[
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition disabled:cursor-not-allowed',
                        isVoted(faq.id, 'puas')
                          ? 'bg-primary-500 border-primary-500 text-white dark:bg-primary-600 dark:border-primary-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      ]"
                    >
                      <ThumbsUp class="w-4 h-4" />
                      Puas
                    </button>

                    <button
                      @click="handleVote(faq, 'tidak-puas')"
                      :disabled="votingId === faq.id"
                      :class="[
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition disabled:cursor-not-allowed',
                        isVoted(faq.id, 'tidak-puas')
                          ? 'bg-primary-500 border-primary-500 text-white dark:bg-primary-600 dark:border-primary-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      ]"
                    >
                      <ThumbsDown class="w-4 h-4" />
                      Tidak Puas
                    </button>
                  </div>
                </div>
              </transition>
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
          <button
            @click="closeLightbox"
            class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Tutup"
          >
            <X class="w-6 h-6" />
          </button>
          <img
            :src="lightboxUrl"
            :alt="lightboxTitle"
            class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
        </div>
      </Transition>
    </Teleport>

    <!-- PDF Preview Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="pdfPreviewOpen"
          class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div class="flex items-center gap-2 min-w-0">
              <FileText class="w-5 h-5 text-primary shrink-0" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {{ pdfPreviewTitle }}
              </span>
            </div>
            <button
              @click="closePdfPreview"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
              title="Tutup"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="flex-1 bg-gray-100 dark:bg-gray-950">
            <iframe
              v-if="pdfPreviewUrl"
              :src="pdfPreviewUrl"
              class="w-full h-full border-none"
              :title="pdfPreviewTitle"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Search, ChevronDown, ThumbsUp, ThumbsDown, ExternalLink, ImageIcon, FileText, X } from 'lucide-vue-next';
import type { BreadcrumbItem } from '@nuxt/ui';
import type { Faq, FaqKategori } from '@/composables/useFaq';

definePageMeta({ middleware: 'auth' });

const { canAccessPage } = useFeatureAccess();
const { faqs, loading, fetchFaqs, fetchCategories, votePuas, voteTidakPuas } = useFaq();
const config = useRuntimeConfig();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'FAQ', to: '/faq/menu' }
] satisfies BreadcrumbItem[];

// ─── Categories ──────────────────────────────────────────────────────────────
const categories = ref<FaqKategori[]>([]);
const selectedCategoryId = ref('');

// ─── Open indices (support multi-open when searching) ────────────────────────
const openIndices = ref<Set<number>>(new Set());

const isOpen = (index: number) => openIndices.value.has(index);

const toggle = (index: number) => {
  const s = new Set(openIndices.value);
  if (s.has(index)) {
    s.delete(index);
  } else {
    s.add(index);
  }
  openIndices.value = s;
};

// ─── Search ───────────────────────────────────────────────────────────────────
const searchQuery = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const isSearching = computed(() => searchQuery.value.trim().length > 0);

// ─── Persisted vote state per FAQ ───────────────────────────────────────────
type VoteType = 'puas' | 'tidak-puas';
const savedVotes = ref<Record<string, VoteType>>({});

const getVoteStorageKey = () => {
  if (!process.client) return 'faq-feedback-votes';
  const token = getStoredAccessToken() || 'anonymous';
  return `faq-feedback-votes:${token}`;
};

const loadSavedVotes = () => {
  if (!process.client) return;
  try {
    const raw = localStorage.getItem(getVoteStorageKey());
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      savedVotes.value = parsed as Record<string, VoteType>;
    }
  } catch {
    savedVotes.value = {};
  }
};

const persistSavedVotes = () => {
  if (!process.client) return;
  localStorage.setItem(getVoteStorageKey(), JSON.stringify(savedVotes.value));
};

const isVoted = (faqId: string, type: VoteType) => savedVotes.value[faqId] === type;

watch(searchQuery, (q) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const trimmed = q.trim();
    if (trimmed) {
      await fetchFaqs({ search: trimmed });
      // Auto-open all results
      openIndices.value = new Set(faqs.value.map((_, i) => i));
    } else {
      // Back to category view
      openIndices.value = new Set();
      if (selectedCategoryId.value) {
        await fetchFaqs({ kategoriId: selectedCategoryId.value });
      }
    }
  }, 350);
});

// ─── Vote state ───────────────────────────────────────────────────────────────
const votingId = ref<string | null>(null);

// ─── Load categories then load first category FAQs ───────────────────────────
onMounted(async () => {
  loadSavedVotes();
  const cats = await fetchCategories();
  categories.value = cats;
  const first = cats[0];
  if (first) {
    selectedCategoryId.value = first.id;
    await fetchFaqs({ kategoriId: first.id });
  }
});

watch(selectedCategoryId, async (catId) => {
  if (isSearching.value) return; // don't switch category while searching
  openIndices.value = new Set();
  if (catId) await fetchFaqs({ kategoriId: catId });
});

const handleVote = async (faq: Faq, type: 'puas' | 'tidak-puas') => {
  if (votingId.value === faq.id || isVoted(faq.id, type)) return;

  const previousVote = savedVotes.value[faq.id];
  savedVotes.value = {
    ...savedVotes.value,
    [faq.id]: type
  };
  persistSavedVotes();

  votingId.value = faq.id;
  try {
    const updatedFaq = type === 'puas' ? await votePuas(faq.id) : await voteTidakPuas(faq.id);

    faq.puas = updatedFaq.puas;
    faq.tidakPuas = updatedFaq.tidakPuas;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status !== 409) {
      if (previousVote) {
        savedVotes.value = {
          ...savedVotes.value,
          [faq.id]: previousVote
        };
      } else {
        const nextVotes = { ...savedVotes.value };
        delete nextVotes[faq.id];
        savedVotes.value = nextVotes;
      }
      persistSavedVotes();
    }
  } finally {
    votingId.value = null;
  }
};

// ── Lampiran helpers ────────────────────────────────────────────
const isImageFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

const isPdfFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext === 'pdf';
};

const getLampiranPreviewUrl = (lampiranUrl: string): string => {
  if (!lampiranUrl) return '';
  if (lampiranUrl.startsWith('http')) return lampiranUrl;
  return `${config.public.apiBaseUrl}/faq/preview-lampiran?path=${encodeURIComponent(lampiranUrl)}`;
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

// ── PDF Preview ─────────────────────────────────────────────────
const pdfPreviewOpen = ref(false);
const pdfPreviewUrl = ref('');
const pdfPreviewTitle = ref('');

const openPdfPreview = (url: string, title: string) => {
  pdfPreviewUrl.value = url;
  pdfPreviewTitle.value = title;
  pdfPreviewOpen.value = true;
};

const closePdfPreview = () => {
  pdfPreviewOpen.value = false;
  pdfPreviewUrl.value = '';
  pdfPreviewTitle.value = '';
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.faq-prose :deep(ul),
.faq-prose :deep(ol) {
  list-style-position: inside;
  padding-left: 1rem;
  margin: 0.5rem 0;
}

.faq-prose :deep(ul) {
  list-style-type: disc;
}

.faq-prose :deep(ol) {
  list-style-type: decimal;
}

.faq-prose :deep(li) {
  margin: 0.25rem 0;
}

.faq-prose :deep(strong) {
  font-weight: 700;
}

.faq-prose :deep(em) {
  font-style: italic;
}

.faq-prose :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}
</style>
