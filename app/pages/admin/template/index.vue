<script setup>
import { ref, computed, watch } from "vue";
import {
  Inbox,
  Filter,
  FileCheck,
  ChevronRight,
  Search,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Download,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";

// --- STATE ---
const activeTab = ref("ALL");
const search = ref("");
const selected = ref(null);

// --- DATA DUMMY  ---
const emails = ref([
  { id: 1, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 2, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 3, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 4, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 5, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 6, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 7, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 8, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 9, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
  { id: 10, from: "PER - PERATURAN DIREKSI", maintain: "Download" },
]);

// --- FILTER ---
const filteredEmails = computed(() => {
  const s = search.value.toLowerCase();
  return emails.value.filter((mail) => mail.from.toLowerCase().includes(s));
});

// --- PAGINATION ---
const currentPage = ref(1);
const rowsPerPage = ref(5); // default 5
const rowsChoices = [5, 10, 15, 25, 50];

const totalItems = computed(() => filteredEmails.value.length);

const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value)
);

const paginatedEmails = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  const end = start + rowsPerPage.value;
  return filteredEmails.value.slice(start, end);
});

const pageNumbers = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i);
  }
  return pages;
});

watch(rowsPerPage, () => {
  currentPage.value = 1;
});
</script>

<template>
  <div
    class="w-full min-h-screen flex flex-col text-gray-800 dark:text-gray-100"
  >
    <div>
      <Heading variant="heading6b" class="text-mobile-md">Template</Heading>
      <Heading variant="heading10m">
        Panduan tata nama dan nomenklatur dalam Bahasa Inggris
      </Heading>
      <br />
    </div>

    <div
      class="flex flex-col w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5"
    >
      <!-- HEADER SEARCH + ROWS PER PAGE -->
      <div
        class="flex flex-col md:flex-row items-center sm:flex-row sm:w-auto justify-between gap-4 mb-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-600">Tampilkan</span>
          <select
            v-model="rowsPerPage"
            class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <div class="relative w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari surat..."
            class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 text-xs pl-9 pr-3 py-1.5 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      <!-- LIST -->
      <div class="flex-1">
        <div
          v-if="paginatedEmails.length === 0"
          class="p-10 flex flex-col items-center text-gray-400"
        >
          <Inbox class="w-10 h-10 mb-2 opacity-20" />
          <span class="text-sm">Tidak ada surat ditemukan</span>
        </div>

        <!-- LIST CARD -->
        <div
          v-for="mail in paginatedEmails"
          :key="mail.id"
          class="rounded-xl bg-gray-50 dark:bg-gray-800 p-5 mb-5 shadow-sm sm:text-xs text-sm hover:shadow-md transition cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <Heading variant="heading10sb" class="truncate">
              {{ mail.from }}
            </Heading>
            <button
              class="flex items-center gap-1 text-sky-600 hover:underline sm:text-xs text-sm font-semibold"
            >
              <Download class="w-4 h-4" />
              {{ mail.maintain }}
            </button>
          </div>
        </div>
      </div>

      <!-- FOOTER PAGINATION -->
      <div class="flex items-center justify-between mt-2">
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedEmails.length }} dari {{ totalItems }} data
        </div>

        <div class="flex items-center gap-1">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-xs rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &lt;
          </button>

          <button
            v-for="page in pageNumbers"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-3 py-1 text-xs rounded-md',
              currentPage === page
                ? 'bg-primary text-white'
                : 'hover:bg-gray-200',
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-xs rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 640px) {
  .text-mobile-xs {
    font-size: 10px !important;
  }
  .text-mobile-sm {
    font-size: 11px !important;
  }
  .text-mobile-base {
    font-size: 12px !important;
  }
  .text-mobile-md {
    font-size: 20px !important;
  }
}
</style>
