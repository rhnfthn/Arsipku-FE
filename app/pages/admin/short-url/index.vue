<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import { useClipboard } from "@vueuse/core";
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
  Plus,
  Copy,
  Trash2,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";

const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();
const { copy } = useClipboard();

const generateRandomString = (length = 5) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

type Payment = {
  tanggal: string;
  LUrl: string;
  SUrl: string;
  keterangan: string;
};

const data = ref<Payment[]>([
  {
    tanggal: "2024-03-11T15:30:00",
    LUrl: "https://urlasli",
    SUrl: "url.modifikasi",
    keterangan: "Lorem Ipsum is simply dummy text",
  },

  {
    tanggal: "2024-03-11T10:10:00",
    LUrl: "https://urlasli2",
    SUrl: "url.modifikasi.com",
    keterangan:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  },
]);

const columns: TableColumn<Payment>[] = [
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => {
      const raw = row.getValue("tanggal");
      const date = new Date(raw);

      const datePart = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const timePart = `${hours}.${minutes}`;

      const finalOutput = `${datePart}, ${timePart}`;

      return h(
        "div",
        {
          class:
            "whitespace-normal break-words max-w-[200px] text-black dark:text-white",
        },
        finalOutput,
      );
    },
  },

  {
    accessorKey: "LUrl",
    header: "Url Asli",
    cell: ({ row }) =>
      h(
        "div",
        {
          class:
            "whitespace-normal break-words max-w-[400px] text-black dark:text-white",
        },
        row.getValue("LUrl"),
      ),
  },

  {
    accessorKey: "SUrl",
    header: "Url Modifikasi",
    cell: ({ row }) =>
      h(
        "div",
        {
          class:
            "whitespace-normal break-words max-w-[400px] text-black dark:text-white",
        },
        row.getValue("SUrl"),
      ),
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) =>
      h(
        "div",
        {
          class:
            "whitespace-normal break-words max-w-[400px] text-black dark:text-white",
        },
        row.getValue("keterangan"),
      ),
  },

  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        // COPY BUTTON
        h(
          "button",
          {
            class: "p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800",
            onClick: () => {
              copy(row.original.SUrl);
              toast.add({
                title: "URL berhasil disalin!",
                color: "success",
                icon: "i-lucide-copy",
              });
            },
          },
          () =>
            h(resolveComponent("UIcon"), {
              name: "i-lucide-copy",
              class: "w-4 h-4 text-gray-600 dark:text-gray-300",
            }),
        ),

        // DELETE BUTTON
        h(
          "button",
          {
            class: "p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900",
            onClick: () => {
              const index = data.value.indexOf(row.original);
              data.value.splice(index, 1);
              toast.add({
                title: "URL berhasil dihapus!",
                color: "error",
                icon: "i-lucide-trash-2",
              });
            },
          },
          () =>
            h(resolveComponent("UIcon"), {
              name: "i-lucide-trash-2",
              class: "w-4 h-4 text-red-600 dark:text-red-400",
            }),
        ),
      ]),
  },
];

const showAddModal = ref(false);

const addForm = ref({
  LUrl: "",
  SUrl: "",
  keterangan: "",
});

