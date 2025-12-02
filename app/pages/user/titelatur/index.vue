<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import {
  Filter,
  FileCheck,
  ChevronRight,
  Search,
  ArrowUpDown,
  RotateCcw,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
// import EditModal from "~/components/Modal.vue";

// --- CLICK OUTSIDE HANDLER ---
const closeAll = () => {
  openDropdown.value = null;
};

const handleClickOutside = (e) => {
  const dropdown = document.querySelector(".custom-dropdown-content");
  const trigger = document.querySelector(".custom-dropdown-trigger");

  if (
    dropdown &&
    !dropdown.contains(e.target) &&
    trigger &&
    !trigger.contains(e.target)
  ) {
    closeAll();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// --- STATE ---
const activeTab = ref("ALL");
const search = ref("");
const selected = ref(null);

// DROPDOWN STATE
const openDropdown = ref(null);
const filterMode = ref("Semua ");
const filterOptions = [" Jabatan", " Lokasi"];
// DROPDOWN HANDLER
const toggleDropdown = (name) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};

const setFilter = (opt) => {
  filterMode.value = opt;
  openDropdown.value = null;
};

// DATA
const items = ref([
  {
    id: 1,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 2,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 3,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 4,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 5,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 6,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 7,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 8,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 9,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 10,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 11,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 12,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 13,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 14,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 15,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
]);

// FILTER
const filteredItems = computed(() => {
  const s = search.value.toLowerCase();
  return items.value.filter((it) => {
    const searchPass =
      it.from.toLowerCase().includes(s) || it.subject.toLowerCase().includes(s);
    return searchPass;
  });
});

// SORT
const sortDirection = ref(null); // null | 'asc' | 'desc'

const toggleSort = () => {
  if (sortDirection.value === "asc") sortDirection.value = "desc";
  else sortDirection.value = "asc";
};

const sortedItems = computed(() => {
  let arr = [...filteredItems.value];

  if (sortDirection.value === "asc") {
    arr.sort((a, b) => a.from.localeCompare(b.from));
  } else if (sortDirection.value === "desc") {
    arr.sort((a, b) => b.from.localeCompare(a.from));
  }

  return arr;
});

// --- REFRESH ---
const refreshData = () => {
  search.value = "";
  filterMode.value = "Semua ";
  sortDirection.value = null;
  currentPage.value = 1;

  // kalau nanti ada data dinamis bisa fetch ulang disini
  // loadItems()

  toast.add({
    title: "Data telah diperbarui!",
    color: "info",
    icon: "i-lucide-rotate-ccw",
    position: "top-right",
  });
};

// --- PAGINATION ---
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15, 25, 50, 100];

const totalItems = computed(() => filteredItems.value.length);

const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value)
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  const end = start + rowsPerPage.value;
  return sortedItems.value.slice(start, end);
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
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

//      MODAL EDIT
const showModal = ref(false);
const toast = useToast();
const selectedItem = ref(null);
const openEdit = (item) => {
  selectedItem.value = item;
  editForm.value = {
    titelatur: item.from,
    eng: item.subject,
  };

  showModal.value = true;
};

const editForm = ref({
  titelatur: "",
  eng: "",
});

// ketika tombol "Simpan" di modal ditekan

const handleSave = () => {
  if (selectedItem.value) {
    selectedItem.value.from = editForm.value.titelatur;
    selectedItem.value.subject = editForm.value.eng;
  }

  toast.add({
    title: "Titelatur berhasil diperbarui!",
    color: "success",
    icon: "i-lucide-circle-check",
  });

  showModal.value = false;
};

const handleCancel = () => {
  showModal.value = false;
};
</script>

<template>
  <div class="w-full min-w-0 min-h-screen text-gray-800 dark:text-gray-100">
    <!-- Title -->
    <div class="mb-5">
      <Heading variant="heading6b" class="text-mobile-md">
        Titelatur Inggris
      </Heading>
      <Heading variant="heading10m" class="text-mobile-base sm:text-sm">
        Panduan tata nama dan nomenklatur dalam Bahasa Inggris
      </Heading>
    </div>

    <!-- Card Wrapper -->
    <div
      class="flex flex-col w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
    >
      <!-- Toolbar -->

      <div
        class="px-2 py-2 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start md:items-center justify-between gap-3"
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
        <!-- Filter dropdown -->
        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div class="relative">
            <button
              @click.stop="toggleDropdown('filter')"
              class="custom-dropdown-trigger flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              :class="{
                'ring-2 ring-sky-100 border-sky-300': openDropdown === 'filter',
              }"
            >
              <Filter class="w-3.5 h-3.5" />
              <span class="text-xs font-medium truncate max-w-[100px]">{{
                filterMode
              }}</span>
              <ChevronRight class="w-3 h-3 rotate-90 opacity-50" />
            </button>

            <div
              v-if="openDropdown === 'filter'"
              class="custom-dropdown-content absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50"
            >
              <button
                v-for="opt in filterOptions"
                :key="opt"
                @click="setFilter(opt)"
                class="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 dark:hover:bg-gray-700"
                :class="
                  filterMode === opt
                    ? 'text-sky-600 font-bold'
                    : 'text-gray-700 dark:text-gray-300'
                "
              >
                {{ opt }}
                <FileCheck
                  v-if="filterMode === opt"
                  class="w-3 h-3 float-right"
                />
              </button>
            </div>
          </div>

          <div
            class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"
          ></div>

          <button
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
            @click="toggleSort"
          >
            <ArrowUpDown
              class="w-4 h-4"
              :class="{
                'rotate-180 transition': sortDirection === 'asc',
                transition: sortDirection === 'desc' || sortDirection === null,
              }"
            />
          </button>

          <button
            @click="refreshData"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
        </div>

        <!-- Search -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari..."
            class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs pl-9 pr-3 py-1.5 rounded-lg focus:ring-sky-500"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex flex-col">
        <div class="flex-1 overflow-y-auto">
          <table class="min-w-full text-left text-sm">
            <thead
              class="bg-primary-700 text-primary-50 dark:bg-gray-400 sticky top-0 z-10"
            >
              <tr>
                <th class="px-4 py-4 font-bold">Unit</th>
                <th class="px-4 py-4 font-bold">Titelatur</th>
                <th class="px-4 py-4 font-bold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="it in paginatedItems"
                :key="it.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-primary-50 dark:hover:bg-gray-800"
              >
                <td class="px-4 py-4">{{ it.from }}</td>

                <td class="px-4 py-2">{{ it.subject }}</td>
                <!-- <td class="px-4 py-2">
                  <button class="text-primary underline" @click="openEdit(it)">
                    Maintain
                  </button>
                </td> -->
                <td class="px-4 py-2">
                <button class="bg-primary px-3 py-1 text-xs font-semibold text-white rounded-lg" @click="openEdit(it)">
                    Maintain
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <Modal v-model="showModal" @save="handleSave">
            <template #title>
              <div class="mt-5 ml-5 mb-3">
                <Heading variant="heading9b" class="font-semibold text-sm">
                  Edit Titelatur
                </Heading>

                <Heading variant="body2" class="text-xs text-gray-500 mt-1">
                  Isi form di bawah ini untuk mengedit titelatur
                </Heading>
              </div>
            </template>

            <div class="flex flex-col gap-3">
              <Heading variant="body2m"
                >Titelatur Indonesia
                <span class="text-red-500">*</span></Heading
              >
              <input
                v-model="editForm.titelatur"
                placeholder="Masukkan Titelatur"
                class="border px-3 py-2 mb-2 rounded-md text-sm bg-gray-50 dark:bg-gray-800"
              />
              <Heading variant="body2m"
                >Titelatur Inggris <span class="text-red-500">*</span></Heading
              >
              <input
                v-model="editForm.eng"
                placeholder="Masukkan Titelatur (English)"
                class="border px-3 py-2 rounded-md text-sm bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </Modal>
        </div>
      </div>

      <!-- FOOTER PAGINATION -->
      <div class="flex items-center justify-between mt-5 ml-4 mr-3 mb-3">
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedItems.length }} dari {{ totalItems }} data
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.custom-dropdown-content {
  animation: fadeIn 0.15s ease-out forwards;
}
</style>
