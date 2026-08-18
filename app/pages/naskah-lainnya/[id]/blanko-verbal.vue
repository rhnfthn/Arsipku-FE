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
          <span class="text-gray-700 dark:text-gray-300">Blanko Verbal</span>
        </div>
        <h1 class="mt-2 text-xl font-bold text-gray-900 dark:text-white">{{ detail?.nomor || 'Memuat…' }}</h1>
        <div class="mt-1.5 flex gap-2">
          <UBadge color="primary" size="sm">Blanko Verbal</UBadge>
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

    <div v-else class="space-y-6">
      <!-- 1. Dokumen Awal -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">1 · Dokumen Awal</h3>
        </div>
        <div class="p-5 space-y-3">
          <div v-if="detail.fileUrl" class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <span class="text-2xl">📄</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">Naskah.docx</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">DOCX · Naskah dari step sebelumnya</p>
            </div>
            <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="previewNaskah">Preview</UButton>
            <UButton size="xs" variant="outline" icon="i-lucide-download" @click="downloadNaskah">Unduh</UButton>
          </div>
          <div
            v-for="doc in dokumenPendukung"
            :key="doc.id"
            class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <span class="text-2xl">📎</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ doc.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">PDF · Dokumen Pendukung</p>
            </div>
            <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="previewPendukung(doc)">Preview</UButton>
          </div>
        </div>
      </div>

      <!-- 2. Unggah Naskah (Revisi) -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">2 · Unggah Naskah</h3>
        </div>
        <div class="p-5 space-y-4">
          <UAlert
            icon="i-lucide-info"
            color="primary"
            variant="soft"
            description="Download draf naskah, lakukan revisi jika diperlukan di Microsoft Word, lalu upload kembali. Naskah akan diperbarui."
          />
          <div class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <span class="text-2xl">📄</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">Draf Naskah Saat Ini</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">DOCX · versi terbaru</p>
            </div>
            <UButton size="sm" variant="outline" icon="i-lucide-download" @click="downloadNaskah">Download</UButton>
          </div>

          <!-- Upload zone -->
          <div v-if="!revisiFile && !parsing" class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <div class="text-3xl">⬆️</div>
            <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Unggah hasil revisi naskah (Word)</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">.docx — hasil revisi di luar aplikasi</p>
            <UButton class="mt-4" color="primary" icon="i-lucide-upload" @click="triggerUpload('naskah')">Pilih File & Unggah</UButton>
          </div>

          <!-- Parsing state -->
          <div v-if="parsing" class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <UIcon name="i-lucide-loader-2" class="mx-auto h-7 w-7 animate-spin text-primary-500" />
            <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Sistem membaca naskah…</p>
          </div>

          <!-- Upload result -->
          <div v-if="revisiFile && !parsing" class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/40">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800 dark:text-green-300">{{ revisiFile.name }}</p>
              <p class="text-xs text-green-600 dark:text-green-400">Naskah diperbarui</p>
            </div>
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-x" @click="revisiFile = null">Hapus</UButton>
          </div>
        </div>
      </div>

      <!-- 3. Unggah Blanko Verbal -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">3 · Unggah Blanko Verbal</h3>
        </div>
        <div class="p-5 space-y-4">
          <!-- Upload zone -->
          <div v-if="!blankoFile" class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <div class="text-3xl">📋</div>
            <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Unggah Blanko Verbal</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">.docx atau .pdf</p>
            <UButton class="mt-4" color="primary" icon="i-lucide-upload" @click="triggerUpload('blanko')">Pilih File & Unggah</UButton>
          </div>

          <!-- Upload result -->
          <div v-if="blankoFile" class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/40">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800 dark:text-green-300">{{ blankoFile.name }}</p>
              <p class="text-xs text-green-600 dark:text-green-400">Blanko verbal terunggah</p>
            </div>
            <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="previewBlanko">Preview</UButton>
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-x" @click="blankoFile = null">Hapus</UButton>
          </div>
        </div>
      </div>

      <!-- 4. Catatan -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">4 · Catatan</h3>
        </div>
        <div class="p-5">
          <textarea
            v-model="catatan"
            rows="4"
            placeholder="Tuliskan catatan untuk blanko verbal…"
            class="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <!-- 5. Aksi -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">5 · Aksi</h3>
        </div>
        <div class="flex flex-col gap-3 p-5 sm:flex-row">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-save"
            size="lg"
            :loading="busy"
            @click="simpan"
          >Simpan Draft</UButton>
          <UButton
            color="primary"
            icon="i-lucide-send"
            size="lg"
            :loading="busy"
            @click="kirimApproval"
          >Kirim Approval Blanko</UButton>
        </div>
      </div>
    </div>

    <!-- Hidden file inputs -->
    <input ref="naskahInput" type="file" accept=".docx" class="hidden" @change="onNaskahSelected" />
    <input ref="blankoInput" type="file" accept=".docx,.pdf" class="hidden" @change="onBlankoSelected" />

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
  </div>
</template>

<script setup>
const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const { detail, fetchDetail, uploadDokumen, uploadDokumenTambahan, kirimApprovalBlanko } = useNaskahLainnya();
const toast = useToast();

const loading = ref(true);
const busy = ref(false);
const catatan = ref('');
const previewUrl = ref(null);
const revisiFile = ref(null);
const blankoFile = ref(null);
const parsing = ref(false);
const naskahInput = ref(null);
const blankoInput = ref(null);

const JENIS_LABELS = {
  PER: 'Peraturan (PER)', KEP: 'Keputusan (KEP)', INS: 'Instruksi (INS)',
  PKS: 'Perjanjian Kerja Sama (PKS)', UND: 'Undangan (UND)', BA: 'Berita Acara (BA)',
};
const jenisLabel = (j) => JENIS_LABELS[j] || j;

const dokumenPendukung = computed(() => (detail.value?.dokumen ?? []).filter((d) => d.tipe === 'pendukung'));

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
  }
}

function triggerUpload(type) {
  if (type === 'naskah') naskahInput.value?.click();
  else blankoInput.value?.click();
}

async function onNaskahSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.docx')) {
    toast.add({ title: 'Hanya file .docx yang diperbolehkan', color: 'error' });
    return;
  }
  parsing.value = true;
  try {
    await uploadDokumen(id.value, file);
    revisiFile.value = file;
    toast.add({ title: 'Naskah diperbarui', color: 'success' });
  } catch {
    toast.add({ title: 'Gagal mengunggah naskah', color: 'error' });
  } finally {
    parsing.value = false;
  }
}

async function onBlankoSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await uploadDokumenTambahan(id.value, 'blanko_verbal', file);
    blankoFile.value = file;
    toast.add({ title: 'Blanko verbal terunggah', color: 'success' });
  } catch {
    toast.add({ title: 'Gagal mengunggah blanko verbal', color: 'error' });
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

function previewBlanko() {
  if (blankoFile.value) {
    const url = window.URL.createObjectURL(blankoFile.value);
    previewUrl.value = url;
  }
}

async function simpan() {
  busy.value = true;
  try {
    toast.add({ title: 'Draft disimpan', color: 'success' });
  } finally {
    busy.value = false;
  }
}

async function kirimApproval() {
  busy.value = true;
  try {
    await kirimApprovalBlanko(id.value);
    toast.add({ title: 'Approval blanko dikirim', color: 'success' });
    navigateTo(`/naskah-lainnya/${id.value}/tanda-tangan`);
  } catch {
    toast.add({ title: 'Gagal mengirim approval', color: 'error' });
  } finally {
    busy.value = false;
  }
}

onMounted(loadDetail);
</script>