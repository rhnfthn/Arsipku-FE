<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import { useClipboard } from "@vueuse/core";
import { ref, computed, watch } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  ChevronRight as ChevronRightIcon,
  Plus,
  Copy,
  Trash2,
  Pencil,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import ConfirmPopup from "@/components/ConfirmPopup.vue";
definePageMeta({
  middleware: "auth",
});

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
    keterangan: "Lorem Ipsum is simply dummy text of the ",
  },
]);

const loading = ref(false);
const isRefreshing = ref(false);

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

  if (isEditMode.value && editIndex.value !== null) {
    // EDIT MODE
    data.value[editIndex.value] = {
      ...data.value[editIndex.value],
      LUrl: addForm.value.LUrl,
      SUrl: `airnav/${shortCode}`,
      keterangan: addForm.value.keterangan,
    };

    toast.add({
      title: "URL berhasil diperbarui!",
      color: "success",
      icon: "i-lucide-pencil",
    });
  } else {
    // ADD MODE
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
  }

  // RESET
  showAddModal.value = false;
  isEditMode.value = false;
  editIndex.value = null;
  addForm.value = { LUrl: "", SUrl: "", keterangan: "" };
};

const openAdd = () => {
  isEditMode.value = false;
  editIndex.value = null;
  addForm.value = { LUrl: "", SUrl: "", keterangan: "" };
  showAddModal.value = true;
};

const items = [
  {
    label: "Dashboard",
    to: "/beranda",
  },
  {
    label: "Penyinkat Tautan",
    to: "/admin/penyinkat-tautan",
  },
] satisfies BreadcrumbItem[];

const sortOrder = ref<"asc" | "desc">("desc");

const toggleSort = () => {
  sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
};

const sortedData = computed(() => {
  return [...data.value].sort((a, b) => {
    const timeA = new Date(a.tanggal).getTime();
    const timeB = new Date(b.tanggal).getTime();

    return sortOrder.value === "desc"
      ? timeB - timeA // terbaru → lama
      : timeA - timeB; // lama → terbaru
  });
});

const truncateUrl = (url: string, max = 20) => {
  if (!url) return "";
  return url.length > max ? url.slice(0, max) + "....." : url;
};

const isEditMode = ref(false);
const editIndex = ref<number | null>(null);

const openEdit = (row: Payment, index: number) => {
  isEditMode.value = true;
  editIndex.value = index;

  addForm.value = {
    LUrl: row.LUrl,
    SUrl: row.SUrl.replace("airnav/", ""),
    keterangan: row.keterangan,
  };

  showAddModal.value = true;
};

const showDeleteConfirm = ref(false);
const deleteIndex = ref<number | null>(null);

const openDeleteConfirm = (index: number) => {
  deleteIndex.value = index;
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  if (deleteIndex.value !== null) {
    data.value.splice(deleteIndex.value, 1);

    toast.add({
      title: "URL berhasil dihapus!",
      color: "error",
      icon: "i-lucide-trash-2",
    });
  }

  showDeleteConfirm.value = false;
  deleteIndex.value = null;
};

const refreshData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.add({
      title: "Data berhasil diperbarui!",
      color: "success",
      icon: "i-lucide-refresh-ccw",
    });
  } catch (error) {
    console.error("Gagal refresh data", error);
  } finally {
    isRefreshing.value = false;
  }
};

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Penyingkat Tautan", to: "/admin/penyingkat-tautan" },
];
</script>

