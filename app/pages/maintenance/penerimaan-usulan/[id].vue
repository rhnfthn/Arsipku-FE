<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Penerimaan Arsip — ${item?.nomorUsulan ?? ''}`"
        :items="breadcrumbs"
      />
      <NuxtLink
        to="/maintenance/penerimaan-usulan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <!-- Content: satu kolom agar urutan informasi sama dengan halaman atasan dan sekretaris divisi -->
    <template v-else-if="item">
      <div class="w-full space-y-5">
        <TransferDetailCard
          :transfer="transferView"
          :daftar-berkas="daftarBerkasDetail.length ? daftarBerkasDetail : daftarBerkas"
          :daftar-isi="daftarIsiDetail"
          :collapsible="true"
          :show-approval-levels="false"
          :show-bac-signer="false"
          :show-bac-tembusan="false"
          :show-tu-approval-levels="true"
          :show-information-card="true"
          information-title="Informasi Berkas"
          information-layout="usul"
          berkas-layout="usul"
          :hide-secretary-info="true"
          :fit-berkas-table="true"
          preview-from="tu"
        />

        <!-- Berita Acara memakai format yang sama dengan Sekretaris Divisi dan Atasan Managerial. -->
        <TransferBeritaAcaraCard
          :transfer="transferView"
          :berita-acara-data="beritaAcaraData"
        />

        <TimelineRiwayat :item="item as any" />

          <!-- Status: Berkas Dikembalikan -->
          <div
            v-if="item.status === 'BERKAS_FISIK_TIDAK_SESUAI'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Berkas Dikembalikan</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ item.physicalVerificationNote || 'Berkas fisik tidak sesuai dan dikembalikan ke pengusul.' }}</p>
              </div>
            </div>
          </div>

          <!-- Status: Selesai -->
          <div
            v-if="item.status === 'SELESAI' || item.status === 'ARSIP_INAKTIF_DITERIMA'"
            class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Usulan Selesai</h3>
                <p class="text-sm text-emerald-600 dark:text-emerald-400">Proses pemindahan arsip selesai.</p>
              </div>
            </div>
          </div>

        <!-- ─── Tombol Aksi TU ─── -->
        <div v-if="canAct" class="flex flex-wrap gap-2">
            <!-- Kembalikan ke pengusul (berkas tidak sesuai) -->
            <button
              @click="openKembalikanModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon name="i-lucide-undo-2" class="w-4 h-4 mr-1 inline" /> Kembalikan
            </button>

            <!-- Verifikasi Berkas Fisik Sesuai → ajukan ke atasan TU -->
            <button
              v-if="item.status === 'DIKIRIM' || item.status === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK'"
              @click="openAjukanModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Ajukan ke Atasan
            </button>
        </div>

      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Modal Ajukan ke Atasan TU -->
    <Teleport to="body">
      <div v-if="showAjukanModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" style="backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);" @click="showAjukanModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden z-[10000]">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan ke Atasan Managerial TU</h3>
            <button @click="showAjukanModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <!-- Body -->
          <div class="p-6 space-y-5 overflow-y-auto flex-1">
            <!-- Card: Atasan Managerial TU — tampilan mengikuti picker Usul Pindah Arsip -->
            <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div class="flex items-center gap-2">
                  <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  <div>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Atasan Managerial TU <span class="text-red-500">*</span></h2>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan TU. Urutan pemilihan = urutan verifikasi (berjenjang).</p>
                  </div>
                </div>
                <button
                  v-if="atasanTuInputs.length < 3"
                  type="button"
                  @click="openAtasanTuPicker"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <UIcon name="i-lucide-user-round-plus" class="h-3.5 w-3.5" /> Tambah
                </button>
              </div>
              <div class="px-5 py-5">
                <div v-if="atasanTuInputs.length > 0" class="mb-4">
                  <div
                    v-for="(persnum, idx) in atasanTuInputs"
                    :key="persnum"
                    class="relative flex gap-3 pb-4 last:pb-0"
                  >
                    <div
                      v-if="idx < atasanTuInputs.length - 1"
                      class="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-primary-200 dark:bg-primary-900/40"
                    />
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white shadow-sm">
                      {{ idx + 1 }}
                    </div>
                    <div class="flex min-w-0 flex-1 items-start justify-between gap-2 pt-1">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ getAtasanName(persnum) }}</p>
                        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ getAtasanPosition(persnum) }}</p>
                      </div>
                      <button
                        type="button"
                        @click="removeAtasanTu(idx)"
                        class="shrink-0 rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Hapus atasan"
                      >
                        <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="atasanTuInputs.length < 3 && showAtasanTuPicker" ref="atasanTuPickerRef" class="relative">
                  <input
                    ref="atasanTuSearchInputRef"
                    v-model="atasanTuSearch"
                    type="text"
                    placeholder="Ketik nama atau e-NIK atasan..."
                    :disabled="atasanTuLoading"
                    @focus="atasanTuPickerOpen = true"
                    @keydown.escape.stop="atasanTuPickerOpen = false"
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#457fb6] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  />
                  <div v-if="atasanTuPickerOpen && filteredAtasanTuList.length > 0" class="absolute left-0 right-0 top-full z-[10001] mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                    <button
                      v-for="a in filteredAtasanTuList"
                      :key="a.persnum"
                      type="button"
                      @click="selectAtasanTu(a)"
                      class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">{{ a.name }}</div>
                        <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ a.persnum }} — {{ a.positionText || a.jabatan || '-' }}</div>
                      </div>
                    </button>
                  </div>
                  <div v-if="atasanTuPickerOpen && filteredAtasanTuList.length === 0 && !atasanTuLoading" class="absolute left-0 right-0 top-full z-[10001] mt-1 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                    Tidak ada atasan ditemukan
                  </div>
                  <div v-if="atasanTuPickerOpen && atasanTuLoading" class="absolute left-0 right-0 top-full z-[10001] mt-1 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                    <UIcon name="i-lucide-loader-2" class="mr-1 inline h-4 w-4 animate-spin" /> Memuat...
                  </div>
                </div>
                <p v-if="atasanTuInputs.length > 0" class="mt-2 text-xs text-gray-500">
                  {{ atasanTuInputs.length }} atasan dipilih. Verifikasi: {{ atasanTuInputs.map((persnum) => getAtasanName(persnum)).join(' → ') }}
                </p>
              </div>
            </div>

            <!-- Pejabat penandatangan pihak kedua BAC -->
            <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <UIcon name="i-lucide-pen-line" class="size-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white">Pejabat Penandatangan Pihak Kedua <span class="text-red-500">*</span></h2>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pejabat Unit Dokumen yang akan menandatangani sisi penerima pada Berita Acara.</p>
                </div>
              </div>
              <div class="px-5 py-4">
                <div class="relative">
                  <button
                    type="button"
                    :disabled="atasanTuLoading"
                    :aria-expanded="pihakKeduaDropdownOpen"
                    @click="pihakKeduaDropdownOpen = !pihakKeduaDropdownOpen"
                    class="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 outline-none transition-colors hover:border-[#457fb6] focus:ring-2 focus:ring-[#457fb6] disabled:cursor-wait disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:disabled:bg-gray-800"
                  >
                    <span v-if="getAtasanOption(pihakKeduaPersnum)" class="min-w-0 truncate">
                      <span class="font-medium">{{ getAtasanOption(pihakKeduaPersnum)?.name }}</span>
                      <span class="text-gray-500 dark:text-gray-400"> — {{ getAtasanOption(pihakKeduaPersnum)?.positionText || getAtasanOption(pihakKeduaPersnum)?.jabatan || '-' }}</span>
                    </span>
                    <span v-else class="text-gray-400">
                      {{ atasanTuLoading ? 'Memuat daftar pejabat...' : 'Pilih pejabat penandatangan pihak kedua' }}
                    </span>
                    <UIcon
                      :name="atasanTuLoading ? 'i-lucide-loader-2' : 'i-lucide-chevron-down'"
                      class="h-4 w-4 shrink-0 text-gray-400"
                      :class="atasanTuLoading ? 'animate-spin' : ''"
                    />
                  </button>

                  <div
                    v-if="pihakKeduaDropdownOpen && !atasanTuLoading"
                    class="absolute left-0 right-0 top-full z-[10001] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div class="border-b border-gray-100 p-2.5 dark:border-gray-700">
                      <div class="relative">
                        <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          v-model="pihakKeduaSearch"
                          type="text"
                          placeholder="Cari nama atau jabatan pejabat..."
                          @keydown.escape.stop="pihakKeduaDropdownOpen = false"
                          class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#457fb6] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        />
                      </div>
                    </div>
                    <div v-if="filteredPihakKeduaList.length" class="max-h-[240px] overflow-y-auto py-1">
                      <button
                        v-for="a in filteredPihakKeduaList"
                        :key="`pihak-kedua-${a.persnum}`"
                        type="button"
                        @click="selectPihakKedua(a)"
                        class="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                        :class="String(a.persnum) === pihakKeduaPersnum ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
                      >
                        <span class="min-w-0">
                          <span class="block truncate text-sm font-medium text-gray-900 dark:text-white">{{ a.name }}</span>
                          <span class="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">{{ a.positionText || a.jabatan || '-' }}</span>
                        </span>
                        <UIcon v-if="String(a.persnum) === pihakKeduaPersnum" name="i-lucide-check" class="h-4 w-4 shrink-0 text-[#457fb6]" />
                      </button>
                    </div>
                    <div v-else class="p-4 text-center text-sm text-gray-400">
                      {{ atasanTuList.length ? 'Tidak ada pejabat yang cocok dengan pencarian.' : 'Daftar pejabat tidak tersedia.' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tembusan BAC dipilih kembali oleh TU; tembusan sekretaris divisi tidak diteruskan. -->
            <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div class="flex items-center gap-2">
                  <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-copy" class="size-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  <div>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Tembusan</h2>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih pejabat penerima salinan Berita Acara (khusus EVP ke atas, opsional).</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="showTembusanInput = true; tembusanDropdownOpen = true"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <UIcon name="i-lucide-user-round-plus" class="h-3.5 w-3.5" /> Tambah
                </button>
              </div>
              <div class="px-5 py-4">
                <div v-if="tembusanList.length > 0" class="mb-3 space-y-2">
                  <div
                    v-for="(t, idx) in tembusanList"
                    :key="t.persnum"
                    class="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/50"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t.name }}</p>
                      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t.positionText }}</p>
                    </div>
                    <button
                      type="button"
                      @click="tembusanList.splice(idx, 1)"
                      class="shrink-0 rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title="Hapus tembusan"
                    >
                      <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div v-if="showTembusanInput" class="relative">
                  <input
                    v-model="tembusanSearch"
                    type="text"
                    :placeholder="tembusanLoading ? 'Memuat data pejabat...' : 'Ketik nama atau persnum pejabat EVP ke atas...'"
                    :disabled="tembusanLoading"
                    @focus="tembusanDropdownOpen = true"
                    @input="tembusanDropdownOpen = true"
                    @keydown.escape="tembusanDropdownOpen = false"
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#457fb6] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  />
                  <div v-if="tembusanDropdownOpen && filteredTembusan.length > 0" class="absolute left-0 right-0 top-full z-[10001] mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                    <button
                      v-for="p in filteredTembusan"
                      :key="p.persnum"
                      type="button"
                      @click="toggleTembusan(p)"
                      class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">{{ p.name }}</div>
                        <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ p.persnum }} — {{ p.positionText }}</div>
                      </div>
                      <UIcon v-if="isTembusanSelected(p)" name="i-lucide-check-circle" class="h-5 w-5 shrink-0 text-green-500" />
                    </button>
                  </div>
                  <div v-if="tembusanDropdownOpen && filteredTembusan.length === 0 && !tembusanLoading" class="absolute left-0 right-0 top-full z-[10001] mt-1 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                    Tidak ada pejabat EVP ke atas ditemukan
                  </div>
                </div>
              </div>
            </div>

            <!-- Catatan (di luar card) -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan (opsional)</label>
              <textarea
                v-model="catatanAjuan"
                rows="3"
                placeholder="Catatan..."
                class="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary resize-none"
              ></textarea>
            </div>
          </div>
          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 shrink-0">
            <button @click="showAjukanModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button
              @click="onConfirmAjukan"
              :disabled="!atasanTuInputs[0] || !pihakKeduaPersnum || actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Kembalikan -->
    <Teleport to="body">
      <div v-if="showKembalikanModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" style="backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);" @click="showKembalikanModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kembalikan ke Atasan</h3>
            <button @click="showKembalikanModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin mengembalikan usulan ini ke Atasan Managerial Sekretaris?
            </p>
            <div class="space-y-2 mb-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.nomorUsulan ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Sekretaris</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.sekretarisName ?? '-' }}</p>
              </div>
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Pengembalian (opsional)</label>
            <textarea
              v-model="alasanKembalikan"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showKembalikanModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmKembalikan"
              :disabled="actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Kembalikan
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useApi } from '~/composables/useApi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { apiGet } = useApi()
const { fetchNotifikasiDetail, fetchAtasanTuOptions, ajukanAtasanTu, kembalikanKeAtasan } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const daftarBerkasDetail = ref<any[]>([])
const daftarIsiDetail = ref<any[]>([])
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] })

/**
 * Halaman penerimaan memakai data TU, sedangkan kartu detail bersama memakai
 * bentuk data pemindahan. Keduanya memiliki field inti yang sama; adapter ini
 * menjaga tampilan tetap seragam tanpa mengubah alur aksi TU.
 */
const transferView = computed(() => {
  if (!item.value) return null

  // Data lama mungkin masih menyimpan tembusan Sekretaris Divisi. Pada tahap
  // penerimaan awal TU, tampilkan hanya tembusan yang dipilih TU (belum ada).
  const awaitingTuSubmission = [
    'DIKIRIM',
    'MENUNGGU_VERIFIKASI_BERKAS_FISIK',
  ].includes(item.value.status)

  return awaitingTuSubmission
    ? { ...item.value, bacTembusan: [] }
    : item.value
})

// Modal state
const showAjukanModal = ref(false)
const showKembalikanModal = ref(false)
const atasanTuInputs = ref<string[]>([])
const pihakKeduaPersnum = ref('')
const pihakKeduaSearch = ref('')
const pihakKeduaDropdownOpen = ref(false)
const catatanAjuan = ref('')
const tembusanList = ref<any[]>([])
const tembusanOptions = ref<any[]>([])
const tembusanLoading = ref(false)
const tembusanSearch = ref('')
const tembusanDropdownOpen = ref(false)
const showTembusanInput = ref(true)
const alasanKembalikan = ref('')

// Daftar atasan managerial TU diambil dinamis dari backend
const atasanTuList = ref<any[]>([])
const atasanTuLoading = ref(false)
const atasanTuSearch = ref('')
const atasanTuPickerOpen = ref(false)
const showAtasanTuPicker = ref(true)
const atasanTuPickerRef = ref<HTMLElement | null>(null)
const atasanTuSearchInputRef = ref<HTMLInputElement | null>(null)

const filteredAtasanTuList = computed(() => {
  const q = atasanTuSearch.value.trim().toLowerCase()
  if (!q) return atasanTuList.value.filter((a) => !atasanTuInputs.value.includes(String(a.persnum)))
  return atasanTuList.value.filter((a) =>
    !atasanTuInputs.value.includes(String(a.persnum)) && (
      String(a.name ?? '').toLowerCase().includes(q) ||
      String(a.persnum ?? '').includes(q) ||
      String(a.positionText ?? a.jabatan ?? '').toLowerCase().includes(q)
    ),
  )
})

const getAtasanName = (persnum: string) => atasanTuList.value.find((a) => String(a.persnum) === String(persnum))?.name || persnum
const getAtasanPosition = (persnum: string) => atasanTuList.value.find((a) => String(a.persnum) === String(persnum))?.positionText || atasanTuList.value.find((a) => String(a.persnum) === String(persnum))?.jabatan || '-'
const getAtasanOption = (persnum: string) => atasanTuList.value.find((a) => String(a.persnum) === String(persnum))

const filteredPihakKeduaList = computed(() => {
  const q = pihakKeduaSearch.value.trim().toLowerCase()
  if (!q) return atasanTuList.value
  return atasanTuList.value.filter((person) =>
    String(person.name ?? '').toLowerCase().includes(q) ||
    String(person.persnum ?? '').includes(q) ||
    String(person.positionText ?? person.jabatan ?? '').toLowerCase().includes(q),
  )
})

const selectPihakKedua = (person: any) => {
  pihakKeduaPersnum.value = String(person.persnum)
  pihakKeduaSearch.value = ''
  pihakKeduaDropdownOpen.value = false
}

const filteredTembusan = computed(() => {
  const q = tembusanSearch.value.trim().toLowerCase()
  return tembusanOptions.value.filter((p) => {
    const jabatan = String(p.positionText ?? '').toUpperCase()
    const isEvpKeAtas = ['EVP', 'DIREKTUR', 'CEO', 'PRESIDEN'].some((rank) => jabatan.includes(rank))
    return isEvpKeAtas && (!q ||
      String(p.name ?? '').toLowerCase().includes(q) ||
      String(p.persnum ?? '').includes(q) ||
      jabatan.toLowerCase().includes(q))
  })
})

const isTembusanSelected = (person: any) =>
  tembusanList.value.some((selected) => String(selected.persnum) === String(person.persnum))

const toggleTembusan = (person: any) => {
  if (isTembusanSelected(person)) {
    tembusanList.value = tembusanList.value.filter((selected) => String(selected.persnum) !== String(person.persnum))
  } else if (tembusanList.value.length < 5) {
    tembusanList.value.push(person)
  }
  tembusanSearch.value = ''
  tembusanDropdownOpen.value = false
  showTembusanInput.value = tembusanList.value.length < 5
}

const loadTembusanOptions = async () => {
  tembusanLoading.value = true
  try {
    const tgl = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const res: any = await apiGet(`/org-data/pengirim/managerial?tgl=${tgl}`, {}, { skipCache: true })
    const data = res?.data?.data ?? res?.data ?? []
    tembusanOptions.value = (Array.isArray(data) ? data : [])
      .map((row: any) => ({
        persnum: Number(row.persnum ?? row.persnum_person ?? row.relation_persnum ?? 0),
        name: row.persnum_person_text ?? row.name ?? row.label ?? '-',
        positionText: row.position_text ?? row.positionText ?? row.labelJob ?? '-',
      }))
      .filter((person: any) => person.persnum && person.name && person.name !== '-')
  } catch (error) {
    console.error('Gagal memuat pejabat tembusan:', error)
    tembusanOptions.value = []
  } finally {
    tembusanLoading.value = false
  }
}

const openAtasanTuPicker = () => {
  showAtasanTuPicker.value = true
  atasanTuPickerOpen.value = true
  nextTick(() => atasanTuSearchInputRef.value?.focus())
}

const selectAtasanTu = (a: any) => {
  if (atasanTuInputs.value.length >= 3 || atasanTuInputs.value.includes(String(a.persnum))) return
  atasanTuInputs.value.push(String(a.persnum))
  showAtasanTuPicker.value = false
  atasanTuPickerOpen.value = false
  atasanTuSearch.value = ''
}

const addAtasanTu = () => {
  openAtasanTuPicker()
}

const removeAtasanTu = (idx: number) => {
  atasanTuInputs.value.splice(idx, 1)
}

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penerimaan Arsip', to: '/maintenance/penerimaan-usulan' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/penerimaan-usulan/${route.params.id}` },
])

