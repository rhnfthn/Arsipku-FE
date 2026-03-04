<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <PageHeader title="FAQ" :items="items" />
    </div>

    <!-- OUTER CARD -->
    <div class="rounded-3xl overflow-hidden shadow-sm border border-gray-200">

      <div
        class="px-8 md:px-12 py-12 text-center
               bg-gradient-to-b from-blue-300 to-white"
      >
        <div class="max-w-2xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-semibold text-gray-800">
            Dapatkan bantuan
            <span
              class="bg-gradient-to-r from-blue-600 to-indigo-600
                     bg-clip-text text-transparent"
            >
              apa pun
            </span>
            tentang Arsipku
          </h2>

          <p class="text-gray-500 mt-3">
            Ajukan pertanyaan. Temukan jawaban.
          </p>

          <div class="mt-6 relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              type="text"
              placeholder="Apa masalah Anda?"
              class="w-full pl-11 pr-4 py-3 rounded-2xl 
                     border border-gray-200 
                     bg-white
                     shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="bg-white px-8 md:px-12 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

          <!-- Sidebar -->
          <div
            class="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-xl space-y-3"
          >
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Kategori
            </h3>

            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'w-full text-left px-4 py-2 rounded-xl text-sm transition',
                selectedCategory === cat
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'hover:bg-gray-100 text-gray-600'
              ]"
            >
              {{ cat }}
            </button>
          </div>

          <!-- FAQ LIST -->
          <div class="lg:col-span-3 space-y-4">
            <div
              v-for="(faq, index) in filteredFaqs"
              :key="index"
              class="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
            >
              <!-- Question -->
              <button
                @click="toggle(index)"
                class="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span class="font-medium text-gray-700">
                  {{ faq.question }}
                </span>

                <ChevronDown
                  class="w-5 h-5 transition-all duration-300"
                  :class="
                    openIndex === index
                      ? 'rotate-180 text-blue-600'
                      : 'text-gray-400'
                  "
                />
              </button>

              <!-- Answer -->
              <transition name="fade">
                <div
                  v-if="openIndex === index"
                  class="px-6 pb-6 text-sm text-gray-600 border-t bg-gray-50"
                >
                  <p class="mt-4 leading-relaxed">
                    {{ faq.answer }}
                  </p>

                  <div class="flex gap-3 mt-5">
                    <button
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                             border text-sm hover:bg-gray-100 transition"
                    >
                      <ThumbsUp class="w-4 h-4" />
                      Puas
                    </button>

                    <button
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                             border text-sm hover:bg-gray-100 transition"
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
import { ref, computed } from 'vue'
import { Search, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
definePageMeta({ middleware: 'auth' })

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'FAQ', to: '/faq/menu' }
] satisfies BreadcrumbItem[]

const categories = [
  'Arsipku',
  'Kotak Masuk',
  'Tulis Surat',
  'Penomoran',
  'Dokumen & Template',
  'Tanda Tangan Digital (BSrE)',
  'Master Data',
  'Pengaturan & Akun'
]

const selectedCategory = ref('Arsipku')
const openIndex = ref<number | null>(null)

const faqs = [
  {
    category: 'Arsipku',
    question: 'Apa itu Arsipku?',
    answer:
      'ArsipKu adalah sistem manajemen arsip korespondensi digital yang membantu organisasi mengelola surat masuk, surat keluar, disposisi, dan dokumen resmi lainnya secara elektronik.'
  },
  {
    category: 'Arsipku',
    question: 'Bagaimana cara login ke sistem Arsipku?',
    answer:
      'Klik tombol login pada halaman utama, masukkan email dan password yang telah terdaftar.'
  },
  {
    category: 'Arsipku',
    question: 'Bagaimana cara mengubah tampilan dark mode/light mode?',
    answer:
      'Masuk ke menu Pengaturan & Akun lalu pilih preferensi tampilan yang diinginkan.'
  }
]

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index
}

const filteredFaqs = computed(() =>
  faqs.filter(f => f.category === selectedCategory.value)
)
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