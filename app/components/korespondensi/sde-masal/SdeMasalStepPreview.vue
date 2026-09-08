<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Daftar SDE Masal -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Daftar SDE Masal
        </h4>
      </div>

      <!-- Filter Bar (pola custom dropdown naskah-lainnya) -->
      <div class="flex flex-row items-center gap-2 border-b border-gray-300 p-4 dark:border-gray-700">
        <!-- ROWS PER PAGE -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="toggleRowsPerPage"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
          >
            <span>{{ perPage }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': openRowsPerPage }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openRowsPerPage"
              class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[9999] overflow-hidden min-w-[80px]"
            >
              <button
                v-for="n in [10, 25, 50]"
                :key="n"
                type="button"
                @click.stop="selectRowsPerPage(n)"
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                  perPage === n
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                ]"
              >
                {{ n }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- FILTER STATUS -->
        <div class="relative" data-custom-dropdown>
          <button
            type="button"
            @click.stop="toggleFilterStatus"
            class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[150px] justify-between"
          >
            <span class="truncate">{{ statusLabel }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': openFilterStatus }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openFilterStatus"
              class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[9999] overflow-hidden min-w-[200px]"
            >
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                type="button"
                @click.stop="selectFilterStatus(opt.value)"
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                  statusFilter === opt.value
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </Transition>
        </div>

        <div class="relative min-w-0 flex-1">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Perihal..."
            class="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        <button
          @click="confirmClearAll"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Hapus semua"
        >
          <UIcon name="i-lucide-trash-2" class="size-5" />
        </button>
        <button
          @click="exportData"
          :disabled="exporting"
          class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-400 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UIcon :name="exporting ? 'i-lucide-loader-2' : 'i-lucide-download'" :class="['size-4', exporting && 'animate-spin']" />
          Export
        </button>
      </div>

      <DataTable
        :columns="columns"
        :rows="paginatedPenerimaList"
        :empty-message="'Tidak ada data yang cocok.'"
      >
        <template #cell-perihal="{ row }">
          <p class="max-w-[200px] truncate text-sm font-medium text-gray-900 dark:text-white" :title="row.perihal || '-'">
            {{ row.perihal || '-' }}
          </p>
        </template>
        <template #cell-tertuju="{ row }">
          <p class="max-w-[180px] truncate text-sm text-gray-600 dark:text-gray-300" :title="getPenerimaName(row)">
            {{ getPenerimaName(row) }}
          </p>
        </template>
        <template #cell-email="{ row }">
          <div class="flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300">
            <span v-if="row.emailTertuju" class="truncate" :title="row.emailTertuju">
              <span class="text-gray-400 dark:text-gray-500">To:</span> {{ row.emailTertuju }}
            </span>
            <span v-if="row.emailCc" class="truncate" :title="row.emailCc">
              <span class="text-gray-400 dark:text-gray-500">CC:</span> {{ row.emailCc }}
            </span>
            <span v-if="row.emailBcc" class="truncate" :title="row.emailBcc">
              <span class="text-gray-400 dark:text-gray-500">BCC:</span> {{ row.emailBcc }}
            </span>
            <span v-if="!row.emailTertuju && !row.emailCc && !row.emailBcc" class="text-gray-300 dark:text-gray-600">-</span>
          </div>
        </template>
        <template #cell-status="{ row }">
          <span :class="statusVerifikasiBadge(row.statusVerifikasi)">{{ statusVerifikasiLabel(row.statusVerifikasi) }}</span>
        </template>
        <template #cell-lampiran="{ row }">
          <div class="flex max-w-[220px] flex-col items-center gap-1">
            <UButton
              v-if="attachmentRefs(row).length"
              :label="`${attachmentRefs(row).length} Lampiran`"
              icon="i-lucide-paperclip"
              color="primary"
              variant="soft"
              size="xs"
              @click="openAttachmentManager(row)"
            />
            <span v-if="attachmentRefs(row).length === 0" class="text-gray-300 dark:text-gray-600">-</span>
          </div>
        </template>
        <template #cell-aksi="{ row, index }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              icon="i-lucide-eye"
              color="primary"
              variant="soft"
              size="xs"
              title="Lihat"
              :loading="isLoadingPdf && previewIndex === index"
              @click="openPreview(index)"
            />
            <UButton
              icon="i-lucide-mail"
              color="neutral"
              variant="soft"
              size="xs"
              title="Edit Email"
              @click="openEditEmail(index)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="soft"
              size="xs"
              title="Hapus"
              @click="confirmRemoveItem(index)"
            />
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <DataPagination
        v-model:current-page="currentPage"
        :total-items="filteredPenerimaList.length"
        :per-page="perPage"
      />
    </div>

    <!-- Modal Konfirmasi Hapus Semua -->
    <ConfirmModal
      v-model="showClearConfirm"
      title="Hapus Semua Data?"
      description="Semua data SDE Masal akan dihapus. Tindakan ini tidak dapat dibatalkan."
      confirm-text="Hapus Semua"
      cancel-text="Batal"
      variant="danger"
      @confirm="doClearAll"
    />

    <!-- Modal Konfirmasi Hapus Item -->
    <ConfirmModal
      v-model="showRemoveItemConfirm"
      title="Hapus Naskah?"
      description="Naskah ini akan dihapus dari daftar SDE Masal."
      confirm-text="Hapus"
      cancel-text="Batal"
      variant="danger"
      @confirm="doRemoveItem"
    />

    <!-- Modal pengelolaan lampiran per penerima -->
    <Teleport to="body">
      <div v-if="attachmentManagerRow" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="closeAttachmentManager" />
        <div class="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Lampiran Penerima</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="closeAttachmentManager" />
          </div>
          <div class="space-y-3 p-6">
            <div
              v-for="(attachment, attachmentIndex) in managedAttachments"
              :key="`${attachment.key}-${attachmentIndex}`"
              class="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
            >
              <UIcon name="i-lucide-file-text" class="size-5 shrink-0 text-primary-500" />
              <span class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">{{ attachment.fileName }}</span>
              <UButton label="Preview" icon="i-lucide-eye" color="primary" variant="soft" size="xs" @click="viewLampiran(attachmentManagerRow, attachment, attachmentIndex)" />
              <UButton icon="i-lucide-trash-2" color="error" variant="soft" size="xs" title="Hapus lampiran" @click="removeManagedAttachment(attachmentIndex)" />
            </div>
            <p v-if="managedAttachments.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Belum ada lampiran.</p>
          </div>
          <div class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <UButton label="Tambah / Ganti Lampiran" icon="i-lucide-upload" color="primary" variant="soft" @click="replaceManagedAttachment" />
            <UButton label="Tutup" color="neutral" variant="outline" @click="closeAttachmentManager" />
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showVerifierModal"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="showVerifierModal = false"
        />
        <div
          class="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        >
          <div class="p-6">
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="flex size-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                    ><UIcon
                      name="i-lucide-users"
                      class="size-5 text-primary-600 dark:text-primary-400"
                  /></span>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Atasan Managerial Berjenjang <span class="text-red-500">*</span>
                    </h2>
                    <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      Atasan diambil otomatis dari chain disposisi. Urutan mengikuti jenjang jabatan yang tersedia.
                    </p>
                  </div>
                </div>
              </div>
              <div class="space-y-5 px-5 py-5">
                <div v-if="verifierLoading" class="py-5 text-center text-sm text-gray-400">
                  Memuat atasan dari struktur organisasi...
                </div>
                <div v-else-if="selectedVerifiers.length" class="space-y-4">
                  <div
                    v-for="(person, index) in selectedVerifiers"
                    :key="person.position"
                    class="flex items-center gap-4"
                  >
                    <span
                      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md"
                      >{{ index + 1 }}</span
                    >
                    <div class="min-w-0 flex-1">
                      <p
                        class="truncate text-base font-bold uppercase tracking-normal text-gray-900 dark:text-white"
                      >
                        {{ person.nama }}
                      </p>
                      <p class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                        {{ person.jabatan }}
                      </p>
                    </div>
                  </div>
                </div>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                  Atasan managerial tidak ditemukan pada struktur organisasi.
                </p>
                <p v-if="selectedVerifiers.length" class="text-sm text-gray-500 dark:text-gray-400">
                  Verifikasi berjenjang:
                  {{ selectedVerifiers.map((person) => person.nama).join(' → ') }}
                </p>
              </div>
            </div>
          </div>
          <div
            class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-700"
          >
            <UButton
              label="Batal"
              color="neutral"
              variant="outline"
              @click="showVerifierModal = false"
            /><UButton
              label="Ajukan Verifikasi"
              color="primary"
              :loading="generating"
              :disabled="verifierLoading || !selectedVerifiers.length || generating"
              @click="submitVerifiers"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preview Full-screen PDF (native PDF viewer browser, seragam dengan preview-berkas) -->
    <Teleport to="body">
      <div
        v-if="showPreview"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div
          class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Preview Surat — Penerima {{ previewIndex + 1 }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIndex <= 0 || isLoadingPdf"
              @click="gotoPreview(previewIndex - 1)"
            />
            <span class="min-w-14 text-center text-xs text-gray-500 dark:text-gray-400"
              >{{ previewIndex + 1 }} / {{ penerimaList.length }}</span
            >
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIndex >= penerimaList.length - 1 || isLoadingPdf"
              @click="gotoPreview(previewIndex + 1)"
            />
            <div class="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Tutup"
              @click="closePreview"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <!-- PDF Content (iframe → native PDF viewer browser) -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <div v-if="isLoadingPdf" class="absolute inset-0 flex items-center justify-center z-10">
            <div
              class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg"
            >
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Memuat dokumen…</p>
            </div>
          </div>
          <iframe v-if="pdfUrl" :key="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
          <div
            v-else-if="pdfError"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-300" />
            <span class="text-sm text-red-500">{{ pdfError }}</span>
          </div>
          <div
            v-else-if="!isLoadingPdf"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">PDF tidak tersedia.</span>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Ajukan Verifikasi"
          color="primary"
          size="lg"
          icon="i-lucide-send"
          class="px-8 font-bold"
          :loading="generating"
          :disabled="generating || !penerimaList.length"
          @click="openVerificationSelection"
        />
      </div>
    </div>

    <!-- Slideover Pratinjau dengan dropdown penerima -->
    <USlideover v-model:open="isPreviewOpen" title="Pratinjau" description="Pratinjau dokumen" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
      wrapper: 'z-50'
    }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pratinjau</h3>
          </div>
          <!-- Dropdown pilih penerima (USelectMenu — seragam dengan komponen lain) -->
          <div v-if="penerimaList.length > 1" class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Penerima:</span>
            <USelectMenu
              :model-value="penerimaOptions.find((o) => o.value === previewPenerimaIdx)"
              :items="penerimaOptions"
              by="value"
              :search-input="false"
              class="w-64"
              :ui="{ base: 'h-9 text-sm font-medium w-full justify-between' }"
              @update:model-value="onPenerimaChange"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2 w-full">
                  <UIcon
                    :name="item.value === previewPenerimaIdx ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    :class="item.value === previewPenerimaIdx ? 'size-4 text-primary-500' : 'size-4 text-gray-300 dark:text-gray-600'"
                  />
                  <span class="text-sm">{{ item.label }}</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>
      </template>

      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="previewPdfUrl" :key="previewPdfUrl" :src="previewPdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-4 w-full">
          <UButton
            label="Draft"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-document-text"
            class="px-8"
            @click="handleSaveDraft"
          />
          <UButton
            label="Ajukan Verifikasi"
            color="primary"
            size="lg"
            icon="i-heroicons-paper-airplane"
            class="px-8 font-bold"
            @click="isPreviewOpen = false; openVerificationSelection()"
          />
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useApi } from '~/composables/useApi';
import {
  renderSdeMasalKonten,
  setTertujuEksternalLookup,
  setInternalPositionLookup,
} from '~/utils/sde-masal-render';
import DataTable from '~/components/DataTable.vue';
import DataPagination from '~/components/DataPagination.vue';
import ConfirmModal from '~/components/ConfirmModal.vue';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  folderId: string | null;
  generating: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-verification', verifikators: any[], signOption: 'qr_only' | 'ttd_basah'): void;
  (
    e: 'finalize-direct',
    payload: { signOption: 'digsig' | 'qr_only' | 'ttd_basah'; passphrase?: string }
  ): void;
  (e: 'submit-all'): void;
  (e: 'clear-data'): void;
  (e: 'remove-item', index: number): void;
  (e: 'edit-email', index: number): void;
  (e: 'upload-lampiran', index: number): void;
}>();

