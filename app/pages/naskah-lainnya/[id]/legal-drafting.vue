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
            :disabled="hasWaitingLegalRows || legalApprovers.length === 0"
            @click="kirimApproval"
          >Kirim Approval Legal</UButton>
          <UButton
            color="error"
            variant="outline"
            icon="i-lucide-undo-2"
            size="lg"
            :disabled="hasWaitingLegalRows"
            @click="showKembalikanModal = true"
          >Kembalikan ke Pemrakarsa</UButton>
        </template>
      </NaskahDraftWorkspace>

      <!-- Pemberi Persetujuan Legal (recipients khusus unit legal) -->
      <div
        class="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5"
      >
        <div class="flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-users" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Pemberi Persetujuan Legal</h3>
          <span class="text-xs text-gray-400">(berjenjang — dari unit legal)</span>
        </div>

        <!-- Status menunggu approver (read-only) -->
        <div v-if="hasWaitingLegalRows" class="space-y-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Naskah sudah dikirim ke pemberi persetujuan legal. Menunggu persetujuan berjenjang.
          </p>
          <div
            v-for="(r, idx) in legalApprovalRows"
            :key="r.id"
            class="flex items-center gap-2 rounded-lg border px-3 py-2"
            :class="r.status === 'waiting'
              ? 'border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
              : r.status === 'verified'
                ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'"
          >
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
              {{ idx + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ r.nama }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ r.jabatan }}</p>
            </div>
            <UBadge
              size="xs"
              :color="r.status === 'waiting' ? 'primary' : r.status === 'verified' ? 'success' : 'error'"
            >
              {{ r.status === 'waiting' ? 'Menunggu' : r.status === 'verified' ? 'Disetujui' : 'Ditolak' }}
            </UBadge>
          </div>
        </div>

        <!-- Form pilih approver (editable saat tidak ada baris waiting) -->
        <div v-else>
          <!-- Chips terpilih (urutan = urutan pemilihan) -->
          <div v-if="legalApprovers.length" class="mb-2 flex flex-col gap-1.5">
            <div
              v-for="(v, idx) in legalApprovers"
              :key="v.positionId"
              class="flex items-center gap-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-2"
            >
              <span class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
                {{ idx + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ v.nama }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ v.jabatan }}</p>
              </div>
              <button type="button" class="text-gray-400 hover:text-red-500 shrink-0" @click="removeApprover(v.positionId)" aria-label="Hapus approver">
                <UIcon name="i-lucide-x" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Dropdown pilih approver -->
          <div v-if="recipientCandidates.length === 0" class="py-1 text-sm text-gray-400">
            Tidak ada anggota unit legal aktif lain.
          </div>
          <div v-else class="relative" ref="recipientDropdownRef">
            <button
              type="button"
              @click="showRecipientDropdown = !showRecipientDropdown"
              aria-label="Pilih pemberi persetujuan legal"
              class="w-full flex items-center justify-end rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              :class="showRecipientDropdown ? 'border-primary' : 'border-gray-200 dark:border-gray-700'"
            >
              <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': showRecipientDropdown }" />
            </button>
            <div
              v-if="showRecipientDropdown"
              class="absolute z-60 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
            >
              <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                <div class="relative">
                  <UIcon name="i-lucide-search" class="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    ref="recipientSearchRef"
                    v-model="recipientSearchQuery"
                    type="text"
                    placeholder="Cari nama atau jabatan..."
                    class="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div class="max-h-[220px] overflow-y-auto">
                <button
                  v-for="v in filteredRecipients"
                  :key="v.positionId"
                  type="button"
                  @click="onApproverSelect(v.positionId)"
                  class="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <span class="font-medium">{{ v.nama }}</span>
                  <span class="text-xs text-gray-400">{{ v.jabatan || v.unitName || '' }}</span>
                </button>
                <div v-if="filteredRecipients.length === 0" class="px-3 py-4 text-center text-sm text-gray-400">
                  Tidak ada anggota ditemukan
                </div>
              </div>
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-400">Pilih pemberi persetujuan dari unit legal. Urutan pilihan = urutan persetujuan.</p>
        </div>
      </div>
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
const { fetchDetail, detail, uploadDokumen, kirimApprovalLegal, kembalikanLegal, fetchLegalRecipients, legalRecipients } = useNaskahLainnya();
const { user } = useAuth();
const toast = useToast();

