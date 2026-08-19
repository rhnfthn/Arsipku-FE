<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader :title="$t('buat_naskah')" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton loading (pola nota-dinas) -->
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
        <USkeleton class="h-24 w-full rounded-md" />
        <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
          <USkeleton class="h-10 w-40 rounded-lg" />
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto space-y-1">
        <!-- Jenis Naskah -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Jenis Naskah *</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="form.jenis" :items="jenisOptions" value-key="value" :search="false"
              variant="none" class="w-full p-0">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full cursor-pointer">
                  <span v-if="form.jenis" class="text-sm text-left truncate text-gray-900 dark:text-white">{{ jenisLabel }}</span>
                  <span v-else class="text-sm text-gray-400">Pilih jenis naskah</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- Nomor (editable; otomatis saat kirim atau isi manual sesuai format) -->
        <div
          class="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0 flex items-center gap-1">
            Nomor
            <UTooltip text="Kosongkan untuk penomoran otomatis saat kirim. Jika diisi manual, harus sesuai format jenis naskah & unik.">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
            </UTooltip>
          </span>
          <UInput v-model="form.nomor" :placeholder="nomorPlaceholder"
            class="w-full sm:flex-1" variant="none"
            :ui="{ base: 'text-sm text-gray-900 dark:text-white px-0' }" />
        </div>

        <!-- Perihal (auto-fill dari upload, disabled) -->
        <div
          class="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
          <UInput v-model="form.perihal" disabled placeholder="Otomatis terisi setelah unggah naskah"
            class="w-full sm:flex-1" variant="none"
            :ui="{ base: 'disabled:opacity-60 cursor-not-allowed text-sm text-gray-900 dark:text-white px-0' }" />
        </div>

        <!-- Klasifikasi (komponen Tulis, pola nota-dinas) -->
        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList"
          :loading="klasifikasiStatus === 'loading'" />

        <!-- Tanggal (komponen Tulis, pola nota-dinas) -->
        <TulisInputTanggal v-model="tanggalDate" :label="$t('f_tanggal_surat')" />

        <!-- Penandatangan dinamis: satu single-select per slot -->
        <div v-if="signerSlotCount > 0" class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Urutan Penandatangan
            <span class="block text-xs text-gray-400 font-normal">({{ signerSlotCount }} slot)</span>
          </span>
          <div class="flex-1 w-full space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Urutan sesuai posisi <code class="text-xs">{<!-- -->{tanda_tangan_N}<!-- -->}</code> di template. Pilih penandatangan untuk setiap slot sesuai urutan penandatangan.
            </p>
            <div v-for="slot in signerSlots" :key="slot.index" class="flex items-center gap-2">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
                {{ slot.index }}
              </span>
              <USelectMenu v-model="slotSigners[slot.index - 1]" :items="slotItems(slot.index - 1)" value-key="value"
                :searchable="true" variant="none" class="flex-1 w-full"
                :content="({ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any)"
                :ui="{
                  base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                  input: 'w-full',
                  value: 'w-full',
                  viewport: 'max-h-[380px]',
                } as any">
                <template #default>
                  <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full cursor-pointer">
                    <span v-if="slotSigners[slot.index - 1]" class="text-sm text-left truncate text-gray-900 dark:text-white">
                      {{ selectedSlotLabel(slot.index - 1) }}
                    </span>
                    <span v-else class="text-sm text-gray-400">Pilih penandatangan {{ slot.index }}</span>
                  </div>
                </template>
              </USelectMenu>
            </div>
          </div>
        </div>
        <div v-else-if="!loadingSigners && form.jenis" class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Urutan Penandatangan
          </span>
          <p class="text-xs text-gray-400 flex-1 w-full">
            Template ini tidak memiliki placeholder penandatangan — fase signing akan dilewati.
          </p>
        </div>

        <!-- Sifat (komponen Tulis, pola nota-dinas) -->
        <TulisInputSifat v-model="selectedSifat" />

        <!-- Verifikator Berjenjang (verifikator ≠ penandatangan) -->
        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-2 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Verifikator
            <span class="block text-xs text-gray-400 font-normal">(berjenjang)</span>
          </span>
          <div class="flex-1 w-full">
            <!-- Chips terpilih (urutan = urutan pemilihan) -->
            <div v-if="selectedApprovals.length" class="mb-2 flex flex-col gap-1.5">
              <div v-for="(v, idx) in selectedApprovals" :key="v.persnum"
                class="flex items-center gap-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-2">
                <span
                  class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0">
                  {{ idx + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ v.nama }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ v.jabatan }}</p>
                </div>
                <button type="button" class="text-gray-400 hover:text-red-500 shrink-0" @click="removeApproval(v.persnum)" aria-label="Hapus verifikator">
                  <UIcon name="i-lucide-x" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Dropdown pilih verifikator -->
            <div v-if="approvalCandidates.length === 0" class="py-1 text-sm text-gray-400">
              Tidak ada data pejabat. Naskah akan menggunakan alur persetujuan bawaan.
            </div>
            <div v-else class="relative" ref="approvalDropdownRef">
              <button type="button" @click="showApprovalDropdown = !showApprovalDropdown" aria-label="Pilih verifikator"
                class="w-full flex items-center justify-end rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                :class="approvalError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'">
                <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': showApprovalDropdown }" />
              </button>
              <div v-if="showApprovalDropdown"
                class="absolute z-60 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <div class="border-b border-gray-100 p-2 dark:border-gray-700">
                  <div class="relative">
                    <UIcon name="i-lucide-search" class="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <input ref="approvalSearchRef" v-model="approvalSearchQuery" type="text"
                      placeholder="Cari nama atau jabatan..."
                      class="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
                <div class="max-h-[200px] overflow-y-auto">
                  <button v-for="v in filteredApprovals" :key="v.persnum" type="button"
                    @click="onApprovalSelect(v.persnum)"
                    class="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <span class="font-medium">{{ v.nama }}</span>
                    <span class="text-xs text-gray-400">{{ v.jabatan || '' }}</span>
                  </button>
                  <div v-if="filteredApprovals.length === 0" class="px-3 py-4 text-center text-sm text-gray-400">
                    Tidak ada pejabat ditemukan
                  </div>
                </div>
              </div>
            </div>
            <p v-if="approvalError" class="mt-1 text-xs text-red-500">{{ approvalError }}</p>
          </div>
        </div>

        <!-- ── Section 2: Template & Upload ──────────────────────────── -->
        <div class="pt-6">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 pb-3">Template &amp; Upload</h3>

          <!-- Download Template -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-file-down" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ templateName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Unduh template sesuai jenis naskah</p>
              </div>
            </div>
            <UButton icon="i-lucide-download" color="primary" variant="soft" size="sm" class="shrink-0"
              @click="downloadTemplate">
              Download Template
            </UButton>
          </div>

          <!-- Upload Naskah -->
          <div class="flex flex-col gap-2 py-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-upload" class="w-4 h-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Unggah Naskah</h4>
              <span class="text-xs text-gray-400">(.docx)</span>
            </div>
            <FileUpload :model-value="naskahFiles" :multiple="false" accept=".docx"
              @update:model-value="onNaskahFiles" />
          </div>

          <div v-if="uploadStatus === 'reading'" class="flex items-center gap-2 text-sm text-primary-600 py-2">
            <UIcon name="i-lucide-loader-circle" class="w-4 h-4 animate-spin" />
            Sistem membaca naskah…
          </div>

          <!-- Pratinjau docx inline (render langsung di bawah upload) -->
          <div v-if="previewFile" class="py-4">
            <div class="flex items-center gap-2 mb-3">
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Pratinjau</h4>
              <button
                type="button"
                class="ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:border-primary-700 dark:hover:text-primary-300 transition-colors"
                @click="previewCollapsed = !previewCollapsed"
              >
                <UIcon
                  :name="previewCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                  class="w-3.5 h-3.5"
                />
                {{ previewCollapsed ? 'Tampilkan' : 'Sembunyikan' }}
              </button>
            </div>
            <div
              v-show="!previewCollapsed"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-auto max-h-[500px] relative">
              <div v-if="previewLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 z-10">
                <div class="flex flex-col items-center gap-2">
                  <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
                  <span class="text-sm text-gray-500">Memuat pratinjau...</span>
                </div>
              </div>
              <div ref="previewContainer" class="docx-preview-container"></div>
            </div>
          </div>

          <div class="flex flex-col gap-2 py-3 border-t border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Dokumen Pendukung</h4>
              <span class="text-xs text-gray-400">(opsional)</span>
            </div>
            <FileUpload :model-value="pendukungFiles" :multiple="true" accept=".pdf,application/pdf" :previewable="true"
              label="+ Unggah Dokumen Pendukung" @update:model-value="onPendukungFiles" />
          </div>
        </div>

        <!-- ── Section 3: Butuh Legal Drafting (konfirmasi akhir) ───── -->
        <div class="pt-6">
          <div
            class="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/10 p-4 sm:p-5">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Butuh Legal Drafting?</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Menentukan alur persetujuan naskah</p>
                  </div>
                  <div class="flex gap-2">
                    <button type="button"
                      class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
                      :class="form.butuhLegal
                        ? 'border-primary-500 bg-white dark:bg-gray-800'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                      @click="form.butuhLegal = true">
                      <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        :class="form.butuhLegal ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'">
                        <span v-if="form.butuhLegal" class="w-2 h-2 rounded-full bg-primary-500" />
                      </span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Ya</span>
                    </button>
                    <button type="button"
                      class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
                      :class="!form.butuhLegal
                        ? 'border-primary-500 bg-white dark:bg-gray-800'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                      @click="form.butuhLegal = false">
                      <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        :class="!form.butuhLegal ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'">
                        <span v-if="!form.butuhLegal" class="w-2 h-2 rounded-full bg-primary-500" />
                      </span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Tidak</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Section 4: Tanda Tangan (digital / fisik) ─────────────── -->
        <div class="pt-6">
          <div
            class="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/10 p-4 sm:p-5">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-pen-tool" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Tanda Tangan</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Metode penandatanganan naskah</p>
                  </div>
                  <div class="flex gap-2">
                    <button type="button"
                      class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
                      :class="form.signOption === 'qr_only'
                        ? 'border-primary-500 bg-white dark:bg-gray-800'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                      @click="form.signOption = 'qr_only'">
                      <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        :class="form.signOption === 'qr_only' ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'">
                        <span v-if="form.signOption === 'qr_only'" class="w-2 h-2 rounded-full bg-primary-500" />
                      </span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Digital</span>
                    </button>
                    <button type="button"
                      class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
                      :class="form.signOption === 'ttd_basah'
                        ? 'border-primary-500 bg-white dark:bg-gray-800'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                      @click="form.signOption = 'ttd_basah'">
                      <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        :class="form.signOption === 'ttd_basah' ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'">
                        <span v-if="form.signOption === 'ttd_basah'" class="w-2 h-2 rounded-full bg-primary-500" />
                      </span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Fisik</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action bar: Draft & Kirim (langsung di form, tidak pakai slideover) -->
        <div class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800">
          <UButton label="Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text" class="px-8"
            :disabled="!dokumenOk || saving" @click="handleSaveDraft" />
          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" class="px-8 font-bold"
            :disabled="!dokumenOk || saving" @click="handleConfirmKirim" />
        </div>
      </div>
    </UCard>

    <!-- Konfirmasi Draft -->
    <ConfirmModal v-model="showDraftConfirm" title="Simpan Draft?"
      description="Naskah akan disimpan sebagai draft dan dapat dilihat di halaman Draf."
      variant="primary" :loading="saving" @confirm="confirmSaveDraft" />

    <!-- Konfirmasi Kirim -->
    <ConfirmModal v-model="showKirimConfirm" title="Kirim Naskah?"
      description="Naskah akan dikirim untuk persetujuan berjenjang. Tindakan ini tidak dapat dibatalkan."
      variant="primary" :loading="saving" @confirm="doKirim" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { CalendarDate, parseDate } from '@internationalized/date';
