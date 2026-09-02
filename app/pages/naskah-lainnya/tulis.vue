<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="relative">
    <LoadingOverlay
      :loading="isLoadingData && loadingMessage !== 'Memuat...'"
      :message="loadingMessage"
    />

    <PageHeader :title="$t('buat_naskah')" :items="breadcrumbs" />

    <UCard
      variant="soft"
      :ui="{
        root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
      }"
    >
      <!-- Skeleton loading (pola nota-dinas) -->
      <div
        v-if="isLoadingData && loadingMessage === 'Memuat...'"
        class="animate-pulse px-2 space-y-3"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2"
        >
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
        <UAlert
          v-if="isPhysicalMetadataMode"
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          title="Pelengkapan data naskah TTD fisik"
          description="Hanya data penandatangan yang disimpan sebagai arsip sistem. Perubahan ini tidak mengubah dokumen final, tahapan, atau alur persetujuan yang telah selesai."
          class="mb-2"
        />
        <!-- Banner revisi (naskah dikembalikan ke pemrakarsa) -->
        <UAlert
          v-if="isRevisi"
          icon="i-lucide-info"
          color="warning"
          variant="soft"
          title="Revisi naskah yang dikembalikan"
          description="Periksa catatan pengembalian di halaman detail. Lengkapi revisi (termasuk unggah ulang naskah dari template bila isi berubah), lalu Kirim untuk approval ulang."
          class="mb-2"
        />

        <!-- ── Section 0: Metode Tanda Tangan (di atas jenis naskah) ─── -->
        <div
          v-if="!isPhysicalMetadataMode"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border-2 border-primary-200 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-900/10 sm:p-5"
        >
          <div class="w-full sm:w-44 shrink-0">
            <span
              class="flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300"
            >
              <UIcon name="i-lucide-pen-tool" class="w-4 h-4" />
              Metode Tanda Tangan
            </span>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
              :class="
                form.signOption === 'qr_only'
                  ? 'border-primary-500 bg-primary-500 shadow-sm ring-2 ring-primary-500/30'
                  : 'border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700'
              "
              @click="selectSignOption('qr_only')"
            >
              <UIcon
                name="i-lucide-file-signature"
                class="w-5 h-5"
                :class="
                  form.signOption === 'qr_only'
                    ? 'text-white'
                    : 'text-primary-600 dark:text-primary-400'
                "
              />
              <span
                class="text-sm font-semibold"
                :class="
                  form.signOption === 'qr_only' ? 'text-white' : 'text-gray-900 dark:text-white'
                "
                >Digital</span
              >
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
              :class="
                form.signOption === 'ttd_basah'
                  ? 'border-primary-500 bg-primary-500 shadow-sm ring-2 ring-primary-500/30'
                  : 'border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700'
              "
              @click="selectSignOption('ttd_basah')"
            >
              <UIcon
                name="i-lucide-pen-line"
                class="w-5 h-5"
                :class="
                  form.signOption === 'ttd_basah'
                    ? 'text-white'
                    : 'text-primary-600 dark:text-primary-400'
                "
              />
              <span
                class="text-sm font-semibold"
                :class="
                  form.signOption === 'ttd_basah' ? 'text-white' : 'text-gray-900 dark:text-white'
                "
                >Fisik</span
              >
            </button>
          </div>
        </div>

        <!-- Jenis Naskah -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
        >
          <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
            >Jenis Naskah *</span
          >
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="form.jenis"
              :items="jenisSelectItems"
              value-key="value"
              label-key="searchLabel"
              searchable
              variant="none"
              class="w-full"
              :content="{ class: 'max-h-[380px]' } as any"
              :search-attributes="['searchLabel']"
              placeholder="Pilih jenis naskah"
              :search-input="{ placeholder: 'Cari jenis naskah…' }"
              :ui="
                {
                  base: '!px-0 !bg-transparent w-full dark:text-white',
                  ring: 'ring-0',
                  shadow: 'shadow-none',
                  width: 'w-full sm:w-auto max-w-[calc(100vw-2rem)]',
                } as any
              "
            >
              <template #item="{ item }">
                <div class="flex flex-col min-w-0 w-full overflow-hidden">
                  <span
                    class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate"
                  >
                    {{ item.value }} - {{ item.labelText }}
                  </span>
                </div>
              </template>

              <template #default>
                <span
                  v-if="selectedJenisObj"
                  class="truncate text-sm block w-full text-left dark:text-white"
                >
                  {{ selectedJenisObj.value }} - {{ selectedJenisObj.labelText }}
                </span>
                <span
                  v-else
                  class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left"
                >
                  Pilih jenis naskah
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- Nomor (editable; otomatis saat kirim atau isi manual sesuai format) -->
        <div
          class="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0 flex items-center gap-1"
          >
            Nomor
            <UTooltip
              :text="
                isPhysicalSigning
                  ? isPhysicalMetadataMode
                    ? 'Nomor dapat dikoreksi sebelum dokumen final TTD fisik diunggah.'
                    : 'Kosongkan agar nomor dibuat otomatis setelah seluruh penandatangan menyetujui Naskah Draft, atau isi nomor manual.'
                  : 'Kosongkan untuk penomoran otomatis saat tanda tangan. Jika diisi manual, harus sesuai format jenis naskah & unik.'
              "
            >
              <UIcon
                name="i-lucide-info"
                class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help"
              />
            </UTooltip>
          </span>
          <UInput
            v-model="form.nomor"
            :placeholder="
              isPhysicalSigning ? 'Terbit setelah approval penandatangan' : nomorPlaceholder
            "
            class="w-full sm:flex-1"
            variant="none"
            :ui="{ base: 'text-sm text-gray-900 dark:text-white px-0' }"
          />
        </div>

        <!-- Perihal (auto-fill dari upload, disabled) -->
        <div
          class="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
        >
          <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
            >Perihal</span
          >
          <UInput
            v-model="form.perihal"
            disabled
            placeholder="Otomatis terisi setelah unggah naskah"
            class="w-full sm:flex-1"
            variant="none"
            :ui="{
              base: 'disabled:opacity-60 cursor-not-allowed text-sm text-gray-900 dark:text-white px-0',
            }"
          />
        </div>

        <!-- Klasifikasi (komponen Tulis, pola nota-dinas) -->
        <TulisInputKlasifikasi
          v-model="selectedKlasifikasiId"
          :items="klasifikasiList"
          :loading="klasifikasiStatus === 'loading'"
        />

        <!-- Tanggal (komponen Tulis, pola nota-dinas) -->
        <TulisInputTanggal v-model="tanggalDate" :label="$t('f_tanggal_surat')" />

        <!-- Penandatangan dinamis: satu single-select per slot -->
        <div
          v-if="editableSignerSlots.length > 0"
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0"
          >
            Urutan Penandatangan
            <span class="block text-xs text-gray-400 font-normal"
              >({{ editableSignerSlots.length }} slot)</span
            >
          </span>
          <div class="flex-1 w-full space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{
                isPhysicalMetadataMode
                  ? 'Data ini hanya dicatat di sistem dan tidak mengaktifkan proses tanda tangan kembali.'
                  : isPhysicalSigning
                    ? 'Penandatangan akan meninjau dan menyetujui Naskah Draft secara berjenjang. Nomor terbit setelah penandatangan terakhir menyetujui.'
                    : 'Urutan sesuai posisi placeholder tanda_tangan_N di template. Pilih penandatangan untuk setiap slot sesuai urutan penandatangan.'
              }}
            </p>
            <div
              v-for="slot in editableSignerSlots"
              :key="slot.index"
              class="flex items-center gap-2"
            >
              <span
                class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0"
              >
                {{ slot.index }}
              </span>
              <USelectMenu
                v-model="slotSigners[slot.index - 1]"
                :items="slotItems(slot.index - 1)"
                value-key="value"
                :searchable="true"
                variant="none"
                class="flex-1 w-full"
                :content="{ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any"
                :ui="
                  {
                    base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                    input: 'w-full',
                    value: 'w-full',
                    viewport: 'max-h-[380px]',
                  } as any
                "
              >
                <template #default>
                  <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full cursor-pointer">
                    <span
                      v-if="selectedSlotLabel(slot.index - 1)"
                      class="text-sm text-left truncate text-gray-900 dark:text-white"
                    >
                      {{ selectedSlotLabel(slot.index - 1) }}
                    </span>
                    <span v-else class="text-sm text-gray-400"
                      >Pilih penandatangan {{ slot.index }}</span
                    >
                  </div>
                </template>
              </USelectMenu>
              <button
                v-if="
                  (isPhysicalMetadataMode || isPhysicalSigning) && editableSignerSlots.length > 1
                "
                type="button"
                class="shrink-0 text-gray-400 transition-colors hover:text-error"
                :aria-label="`Hapus penandatangan ${slot.index}`"
                @click="removeSignerSlot(slot.index - 1)"
              >
                <UIcon name="i-lucide-x" class="size-4" />
              </button>
            </div>
            <UButton
              v-if="isPhysicalMetadataMode || isPhysicalSigning"
              color="primary"
              variant="soft"
              size="sm"
              icon="i-lucide-plus"
              @click="addSignerSlot"
              >Tambah Penandatangan</UButton
            >
          </div>
        </div>
        <div
          v-else-if="!isPhysicalMetadataMode && !loadingSigners && form.jenis"
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0"
          >
            Urutan Penandatangan
          </span>
          <p class="text-xs text-gray-400 flex-1 w-full">
            Template ini tidak memiliki placeholder penandatangan — fase signing akan dilewati.
          </p>
        </div>

        <!-- Sifat (komponen Tulis, pola nota-dinas) -->
        <TulisInputSifat v-model="selectedSifat" />

        <!-- Verifikator Berjenjang (boleh merangkap sebagai penandatangan) -->
        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-2 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0"
          >
            Verifikator
            <span class="block text-xs text-gray-400 font-normal">(berjenjang)</span>
          </span>
          <div class="flex-1 w-full space-y-2">
            <div v-if="selectedApprovals.length" class="space-y-2">
              <div
                v-for="(v, idx) in selectedApprovals"
                :key="v.persnum"
                class="flex items-center gap-2"
              >
                <span
                  class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0"
                >
                  {{ idx + 1 }}
                </span>
                <div class="flex min-h-[28px] flex-1 items-center gap-1.5 pr-10">
                  <span class="truncate text-sm text-left text-gray-900 dark:text-white">
                    {{ approvalLabel(v) }}
                  </span>
                </div>
                <button
                  type="button"
                  class="text-gray-400 hover:text-red-500 shrink-0"
                  @click="removeApproval(v.persnum)"
                  aria-label="Hapus verifikator"
                >
                  <UIcon name="i-lucide-x" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div v-if="approvalCandidates.length === 0" class="py-1 text-sm text-gray-400">
              Tidak ada data pejabat. Naskah akan menggunakan alur persetujuan bawaan.
            </div>
            <div v-else class="flex items-center gap-2">
              <span
                class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0"
              >
                {{ selectedApprovals.length + 1 }}
              </span>
              <USelectMenu
                v-model="approvalPicker"
                :items="approvalOptions"
                value-key="value"
                placeholder="Pilih verifikator…"
                searchable
                variant="none"
                class="flex-1 w-full"
                :content="{ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any"
                :search-input="{ placeholder: 'Cari nama atau jabatan…' }"
                :ui="
                  {
                    base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                    input: 'w-full',
                    value: 'w-full',
                    viewport: 'max-h-[380px]',
                  } as any
                "
              >
                <template #default>
                  <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full cursor-pointer">
                    <span class="text-sm text-gray-400">Pilih verifikator</span>
                  </div>
                </template>

                <template #item="{ item }">
                  <div class="flex flex-col min-w-0 w-full overflow-hidden">
                    <span
                      class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate"
                    >
                      {{ item.label }}
                    </span>
                    <span class="text-xs text-gray-500 block w-full truncate mt-0.5">
                      {{ item.jabatan || '' }}
                    </span>
                  </div>
                </template>
              </USelectMenu>
            </div>
          </div>
        </div>

        <!-- ── Section 2: Template & Upload ──────────────────────────── -->
        <div v-if="!isPhysicalMetadataMode" class="pt-6">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 pb-3">
            Template &amp; Upload
          </h3>

          <!-- Download Template -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-file-down"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ templateName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Unduh template sesuai jenis naskah
                </p>
              </div>
            </div>
            <UButton
              icon="i-lucide-download"
              color="primary"
              variant="soft"
              size="sm"
              class="shrink-0"
              @click="downloadTemplate"
            >
              Download Template
            </UButton>
          </div>

          <!-- Upload Naskah -->
          <div class="flex flex-col gap-2 py-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-upload" class="w-4 h-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {{ isPhysicalSigning ? 'Naskah Draft' : 'Unggah Naskah' }}
              </h4>
              <span class="text-xs text-gray-400">(.docx)</span>
            </div>
            <FileUpload
              :model-value="naskahFiles"
              :multiple="false"
              accept=".docx"
              :label="isPhysicalSigning ? 'Unggah Naskah Draft' : 'Unggah Naskah'"
              @update:model-value="onNaskahFiles"
            />
            <FileUpload
              v-if="isRevisi"
              v-model="revisiPdfFiles"
              :multiple="false"
              accept=".pdf,application/pdf"
              label="Unggah Versi PDF"
              description="Wajib bersama DOCX revisi dan harus memiliki isi yang sama"
            />
            <UAlert
              v-if="isRevisi && hasDirtyNaskah !== !!revisiPdfFiles.length"
              icon="i-lucide-triangle-alert"
              color="warning"
              variant="soft"
              description="Revisi wajib dilengkapi dengan pasangan DOCX dan PDF."
            />
          </div>

          <div
            v-if="uploadStatus === 'reading'"
            class="flex items-center gap-2 text-sm text-primary-600 py-2"
          >
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
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-auto max-h-[500px] relative"
            >
              <div
                v-if="previewLoading"
                class="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 z-10"
              >
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
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Dokumen Pendukung
              </h4>
              <span class="text-xs text-gray-400">(opsional)</span>
            </div>
            <FileUpload
              :model-value="pendukungFiles"
              :multiple="true"
              accept=".pdf,application/pdf"
              :previewable="true"
              label="+ Unggah Dokumen Pendukung"
              @update:model-value="onPendukungFiles"
            />
          </div>
        </div>

        <div
          v-if="isPhysicalMetadataMode"
          class="rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-900/10 sm:p-5"
        >
          <div class="mb-3 flex items-start gap-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
            >
              <UIcon name="i-lucide-file-up" class="size-5" />
            </span>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Dokumen Final TTD Fisik
              </h3>
              <p class="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Unggah naskah yang sudah ditandatangani fisik. Upload berhasil akan mengubah status
                menjadi Selesai - Final.
              </p>
            </div>
          </div>
          <FileUpload
            :model-value="manualFinalFiles"
            :multiple="false"
            accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            :disabled="manualFinalBusy"
            label="Unggah Dokumen Final"
            @update:model-value="onManualFinalFiles"
          />
          <p
            v-if="detail?.manualFinalFileUploaded"
            class="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400"
          >
            <UIcon name="i-lucide-circle-check" class="size-3.5" />
            Dokumen final sudah tersimpan dan dapat diganti.
          </p>
        </div>

        <!-- ── Section 3: Butuh Legal Drafting (konfirmasi akhir) ───── -->
        <div v-if="!isPhysicalMetadataMode" class="pt-6">
          <div
            class="rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/10 p-4 sm:p-5"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-shield-check"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                      Butuh Legal Drafting?
                    </h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Menentukan alur persetujuan naskah
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
                      :class="
                        form.butuhLegal
                          ? 'border-primary-500 bg-white dark:bg-gray-800'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      "
                      @click="form.butuhLegal = true"
                    >
                      <span
                        class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        :class="
                          form.butuhLegal
                            ? 'border-primary-500'
                            : 'border-gray-300 dark:border-gray-600'
                        "
                      >
                        <span v-if="form.butuhLegal" class="w-2 h-2 rounded-full bg-primary-500" />
                      </span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">Ya</span>
                    </button>
                    <button
                      type="button"
                      class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-left transition-all duration-200"
                      :class="
                        !form.butuhLegal
                          ? 'border-primary-500 bg-white dark:bg-gray-800'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      "
                      @click="form.butuhLegal = false"
                    >
                      <span
                        class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        :class="
                          !form.butuhLegal
                            ? 'border-primary-500'
                            : 'border-gray-300 dark:border-gray-600'
                        "
                      >
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

        <!-- Action bar: Draft & Kirim (langsung di form, tidak pakai slideover) -->
        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800"
        >
          <UButton
            v-if="isPhysicalMetadataMode"
            label="Batal"
            color="neutral"
            variant="outline"
            size="lg"
            class="px-8"
            :to="`/naskah-lainnya/${createdId}`"
          />
          <UButton
            v-if="isPhysicalMetadataMode"
            label="Simpan Data Sistem"
            color="primary"
            size="lg"
            icon="i-lucide-save"
            class="px-8 font-bold"
            :disabled="saving"
            @click="handleSaveDraft"
          />
          <UButton
            v-else
            label="Draft"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-document-text"
            class="px-8"
            :disabled="!dokumenOk || saving"
            @click="handleSaveDraft"
          />
          <UButton
            v-if="!isPhysicalMetadataMode"
            :label="isPhysicalSigning ? 'Submit' : 'Kirim'"
            color="primary"
            size="lg"
            icon="i-heroicons-paper-airplane"
            class="px-8 font-bold"
            :disabled="!dokumenOk || saving"
            @click="handleConfirmKirim"
          />
        </div>
      </div>
    </UCard>

    <!-- Konfirmasi Draft -->
    <ConfirmModal
      v-model="showDraftConfirm"
      :title="isPhysicalMetadataMode ? 'Simpan Data Penandatangan?' : 'Simpan Draft?'"
      :description="
        isPhysicalMetadataMode
          ? 'Nomor final dan data penandatangan akan disimpan tanpa mengubah alur naskah.'
          : 'Naskah akan disimpan sebagai draft dan dapat dilihat di halaman Draf.'
      "
      variant="primary"
      :loading="saving"
      @confirm="confirmSaveDraft"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { CalendarDate, parseDate } from '@internationalized/date';
