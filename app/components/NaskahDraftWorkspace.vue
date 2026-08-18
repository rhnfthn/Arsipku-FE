<template>
  <div class="space-y-6">
    <!-- 1. Dokumen Awal -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">1 · Dokumen Awal</h3>
      </div>
      <div class="p-5 space-y-3">
        <div v-if="detail?.fileUrl" class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <span class="text-2xl">📄</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">Naskah.docx</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">DOCX · Naskah dari step sebelumnya</p>
          </div>
          <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="$emit('preview')">Preview</UButton>
          <UButton size="xs" variant="outline" icon="i-lucide-download" @click="$emit('download')">Unduh</UButton>
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
          <UButton size="xs" variant="ghost" icon="i-lucide-eye" @click="$emit('preview-pendukung', doc)">Preview</UButton>
        </div>
      </div>
    </div>

    <!-- 2. Area Kerja — Upload Revisi -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">2 · Area Kerja — {{ areaTitle }}</h3>
      </div>
      <div class="p-5 space-y-4">
        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          :description="areaDescription"
        />

        <!-- Download draf -->
        <div class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <span class="text-2xl">📄</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">Draf Naskah Saat Ini</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">DOCX · versi terbaru dari step sebelumnya</p>
          </div>
          <UButton size="sm" variant="outline" icon="i-lucide-download" @click="$emit('download')">Download Draf</UButton>
        </div>

        <!-- Upload zone -->
        <div v-if="!revisiFile && !parsing" class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
          <div class="text-3xl">⬆️</div>
          <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Unggah hasil revisi (Word)</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">.docx — hasil revisi di luar aplikasi</p>
          <UButton class="mt-4" color="primary" icon="i-lucide-upload" @click="triggerUpload">Pilih File & Unggah</UButton>
          <input ref="fileInput" type="file" accept=".docx" class="hidden" @change="onFileSelected" />
        </div>

        <!-- Parsing state -->
        <div v-if="parsing" class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
          <UIcon name="i-lucide-loader-2" class="mx-auto h-7 w-7 animate-spin text-primary-500" />
          <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Sistem membaca naskah…</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Mengekstrak isi dan parameter dari dokumen</p>
        </div>

        <!-- Parse result -->
        <div v-if="revisiFile && !parsing" class="space-y-4">
          <div class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/40">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <div class="flex-1">
              <p class="text-sm font-medium text-green-800 dark:text-green-300">{{ revisiFile.name }}</p>
              <p class="text-xs text-green-600 dark:text-green-400">Revisi berhasil diunggah — naskah diperbarui</p>
            </div>
            <UButton size="xs" variant="ghost" color="error" icon="i-lucide-x" @click="revisiFile = null; parseResult = null">Hapus</UButton>
          </div>

          <!-- Parameter Terdeteksi -->
          <div v-if="parseResult" class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Parameter Terdeteksi</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-3 py-1.5">
                <span class="text-lg">🏷️</span>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">NOMOR</p>
                  <p class="text-xs text-gray-500">Nomor naskah</p>
                </div>
                <UBadge color="success" size="sm">terbaca</UBadge>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ parseResult.nomor || '—' }}</span>
              </div>
              <div class="flex items-center gap-3 py-1.5">
                <span class="text-lg">🏷️</span>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">PERIHAL</p>
                  <p class="text-xs text-gray-500">Perihal naskah</p>
                </div>
                <UBadge color="success" size="sm">terbaca</UBadge>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ parseResult.perihal || '—' }}</span>
              </div>
              <div class="flex items-center gap-3 py-1.5">
                <span class="text-lg">🏷️</span>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">TANGGAL</p>
                  <p class="text-xs text-gray-500">Tanggal surat</p>
                </div>
                <UBadge color="success" size="sm">terbaca</UBadge>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ parseResult.tanggal || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Catatan -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">3 · {{ catatanTitle }}</h3>
      </div>
      <div class="p-5">
        <textarea
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          rows="4"
          :placeholder="catatanPlaceholder"
          class="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>

    <!-- 4. Aksi -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">4 · Aksi</h3>
      </div>
      <div class="flex flex-col gap-3 p-5 sm:flex-row">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  detail: { type: Object, default: null },
  dokumenPendukung: { type: Array, default: () => [] },
  areaTitle: { type: String, default: 'Revisi Naskah' },
  areaDescription: { type: String, default: 'Revisi naskah di luar aplikasi: download draf, lengkapi di Microsoft Word, lalu upload kembali. Sistem membaca isi dan parameter di dalamnya.' },
  catatanTitle: { type: String, default: 'Catatan' },
  catatanPlaceholder: { type: String, default: 'Tuliskan catatan…' },
  modelValue: { type: String, default: '' },
});

const emit = defineEmits(['preview', 'download', 'preview-pendukung', 'upload-revisi', 'update:modelValue']);

const fileInput = ref(null);
const revisiFile = ref(null);
const parseResult = ref(null);
const parsing = ref(false);

function triggerUpload() {
  fileInput.value?.click();
}

async function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.docx')) {
    useToast().add({ title: 'Hanya file .docx yang diperbolehkan', color: 'error' });
    return;
  }
  revisiFile.value = file;
  parsing.value = true;
  try {
    const res = await emit('upload-revisi', file);
    parseResult.value = res?.parameter || { nomor: '—', perihal: '—', tanggal: '—' };
  } catch {
    useToast().add({ title: 'Gagal mengunggah revisi', color: 'error' });
    revisiFile.value = null;
  } finally {
    parsing.value = false;
  }
}
</script>