import { renderAsync } from 'docx-preview';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import type { BuatNaskahPayload, JenisNaskah, ApprovalItem, NaskahDetail, Penandatangan } from '~/types/naskah-lainnya';
import { JENIS_LABELS, JENIS_FORMAT_PENOMORAN } from '~/types/naskah-lainnya';
import type { Klasifikasi } from '~/types/klasifikasi';
import type { Verifikator } from '~/types/digsig';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const { t } = useI18n();
const { canAccessPage } = useFeatureAccess();
const { getKlasifikasi } = useKlasifikasi();
const { getConfigDigsig } = useDigsig();
const { user, getProfile } = useAuth();
const { apiGet } = useApi();
const alertState = useAlertState();
const route = useRoute();
const { create, update, kirim, uploadDokumen, uploadDokumenTambahan, getTemplateUrl, createdId, fetchDetail, detail } = useNaskahLainnya();
const { verifikatorList, fetchVerifikator } = useNaskahDinas();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: t('buat_naskah'), to: '#' },
]);

const jenisOptions = Object.entries(JENIS_LABELS).map(([value, label]) => ({ label: `${value} — ${label}`, value }));

function labelJenis(j: string) {
  return JENIS_LABELS[j as JenisNaskah] ?? j;
}

// Penandatangan: dari data verifikator (GET /digsig/document/verifikator), format TulisInputPenerima.
// Sort by org hierarchy: Direktur > GM > VP > Manager > lainnya (sama dengan nota-dinas).
const HIERARCHY_ORDER: Record<string, number> = {
  'direktur utama': 1, 'president director': 1,
  'direktur': 2, 'director': 2,
  'general manager': 3, 'gm': 3,
  'evp': 3, 'senior vice president': 3, 'svp': 3,
  'vice president': 4, 'vp': 4,
  'manager': 5,
};
const getHierarchyRank = (jabatan: string): number => {
  const text = (jabatan || '').toLowerCase();
  for (const [keyword, rank] of Object.entries(HIERARCHY_ORDER)) {
    if (text.includes(keyword)) return rank;
  }
  return 99;
};
const penandatanganItems = computed(() =>
  [...verifikatorList.value]
    .sort((a, b) => getHierarchyRank(a.jabatan) - getHierarchyRank(b.jabatan))
    .map((v) => ({
      label: `${v.nama} — ${v.jabatan}`,
      labelJob: v.jabatan,
      value: String(v.persnum),
      raw: v,
    })),
);
const slotSigners = ref<(string | null)[]>([]);

