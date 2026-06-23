<template>
  <div>
    <div class="flex justify-between">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <!-- Left Section - Title & Breadcrumb -->
        <PageHeader title="Berkas" :items="items" />
      </div>
      <button
        @click="
          showModal = true;
          resetForm();
        "
        class="flex items-center gap-2 bg-primary text-white space-y-6 h-8 px-6 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white mt-5">
      <div class="flex flex-wrap gap-2 p-3 items-center">
        <button @click="refreshData" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <RotateCcw class="w-4 h-4" />
        </button>

        <div class="relative flex-1 w-full">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari berkas / klasifikasi..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
        <button
          class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:px-5 text-xs"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <table class="min-w-full border-collapse text-sm">
        <thead class="text-left bg-primary-400 text-white">
          <tr>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Klasifikasi</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Berkas</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">Lokasi</th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold whitespace-nowrap">
              Tanggal Dibuat
            </th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in filteredData"
            :key="item.id"
            class="hover:bg-blue-50 transition-colors border-b border-b-gray-200"
          >
            <td class="px-4 py-3">
              <span
                v-html="
                  highlight(
                    `${item.klasifikasi ?? ''} - ${item.klasifikasi_teks ?? ''}`,
                    filters.search
                  )
                "
              ></span>
            </td>
            <td class="px-4 py-3 capitalize" v-html="highlight(item.berkas, filters.search)"></td>
            <td class="px-4 py-3 capitalize whitespace-nowrap">
              <span v-html="highlight(item.lokasi, filters.search)"></span>
            </td>
            <td class="px-4 py-3" v-html="highlight(item.tanggal, filters.search)"></td>
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

      <ConfirmPopup
        v-model="showDeletePopup"
        type="danger"
        title="Hapus Berkas?"
        message="Berkas yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        @confirm="confirmDelete"
        @cancel="showDeletePopup = false"
      />

      <Modal :model-value="showModal" @update:modelValue="showModal = $event" @save="saveData">
        <template #title>
          <Heading variant="heading9b" class="font-semibold text-sm mt-5 ml-5">
            {{ isEdit ? 'Edit Berkas' : 'Tambah Berkas' }}
          </Heading>
        </template>

        <div class="flex flex-col gap-4">
          <!-- Klasifikasi -->
          <div>
            <label class="text-xs font-semibold">Klasifikasi</label>
            <select
              v-model="form.klasifikasi"
              required
              class="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option disabled value="">Pilih klasifikasi</option>

              <option v-for="item in klasifikasiOptions" :key="item.id" :value="item.klasifikasi">
                {{ item.klasifikasi }} - {{ item.klasifikasi_text }}
              </option>
            </select>
          </div>

          <!-- Judul Berkas -->
          <div>
            <label class="text-xs font-semibold">Judul Berkas</label>
            <input
              v-model="form.berkas"
              required
              type="text"
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Masukkan judul berkas"
            />
          </div>

          <!-- Hitung Waktu Retensi Dari -->
          <div>
            <label class="text-xs font-semibold"> Hitung Waktu Retensi Dari </label>

            <select
              v-model="form.retensi"
              required
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option disabled value="">Pilih waktu retensi</option>

              <option v-for="opt in retensiOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Tindakan -->
          <div>
            <label class="text-xs font-semibold"> Tindakan Penyusutan Akhir </label>

            <select
              v-model="form.tindakan"
              required
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option disabled value="">Pilih tindakan</option>

              <option v-for="opt in tindakanOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Lokasi -->
          <div>
            <label class="text-xs font-semibold">Lokasi</label>
            <input
              v-model="form.lokasi"
              required
              type="text"
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Masukkan lokasi"
            />
          </div>

          <!-- Isi Ringkas -->
          <div>
            <label class="text-xs font-semibold">Isi Ringkas</label>
            <textarea
              v-model="form.isi"
              required
              rows="4"
              class="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Tulis isi ringkas (opsional)"
            >
            </textarea>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, FileDown, RotateCcw, Trash2, Pencil, Plus } from 'lucide-vue-next';
import type { BreadcrumbItem } from '@nuxt/ui';
import ConfirmPopup from '~/components/ConfirmPopup.vue';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import { useBerkas } from '~/composables/useBerkas';
const { getBerkasList, createBerkas, deleteBerkas, updateBerkas, getBerkasById } = useBerkas();

const { getKlasifikasiList } = useKlasifikasi();

const klasifikasiOptions = ref<any[]>([]);
const loadingKlasifikasi = ref(false);

const fetchKlasifikasi = async () => {
  try {
    loadingKlasifikasi.value = true;
    const res = await getKlasifikasiList();
    const list = (res as any)?.data ?? res;

    klasifikasiOptions.value = list.filter((item: Klasifikasi) => item.active === 1);
  } catch (err) {
    console.error('Gagal ambil klasifikasi', err);
  } finally {
    loadingKlasifikasi.value = false;
  }
};

onMounted(() => {
  fetchKlasifikasi();
});

const data = ref<any[]>([]);
const loadingData = ref(false);