import { renderAsync } from 'docx-preview';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import { Alert } from '~/composables/useAlert';
import type {
  BuatNaskahPayload,
  JenisNaskah,
  ApprovalItem,
  NaskahDetail,
  Penandatangan,
} from '~/types/naskah-lainnya';
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
const {
  create,
  update,
  kirim,
  uploadDokumen,
  uploadRevisiDokumen,
  uploadDokumenTambahan,
  deleteDokumenTambahan,
  parseDokumen,
  getTemplateUrl,
  createdId,
  fetchDetail,
  detail,
  updateMetadataPenandatanganFisik,
  ubahNomorFinalManual,
  uploadDokumenFinalManual,
} = useNaskahLainnya();
const { verifikatorList, fetchVerifikator } = useNaskahDinas();

// Revisi naskah yang dikembalikan (perlu_perbaikan) — tampilkan banner revisi.
const isRevisi = computed(() => detail.value?.tahapan === 'perlu_perbaikan');
const isPhysicalMetadataMode = computed(() => route.query.mode === 'data-sistem');
const isPhysicalSigning = computed(() => form.value.signOption === 'ttd_basah');

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: t('buat_naskah'), to: '#' },
]);

const jenisOptions = Object.entries(JENIS_LABELS).map(([value, label]) => ({
  label: `${value} — ${label}`,
  labelText: label,
  searchLabel: `${value} - ${label}`,
  value,
}));
const jenisSelectItems = computed(() => jenisOptions);
const selectedJenisObj = computed(() => jenisOptions.find((o) => o.value === form.value.jenis));

