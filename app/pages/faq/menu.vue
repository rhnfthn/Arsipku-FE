<template>
  <div class="space-y-6 pt-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <PageHeader title="FAQ" :items="items" />
    </div>

    <!-- OUTER CARD -->
    <div class="rounded-3xl overflow-hidden shadow-sm rounded-xl border border-gray-200">
      <div
        class="px-8 md:px-12 py-12 text-center bg-gradient-to-br from-primary-100 from-45% to-primary"
      >
        <div class="max-w-2xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-semibold text-gray-800">
            Dapatkan bantuan
            <span
              class="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
            >
              apa pun
            </span>
            tentang Arsipku
          </h2>

          <p class="text-gray-500 mt-3">Ajukan pertanyaan. Temukan jawaban.</p>

          <div class="mt-6 relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Apa masalah Anda?"
              class="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="bg-white px-2 md:px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Sidebar -->
          <div class="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-xl space-y-3">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategori</h3>

            <div v-if="categories.length === 0" class="text-xs text-gray-400 italic px-2">
              Memuat kategori...
            </div>
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="selectedCategoryId = cat.id"
              :class="[
                'w-full text-left px-4 py-2 rounded-xl text-sm transition capitalize',
                selectedCategoryId === cat.id
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'hover:bg-gray-100 text-gray-600'
              ]"
            >
              {{ cat.nama }}
            </button>
          </div>

          <!-- FAQ LIST -->
          <div class="lg:col-span-3 space-y-4">
            <div v-if="loading" class="flex justify-center py-12">
              <div
                class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
              />
            </div>

            <div v-else-if="faqs.length === 0" class="text-center text-gray-400 py-12 text-sm">
              Tidak ada FAQ untuk kategori ini.
            </div>

            <div
              v-else
              v-for="(faq, index) in faqs"
              :key="faq.id"
              class="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden"
            >
              <!-- Question -->
              <button
                @click="toggle(index)"
                class="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span class="font-medium text-gray-700">
                  {{ faq.pertanyaan }}
                </span>

                <ChevronDown
                  class="w-5 h-5 transition-all duration-300"
                  :class="isOpen(index) ? 'rotate-180 text-blue-600' : 'text-gray-400'"
                />
              </button>

              <!-- Answer -->
              <transition name="fade">
                <div
                  v-if="isOpen(index)"
                  class="px-6 pb-6 text-sm text-gray-600 border-t border-gray-300 bg-gray-50"
                >
                  <p class="mt-4 leading-relaxed">
                    {{ faq.deskripsi }}
                  </p>

                  <div class="flex gap-3 mt-5">
                    <button
                      @click="handleVote(faq, 'puas')"
                      :disabled="votingId === faq.id"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      <ThumbsUp class="w-4 h-4" />
                      Puas <span class="text-xs text-gray-400">({{ faq.puas }})</span>
                    </button>

                    <button
                      @click="handleVote(faq, 'tidak-puas')"
                      :disabled="votingId === faq.id"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      <ThumbsDown class="w-4 h-4" />
                      Tidak Puas <span class="text-xs text-gray-400">({{ faq.tidakPuas }})</span>
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
import { ref, computed, watch, onMounted } from 'vue'
import { Search, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import type { Faq, FaqKategori } from '@/composables/useFaq'

definePageMeta({ middleware: 'auth' })

const { faqs, loading, fetchFaqs, fetchCategories, votePuas, voteTidakPuas } = useFaq()

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'FAQ', to: '/faq/menu' }
] satisfies BreadcrumbItem[]

// ─── Categories ──────────────────────────────────────────────────────────────
const categories = ref<FaqKategori[]>([])
const selectedCategoryId = ref('')

// ─── Open indices (support multi-open when searching) ────────────────────────
const openIndices = ref<Set<number>>(new Set())

const isOpen = (index: number) => openIndices.value.has(index)

const toggle = (index: number) => {
  const s = new Set(openIndices.value)
  if (s.has(index)) {
    s.delete(index)
  } else {
    s.add(index)
  }
  openIndices.value = s
}

// ─── Search ───────────────────────────────────────────────────────────────────
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const isSearching = computed(() => searchQuery.value.trim().length > 0)

watch(searchQuery, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const trimmed = q.trim()
    if (trimmed) {
      await fetchFaqs({ search: trimmed })
      // Auto-open all results
      openIndices.value = new Set(faqs.value.map((_, i) => i))
    } else {
      // Back to category view
      openIndices.value = new Set()
      if (selectedCategoryId.value) {
        await fetchFaqs({ kategoriId: selectedCategoryId.value })
      }
    }
  }, 350)
})

// ─── Vote state ───────────────────────────────────────────────────────────────
const votingId = ref<string | null>(null)

// ─── Load categories then load first category FAQs ───────────────────────────
onMounted(async () => {
  const cats = await fetchCategories()
  categories.value = cats
  const first = cats[0]
  if (first) {
    selectedCategoryId.value = first.id
    await fetchFaqs({ kategoriId: first.id })
  }
})

watch(selectedCategoryId, async (catId) => {
  if (isSearching.value) return // don't switch category while searching
  openIndices.value = new Set()
  if (catId) await fetchFaqs({ kategoriId: catId })
})

const handleVote = async (faq: Faq, type: 'puas' | 'tidak-puas') => {
  if (votingId.value === faq.id) return
  votingId.value = faq.id
  try {
    if (type === 'puas') {
      await votePuas(faq.id)
      faq.puas += 1
    } else {
      await voteTidakPuas(faq.id)
      faq.tidakPuas += 1
    }
  } catch {
    // silent fail
  } finally {
    votingId.value = null
  }
}
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
