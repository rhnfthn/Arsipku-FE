<template>
    <div class="mb-3 flex flex-wrap justify-between">
      <div>
        <Heading variant="heading6sb">Naskah Masuk</Heading>
        <Paragraph variant="body2">
          Kelola dan pantau naskah masuk berdasarkan lokasi, jenis, dan tahun.
        </Paragraph>
      </div>   
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <div class="sticky top-0 z-40 bg-white flex-wrap flex justify-between p-3">
          <div class="flex gap-3">
            <button
              @click="refreshData"
              class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
            <RotateCcw class="w-4 h-4" />
            </button>    
              <select v-model="selectedType" class="bg-gray-100 rounded-md p-2 text-sm">
                  <option value="">Semua Jenis</option>
                  <option v-for="item in data" :key="item.id" :value="item.naskah">
                      {{ item.naskah }}
                  </option>
              </select>

              <select v-model="selectedMonth" class="bg-gray-100 rounded-md p-2 text-sm">
                  <option value="">Semua Bulan</option>
                  <option v-for="bulan in monthOptions" :key="bulan.value" :value="bulan.value">
                      {{ bulan.label }}
                  </option>
              </select>
              
              <select v-model="selectedYear" class="bg-gray-100 rounded-md p-2 text-sm">
                  <option v-for="tahun in yearOptions" :key="tahun" :value="tahun">{{ tahun }}</option>
              </select>
          </div>
          <button
              class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:bg-primary-800 text-xs"
              >
              <FileDown class="w-4 h-4" />
              Export
            </button> 
        </div>  

        <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table class="text-center">
              <thead class="sticky top-0 z-30 bg-primary-400 text-white">
                  <tr>
                      <th class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm text-start">Naskah</th>
                      <template v-if="!selectedMonth">
                          <th v-for="bulan in monthOptions" :key="bulan.value"
                              class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm">
                              {{ bulan.label }}
                          </th>
                      </template>

                      <template v-else>
                          <th class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm">{{ selectedMonthLabel }}</th>
                      </template>

                      <th class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm">Jumlah</th>
                  </tr>
              </thead>

              <tbody>
                  <tr v-for="row in filteredTableData" :key="row.id" class="hover:bg-blue-50">
                      <td class="px-4 py-3 text-sm text-start max-w-[350px] whitespace-nowrap overflow-x-visible">{{ row.naskah }}</td>

                      <template v-if="!selectedMonth">
                          <td v-for="bulan in monthOptions" :key="bulan.value" class="px-4 py-3 text-sm">
                              {{ row[bulan.value] || '-' }}
                          </td>
                      </template> 

                      <template v-else>
                          <td class="px-4 py-3 text-sm">
                              {{ row[selectedMonth] || '-' }}
                          </td>
                      </template>

                      <td class="px-4 py-3 font-bold text-sm text-gray-900">{{ row.jumlah }}</td>
                  </tr>
              </tbody>
          </table>
        </div>
    </div>
    
    <!-- table ke 2 -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white mt-10">
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

</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import{FileDown, RotateCcw} from "lucide-vue-next"

const selectedYear = ref(2025);
const selectedType = ref("");
const selectedMonth = ref("");

const monthOptions = [
  { label: "Januari", value: "januari" },
  { label: "Februari", value: "februari" },
  { label: "Maret", value: "maret" },
  { label: "April", value: "april" },
  { label: "Mei", value: "mei" },
  { label: "Juni", value: "juni" },
  { label: "Juli", value: "juli" },
  { label: "Agustus", value: "agustus" },
  { label: "September", value: "september" },
  { label: "Oktober", value: "oktober" },
  { label: "November", value: "november" },
  { label: "Desember", value: "desember" },
];

const data2 = ref([
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


const selectedMonthLabel = computed(() => {
  return monthOptions.find(m => m.value === selectedMonth.value)?.label ?? "";
});

const data = ref([
  {
    id: 1,
    naskah: "Surat Dinas Eksternal",
    years: [
      { tahun: 2025, januari: 1552, februari: 1747, maret: 1616, april: 1383, mei: 1656, juni: 1547, juli: 97, agustus: 0, september: 1, oktober: 0, november: 1000, desember: 0 },
      { tahun: 2024, januari: 1200, februari: 1100, maret: 900, april: 800, mei: 950, juni: 1000, juli: 70, agustus: 5, september: 10, oktober: 0, november: 50, desember: 10 },
      { tahun: 2023, januari: 800, februari: 600, maret: 500, april: 450, mei: 400, juni: 350, juli: 40, agustus: 10, september: 0, oktober: 0, november: 0, desember: 5 },
    ]
  },
  {
    id: 2,
    naskah: "Surat Undangan",
    years: [
      { tahun: 2025, januari: 143, februari: 161, maret: 175, april: 196, mei: 179, juni: 152, juli: 7, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
      { tahun: 2024, januari: 200, februari: 240, maret: 180, april: 210, mei: 190, juni: 170, juli: 10, agustus: 0, september: 4, oktober: 3, november: 1, desember: 0 },
      { tahun: 2023, januari: 120, februari: 130, maret: 150, april: 100, mei: 90, juni: 80, juli: 10, agustus: 0, september: 0, oktober: 0, november: 3, desember: 1 },
    ]
  }
]);

const filteredTableData = computed(() => {
  return data.value
    .filter(item => !selectedType.value || item.naskah === selectedType.value)
    .map(item => {
      const yearData = item.years.find(y => y.tahun === selectedYear.value);

      const totalJumlah = Object.values(yearData)
        .filter(v => typeof v === "number")
        .reduce((acc, cur) => acc + cur, 0);

      return { id: item.id, naskah: item.naskah, ...yearData, jumlah: totalJumlah };
    });
});

const yearOptions = computed(() => {
  const years = new Set();
  data.value.forEach(d => d.years.forEach(y => years.add(y.tahun)));
  return Array.from(years).sort((a, b) => b - a);
});

const refreshData = () => {
  selectedMonth.value = "";
  selectedType.value = "";
  selectedYear.value = 2025;
};

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
  [...new Set(data2.value.map((d) => d.lokasi))]
);
const tahunOptions = computed(() =>
  [...new Set(data2.value.map((d) => d.tanggal.split("/")[2]))]
);

// Filtered data
const filteredData = computed(() => {
  return data2.value.filter((item) => {
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

</script>