const daftarBerkas = computed(() => {
  if (!item.value) return []
  if (item.value.arsipIds && Array.isArray(item.value.arsipIds)) {
    return item.value.arsipIds
  }
  return [{
    id: item.value.arsipId,
    perihal: item.value.arsipPerihal,
    kode: item.value.arsipKode,
    tanggalRetensiHabis: null,
  }]
})

/** TU bisa melakukan aksi saat status DIKIRIM (Menunggu Verifikasi) atau MENUNGGU_VERIFIKASI_BERKAS_FISIK. */
const canAct = computed(() => {
  if (!item.value) return false
  const s = item.value.status
  return s === 'DIKIRIM' || s === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK'
})

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    // Menunggu Verifikasi (Atasan Sekretaris approve → dikirim ke Unit Dokumen)
    DIKIRIM: 'Menunggu Verifikasi',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'Menunggu Verifikasi',
    BERKAS_FISIK_SESUAI: 'Menunggu Verifikasi',
    USUL_PINDAH_DIKIRIM: 'Menunggu TTD',
    SIAPKAN_BERKAS_FISIK: 'Menunggu Verifikasi',
    // Menunggu Penerimaan (Unit Dokumen → Atasan Unit Dokumen)
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    DISETUJUI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Penerimaan',
    // Selesai
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Selesai',
    ARSIP_INAKTIF_DITERIMA: 'Selesai',
    PENATAAN_ARSIP_INAKTIF: 'Selesai',
    SELESAI: 'Selesai',
    // Ditolak
    BERKAS_FISIK_TIDAK_SESUAI: 'Ditolak',
    DITOLAK_PERSETUJUAN_TU: 'Ditolak',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak',
  }
  return m[s] || s
}

