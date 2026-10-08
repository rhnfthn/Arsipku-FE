<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Ajukan Penyusutan — ${item?.no_usulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penyusutan/pengajuan-penyusutan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="itemLoading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
      <p class="text-gray-500 dark:text-gray-400 mt-2">Memuat data arsip...</p>
    </div>

    <div v-else-if="!item" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">Arsip tidak ditemukan atau sudah diajukan.</p>
    </div>

    <template v-else>
      <div class="space-y-5">
        <div class="space-y-5">
          <!-- Informasi Arsip -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button type="button" class="mb-4 flex w-full items-center justify-between gap-3 text-left" :aria-expanded="!collapsedCards.info" @click="toggleCard('info')">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
              <UIcon :name="collapsedCards.info ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 text-gray-400" />
            </button>
            <div v-if="!collapsedCards.info" class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Nomor Usulan</span><p class="text-gray-900 dark:text-white">{{ item.no_usulan || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Kode Berkas</span><p class="text-gray-900 dark:text-white">{{ item.kode_berkas || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Uraian Informasi Berkas</span><p class="text-gray-900 dark:text-white">{{ item.nama_berkas || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</span><p class="text-gray-900 dark:text-white">{{ [classificationCode, classificationName !== '-' ? classificationName : ''].filter(Boolean).join(' ') || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Kurun Waktu</span><p class="text-gray-900 dark:text-white">{{ item.kurunWaktu || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Jumlah Berkas</span><p class="text-gray-900 dark:text-white">{{ item.jumlahBerkas ?? '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi Keamanan</span><p class="text-gray-900 dark:text-white">{{ item.klasifikasiKeamanan || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Status</span><p class="mt-1"><span :class="statusBadgeClass(item.status)" class="inline-flex text-xs">{{ statusLabel(item.status) }}</span></p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Lokasi Simpan</span><p class="text-gray-900 dark:text-white">{{ item.lokasi_simpan || '-' }}</p></div>
              <div><span class="text-xs text-gray-500 dark:text-gray-400">Nasib Akhir</span><p class="text-gray-900 dark:text-white">{{ item.nasibAkhir || (item.jenis_penyusutan === 'musnah' ? 'Musnah' : 'Permanen') }}</p></div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Lampiran</span>
                <div class="mt-1">
                  <button type="button" :disabled="lampiranLoading" @click="openLampiran" class="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline disabled:cursor-wait disabled:opacity-60 dark:text-primary-300">
                    <UIcon :name="lampiranLoading ? 'i-lucide-loader-2' : 'i-lucide-file-text'" :class="lampiranLoading ? 'animate-spin' : ''" class="h-4 w-4" />
                    Lampiran/{{ item.no_usulan || '-' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Keterangan -->
            <div v-if="!collapsedCards.info && (item.keterangan || item.catatan)" class="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keterangan || item.catatan }}
              </p>
            </div>
          </div>

          <TransferDetailCard
            :transfer="transferForTables"
            :daftar-berkas="daftarBerkasRows"
            :daftar-isi="daftarIsiRows"
            :collapsible="true"
            :show-information-card="false"
            :show-approval-levels="false"
            :show-bac-signer="false"
            :show-bac-tembusan="false"
            :show-tu-approval-levels="false"
            berkas-layout="penataan"
          />

          <TransferBeritaAcaraCard
            v-if="transferForTables"
            :transfer="transferForTables"
            :berita-acara-data="beritaAcaraData"
            preview-icon="eye"
          />

          <!-- Foto, lokasi, dan kondisi mengikuti susunan detail Penataan Arsip. -->
          <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
              <div class="min-w-0 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">Foto dokumentasi</h3>
                  <button type="button" @click="toggleCard('foto')" class="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-expanded="!collapsedCards.foto" aria-label="Lipat foto dokumentasi">
                    <UIcon :name="collapsedCards.foto ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5" />
                  </button>
                </div>
                <div v-if="!collapsedCards.foto" class="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900/40">
                  <a v-if="item.foto_dokumentasi" :href="item.foto_dokumentasi" target="_blank" rel="noopener noreferrer" class="group relative block h-full w-full">
                    <img :src="item.foto_dokumentasi" alt="Foto dokumentasi arsip" class="h-64 w-full rounded-lg object-contain" />
                    <span class="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"><UIcon name="i-lucide-eye" class="mr-1.5 h-4 w-4" />Lihat foto</span>
                  </a>
                  <p v-else class="px-4 py-10 text-sm text-gray-400">Foto dokumentasi belum tersedia.</p>
                </div>
              </div>

              <div class="grid min-w-0 content-start gap-5">
                <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div class="mb-4 flex items-center justify-between gap-3">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Lokasi penyimpanan</h3>
                    <button type="button" @click="toggleCard('lokasi')" class="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" :aria-expanded="!collapsedCards.lokasi" aria-label="Lipat lokasi penyimpanan">
                      <UIcon :name="collapsedCards.lokasi ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5" />
                    </button>
                  </div>
                  <div v-if="!collapsedCards.lokasi" class="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">Label boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.labelPenataan || [item.rak, item.baris, item.kolom].filter(Boolean).join('.') || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">Lokasi</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.lokasi_simpan || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">No. ruang</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.rak || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">No. rak</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.baris || '-' }}</p></div>
                    <div><span class="text-sm text-gray-500 dark:text-gray-400">No. boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ item.kolom || '-' }}</p></div>
                  </div>
                </section>

                <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">Kondisi Arsip</h3>
                  <p class="mt-2 whitespace-pre-line text-base text-gray-600 dark:text-gray-300">{{ item.kondisiArsip || readConditionAndMedia(item.keteranganPenataan || item.keterangan_penataan || item.keterangan || item.catatan, 'Kondisi') || '-' }}</p>
                  <div class="my-4 border-t border-gray-100 dark:border-gray-700" />
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">Media Arsip</h3>
                  <p class="mt-2 whitespace-pre-line text-base text-gray-600 dark:text-gray-300">{{ item.mediaArsip || readConditionAndMedia(item.keteranganPenataan || item.keterangan_penataan || item.keterangan || item.catatan, 'Media') || '-' }}</p>
                </section>
              </div>
            </div>
          </section>
        </div>

        <!-- Timeline Penyusutan: mengikuti card Timeline Riwayat pada detail Penataan. -->
        <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button type="button" class="flex w-full items-center justify-between gap-3 text-left" :aria-expanded="!collapsedCards.timeline" @click="toggleCard('timeline')">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h3>
            <UIcon :name="collapsedCards.timeline ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 text-gray-400" />
          </button>
          <div v-if="!collapsedCards.timeline" class="mt-4 space-y-1">
            <div
              v-for="(step, i) in reversedSteps"
              :key="step.key"
              class="flex gap-3"
              :class="i < reversedSteps.length - 1 ? 'pb-4' : ''"
            >
              <div class="flex flex-col items-center">
                <div :class="stepDotClass(step.step)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <UIcon v-if="stepIndex >= step.step" name="i-lucide-check" class="w-4 h-4" />
                  <span v-else class="text-xs font-semibold">{{ step.step + 1 }}</span>
                </div>
                <div v-if="i < reversedSteps.length - 1" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p :class="stepTextClass(step.step)" class="text-sm font-medium">{{ step.label }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ step.desc }}</p>
                <p v-if="step.date" class="mt-0.5 text-xs text-gray-400">{{ formatDate(step.date) }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Tombol Aksi (di bawah halaman) -->
      <div class="flex items-center gap-3 mt-5">
        <NuxtLink
          to="/maintenance/penyusutan/pengajuan-penyusutan"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >Batal</NuxtLink>
        <button
          v-if="canCreate"
          @click="showAjukanModal = true"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
        >
          <UIcon name="i-lucide-send" class="w-4 h-4" /> Ajukan Penyusutan
        </button>
      </div>
    </template>

    <!-- Modal Ajukan Penyusutan -->
    <Teleport to="body">
      <div v-if="showAjukanModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showAjukanModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan Penyusutan</h3>
            <button @click="showAjukanModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Info Arsip -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">Kode Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.kode_berkas }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">No Usulan</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.no_usulan }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500 dark:text-gray-400">Uraian Informasi Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item?.nama_berkas }}</span></div>
              <div class="flex justify-between gap-4 text-sm"><span class="shrink-0 text-gray-500 dark:text-gray-400">Klasifikasi</span><span class="text-right font-medium text-gray-800 dark:text-white">{{ [classificationCode, classificationName !== '-' ? classificationName : ''].filter(Boolean).join(' ') || '-' }}</span></div>
              <div class="flex justify-between gap-4 text-sm"><span class="shrink-0 text-gray-500 dark:text-gray-400">Klasifikasi Keamanan</span><span class="text-right font-medium text-gray-800 dark:text-white">{{ item?.klasifikasiKeamanan || '-' }}</span></div>
              <div class="flex justify-between gap-4 text-sm"><span class="shrink-0 text-gray-500 dark:text-gray-400">Kurun Waktu</span><span class="text-right font-medium text-gray-800 dark:text-white">{{ item?.kurunWaktu || '-' }}</span></div>
              <div class="flex justify-between gap-4 text-sm"><span class="shrink-0 text-gray-500 dark:text-gray-400">Jumlah Berkas</span><span class="text-right font-medium text-gray-800 dark:text-white">{{ item?.jumlahBerkas ?? '-' }}</span></div>
              <div class="flex justify-between gap-4 text-sm"><span class="shrink-0 text-gray-500 dark:text-gray-400">Nasib Akhir</span><span class="text-right font-medium text-gray-800 dark:text-white">{{ item?.nasibAkhir || (item?.jenis_penyusutan === 'musnah' ? 'Musnah' : 'Permanen') }}</span></div>
              <div class="flex justify-between gap-4 text-sm"><span class="shrink-0 text-gray-500 dark:text-gray-400">Lokasi Penyimpanan</span><span class="text-right font-medium text-gray-800 dark:text-white">{{ item?.lokasi_simpan || '-' }}</span></div>
            </div>

            <!-- Atasan Managerial Berjenjang -->
            <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div class="flex items-center gap-2">
                  <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  <div>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Atasan Managerial Berjenjang <span class="text-red-500">*</span></h2>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi.</p>
                  </div>
                </div>
                <UButton
                  v-if="selectedAtasanList.length < 3"
                  icon="i-lucide-user-round-plus"
                  variant="outline"
                  size="xs"
                  @click="openAtasanInput"
                >Tambah</UButton>
              </div>
              <div class="px-5 py-5">
                <!-- Timeline daftar atasan yang sudah dipilih -->
                <div v-if="selectedAtasanList.length > 0" class="mb-4">
                  <div
                    v-for="(a, idx) in selectedAtasanList"
                    :key="a.persnum"
                    class="relative flex gap-3 pb-4 last:pb-0"
                  >
                    <div
                      v-if="idx < selectedAtasanList.length - 1"
                      class="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-primary-200 dark:bg-primary-900/40"
                    />
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white shadow-sm">
                      {{ idx + 1 }}
                    </div>
                    <div class="min-w-0 flex-1 flex items-start justify-between gap-2 pt-1">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ a.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.positionText }}</p>
                      </div>
                      <button
                        type="button"
                        @click="removeAtasan(idx)"
                        class="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                        title="Hapus atasan"
                      >
                        <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Input pencarian (muncul saat belum ada atasan, atau setelah klik Tambah) -->
                <div v-if="selectedAtasanList.length < 3 && showAtasanInput" ref="atasanDropdownRef" class="relative">
                  <input
                    v-model="atasanSearch"
                    type="text"
                    placeholder="Ketik nama atau e-NIK atasan..."
                    @focus="openAtasanDropdown"
                    @input="onAtasanSearchInput"
                    @keydown.escape="atasanDropdownOpen = false"
                    class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                  />
                  <div
                    v-if="atasanDropdownOpen && filteredAtasan.length > 0"
                    class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto"
                  >
                    <button
                      v-for="a in filteredAtasan"
                      :key="a.persnum"
                      type="button"
                      @click="toggleAtasan(a)"
                      class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">{{ a.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ a.positionText }}</div>
                      </div>
                      <UIcon v-if="isAtasanSelected(a)" name="i-lucide-check-circle" class="w-5 h-5 text-green-500 shrink-0" />
                    </button>
                  </div>
                  <div
                    v-if="atasanDropdownOpen && filteredAtasan.length === 0"
                    class="absolute left-0 right-0 top-full mt-1 z-[10001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400"
                  >
                    Tidak ada atasan ditemukan
                  </div>
                </div>
                <p v-if="selectedAtasanList.length > 0" class="text-xs text-gray-500 mt-2">
                  {{ selectedAtasanList.length }} atasan dipilih. Verifikasi: {{ selectedAtasanList.map(a => a.name).join(' → ') }}
                </p>
              </div>
            </div>

            <!-- Catatan -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Catatan (Opsional)</label>
              <textarea
                v-model="formCatatan"
                rows="3"
                placeholder="Tambahkan catatan untuk verifikator..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button @click="showAjukanModal = false" class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="submitAjukan" :disabled="!canSubmit" class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Ajukan
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <SharedSharePdfViewer
      v-model="lampiranPreviewOpen"
      :url="lampiranPreviewUrl"
      :title="lampiranPreviewTitle"
      :loading="lampiranLoading"
      @close="closeLampiranPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useArsipDinamis } from '~/composables/useArsipDinamis'
import { useApi } from '~/composables/useApi'
import type { JenisPenyusutan } from '~/types/penyusutan'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'

definePageMeta({ middleware: ['auth', 'penyusutan-access'] })

const route = useRoute()
const toast = useToast()
const { ajukanPenyusutan, fetchById } = usePenyusutan()
const { canCreate } = usePenyusutanPermission()
const { fetchPenataanDetail } = useTuVerifikasi()
const { apiGet } = useApi()
const { getBerkasById } = useArsipDinamis()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
  { label: 'Ajukan Penyusutan', to: `/maintenance/penyusutan/pengajuan-penyusutan/ajukan/${route.params.id}` },
])

const item = ref<any>(null)
const classificationCode = computed(() => {
  const data = item.value
  return data?.kodeKlasifikasi
    ?? data?.klasifikasiKode
    ?? data?.klasifikasi_code
    ?? ((data?.klasifikasiText || data?.klasifikasi_text) ? data?.klasifikasi : '')
    ?? ''
})
const classificationName = computed(() => {
  const data = item.value
  const name = data?.klasifikasiText || data?.klasifikasi_text
  if (name) return name
  return data?.klasifikasi && data.klasifikasi !== classificationCode.value ? data.klasifikasi : '-'
})
const itemLoading = ref(false)
const daftarBerkasRows = ref<any[]>([])
const daftarIsiRows = ref<any[]>([])
const transferData = ref<any>(null)
const beritaAcaraData = ref<any>(null)
const collapsedCards = ref<Record<string, boolean>>({})
const lampiranPreviewOpen = ref(false)
const lampiranLoading = ref(false)
const lampiranPreviewUrl = ref('')
const lampiranPreviewTitle = ref('Preview Lampiran')

const transferForTables = computed(() => {
  const transfer = transferData.value ?? {}
  return {
    ...transfer,
    id: transfer.id ?? item.value?.transferId ?? route.params.id,
    status: 'SELESAI',
    lokasiPenataan: item.value?.lokasi_simpan ?? transfer.lokasiPenataan ?? null,
    labelPenataan: item.value?.labelPenataan ?? transfer.labelPenataan ?? null,
    rak: item.value?.rak ?? transfer.rak ?? null,
    baris: item.value?.baris ?? transfer.baris ?? null,
    kolom: item.value?.kolom ?? transfer.kolom ?? null,
    arsipIds: transfer.arsipIds ?? daftarBerkasRows.value.map((row: any) => ({
      id: row.id,
      kode: row.kode,
      perihal: row.uraianInformasi ?? row.namaBerkas,
    })),
  }
})

const toggleCard = (key: string) => {
  collapsedCards.value[key] = !collapsedCards.value[key]
}

const closeLampiranPreview = () => {
  lampiranPreviewOpen.value = false
  if (lampiranPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(lampiranPreviewUrl.value)
  lampiranPreviewUrl.value = ''
}

const openLampiran = async () => {
  const transferId = item.value?.transferId ?? route.params.id
  if (!transferId) return
  closeLampiranPreview()
  lampiranPreviewTitle.value = `Lampiran/${item.value?.no_usulan || ''}`
  lampiranPreviewOpen.value = true
  lampiranLoading.value = true
  try {
    let response: any = await apiGet(`/transfer-active-to-inactive/${transferId}/lampiran-penataan.pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    }, { skipCache: true })
    if (response && typeof response === 'object' && !(response instanceof Blob) && 'data' in response) response = response.data
    const blob = response instanceof Blob
      ? response
      : response instanceof ArrayBuffer
        ? new Blob([response], { type: 'application/pdf' })
        : ArrayBuffer.isView(response)
          ? new Blob([new Uint8Array(response.buffer, response.byteOffset, response.byteLength)], { type: 'application/pdf' })
          : null
    if (!blob || blob.size === 0 || (await blob.slice(0, 5).text()) !== '%PDF-') throw new Error('Lampiran PDF tidak valid.')
    lampiranPreviewUrl.value = URL.createObjectURL(blob)
  } catch (error: any) {
    lampiranPreviewOpen.value = false
    toast.add({ title: 'Lampiran gagal dibuka', description: error?.message || 'Silakan coba kembali.', color: 'error' })
  } finally {
    lampiranLoading.value = false
  }
}

/** Load detail item — coba dari API penyusutan dulu, fallback ke penataan. */
const loadItem = async () => {
  itemLoading.value = true
  try {
    const id = route.params.id as string

    // 1. Coba fetch dari API penyusutan (data sudah ada di tabel penyusutan)
    const penyusutanItem = await fetchById(id)
    if (penyusutanItem) {
      item.value = penyusutanItem as any
      const savedNasibAkhir = (penyusutanItem as any).nasibAkhir
        ?? (penyusutanItem as any).jenis_penyusutan
        ?? (penyusutanItem as any).jenisPenyusutan
      if (savedNasibAkhir) formJenis.value = /musnah/i.test(String(savedNasibAkhir)) ? 'musnah' : 'permanen'
      // Kondisi dan media dicatat pada transfer saat penataan, bukan pada
      // entitas pengajuan penyusutan. Ambil sumber aslinya agar card tetap terisi.
      try {
        const transferId = (penyusutanItem as any).transferId
          ?? (penyusutanItem as any).transfer_id
          ?? id
        const transferRes: any = await fetchPenataanDetail(String(transferId))
        const transferDetail = transferRes?.data ?? transferRes
        if (transferDetail) {
          transferData.value = transferDetail
          let selectedArchiveMetadata: any = null
          try {
            const daftarIsiRes: any = await apiGet(`/transfer-active-to-inactive/${transferId}/daftar-isi`, {}, { skipCache: true })
            const daftarIsiData = daftarIsiRes?.data ?? daftarIsiRes
            daftarBerkasRows.value = Array.isArray(daftarIsiData?.daftarBerkas) ? daftarIsiData.daftarBerkas : []
            daftarIsiRows.value = Array.isArray(daftarIsiData?.daftarIsi) ? daftarIsiData.daftarIsi : []
            const berkasId = String(route.query.berkas_id ?? (penyusutanItem as any).berkasId ?? '')
            selectedArchiveMetadata = daftarBerkasRows.value.find((archive: any) => String(archive.id) === berkasId)
              ?? daftarBerkasRows.value[0]
          } catch (error) {
            console.error('Gagal memuat metadata berkas penyusutan:', error)
          }
          const keteranganPenataan = transferDetail.keteranganPenataan
            ?? transferDetail.keterangan_penataan
            ?? ''
          item.value = {
            ...item.value,
            transferId: transferDetail.id ?? transferId,
            kodeKlasifikasi: selectedArchiveMetadata?.kodeKlasifikasi ?? item.value.kodeKlasifikasi ?? item.value.klasifikasi,
            klasifikasiKode: selectedArchiveMetadata?.kodeKlasifikasi ?? item.value.klasifikasiKode ?? item.value.klasifikasi,
            klasifikasi: selectedArchiveMetadata?.kodeKlasifikasi ?? item.value.klasifikasi,
            klasifikasiText: selectedArchiveMetadata?.klasifikasi ?? item.value.klasifikasiText ?? item.value.klasifikasi_text,
            klasifikasiKeamanan: selectedArchiveMetadata?.klasifikasiKeamanan ?? item.value.klasifikasiKeamanan,
            kurunWaktu: selectedArchiveMetadata?.kurunWaktu ?? item.value.kurunWaktu,
            jumlahBerkas: selectedArchiveMetadata?.jumlahBerkas ?? selectedArchiveMetadata?.jumlah ?? item.value.jumlahBerkas,
            nasibAkhir: selectedArchiveMetadata?.nasibAkhir ?? item.value.nasibAkhir ?? savedNasibAkhir,
            tanggal_retensi_habis: selectedArchiveMetadata?.tanggalRetensiInaktifBerakhir ?? item.value.tanggal_retensi_habis,
            keteranganPenataan,
            kondisiArsip: transferDetail.kondisiArsip ?? transferDetail.kondisi_arsip ?? null,
            mediaArsip: transferDetail.mediaArsip ?? transferDetail.media_arsip ?? null,
            lokasi_simpan: selectedArchiveMetadata?.lokasiSimpan ?? item.value.lokasi_simpan ?? transferDetail.lokasiPenataan ?? transferDetail.lokasi_penataan,
            foto_dokumentasi: item.value.foto_dokumentasi ?? transferDetail.fotoPenataan ?? transferDetail.foto_penataan,
            labelPenataan: item.value.labelPenataan ?? transferDetail.labelPenataan ?? transferDetail.label_penataan,
            rak: item.value.rak ?? transferDetail.rak,
            baris: item.value.baris ?? transferDetail.baris,
            kolom: item.value.kolom ?? transferDetail.kolom,
          }
        }
      } catch (error) {
        console.error('Gagal memuat kondisi dan media penataan:', error)
      }
      return
    }

    // 2. Fallback: fetch dari penataan (arsip yang belum diajukan penyusutan)
    const res: any = await fetchPenataanDetail(id)
    const d = res?.data ?? res
    if (d) {
      transferData.value = d
      const requestedBerkasId = String(route.query.berkas_id ?? '')
      const selectedArchive = (Array.isArray(d.arsipIds) ? d.arsipIds : [])
        .find((archive: any) => String(archive.id) === requestedBerkasId)
        ?? d.arsipIds?.[0]
      const berkasId = selectedArchive?.id ?? d.arsipId ?? d.id

      // Endpoint daftar isi menyertakan tanggal akhir retensi inaktif untuk
      // tiap berkas; gunakan juga datanya untuk mengajukan hanya berkas terpilih.
      let selectedArchiveMetadata: any = null
      try {
        const daftarIsiRes: any = await apiGet(`/transfer-active-to-inactive/${id}/daftar-isi`, {}, { skipCache: true })
        const daftarIsiData = daftarIsiRes?.data ?? daftarIsiRes
        daftarBerkasRows.value = Array.isArray(daftarIsiData?.daftarBerkas) ? daftarIsiData.daftarBerkas : []
        daftarIsiRows.value = Array.isArray(daftarIsiData?.daftarIsi) ? daftarIsiData.daftarIsi : []
        selectedArchiveMetadata = daftarBerkasRows.value.find((archive: any) => String(archive.id) === String(berkasId)) ?? null
      } catch (e) {
        console.error('Gagal memuat metadata retensi berkas:', e)
      }
      try {
        const beritaAcaraRes: any = await apiGet(`/transfer-active-to-inactive/${id}/berita-acara-data`, {}, { skipCache: true })
        beritaAcaraData.value = beritaAcaraRes?.data?.data ?? beritaAcaraRes?.data ?? beritaAcaraRes
      } catch (e) {
        console.error('Gagal memuat data berita acara:', e)
        beritaAcaraData.value = null
      }
      if (!daftarBerkasRows.value.length && Array.isArray(d.arsipIds)) {
        daftarBerkasRows.value = d.arsipIds.map((archive: any, index: number) => ({
          no: index + 1,
          id: archive.id,
          kode: archive.kode,
          uraianInformasi: archive.perihal,
        }))
      }

      // Fetch detail berkas untuk mendapatkan klasifikasi & klasifikasiText
      // (API penataan detail tidak menyertakan klasifikasi)
      let berkasKlasifikasi = selectedArchiveMetadata?.kodeKlasifikasi ?? d.arsipKlasifikasiKode ?? ''
      let berkasKlasifikasiText = selectedArchiveMetadata?.klasifikasi ?? d.arsipKlasifikasi ?? ''
      let berkasData: any = null
      try {
        const berkasRes: any = await getBerkasById(berkasId)
        berkasData = berkasRes?.data ?? berkasRes
        if (berkasData) {
          berkasKlasifikasi = berkasData.klasifikasi ?? berkasKlasifikasi
          berkasKlasifikasiText = berkasData.klasifikasiTeks ?? berkasData.klasifikasi_text ?? berkasKlasifikasiText
        }
      } catch (e) {
        console.error('Gagal memuat klasifikasi berkas:', e)
      }
      const nasibAkhir = selectedArchiveMetadata?.nasibAkhir
        ?? berkasData?.tindakanPenyusutanAkhir
        ?? berkasData?.tindakan_penyusutan_akhir
        ?? 'Permanen'
      formJenis.value = /musnah/i.test(String(nasibAkhir)) ? 'musnah' : 'permanen'

      item.value = {
        id: d.id,
        no_usulan: d.nomorUsulan ?? '',
        kode_berkas: selectedArchiveMetadata?.kode ?? selectedArchive?.kode ?? d.arsipKode ?? '',
        nama_berkas: selectedArchiveMetadata?.uraianInformasi ?? selectedArchiveMetadata?.namaBerkas ?? selectedArchive?.perihal ?? d.arsipPerihal ?? '',
        klasifikasi: berkasKlasifikasi,
        klasifikasiText: berkasKlasifikasiText,
        kodeKlasifikasi: selectedArchiveMetadata?.kodeKlasifikasi ?? berkasKlasifikasi,
        klasifikasiKode: selectedArchiveMetadata?.kodeKlasifikasi ?? berkasKlasifikasi,
        klasifikasiKeamanan: selectedArchiveMetadata?.klasifikasiKeamanan ?? berkasData?.klasifikasiKeamanan ?? berkasData?.klasifikasi_keamanan ?? '-',
        kurunWaktu: selectedArchiveMetadata?.kurunWaktu ?? '-',
        jumlahBerkas: selectedArchiveMetadata?.jumlahBerkas ?? selectedArchiveMetadata?.jumlah ?? '-',
        nasibAkhir,
        sekretaris: d.sekretarisName ?? '',
        atasan_managerial: [],
        status: 'draft' as any,
        jenis_penyusutan: 'permanen' as JenisPenyusutan,
        lokasi_simpan: d.lokasiPenataan ?? null,
        labelPenataan: d.labelPenataan ?? null,
        rak: d.rak ?? null,
        baris: d.baris ?? null,
        kolom: d.kolom ?? null,
        tanggal_retensi_habis: selectedArchiveMetadata?.tanggalRetensiInaktifBerakhir ?? '',
        tanggal_pengajuan: null,
        catatan: d.keterangan ?? '',
        keterangan: d.keteranganPenataan ?? d.keterangan_penataan ?? d.keterangan ?? null,
        keteranganPenataan: d.keteranganPenataan ?? d.keterangan_penataan ?? '',
        kondisiArsip: d.kondisiArsip ?? d.kondisi_arsip ?? null,
        mediaArsip: d.mediaArsip ?? d.media_arsip ?? null,
        daftar_arsip: selectedArchive ? [{
          id: selectedArchive.id,
          nama: selectedArchiveMetadata?.namaBerkas ?? selectedArchive.perihal ?? '',
          kode: selectedArchiveMetadata?.kode ?? selectedArchive.kode ?? '',
        }] : [],
        foto_dokumentasi: d.fotoPenataan ?? null,
        berita_acara: d.beritaAcaraUrl ?? null,
        current_verifikator_urutan: 1,
        // Simpan berkasId untuk submit
        berkasId,
        transferId: d.id,
      } as any
    }
  } catch (e) {
    console.error('Gagal memuat detail arsip:', e)
  } finally {
    itemLoading.value = false
  }
}

const showAjukanModal = ref(false)
const formJenis = ref<JenisPenyusutan>('permanen')
const formCatatan = ref('')
const submitting = ref(false)

// ── Daftar Arsip (Berkas) ──
// Tampilkan daftar berkas dari daftar_arsip di DB.
// Jika kosong, buat dummy dari berkas_id utama agar selalu ada isinya.
const daftarArsipList = computed(() => {
  if (!item.value) return []
  const daftar = (item.value as any).daftar_arsip ?? (item.value as any).daftarArsip
  if (daftar && Array.isArray(daftar) && daftar.length > 0) {
    return daftar
  }
  // Dummy: jika daftar_arsip kosong, tampilkan berkas utama
  const berkasId = (item.value as any).berkasId ?? item.value.id
  return [
    {
      id: berkasId,
      nama: item.value.nama_berkas ?? item.value.namaBerkas ?? '-',
      kode: item.value.kode_berkas ?? item.value.kodeBerkas ?? '',
    },
  ]
})

// ── Atasan Managerial Berjenjang (dari API org-data) ──
const atasanOptions = ref<Array<{ position: number; persnum: number; name: string; positionText: string }>>([])
const atasanLoading = ref(false)
const selectedAtasanList = ref<{ persnum: number; name: string; positionText: string; positionId?: number }[]>([])
const showAtasanInput = ref(true)
const atasanSearch = ref('')
const atasanDropdownOpen = ref(false)
const atasanDropdownRef = ref<HTMLElement | null>(null)

const loadAtasanManagerial = async () => {
  atasanLoading.value = true
  try {
    const tgl = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const res: any = await apiGet(`/org-data/pengirim/managerial?tgl=${tgl}`, {}, { skipCache: true })
    const data = res?.data?.data ?? res?.data ?? []
    if (Array.isArray(data)) {
      atasanOptions.value = data
        .map((r: any) => ({
          position: Number(r.position ?? r.position_id ?? 0),
          persnum: Number(r.persnum ?? r.persnum_person ?? r.relation_persnum ?? 0),
          name: r.persnum_person_text ?? r.name ?? r.label ?? '-',
          positionText: r.position_text ?? r.positionText ?? r.labelJob ?? '-',
        }))
        // Buang entri tanpa nama (fallback "-") — hanya tampilkan atasan yang punya nama
        .filter((a: { name: string }) => {
          const n = (a.name ?? '').trim()
          return n !== '' && n !== '-'
        })
    }
  } catch (e) {
    console.error('Gagal memuat atasan managerial:', e)
    atasanOptions.value = []
  } finally {
    atasanLoading.value = false
  }
}

const filteredAtasan = computed(() => {
  const q = atasanSearch.value.trim().toLowerCase()
  if (!q) return atasanOptions.value.slice(0, 50)
  return atasanOptions.value
    .filter((a) =>
      a.name.toLowerCase().includes(q) ||
      String(a.persnum).includes(q) ||
      a.positionText.toLowerCase().includes(q)
    )
    .slice(0, 50)
})

const isAtasanSelected = (a: { persnum: number }) =>
  selectedAtasanList.value.some((s) => s.persnum === a.persnum)

const openAtasanInput = () => {
  showAtasanInput.value = true
  atasanSearch.value = ''
  atasanDropdownOpen.value = true
}

const openAtasanDropdown = () => {
  atasanDropdownOpen.value = true
}

const onAtasanSearchInput = () => {
  atasanDropdownOpen.value = true
}

const toggleAtasan = (a: { persnum: number; name: string; positionText: string; position: number }) => {
  if (isAtasanSelected(a)) {
    selectedAtasanList.value = selectedAtasanList.value.filter((s) => s.persnum !== a.persnum)
  } else {
    if (selectedAtasanList.value.length >= 3) return
    selectedAtasanList.value.push({ persnum: a.persnum, name: a.name, positionText: a.positionText, positionId: a.position })
  }
  atasanSearch.value = ''
  atasanDropdownOpen.value = false
  showAtasanInput.value = false
}

const removeAtasan = (idx: number) => {
  selectedAtasanList.value.splice(idx, 1)
}

const canSubmit = computed(() => {
  return selectedAtasanList.value.length >= 1 && !!formJenis.value && !submitting.value
})

/** Mapping status → index step (0-3). */
const stepIndex = computed(() => {
  const s = String(item.value?.status ?? 'draft').toLowerCase()
  if (s === 'draft') return 0
  if (s === 'diajukan') return 1
  if (s === 'diterima') return 2
  if (s === 'selesai') return 3
  if (s === 'ditolak') return 1
  return 0
})

const steps = computed(() => {
  const jenis = item.value?.jenis_penyusutan ?? 'permanen'
  return [
    { key: 'draft', step: 0, label: 'Draft', desc: 'Sekretaris membuat usulan', date: item.value?.createdAt ?? item.value?.created_at },
    { key: 'diajukan', step: 1, label: 'Menunggu Persetujuan', desc: 'Telah diajukan ke Atasan Managerial Unit Dokumen', date: item.value?.tanggal_pengajuan ?? item.value?.tanggalUsulan },
    { key: 'diterima', step: 2, label: 'Disetujui', desc: 'Atasan Managerial Unit Dokumen menyetujui penyusutan', date: item.value?.approvedAt ?? item.value?.approved_at },
    { key: 'selesai', step: 3, label: 'Selesai', desc: jenis === 'permanen' ? 'Arsip telah disimpan (dipermanenkan)' : 'Arsip telah dimusnahkan', date: item.value?.completedAt ?? item.value?.completed_at },
  ]
})

const reversedSteps = computed(() => [...steps.value].reverse())

const stepDotClass = (step: number): string => {
  if (step < stepIndex.value) return 'bg-green-500 text-white'
  if (step === stepIndex.value) return 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20'
  return 'bg-gray-200 dark:bg-gray-600 text-gray-400'
}

const stepTextClass = (step: number): string => {
  if (step < stepIndex.value) return 'text-gray-900 dark:text-white'
  if (step === stepIndex.value) return 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold'
  return 'text-gray-400'
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const readConditionAndMedia = (value: string | null | undefined, field: 'Kondisi' | 'Media') => {
  const text = String(value ?? '')
  const marker = `${field}: `
  const startIndex = text.indexOf(marker)
  if (startIndex < 0) return ''
  const start = startIndex + marker.length
  const remaining = text.slice(start)
  const nextFieldIndex = remaining.search(/\n(?:Kondisi|Media|Tingkat Perkembangan): /)
  return remaining.slice(0, nextFieldIndex >= 0 ? nextFieldIndex : undefined).trim()
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { draft: 'Draft', diajukan: 'Menunggu Persetujuan', diterima: 'Disetujui', ditolak: 'Ditolak', selesai: 'Selesai' }
  return map[String(status).toLowerCase()] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    draft: 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    diajukan: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    diterima: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    selesai: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  }
  return map[String(status).toLowerCase()] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const submitAjukan = async () => {
  if (!canCreate.value) {
    toast.add({ title: 'Akses ditolak', description: 'Anda tidak memiliki izin membuat pengajuan penyusutan.', color: 'error' })
    return
  }
  if (!item.value) return
  submitting.value = true
  try {
    await ajukanPenyusutan({
      berkasId: (item.value as any).berkasId ?? item.value.id,
      kodeBerkas: item.value.kode_berkas || undefined,
      namaBerkas: item.value.nama_berkas || undefined,
      klasifikasi: item.value.klasifikasi || undefined,
      klasifikasiText: (item.value as any).klasifikasiText || (item.value as any).klasifikasi_text || undefined,
      tanggalRetensiHabis: item.value.tanggal_retensi_habis || undefined,
      jenisPenyusutan: formJenis.value,
      atasanList: selectedAtasanList.value.map((v) => ({
        persnum: v.persnum,
        name: v.name,
        ...(v.positionId ? { positionId: v.positionId } : {}),
        positionText: v.positionText,
      })),
      catatan: formCatatan.value || undefined,
      daftarArsip: (item.value as any).daftar_arsip ?? (item.value as any).daftarArsip ?? undefined,
    })
    showAjukanModal.value = false
    toast.add({ title: 'Berhasil', description: 'Pengajuan penyusutan berhasil dikirim ke atasan managerial.', color: 'success' })
    navigateTo('/maintenance/penyusutan/pengajuan-penyusutan')
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal mengajukan penyusutan', color: 'error' })
  } finally {
    submitting.value = false
  }
}

const onClickOutside = (e: MouseEvent) => {
  if (atasanDropdownRef.value && !atasanDropdownRef.value.contains(e.target as Node)) {
    atasanDropdownOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)
  await loadItem()
  loadAtasanManagerial()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  closeLampiranPreview()
})
</script>