const saveAdd = () => {
  if (!addForm.value.LUrl) {
    toast.add({
      title: "URL belum lengkap!",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  const shortCode = addForm.value.SUrl
    ? addForm.value.SUrl
    : generateRandomString();

  data.value.unshift({
    tanggal: new Date().toISOString(),
    LUrl: addForm.value.LUrl,
    SUrl: `airnav/${shortCode}`,
    keterangan: addForm.value.keterangan,
  });

  toast.add({
    title: "URL berhasil ditambahkan!",
    color: "success",
    icon: "i-lucide-circle-check",
  });

  showAddModal.value = false;
  addForm.value = { LUrl: "", SUrl: "", keterangan: "" };
};

const openAdd = () => {
  addForm.value = { ind: "", eng: "" };
  showAddModal.value = true;
};

const activeCopyIndex = ref<number | null>(null);

const toggleCopyDropdown = (index: number) => {
  activeCopyIndex.value = activeCopyIndex.value === index ? null : index;
};

const copyUrl = (value: string, type: string) => {
  copy(value);
  toast.add({
    title: `Berhasil menyalin ${type}!`,
    color: "success",
    icon: "i-lucide-copy",
  });
  activeCopyIndex.value = null;
};
</script>

<template>
  <div class="flex flex-wrap justify-between">
    <div class="flex flex-col flex-wrap justify-between mb-3">
      <Heading variant="heading5m">Short Url</Heading>
      <Heading variant="body1">Kelola short URL untuk dokumen</Heading>
    </div>
    <div>
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah Url
      </button>
    </div>
  </div>
  <Modal v-model="showAddModal" @save="saveAdd">
    <template #title>
      <div class="ml-5 mb-3">
        <Heading variant="heading9b" class="font-semibold text-sm">
          Buat Short URL Baru
        </Heading>

        <Heading variant="body2" class="text-xs text-gray-500 mt-1">
          Masukan URL Panjang untuk Dipersingkat
        </Heading>
      </div>
    </template>

    <div class="flex flex-col gap-3">
      <Heading variant="body2m"
        >URL Panjang<span class="text-red-500">*</span></Heading
      >
      <UInput
        color="primary"
        placeholder="Http://example"
        size="lg"
        v-model="addForm.LUrl"
      />

      <Heading variant="body2m">Back Half</Heading>
      <UInput
        color="primary"
        placeholder="example favorit-link"
        size="lg"
        v-model="addForm.SUrl"
      />

      <Heading variant="body2m">Keterangan</Heading>
      <UInput
        color="primary"
        placeholder="Tambahkan Keterangan"
        size="lg"
        v-model="addForm.keterangan"
      />
    </div>
  </Modal>

  <!-- CARD FULL HEIGHT -->
  <div
    class="flex flex-col mt-3 w-full flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
  >
    <!-- HEADER -->
    <div
      class="px-2 py-2 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:flex-wrap md:flex-row items-start md:items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <!-- FILTER -->
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

          <!-- DROPDOWN -->
          <div
            v-if="openDropdown === 'filter'"
            class="custom-dropdown-content absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50"
          >
            <button
              v-for="opt in filterOptions"
              :key="opt"
              @click="setFilter(opt)"
              class="w-full text-left px-4 py-2 text-xs hover:bg-sky-50 dark:hover:bg-gray-700 flex justify-between items-center"
              :class="
                filterMode === opt
                  ? 'text-sky-600 font-bold'
                  : 'text-gray-700 dark:text-gray-300'
              "
            >
              {{ opt }}
              <FileCheck v-if="filterMode === opt" class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- SORT + REFRESH -->
        <div
          class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"
        ></div>

        <button
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
        >
          <ArrowUpDown class="w-4 h-4" />
        </button>
        <button
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>

      <!-- SEARCH -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 w-full md:w-56 group">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari surat..."
            class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs pl-9 pr-3 py-1.5 rounded-lg focus:ring-sky-500 focus:border-sky-500 outline-none"
          />
        </div>

        <div class="flex items-center gap-1 text-gray-500">
          <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <ChevronRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="w-full overflow-auto p-2">
      <div class="w-full overflow-auto p-2">
        <table class="min-w-full text-sm border-collapse">
          <thead>
            <tr class="dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <th class="px-3 py-2 border-b text-left">Tanggal</th>
              <th class="px-3 py-2 border-b text-left">URL Asli</th>
              <th class="px-3 py-2 border-b text-left">URL Modifikasi</th>
              <th class="px-3 py-2 border-b text-left">Keterangan</th>
              <th class="px-3 py-2 border-b text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, index) in data"
              :key="index"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <!-- Tanggal -->
              <td class="px-3 py-2 whitespace-nowrap">
                {{
                  new Date(row.tanggal).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                }},
                {{
                  String(new Date(row.tanggal).getHours()).padStart(2, "0")
                }}.{{
                  String(new Date(row.tanggal).getMinutes()).padStart(2, "0")
                }}
              </td>

              <!-- URL Asli -->
              <td class="px-3 py-2 max-w-[250px] break-words">
                {{ row.LUrl }}
              </td>

              <!-- URL Modifikasi -->
              <td class="px-3 py-2 max-w-[200px] break-words">
                {{ row.SUrl }}
              </td>

              <!-- Keterangan -->
              <td class="px-3 py-2 max-w-[300px] break-words">
                {{ row.keterangan }}
              </td>

              <!-- ACTION -->
              <td class="px-3 py-2 text-center">
                <div class="flex items-center justify-center gap-2">
                  <!-- COPY -->
                  <div class="relative">
                    <button
                      class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="toggleCopyDropdown(index)"
                    >
                      <Copy class="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>

                    <!-- DROPDOWN -->
                    <div
                      v-if="activeCopyIndex === index"
                      class="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md overflow-hidden z-50"
                    >
                      <button
                        class="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                        @click="copyUrl(row.LUrl, 'URL Asli')"
                      >
                        Copy URL Asli
                      </button>
                      <button
                        class="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                        @click="copyUrl(row.SUrl, 'URL Modifikasi')"
                      >
                        Copy URL Modifikasi
                      </button>
                    </div>
                  </div>

                  <!-- DELETE -->
                  <button
                    class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                    @click="
                      data.splice(index, 1);
                      toast.add({
                        title: 'URL berhasil dihapus!',
                        color: 'error',
                        icon: 'i-lucide-trash-2',
                      });
                    "
                  >
                    <Trash2 class="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