<template>
  <div class="pt-5 bg-gray-50 dark:bg-gray-900">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-2">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          Penyingkat Tautan
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Tautan
      </button>
    </div>

    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveAdd" size="xl">
        <template #title>
          <div class="ml-5 mb-3 mt-3">
            <Heading
              variant="heading9b"
              class="font-semibold text-sm dark:text-white"
            >
              {{ isEditMode ? "Edit Tautan" : "Buat Tautan Baru" }}
            </Heading>

            <Heading
              variant="body2"
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {{
                isEditMode
                  ? "Perbarui informasi tautan"
                  : "Masukan Tautan Panjang untuk Dipersingkat"
              }}
            </Heading>
          </div>
        </template>

        <div class="flex flex-col gap-1">
          <Heading variant="body2m" class="dark:text-gray-200"
            >Tautan Panjang<span class="text-red-500">*</span></Heading
          >
          <UInput
            color="primary"
            placeholder="Http://example"
            size="lg"
            v-model="addForm.LUrl"
            class="mb-3"
          />

          <Heading variant="body2m" class="dark:text-gray-200"
            >Back Half</Heading
          >
          <UInput
            color="primary"
            placeholder="example favorit-link"
            size="lg"
            v-model="addForm.SUrl"
            class="mb-3"
          />

          <Heading variant="body2m" class="dark:text-gray-200"
            >Keterangan</Heading
          >
          <UInput
            color="primary"
            placeholder="Tambahkan Keterangan"
            size="lg"
            v-model="addForm.keterangan"
            class="mb-3"
          />
        </div>
      </Modal>
    </Teleport>

    <!-- CARD FULL HEIGHT -->
    <div
      class="flex flex-col mt-2 w-full flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div class="flex flex-wrap gap-2 p-3 items-center dark:border-gray-700">
        <button
          @click="toggleSort"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition"
          title="Urutkan"
        >
          <ArrowUpDown class="w-4 h-4" />
        </button>

        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition"
          :disabled="isRefreshing"
          title="Refresh"
        >
          <RotateCcw
            class="w-4 h-4"
            :class="{ 'animate-spin': isRefreshing }"
          />
        </button>

        <div class="relative flex-1 w-full justify-between">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            placeholder="Cari Tautan"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <div class="w-full overflow-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead
            class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10"
          >
            <tr class="p-3">
              <th class="px-4 py-3 text-left font-semibold">Tanggal</th>
              <th class="px-4 py-3 text-left font-semibold">Tautan Asli</th>
              <th class="px-4 py-3 text-left font-semibold">
                Tautan Modifikasi
              </th>
              <th class="px-4 py-3 text-left font-semibold">Keterangan</th>
              <th class="px-4 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <!-- SKELETON LOADING -->
            <template v-if="loading">
              <tr
                v-for="i in 5"
                :key="'skeleton-' + i"
                class="animate-pulse border-b border-gray-200 dark:border-gray-700"
              >
                <td class="px-3 py-2">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"
                  ></div>
                </td>
                <td class="px-3 py-2">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"
                  ></div>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div
                      class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"
                    ></div>
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"
                    ></div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"
                  ></div>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-center gap-2">
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"
                    ></div>
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"
                    ></div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="(row, index) in sortedData"
                :key="index"
                class="hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition"
              >
                <!-- Tanggal -->
                <td
                  class="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white"
                >
                  {{
                    new Date(row.tanggal).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  }}
                </td>

                <!-- URL Asli -->
                <td class="px-3 py-2 max-w-[250px]">
                  <a
                    :href="row.LUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-600 dark:text-primary-400 underline hover:text-primary-800 dark:hover:text-primary-300 break-all transition"
                    :title="row.LUrl"
                  >
                    {{ truncateUrl(row.LUrl, 35) }}
                  </a>
                </td>

                <!-- URL Modifikasi -->
                <td class="px-3 py-2 max-w-[260px]">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-mono text-xs text-gray-900 dark:text-white break-all"
                      :title="row.SUrl"
                    >
                      {{ truncateUrl(row.SUrl, 25) }}
                    </span>

                    <button
                      class="p-1.5 rounded hover:bg-primary-300 dark:hover:bg-gray-700 transition"
                      @click="
                        copy(row.SUrl);
                        toast.add({
                          title: 'URL berhasil disalin!',
                          color: 'success',
                          icon: 'i-lucide-copy',
                        });
                      "
                    >
                      <Copy
                        class="w-4 h-4 text-gray-600 hover:text-white dark:text-gray-300"
                      />
                    </button>
                  </div>
                </td>

                <!-- Keterangan -->
                <td
                  class="px-3 py-2 max-w-[300px] text-gray-700 dark:text-gray-300"
                >
                  {{ row.keterangan }}
                </td>

                <!-- ACTION -->
                <td class="px-3 py-2 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <!-- EDIT -->
                    <button
                      class="p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
                      @click="openEdit(row, index)"
                      title="Edit"
                    >
                      <Pencil
                        class="w-4 h-4 text-yellow-600 dark:text-yellow-400"
                      />
                    </button>

                    <!-- DELETE -->
                    <button
                      class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      @click="openDeleteConfirm(index)"
                      title="Hapus"
                    >
                      <Trash2 class="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>

              <!-- EMPTY STATE -->
              <tr v-if="sortedData.length === 0">
                <td
                  colspan="5"
                  class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  Tidak ada data tautan
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <ConfirmPopup
          v-model="showDeleteConfirm"
          type="danger"
          title="Hapus Short URL?"
          :message="`Hapus URL ${data[deleteIndex]?.SUrl}?`"
          confirm-text="Hapus"
          cancel-text="Batal"
          @confirm="confirmDelete"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