const showPreview = ref(false);
const previewIndex = ref<number>(0);

// PDF preview state (native PDF viewer via iframe)
const isLoadingPdf = ref(false);
const pdfUrl = ref<string | null>(null);
const pdfError = ref<string | null>(null);
let currentBlobUrl: string | null = null;

// --- Pratinjau slideover + Sign modal state ---
const isPreviewOpen = ref(false);
const previewPdfUrl = ref<string | null>(null);
let previewBlobUrl: string | null = null;
const previewPenerimaIdx = ref(0);

// Opsi dropdown penerima untuk USelectMenu
const penerimaOptions = computed(() =>
  props.penerimaList.map((item, idx) => ({
    label: `${idx + 1}. ${getPenerimaName(item)}`,
    value: idx,
  }))
);

const onPenerimaChange = (selected: any) => {
  if (selected && typeof selected.value === 'number') {
    previewPenerimaIdx.value = selected.value;
    handlePratinjau();
  }
};

const revokePreviewPdf = () => {
  if (previewBlobUrl) {
    URL.revokeObjectURL(previewBlobUrl);
    previewBlobUrl = null;
  }
  previewPdfUrl.value = null;
};

const revokePdf = () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  pdfUrl.value = null;
};

const closePreview = () => {
  showPreview.value = false;
  revokePdf();
};

