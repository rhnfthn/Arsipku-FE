<template>
  <div class="relative">
    <Teleport to="body">
      <div v-if="isLoadingData"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] transition-all">
        <div
          class="flex flex-col items-center gap-3 p-5 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700">
          <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
          <span class="text-gray-700 dark:text-gray-200 font-medium text-sm">
            {{ loadingMessage || 'Memproses...' }}
          </span>
        </div>
      </div>
    </Teleport>

    <PageHeader title="Lanjut Konsep" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800' }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList"
          :loading="klasifikasiStatus === 'loading'" />
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />
        <TulisInputSifat v-model="selectedSifat" />

        <TulisInputPenerima v-model="selectedPenerima" label="Tujuan (BOD/Direksi)" placeholder="Pilih Pejabat..."
          :items="recipientItems" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan..."
          :items="recipientItems" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
                placeholder="Ketik Perihal" />
            </div>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0 pt-1">Catatan
              Pengantar</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <textarea v-model="catatan" rows="2"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 resize-none"
                placeholder="Tambahkan catatan untuk penerima selanjutnya (opsional)..."></textarea>
            </div>
          </div>
        </div>

        <div class="flex flex-col py-4">
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <div class="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-white p-8 text-center border-b hidden md:block">
              <img src="/logoAirnav.png" alt="Logo" class="h-12 mx-auto mb-2" />
              <h1 class="font-bold text-lg uppercase">AirNav Indonesia</h1>
            </div>

            <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
          </div>

          <TulisInputLampiran v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-3 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800 flex-wrap">

          <UButton label="Preview PDF" color="gray" variant="ghost" icon="i-lucide-eye" @click="handlePreview" />

          <div class="flex-1"></div>
          <UButton label="Kembalikan (Reject)" color="red" variant="soft" icon="i-heroicons-x-circle"
            @click="isRejectModalOpen = true" />

          <UButton label="Teruskan (Forward)" color="orange" variant="solid" icon="i-heroicons-paper-airplane"
            @click="confirmAction('forward')" />

          <UButton label="Setujui (Finalize)" color="primary" variant="solid" icon="i-heroicons-check-circle"
            @click="confirmAction('finalize')" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Pratinjau Dokumen"
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0' }">
      <div class="h-full w-full flex items-center justify-center bg-gray-100">
        <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
        <div v-else class="flex flex-col items-center">
          <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary" />
          <span class="text-gray-500 mt-2">Memuat PDF...</span>
        </div>
      </div>
    </USlideover>

    <UModal v-model="isRejectModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold mb-4">Kembalikan Konsep</h3>
        <UTextarea v-model="rejectReason" placeholder="Masukkan alasan pengembalian..." class="mb-4" :rows="4" />
        <div class="flex justify-end gap-2">
          <UButton label="Batal" color="gray" variant="ghost" @click="isRejectModalOpen = false" />
          <UButton label="Kembalikan" color="red" :loading="isLoadingData" @click="handleReject" />
        </div>
      </div>
    </UModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

// Components (Asumsikan komponen ini sudah ada di project Anda)
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

import { useKonsep } from "~/composables/useKonsep";
import { useAuth } from "~/composables/useAuth"; // Asumsi ada auth
import { useKlasifikasi } from "~/composables/useKlasifikasi"; // Asumsi ada klasifikasi
import { Alert } from "@/composables/useAlert";
import { KonsepBaseSchema, type KonsepPayload } from "~/types/konsep";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const idKonsep = route.params.id as string;

const { getKonsepDetail, getManagerialRecipients, finalizeKonsep, forwardKonsep, rejectKonsep, previewPdf } = useKonsep();
const { user } = useAuth();
const { getKlasifikasi } = useKlasifikasi();

const breadcrumbs = [
  { label: "Kotak Masuk", to: "/korespondensi/masuk" },
  { label: "Lanjut Konsep", to: "#" },
];

// STATE
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const isRejectModalOpen = ref(false);
const rejectReason = ref("");
const pdfUrl = ref("");

// Form Data
const subject = ref("");
const editorContent = ref("");
const catatan = ref("");
const selectedKlasifikasiId = ref<string | null>(null);
const selectedSifat = ref<any>(null);
const date = ref<CalendarDate>(new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()));

// Lists
const recipientItems = ref<any[]>([]);
const selectedPenerima = ref<any[]>([]); // Array of Objects
const selectedTembusan = ref<any[]>([]);
const existingFiles = ref<any[]>([]);
const klasifikasiList = ref<any[]>([]);
const klasifikasiStatus = ref('idle');