// Sifat memakai pola object-ref (sama dengan nota-dinas & semua page korespondensi):
// TulisInputSifat meng-emmit object {label,value}, string value diekstrak di buildPayload.
// Nilai underscore (sangat_rahasia, …) sesuai DTO BE & opsi internal InputSifat.
const sifatOptions = [
  { label: 'Biasa', value: 'biasa' },
  { label: 'Terbatas', value: 'terbatas' },
  { label: 'Rahasia', value: 'rahasia' },
  { label: 'Sangat Rahasia', value: 'sangat_rahasia' },
  { label: 'Terbuka', value: 'terbuka' },
];
const selectedSifat = ref<{ label: string; value: string } | null>(null);

const form = ref<BuatNaskahPayload & { penandatanganList: Penandatangan[] }>({
  jenis: 'PER' as JenisNaskah,
  nomor: '',
  klasifikasi: '',
  penandatangan: { nama: '', jabatan: '' },
  penandatanganList: [],
  sifat: 'biasa',
  signOption: 'qr_only',
  butuhLegal: true,
  perihal: '',
});

// ── Deteksi jumlah penandatangan (N) dari template-signers per jenis ──
// GET /naskah-lainnya/template-signers/:jenis → { data: { count, slots: [{index}] } }
const signerSlotCount = ref(0);
const signerSlots = ref<{ index: number }[]>([]);
const loadingSigners = ref(false);