const openPreview = async (idx: number) => {
  showPreview.value = true;
  await generatePdfFor(idx);
};

const gotoPreview = async (idx: number) => {
  if (idx < 0 || idx >= props.penerimaList.length) return;
  previewIndex.value = idx;
  await generatePdfFor(idx);
};

/**
 * Generate PDF pratinjau untuk slideover (penerima terpilih dari dropdown).
 */
const handlePratinjau = async () => {
  if (!props.penerimaList.length) return;
  const idx = previewPenerimaIdx.value;
  const item = props.penerimaList[idx];
  if (!item) return;
  revokePreviewPdf();
  try {
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    const konten = renderSdeMasalKonten(
      props.template?.konten || '',
      item,
      props.konsep,
      getRecipientCompanyName(item)
    );
    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('perihal', item.perihal || props.konsep?.perihal || '');
    formData.append('sifat', props.konsep?.sifat || 'biasa');
    formData.append('penerima', JSON.stringify([getRecipientCompanyName(item) || item.tertuju || '']));
    formData.append('tembusan_eksternal', item.tembusanEksternal || '');
    formData.append('tembusan_internal', item.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(item.tembusan ? [item.tembusan] : []));
    formData.append('nama_tempat', user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang');
    // Penandatangan = pengirim yang dipilih di konsep (bukan user login)
    formData.append('nama_jabatan', pengirimJabatan.value || user.value?.positionText || '');
    formData.append('nama_lengkap', pengirimNama.value || user.value?.nama || '');
    if (props.konsep?.tanggalKonsep) formData.append('tgl', props.konsep.tanggalKonsep);
    const previewAttachments = attachmentRefs(item);
    if (previewAttachments.length > 0) {
      formData.append(
        'lampiran_direct_refs',
        JSON.stringify(previewAttachments.map(({ fileName, key }) => ({ fileName, key })))
      );
    }

    const response = await api.post('/sde-masal/preview-pdf', formData, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    previewBlobUrl = URL.createObjectURL(blob);
    previewPdfUrl.value = previewBlobUrl;
  } catch (e: any) {
    console.error('Gagal generate pratinjau:', e);
    previewPdfUrl.value = null;
  }
};

const handleSaveDraft = () => {
  isPreviewOpen.value = false;
  toast.add({
    title: 'Draft tersimpan',
    description: 'Perubahan draft tetap tersimpan di halaman SDE Masal.',
    color: 'success',
  });
};

/**
 * Generate PDF asli via POST /SDE/preview-pdf (Puppeteer di backend),
 * lalu tampilkan via iframe → native PDF viewer browser.
 */
const generatePdfFor = async (idx: number) => {
  const item = props.penerimaList[idx];
  if (!item || !props.template) return;

  isLoadingPdf.value = true;
  revokePdf();
  try {
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    await ensureInternalPositionLookup();

    const konten = renderSdeMasalKonten(
      props.template.konten,
      item,
      props.konsep,
      getRecipientCompanyName(item)
    );

    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('konten', konten);
    formData.append('klasifikasi', props.konsep?.klasifikasiName?.split(' - ')[0] || '');
    formData.append('perihal', item.perihal || props.konsep?.perihal || '');
    formData.append('sifat', props.konsep?.sifat || 'biasa');
    formData.append(
      'penerima',
      JSON.stringify([getRecipientCompanyName(item) || item.tertuju || item.idTertuju || ''])
    );
    // Tembusan: kirim kode eksternal & internal untuk di-resolve backend
    // (urutan: eksternal dulu, lalu internal) → di-hardcode di kanvas PDF.
    // tembusan legacy dikirim sebagai fallback bila kolom baru kosong.
    formData.append('tembusan_eksternal', item.tembusanEksternal || '');
    formData.append('tembusan_internal', item.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(item.tembusan ? [item.tembusan] : []));
    formData.append(
      'nama_tempat',
      user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang'
    );
    // Penandatangan = pengirim yang dipilih di konsep (bukan user login)
    formData.append('nama_jabatan', pengirimJabatan.value || user.value?.positionText || '');
    formData.append('nama_lengkap', pengirimNama.value || user.value?.nama || '');
    if (props.konsep?.tanggalKonsep) {
      formData.append('tgl', props.konsep.tanggalKonsep);
    }
    const previewAttachments = attachmentRefs(item);
    if (previewAttachments.length > 0) {
      formData.append(
        'lampiran_direct_refs',
        JSON.stringify(previewAttachments.map(({ fileName, key }) => ({ fileName, key })))
      );
    }

    const response = await api.post('/sde-masal/preview-pdf', formData, {
      responseType: 'blob',
    });

    // Validasi: pastikan response benar-benar PDF (bukan JSON error)
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text();
      const errJson = JSON.parse(text);
      throw new Error(errJson?.message?.[0] || errJson?.message || 'Gagal generate PDF');
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    if (blob.size === 0) throw new Error('PDF kosong dari server');
    currentBlobUrl = URL.createObjectURL(blob);
    pdfUrl.value = currentBlobUrl;
  } catch (e: any) {
    console.error('Gagal generate preview PDF SDE Masal:', e);
    // Coba baca error dari blob response (backend mengembalikan JSON error)
    let detail = e?.message || 'Gagal generate PDF';
    if (e?.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const errJson = JSON.parse(text);
        detail = errJson?.message?.[0] || errJson?.message || detail;
      } catch {
        /* bukan JSON, pakai pesan default */
      }
    }
    pdfError.value = detail;
    toast.add({ title: 'Gagal membuat preview', description: detail, color: 'error' });
    pdfUrl.value = null;
  } finally {
    isLoadingPdf.value = false;
  }
};
const showVerifierModal = ref(false);
const verifierLoading = ref(false);
const selectedVerifiers = ref<any[]>([]);
const verifierList = ref<any[]>([]);
const { api, apiGet } = useApi();
const toast = useToast();
const { user, getProfile } = useAuth();
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();

/**
 * Muat data posisi internal (org-data) untuk resolve position ID tembusan
 * internal menjadi jabatan. Dipanggil sekali per sesi.
 */
let internalPositionLookupLoaded = false;
const ensureInternalPositionLookup = async () => {
  if (internalPositionLookupLoaded) return;
  internalPositionLookupLoaded = true;
  try {
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    setInternalPositionLookup(rows);
  } catch {
    /* gagal load → fallback tampilkan kode position */
  }
};

const findTertujuEksternal = (value: string | number | null | undefined) => {
  const raw = String(value ?? '').trim();
  const code = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find(
    (item) =>
      String(item.kode ?? '')
        .trim()
        .padStart(3, '0') === code
  );
};

const getRecipientCompanyName = (item: SdeMasalPenerima) =>
  findTertujuEksternal(item.idTertuju || item.tertuju)?.nama || null;

// PengirimName format: "Nama - Jabatan" (dipisah " - ")
const pengirimParts = computed(() =>
  (props.konsep?.pengirimName || '')
    .split(' - ')
    .map((part) => part.trim())
    .filter(Boolean)
);
const pengirimNama = computed(() => pengirimParts.value[0] || '-');
const pengirimJabatan = computed(() => pengirimParts.value.slice(1).join(' - ') || '-');

onMounted(() => {
  fetchTertujuEksternal().catch((error) => {
    console.warn('Gagal memuat master tertuju eksternal untuk daftar penerima SDE Masal', error);
  });
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  openRowsPerPage.value = false;
  openFilterStatus.value = false;
}

const getTertujuEksternal = (penerima: SdeMasalPenerima | Record<string, any>) => {
  const raw = String(penerima.idTertuju || penerima.tertuju || '').trim();
  const kode = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find(
    (item) =>
      String(item.kode ?? '')
        .trim()
        .padStart(3, '0') === kode
  );
};

const getPenerimaName = (penerima: SdeMasalPenerima | Record<string, any>) =>
  getTertujuEksternal(penerima)?.nama || penerima.tertuju || penerima.idTertuju || '-';

// Status verifikasi label + badge
const statusVerifikasiLabel = (status?: string) =>
  ({
    MENUNGGU: 'Menunggu',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    TERVERIFIKASI: 'Terverifikasi',
    DITOLAK: 'Ditolak',
    TERKIRIM: 'Terkirim',
    GAGAL: 'Gagal',
  })[status || 'MENUNGGU'] || status || 'Menunggu';

const statusVerifikasiBadge = (status?: string) =>
  ({
    MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium',
    MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium',
    TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium',
    DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium',
    TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium',
    GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium',
  })[status || 'MENUNGGU'] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium';

// Kolom DataTable
const columns = [
  { key: 'perihal', label: 'Perihal' },
  { key: 'tertuju', label: 'Tertuju' },
  { key: 'email', label: 'Email', headerClass: 'text-center' },
  { key: 'status', label: 'Status Verifikasi', headerClass: 'text-center', class: 'text-center' },
  { key: 'lampiran', label: 'Lampiran', headerClass: 'text-center', class: 'text-center' },
  { key: 'aksi', label: 'Aksi', headerClass: 'text-center', class: 'text-center' },
];

// Filter & search
const searchQuery = ref('');
const statusFilter = ref('');
const filteredPenerimaList = computed(() => {
  let result = props.penerimaList;
  if (statusFilter.value) {
    result = result.filter((item) => (item.statusVerifikasi || 'MENUNGGU') === statusFilter.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (item) =>
        (item.perihal || '').toLowerCase().includes(q) ||
        getPenerimaName(item).toLowerCase().includes(q)
    );
  }
  return result;
});

// Pagination
const perPage = ref(10);
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPenerimaList.value.length / perPage.value)));
const paginatedPenerimaList = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredPenerimaList.value.slice(start, start + perPage.value);
});

