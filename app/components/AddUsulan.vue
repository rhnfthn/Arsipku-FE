<template>
  <Modal
    :model-value="props.modelValue"
    @update:modelValue="handleClose"
    :hide-default-footer="true"
    size="xl"
    ><template #title>
      <Heading
        variant="heading9b"
        class="font-bold text-sm mb-3 mt-5 ml-5 dark:text-gray-100"
      >
        {{ $t("add_usl_title") }}
      </Heading>
    </template>
    <!-- STEP INDICATOR -->
    <div class="flex items-center justify-center gap-6 mb-2 mt-2">
      <div class="flex items-center gap-2">
        <div :class="stepCircleClass(1)">1</div>
        <span class="text-xs">Form Penomoran</span>
      </div>

      <div class="w-12 h-[2px]" :class="stepLineClass(2)" />

      <div class="flex items-center gap-2">
        <div :class="stepCircleClass(2)">2</div>
        <span class="text-xs">Lampiran File</span>
      </div>

      <div class="w-12 h-[2px]" :class="stepLineClass(3)" />

      <div class="flex items-center gap-2">
        <div :class="stepCircleClass(3)">3</div>
        <span class="text-xs">Konfirmasi</span>
      </div>
    </div>

    <!-- STEP 1 -->
    <div v-if="currentStep === 1" class="space-y-4">
      <div class="p-1 flex flex-col gap-4 pb-5">
        <div class="text-xs text-gray-500 mb-2">
          <Heading
            variant="heading9b"
            class="text-mobile-md dark:text-white text-black mb-1"
            >Form Penomoran</Heading
          >
          <span>
            Silakan masukkan data penomoran secara lengkap dan benar untuk
            keperluan verifikasi.
          </span>
        </div>
        <!-- Tanggal Surat -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            {{ $t("add_usl_tanggal_surat") }}
            <span class="text-red-500">*</span>
          </Heading>
          <input
            type="date"
            v-model="tanggalString"
            :max="todayString"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
          />
        </div>

        <!-- Klasifikasi -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            {{ $t("add_usl_klasifikasi") }}
            <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="klasifikasiRef">
            <button
              @click="toggleKlasifikasi"
              :disabled="isLoadingKlasifikasi"
              class="mt-1 w-full flex justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :class="{
                'text-gray-400': !form.klasifikasiDisplay,
                'text-gray-900 dark:text-gray-200': form.klasifikasiDisplay,
              }"
            >
              {{ form.klasifikasiDisplay || $t("add_usl_pilih_klasifikasi") }}
              <ChevronDown
                class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            </button>

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
                  {{
                    isLoadingKlasifikasi
                      ? $t("add_usl_memuat")
                      : $t("add_usl_tidak_ada_hasil")
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Jenis Naskah -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            {{ $t("add_usl_jenis_naskah") }}
            <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="jenisRef">
            <button
              @click="toggleJenis"
              class="mt-1 w-full flex justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:text-gray-200"
              :class="{
                'text-gray-400': !form.jenisDisplay,
                'text-gray-900 dark:text-gray-200': form.jenisDisplay,
              }"
            >
              {{ form.jenisDisplay || $t("add_usl_pilih_jenis") }}
              <ChevronDown
                class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            </button>

            <div
              v-if="openJenis"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="jenisSearch"
                  ref="jenisInput"
                  :placeholder="$t('add_usl_cari_jenis')"
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
                  {{ $t("add_usl_tidak_ada_hasil") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Penandatangan -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            {{ $t("add_usl_penandatangan") }}
            <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="penandatanganRef">
            <button
              @click="togglePenandatangan"
              :disabled="isLoadingPositions"
              class="mt-1 w-full flex justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :class="{
                'text-gray-400': !form.penandatanganJabatan,
                'text-gray-900 dark:text-gray-200': form.penandatanganJabatan,
              }"
            >
              {{
                form.penandatanganJabatan || $t("add_usl_pilih_penandatangan")
              }}
              <ChevronDown
                class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            </button>

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
                  {{
                    isLoadingPositions
                      ? $t("add_usl_memuat")
                      : $t("add_usl_tidak_ada_hasil")
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Perihal -->
        <div>
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            {{ $t("add_usl_perihal") }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.perihal"
            :placeholder="$t('add_usl_perihal_placeholder')"
            maxlength="100"
            @input="validatePerihal"
            class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
          <div class="flex justify-between mt-1 mb-0">
            <p v-if="perihalError" class="text-xs text-red-500">
              {{ perihalError }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {{ form.perihal.length }}/100
              {{ $t("add_usl_perihal_karakter") }}
            </p>
          </div>
        </div>

        <!-- Jumlah -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            {{ $t("add_usl_jumlah") }} <span class="text-red-500">*</span>
          </Heading>
          <input
            type="number"
            v-model.number="form.jumlah"
            :placeholder="$t('add_usl_jumlah_placeholder')"
            @keydown="blockInvalidNumber"
            @input="validateJumlah"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
          />
          <p v-if="jumlahError" class="text-xs text-red-500 mt-1">
            {{ jumlahError }}
          </p>
        </div>
      </div>
    </div>

    <!-- STEP 2 -->
    <div v-if="currentStep === 2" class="space-y-6 p-1">
      <!-- Title -->
      <div class="text-xs text-gray-500 mb-5">
        <Heading
          variant="heading9b"
          class="text-mobile-md dark:text-white text-black mb-1"
          >Masukkan Lampiran File</Heading
        >
        <span>
          Silakan masukkan file penomoran secara lengkap dan benar untuk
          keperluan verifikasi.
        </span>
      </div>

      <!-- Single File Toggle -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Toggle -->
          <button
            type="button"
            @click="isSingleFile = !isSingleFile"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            :class="
              isSingleFile ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            "
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-300"
              :class="isSingleFile ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Single File
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
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatFileSize(singleFile.size) }}
                </p>
              </div>
            </div>

            <button
              @click="removeSingleFile"
              class="text-red-500 hover:text-red-600 transition"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <label
          v-else
          class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-4 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all group"
        >
          <svg
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors flex-shrink-0"
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
              Pilih file (Opsional)
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              PDF, DOC, DOCX (Maks 5MB)
            </span>
          </div>

          <input
            type="file"
            class="hidden"
            accept=".pdf,.doc,.docx"
            @change="handleSingleFile"
          />
        </label>
      </div>

      <!-- NOMOR SURAT -->
      <div class="mt-6">
        <label class="text-xs font-medium mb-2 block">
          Nomor Surat ({{ form.jumlah }} Nomor)
        </label>

        <div class="space-y-4">
          <div
            v-for="(_, idx) in form.jumlah"
            :key="idx"
            class="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition"
          >
            <!-- Inner white box: nomor + badge (sama persis seperti modal detail) -->
            <div class="flex items-center gap-2 mb-3">
              <div
                class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-sm font-mono text-gray-700 dark:text-gray-300"
                  >
                    {{ idx + 1 }}. SPR..../TN/00/LPPNPI/AUD/II/2026
                  </span>
                  <span
                    class="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  >
                    Booking
                  </span>
                </div>
              </div>
            </div>

            <!-- Upload per nomor HANYA jika SingleFile OFF -->
            <div v-if="!isSingleFile" class="mt-2">
              <!-- File sudah dipilih -->
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
                      <p
                        class="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                      >
                        {{ formatFileSize(filesByIndex[idx].size) }}
                      </p>
                    </div>
                  </div>
                  <button
                    @click="removeFile(idx)"
                    class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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

              <!-- Upload area (belum ada file) -->
              <label
                v-else
                class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm hover:bg-white dark:hover:bg-gray-800 hover:border-primary dark:hover:border-primary-600 transition-all group"
              >
                <svg
                  class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors flex-shrink-0"
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
                  <span
                    class="text-gray-700 dark:text-gray-300 font-medium block"
                  >
                    {{ $t("usl_file_pilih") }}
                  </span>
                  <span
                    class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5"
                  >
                    {{ $t("usl_file_format_hint") }}
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

    <!-- STEP 3 (PREVIEW - pindahan dari modal lama) -->
    <div v-if="currentStep === 3" class="space-y-4 p-1">
      <div class="text-xs text-gray-500 mb-3">
        <Heading
          variant="heading9b"
          class="text-mobile-md dark:text-white text-black mb-1"
          >Konfirmasi Penomoran</Heading
        >
        <span>
          Tinjau kembali rincian penomoran Anda sebelum melakukan pengiriman
          usulan.
        </span>
      </div>

      <div class="max-h-full border border-gray-200 mb-5 rounded-lg">
        <div class="w-full px-5 py-2 text-sm">
          <p
            class="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1"
          >
            {{ formatDateTime(new Date()) }}
          </p>
          <h3 class="text-center font-bold text-base mb-5 dark:text-gray-100">
            {{ $t("add_usl_preview_form_title") }}
          </h3>

          <div class="grid grid-cols-[155px_1fr] gap-y-3 w-full">
            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_nama")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              penandatanganNama || user?.nama || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_jabatan")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.penandatanganJabatan || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_jenis")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.jenisDisplay || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_klasifikasi")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.klasifikasiDisplay || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_tanggal")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              formatDate(tanggalString) || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_perihal")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.perihal || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_jumlah")
            }}</Heading>
            <Heading variant="11sb" class="dark:text-gray-200"
              >{{ form.jumlah || 0 }}
              {{ $t("add_usl_preview_jumlah_suffix") }}</Heading
            >

            <Heading variant="10sb" class="dark:text-gray-200">{{
              $t("add_usl_preview_nomor")
            }}</Heading>
            <div
              class="text-gray-800 dark:text-gray-200 text-xs font-mono space-y-1"
            >
              <div v-for="n in form.jumlah" :key="n" class="flex gap-2">
                <span class="text-gray-400 dark:text-gray-500">
                  {{ String(n).padStart(2, "0") }}.
                </span>
                <span class="tracking-widest">
                  {{ form.jenis || "..." }}....../O/00/LPPNPI/{{
                    form.klasifikasi || "..."
                  }}/XII/2025
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-start px-5 pb-5 mt-8">
          <div>
            <Heading
              variant="10m"
              class="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1"
            >
              {{ $t("add_usl_preview_pengusul") }}
            </Heading>
            <p class="font-semibold text-xs dark:text-gray-200">
              {{ user?.nama || "-" }}
            </p>
          </div>
          <div class="text-right">
            <Heading
              variant="10m"
              class="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1"
            >
              {{ $t("add_usl_preview_diusulkan") }}
            </Heading>
            <p class="font-semibold text-xs dark:text-gray-200">
              {{ formatDateTime(new Date()) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER BUTTON -->
    <template #footer>
      <div
        class="flex justify-between w-full gap-3 px-5 py-4 border-t border-gray-200"
      >
        <Button
          v-if="currentStep > 1"
          variant="secondary"
          @click="currentStep--"
          class="w-full justify-between px-5 py-2 border border-primary text-primary text-sm rounded-md"
        >
          Kembali
        </Button>

        <button
          v-if="currentStep < 3"
          @click="nextStep"
          class="w-full justify-between px-5 py-2 bg-primary text-white text-sm rounded-md"
        >
          Selanjutnya
        </button>

        <Button
          v-if="currentStep === 3"
          variant="primary"
          @click="submitAndClose"
          :disabled="isSubmitting || isLoadingBooking"
          class="w-full justify-center px-5 py-2 bg-primary text-white text-sm rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span
            v-if="isSubmitting || isLoadingBooking"
            class="flex items-center gap-2"
          >
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Mengirim...
          </span>
          <span v-else>Kirim</span>
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  watch,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useI18n } from "vue-i18n";
import { ChevronDown, FileText, X } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";
import { useApi } from "~/composables/useApi";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "submit", "preview"]);