async function fetchTemplateSigners(jenis: string) {
  if (!jenis) {
    signerSlotCount.value = 0;
    signerSlots.value = [];
    slotSigners.value = [];
    form.value.penandatanganList = [];
    return;
  }
  loadingSigners.value = true;
  try {
    const res = await apiGet<{ data: { count: number; slots: { index: number }[] } }>(
      `/naskah-lainnya/template-signers/${encodeURIComponent(jenis)}`,
    );
    const { count, slots } = res.data;
    signerSlotCount.value = count;
    signerSlots.value = slots;
    // Reset semua slot agar tidak ada penandatangan lawas yang tertinggal saat ganti jenis/count.
    slotSigners.value = Array.from({ length: count }, () => null);
    form.value.penandatanganList = Array.from(
      { length: count },
      () => ({ nama: '', jabatan: '' }),
    );
  } catch {
    // Template mungkin tidak punya placeholder tanda_tangan_N → N=0, fase signing dilewati.
    signerSlotCount.value = 0;
    signerSlots.value = [];
    slotSigners.value = [];
    form.value.penandatanganList = [];
  } finally {
    loadingSigners.value = false;
  }
}

watch(() => form.value.jenis, (jenis) => { fetchTemplateSigners(jenis as string); });

// Opsi per slot: tandai item yang sudah dipilih di slot lain sebagai disabled.
function slotItems(slotIndex: number) {
  return penandatanganItems.value.map((item) => ({
    ...item,
    disabled: slotSigners.value.some(
      (val, idx) => idx !== slotIndex && val === item.value,
    ),
  }));
}

function selectedSlotLabel(slotIndex: number) {
  const value = slotSigners.value[slotIndex];
  const item = value != null
    ? penandatanganItems.value.find((p) => String(p.value) === String(value))
    : undefined;
  return item?.label || form.value.penandatanganList[slotIndex]?.nama || '';
}

function resolveSlotSigner(value: string | null, fallbackIndex: number): Penandatangan {
  if (value == null) return { nama: '', jabatan: '' };
  const item = penandatanganItems.value.find((p) => String(p.value) === String(value));
  if (item) {
    return {
      positionId: String(item.raw?.positionId ?? ''),
      persnum: item.raw?.persnum,
      nama: item.raw?.nama || item.label,
      jabatan: item.raw?.jabatan || item.labelJob || '',
    };
  }
  // Fallback: data yang sudah tersimpan (draft lawas / tidak cocok dengan daftar pejabat).
  return form.value.penandatanganList[fallbackIndex] ?? { nama: '', jabatan: '' };
}

function findSignerValue(stored: Partial<Penandatangan>): string | null {
  const match = penandatanganItems.value.find((item) => {
    const raw = item.raw;
    if (stored.persnum != null && raw?.persnum === stored.persnum) return true;
    if (stored.positionId != null && String(raw?.positionId) === String(stored.positionId)) return true;
    if (stored.nama != null && raw?.nama?.toLowerCase() === stored.nama.toLowerCase()) return true;
    return false;
  });
  return match ? String(match.value) : null;
}

// Sinkronkan slotSigners → form.penandatanganList (rantai N entry, urutan = urutan penandatangan).
watch(slotSigners, (values) => {
  form.value.penandatanganList = values.map((val, i) => resolveSlotSigner(val, i));
}, { deep: true });

const templateName = computed(() => `Template ${labelJenis(form.value.jenis)}.docx`);

// ── Klasifikasi (komponen TulisInputKlasifikasi, pola nota-dinas) ──
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const selectedKlasifikasiId = ref<string | null>(null);