function labelJenis(j: string) {
  return JENIS_LABELS[j as JenisNaskah] ?? j;
}

// Penandatangan: dari data verifikator (GET /digsig/document/verifikator), format TulisInputPenerima.
// Sort by org hierarchy: Direktur > GM > VP > Manager > lainnya (sama dengan nota-dinas).
const HIERARCHY_ORDER: Record<string, number> = {
  'direktur utama': 1,
  'president director': 1,
  direktur: 2,
  director: 2,
  'general manager': 3,
  gm: 3,
  evp: 3,
  'senior vice president': 3,
  svp: 3,
  'vice president': 4,
  vp: 4,
  manager: 5,
};
const getHierarchyRank = (jabatan: string): number => {
  const text = (jabatan || '').toLowerCase();
  for (const [keyword, rank] of Object.entries(HIERARCHY_ORDER)) {
    if (text.includes(keyword)) return rank;
  }
  return 99;
};
const myPersnum = computed(() => String(user.value?.persnum ?? ''));
const myPositionId = computed(() =>
  String(user.value?.position?.id ?? user.value?.position_id ?? user.value?.position ?? '')
);
const isSelfSigner = (signer?: Partial<Penandatangan | Verifikator> | null): boolean => {
  if (!signer) return false;
  const signerPersnum = String(signer.persnum ?? '');
  const signerPositionId = String(signer.positionId ?? '');
  return (
    (!!myPersnum.value && signerPersnum === myPersnum.value) ||
    (!!myPositionId.value && signerPositionId === myPositionId.value)
  );
};
const penandatanganItems = computed(() =>
  [...verifikatorList.value]
    .filter((v) => !isSelfSigner(v))
    .sort((a, b) => getHierarchyRank(a.jabatan) - getHierarchyRank(b.jabatan))
    .map((v) => ({
      label: `${v.nama} — ${v.jabatan}`,
      labelJob: v.jabatan,
      value: String(v.persnum),
      raw: v,
    }))
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
  butuhLegal: false,
  perihal: '',
});

