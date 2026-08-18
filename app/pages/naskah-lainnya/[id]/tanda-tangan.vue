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
          <span class="text-gray-700 dark:text-gray-300">{{ tahapanLabel }}</span>
        </div>
        <h1 class="mt-2 text-xl font-bold text-gray-900 dark:text-white">{{ detail?.nomor || 'Memuat…' }}</h1>
        <div class="mt-1.5 flex gap-2">
          <UBadge color="primary" size="sm">{{ tahapanLabel }}</UBadge>
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
      <!-- Info penandatangan -->
      <div class="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-3 p-4">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
            <UIcon name="i-lucide-pen-tool" class="h-5 w-5" />
          </span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ penandatanganNama }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ penandatanganJabatan }}</p>
          </div>
          <UBadge color="primary" size="sm" icon="i-lucide-pen-tool">Tanda Tangan</UBadge>
        </div>
      </div>

      <!-- Workspace -->
      <NaskahDraftWorkspace
        :detail="detail"
        :dokumen-pendukung="dokumenPendukung"
        :area-title="areaTitle"
        :area-description="areaDescription"
        :catatan-title="catatanTitle"
        :catatan-placeholder="catatanPlaceholder"
        v-model="catatan"
        @preview="previewNaskah"
        @download="downloadNaskah"
        @preview-pendukung="previewPendukung"
        @upload-revisi="onUploadRevisi"
      >
        <template #actions>
          <UButton
            color="primary"
            icon="i-lucide-pen-tool"
            size="lg"
            class="font-semibold"
            :loading="busy"
            @click="tandaTanganClick"
          >
            {{ actionLabel }}
          </UButton>
          <UButton
            v-if="canKembalikan"
            color="error"
            variant="outline"
            icon="i-lucide-undo-2"
            size="lg"
            @click="showKembalikanModal = true"
          >
            Kembalikan
          </UButton>
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
      title="Kembalikan Naskah"
      description="Naskah akan dikembalikan ke step sebelumnya."
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
const { detail, fetchDetail, uploadDokumen, tandaTangan } = useNaskahLainnya();
const toast = useToast();

const loading = ref(true);
const busy = ref(false);
const catatan = ref('');
const previewUrl = ref(null);
const showKembalikanModal = ref(false);
const sendingKembalikan = ref(false);

const JENIS_LABELS = {
  PER: 'Peraturan (PER)', KEP: 'Keputusan (KEP)', INS: 'Instruksi (INS)',
  PKS: 'Perjanjian Kerja Sama (PKS)', UND: 'Undangan (UND)', BA: 'Berita Acara (BA)',
};
const jenisLabel = (j) => JENIS_LABELS[j] || j;

const tahapan = computed(() => detail.value?.tahapan ?? '');

const tahapanLabel = computed(() => {
  const t = tahapan.value;
  if (t === 'tanda_tangan_pemrakarsa') return 'Tanda Tangan Pemrakarsa';
  if (t === 'tanda_tangan_legal') return 'Tanda Tangan Legal';
  if (t === 'tanda_tangan_pejabat') return 'Tanda Tangan Pejabat';
  return 'Tanda Tangan';
});

const areaTitle = computed(() => {
  const t = tahapan.value;
  if (t === 'tanda_tangan_pemrakarsa') return 'Tinjauan Pemrakarsa';
  if (t === 'tanda_tangan_legal') return 'Tinjauan Legal';
  return 'Tinjauan Pejabat';
});

const areaDescription = 'Download draf naskah, lakukan revisi jika diperlukan di Microsoft Word, lalu upload kembali. Naskah akan diperbarui untuk step berikutnya.';

const catatanTitle = computed(() => {
  const t = tahapan.value;
  if (t === 'tanda_tangan_pemrakarsa') return 'Catatan Pemrakarsa';
  if (t === 'tanda_tangan_legal') return 'Catatan Legal';
  return 'Catatan Pejabat';
});

const catatanPlaceholder = 'Tuliskan catatan hasil tinjauan…';

const actionLabel = computed(() => {
  const t = tahapan.value;
  if (t === 'tanda_tangan_pemrakarsa') return 'Tanda Tangani (Pemrakarsa)';
  if (t === 'tanda_tangan_legal') return 'Tanda Tangani (Legal)';
  return 'Tanda Tangani Naskah';
});

const canKembalikan = computed(() => tahapan.value === 'tanda_tangan_legal' || tahapan.value === 'tanda_tangan_pemrakarsa');

const penandatanganList = computed(() => detail.value?.penandatanganList ?? []);
const penandatanganNama = computed(() => {
  const list = penandatanganList.value;
  if (list.length > 0) return list.map((p) => p.nama).join(', ');
  return detail.value?.penandatangan?.nama ?? '—';
});
const penandatanganJabatan = computed(() => {
  const list = penandatanganList.value;
  if (list.length > 0) return list.map((p) => p.jabatan).join(', ');
  return detail.value?.penandatangan?.jabatan ?? '';
});

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
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
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

async function tandaTanganClick() {
  busy.value = true;
  try {
    await tandaTangan(id.value);
    toast.add({ title: 'Naskah ditandatangani', color: 'success' });
    const t = detail.value?.tahapan;
    if (t === 'tanda_tangan_pejabat') {
      navigateTo(`/naskah-lainnya/${id.value}/selesai`);
    } else {
      navigateTo(`/naskah-lainnya/${id.value}`);
    }
  } catch {
    toast.add({ title: 'Gagal menandatangani naskah', color: 'error' });
  } finally {
    busy.value = false;
  }
}

async function kembalikan(catatanText) {
  sendingKembalikan.value = true;
  try {
    // TODO: BE endpoint untuk kembalikan dari tanda tangan
    toast.add({ title: 'Naskah dikembalikan', color: 'warning' });
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