// TinyMCE Init
const tinymceEditor = ref<TinyMCEEditor | null>(null);
const tinyMceInit = {
  height: 500,
  menubar: false,
  plugins: 'lists link image code table',
  toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | table code',
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; }`
};

// --- COMPUTED ---
const formattedDate = computed(() => {
  return `${date.value.year}-${String(date.value.month).padStart(2, '0')}-${String(date.value.day).padStart(2, '0')}`;
});

const getSelectedKlasifikasi = computed(() =>
  klasifikasiList.value.find(k => k.id === selectedKlasifikasiId.value)
);

// --- METHODS ---

// 1. Prepare Payload (FormData)
const createPayload = (includePdf = false): FormData => {
  const fd = new FormData();

  // Data Wajib
  fd.append('jenis', 'SDE'); // Default SDE sesuai contoh, atau ambil dari detail
  fd.append('from_position_id', String(user.value?.position));
  fd.append('to_position_id', String(selectedPenerima.value[0]?.value || '')); // Primary recipient
  fd.append('pengirim_position_id', String(user.value?.position));

  // Arrays
  const penerimaIds = selectedPenerima.value.map(p => Number(p.value));
  fd.append('penerima_position_ids', JSON.stringify(penerimaIds));

  if (selectedTembusan.value.length) {
    const tembusanIds = selectedTembusan.value.map(t => Number(t.value));
    // API meminta single ID jika satu, array jika banyak? Cek Zod. Kita kirim JSON safe.
    fd.append('tembusan_position_ids', JSON.stringify(tembusanIds.length === 1 ? tembusanIds[0] : tembusanIds));
  }

  // Metadata
  fd.append('tgl', formattedDate.value);
  fd.append('klasifikasi', getSelectedKlasifikasi.value?.klasifikasi || '');
  fd.append('klasifikasi_text', getSelectedKlasifikasi.value?.klasifikasi_text || '');
  fd.append('sifat', selectedSifat.value?.value || 'biasa');
  fd.append('perihal', subject.value);
  fd.append('konten', editorContent.value);
  fd.append('catatan', catatan.value);

  // Hardcoded placeholders based on example
  fd.append('nama_tempat', user.value?.alamatInfo?.kota || 'Tangerang');
  fd.append('nama_jabatan', user.value?.positionText || '');
  fd.append('nama_lengkap', user.value?.nama || '');

  // Files
  // Logic: kirim lampiran_temp_ids untuk file baru
  const newFiles = existingFiles.value.filter(f => f.isNew).map(f => f.id);
  fd.append('lampiran_temp_ids', JSON.stringify(newFiles));
  fd.append('lampiran', String(existingFiles.value.length)); // Jumlah

  return fd;
};

// 2. Load Data
const loadInitialData = async () => {
  isLoadingData.value = true;
  try {
    // Parallel Fetch
    const [resDetail, resRecipients, resKlas] = await Promise.all([
      getKonsepDetail(idKonsep),
      getManagerialRecipients(),
      getKlasifikasi()
    ]);

    klasifikasiList.value = resKlas;

    // Map Recipients
    if (resRecipients.success) {
      recipientItems.value = resRecipients.data.map((r: any) => ({
        label: `${r.persnum_person_text || r.position_text} - ${r.position_text}`,
        value: String(r.position),
        raw: r
      }));
    }

    // Map Detail to Form
    const data = resDetail.data;
    if (data) {
      subject.value = data.naskah.perihal;
      editorContent.value = data.naskah.konten;
      if (data.naskah.tanggal) {
        const d = new Date(data.naskah.tanggal);
        date.value = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      }

      // Map Klasifikasi
      const k = klasifikasiList.value.find(i => i.klasifikasi === data.naskah.klasifikasi.trim());
      if (k) selectedKlasifikasiId.value = k.id;

      // Map Sifat
      selectedSifat.value = { value: data.naskah.sifat, label: data.naskah.sifat.toUpperCase() };

      // Map Existing Files (Visual only, logic re-upload/keep handled by backend typically)
      // Disini kita asumsikan backend menghandle file lama via ID naskah
      // existingFiles.value = data.lampiran...
    }

  } catch (e) {
    console.error(e);
    toast.add({ title: 'Gagal memuat data', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

// 3. Actions
const handlePreview = async () => {
  isLoadingData.value = true;
  loadingMessage.value = "Membuat Preview...";
  try {
    const fd = createPayload();
    const blob = await previewPdf(fd);
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = URL.createObjectURL(blob);
    isOpenPreview.value = true;
  } catch (e) {
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmAction = async (action: 'finalize' | 'forward') => {
  // Basic Validation
  if (!selectedPenerima.value.length) {
    toast.add({ title: 'Pilih Penerima Terlebih Dahulu', color: 'warning' });
    return;
  }

  const confirm = await Alert.confirm(
    action === 'finalize' ? 'Setujui & Finalisasi?' : 'Teruskan Konsep?',
    'Pastikan isi dokumen sudah benar.'
  );
  if (!confirm) return;

  isLoadingData.value = true;
  loadingMessage.value = "Mengirim Data...";

  try {
    const fd = createPayload();
    let res;
    if (action === 'finalize') {
      res = await finalizeKonsep(idKonsep, fd);
    } else {
      res = await forwardKonsep(idKonsep, fd);
    }

    toast.add({ title: 'Berhasil', description: 'Dokumen berhasil diproses', color: 'success' });
    router.push('/korespondensi/konsep'); // Redirect
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e.response?.data?.message || 'Terjadi kesalahan', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const handleReject = async () => {
  if (!rejectReason.value) return;

  isLoadingData.value = true;
  try {
    await rejectKonsep(idKonsep, {
      from_position_id: Number(user.value?.position),
      catatan: rejectReason.value
    });
    toast.add({ title: 'Konsep Dikembalikan', color: 'success' });
    router.push('/korespondensi/konsep');
  } catch (e) {
    toast.add({ title: 'Gagal Menolak', color: 'error' });
  } finally {
    isLoadingData.value = false;
    isRejectModalOpen.value = false;
  }
};

const handleApplyTemplate = (content: string) => {
  editorContent.value = content;
  if (tinymceEditor.value) tinymceEditor.value.setContent(content);
};

onMounted(() => {
  loadInitialData();
});
</script>