// ── Deteksi jumlah penandatangan (N) dari template-signers per jenis ──
// GET /naskah-lainnya/template-signers/:jenis → { data: { count, slots: [{index}] } }
const signerSlotCount = ref(0);
const signerSlots = ref<{ index: number }[]>([]);
const loadingSigners = ref(false);
const isRestoringDraft = ref(false);
const editableSignerSlots = computed(() => {
  const count =
    isPhysicalMetadataMode.value || isPhysicalSigning.value
      ? Math.max(1, signerSlotCount.value, form.value.penandatanganList?.length ?? 0)
      : signerSlotCount.value;
  return Array.from({ length: count }, (_, index) => ({ index: index + 1 }));
});

function addSignerSlot() {
  if (!isPhysicalMetadataMode.value && !isPhysicalSigning.value) return;
  slotSigners.value.push(null);
  form.value.penandatanganList.push({ nama: '', jabatan: '' });
}

function removeSignerSlot(index: number) {
  if (!isPhysicalMetadataMode.value && !isPhysicalSigning.value) return;
  slotSigners.value.splice(index, 1);
  form.value.penandatanganList.splice(index, 1);
}

async function persistPhysicalFinalNomor(): Promise<boolean> {
  if (!isPhysicalMetadataMode.value || !createdId.value) return true;
  const nomor = form.value.nomor?.trim();
  if (!nomor) {
    useToast().add({
      title: 'Nomor naskah wajib diisi',
      description: 'Isi atau koreksi nomor sebelum memfinalkan dokumen TTD fisik.',
      color: 'warning',
    });
    return false;
  }
  if (nomor === detail.value?.nomor) return true;
  await ubahNomorFinalManual(createdId.value, nomor);
  form.value.nomor = nomor;
  return true;
}