const { t } = useI18n();
const toast = useToast();

const jenisOptions = [
  { code: "PER", display: "PER - Peraturan" },
  { code: "KEP", display: "KEP - Keputusan Direksi" },
  { code: "INS", display: "INS - Instruksi" },
  { code: "SPR", display: "SPR - Surat Perintah" },
  { code: "SOP", display: "SOP - Standar Operasional Prosedur" },
  { code: "EDR", display: "EDR - Surat Edaran" },
  { code: "ND", display: "ND - Nota Dinas" },
  { code: "SDI", display: "SDI - Surat Dinas Internal" },
  { code: "DI", display: "DI - Disposisi" },
  { code: "SDE", display: "SDE - Surat Dinas Eksternal" },
  { code: "MOU", display: "MOU - Memorandum of Understanding" },
  { code: "PKS", display: "PKS - Perjanjian Kerja Sama" },
  { code: "LOA", display: "LOA - Letter of Agreement" },
  { code: "LOCA", display: "LOCA - Letter of Coordination Agreement" },
  { code: "PROC", display: "PROC - Kontrak Pengadaan" },
  { code: "PJJ", display: "PJJ - Perjanjian Lainnya" },
  { code: "ADD-PJJ", display: "ADD-PJJ - Adendum Perjanjian" },
  { code: "ADD-PROC", display: "ADD-PROC - Kontrak Pengadaan Adendum" },
  { code: "SPK", display: "SPK - Surat Perintah Kerja Pengadaan" },
  {
    code: "ADD-SPK",
    display: "ADD-SPK - Adendum Surat Perintah Kerja Pengadaaan",
  },
  { code: "SKU", display: "SKU - Surat Kuasa" },
  { code: "BAC", display: "BAC - Berita Acara" },
  { code: "UND", display: "UND - Surat Undangan" },
  { code: "KET", display: "KET - Surat Keterangan" },
  { code: "SPE", display: "SPE - Surat Pengantar" },
  { code: "RPT", display: "RPT - Risalah Rapat" },
  { code: "PEN", display: "PEN - Pengumuman" },
  { code: "PGM", display: "PGM - Sertifikat atau Piagam" },
  { code: "LAP", display: "LAP - Laporan" },
];

