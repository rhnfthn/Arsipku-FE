<template>
    <div class="mb-3 flex flex-wrap justify-between">
      <div>
        <Heading variant="heading8">Rekap Naskah Dinas</Heading>
        <Paragraph variant="body2">
          Rekapitulasi jumlah naskah dinas berdasarkan bulan dan kategori.
        </Paragraph>
      </div>
      <button
        class="flex items-center gap-2 bg-primary text-white h-9 px-4 rounded-lg hover:bg-primary-800 text-xs"
      >
        <FileDown class="w-4 h-4" />
        Export
      </button>    
    </div>
    <div class="p-5 overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <div class="flex items-center">
            <Heading variant="heading9m" class="flex-1">Rekap Naskah Masuk</Heading>
        </div>

        <div class="flex gap-3 py-3">
          <button
            @click="refreshData"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
          <RotateCcw class="w-4 h-4" />
          </button>
            <select v-model="selectedType" class=" rounded-md p-2 text-sm bg-gray-100">
                <option value="">Semua Jenis</option>
                <option v-for="item in data" :key="item.id" :value="item.naskah">
                    {{ item.naskah }}
                </option>
            </select>

            <select v-model="selectedMonth" class="rounded-md p-2 text-sm bg-gray-100">
                <option value="">Semua Bulan</option>
                <option v-for="bulan in monthOptions" :key="bulan.value" :value="bulan.value">
                    {{ bulan.label }}
                </option>
            </select>
            
            <select v-model="selectedYear" class="rounded-md p-2 text-sm bg-gray-100">
                <option v-for="tahun in yearOptions" :key="tahun" :value="tahun">{{ tahun }}</option>
            </select>
        </div>
        
        <table class="text-center">
            <thead>
                <tr>
                    <th class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm w-[350px] text-start">Naskah</th>
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
    
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {FileDown, RotateCcw} from "lucide-vue-next";

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

const selectedMonthLabel = computed(() => {
  return monthOptions.find(m => m.value === selectedMonth.value)?.label ?? "";
});

const data = ref([
  {
    id: 1,
    naskah: "Addendum Perjanjian",
    years: [
      { tahun: 2025, januari: 1552, februari: 1747, maret: 1616, april: 1383, mei: 1656, juni: 1547, juli: 97, agustus: 0, september: 1, oktober: 0, november: 1000, desember: 0 },
      { tahun: 2024, januari: 1200, februari: 1100, maret: 900, april: 800, mei: 950, juni: 1000, juli: 70, agustus: 5, september: 10, oktober: 0, november: 50, desember: 10 },
      { tahun: 2023, januari: 800, februari: 600, maret: 500, april: 450, mei: 400, juni: 350, juli: 40, agustus: 10, september: 0, oktober: 0, november: 0, desember: 5 },
    ]
  },
  {
    id: 2,
    naskah: "Addendum Surat Perintah Kerja (SPK) Pengadaan",
    years: [
      { tahun: 2025, januari: 143, februari: 161, maret: 175, april: 196, mei: 179, juni: 152, juli: 7, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
      { tahun: 2024, januari: 200, februari: 240, maret: 180, april: 210, mei: 190, juni: 170, juli: 10, agustus: 0, september: 4, oktober: 3, november: 1, desember: 0 },
      { tahun: 2023, januari: 120, februari: 130, maret: 150, april: 100, mei: 90, juni: 80, juli: 10, agustus: 0, september: 0, oktober: 0, november: 3, desember: 1 },
    ]
  },
  {
    id: 3,
    naskah: "Berita Acara",
    years: [
      { tahun: 2025, januari: 143, februari: 161, maret: 175, april: 196, mei: 179, juni: 152, juli: 7, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
      { tahun: 2024, januari: 200, februari: 240, maret: 180, april: 210, mei: 190, juni: 170, juli: 10, agustus: 0, september: 4, oktober: 3, november: 1, desember: 0 },
      { tahun: 2023, januari: 120, februari: 130, maret: 150, april: 100, mei: 90, juni: 80, juli: 10, agustus: 0, september: 0, oktober: 0, november: 3, desember: 1 },
    ]
  },
  {
    id: 4,
    naskah: "Berita Acara Hasil Audit",
    years: [
      { tahun: 2025, januari: 143, februari: 161, maret: 175, april: 196, mei: 179, juni: 152, juli: 7, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
      { tahun: 2024, januari: 200, februari: 240, maret: 180, april: 210, mei: 190, juni: 170, juli: 10, agustus: 0, september: 4, oktober: 3, november: 1, desember: 0 },
      { tahun: 2023, januari: 120, februari: 130, maret: 150, april: 100, mei: 90, juni: 80, juli: 10, agustus: 0, september: 0, oktober: 0, november: 3, desember: 1 },
    ]
  },
  {
    id: 5,
    naskah: "Keputusan Direktur",
    years: [
      { tahun: 2025, januari: 143, februari: 161, maret: 175, april: 196, mei: 179, juni: 152, juli: 7, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
      { tahun: 2024, januari: 200, februari: 240, maret: 180, april: 210, mei: 190, juni: 170, juli: 10, agustus: 0, september: 4, oktober: 3, november: 1, desember: 0 },
      { tahun: 2023, januari: 120, februari: 130, maret: 150, april: 100, mei: 90, juni: 80, juli: 10, agustus: 0, september: 0, oktober: 0, november: 3, desember: 1 },
    ]
  },
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
</script>