async function onManualFinalFiles(files: File[]) {
  const file = files[files.length - 1];
  manualFinalFiles.value = files;
  if (!file || !createdId.value || manualFinalBusy.value) return;
  manualFinalBusy.value = true;
  try {
    if (!(await persistPhysicalFinalNomor())) {
      manualFinalFiles.value = [];
      return;
    }
    await uploadDokumenFinalManual(createdId.value, file);
    useToast().add({ title: 'Dokumen final berhasil diunggah', color: 'success' });
  } catch (e: any) {
    const message = e?.response?.data?.message ?? 'Gagal mengunggah dokumen final.';
    useToast().add({ title: 'Unggah gagal', description: message, color: 'error' });
  } finally {
    manualFinalBusy.value = false;
  }
}

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
      `/naskah-lainnya/template-signers/${encodeURIComponent(jenis)}${form.value.signOption ? `?signOption=${form.value.signOption}` : ''}`
    );
    const { count, slots } = res.data;
    signerSlotCount.value = count;
    signerSlots.value = slots;
    // Reset semua slot agar tidak ada penandatangan lawas yang tertinggal saat ganti jenis/count.
    const editableCount = form.value.signOption === 'ttd_basah' ? Math.max(1, count) : count;
    slotSigners.value = Array.from({ length: editableCount }, () => null);
    form.value.penandatanganList = Array.from({ length: editableCount }, () => ({
      nama: '',
      jabatan: '',
    }));
  } catch {
    // Template mungkin tidak punya placeholder tanda_tangan_N → N=0, fase signing dilewati.
    signerSlotCount.value = 0;
    signerSlots.value = [];
    const fallbackCount = form.value.signOption === 'ttd_basah' ? 1 : 0;
    slotSigners.value = Array.from({ length: fallbackCount }, () => null);
    form.value.penandatanganList = Array.from({ length: fallbackCount }, () => ({
      nama: '',
      jabatan: '',
    }));
  } finally {
    loadingSigners.value = false;
  }
}

watch(
  () => [form.value.jenis, form.value.signOption],
  ([jenis]) => {
    if (isRestoringDraft.value) return;
    fetchTemplateSigners(jenis as string);
    applyJenisConfigDefault(jenis as string);
  }
);

// Default per jenis dari konfigurasi sistem (Naskah Lainnya): Legal Drafting
// (Ya/Tidak) + klasifikasi langsung terisi saat jenis dipilih.
async function applyJenisConfigDefault(jenis: string) {
  if (!jenis) return;
  try {
    const res: any = await apiGet(`/config/naskah-lainnya/${jenis}`);
    const cfg = res?.data ?? res;
    if (!cfg) return;
    if (typeof cfg.butuhLegal === 'boolean') form.value.butuhLegal = cfg.butuhLegal;
    if (cfg.defaultKlasifikasi) {
      const found = klasifikasiList.value.find(
        (k: any) => k.klasifikasi === cfg.defaultKlasifikasi
      );
      // Default tidak ditemukan di master klasifikasi → kosongkan, jangan
      // biarkan pilihan jenis sebelumnya nyangkut.
      selectedKlasifikasiId.value = found ? found.id : null;
    } else {
      // Jenis tanpa default klasifikasi → form kosong.
      selectedKlasifikasiId.value = null;
    }
  } catch {
    // konfigurasi belum diset / gagal — biarkan form apa adanya
  }
}

// Opsi per slot: tandai item yang sudah dipilih di slot lain sebagai disabled.
function slotItems(slotIndex: number) {
  return penandatanganItems.value.map((item) => ({
    ...item,
    disabled: slotSigners.value.some((val, idx) => idx !== slotIndex && val === item.value),
  }));
}

function selectedSlotLabel(slotIndex: number) {
  const value = slotSigners.value[slotIndex];
  const item =
    value != null
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
    if (stored.persnum != null && String(raw?.persnum) === String(stored.persnum)) return true;
    if (stored.positionId != null && String(raw?.positionId) === String(stored.positionId))
      return true;
    if (stored.nama != null && raw?.nama?.toLowerCase() === stored.nama.toLowerCase()) return true;
    return false;
  });
  return match ? String(match.value) : null;
}

// Sinkronkan slotSigners → form.penandatanganList (rantai N entry, urutan = urutan penandatangan).
watch(
  slotSigners,
  (values) => {
    if (isRestoringDraft.value) return;
    form.value.penandatanganList = values.map((val, i) => resolveSlotSigner(val, i));
  },
  { deep: true }
);

const templateName = computed(() => `Template ${labelJenis(form.value.jenis)}.docx`);

// ── Klasifikasi (komponen TulisInputKlasifikasi, pola nota-dinas) ──
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const selectedKlasifikasiId = ref<string | null>(null);

// ── Tanggal (komponen TulisInputTanggal — model = CalendarDate) ──
const _today = new Date();
const tanggalDate = ref<CalendarDate>(
  new CalendarDate(_today.getFullYear(), _today.getMonth() + 1, _today.getDate())
);

// Placeholder field Nomor: template format per jenis ({TIPE} → kode jenis) sebagai panduan struktur.
// Teks bantuan lengkap (otomatis/manual & unik) ada di tooltip ikon ℹ di label, bukan di bawah field.
const nomorPlaceholder = computed(() =>
  JENIS_FORMAT_PENOMORAN[form.value.jenis].replace('{TIPE}', form.value.jenis)
);

// ── Approval berjenjang / Verifikator: atasan managerial pengaju dalam 1 divisi/direktorat
//    (sama dengan penutupan berkas) — GET /org-data/atasan-managerial/:positionId ──
const approvalCandidates = ref<Verifikator[]>([]);
const selectedApprovals = ref<Verifikator[]>([]);
const approvalPicker = ref<number | null>(null);

// Satu pejabat boleh merangkap sebagai penandatangan dan verifikator.
// Duplikat hanya dicegah di dalam rantai verifikator itu sendiri.
const availableApprovals = computed(() => {
  const selectedSet = new Set(selectedApprovals.value.map((v) => v.persnum));
  return approvalCandidates.value.filter((v) => !selectedSet.has(v.persnum));
});