const form = ref({
  tanggal: new Date(),
  klasifikasi: "",
  klasifikasiDisplay: "",
  jenis: "",
  jenisDisplay: "",
  penandatanganJabatan: "",
  id_position_penandatangan: null,
  perihal: "",
  jumlah: 1,
});

//------------- STATE STEP -------------
const currentStep = ref(1);
const announcementForm = ref({
  judul: "",
  pesan: "",
  lampiran: null,
});
function handleFileUpload(event) {
  const file = event.target.files[0];
  announcementForm.value.lampiran = file;
}
const nextStep = () => {
  if (currentStep.value === 1) {
    if (!validateStepOne()) return;
  }

  if (currentStep.value === 2) {
    if (isSingleFile.value) {
      // validasi nanti bisa ditambah
    }
  }

  if (currentStep.value < 3) currentStep.value++;
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};
const stepClass = (step) => {
  return [
    "w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold",
    currentStep.value >= step
      ? "bg-primary text-white"
      : "bg-gray-200 text-gray-500",
  ];
};

// STEP 1
function validateStepOne() {
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.penandatanganJabatan ||
    !form.value.perihal ||
    form.value.perihal.length === 0 ||
    form.value.perihal.length > 100 ||
    Number(form.value.jumlah) < 1
  ) {
    toast.add({
      title: t("add_usl_toast_tidak_lengkap_title"),
      description: t("add_usl_toast_tidak_lengkap_desc"),
      color: "yellow",
    });
    return false;
  }

  return true;
}