const statusBadgeClass = (s: string) => {
  const m: Record<string, string> = {
    // Menunggu Verifikasi = biru
    DIKIRIM: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    BERKAS_FISIK_SESUAI: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    USUL_PINDAH_DIKIRIM: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    SIAPKAN_BERKAS_FISIK: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    // Menunggu Penerimaan = ungu
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    DISETUJUI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    // Selesai = hijau
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    ARSIP_INAKTIF_DITERIMA: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    PENATAAN_ARSIP_INAKTIF: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    SELESAI: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    // Ditolak = merah
    BERKAS_FISIK_TIDAK_SESUAI: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DITOLAK_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return m[s] || 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const loadDaftarIsi = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true })
    const data = res?.data?.data ?? res?.data ?? res
    daftarBerkasDetail.value = Array.isArray(data?.daftarBerkas) ? data.daftarBerkas : []
    daftarIsiDetail.value = Array.isArray(data?.daftarIsi) ? data.daftarIsi : []
  } catch {
    daftarBerkasDetail.value = []
    daftarIsiDetail.value = []
  }
}

const loadBeritaAcaraData = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true })
    beritaAcaraData.value = res?.data ?? { atasan: {}, pengirim: {}, daftarArsip: [] }
  } catch {
    beritaAcaraData.value = { atasan: {}, pengirim: {}, daftarArsip: [] }
  }
}

