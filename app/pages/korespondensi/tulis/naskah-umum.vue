<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";
import TulisKopSurat from "@/components/Tulis/KopSuratAsync.vue";
import {
  getJenisTemplate,
  getTemplateDownloadUrl,
} from "~/utils/naskah-templates";

definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const toast = useToast();

const { user, getProfile, hasPermission } = useAuth();
const { getJenisList } = useJenis();

// ── Shared composable ────────────────────────────────────────────────────────
const {
  isLoadingData, loadingMessage,
  subject,
  date, selectedSifat, existingFiles,
  selectedTertuju, selectedTembusan,
  maxPerihal, sifatOptions,
  formattedDate, tglDb, tglDisplay,
  toastError, toastSuccess,
} = useTulis();

// ── Naskah Umum state ─────────────────────────────────────────────────────────
const selectedJenisId = ref<string>("");
const jenisList = ref<any[]>([]);

// Dropdown open state (controlled)
const isJenisMenuOpen = ref(false);

// Close dropdown when item is selected
watch(selectedJenisId, () => {
  isJenisMenuOpen.value = false;
});

// ── Naskah final file upload (hasil edit dari Google Docs / Word) ────────────
const naskahFinalFile = ref<File | null>(null);
const naskahFinalFileName = ref<string>("");
const isDraggingNaskah = ref(false);

// Get jenis code from route query or selected dropdown
const currentJenis = computed(() => {
  if (route.query.jenis) return route.query.jenis as string;
  const found = jenisList.value.find((j: any) => j.id === selectedJenisId.value);
  return found?.jenis || "";
});

const breadcrumbs = computed(() => [
  { label: "Beranda", to: "/beranda" },
  { label: `Tulis ${currentJenisLabel.value}`, to: "#" },
]);

const currentJenisLabel = computed(() => {
  if (!currentJenis.value) return "Naskah Dinas";
  const found = jenisList.value.find((j: any) => j.jenis === currentJenis.value);
  return found?.jenis_text || currentJenis.value;
});

// ── Template info for selected jenis ──────────────────────────────────────────
const templateInfo = computed(() => {
  if (!currentJenis.value) return null;
  return getJenisTemplate(currentJenis.value);
});

const templateDownloadUrl = computed(() => {
  if (!currentJenis.value) return "";
  return getTemplateDownloadUrl(currentJenis.value);
});

// ── Kategori grouping untuk dropdown ──────────────────────────────────────────
const KATEGORI_LABELS: Record<string, string> = {
  pengaturan: 'Pengaturan dan Penetapan',
  korespondensi_internal: 'Korespondensi Internal',
  korespondensi_eksternal: 'Korespondensi Eksternal',
  khusus: 'Naskah Khusus',
};

// Daftar jenis yang sudah punya dedicated page (tidak perlu muncul di sini)
const DEDICATED_JENIS = ['ND', 'SDI', 'SDE', 'DI', 'KA'];

// Kategori mapping untuk jenis-jenis URS poin 6
const JENIS_KATEGORI: Record<string, string> = {
  // Pengaturan dan Penetapan
  PER: 'pengaturan', KEP: 'pengaturan', INS: 'pengaturan',
  SPR: 'pengaturan', SOP: 'pengaturan', SE: 'pengaturan',
  // Khusus - Surat Perjanjian
  NK: 'khusus', PKS: 'khusus', LOA: 'khusus', LOCA: 'khusus',
  KTR: 'khusus', PLN: 'khusus', ADN: 'khusus', SPK: 'khusus',
  ASP: 'khusus', SK: 'khusus',
  // Khusus - Lainnya
  BA: 'khusus', UND: 'khusus', KET: 'khusus', PGN: 'khusus',
  RIS: 'khusus', PUM: 'khusus', SRT: 'khusus', PGA: 'khusus',
  LAP: 'khusus', BVB: 'khusus',
};

// Urutan kategori untuk dropdown (pengaturan di atas, khusus di bawah)
const KATEGORI_ORDER = ['pengaturan', 'khusus'];

// Selected object untuk display di USelectMenu
const selectedJenisObj = computed(() => {
  return jenisList.value.find((j: any) => j.id === selectedJenisId.value) || null;
});