const stepCircleClass = (step) => {
  return [
    "w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold",
    currentStep.value >= step
      ? "bg-primary text-white"
      : "bg-gray-200 text-gray-500",
  ];
};

const stepLineClass = (step) => {
  return currentStep.value >= step ? "bg-primary" : "bg-gray-200";
};

// STEP 2
const isSingleFile = ref(false);
const filesByIndex = ref([]);

watch(
  () => form.value.jumlah,
  (val) => {
    filesByIndex.value = Array.from({ length: val }, () => null);
  },
  { immediate: true },
);

function handleFile(idx, event) {
  const file = event.target.files[0];
  if (!file) return;
  filesByIndex.value[idx] = file;
}

function removeFile(idx) {
  filesByIndex.value[idx] = null;
}

function formatFileSize(size) {
  if (!size) return "";
  return (size / 1024 / 1024).toFixed(2) + " MB";
}
const nomorSuratList = computed(() => {
  return Array.from({ length: form.value.jumlah }, (_, i) => ({
    index: i + 1,
    nomor: `SPR..../TN/00/LPPNPI/AUD/II/2026`,
    file: null,
  }));
});

// SINGLE FILE
const singleFile = ref(null);

function handleSingleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  singleFile.value = file;
}

function removeSingleFile() {
  singleFile.value = null;
}
watch(isSingleFile, (val) => {
  if (val) {
    filesByIndex.value = Array.from({ length: form.value.jumlah }, () => null);
  } else {
    singleFile.value = null;
  }
});