// ── Tanggal (komponen TulisInputTanggal — model = CalendarDate) ──
const _today = new Date();
const tanggalDate = ref<CalendarDate>(new CalendarDate(_today.getFullYear(), _today.getMonth() + 1, _today.getDate()));

// Label tampil untuk select borderless (pola TulisInputSifat: resolve label dari value).
const jenisLabel = computed(() => jenisOptions.find((o) => o.value === form.value.jenis)?.label ?? '');

// Placeholder field Nomor: template format per jenis ({TIPE} → kode jenis) sebagai panduan struktur.
// Teks bantuan lengkap (otomatis/manual & unik) ada di tooltip ikon ℹ di label, bukan di bawah field.
const nomorPlaceholder = computed(() => JENIS_FORMAT_PENOMORAN[form.value.jenis].replace('{TIPE}', form.value.jenis));

// ── Approval berjenjang / Verifikator: atasan managerial pengaju dalam 1 divisi/direktorat
//    (sama dengan penutupan berkas) — GET /org-data/atasan-managerial/:positionId ──
const approvalCandidates = ref<Verifikator[]>([]);
const selectedApprovals = ref<Verifikator[]>([]);
const showApprovalDropdown = ref(false);
const approvalSearchQuery = ref('');
const approvalDropdownRef = ref<HTMLElement | null>(null);
const approvalSearchRef = ref<HTMLInputElement | null>(null);
const approvalError = ref('');

// Kandidat: belum dipilih, dan berbeda dari penandatangan.
const selectedSignerPersnums = computed(() => new Set(
  (form.value.penandatanganList ?? [])
    .map((s) => s?.persnum)
    .filter((p): p is number => p != null),
));
const availableApprovals = computed(() => {
  const selectedSet = new Set(selectedApprovals.value.map((v) => v.persnum));
  return approvalCandidates.value
    .filter((v) => !selectedSet.has(v.persnum))
    .filter((v) => !selectedSignerPersnums.value.has(v.persnum));
});

const filteredApprovals = computed(() => {
  const q = approvalSearchQuery.value.toLowerCase().trim();
  if (!q) return availableApprovals.value;
  return availableApprovals.value.filter((v) =>
    (v.nama || '').toLowerCase().includes(q) ||
    (v.jabatan || '').toLowerCase().includes(q),
  );
});

const onApprovalSelect = (persnum: number) => {
  const v = approvalCandidates.value.find((x) => x.persnum === persnum);
  if (!v) return;
  if (selectedSignerPersnums.value.has(persnum)) {
    approvalError.value = 'Approver tidak boleh sama dengan penandatangan';
    return;
  }
  if (!selectedApprovals.value.some((x) => x.persnum === persnum)) {
    selectedApprovals.value.push(v);
    approvalError.value = '';
  }
  showApprovalDropdown.value = false;
  approvalSearchQuery.value = '';
};

const removeApproval = (persnum: number) => {
  selectedApprovals.value = selectedApprovals.value.filter((v) => v.persnum !== persnum);
};

// Focus search saat dropdown dibuka
watch(showApprovalDropdown, (val) => {
  if (val) {
    nextTick(() => approvalSearchRef.value?.focus());
  } else {
    approvalSearchQuery.value = '';
  }
});

// Close dropdown saat klik di luar
const handleClickOutsideApproval = (e: MouseEvent) => {
  if (approvalDropdownRef.value && !approvalDropdownRef.value.contains(e.target as Node)) {
    showApprovalDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutsideApproval);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideApproval);
});

const uploadStatus = ref<'idle' | 'reading' | 'done' | 'error'>('idle');
const detected = ref<{ perihal: string; tanggal: string } | null>(null);
const saving = ref(false);
const dokumenOk = computed(() => uploadStatus.value === 'done' || previewFile.value !== null);

const naskahFiles = ref<File[]>([]);
const pendukungFiles = ref<File[]>([]);

// ── Pratinjau docx (render file yang diupload via docx-preview) ──
const previewFile = computed(() => naskahFiles.value[naskahFiles.value.length - 1] ?? null);
const previewContainer = ref<HTMLElement | null>(null);
const previewLoading = ref(false);
const previewCollapsed = ref(false);