// Flat list untuk USelectMenu dengan grouping via isParent flag
const jenisSelectItems = computed(() => {
  const groups: Record<string, any[]> = {};
  for (const j of jenisList.value) {
    if (DEDICATED_JENIS.includes(j.jenis)) continue;
    const kategori = JENIS_KATEGORI[j.jenis] || 'khusus';
    if (!groups[kategori]) groups[kategori] = [];
    groups[kategori].push(j);
  }

  const result: any[] = [];
  for (const kategori of KATEGORI_ORDER) {
    if (!groups[kategori]) continue;
    result.push({
      id: `cat-${kategori}`,
      jenis: '',
      jenis_text: KATEGORI_LABELS[kategori] || kategori,
      searchLabel: KATEGORI_LABELS[kategori] || kategori,
      isParent: true,
      disabled: true,
    });
    for (const j of groups[kategori]) {
      result.push({
        ...j,
        searchLabel: `${j.jenis} - ${j.jenis_text}`,
        isParent: false,
        disabled: false,
      });
    }
  }
  return result;
});

// ── Naskah final file handlers ────────────────────────────────────────────────
const handleNaskahFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file.size > 50 * 1024 * 1024) {
      toastError("File Terlalu Besar", "Ukuran file maksimal 50MB");
      return;
    }
    naskahFinalFile.value = file;
    naskahFinalFileName.value = file.name;
  }
};

const handleNaskahFileDrop = (event: DragEvent) => {
  isDraggingNaskah.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file.size > 50 * 1024 * 1024) {
      toastError("File Terlalu Besar", "Ukuran file maksimal 50MB");
      return;
    }
    naskahFinalFile.value = file;
    naskahFinalFileName.value = file.name;
  }
};

const handleRemoveNaskahFile = () => {
  naskahFinalFile.value = null;
  naskahFinalFileName.value = "";
};

// ── Template handlers ─────────────────────────────────────────────────────────
const handleOpenGdocs = () => {
  if (!templateInfo.value?.gdocsUrl) {
    toast.add({
      title: "Belum Tersedia",
      description: "URL Google Docs untuk jenis naskah ini belum dikonfigurasi.",
      color: "amber",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }
  window.open(templateInfo.value.gdocsUrl, "_blank");
};

const handleDownloadTemplate = () => {
  if (!templateDownloadUrl.value) return;
  const link = document.createElement("a");
  link.href = templateDownloadUrl.value;
  link.download = templateInfo.value?.templateFile || "template.docx";
  link.click();
};

// ── Validation ────────────────────────────────────────────────────────────────
const validatePayload = (): boolean => {
  if (!currentJenis.value) {
    toastError("Validasi Gagal", "Jenis naskah harus dipilih");
    return false;
  }
  if (!subject.value.trim()) {
    toastError("Validasi Gagal", "Perihal harus diisi");
    return false;
  }
  if (!naskahFinalFile.value) {
    toastError("Validasi Gagal", "Naskah final harus diupload");
    return false;
  }
  return true;
};

// ── Handlers (UI Mockup - belum terintegrasi backend) ─────────────────────────
const handlePreview = () => {
  if (!validatePayload()) return;
  toast.add({
    title: "Coming Soon",
    description: "Fitur pratinjau PDF untuk jenis naskah ini sedang dalam pengembangan.",
    color: "blue",
    icon: "i-lucide-info",
  });
};

const handleSaveDraft = () => {
  if (!validatePayload()) return;
  toast.add({
    title: "Coming Soon",
    description: "Simpan draft untuk jenis naskah ini sedang dalam pengembangan.",
    color: "blue",
    icon: "i-lucide-info",
  });
};

const handleKirim = () => {
  if (!validatePayload()) return;
  toast.add({
    title: "Coming Soon",
    description: `Pengiriman ${currentJenisLabel.value} sedang dalam pengembangan.`,
    color: "blue",
    icon: "i-lucide-info",
  });
};

// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    const jenisRes = await getJenisList();
    jenisList.value = jenisRes.data || [];

    if (route.query.jenis) {
      const found = jenisList.value.find((j: any) => j.jenis === route.query.jenis);
      if (found) selectedJenisId.value = found.id;
    }
  } catch {
    // ignore
  }

  isLoadingData.value = false;
});
</script>