const approvalOptions = computed(() =>
  availableApprovals.value.map((v) => ({
    value: v.persnum,
    label: v.nama,
    jabatan: v.jabatan || '',
  }))
);
const onApprovalSelect = (persnum: number) => {
  const v = approvalCandidates.value.find((x) => x.persnum === persnum);
  if (!v) return;
  if (!selectedApprovals.value.some((x) => x.persnum === persnum)) {
    selectedApprovals.value.push(v);
  }
};

const removeApproval = (persnum: number) => {
  selectedApprovals.value = selectedApprovals.value.filter((v) => v.persnum !== persnum);
};

function approvalLabel(approval: Verifikator) {
  return [approval.nama, approval.jabatan].filter(Boolean).join(' — ');
}

watch(approvalPicker, (persnum) => {
  if (persnum == null) return;
  onApprovalSelect(persnum);
  approvalPicker.value = null;
});

const uploadStatus = ref<'idle' | 'reading' | 'done' | 'error'>('idle');
const detected = ref<{ perihal: string; tanggal: string } | null>(null);
const saving = ref(false);
const manualFinalBusy = ref(false);
const manualFinalFiles = ref<File[]>([]);
const dokumenOk = computed(() => uploadStatus.value === 'done' || previewFile.value !== null);

const naskahFiles = ref<File[]>([]);
const revisiPdfFiles = ref<File[]>([]);
// Naskah yg sudah ada di BE (di-restore dari draft). File baru yg dipilih user
// belum ada di sini → baru di-commit (upload versi) saat Draft/Kirim. Dipakai
// commitNaskahIfDirty untuk skip re-upload bila naskah tidak berubah.
const naskahOnServer = ref<File | null>(null);
const pendukungFiles = ref<File[]>([]);
// Pendukung yg sudah ada di BE (di-restore dari draft): File → dokumenId.
// File baru yg diunggah user belum ada di map ini → di-upload saat Draft/Kirim.
// FileUpload mempertahankan referensi objek File saat add/remove, jadi identity
// Map ini reliable untuk mendeteksi file yg dihapus user (orphan) vs yg baru.
const pendukungOnServer = new Map<File, string>();

