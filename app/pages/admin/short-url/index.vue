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
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";

const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Short Url", to: "/admin/short-url" },
];
const toast = useToast();
const { copy } = useClipboard();

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
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
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
    header: "Aksi",
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            }),
        ),
      );
    },
  },
];

function getRowItems(row: Row<Payment>) {
  return [
    {
      label: "Salin Url Modifikasi",
      onSelect() {
        copy(row.original.SUrl);

        toast.add({
          title: "Url Berhasil Di Salin!",
          color: "success",
          icon: "i-lucide-circle-check",
        });
      },
    },
    {
      label: "Salin Url Asli",
      onSelect() {
        copy(row.original.LUrl);

        toast.add({
          title: "Url Berhasil Di Salin!",
          color: "success",
          icon: "i-lucide-circle-check",
        });
      },
    },
    {
      label: "Hapus",
      onSelect() {
        copy(row.original.SUrl);

        toast.add({
          title: "Url Berhasil Di Salin!",
          color: "success",
          icon: "i-lucide-circle-check",
        });
      },
    },
  ];
}

const showAddModal = ref(false);

const addForm = ref({
  LUrl: "",
  SUrl: "",
  keterangan: "",
});

const saveAdd = () => {
  if (!addForm.value.LUrl || !addForm.value.SUrl) {
    toast.add({
      title: "URL belum lengkap!",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  data.value.unshift({
    tanggal: new Date().toISOString(),
    LUrl: addForm.value.LUrl,
    SUrl: addForm.value.SUrl,
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
</script>

<template>
  <div class="flex flex-wrap justify-between items-center mb-5">
    <div>
      <Heading variant="heading6b" class="text-mobile-md"> Short Url </Heading>
      <PageHeader :items="breadcrumbs" />
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
      <div class="mt-5 ml-5 mb-3">
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
      <UTable :data="data" :columns="columns" />
    </div>
  </div>
</template>