const fetchBerkas = async () => {
  try {
    loadingData.value = true;
    const res = await getBerkasList();
    const list = (res as any)?.data ?? res;

    data.value = list.map((item: any) => ({
      id: item.id,
      klasifikasi: item.klasifikasi,
      klasifikasi_teks: item.klasifikasiTeks,
      berkas: item.judulBerkas,
      lokasi: item.lokasi,
      tanggal: item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'
    }));
  } catch (error) {
    console.error('Gagal ambil berkas', error);
  } finally {
    loadingData.value = false;
  }
};

onMounted(() => {
  fetchKlasifikasi();
  fetchBerkas();
});

const items = [
  {
    label: 'Dashboard',
    to: '/'
  },
  {
    label: 'Berkas',
    to: '/admin/berkas/'
  }
] satisfies BreadcrumbItem[];

// Filter state
const filters = ref({
  search: ''
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function highlight(text: string | null | undefined, keyword: string): string {
  const safeText = escapeHtml(String(text ?? '-'));
  const q = keyword.trim();
  if (!q) return safeText;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  return safeText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}

// Filtered data
const filteredData = computed(() => {
  return data.value.filter(
    (item) =>
      filters.value.search === '' ||
      Object.values({
        klasifikasi: item.klasifikasi,
        tanggal: item.tanggal,
        berkas: item.berkas,
        lokasi: item.lokasi
      })
        .join(' ')
        .toLowerCase()
        .includes(filters.value.search.toLowerCase())
  );
});

const refreshData = () => {
  filters.value.search = '';
};

// Modal visibility
const showModal = ref(false);

export interface Klasifikasi {
  id: string;
  klasifikasi: string;
  klasifikasi_text: string;
  active: number;
}

// Form state
export interface BerkasCreateInput {
  klasifikasi: string;
  judul_berkas: string;
  hitung_waktu_retensi_dari: string;
  tindakan_penyusutan_akhir: string;
  lokasi: string;
  isi_ringkas?: string;
}

const retensiOptions = ref([
  {
    value: 'Sejak Berkas Dibuat',
    label: 'Sejak Berkas Dibuat'
  },
  {
    value: 'Sejak Berkas Ditutup',
    label: 'Sejak Berkas Ditutup'
  }
]);
const tindakanOptions = ref([
  { value: 'Musnah', label: 'Musnah' },
  { value: 'Dinilai Kembali', label: 'Dinilai Kembali' },
  { value: 'Permanen', label: 'Permanen' }
]);

const isEdit = ref(false);
const selectedId = ref<number | null>(null);

const editData = async (item: any) => {
  try {
    isEdit.value = true;
    showModal.value = true;
    selectedId.value = item.id;

    const res = await getBerkasById(item.id);
    const berkas: any = (res as any)?.data ?? res;

    form.value = {
      klasifikasi: berkas.klasifikasi,
      berkas: berkas.judulBerkas,
      lokasi: berkas.lokasi,
      isi: berkas.isiRingkas ?? '',
      retensi: berkas.hitungWaktuRetensiDari ?? '',
      tindakan: berkas.tindakanPenyusutanAkhir ?? ''
    };
  } catch (error) {
    console.error('Gagal ambil detail berkas', error);
  }
};

const form = ref({
  klasifikasi: '',
  berkas: '',
  lokasi: '',
  isi: '',
  retensi: '',
  tindakan: ''
});

const saveData = async () => {
  if (
    !form.value.klasifikasi ||
    !form.value.berkas ||
    !form.value.retensi ||
    !form.value.tindakan ||
    !form.value.lokasi ||
    !form.value.isi
  ) {
    alert('Semua field wajib diisi');
    return;
  }

  try {
    const payload: any = {
      klasifikasi: form.value.klasifikasi,
      judul_berkas: form.value.berkas,
      hitung_waktu_retensi_dari: form.value.retensi,
      tindakan_penyusutan_akhir: form.value.tindakan,
      lokasi: form.value.lokasi,
      isi_ringkas: form.value.isi
    };

    if (isEdit.value && selectedId.value) {
      await updateBerkas(selectedId.value, payload);
    } else {
      await createBerkas(payload);
    }

    showModal.value = false;
    resetForm();
    await fetchBerkas();
  } catch (error) {
    console.error('Gagal simpan berkas', error);
  }
};

const resetForm = () => {
  isEdit.value = false;
  selectedId.value = null;
  form.value = {
    klasifikasi: '',
    berkas: '',
    lokasi: '',
    isi: '',
    retensi: '',
    tindakan: ''
  };
};

const deleteData = (id: number) => {
  deleteId.value = id;
  showDeletePopup.value = true;
};

const confirmDelete = async () => {
  if (!deleteId.value) return;

  try {
    await deleteBerkas(deleteId.value);

    showDeletePopup.value = false;
    deleteId.value = null;

    await fetchBerkas();
  } catch (error) {
    console.error('Gagal menghapus berkas', error);
  }
};

const showDeletePopup = ref(false);
const deleteId = ref<number | null>(null);
</script>