// Dropdown state
const openKlasifikasi = ref(false);
const klasifikasiSearch = ref("");
const klasifikasiRef = ref(null);
const klasifikasiInput = ref(null);

const openJenis = ref(false);
const jenisSearch = ref("");
const jenisRef = ref(null);
const jenisInput = ref(null);

const openPenandatangan = ref(false);
const penandatanganSearch = ref("");
const penandatanganRef = ref(null);
const penandatanganInput = ref(null);
const penandatanganOptions = ref([]);
const penandatanganNama = ref("");

const isLoadingPositions = ref(false);
const jumlahError = ref("");
const perihalError = ref("");
const hasLoadedPositions = ref(false);
const hasLoadedKlasifikasi = ref(false);

const today = new Date();
const todayString = today.toISOString().split("T")[0];
const tanggalString = ref(todayString);

const {
  getKlasifikasi,
  createUsulanDraft,
  submitBooking,
  submitBookingSingleFile,
  isLoadingBooking,
} = usePenomoran();
const { user, getProfile } = useAuth();
const { get } = useApi();

watch(tanggalString, (newVal) => {
  if (newVal) form.value.tanggal = new Date(newVal);
});

const handleClickOutside = (e) => {
  if (klasifikasiRef.value && !klasifikasiRef.value.contains(e.target))
    openKlasifikasi.value = false;
  if (jenisRef.value && !jenisRef.value.contains(e.target))
    openJenis.value = false;
  if (penandatanganRef.value && !penandatanganRef.value.contains(e.target))
    openPenandatangan.value = false;
};

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

const toggleJenis = async () => {
  openJenis.value = !openJenis.value;
  if (openJenis.value) {
    await nextTick();
    jenisInput.value?.focus();
  }
};

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

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const klasifikasiOptions = ref([]);
const isLoadingKlasifikasi = ref(false);

const filteredKlasifikasi = computed(() => {
  if (!klasifikasiSearch.value) return klasifikasiOptions.value;
  return klasifikasiOptions.value.filter((item) =>
    item.display.toLowerCase().includes(klasifikasiSearch.value.toLowerCase()),
  );
});

const filteredJenis = computed(() => {
  if (!jenisSearch.value) return jenisOptions;
  return jenisOptions.filter((item) =>
    item.display.toLowerCase().includes(jenisSearch.value.toLowerCase()),
  );
});

const filteredPenandatangan = computed(() => {
  if (!penandatanganSearch.value) return penandatanganOptions.value;
  return penandatanganOptions.value.filter((item) =>
    item.displayText
      .toLowerCase()
      .includes(penandatanganSearch.value.toLowerCase()),
  );
});

function selectKlasifikasi(item) {
  form.value.klasifikasi = item.code;
  form.value.klasifikasiDisplay = item.display;
  klasifikasiSearch.value = "";
  openKlasifikasi.value = false;
}

function selectJenis(item) {
  form.value.jenis = item.code;
  form.value.jenisDisplay = item.display;
  jenisSearch.value = "";
  openJenis.value = false;
}

function selectPenandatangan(item) {
  form.value.penandatanganJabatan = item.displayText;
  form.value.id_position_penandatangan = Number(item.position);
  penandatanganNama.value = item.nama;
  penandatanganSearch.value = "";
  openPenandatangan.value = false;
}

function validatePerihal() {
  if (form.value.perihal.length > 100) {
    form.value.perihal = form.value.perihal.slice(0, 100);
    perihalError.value = t("add_usl_valid_perihal_maks");
    return;
  }
  if (form.value.perihal.length === 0) {
    perihalError.value = t("add_usl_valid_perihal_kosong");
    return;
  }
  perihalError.value = "";
}

function blockInvalidNumber(e) {
  if (["-", "+", "e", "E", "."].includes(e.key)) {
    e.preventDefault();
    jumlahError.value = t("add_usl_valid_jumlah_positif");
  }
}

function validateJumlah() {
  const val = Number(form.value.jumlah);

  if (!val || isNaN(val)) {
    jumlahError.value = t("add_usl_valid_jumlah");
    return;
  }

  if (val < 1) {
    jumlahError.value = t("add_usl_valid_jumlah_min");
    form.value.jumlah = 1;
    return;
  }

  jumlahError.value = "";
}

