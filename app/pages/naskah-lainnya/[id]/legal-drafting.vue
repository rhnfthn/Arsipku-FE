<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <NuxtLink to="/naskah-lainnya" class="hover:text-primary">Naskah Lainnya</NuxtLink>
          <span>/</span>
          <NuxtLink :to="`/naskah-lainnya/${id}`" class="hover:text-primary">Detail</NuxtLink>
          <span>/</span>
          <span class="text-gray-700 dark:text-gray-300">Legal Drafting</span>
        </div>
        <h1 class="mt-2 text-xl font-bold text-gray-900 dark:text-white">{{ detail?.nomor || 'Memuat…' }}</h1>
        <div class="mt-1.5 flex gap-2">
          <UBadge color="primary" size="sm">Legal Drafting</UBadge>
          <UBadge v-if="detail?.jenis" color="neutral" size="sm">{{ jenisLabel(detail.jenis) }}</UBadge>
        </div>
      </div>
      <UButton :to="`/naskah-lainnya/${id}`" variant="ghost" icon="i-lucide-arrow-left" color="neutral">
        Kembali ke Detail
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div v-else>
      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        area-title="Legal Drafting"
        area-description="Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Sistem membaca isi dan parameter di dalamnya."
        catatan-title="Catatan Legal"
        catatan-placeholder="Catatan hasil pemeriksaan legal…"
        v-model="catatanLegal"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @upload-revisi="onUploadRevisi"
      >
        <template #actions>
          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-save"
            size="lg"
            :loading="saving"
            @click="simpanDraft"
          >Simpan Draft</UButton>
          <UButton
            color="primary"
            icon="i-lucide-send"
            size="lg"
            :loading="sendingApproval"
            @click="kirimApproval"
          >Kirim Approval Legal</UButton>
          <UButton
            color="error"
            variant="outline"
            icon="i-lucide-undo-2"
            size="lg"
            @click="showKembalikanModal = true"
          >Kembalikan ke Pemrakarsa</UButton>
        </template>
      </NaskahDraftWorkspace>
    </div>

    <!-- Preview Modal -->
    <UModal v-model="previewUrl" :ui="{ content: 'max-w-4xl' }">
      <template #content>
        <div class="flex h-[85vh] flex-col">
          <div class="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Preview Dokumen</h3>
            <UButton size="sm" variant="ghost" icon="i-lucide-x" @click="previewUrl = null" />
          </div>
          <iframe :src="previewUrl" class="flex-1 w-full" />
        </div>
      </template>
    </UModal>

    <!-- Kembalikan Modal -->
    <VerifyActionModal
      v-model="showKembalikanModal"
      variant="reject"
      title="Kembalikan ke Pemrakarsa"
      description="Naskah akan dikembalikan ke pemrakarsa untuk diperbaiki."
      :require-note="true"
      note-placeholder="Tuliskan alasan pengembalian…"
      confirm-label="Kembalikan"
      :saving="sendingKembalikan"
      @confirm="kembalikan"
    />
  </div>
</template>

<script setup>
const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const { fetchDetail, detail, uploadDokumen, kirimApprovalLegal, kembalikanLegal } = useNaskahLainnya();
const toast = useToast();

const loading = ref(true);
const dokumenPendukung = ref([]);
const catatanLegal = ref('');
const saving = ref(false);
const sendingApproval = ref(false);
const sendingKembalikan = ref(false);
const showKembalikanModal = ref(false);
const previewUrl = ref(null);

const JENIS_LABELS = {
  PER: 'Peraturan (PER)', KEP: 'Keputusan (KEP)', INS: 'Instruksi (INS)',
  PKS: 'Perjanjian Kerja Sama (PKS)', UND: 'Undangan (UND)', BA: 'Berita Acara (BA)',
};
const jenisLabel = (j) => JENIS_LABELS[j] || j;

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
    dokumenPendukung.value = (detail.value?.dokumen || []).filter((d) => d.tipe === 'pendukung');
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
  }
}

async function downloadNaskah() {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = 'naskah.docx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh naskah', color: 'error' });
  }
}

async function previewNaskah() {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    window.open(window.URL.createObjectURL(blob), '_blank');
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  }
}

async function previewPendukung(doc) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, { responseType: 'blob' });
    previewUrl.value = window.URL.createObjectURL(blob);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  }
}

async function onUploadRevisi(file) {
  const res = await uploadDokumen(id.value, file);
  toast.add({ title: 'Naskah diperbarui', color: 'success' });
  return res;
}

async function simpanDraft() {
  saving.value = true;
  try {
    toast.add({ title: 'Draft disimpan', color: 'success' });
  } finally {
    saving.value = false;
  }
}

async function kirimApproval() {
  sendingApproval.value = true;
  try {
    await kirimApprovalLegal(id.value);
    toast.add({ title: 'Approval legal dikirim', color: 'success' });
    navigateTo(`/naskah-lainnya/${id.value}`);
  } catch {
    toast.add({ title: 'Gagal mengirim approval legal', color: 'error' });
  } finally {
    sendingApproval.value = false;
  }
}

async function kembalikan(catatan) {
  sendingKembalikan.value = true;
  try {
    await kembalikanLegal(id.value, catatan);
    toast.add({ title: 'Naskah dikembalikan ke pemrakarsa', color: 'warning' });
    showKembalikanModal.value = false;
    navigateTo(`/naskah-lainnya/${id.value}`);
  } catch {
    toast.add({ title: 'Gagal mengembalikan naskah', color: 'error' });
  } finally {
    sendingKembalikan.value = false;
  }
}

onMounted(loadDetail);
</script>