// Render docx inline — trigger saat file berubah.
watch(previewFile, async (file) => {
  if (!file) return;
  previewCollapsed.value = false;
  previewLoading.value = true;
  await nextTick();
  try {
    let el = previewContainer.value;
    // Retry: tunggu DOM render jika container belum ready (saat load draft)
    if (!el) {
      await new Promise(r => setTimeout(r, 100));
      await nextTick();
      el = previewContainer.value;
    }
    if (!el) { previewLoading.value = false; return; }
    el.innerHTML = '';
    await renderAsync(file, el, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
    });
  } catch {
    useToast().add({ title: 'Gagal merender pratinjau dokumen', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
});

// ── Initial load (pola nota-dinas: skeleton + fetch klasifikasi) ──
const isLoadingData = ref(true);
const loadingMessage = ref('');

onMounted(async () => {
  loadingMessage.value = 'Memuat...';
  isLoadingData.value = true;

  try {
    klasifikasiStatus.value = 'loading';
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = 'success';
  } catch {
    klasifikasiStatus.value = 'error';
  }

  // Penandatangan: dari /digsig/document/verifikator (semua personil area).
  try {
    await fetchVerifikator({ chiefOnly: false });
  } catch {
    // abaikan — dropdown penandatangan akan kosong
  }

  // Verifikator berjenjang: atasan managerial pengaju dalam 1 divisi/direktorat
  // (logic sama dengan penutupan berkas) — GET /org-data/atasan-managerial/:positionId.
  // Delegasi SE: user.position adalah jabatan yang didelegasikan (mis. EVP), bukan
  // jabatan asli pengaju — resolve posisi asli via /org-data/my-position?persnum.
  try {
    if (!user.value) await getProfile();
    let positionId = Number(user.value?.position);
    if (user.value?.position_status === 'SE') {
      try {
        const myPos: any = await apiGet(`/org-data/my-position?persnum=${user.value.persnum}`);
        const row = myPos?.data ?? myPos;
        if (row?.position) positionId = Number(row.position);
      } catch (e) {
        console.warn('[tulis-naskah] Gagal resolve posisi asli, fallback ke posisi delegasi:', e);
      }
    }
    const atasanRes: any = await apiGet(`/org-data/atasan-managerial/${positionId}`);
    const atasans: any[] = Array.isArray(atasanRes?.data) ? atasanRes.data : [];
    approvalCandidates.value = atasans.map((r: any) => ({
      persnum: Number(r.persnum_person),
      nama: r.persnum_person_text || 'Tanpa nama',
      positionId: Number(r.position) || undefined,
      jabatan: r.position_text || '',
    } as Verifikator));
  } catch {
    // abaikan — dropdown verifikator akan kosong, form tetap bisa dipakai (fallback default workflow)
  } finally {
    isLoadingData.value = false;
  }

  // Load draft jika ada ?draft_id (lanjut edit dari halaman draf)
  const draftId = route.query.draft_id as string;
  if (draftId) {
    try {
      await fetchDetail(draftId);
      const d = detail.value as NaskahDetail | null;
      if (d) {
        createdId.value = d.id;
        form.value.jenis = d.jenis as JenisNaskah;
        form.value.nomor = d.nomor ?? '';
        form.value.perihal = d.perihal ?? '';
        selectedSifat.value = sifatOptions.find((o) => o.value === d.sifat) ?? null;
        form.value.signOption = d.signOption === 'digsig' ? 'qr_only' : (d.signOption ?? 'qr_only');
        form.value.butuhLegal = d.butuhLegal;
        form.value.penandatangan = d.penandatangan;
        if (d.klasifikasi) {
          const found = klasifikasiList.value.find((k: any) => k.klasifikasi === d.klasifikasi);
          if (found) selectedKlasifikasiId.value = found.id;
        }
        if (d.tanggal) {
          try { tanggalDate.value = parseDate(d.tanggal); } catch { /* invalid date */ }
        }
        // Restore approval chain
        if (d.approvalChain?.length) {
          selectedApprovals.value = d.approvalChain.map((a) => ({
            persnum: a.persnum ?? (Number(a.positionId) || 0),
            positionId: a.positionId ?? undefined,
            nama: a.nama,
            jabatan: a.jabatan,
          } as Verifikator));
        }
        // Restore jumlah slot dari template restored jenis, lalu isi per-slot.
        await fetchTemplateSigners(d.jenis as string);
        const detailPenandatanganList = (d as NaskahDetail).penandatanganList;
        const storedSigners: Partial<Penandatangan>[] = [];
        if (Array.isArray(detailPenandatanganList) && detailPenandatanganList.length) {
          storedSigners.push(...detailPenandatanganList);
        } else if (Array.isArray((d as any).penandatangan) && (d as any).penandatangan.length) {
          storedSigners.push(...(d as any).penandatangan as Penandatangan[]);
        } else if (d.penandatangan?.nama) {
          storedSigners.push(d.penandatangan);
        }
        if (storedSigners.length) {
          // Simpan data asli sebagai fallback bila tidak cocok dengan daftar pejabat.
          form.value.penandatanganList = Array.from(
            { length: signerSlotCount.value },
            (_, i) => {
              const sp = storedSigners[i];
              if (!sp) return { nama: '', jabatan: '' };
              return {
                positionId: String(sp.positionId ?? ''),
                persnum: sp.persnum,
                nama: sp.nama || '',
                jabatan: sp.jabatan || '',
              } as Penandatangan;
            },
          );
          slotSigners.value = signerSlots.value.map((_, i) => findSignerValue(storedSigners[i]));
        }
        // Restore file naskah + preview dari BE proxy
        if (d.id) {
          try {
            const { apiGet } = useApi();
            const blob = await apiGet(`/naskah-lainnya/${d.id}/file`, { responseType: 'blob' });
            const naskahDoc = d.dokumen.find((doc) => doc.tipe === 'naskah');
            const naskahNama = naskahDoc?.nama || `${d.nomor || 'naskah'}.docx`;
            const file = new File([blob], naskahNama, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            naskahFiles.value = [file];
            uploadStatus.value = 'done';
            await nextTick();
          } catch {
            useToast().add({ title: 'Gagal memuat pratinjau dokumen', description: 'File dapat diunggah ulang untuk melihat pratinjau.', color: 'warning' });
          }
        }

        // Restore dokumen pendukung dari BE
        if (d.dokumen?.length) {
          const pendukungDocs = d.dokumen.filter((doc) => doc.tipe === 'pendukung');
          if (pendukungDocs.length) {
            try {
              const { apiGet } = useApi();
              const files = [];
              for (const doc of pendukungDocs) {
                const blob = await apiGet(`/naskah-lainnya/${d.id}/dokumen/${doc.id}/download`, { responseType: 'blob' });
                files.push(new File([blob], doc.nama, { type: blob.type || 'application/pdf' }));
              }
              pendukungFiles.value = files;
            } catch {
              // abaikan — pendukungFiles tetap kosong
            }
          }
        }
      }
    } catch {
      // abaikan — form kosong jika draft tidak ditemukan
    }
  }
});

// Payload: klasifikasi dikirim sebagai KODE (bukan id), tanggal dari CalendarDate (YYYY-MM-DD),
// approval berjenjang sesuai urutan pemilihan.
// Penandatangan: kirim single object bila hanya 1 (BE wrap ke array),
// kirim array bila user pilih multiple.
const buildPayload = (): BuatNaskahPayload => {
  // Penandatangan dari form.penandatanganList (rantai N entry, urutan = signing order).
  // Catatan: BE PenandatanganDto hanya menerima { nama, jabatan, positionId?, persnum? }
  // (forbidNonWhitelisted) — urutan signing ditentukan array order, jadi kirim hanya
  // field yang di-whitelist (jangan leak `index`/field UI lain).
  const signers = (form.value.penandatanganList ?? []).map((s) => ({
    nama: s.nama,
    jabatan: s.jabatan,
    positionId: s.positionId,
    persnum: s.persnum,
  }));
  // N=0 (template tanpa placeholder TTD): kirim array kosong, bukan {nama:'',jabatan:''}
  // (yang akan 400 karena @IsNotEmpty). BE simpan chain=null → signing di-skip.
  const penandatangan: Penandatangan | Penandatangan[] =
    signers.length === 0 ? []
      : signers.length === 1 ? signers[0]
        : signers;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { penandatanganList: _, ...rest } = form.value;

  return {
    ...rest,
    nomor: form.value.nomor || undefined,
    // sifat diambil dari object-ref selectedSifat (pola TulisInputSifat), bukan form.value.sifat
    // yang tidak pernah di-update oleh select (select meng-emmit object ke selectedSifat).
    sifat: selectedSifat.value?.value || 'biasa',
    penandatangan,
    klasifikasi: klasifikasiList.value.find((k) => k.id === selectedKlasifikasiId.value)?.klasifikasi ?? '',
    tanggal: tanggalDate.value?.toString() ?? detected.value?.tanggal ?? undefined,
    approval: selectedApprovals.value.length
      ? selectedApprovals.value.map((v): ApprovalItem => ({
          positionId: String(v.positionId ?? ''),
          nama: v.nama || `Persnum ${v.persnum}`,
          jabatan: v.jabatan || '',
        }))
      : undefined,
  };
};

async function downloadTemplate() {
  try {
    const res = await getTemplateUrl(form.value.jenis);
    window.open(res.data, '_blank');
  } catch {
    useToast().add({
      title: 'Template belum tersedia',
      description: `Template ${labelJenis(form.value.jenis)} belum di-upload ke server. Hubungi admin.`,
      color: 'warning',
    });
  }
}

function onNaskahFiles(files: File[]) {
  // Tolak unggah bila penandatangan belum lengkap: onUpload() memanggil create()
  // yang butuh penandatangan valid (BE @IsNotEmpty pada nama/jabatan); tanpa ini
  // unggah gagal diam-diam. validateSigners() sudah memunculkan toast peringatan.
  if (files.length && !validateSigners()) {
    naskahFiles.value = [];
    return;
  }
  naskahFiles.value = files;
  if (files.length) {
    onUpload(files[files.length - 1]);
  } else {
    // File dihapus — clear form nomor, perihal, tanggal, dan state
    form.value.nomor = '';
    form.value.perihal = '';
    tanggalDate.value = new CalendarDate(_today.getFullYear(), _today.getMonth() + 1, _today.getDate());
    detected.value = null;
    uploadStatus.value = 'idle';
    if (previewContainer.value) previewContainer.value.innerHTML = '';
  }
}

async function onPendukungFiles(files: File[]) {
  // Validasi: hanya PDF
  const invalid = files.filter((f) => f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf'));
  if (invalid.length) {
    useToast().add({ title: 'Format tidak didukung', description: `${invalid.length} file ditolak. Hanya PDF yang diperbolehkan.`, color: 'error' });
  }
  const validFiles = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  pendukungFiles.value = validFiles;
  if (!validFiles.length) return;
  if (!createdId.value) {
    await create(buildPayload());
  }
  for (const file of validFiles) {
    try {
      await uploadDokumenTambahan(createdId.value!, 'pendukung', file);
    } catch {
      useToast().add({ title: 'Gagal upload dokumen pendukung', description: file.name, color: 'error' });
    }
  }
  useToast().add({ title: `${validFiles.length} dokumen pendukung diunggah`, color: 'success' });
}

async function onUpload(file: File) {
  uploadStatus.value = 'reading';
  try {
    if (!createdId.value) {
      await create(buildPayload());
    }
    const res = await uploadDokumen(createdId.value!, file);
    detected.value = res.data.parameter;

    // Isi form perihal dari hasil docx-reader (nomor di-generate sistem saat kirim)
    // (tidak perlu call update() — buildPayload() di kirim/draft sudah include form.value)
    if (res.data.parameter.perihal) form.value.perihal = res.data.parameter.perihal;

    // Isi tanggal dari dokumen HANYA jika user belum memilih manual.
    if (!tanggalDate.value && res.data.parameter.tanggal) {
      try {
        tanggalDate.value = parseDate(res.data.parameter.tanggal);
      } catch {
        // format tanggal tidak dikenal — biarkan kosong
      }
    }

    uploadStatus.value = 'done';
  } catch (e) {
    uploadStatus.value = 'error';
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    useToast().add({
      title: 'Gagal mengunggah naskah',
      description: errMsg || 'Periksa penandatangan & isi naskah, lalu coba lagi.',
      color: 'error',
    });
  }
}

// ── Validasi: bila template mendeteksi N slot, semua harus terisi sebelum kirim/draft ──
function validateSigners(): boolean {
  if (signerSlotCount.value <= 0) return true;
  const chain = form.value.penandatanganList ?? [];
  const isValidEntry = (s?: Penandatangan | null) => !!s && !!(s.persnum || s.positionId || s.nama);
  if (chain.length !== signerSlotCount.value || !chain.every(isValidEntry)) {
    useToast().add({
      title: `Isi semua ${signerSlotCount.value} penandatangan`,
      description: 'Setiap slot penandatangan wajib diisi sesuai urutan.',
      color: 'warning',
    });
    return false;
  }
  return true;
}

// ── Draft ──
const showDraftConfirm = ref(false);

async function handleSaveDraft() {
  showDraftConfirm.value = true;
}

async function confirmSaveDraft() {
  showDraftConfirm.value = false;
  if (!validateSigners()) return;
  saving.value = true;
  try {
    if (!createdId.value) {
      await create(buildPayload());
    } else {
      // Simpan form terbaru (penandatangan, verifikator, sifat, dll) ke BE
      await update(createdId.value, buildPayload());
    }
    useToast().add({ title: 'Draft disimpan', color: 'success' });
    navigateTo('/naskah-lainnya/draf');
  } finally {
    saving.value = false;
  }
}

// ── Kirim: pop up konfirmasi sebelum submit ──
const showKirimConfirm = ref(false);

function handleConfirmKirim() {
  showKirimConfirm.value = true;
}

const doKirim = async () => {
  showKirimConfirm.value = false;
  if (!validateSigners()) return;
  saving.value = true;
  try {
    if (!createdId.value) {
      await create(buildPayload());
    } else {
      await update(createdId.value, buildPayload());
    }
    if (!createdId.value) {
      useToast().add({ title: 'Unggah dokumen dahulu', color: 'warning' });
      return;
    }
    await kirim(createdId.value);
    useToast().add({ title: 'Naskah berhasil dikirim untuk approval', color: 'success' });
    navigateTo(`/naskah-lainnya/${createdId.value}`);
  } catch (e) {
    const rawMsg = e?.response?.data?.message || e?.message || 'Gagal mengirim naskah';
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    if (errMsg.includes('should not exist') || errMsg.includes('property')) {
      useToast().add({
        title: 'Template belum lengkap',
        description: 'Backend belum diperbarui. Hubungi admin untuk memperbarui server.',
        color: 'error',
      });
    } else {
      useToast().add({ title: 'Gagal mengirim', description: errMsg, color: 'error' });
    }
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
:deep(.docx-preview-container) {
  padding: 16px;
}
:deep(.docx-wrapper) {
  background: #fff !important;
  padding: 0 !important;
}
:deep(.docx-wrapper > section.docx) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  margin: 0 auto !important;
}
</style>
