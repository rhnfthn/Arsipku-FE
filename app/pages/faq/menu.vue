<template>
  <div class="space-y-6 pt-5">
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
                  <p class="mt-4 leading-relaxed">
                    {{ faq.deskripsi }}
                  </p>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Search, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-vue-next';
import type { Faq, FaqKategori } from '@/composables/useFaq';

definePageMeta({ middleware: 'auth' });

const { faqs, loading, fetchFaqs, fetchCategories, votePuas, voteTidakPuas } = useFaq();

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
  const token = localStorage.getItem('token') || 'anonymous';
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
</style>
