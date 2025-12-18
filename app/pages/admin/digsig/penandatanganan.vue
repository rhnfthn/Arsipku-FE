<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Penandatanganan Dokumen
        </Heading>

        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <div
      class="bg-white rounded-xl shadow-sm items-center justify-between gap-4"
    >
      <!-- TOP BAR -->
      <div
        class="flex flex-col p-4 md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3"
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

        <!-- Filter button + dropdown (wrapped relative) -->
        <div class="relative inline-block">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 text-xs px-3 py-1 rounded-lg min-w-[100px]"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span class="text-sm">
              {{ filterStatus || "Semua" }}
            </span>

            <svg
              :class="[
                'w-4 h-4 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : 'rotate-0',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Dropdown (positioned relative to button) -->
          <div
            v-if="openFilterStatus"
            data-custom-dropdown
            class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in"
          >
            <button
              v-for="item in filterOptions"
              :key="item"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              @click.prevent="selectFilterStatus(item)"
            >
              {{ item }}
            </button>
          </div>
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

      <!-- TABLE -->
      <div class="overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-primary">
            <tr class="text-gray-600 text-white text-sm">
              <th class="p-4 font-semibold">Tanggal Dibuat</th>
              <th class="p-4 font-semibold">No Dokumen</th>
              <th class="p-4 font-semibold">Penandatangan</th>
              <th class="p-4 font-semibold">Dokumen</th>
              <th class="p-4 font-semibold">Status</th>
              <th class="p-4 font-semibold text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, i) in paginatedRows"
              :key="i"
              class="border-b border-gray-200 text-sm"
            >
              <td class="p-4">{{ row.tanggal }}</td>
              <td class="p-4">{{ row.no }}</td>
              <td class="p-4">{{ row.penandatangan }}</td>

              <!-- DOKUMEN -->
              <td class="p-4">
                <button
                  class="flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs"
                >
                  <File class="w-4 h-4" /> Lihat
                </button>
              </td>

              <!-- STATUS -->
              <td class="p-4">
                <span
                  v-if="row.status === 'belum'"
                  class="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600"
                >
                  Belum TTD
                </span>

                <span
                  v-else
                  class="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600"
                >
                  Sudah TTD
                </span>
              </td>

              <!-- ACTION -->
              <td
                class="p-4 text-center flex items-center justify-center gap-4 mt-1"
              >
                <Eye
                  class="w-5 h-5 text-gray-600 cursor-pointer hover:text-primary"
                  @click="openDetail = true"
                />
                <Signature
                  class="w-4 h-4 text-gray-600 cursor-pointer hover:text-primary"
                  @click="openSign = true"
                />

                <button @click="openDelete(item)" class="text-red-500">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <!------------------------->
        <!-- MODAL LIHAT DETAIL -->
        <!------------------------->
        <Modal v-model="openDetail" :hideDefaultFooter="true">
          <template #title>
            <h2 class="text-xl font-semibold ml-5 mt-5 mb-4">
              {{ detailDokumen.title }}
            </h2>
          </template>

          <!-- BODY -->
          <div class="text-[15px] space-y-3">
            <div class="flex">
              <span class="w-40 text-gray-600">ID Dokumen</span>
              <span>: {{ detailDokumen.idDokumen }}</span>
            </div>

            <div class="flex">
              <span class="w-40 text-gray-600">No. Dokumen</span>
              <span>: {{ detailDokumen.noDokumen }}</span>
            </div>

            <div class="flex">
              <span class="w-40 text-gray-600">Tgl Dokumen</span>
              <span>: {{ detailDokumen.tglDokumen }}</span>
            </div>

            <div class="flex">
              <span class="w-40 text-gray-600">Jenis Naskah</span>
              <span>: {{ detailDokumen.jenisNaskah }}</span>
            </div>

            <div class="flex mb-4">
              <span class="w-40 text-gray-600">Klasifikasi</span>
              <span>: {{ detailDokumen.klasifikasi }}</span>
            </div>

            <!-- TABEL PENANDATANGAN -->
            <div class="border border-gray-200 mb-5 rounded-xl overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-primary text-white text-left">
                    <th class="p-3 w-12">N0</th>
                    <th class="p-3">E-NIK</th>
                    <th class="p-3">Nama</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Keterangan</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(row, index) in detailDokumen.penandatangan"
                    :key="index"
                    class="shadow-sm"
                  >
                    <td class="p-3">{{ row.no }}</td>
                    <td class="p-3">{{ row.nik }}</td>
                    <td class="p-3">{{ row.nama }}</td>
                    <td class="p-3">
                      <span
                        :class="
                          row.status === 'Sudah TTD'
                            ? 'text-green-600 font-medium'
                            : 'text-red-600 font-medium'
                        "
                      >
                        {{ row.status }}
                      </span>
                    </td>
                    <td class="p-3">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
        <!------------------------->
        <!-- MODAL SIGNATURE -->
        <!------------------------->
        <Modal v-model="openSign" :hideDefaultFooter="true" width="500px">
          <!-- TITLE -->
          <template #title>
            <h2 class="text-lg font-semibold ml-5 mt-5 mb-3">
              Input passphrase untuk proses signing
            </h2>
          </template>

          <!-- BODY -->
          <div class="px-5 pb-6 space-y-5 text-sm">
            <!-- KARTU PENANDATANGAN -->
            <div
              class="border rounded-xl p-4 flex gap-4 items-start bg-white shadow-sm"
            >
              <div
                class="w-12 h-9 rounded-full bg-blue-300 flex items-center justify-center"
              >
                <User class="w-6 h-6 text-white" />
              </div>

              <div>
                <p class="text-gray-500 text-xs mb-1">
                  Ditandatangani secara digital oleh
                </p>
                <p class="font-medium leading-5">{{ signer.jabatan }}</p>
                <p class="font-semibold">{{ signer.nama }}</p>
              </div>
            </div>

            <!-- FILE TO SIGN -->
            <div>
              <label class="block text-gray-700 mb-1">File to sign</label>
              <input
                type="file"
                class="w-full border rounded-lg px-3 py-2 focus:outline-primary"
              />
            </div>

            <!-- PASSPHRASE -->
            <div>
              <label class="block text-gray-700 mb-1">Passphrase</label>
              <input
                type="password"
                class="w-full border rounded-lg px-3 py-2 focus:outline-primary"
                placeholder="••••••••"
              />
            </div>

            <!-- TOMBOL PROSES -->
            <button
              class="w-full bg-gray-300 text-gray-600 cursor-not-allowed rounded-lg py-2 font-semibold"
              disabled
            >
              Proses
            </button>
          </div>
        </Modal>
      </div>
    </div>
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Data"
      message="Yakin ingin menghapus data ini?"
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  File,
  Eye,
  Trash2,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Signature,
  User,
} from "lucide-vue-next";
import { ref } from "vue";
import Modal from "~/components/Modal.vue";