<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />
    <PageHeader :title="`Tulis ${currentJenisLabel}`" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton loading -->
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto space-y-1">
        <!-- Jenis Naskah Selector (USelectMenu - match InputKlasifikasi style) -->
        <div v-if="!route.query.jenis"
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Jenis Naskah
          </span>

          <div class="flex flex-wrap gap-1 w-full items-center min-w-0">
            <USelectMenu v-model="selectedJenisId" v-model:open="isJenisMenuOpen" :items="jenisSelectItems" value-key="id" label-key="searchLabel"
              variant="none" class="w-full" searchable
              :content="({ class: 'max-h-[380px]' } as any)"
              :search-attributes="['searchLabel']" placeholder="Pilih Jenis Naskah"
              :search-input="{ placeholder: 'Cari jenis naskah...' }" :ui="{
                base: '!px-0 !bg-transparent w-full dark:text-white',
                ring: 'ring-0',
                shadow: 'shadow-none',
                width: 'w-full sm:w-auto max-w-[calc(100vw-2rem)]'
              } as any">

              <template #item="{ item }">
                <div v-if="item.isParent" class="w-full py-1 overflow-hidden">
                  <span
                    class="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest block w-full truncate">
                    {{ item.jenis_text }}
                  </span>
                </div>

                <div v-else class="flex flex-col min-w-0 w-full overflow-hidden">
                  <span class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate">
                    {{ item.jenis }} - {{ item.jenis_text }}
                  </span>
                </div>
              </template>

              <template #default>
                <span v-if="selectedJenisObj" class="truncate text-sm block w-full text-left dark:text-white">
                  {{ selectedJenisObj.jenis }} - {{ selectedJenisObj.jenis_text }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
                  Pilih Jenis Naskah
                </span>
              </template>

            </USelectMenu>
          </div>
        </div>

        <!-- Jenis display (from query) -->
        <div v-else
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Jenis Naskah</span>
            <div class="flex items-center flex-1 w-full">
              <span class="text-sm text-gray-900 dark:text-white py-1">{{ currentJenisLabel }}</span>
            </div>
          </div>
        </div>

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="[]"
          :groups="[]" :exclude-items="[]" disabled-message="Sudah dipilih" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="[]"
          :groups="[]" :exclude-items="[]" disabled-message="Sudah dipilih" />

        <TulisInputSifat v-model="selectedSifat" />

        <!-- Perihal -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Perihal" />
              <span class="text-[10px] font-mono shrink-0 transition-colors"
                :class="subject.length >= maxPerihal ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ subject.length }}/{{ maxPerihal }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Template Section ─────────────────────────────────────────────── -->
        <div v-if="currentJenis" class="flex flex-col py-4 gap-4">
          <!-- Template Header -->
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Template Naskah</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ templateInfo?.templateFile || 'Template belum tersedia' }}
              </span>
            </div>

            <!-- Action buttons for template -->
            <div class="flex gap-2">
              <!-- Download Template -->
              <UButton v-if="templateDownloadUrl" color="gray" variant="soft" size="sm"
                @click="handleDownloadTemplate">
                <Icon name="i-lucide-download" class="w-4 h-4 mr-1.5" />
                Download
              </UButton>

              <!-- Open in Google Docs -->
              <UButton color="primary" variant="soft" size="sm" @click="handleOpenGdocs">
                <Icon name="i-lucide-file-text" class="w-4 h-4 mr-1.5" />
                Buka di Google Docs
              </UButton>
            </div>
          </div>

          <!-- Template Preview (static, no iframe for performance) -->
          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <TulisKopSurat :alamat-info="user?.alamatInfo" />
                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      {{ currentJenisLabel.toUpperCase() }}
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>
                </div>

                <!-- Template content area (static placeholder, no iframe) -->
                <div class="bg-white px-8 py-12 min-h-[300px] text-black relative">
                  <div v-if="templateDownloadUrl" class="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
                    <Icon name="i-lucide-file-text" class="w-12 h-12 text-gray-300" />
                    <p class="text-[14px] text-gray-500 text-center">
                      Template tersedia: <span class="font-medium">{{ templateInfo?.templateFile }}</span><br />
                      <span class="text-xs text-gray-400">Klik "Download" atau "Buka di Google Docs" untuk mengakses template.</span>
                    </p>
                  </div>

                  <!-- Fallback: no template -->
                  <div v-else class="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
                    <Icon name="i-lucide-file-x" class="w-12 h-12 text-gray-300" />
                    <p class="text-[14px] text-gray-400 italic text-center">
                      Template untuk jenis naskah ini belum tersedia.<br />
                      Silakan gunakan template lain atau hubungi admin.
                    </p>
                  </div>
                </div>

                <div class="bg-white px-8 pt-4 pb-8 border-t border-gray-100 select-none">
                  <div class="flex justify-end mb-4 text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>{{ user?.alamatInfo?.kota || 'Tangerang' }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                      </div>
                      <div class="font-bold text-[14px]">{{ user?.nama || 'Nama Lengkap' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ClientOnly>

          <!-- Flow guide -->
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <div class="flex items-start gap-2">
              <Icon name="i-lucide-lightbulb" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div class="text-xs text-gray-600 dark:text-gray-400">
                <p class="font-medium text-gray-700 dark:text-gray-300">Alur Penggunaan Template:</p>
                <ol class="mt-1 ml-4 list-decimal space-y-0.5">
                  <li>Klik "Buka di Google Docs" untuk edit template secara online</li>
                  <li>Edit naskah sesuai kebutuhan di Google Docs</li>
                  <li>Download / export hasil edit (Word/PDF)</li>
                  <li>Upload file hasil edit pada field "Upload Naskah Final" di bawah</li>
                  <li>Klik "Kirim" untuk mengirim naskah</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Upload Naskah Final ──────────────────────────────────────────── -->
        <div v-if="currentJenis" class="flex flex-col py-3 gap-2 mt-2 border-t border-gray-200 dark:border-gray-600">
          <label class="text-sm text-gray-500 dark:text-gray-400 font-medium">Upload Naskah Final</label>

          <!-- File selected display -->
          <div v-if="naskahFinalFile" class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md
            transition-colors hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <div class="flex items-center gap-2 overflow-hidden flex-1">
              <Icon name="i-lucide-file-check" class="w-5 h-5 text-green-500 shrink-0" />
              <div class="flex flex-col min-w-0">
                <span class="text-sm text-gray-700 dark:text-gray-200 truncate font-medium">
                  {{ naskahFinalFileName }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ (naskahFinalFile.size / 1024 / 1024).toFixed(2) }} MB
                </span>
              </div>
            </div>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleRemoveNaskahFile" />
          </div>

          <!-- Upload dropzone -->
          <div v-else
            @dragover.prevent="isDraggingNaskah = true"
            @dragleave.prevent="isDraggingNaskah = false"
            @drop.prevent="handleNaskahFileDrop"
            :class="[
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
              isDraggingNaskah
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
            ]"
            @click="$refs.naskahFileInput?.click()">
            <input ref="naskahFileInput" type="file" class="hidden"
              accept=".doc,.docx,.pdf,.odt" @change="handleNaskahFileSelect" />

            <div class="flex flex-col items-center gap-2">
              <Icon name="i-lucide-upload-cloud" class="w-8 h-8 text-gray-400" />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Klik atau drag &amp; drop file naskah final di sini
              </p>
              <p class="text-xs text-gray-400">Format: .doc, .docx, .pdf, .odt (Maks 50MB)</p>
            </div>
          </div>
        </div>

        <!-- Lampiran (additional attachments) -->
        <TulisInputLampiran v-if="currentJenis" v-model="existingFiles" />

        <!-- Action Buttons -->
        <div class="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UButton color="primary" variant="soft" size="lg" block
            @click="handlePreview" :disabled="!currentJenis">
            <Icon name="i-lucide-eye" class="w-4 h-4 mr-2" />
            Pratinjau
          </UButton>
          <UButton v-if="hasPermission('naskah-dinas', 'create')" color="gray" variant="soft" size="lg" block
            @click="handleSaveDraft" :disabled="!currentJenis">
            <Icon name="i-lucide-save" class="w-4 h-4 mr-2" />
            Simpan Draft
          </UButton>
          <UButton v-if="hasPermission('naskah-dinas', 'create')" color="primary" size="lg" block
            @click="handleKirim" :disabled="!currentJenis">
            <Icon name="i-lucide-send" class="w-4 h-4 mr-2" />
            Kirim
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>