const loading = ref(true);
const dokumenPendukung = ref([]);
const catatanLegal = ref('');
const saving = ref(false);
const sendingApproval = ref(false);
const sendingKembalikan = ref(false);
const showKembalikanModal = ref(false);
const previewUrl = ref(null);

// ── Pemberi Persetujuan Legal (recipients dari unit legal saja) ──
const legalApprovers = ref([]);
const showRecipientDropdown = ref(false);
const recipientSearchQuery = ref('');
const recipientDropdownRef = ref(null);
const recipientSearchRef = ref(null);

const legalApprovalRows = computed(() =>
  (detail.value?.approval ?? []).filter((a) => a.tahap === 'legal_drafting'),
);
const hasWaitingLegalRows = computed(() =>
  legalApprovalRows.value.some((r) => r.status === 'waiting'),
);

// Kandidat: aktif, bukan user sendiri, belum dipilih.
const recipientCandidates = computed(() => {
  const selectedSet = new Set(legalApprovers.value.map((v) => v.positionId));
  const myPosId = String(user.value?.position ?? user.value?.positionId ?? '');
  const myPersnum = user.value?.persnum;
  return legalRecipients.value.filter((v) =>
    v.isActive
    && !selectedSet.has(v.positionId)
    && v.positionId !== myPosId
    && !(myPersnum != null && v.persnum === myPersnum),
  );
});
const filteredRecipients = computed(() => {
  const q = recipientSearchQuery.value.toLowerCase().trim();
  if (!q) return recipientCandidates.value;
  return recipientCandidates.value.filter((v) =>
    (v.nama || '').toLowerCase().includes(q) || (v.jabatan || '').toLowerCase().includes(q),
  );
});

function onApproverSelect(positionId) {
  const v = legalRecipients.value.find((x) => x.positionId === positionId);
  if (!v) return;
  if (!legalApprovers.value.some((x) => x.positionId === positionId)) {
    legalApprovers.value.push(v);
  }
  showRecipientDropdown.value = false;
  recipientSearchQuery.value = '';
}
function removeApprover(positionId) {
  legalApprovers.value = legalApprovers.value.filter((v) => v.positionId !== positionId);
}
watch(showRecipientDropdown, (val) => {
  if (val) nextTick(() => recipientSearchRef.value?.focus());
  else recipientSearchQuery.value = '';
});
function handleClickOutsideRecipient(e) {
  if (recipientDropdownRef.value && !recipientDropdownRef.value.contains(e.target)) {
    showRecipientDropdown.value = false;
  }
}

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
  if (hasWaitingLegalRows.value) return;
  if (legalApprovers.value.length === 0) {
    toast.add({ title: 'Pilih pemberi persetujuan legal', color: 'warning' });
    return;
  }
  sendingApproval.value = true;
  try {
    const approvers = legalApprovers.value.map((v) => ({
      positionId: v.positionId, nama: v.nama, jabatan: v.jabatan, persnum: v.persnum ?? undefined,
    }));
    await kirimApprovalLegal(id.value, approvers);
    toast.add({ title: 'Approval legal dikirim', color: 'success' });
    await loadDetail(); // tetap di halaman → tampilkan status menunggu approver
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    toast.add({ title: 'Gagal mengirim approval legal', description: errMsg || '', color: 'error' });
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

onMounted(() => {
  loadDetail();
  fetchLegalRecipients().catch(() => { /* abaikan — dropdown approver kosong */ });
  document.addEventListener('click', handleClickOutsideRecipient);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideRecipient);
});
</script>