// Opsi dropdown (USelectMenu)
const perPageOptions = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
];
const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'MENUNGGU', label: 'Menunggu' },
  { value: 'MENUNGGU_VERIFIKASI', label: 'Menunggu Verifikasi' },
  { value: 'TERVERIFIKASI', label: 'Terverifikasi' },
  { value: 'DITOLAK', label: 'Ditolak' },
  { value: 'TERKIRIM', label: 'Terkirim' },
  { value: 'GAGAL', label: 'Gagal' },
];

// Custom dropdown state (pola naskah-lainnya)
const openRowsPerPage = ref(false);
const openFilterStatus = ref(false);
const statusLabel = computed(
  () => statusOptions.find((o) => o.value === statusFilter.value)?.label ?? 'Semua Status'
);
function toggleRowsPerPage() {
  openRowsPerPage.value = !openRowsPerPage.value;
  openFilterStatus.value = false;
}
function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openRowsPerPage.value = false;
}
function selectRowsPerPage(n: number) {
  perPage.value = n;
  currentPage.value = 1;
  openRowsPerPage.value = false;
}
function selectFilterStatus(val: string) {
  statusFilter.value = val;
  currentPage.value = 1;
  openFilterStatus.value = false;
}

// Export CSV
const exporting = ref(false);
const exportData = () => {
  if (!filteredPenerimaList.value.length) return;
  exporting.value = true;
  try {
    const header = ['Perihal', 'Tertuju', 'Status Verifikasi'];
    const rows = filteredPenerimaList.value.map((item) => [
      item.perihal || '',
      getPenerimaName(item),
      statusVerifikasiLabel(item.statusVerifikasi),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sde-masal.csv';
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
};

// Aksi per item
const openEditEmail = (idx: number) => emit('edit-email', idx);
const openUploadLampiran = (idx: number) => emit('upload-lampiran', idx);
const removeItem = (idx: number) => emit('remove-item', idx);

const attachmentManagerRow = ref<SdeMasalPenerima | Record<string, any> | null>(null);
const managedAttachments = computed(() => attachmentManagerRow.value ? attachmentRefs(attachmentManagerRow.value) : []);

const openAttachmentManager = (row: SdeMasalPenerima | Record<string, any>) => {
  attachmentManagerRow.value = row;
};

const closeAttachmentManager = () => {
  attachmentManagerRow.value = null;
};

const removeManagedAttachment = (index: number) => {
  const row = attachmentManagerRow.value;
  if (!row) return;
  row.lampiran = managedAttachments.value.filter((_, attachmentIndex) => attachmentIndex !== index);
  toast.add({ title: 'Lampiran dihapus', color: 'success' });
};

const replaceManagedAttachment = () => {
  const row = attachmentManagerRow.value;
  if (!row) return;
  const rowId = 'id' in row ? row.id : undefined;
  const index = props.penerimaList.findIndex((item) =>
    item === row || (!!rowId && item.id === rowId)
  );
  closeAttachmentManager();
  if (index >= 0) openUploadLampiran(index);
};

// Lihat lampiran
const attachmentRefs = (row: any): Array<{ fileName: string; key: string; url?: string }> => {
  if (Array.isArray(row?.lampiran)) return row.lampiran;
  if (typeof row?.lampiran === 'string') {
    try {
      const parsed = JSON.parse(row.lampiran);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Legacy scalar key/URL.
    }
  }
  const key = row?.lampiranKey || (typeof row?.lampiran === 'string' ? row.lampiran : '');
  if (!key) return [];
  const raw = String(key).split('?')[0];
  return [{ fileName: raw.split('/').pop() || 'Lampiran', key, url: row?.lampiranKey ? row.lampiran : undefined }];
};

const viewLampiran = async (row: any, attachment: { key: string; url?: string }, index: number) => {
  if (attachment.url) {
    window.open(attachment.url, '_blank');
    return;
  }
  try {
    const response = await api.get(`/sde-masal/${row.id}/lampiran/${index}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    console.error('Gagal membuka lampiran SDE Masal', error);
  }
};

// Konfirmasi hapus satu item
const removeItemIndex = ref<number | null>(null);
const showRemoveItemConfirm = computed({
  get: () => removeItemIndex.value !== null,
  set: (val: boolean) => {
    if (!val) removeItemIndex.value = null;
  },
});
const confirmRemoveItem = (idx: number) => {
  removeItemIndex.value = idx;
};
const doRemoveItem = () => {
  if (removeItemIndex.value !== null) {
    emit('remove-item', removeItemIndex.value);
  }
  removeItemIndex.value = null;
};

// Konfirmasi hapus semua
const showClearConfirm = ref(false);
const confirmClearAll = () => {
  showClearConfirm.value = true;
};
const doClearAll = () => {
  showClearConfirm.value = false;
  emit('clear-data');
};

const verifierRoleRank = (value: unknown): number | null => {
  const text = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  if (/\bAVP\b/.test(text)) return 1;
  if (/\bEVP\b/.test(text)) return 3;
  if (/\bVP\b/.test(text)) return 2;
  return null;
};
const sortSelectedVerifiers = () => {
  selectedVerifiers.value.sort(
    (a, b) => (verifierRoleRank(a.jabatan) ?? 99) - (verifierRoleRank(b.jabatan) ?? 99),
  );
};
const openVerificationSelection = async () => {
  showVerifierModal.value = true;
  selectedVerifiers.value = [];
  verifierLoading.value = true;
  try {
    // Selalu refresh profil agar posisi aktif/delegasi lama tidak dipakai.
    const profile = (await getProfile(true)) || user.value;
    let positionId = profile?.position ?? profile?.position_id;
    let verifiersFromDisposition: any[] = [];

    // Resolusi berdasarkan persnum memastikan struktur dihitung dari posisi
    // asli pengguna yang login (misalnya Raihan Fathan), bukan dari pengirim
    // surat atau posisi delegasi yang sedang tersimpan di state.
    if (profile?.persnum) {
      try {
        const myPosition: any = await apiGet(
          `/org-data/my-position?persnum=${encodeURIComponent(String(profile.persnum))}`,
          {},
          { skipCache: true },
        );
        const row = myPosition?.data ?? myPosition;
        positionId = row?.position ?? positionId;
      } catch {
        // Gunakan posisi profil terbaru sebagai fallback.
      }
    }

    // Jika SDE Massal dibuat dari disposisi, sumber utama posisi pengaju
    // adalah rantai disposisi awal. Ini mencegah posisi pengirim SDE atau
    // posisi aktif lama mengubah daftar atasan Raihan.
    if (props.konsep?.parentNaskahId) {
      try {
        const disposisiRes: any = await apiGet(
          `/DI/${encodeURIComponent(props.konsep.parentNaskahId)}`,
          {},
          { skipCache: true },
        );
        const flow = disposisiRes?.data?.flow || disposisiRes?.flow || [];
        const profilePersnum = String(profile?.persnum ?? '').trim();
        const profileName = String(profile?.nama ?? '').trim().toLowerCase();
        const currentDisposisi = Array.isArray(flow) ? flow[0] : null;
        const penerimaDisposisiTerbaru = currentDisposisi?.penerima || [];
        const penerimaDisposisi = Array.isArray(flow)
          ? flow.flatMap((node: any) => node?.penerima || [])
          : [];
        const matchPenerimaLogin = penerimaDisposisi.find((recipient: any) => {
          const samePersnum =
            profilePersnum &&
            String(recipient?.persnum ?? recipient?.id_sirkuler ?? '').trim() === profilePersnum;
          const sameName =
            profileName && String(recipient?.nama ?? '').trim().toLowerCase() === profileName;
          return samePersnum || sameName;
        });
        const matchPenerimaTerbaru = penerimaDisposisiTerbaru.find(
          (recipient: any) => {
            const samePersnum =
              profilePersnum &&
              String(recipient?.persnum ?? recipient?.id_sirkuler ?? '').trim() === profilePersnum;
            const sameName =
              profileName && String(recipient?.nama ?? '').trim().toLowerCase() === profileName;
            return samePersnum || sameName;
          },
        );
        // Flow /DI dikembalikan terbaru → awal. Untuk halaman yang dibuka
        // Raihan, penerima pada node terbaru adalah posisi pelaksana disposisi.
        // Gunakan itu sebagai sumber utama; pencocokan profil menjadi fallback
        // bila node terbaru memiliki beberapa penerima atau data lama.
        const penerimaUtama =
          matchPenerimaTerbaru || matchPenerimaLogin || penerimaDisposisiTerbaru[0];
        const posisiDisposisi =
          penerimaUtama?.position_id ||
          penerimaUtama?.position ||
          matchPenerimaLogin?.position_id ||
          matchPenerimaLogin?.position;
        if (posisiDisposisi) positionId = posisiDisposisi;

        // Setiap pengirim pada node chain adalah pejabat yang meneruskan
        // disposisi ke bawah. Inilah rantai atasan yang sebenarnya untuk
        // SDE Massal, bukan seluruh AVP/VP dalam divisi yang sama.
        const byRank = new Map<number, any>();
        (Array.isArray(flow) ? flow : [])
          .map((node: any) => node?.pengirim)
          .filter(Boolean)
          .map((sender: any) => ({
            persnum: String(sender?.persnum ?? sender?.id_sirkuler ?? '').trim(),
            position: String(sender?.position_id ?? sender?.position ?? '').trim(),
            nama: sender?.nama || '-',
            jabatan: sender?.position_text || sender?.jabatan || '-',
          }))
          .filter((sender: any) => sender.position)
          .forEach((sender: any) => {
            const rank = verifierRoleRank(sender.jabatan);
            if (rank !== null && !byRank.has(rank)) byRank.set(rank, sender);
          });
        verifiersFromDisposition = [...byRank.entries()]
          .sort(([rankA], [rankB]) => rankA - rankB)
          .map(([, sender]) => sender);
      } catch {
        // Tetap gunakan posisi profil terbaru bila flow disposisi tidak dapat
        // dibaca, tanpa mengubah alur SDE Massal yang sudah ada.
      }
    }

    if (verifiersFromDisposition.length) {
      // Untuk folder berbasis disposisi, jangan jatuh ke daftar seluruh
      // pejabat satu divisi karena dapat mencampur cabang Communication dan
      // Enterprise. Chain disposisi menjadi sumber tunggal verifikator.
      verifierList.value = verifiersFromDisposition;
      selectedVerifiers.value = verifiersFromDisposition.slice(0, 3);
      sortSelectedVerifiers();
      return;
    }

    if (positionId == null || String(positionId).trim() === '') {
      throw new Error('Posisi pengguna belum tersedia');
    }

    const result: any = await apiGet(
      `/org-data/atasan-managerial/${encodeURIComponent(String(positionId))}?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = Array.isArray(result?.data) ? result.data : [];
    const byRank = new Map<number, any>();
    rows
      .filter((row: any) => row.persnum_person || row.persnum)
      .map((row: any) => ({
        persnum: String(row.persnum_person || row.persnum),
        position: String(row.position),
        nama: row.persnum_person_text || row.nama || '-',
        jabatan: row.position_text || '-',
      }))
      .filter((person: any) => person.persnum && person.nama !== '-' && verifierRoleRank(person.jabatan) !== null)
      .sort((a: any, b: any) => (verifierRoleRank(a.jabatan) ?? 99) - (verifierRoleRank(b.jabatan) ?? 99))
      .forEach((person: any) => {
        const rank = verifierRoleRank(person.jabatan);
        if (rank !== null && !byRank.has(rank)) byRank.set(rank, person);
      });

    verifierList.value = [...byRank.values()];
    selectedVerifiers.value = verifierList.value.slice(0, 3);
    sortSelectedVerifiers();
    if (!selectedVerifiers.value.length) {
      throw new Error('Atasan managerial tidak ditemukan');
    }
  } catch {
    verifierList.value = [];
    selectedVerifiers.value = [];
    toast.add({ title: 'Gagal memuat atasan managerial', color: 'error' });
  } finally {
    verifierLoading.value = false;
  }
};
const saveVerifiers = () => {
  const storageKey = `sde-masal-wizard:${props.konsep?.parentNaskahId || 'new'}`;
  const draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
  localStorage.setItem(
    storageKey,
    JSON.stringify({ ...draft, verifikators: selectedVerifiers.value })
  );
  showVerifierModal.value = false;
  toast.add({
    title: 'Atasan managerial siap diverifikasi',
    description: `${selectedVerifiers.value.length} atasan ditetapkan otomatis.`,
    color: 'success',
  });
};
const submitVerifiers = () => {
  const ranks = selectedVerifiers.value
    .map((person) => verifierRoleRank(person.jabatan))
    .filter((rank): rank is number => rank !== null);
  if (ranks.length === 0 || new Set(ranks).size !== ranks.length) {
    toast.add({
      title: 'Chain disposisi tidak valid',
      description: 'Pastikan setiap jenjang atasan hanya muncul satu kali.',
      color: 'error',
    });
    return;
  }
  sortSelectedVerifiers();
  saveVerifiers();
  emit('submit-verification', selectedVerifiers.value, 'qr_only');
};
</script>
