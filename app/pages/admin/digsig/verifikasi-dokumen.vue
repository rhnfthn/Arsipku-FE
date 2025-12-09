<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Verify Dokumen Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- KIRI: TOMBOL TAMBAH -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Penomoran
      </button>
    </div>
    <div class="bg-white shadow-lg rounded-xl w-full">
      <!-- TOP ACTION BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3 mb-4 pr-3"
      >
        <!-- Rows dropdown -->
        <div class="flex items-center gap-2 px-4 py-2">
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

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- LOADING (SHIMMER) -->
      <div v-if="loading" class="space-y-3 p-4">
        <div
          v-for="i in 5"
          :key="i"
          class="w-full h-10 bg-gray-200 animate-pulse rounded-md"
        ></div>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="filteredRows.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full bg-white text-sm">
          <thead class="bg-primary text-white text-[15px]">
            <tr>
              <th class="p-4 text-left">Tgl. dibuat</th>
              <th class="p-4 text-left">No Dokumen / Perihal</th>
              <th class="p-4 text-center">Jumlah Penandatanganan</th>
              <th class="p-4 text-center">Dokumen</th>
              <th class="p-4 text-center">Status</th>
              <th class="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(row, i) in filteredRows" :key="i">
              <td class="p-4">{{ row.date }}</td>

              <td class="p-4">
                <div class="font-medium">{{ row.no }}</div>
                <div class="text-gray-500 text-xs">{{ row.desc }}</div>
              </td>

              <td class="p-4 text-center">{{ row.count }}</td>

              <td class="p-4 text-center">
                <button
                  class="flex items-center gap-2 mx-auto bg-blue-50 text-primary px-3 py-1 text-xs font-medium rounded-lg"
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat
                </button>
              </td>

              <td class="p-4 text-center">
                <span
                  class="px-3 py-1 rounded-lg text-xs"
                  :class="
                    row.status === 'Completed'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  "
                >
                  {{ row.status }}
                </span>
              </td>

              <td class="p-4 text-center">
                <Eye
                  class="w-5 h-5 text-gray-600 cursor-pointer"
                  @click="
                    openDetail = true;
                    selectedRow = row;
                  "
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!---------->
      <!-- MODAL -->
      <!---------->
      <Modal v-model="openDetail" :hideDefaultFooter="true" class="w-full">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5"
          >
            Detail Dokumen
          </Heading>
        </template>

        <!-- BODY → tempelkan layout seperti screenshot kamu -->
        <div class="grid grid-cols-2 gap-6 text-sm mt-2" v-if="selectedRow">
          <div>
            <p class="text-gray-600">ID</p>
            <p class="font-medium">{{ selectedRow.id ?? "-" }}</p>
          </div>

          <div>
            <p class="text-gray-600">No</p>
            <p class="font-medium">{{ selectedRow.no }}</p>
          </div>

          <div>
            <p class="text-gray-600">Tanggal</p>
            <p class="font-medium">{{ selectedRow.date }}</p>
          </div>

          <div>
            <p class="text-gray-600">Jenis</p>
            <p class="font-medium">{{ selectedRow.type ?? "-" }}</p>
          </div>

          <div>
            <p class="text-gray-600">Klasifikasi</p>
            <p class="font-medium">{{ selectedRow.classification ?? "-" }}</p>
          </div>
        </div>

        <!-- TABLE DI DALAM MODAL -->
        <div class="mt-6 border-t pt-4">
          <table class="w-full text-sm">
            <thead class="bg-primary text-white uppercase">
              <tr>
                <th class="p-3 text-left">No</th>
                <th class="p-3 text-left">E-NIK</th>
                <th class="p-3 text-left">Nama</th>
                <th class="p-3 text-center">Status</th>
                <th class="p-3 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in selectedRow.signerList" :key="i">
                <td class="p-3">{{ i + 1 }}</td>
                <td class="p-3">{{ s.nik }}</td>
                <td class="p-3">{{ s.name }}</td>
                <td class="p-3 text-center">
                  <span
                    class="px-3 py-1 rounded-lg text-xs"
                    :class="
                      s.status === 'Completed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    "
                  >
                    {{ s.status }}
                  </span>
                </td>
                <td class="p-3 text-center">{{ s.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Eye,
} from "lucide-vue-next";
const openDetail = ref(false);

const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "verifikasi-dokumen", to: "/admin/digsig/verifikasi-dokumen" },
];

// STATE
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];
const search = ref("");
const loading = ref(false);

// dummy row (biar tidak error)
const rows = ref([
  {
    id: 1,
    date: "16/03/2024 10:11:37",
    no: "002 / Coba Ttd UAT",
    desc: "Pengujian Tanda Tangan Digital UAT",
    count: 1,
    status: "Rejected",
    type: "PGM - Sertifikat atau Piagam",
    classification: "OPS - OPERASI",
    signerList: [
      {
        nik: "3374031234567890",
        name: "BUDI SANTOSO",
        status: "Rejected",
        note: "-",
      },
    ],
  },
  {
    id: 1,
    date: "16/03/2024 10:11:37",
    no: "002 / Coba Ttd UAT",
    desc: "Pengujian Tanda Tangan Digital UAT",
    count: 1,
    status: "Success",
    type: "PGM - Sertifikat atau Piagam",
    classification: "OPS - OPERASI",
    signerList: [
      {
        nik: "3374031234567890",
        name: "BUDI SANTOSO",
        status: "Success",
        note: "-",
      },
    ],
  },
]);

const filteredRows = computed(() => {
  return rows.value.filter((row) =>
    row.no.toLowerCase().includes(search.value.toLowerCase()),
  );
});
</script>