const fetchPositions = async () => {
  isLoadingPositions.value = true;
  try {
    const response = await get("/person/with-position/all");
    const raw = response?.data ?? response;
    const list = Array.isArray(raw) ? raw : [];

    penandatanganOptions.value = list.map((item) => {
      const positionText = item.position_text || "";
      const subAreaText = item.sub_area_text || "";
      const displayText = subAreaText
        ? `${positionText} - ${subAreaText}`
        : positionText;
      return { displayText, position: item.position, nama: item.nama };
    });
  } catch (err) {
    console.error("❌ Error fetch positions:", err);
    toast.add({
      title: t("add_usl_toast_gagal_posisi_title"),
      description: t("add_usl_toast_gagal_posisi_desc"),
      color: "red",
    });
  } finally {
    isLoadingPositions.value = false;
  }
};

const fetchKlasifikasi = async () => {
  isLoadingKlasifikasi.value = true;
  try {
    const response = await getKlasifikasi();
    klasifikasiOptions.value = response;
  } catch (err) {
    console.error("❌ Error fetch klasifikasi:", err);
    toast.add({
      title: t("add_usl_toast_gagal_klasifikasi_title"),
      description: t("add_usl_toast_gagal_klasifikasi_desc"),
      color: "yellow",
    });
  } finally {
    isLoadingKlasifikasi.value = false;
  }
};

const resetForm = () => {
  tanggalString.value = todayString;
  form.value = {
    tanggal: new Date(),
    klasifikasi: "",
    klasifikasiDisplay: "",
    jenis: "",
    jenisDisplay: "",
    id_position_penandatangan: null,
    penandatanganJabatan: "",
    perihal: "",
    jumlah: 1,
  };

  klasifikasiSearch.value = "";
  jenisSearch.value = "";
  penandatanganSearch.value = "";
  penandatanganNama.value = "";
  jumlahError.value = "";
  perihalError.value = "";
  openKlasifikasi.value = false;
  openJenis.value = false;
  openPenandatangan.value = false;
  hasLoadedPositions.value = false;
  hasLoadedKlasifikasi.value = false;

  currentStep.value = 1;
};

const handleClose = (value) => {
  if (!value) resetForm();
  emit("update:modelValue", value);
};

const isSubmitting = ref(false);

async function submitAndClose() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    // ── 1. Buat draft ──────────────────────────────────────────────
    const payload = {
      position_id: Number(user.value.position),
      tanggal: tanggalString.value,
      jenis: form.value.jenis,
      klasifikasi: form.value.klasifikasi,
      perihal: form.value.perihal,
      jumlah: Number(form.value.jumlah),
      penandatangan: form.value.penandatanganJabatan,
      id_position_penandatangan: form.value.id_position_penandatangan,
    };

    const draftResponse = await createUsulanDraft(payload);

    // ID request dari response draft
    const requestId =
      draftResponse?.id ??
      draftResponse?.request_id ??
      draftResponse?.data?.id ??
      draftResponse?.data?.request_id;

    // ── 2. Submit file jika ada & requestId tersedia ────────────────
    if (requestId) {
      if (isSingleFile.value && singleFile.value) {
        // Mode: 1 file untuk semua nomor
        await submitBookingSingleFile(requestId, singleFile.value);
      } else if (!isSingleFile.value) {
        // Mode: file per nomor — hanya kirim jika minimal 1 file dipilih
        const hasAnyFile = filesByIndex.value.some((f) => f instanceof File);
        if (hasAnyFile) {
          const formData = new FormData();
          filesByIndex.value.forEach((file) => {
            if (file instanceof File) {
              formData.append("file", file);
              formData.append("file_name", file.name);
              formData.append("file_text", file.name);
            }
          });
          await submitBooking(requestId, formData);
        }
      }
    }

    // ── 3. Tutup modal & notify parent untuk refresh list ───────────
    emit("submit", payload);
    handleClose(false);
  } catch (err) {
    // Error sudah ditangani dengan toast di composable
    console.error("❌ submitAndClose error:", err);
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  if (!user.value) await getProfile();
});

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "-";
  return (
    date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
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