// MODAL LIHAT
const openDetail = ref(false);
const detailDokumen = ref({
  title: "TEST",
  idDokumen: "10013173202512081148407",
  noDokumen: "-123",
  tglDokumen: "08.12.2025",
  jenisNaskah: "PGM - Sertifikat atau Piagam",
  klasifikasi: "OPS.01.01 - Pemantauan Slot Time",
  penandatangan: [
    { no: 1, nik: "10013173", nama: "Nazaruddin", status: "Sudah TTD" },
    { no: 2, nik: "10010430", nama: "Rahmat Rahimi", status: "Belum TTD" },
  ],
});

// MODAL SIGNATURE
const openSign = ref(false);

const signer = ref({
  jabatan: "AVP of Enterprise Technology Planning - Interim Officer",
  nama: "Rahmat Rahimi",
});

// DELETE (existing)
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (item) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = () => {
  listDelegasi.value = listDelegasi.value.filter(
    (i) => i.id !== itemToDelete.value.id,
  );
  confirmDeleteOpen.value = false;
};

// 🔹 Dummy data mengikuti gambar
const rows = [
  {
    tanggal: "12/08/2025 09:30",
    no: "123/TEST/2025",
    penandatangan: 2,
    status: "belum",
  },
  {
    tanggal: "12/08/2025 10:15",
    no: "124/DIGSIG/2025",
    penandatangan: 3,
    status: "sudah",
  },
  {
    tanggal: "12/07/2025 14:20",
    no: "122/APPROVAL/2025",
    penandatangan: 1,
    status: "belum",
  },
  {
    tanggal: "12/06/2025 11:45",
    no: "121/CONTRACT/2025",
    penandatangan: 4,
    status: "sudah",
  },
  {
    tanggal: "12/05/2025 16:30",
    no: "120/MEMO/2025",
    penandatangan: 2,
    status: "belum",
  },
];

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Penandatanganan", to: "/admin/digsig/penandatanganan" },
];

const search = ref("");
const statusFilter = ref("");
const page = ref(1);
const perPage = 5;

// FILTER
const filteredRows = computed(() => {
  return rows.filter((r) => {
    const matchSearch =
      r.no.toLowerCase().includes(search.value.toLowerCase()) ||
      r.tanggal.toLowerCase().includes(search.value.toLowerCase());

    const matchStatus =
      statusFilter.value === "" || r.status === statusFilter.value;

    return matchSearch && matchStatus;
  });
});

// PAGINATION
const paginatedRows = computed(() => {
  const start = (page.value - 1) * perPage;
  return filteredRows.value.slice(start, start + perPage);
});

const startRow = computed(() => (page.value - 1) * perPage + 1);
const endRow = computed(() =>
  Math.min(page.value * perPage, filteredRows.value.length),
);

const prevPage = () => {
  if (page.value > 1) page.value--;
};

const nextPage = () => {
  if (endRow.value < filteredRows.value.length) page.value++;
};
</script>