// ── Pratinjau docx (render file yang diupload via docx-preview) ──
const previewFile = computed(() => naskahFiles.value[naskahFiles.value.length - 1] ?? null);
const hasDirtyNaskah = computed(
  () => !!previewFile.value && previewFile.value !== naskahOnServer.value
);
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
      await new Promise((r) => setTimeout(r, 100));
      await nextTick();
      el = previewContainer.value;
    }
    if (!el) {
      previewLoading.value = false;
      return;
    }
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
    approvalCandidates.value = atasans.map(
      (r: any) =>
        ({
          persnum: Number(r.persnum_person),
          nama: r.persnum_person_text || 'Tanpa nama',
          positionId: Number(r.position) || undefined,
          jabatan: r.position_text || '',
        }) as Verifikator
    );
  } catch {
    // abaikan — dropdown verifikator akan kosong, form tetap bisa dipakai (fallback default workflow)
  } finally {
    isLoadingData.value = false;
  }

  // Load draft jika ada ?draft_id (lanjut edit dari halaman draf)
  const draftId = route.query.draft_id as string;
  if (draftId) {
    try {
      isRestoringDraft.value = true;
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
          try {
            tanggalDate.value = parseDate(d.tanggal);
          } catch {
            /* invalid date */
          }
        }
        // Restore approval chain
        if (d.approvalChain?.length) {
          selectedApprovals.value = d.approvalChain.map(
            (a) =>
              ({
                persnum: a.persnum ?? (Number(a.positionId) || 0),
                positionId: a.positionId ?? undefined,
                nama: a.nama,
                jabatan: a.jabatan,
              }) as Verifikator
          );
        }
        // Restore jumlah slot dari template restored jenis, lalu isi per-slot.
        await fetchTemplateSigners(d.jenis as string);
        const detailPenandatanganList = (d as NaskahDetail).penandatanganList;
        const storedSigners: Partial<Penandatangan>[] = [];
        if (Array.isArray(detailPenandatanganList) && detailPenandatanganList.length) {
          storedSigners.push(...detailPenandatanganList);
        } else if (Array.isArray((d as any).penandatangan) && (d as any).penandatangan.length) {
          storedSigners.push(...((d as any).penandatangan as Penandatangan[]));
        } else if (d.penandatangan?.nama) {
          storedSigners.push(d.penandatangan);
        }
        if (storedSigners.length) {
          // Simpan data asli sebagai fallback bila tidak cocok dengan daftar pejabat.
          const restoredSignerCount =
            isPhysicalMetadataMode.value || isPhysicalSigning.value
              ? Math.max(1, signerSlotCount.value, storedSigners.length)
              : signerSlotCount.value;
          form.value.penandatanganList = Array.from({ length: restoredSignerCount }, (_, i) => {
            const sp = storedSigners[i];
            if (!sp) return { nama: '', jabatan: '' };
            return {
              positionId: String(sp.positionId ?? ''),
              persnum: sp.persnum,
              nama: sp.nama || '',
              jabatan: sp.jabatan || '',
            } as Penandatangan;
          });
          slotSigners.value = Array.from({ length: restoredSignerCount }, (_, i) =>
            findSignerValue(storedSigners[i] ?? {})
          );
        }
        await nextTick();
        // Restore file naskah + preview dari BE proxy
        if (d.id) {
          try {
            const { apiGet } = useApi();
            const blob = await apiGet(`/naskah-lainnya/${d.id}/file`, { responseType: 'blob' });
            const naskahDoc = d.dokumen.find((doc) => doc.tipe === 'naskah');
            const naskahNama = naskahDoc?.nama || `${d.nomor || 'naskah'}.docx`;
            const file = new File([blob], naskahNama, {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            naskahFiles.value = [file];
            naskahOnServer.value = file; // sudah ada di BE — jangan re-upload saat submit
            uploadStatus.value = 'done';
            await nextTick();
          } catch {
            useToast().add({
              title: 'Gagal memuat pratinjau dokumen',
              description: 'File dapat diunggah ulang untuk melihat pratinjau.',
              color: 'warning',
            });
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
                const blob = await apiGet(`/naskah-lainnya/${d.id}/dokumen/${doc.id}/download`, {
                  responseType: 'blob',
                });
                const f = new File([blob], doc.nama, { type: blob.type || 'application/pdf' });
                pendukungOnServer.set(f, doc.id);
                files.push(f);
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
    } finally {
      isRestoringDraft.value = false;
    }
  } else {
    await fetchTemplateSigners(form.value.jenis as string);
    await applyJenisConfigDefault(form.value.jenis as string);
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
    signers.length === 0 ? [] : signers.length === 1 ? signers[0] : signers;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { penandatanganList: _, ...rest } = form.value;

  return {
    ...rest,
    nomor: form.value.nomor || undefined,
    // perihal diisi dari docx-reader (parse/commit). Kirim kosong agar BE tidak
    // menimpa perihal yg sudah di-set dari docx saat commit naskah.
    perihal: form.value.perihal || undefined,
    // sifat diambil dari object-ref selectedSifat (pola TulisInputSifat), bukan form.value.sifat
    // yang tidak pernah di-update oleh select (select meng-emmit object ke selectedSifat).
    sifat: selectedSifat.value?.value || 'biasa',
    penandatangan,
    klasifikasi:
      klasifikasiList.value.find((k) => k.id === selectedKlasifikasiId.value)?.klasifikasi ?? '',
    tanggal: tanggalDate.value?.toString() ?? detected.value?.tanggal ?? undefined,
    approval: selectedApprovals.value.length
      ? selectedApprovals.value.map(
          (v): ApprovalItem => ({
            positionId: String(v.positionId ?? ''),
            nama: v.nama || `Persnum ${v.persnum}`,
            jabatan: v.jabatan || '',
          })
        )
      : undefined,
  };
};

async function downloadTemplate() {
  try {
    const res = await getTemplateUrl(form.value.jenis, form.value.signOption);
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
  // Tolak pilih bila penandatangan belum lengkap: commitNaskahIfDirty() (saat
  // Kirim) butuh penandatangan valid agar uploadDokumen ke BE tidak gagal.
  // validateSigners() sudah memunculkan toast peringatan.
  if (files.length && !validateSigners()) {
    naskahFiles.value = [];
    return;
  }
  naskahFiles.value = files;
  if (files.length) {
    // Baca parameter (perihal/tanggal) TANPA upload — versi naskah hanya
    // di-commit saat user klik Draft/Kirim (commitNaskahIfDirty), agar hapus/
    // unggah ulang tidak menumpuk baris versi naskah di BE.
    readNaskahParams(files[files.length - 1]);
  } else {
    // File dihapus — clear form nomor, perihal, tanggal, dan state
    form.value.nomor = '';
    form.value.perihal = '';
    tanggalDate.value = new CalendarDate(
      _today.getFullYear(),
      _today.getMonth() + 1,
      _today.getDate()
    );
    detected.value = null;
    uploadStatus.value = 'idle';
    if (previewContainer.value) previewContainer.value.innerHTML = '';
  }
}

function onPendukungFiles(files: File[]) {
  // Validasi: hanya PDF
  const invalid = files.filter(
    (f) => f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')
  );
  if (invalid.length) {
    useToast().add({
      title: 'Format tidak didukung',
      description: `${invalid.length} file ditolak. Hanya PDF yang diperbolehkan.`,
      color: 'error',
    });
  }
  // Simpan lokal saja — upload ditangguhkan sampai user klik Draft/Kirim
  // (lihat onSubmitPendukung). Menghapus/unggah ulang di sini TIDAK menyentuh
  // BE, jadi tidak ada orphan/duplikat sebelum naskah benar-benar dikirim.
  pendukungFiles.value = files.filter(
    (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  );
}

// Upload pendukung baru + hapus pendukung lama (restored) yg dihapus user.
// Dipanggil saat Draft/Kirim, bukan saat file dipilih — agar hapus/unggah ulang
// tidak meninggalkan orphan atau duplikat di BE.
async function onSubmitPendukung(id: string) {
  // 1. Hapus pendukung restored yg sudah tidak ada di daftar lokal (user hapus).
  const removed = [...pendukungOnServer.entries()].filter(
    ([f]) => !pendukungFiles.value.includes(f)
  );
  for (const [f, dokId] of removed) {
    try {
      await deleteDokumenTambahan(id, dokId);
    } catch {
      // best-effort: dokumen mungkin sudah hilang di BE
    }
    pendukungOnServer.delete(f);
  }
  // 2. Upload pendukung baru (belum ada di BE).
  const toUpload = pendukungFiles.value.filter((f) => !pendukungOnServer.has(f));
  for (const file of toUpload) {
    try {
      const res = await uploadDokumenTambahan(id, 'pendukung', file);
      if (res?.data?.id) pendukungOnServer.set(file, res.data.id);
    } catch {
      useToast().add({
        title: 'Gagal upload dokumen pendukung',
        description: file.name,
        color: 'error',
      });
    }
  }
}

// Baca parameter docx (perihal/tanggal) TANPA persist — untuk auto-fill perihal
// di form saat user memilih naskah. Tidak membuat versi naskah di BE.
async function readNaskahParams(file: File) {
  uploadStatus.value = 'reading';
  try {
    const res = await parseDokumen(file);
    detected.value = res.data.parameter;
    if (res.data.parameter.perihal) form.value.perihal = res.data.parameter.perihal;
    // Isi tanggal dari dokumen HANYA jika user belum memilih manual.
    if (!tanggalDate.value && res.data.parameter.tanggal) {
      try {
        tanggalDate.value = parseDate(res.data.parameter.tanggal);
      } catch {
        /* format tanggal tidak dikenal */
      }
    }
    uploadStatus.value = 'done';
  } catch (e) {
    uploadStatus.value = 'error';
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    useToast().add({
      title: 'Gagal membaca naskah',
      description: errMsg || 'Periksa penandatangan & isi naskah, lalu coba lagi.',
      color: 'error',
    });
  }
}

// Commit naskah ke BE (upload versi sekali) hanya bila file berubah sejak
// commit terakhir. Dipanggil saat Draft (lenient) / Kirim (strict). Mengembalikan
// false bila upload gagal agar Kirim bisa diblokir.
async function commitNaskahIfDirty(): Promise<boolean> {
  const file = previewFile.value;
  const pdf = revisiPdfFiles.value.at(-1) ?? null;
  if (isRevisi.value && !!pdf !== hasDirtyNaskah.value) {
    useToast().add({
      title: 'Lengkapi pasangan file revisi',
      description: 'DOCX baru dan PDF dengan isi yang sama wajib diunggah bersamaan.',
      color: 'warning',
    });
    return false;
  }
  if (!file || !createdId.value) return true; // tidak ada naskah / belum create → skip
  if (file === naskahOnServer.value) return true; // sudah ada di BE, tidak berubah
  try {
    uploadStatus.value = 'reading';
    if (isRevisi.value && !pdf) {
      useToast().add({
        title: 'PDF revisi wajib diunggah',
        description: 'Lengkapi pasangan PDF dengan isi yang sama seperti DOCX revisi.',
        color: 'warning',
      });
      uploadStatus.value = 'idle';
      return false;
    }
    const res = isRevisi.value
      ? await uploadRevisiDokumen(createdId.value, { docx: file, pdf })
      : await uploadDokumen(createdId.value, file);
    detected.value = res.data.parameter;
    if (res.data.parameter.perihal) form.value.perihal = res.data.parameter.perihal;
    naskahOnServer.value = file; // tandai sudah di-BE
    if (isRevisi.value) revisiPdfFiles.value = [];
    uploadStatus.value = 'done';
    return true;
  } catch (e) {
    uploadStatus.value = 'error';
    const rawMsg = e?.response?.data?.message || e?.message;
    const errMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
    useToast().add({
      title: 'Gagal mengunggah naskah',
      description: errMsg || 'Periksa penandatangan & isi naskah, lalu coba lagi.',
      color: 'error',
    });
    return false;
  }
}

// ── Validasi: bila template mendeteksi N slot, semua harus terisi sebelum kirim/draft ──
function validateSigners(): boolean {
  const requiredSignerCount = editableSignerSlots.value.length;
  if (requiredSignerCount <= 0) return true;
  const chain = form.value.penandatanganList ?? [];
  const isValidEntry = (s?: Penandatangan | null) => !!s && !!(s.persnum || s.positionId || s.nama);
  if (chain.length !== requiredSignerCount || !chain.every(isValidEntry)) {
    useToast().add({
      title: `Isi semua ${requiredSignerCount} penandatangan`,
      description: 'Setiap slot penandatangan wajib diisi sesuai urutan.',
      color: 'warning',
    });
    return false;
  }
  if (chain.some((s) => isSelfSigner(s))) {
    useToast().add({
      title: 'Penandatangan tidak boleh diri sendiri',
      description: 'Pilih pejabat lain sebagai penandatangan sesuai urutan.',
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
  if (isPhysicalMetadataMode.value) {
    const signers = (form.value.penandatanganList ?? []).map((signer) => ({
      nama: signer.nama?.trim() ?? '',
      jabatan: signer.jabatan?.trim() ?? '',
      positionId: signer.positionId || undefined,
      persnum: signer.persnum,
    }));
    if (!signers.length || signers.some((signer) => !signer.nama || !signer.jabatan)) {
      useToast().add({
        title: 'Lengkapi penandatangan',
        description: 'Nama dan jabatan setiap penandatangan wajib diisi.',
        color: 'warning',
      });
      return;
    }
    saving.value = true;
    try {
      if (!(await persistPhysicalFinalNomor())) return;
      await updateMetadataPenandatanganFisik(createdId.value, signers);
      useToast().add({ title: 'Nomor dan data penandatangan disimpan', color: 'success' });
      await navigateTo(`/naskah-lainnya/${createdId.value}`);
    } finally {
      saving.value = false;
    }
    return;
  }
  if (!validateSigners()) return;
  saving.value = true;
  try {
    if (!createdId.value) {
      await create(buildPayload());
    } else {
      // Simpan form terbaru (penandatangan, verifikator, sifat, dll) ke BE
      await update(createdId.value, buildPayload());
    }
    // Commit naskah (jika berubah) + persist pendukung bersama draft.
    // Draft lenient: kegagalan commit naskah tidak membatalkan simpan draft.
    if (createdId.value) {
      await commitNaskahIfDirty();
      await onSubmitPendukung(createdId.value);
    }
    useToast().add({ title: 'Draft disimpan', color: 'success' });
    navigateTo('/naskah-lainnya/draf');
  } finally {
    saving.value = false;
  }
}

// ── Kirim: metode tanda tangan sudah dipilih di toggle atas form ──
async function handleConfirmKirim() {
  const isPhysical = isPhysicalSigning.value;
  const ok = await Alert.confirm(
    isPhysical ? 'Submit Naskah Fisik?' : 'Kirim Naskah?',
    isPhysical
      ? 'Naskah fisik akan disubmit untuk persetujuan. Statusnya tetap Belum Final sampai dokumen final diunggah.'
      : 'Naskah akan dikirim untuk persetujuan dan tidak dapat diedit lagi. Pastikan isi & dokumen sudah benar.',
    isPhysical ? 'Submit' : 'Kirim',
    'Batal'
  );
  if (!ok) return;
  doKirim();
}

function selectSignOption(option: 'qr_only' | 'ttd_basah') {
  form.value.signOption = option;
  if (option === 'ttd_basah') form.value.nomor = '';
}

const doKirim = async () => {
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
    // Commit naskah final (upload versi sekali) sebelum kirim — agar hapus/unggah
    // ulang tidak menumpuk baris versi, lalu persist pendukung, baru kirim.
    if (!(await commitNaskahIfDirty())) return;
    await onSubmitPendukung(createdId.value);
    await kirim(createdId.value);
    useToast().add({
      title: isPhysicalSigning.value
        ? 'Naskah fisik berhasil disubmit untuk approval'
        : 'Naskah berhasil dikirim untuk approval',
      color: 'success',
    });
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
