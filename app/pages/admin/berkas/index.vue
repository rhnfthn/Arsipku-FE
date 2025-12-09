<template>
  <div class="space-y-4">
    <div class="space-y-6 flex justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <!-- Left Section - Title & Breadcrumb -->
            <PageHeader title="Berkas" :items="items" />
        </div>
        <button @click="showModal = true; resetForm()" class="flex items-center gap-2 bg-primary text-white space-y-6 h-8 px-6 rounded-lg hover:bg-primary-800 text-xs">
          <Plus class="w-4 h-4" />
          Tambah
        </button>
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
            placeholder="Cari berkas / klasifikasi..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      <table class="min-w-full border-collapse text-sm mt-3">
        <thead class="text-left bg-primary-400 text-white">
          <tr>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Klasifikasi</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Berkas</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Lokasi</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Tanggal Dibuat</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in filteredData"
            :key="item.id"
            class="hover:bg-blue-50 transition-colors"
          >
            <td class="px-4 py-3">{{ item.klasifikasi }}</td>
            <td class="px-4 py-3 capitalize">{{ item.berkas }}</td>
            <td class="px-4 py-3 capitalize">{{ item.lokasi }}</td>
            <td class="px-4 py-3">{{ item.tanggal }}</td>
            <td class="px-4 py-3 text-center flex justify-center gap-5">
              <button class="text-yellow-500" @click="editData(item)">
                <Pencil class="w-4 h-4" />
              </button>

              <button class="text-red-500" @click="deleteData(item.id)">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <Modal :model-value="showModal" @update:modelValue="showModal = $event" @save="saveData">
        <template #title>
          <Heading variant="heading9b" class="font-semibold text-sm mt-5 ml-5">
            {{ isEdit ? "Edit Berkas" : "Tambah Berkas" }}
          </Heading>
        </template>

        <div class="flex flex-col gap-4">
          <!-- Klasifikasi -->
          <div>
            <label class="text-xs font-semibold">Klasifikasi</label>
            <select v-model="form.klasifikasi" class="w-full border rounded-lg px-3 py-2 text-sm mt-1">
              <option disabled value="">Pilih klasifikasi</option>
              <option>OPS - OPERASI</option>
              <option>OPS.01 - ATFM</option>
              <option>OPS.01.01 - SLOT TIME</option>
            </select>
          </div>

          <!-- Judul Berkas -->
          <div>
            <label class="text-xs font-semibold">Judul Berkas</label>
            <input v-model="form.berkas" type="text"
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Masukkan judul berkas" />
          </div>

          <!-- Lokasi -->
          <div>
            <label class="text-xs font-semibold">Lokasi</label>
            <input v-model="form.lokasi" type="text"
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Masukkan lokasi"/>
          </div>

          <!-- Isi Ringkas -->
          <div>
            <label class="text-xs font-semibold">Isi Ringkas</label>
            <textarea v-model="form.isi" rows="4"
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Tulis isi ringkas (opsional)">
            </textarea>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {Search, FileDown, RotateCcw, Trash2, Pencil, Plus} from "lucide-vue-next";

const items = [
    {
        label: 'Dashboard',
        to: '/'
    },
    {
        label: 'Berkas',
        to: '/admin/berkas/'
    }
] satisfies BreadcrumbItem[]

const data = ref([
  {
    id: 1,
    klasifikasi: "OPS - OPERASI",
    tanggal: "03/03/2025",
    berkas: "Persetujuan Proses Pembayaran Biaya Pegawai",
    lokasi: "Jakarta Timur",
  },
  {
    id: 2,
    klasifikasi: "OPS.01 - AIR TRAFFIC FLOW MANAGEMENT (ATFM",
    tanggal: "03/03/2024",
    berkas: "Pengajuan Dana Operasional Kantor Cabang Jakarta",
    lokasi: "Jakarta Pusat",
  },
  {
    id: 3,
    klasifikasi: "OPS.01.01 - PEMANTAUAN SLOT TIME",
    tanggal: "03/03/2023",
    berkas: "Penggantian Biaya Pembelian",
    lokasi: "Jakarta Pusat",
  },
]);

// Filter state
const filters = ref({
  jenis: "",
  lokasi: "",
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
      (filters.value.tahun === "" || tahunItem === filters.value.tahun) &&
      (filters.value.search === "" ||
        Object.values({
          klasifikasi: item.klasifikasi,
          tanggal: item.tanggal,
          berkas: item.berkas,
          jabatan: item.jabatan,
          lokasi: item.lokasi,
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
  filters.value.tahun = "";
};

// Modal visibility
const showModal = ref(false)

// Form state
const form = ref({
  klasifikasi: "",
  berkas: "",
  lokasi: "",
  isi: "",
})

const isEdit = ref(false)
const selectedId = ref<number | null>(null)

const editData = (item: any) => {
  isEdit.value = true
  showModal.value = true
  selectedId.value = item.id

  form.value = {
    klasifikasi: item.klasifikasi,
    berkas: item.berkas,
    lokasi: item.lokasi,
    isi: ""   // optional
  }
}


const saveData = () => {
  if (isEdit.value && selectedId.value !== null) {
    // Update data
    const index = data.value.findIndex(d => d.id === selectedId.value)
    if (index !== -1) {
      data.value[index].klasifikasi = form.value.klasifikasi
      data.value[index].berkas = form.value.berkas
      data.value[index].lokasi = form.value.lokasi
    }
  } else {
    // Tambah Baru
    const today = new Date()
    const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`

    data.value.push({
      id: Date.now(),
      klasifikasi: form.value.klasifikasi,
      berkas: form.value.berkas,
      lokasi: form.value.lokasi,
      tanggal: formattedDate,
    })
  }

  showModal.value = false
  resetForm()
}

const resetForm = () => {
  isEdit.value = false
  selectedId.value = null
  form.value = { klasifikasi: "", berkas: "", lokasi: "", isi: "" }
}

const deleteData = (id: number) => {
  data.value = data.value.filter(item => item.id !== id)
}


</script>