const loadAtasanTuList = async () => {
  atasanTuLoading.value = true
  try {
    const res: any = await fetchAtasanTuOptions()
    const data = res?.data ?? res ?? []
    atasanTuList.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Gagal memuat daftar atasan TU:', e)
    atasanTuList.value = []
  } finally {
    atasanTuLoading.value = false
  }
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchNotifikasiDetail(route.params.id as string)
    item.value = res?.data ?? res ?? null
    await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()])
  } catch (e: any) {
    console.error('Gagal memuat detail:', e)
    useToast().add({ title: 'Gagal', description: 'Gagal memuat detail usulan.', color: 'error' })
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  await loadDetail()
}

const openAjukanModal = () => {
  atasanTuInputs.value = []
  atasanTuSearch.value = ''
  atasanTuPickerOpen.value = false
  showAtasanTuPicker.value = true
  pihakKeduaPersnum.value = ''
  pihakKeduaSearch.value = ''
  pihakKeduaDropdownOpen.value = false
  catatanAjuan.value = ''
  tembusanList.value = []
  tembusanSearch.value = ''
  tembusanDropdownOpen.value = false
  showTembusanInput.value = true
  showAjukanModal.value = true
  loadAtasanTuList()
  loadTembusanOptions()
}

const openKembalikanModal = () => {
  alasanKembalikan.value = ''
  showKembalikanModal.value = true
}

