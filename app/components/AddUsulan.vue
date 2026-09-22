<template>
  <Modal
    :model-value="props.modelValue"
    @update:modelValue="handleCloseRequest"
    :hide-default-footer="true"
    size="xl"
  >
    <template #title>
      <Heading variant="heading9b" class="font-bold text-sm mb-3 mt-5 ml-5 dark:text-gray-100">
        {{ $t('add_usl_title') }}
      </Heading>
    </template>

    <!-- STEP INDICATOR -->
    <div class="flex items-center justify-center gap-6 mt-2">
      <div class="flex items-center gap-2">
        <div :class="stepCircleClass(1)">1</div>
        <span class="text-xs dark:text-gray-300">{{ $t('add_usl_step_form') }}</span>
      </div>
      <div class="w-12 h-[2px]" :class="stepLineClass(2)" />
      <div class="flex items-center gap-2">
        <div :class="stepCircleClass(2)">2</div>
        <span class="text-xs dark:text-gray-300">{{ $t('add_usl_step_lampiran') }}</span>
      </div>
      <div class="w-12 h-[2px]" :class="stepLineClass(3)" />
      <div class="flex items-center gap-2">
        <div :class="stepCircleClass(3)">3</div>
        <span class="text-xs dark:text-gray-300">{{ $t('add_usl_step_konfirmasi') }}</span>
      </div>
    </div>

    <!-- ==================== STEP 1 ==================== -->
    <div v-if="currentStep === 1" class="space-y-4">
      <div class="p-1 flex flex-col gap-3">
        <div class="text-xs text-gray-500 mb-2">
          <Heading variant="heading9b" class="text-mobile-md dark:text-white text-black mb-1">
            {{ $t('add_usl_step_form') }}
          </Heading>
          <span class="dark:text-gray-400">{{ $t('add_usl_step1_desc') }}</span>
        </div>

        <!-- Tanggal Surat -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
            {{ $t('add_usl_tanggal_surat') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            type="date"
            v-model="tanggalString"
            :max="todayString"
            @change="formErrors.tanggal = false"
            :class="[
              'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
              formErrors.tanggal
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            ]"
          />
          <p v-if="formErrors.tanggal" class="mt-1 text-xs text-red-500 flex items-center gap-1">
            <svg
              class="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
          </p>
        </div>

        <!-- Klasifikasi -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
            {{ $t('add_usl_klasifikasi') }} <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="klasifikasiRef">
            <button
              @click="toggleKlasifikasi"
              :disabled="isLoadingKlasifikasi"
              class="mt-1 w-full flex justify-between rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border"
              :class="[
                formErrors.klasifikasi ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
                !form.klasifikasiDisplay ? 'text-gray-400' : 'text-gray-900 dark:text-gray-200'
              ]"
            >
              {{ form.klasifikasiDisplay || $t('add_usl_pilih_klasifikasi') }}
              <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </button>
            <p
              v-if="formErrors.klasifikasi"
              class="mt-1 text-xs text-red-500 flex items-center gap-1"
            >
              {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
            </p>
            <div
              v-if="openKlasifikasi"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="klasifikasiSearch"
                  ref="klasifikasiInput"
                  :placeholder="$t('add_usl_cari_klasifikasi')"
                  :disabled="isLoadingKlasifikasi"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div class="max-h-52 overflow-y-auto">
                <button
                  v-for="item in filteredKlasifikasi"
                  :key="item.code"
                  @click="selectKlasifikasi(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 dark:text-gray-200"
                >
                  {{ item.display }}
                </button>
                <p
                  v-if="filteredKlasifikasi.length === 0"
                  class="px-3 py-2 text-xs text-center text-gray-400"
                >
                  {{ isLoadingKlasifikasi ? $t('add_usl_memuat') : $t('add_usl_tidak_ada_hasil') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Jenis Naskah -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
            {{ $t('add_usl_jenis_naskah') }} <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="jenisRef">
            <button
              @click="toggleJenis"
              :disabled="isLoadingJenis"
              class="mt-1 w-full flex justify-between rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border"
              :class="[
                formErrors.jenis ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
                !form.jenisDisplay ? 'text-gray-400' : 'text-gray-900 dark:text-gray-200'
              ]"
            >
              {{ form.jenisDisplay || $t('add_usl_pilih_jenis') }}
              <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </button>
            <p v-if="formErrors.jenis" class="mt-1 text-xs text-red-500 flex items-center gap-1">
              {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
            </p>
            <div
              v-if="openJenis"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="jenisSearch"
                  ref="jenisInput"
                  :placeholder="$t('add_usl_cari_jenis')"
                  :disabled="isLoadingJenis"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div class="max-h-60 overflow-y-auto">
                <button
                  v-for="item in filteredJenis"
                  :key="item.code"
                  @click="selectJenis(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 dark:text-gray-200"
                >
                  {{ item.display }}
                </button>
                <p
                  v-if="filteredJenis.length === 0"
                  class="px-3 py-2 text-xs text-center text-gray-400"
                >
                  {{ isLoadingJenis ? $t('add_usl_memuat') : $t('add_usl_tidak_ada_hasil') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Penandatangan -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
            {{ $t('add_usl_penandatangan') }} <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="penandatanganRef">
            <button
              @click="togglePenandatangan"
              :disabled="isLoadingPositions"
              class="mt-1 w-full flex justify-between rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border"
              :class="[
                formErrors.penandatangan
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600',
                !form.penandatanganJabatan ? 'text-gray-400' : 'text-gray-900 dark:text-gray-200'
              ]"
            >
              {{ form.penandatanganJabatan || $t('add_usl_pilih_penandatangan') }}
              <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </button>
            <p
              v-if="formErrors.penandatangan"
              class="mt-1 text-xs text-red-500 flex items-center gap-1"
            >
              {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
            </p>
            <div
              v-if="openPenandatangan"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="penandatanganSearch"
                  ref="penandatanganInput"
                  :placeholder="$t('add_usl_cari_penandatangan')"
                  :disabled="isLoadingPositions"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div class="max-h-60 overflow-y-auto">
                <button
                  v-for="item in filteredPenandatangan"
                  :key="item.position"
                  @click="selectPenandatangan(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 dark:text-gray-200"
                >
                  {{ item.displayText }}
                </button>
                <p
                  v-if="filteredPenandatangan.length === 0"
                  class="px-3 py-2 text-xs text-center text-gray-400"
                >
                  {{ isLoadingPositions ? $t('add_usl_memuat') : $t('add_usl_tidak_ada_hasil') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Perihal -->
        <div>
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            {{ $t('add_usl_perihal') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.perihal"
            :placeholder="$t('add_usl_perihal_placeholder')"
            maxlength="100"
            @input="
              () => {
                validatePerihal();
                formErrors.perihal = false;
              }
            "
            :class="[
              'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-200',
              formErrors.perihal
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            ]"
          />
          <div class="flex justify-between mt-1 -mb-3">
            <p v-if="perihalError" class="text-xs text-red-500">{{ perihalError }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {{ form.perihal.length }}/100 {{ $t('add_usl_perihal_karakter') }}
            </p>
          </div>
        </div>

        <!-- Jumlah -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200 -mt-1">
            {{ $t('add_usl_jumlah') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            type="number"
            v-model.number="form.jumlah"
            :placeholder="$t('add_usl_jumlah_placeholder')"
            @keydown="blockInvalidNumber"
            @input="
              () => {
                validateJumlah();
                formErrors.jumlah = false;
              }
            "
            :class="[
              'mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200',
              formErrors.jumlah
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            ]"
          />
          <p
            v-if="formErrors.jumlah && !jumlahError"
            class="text-xs text-red-500 mt-1 flex items-center gap-1"
          >
            <svg
              class="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {{ $t('tmpl_error_harus_diisi') || 'Harus diisi' }}
          </p>
          <p v-if="jumlahError" class="text-xs text-red-500 mt-1">{{ jumlahError }}</p>
        </div>
      </div>
    </div>

    <!-- ==================== STEP 2 ==================== -->
    <div v-if="currentStep === 2" class="space-y-6 p-1">
      <div class="text-xs text-gray-500 mb-5">
        <Heading variant="heading9b" class="text-mobile-md dark:text-white text-black mb-1">
          {{ $t('add_usl_step2_title') }}
        </Heading>
        <span class="dark:text-gray-400">{{ $t('add_usl_step2_desc') }}</span>
      </div>

      <!-- Single File Toggle -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="isSingleFile = !isSingleFile"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            :class="isSingleFile ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-300"
              :class="isSingleFile ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('add_usl_single_file_label') }}
          </span>
        </div>
      </div>

      <!-- SINGLE FILE MODE -->
      <div v-if="isSingleFile" class="mt-4">
        <div
          v-if="singleFile"
          class="mt-3 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-start gap-3">
              <FileText class="w-6 h-6 text-primary mt-1" />
              <div>
                <p class="text-sm font-medium text-primary underline break-all">
                  {{ singleFile.name }}
                </p>
                <p class="text-xs text-gray-500 mt-1">{{ formatFileSize(singleFile.size) }}</p>
              </div>
            </div>
            <button @click="removeSingleFile" class="text-red-500 hover:text-red-600 transition">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        <label
          v-else
          class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-4 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all group"
        >
          <svg
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div class="flex-1">
            <span class="text-gray-700 dark:text-gray-300 font-medium block">
              {{ $t('add_usl_file_pilih_wajib') }} <span class="text-red-500">*</span>
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              {{ $t('add_usl_file_format_hint') }}
            </span>
          </div>
          <input type="file" class="hidden" accept=".pdf,.doc,.docx" @change="handleSingleFile" />
        </label>
      </div>

      <!-- NOMOR SURAT LIST -->
      <div class="mt-6">
        <label class="text-xs font-medium mb-2 block dark:text-gray-300">
          {{ $t('add_usl_nomor_surat_label') }} ({{ form.jumlah }} {{ $t('usl_nomor_suffix') }})
        </label>
        <div class="space-y-4">
          <div
            v-for="(_, idx) in form.jumlah"
            :key="idx"
            class="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition"
          >
            <!-- Nomor preview box -->
            <div class="flex items-center gap-2 mb-3">
              <div
                class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {{ idx + 1 }}. {{ generatedNomorPreview }}
                  </span>
                  <span
                    class="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  >
                    {{ $t('add_usl_status_booking') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Upload per nomor — hanya jika SingleFile OFF -->
            <div v-if="!isSingleFile" class="mt-2">
              <div
                v-if="filesByIndex[idx]"
                class="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1">
                    <svg
                      class="w-6 h-6 text-primary dark:text-blue-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div class="flex-1">
                      <p
                        class="text-sm font-medium text-primary dark:text-blue-400 underline break-all"
                      >
                        {{ filesByIndex[idx].name }}
                      </p>
                      <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {{ formatFileSize(filesByIndex[idx].size) }}
                      </p>
                    </div>
                  </div>
                  <button
                    @click="removeFile(idx)"
                    class="text-red-500 dark:text-red-400 hover:text-red-700 transition"
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
              <label
                v-else
                class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all group"
              >
                <svg
                  class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div class="flex-1">
                  <span class="text-gray-700 dark:text-gray-300 font-medium block">
                    {{ $t('usl_file_pilih') }} <span class="text-red-500">*</span>
                  </span>
                  <span class="text-xs text-gray-500 block mt-0.5">
                    {{ $t('usl_file_format_hint') }}
                  </span>
                </div>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,.doc,.docx"
                  @change="handleFile(idx, $event)"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== STEP 3 (KONFIRMASI) ==================== -->
    <div v-if="currentStep === 3" class="space-y-4 p-1">
      <div class="text-xs text-gray-500 mb-3">
        <Heading variant="heading9b" class="text-mobile-md dark:text-white text-black mb-1">
          {{ $t('add_usl_step3_title') }}
        </Heading>
        <span class="dark:text-gray-400">{{ $t('add_usl_step3_desc') }}</span>
      </div>

      <div
        class="max-h-full bg-gray-50 border border-gray-200 dark:border-gray-700 mb-5 rounded-lg"
      >
        <div class="w-full px-5 py-2 text-sm">
          <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
            {{ formatDateTime(new Date()) }}
          </p>
          <h3 class="text-center font-bold text-base mb-5 dark:text-gray-100">
            {{ $t('add_usl_preview_form_title') }}
          </h3>

          <div class="grid grid-cols-[155px_1fr] gap-y-3 w-full">
            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_nama')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              penandatanganNama || user?.nama || '-'
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_jabatan')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.penandatanganJabatan || '-'
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_jenis')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.jenisDisplay || '-'
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_klasifikasi')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.klasifikasiDisplay || '-'
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_tanggal')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              formatDate(tanggalString) || '-'
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_perihal')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{ form.perihal || '-' }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_jumlah')
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">
              {{ form.jumlah || 0 }} {{ $t('add_usl_preview_jumlah_suffix') }}
            </Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t('add_usl_preview_nomor')
            }}</Heading>
            <div class="text-gray-800 dark:text-gray-200 text-xs font-mono space-y-1">
              <div v-for="(detail, n) in bookingDetails" :key="detail.id" class="flex gap-2">
                <span class="text-gray-400 dark:text-gray-500"
                  >{{ String(n + 1).padStart(2, '0') }}.</span
                >
                <span class="tracking-widest">{{ detail.nomor || generatedNomorPreview }}</span>
              </div>
              <template v-if="!bookingDetails.length">
                <div v-for="n in form.jumlah" :key="n" class="flex gap-2">
                  <span class="text-gray-400 dark:text-gray-500"
                    >{{ String(n).padStart(2, '0') }}.</span
                  >
                  <span class="tracking-widest">{{ generatedNomorPreview }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start px-5 pb-5 mt-8">
          <div>
            <Heading variant="10m" class="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1">
              {{ $t('add_usl_preview_pengusul') }}
            </Heading>
            <p class="font-semibold text-xs dark:text-gray-200">{{ user?.nama || '-' }}</p>
          </div>
          <div class="text-right">
            <Heading variant="10m" class="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1">
              {{ $t('add_usl_preview_diusulkan') }}
            </Heading>
            <p class="font-semibold text-xs dark:text-gray-200">{{ formatDateTime(new Date()) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER BUTTON -->
    <template #footer>
      <div
        class="flex justify-between w-full gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 mt-5"
      >
        <!-- Step 1: Tombol Batal -->
        <UButton
          v-if="currentStep === 1"
          variant="outline"
          @click="handleCloseRequest(false)"
          class="w-full justify-between px-5 py-2 border border-gray-300 text-gray-600 text-sm rounded-md"
        >
          {{ $t('add_usl_btn_batal') }}
        </UButton>

        <!-- Tombol Selanjutnya step 1 → 2 -->
        <button
          v-if="currentStep === 1"
          @click="goToStep2"
          :disabled="isSubmittingStep1"
          class="w-full justify-center flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-700 text-white text-sm rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg
            v-if="isSubmittingStep1"
            class="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{
            isSubmittingStep1 ? $t('add_usl_btn_menyimpan_step1') : $t('add_usl_btn_selanjutnya')
          }}
        </button>

        <!-- Tombol Selanjutnya step 2 → 3 -->
        <button
          v-if="currentStep === 2"
          @click="goToStep3"
          :disabled="isSubmittingStep2"
          class="w-full justify-center flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-700 text-white text-sm rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg
            v-if="isSubmittingStep2"
            class="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ isSubmittingStep2 ? $t('add_usl_btn_mengunggah') : $t('add_usl_btn_selanjutnya') }}
        </button>

        <!-- Step 3: Tombol Selesai -->
        <UButton
          v-if="currentStep === 3"
          @click="finishAndClose"
          class="w-full justify-center px-5 py-2 bg-primary hover:bg-primary-700 text-white text-sm rounded-md"
        >
          {{ $t('add_usl_btn_selesai') }}
        </UButton>
      </div>
    </template>
  </Modal>

  <!-- Konfirmasi hapus draft saat menutup di step 2/3 -->
  <ConfirmPopup
    v-model="showCloseConfirm"
    type="danger"
    :title="$t('add_usl_confirm_hapus_title')"
    :message="$t('add_usl_confirm_hapus_pesan')"
    :confirmText="$t('add_usl_confirm_hapus_ya')"
    :cancelText="$t('add_usl_confirm_hapus_batal')"
    :loadingText="$t('add_usl_confirm_hapus_loading')"
    :isLoading="isDeletingDraft"
    @confirm="confirmCloseAndDelete"
    @cancel="showCloseConfirm = false"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown, FileText, X } from 'lucide-vue-next';
import Heading from '~/components/Heading.vue';
import ConfirmPopup from '~/components/ConfirmPopup.vue';
import { usePenomoran } from '~/composables/usePenomoran';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue', 'submit']);

const { t } = useI18n();
const toast = useToast();
const { getKlasifikasi, getJenis, deleteUsulanUser, submitBooking, submitBookingSingleFile } =
  usePenomoran();
const { user, getProfile } = useAuth();
const { get, post, api } = useApi();

// ─── STEP STATE ────────────────────────────────────────────────
const currentStep = ref(1);

// ─── DRAFT/BOOKING STATE ───────────────────────────────────────
const createdRequestId = ref(null);
const bookingDetails = ref([]);

const isSubmittingStep1 = ref(false);
const isSubmittingStep2 = ref(false);
const isDeletingDraft = ref(false);
const showCloseConfirm = ref(false);

// ─── FORM ──────────────────────────────────────────────────────
const today = new Date();
const todayString = today.toISOString().split('T')[0];
const tanggalString = ref(todayString);

const form = ref({
  tanggal: new Date(),
  klasifikasi: '',
  klasifikasiDisplay: '',
  jenis: '',
  jenisDisplay: '',
  penandatanganJabatan: '',
  id_position_penandatangan: null,
  perihal: '',
  jumlah: 1
});

const jumlahError = ref('');
const formErrors = ref({
  tanggal: false,
  klasifikasi: false,
  jenis: false,
  penandatangan: false,
  perihal: false,
  jumlah: false
});
const penandatanganNama = ref('');

watch(tanggalString, (val) => {
  if (val) form.value.tanggal = new Date(val);
});

// ─── DROPDOWN: KLASIFIKASI ─────────────────────────────────────
const openKlasifikasi = ref(false);
const klasifikasiSearch = ref('');
const klasifikasiRef = ref(null);
const klasifikasiInput = ref(null);
const klasifikasiOptions = ref([]);
const isLoadingKlasifikasi = ref(false);
const hasLoadedKlasifikasi = ref(false);

const filteredKlasifikasi = computed(() => {
  if (!klasifikasiSearch.value) return klasifikasiOptions.value;
  return klasifikasiOptions.value.filter((i) =>
    i.display.toLowerCase().includes(klasifikasiSearch.value.toLowerCase())
  );
});

const toggleKlasifikasi = async () => {
  if (!openKlasifikasi.value && !hasLoadedKlasifikasi.value) {
    await fetchKlasifikasi();
    hasLoadedKlasifikasi.value = true;
  }
  openKlasifikasi.value = !openKlasifikasi.value;
  if (openKlasifikasi.value) {
    await nextTick();
    klasifikasiInput.value?.focus();
  }
};

const selectKlasifikasi = (item) => {
  form.value.klasifikasi = item.code;
  form.value.klasifikasiDisplay = item.display;
  formErrors.value.klasifikasi = false;
  klasifikasiSearch.value = '';
  openKlasifikasi.value = false;
};

const fetchKlasifikasi = async () => {
  isLoadingKlasifikasi.value = true;
  try {
    const response = await getKlasifikasi();
    klasifikasiOptions.value = response;
  } catch (err) {
    console.error('❌ Error fetch klasifikasi:', err);
    toast.add({
      title: t('add_usl_toast_gagal_klasifikasi_title'),
      description: t('add_usl_toast_gagal_klasifikasi_desc'),
      color: 'warning'
    });
  } finally {
    isLoadingKlasifikasi.value = false;
  }
};

// ─── DROPDOWN: JENIS ──────────────────────────────────────────
const jenisOptions = ref([]);
const isLoadingJenis = ref(false);
const hasLoadedJenis = ref(false);
const openJenis = ref(false);
const jenisSearch = ref('');
const jenisRef = ref(null);
const jenisInput = ref(null);

const filteredJenis = computed(() => {
  if (!jenisSearch.value) return jenisOptions.value;
  return jenisOptions.value.filter((i) =>
    i.display.toLowerCase().includes(jenisSearch.value.toLowerCase())
  );
});

const toggleJenis = async () => {
  if (!openJenis.value && !hasLoadedJenis.value) {
    isLoadingJenis.value = true;
    try {
      jenisOptions.value = await getJenis();
      hasLoadedJenis.value = true;
    } finally {
      isLoadingJenis.value = false;
    }
  }
  openJenis.value = !openJenis.value;
  if (openJenis.value) {
    await nextTick();
    jenisInput.value?.focus();
  }
};

const selectJenis = (item) => {
  form.value.jenis = item.code;
  form.value.jenisDisplay = item.display;
  jenisSearch.value = '';
  openJenis.value = false;
};

// ─── DROPDOWN: PENANDATANGAN ───────────────────────────────────
const openPenandatangan = ref(false);
const penandatanganSearch = ref('');
const penandatanganRef = ref(null);
const penandatanganInput = ref(null);
const penandatanganOptions = ref([]);
const isLoadingPositions = ref(false);
const hasLoadedPositions = ref(false);

const filteredPenandatangan = computed(() => {
  if (!penandatanganSearch.value) return penandatanganOptions.value;
  return penandatanganOptions.value.filter((i) =>
    i.displayText.toLowerCase().includes(penandatanganSearch.value.toLowerCase())
  );
});

const togglePenandatangan = async () => {
  if (!openPenandatangan.value && !hasLoadedPositions.value) {
    await fetchPositions();
    hasLoadedPositions.value = true;
  }
  openPenandatangan.value = !openPenandatangan.value;
  if (openPenandatangan.value) {
    await nextTick();
    penandatanganInput.value?.focus();
  }
};

const selectPenandatangan = (item) => {
  form.value.penandatanganJabatan = item.displayText;
  form.value.id_position_penandatangan = Number(item.position);
  penandatanganNama.value = item.nama;
  penandatanganSearch.value = '';
  openPenandatangan.value = false;
};

const fetchPositions = async () => {
  isLoadingPositions.value = true;
  try {
    const response = await get('/person/with-position/all');
    const raw = response?.data ?? response;
    const list = Array.isArray(raw) ? raw : [];
    penandatanganOptions.value = list.map((item) => {
      const positionText = item.position_text || '';
      const subAreaText = item.sub_area_text || '';
      const displayText = subAreaText ? `${positionText} - ${subAreaText}` : positionText;
      return { displayText, position: item.position, nama: item.nama };
    });
  } catch (err) {
    console.error('❌ Error fetch positions:', err);
    toast.add({
      title: t('add_usl_toast_gagal_posisi_title'),
      description: t('add_usl_toast_gagal_posisi_desc'),
      color: 'error'
    });
  } finally {
    isLoadingPositions.value = false;
  }
};

// ─── NOMOR PREVIEW GENERATOR ──────────────────────────────────
const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const generatedNomorPreview = computed(() => {
  const jenis = form.value.jenis || '...';
  const klasifikasi = form.value.klasifikasi || '...';
  const date = tanggalString.value ? new Date(tanggalString.value) : new Date();
  const bulan = ROMAN_MONTHS[date.getMonth()];
  const tahun = date.getFullYear();
  return `${jenis}..../TN/00/LPPNPI/${klasifikasi}/${bulan}/${tahun}`;
});

// ─── CLICK OUTSIDE ────────────────────────────────────────────
const handleClickOutside = (e) => {
  if (klasifikasiRef.value && !klasifikasiRef.value.contains(e.target))
    openKlasifikasi.value = false;
  if (jenisRef.value && !jenisRef.value.contains(e.target)) openJenis.value = false;
  if (penandatanganRef.value && !penandatanganRef.value.contains(e.target))
    openPenandatangan.value = false;
};
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  if (!user.value) getProfile();
});
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside));

// ─── VALIDATION ────────────────────────────────────────────────
function validateStepOne() {
  formErrors.value = {
    tanggal: false,
    klasifikasi: false,
    jenis: false,
    penandatangan: false,
    perihal: false,
    jumlah: false
  };

  let hasError = false;

  if (!form.value.tanggal) {
    formErrors.value.tanggal = true;
    hasError = true;
  }
  if (!form.value.klasifikasi) {
    formErrors.value.klasifikasi = true;
    hasError = true;
  }
  if (!form.value.jenis) {
    formErrors.value.jenis = true;
    hasError = true;
  }
  if (!form.value.penandatanganJabatan) {
    formErrors.value.penandatangan = true;
    hasError = true;
  }
  if (!form.value.perihal || form.value.perihal.length === 0) {
    formErrors.value.perihal = true;
    hasError = true;
  }
  if (form.value.perihal.length > 100) {
    formErrors.value.perihal = true;
    hasError = true;
  }
  if (!form.value.jumlah || Number(form.value.jumlah) < 1) {
    formErrors.value.jumlah = true;
    hasError = true;
  }

  if (hasError) {
    toast.add({
      title: t('add_usl_toast_tidak_lengkap_title'),
      description: t('add_usl_toast_tidak_lengkap_desc'),
      color: 'warning'
    });
    return false;
  }
  return true;
}

function validatePerihal() {
  if (form.value.perihal.length > 100) {
    form.value.perihal = form.value.perihal.slice(0, 100);
    perihalError.value = t('add_usl_valid_perihal_maks');
    return;
  }
  if (form.value.perihal.length === 0) {
    perihalError.value = t('add_usl_valid_perihal_kosong');
    return;
  }
  perihalError.value = '';
}

function blockInvalidNumber(e) {
  if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
    e.preventDefault();
    jumlahError.value = t('add_usl_valid_jumlah_positif');
  }
}

function validateJumlah() {
  const val = Number(form.value.jumlah);
  if (!val || isNaN(val)) {
    jumlahError.value = t('add_usl_valid_jumlah');
    return;
  }
  if (val < 1) {
    jumlahError.value = t('add_usl_valid_jumlah_min');
    form.value.jumlah = 1;
    return;
  }
  jumlahError.value = '';
}

// ─── FILE STATE (STEP 2) ───────────────────────────────────────
const isSingleFile = ref(false);
const filesByIndex = ref([]);
const singleFile = ref(null);

watch(
  () => form.value.jumlah,
  (val) => {
    filesByIndex.value = Array.from({ length: val }, () => null);
  },
  { immediate: true }
);

watch(isSingleFile, (val) => {
  if (val) filesByIndex.value = Array.from({ length: form.value.jumlah }, () => null);
  else singleFile.value = null;
});

function handleFile(idx, event) {
  const file = event.target.files[0];
  if (!file) return;
  filesByIndex.value = [...filesByIndex.value];
  filesByIndex.value[idx] = file;
}
function removeFile(idx) {
  filesByIndex.value = [...filesByIndex.value];
  filesByIndex.value[idx] = null;
}
function handleSingleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  singleFile.value = file;
}
function removeSingleFile() {
  singleFile.value = null;
}
function formatFileSize(size) {
  if (!size) return '';
  return (size / 1024 / 1024).toFixed(2) + ' MB';
}

// ─── STEP CIRCLE/LINE ─────────────────────────────────────────
const stepCircleClass = (step) => [
  'w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold',
  currentStep.value >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
];
const stepLineClass = (step) => (currentStep.value >= step ? 'bg-primary' : 'bg-gray-200');

// ─── STEP 1 → 2 ───────────────────────────────────────────────
async function goToStep2() {
  if (!validateStepOne()) return;
  isSubmittingStep1.value = true;
  try {
    const payload = {
      position_id: Number(user.value?.position?.id ?? user.value?.position),
      tanggal: tanggalString.value,
      jenis: form.value.jenis,
      klasifikasi: form.value.klasifikasi,
      perihal: form.value.perihal,
      penandatangan: form.value.penandatanganJabatan,
      id_position_penandatangan: Number(form.value.id_position_penandatangan),
      jumlah: Number(form.value.jumlah)
    };
    const response = await post('/nomor-request', payload);
    const data = response?.data ?? response;
    createdRequestId.value = data?.id ?? data?.request_id ?? data?.data?.id;
    if (!createdRequestId.value) throw new Error('Request ID tidak ditemukan dari response');
    toast.add({
      title: t('add_usl_toast_draft_berhasil_title'),
      description: t('add_usl_toast_draft_berhasil_desc'),
      color: 'success'
    });
    currentStep.value = 2;
  } catch (err) {
    console.error('❌ Error create draft:', err);
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      t('add_usl_toast_gagal_buat_desc');
    toast.add({
      title: t('add_usl_toast_gagal_title'),
      description: Array.isArray(msg) ? msg.join(', ') : msg,
      color: 'error'
    });
  } finally {
    isSubmittingStep1.value = false;
  }
}

// ─── STEP 2 → 3 ───────────────────────────────────────────────
async function goToStep3() {
  if (isSingleFile.value) {
    // Single file: wajib ada 1 file
    if (!singleFile.value) {
      toast.add({
        title: t('add_usl_toast_file_wajib_title'),
        description: t('add_usl_toast_file_wajib_desc'),
        color: 'warning'
      });
      return;
    }
  } else {
    // Multiple file: SETIAP nomor wajib punya file
    const missingIndexes = filesByIndex.value
      .map((f, i) => (!(f instanceof File) ? i + 1 : null))
      .filter(Boolean);

    if (missingIndexes.length > 0) {
      toast.add({
        title: t('add_usl_toast_file_belum_lengkap_title'),
        description: t('add_usl_toast_file_belum_lengkap_desc', {
          nomor: missingIndexes.join(', ')
        }),
        color: 'warning'
      });
      return;
    }
  }

  isSubmittingStep2.value = true;
  try {
    let responseData;

    if (isSingleFile.value) {
      // POST /nomor-request/:id/booking-single-file
      responseData = await submitBookingSingleFile(createdRequestId.value, singleFile.value);
    } else {
      // POST /admin/nomor-request/:id/booking  ← isAdmin: true
      const formData = new FormData();
      filesByIndex.value.forEach((file) => {
        formData.append('file', file);
        formData.append('file_name', file.name);
        formData.append('file_text', file.name);
      });
      responseData = await submitBooking(createdRequestId.value, formData, false);
    }

    bookingDetails.value = responseData?.data?.details ?? [];
    currentStep.value = 3;
  } catch {
    // toast sudah ditangani di composable
  } finally {
    isSubmittingStep2.value = false;
  }
}
// ─── FINISH ───────────────────────────────────────────────────
function finishAndClose() {
  toast.add({
    title: t('add_usl_toast_kirim_berhasil_title'),
    description: t('add_usl_toast_kirim_berhasil_desc'),
    color: 'success'
  });
  emit('submit', { requestId: createdRequestId.value, ...form.value });
  resetAndClose();
}

// ─── HANDLE CLOSE ─────────────────────────────────────────────
function handleCloseRequest(value) {
  if (!value) {
    showCloseConfirm.value = true; // selalu tampilkan confirm
  }
}

async function confirmCloseAndDelete() {
  if (!createdRequestId.value) {
    // Step 1: tidak ada draft → langsung tutup
    showCloseConfirm.value = false;
    resetAndClose();
    return;
  }

  // Step 2/3: ada draft → hapus dulu
  isDeletingDraft.value = true;
  try {
    await deleteUsulanUser(createdRequestId.value);
    toast.add({
      title: t('add_usl_toast_draft_dihapus_title'),
      description: t('add_usl_toast_draft_dihapus_desc'),
      color: 'warning'
    });
  } catch (err) {
    console.error('❌ Error deleting draft:', err);
  } finally {
    isDeletingDraft.value = false;
    showCloseConfirm.value = false;
    resetAndClose();
  }
}

// ─── RESET ────────────────────────────────────────────────────
function resetAndClose() {
  emit('update:modelValue', false);

  currentStep.value = 1;
  createdRequestId.value = null;
  bookingDetails.value = [];
  tanggalString.value = todayString;
  form.value = {
    tanggal: new Date(),
    klasifikasi: '',
    klasifikasiDisplay: '',
    jenis: '',
    jenisDisplay: '',
    id_position_penandatangan: null,
    penandatanganJabatan: '',
    perihal: '',
    jumlah: 1
  };
  klasifikasiSearch.value = '';
  jenisSearch.value = '';
  penandatanganSearch.value = '';
  penandatanganNama.value = '';
  jumlahError.value = '';
  perihalError.value = '';
  openKlasifikasi.value = false;
  openJenis.value = false;
  hasLoadedJenis.value = false;
  jenisOptions.value = [];
  openPenandatangan.value = false;
  hasLoadedPositions.value = false;
  hasLoadedKlasifikasi.value = false;
  isSingleFile.value = false;
  singleFile.value = null;
  filesByIndex.value = [null];
}

formErrors.value = {
  tanggal: false,
  klasifikasi: false,
  jenis: false,
  penandatangan: false,
  perihal: false,
  jumlah: false
};
// ─── FORMATTERS ───────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}
function formatDateTime(date) {
  if (!date) return '-';
  return (
    date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
}
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.22s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
</style>
