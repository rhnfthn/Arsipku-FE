<template>
  <div class="space-y-4">
    <div class="flex flex-wrap justify-between">
      <div >
        <Heading variant="heading6sb">Detail Naskah Dinas</Heading>
        <Paragraph variant="body2">
          Daftar detail naskah dinas berdasarkan kategori, lokasi, status, dan tahun.
        </Paragraph>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <div class="flex flex-wrap gap-4 my-3 items-center ">
          <button
            @click="refreshData"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
          <RotateCcw class="w-4 h-4" />
          </button>        
        <!-- Filter Jenis -->
        <select v-model="filters.jenis" class="bg-gray-100 rounded px-3 py-2 text-sm">
          <option value="">Semua Jenis</option>
          <option value="ND">Nota Dinas</option>
          <option value="ST">Surat Tugas</option>
        </select>

        <!-- Filter Lokasi -->
        <select v-model="filters.lokasi" class="bg-gray-100 rounded px-3 py-2 text-sm">
          <option value="">Semua Lokasi</option>
          <option v-for="lok in lokasiOptions" :key="lok" :value="lok">{{ lok }}</option>
        </select>

        <!-- Filter Status -->
        <select v-model="filters.status" class="bg-gray-100 rounded px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="Terpakai">Terpakai</option>
          <option value="booking">Booking</option>
          <option value="Tidak Terpakai">Tidak Terpakai</option>
        </select>

        <!-- Filter Tahun -->
        <select v-model="filters.tahun" class="bg-gray-100 rounded px-3 py-2 text-sm">
          <option value="">Semua Tahun</option>
          <option v-for="tahun in tahunOptions" :key="tahun" :value="tahun">{{ tahun }}</option>
        </select>

        <button
        class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:px-5 text-xs"
      >
        <FileDown class="w-4 h-4" />
        Export
      </button> 
      </div>

      <div class="relative flex-1 w-full my-3 px-2">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari perihal / nomor..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      <table class="min-w-full border-collapse text-sm mt-3">
        <thead class="text-left bg-primary-400 text-white">
          <tr>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Nomor</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Tanggal</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Perihal</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Jabatan</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Lokasi</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in filteredData"
            :key="item.id"
            class="hover:bg-blue-50 transition-colors"
          >
            <td class="px-4 py-3">{{ item.nomor }}</td>
            <td class="px-4 py-3">{{ item.tanggal }}</td>
            <td class="px-4 py-3">{{ item.perihal }}</td>
            <td class="px-4 py-3">{{ item.jabatan }}</td>
            <td class="px-4 py-3">{{ item.lokasi }}</td>
            <td class="px-4 py-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                :class="item.status === 'Terpakai' ? 'bg-green-100 text-green-600' : item.status === 'booking' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'"
              >
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {Search, FileDown, RotateCcw} from "lucide-vue-next";

const data = ref([
  {
    id: 1,
    nomor: "ND-001/SSF/KEU/III/2025",
    tanggal: "03/03/2025",
    perihal: "Persetujuan Proses Pembayaran Biaya Pegawai",
    jabatan: "Manager of Finance",
    lokasi: "Airnav Maintenance Facility",
    status: "Terpakai",
    jenis: "ND",
  },
  {
    id: 2,
    nomor: "ST-002/SSF/KEU/III/2024",
    tanggal: "03/03/2024",
    perihal: "Pengajuan Dana Operasional Kantor Cabang Jakarta",
    jabatan: "Manager of HC Admin and General Affairs",
    lokasi: "Jakarta Pusat",
    status: "booking",
    jenis: "ST",
  },
  {
    id: 3,
    nomor: "ND-003/SSF/KEU/III/2023",
    tanggal: "03/03/2023",
    perihal: "Penggantian Biaya Pembelian",
    jabatan: "Manager of HC Admin and General Affairs",
    lokasi: "Jakarta Pusat",
    status: "Tidak Terpakai",
    jenis: "ND",
  },
]);

// Filter state
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});

// Options
const lokasiOptions = computed(() =>
  [...new Set(data.value.map((d) => d.lokasi))]
);
const tahunOptions = computed(() =>
  [...new Set(data.value.map((d) => d.tanggal.split("/")[2]))]
);

// Filtered data
const filteredData = computed(() => {
  return data.value.filter((item) => {
    const tahunItem = item.tanggal.split("/")[2];
    return (
      (filters.value.jenis === "" || item.jenis === filters.value.jenis) &&
      (filters.value.lokasi === "" || item.lokasi === filters.value.lokasi) &&
      (filters.value.status === "" || item.status === filters.value.status) &&
      (filters.value.tahun === "" || tahunItem === filters.value.tahun) &&
      (filters.value.search === "" ||
        Object.values({
          nomor: item.nomor,
          tanggal: item.tanggal,
          perihal: item.perihal,
          jabatan: item.jabatan,
          lokasi: item.lokasi,
          status: item.status,
          jenis: item.jenis,
        })
          .join(" ")
          .toLowerCase()
          .includes(filters.value.search.toLowerCase()))
    );
  });
});

const refreshData = () => {
  filters.value.jenis = "";
  filters.value.lokasi = "";
  filters.value.search = "";
  filters.value.status = "";
  filters.value.tahun = "";
};

</script>