const onConfirmAjukan = async () => {
  if (!item.value || !atasanTuInputs.value[0] || !pihakKeduaPersnum.value) return
  actionLoading.value = true
  try {
    // Kirim daftar atasan TU berjenjang
    const atasanList = atasanTuInputs.value
      .filter((p) => p)
      .map((p) => {
        const a = atasanTuList.value.find((x) => String(x.persnum) === String(p))
        return { persnum: p, name: a?.name ?? p, jabatan: a?.positionText ?? a?.jabatan ?? '' }
      })
    const pihakKedua = getAtasanOption(pihakKeduaPersnum.value)
    await ajukanAtasanTu(item.value.id, {
      atasanTuList: atasanList,
      bacPihakKeduaPersnum: pihakKeduaPersnum.value,
      bacPihakKeduaName: pihakKedua?.name ?? pihakKeduaPersnum.value,
      bacPihakKeduaJabatan: pihakKedua?.positionText ?? pihakKedua?.jabatan ?? '',
      bacTembusan: tembusanList.value.map((person) => ({
        persnum: person.persnum,
        name: person.name,
        jabatan: person.positionText,
      })),
    })
    showAjukanModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Usulan diajukan ke Atasan Managerial TU.', color: 'success' })
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal mengajukan.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onConfirmKembalikan = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await kembalikanKeAtasan(item.value.id, { alasan: alasanKembalikan.value.trim() || 'Dikembalikan oleh TU' })
    showKembalikanModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Berkas dikembalikan ke pengirim.', color: 'success' })
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal mengembalikan.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => loadDetail())
</script>
