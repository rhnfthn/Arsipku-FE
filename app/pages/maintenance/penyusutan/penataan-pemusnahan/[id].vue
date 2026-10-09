<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Penataan / Pemusnahan — ${item?.no_usulan ?? ''}`" :items="breadcrumbs" />
      <NuxtLink to="/maintenance/penyusutan/penataan-pemusnahan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="detailLoading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center shadow-sm">
      <UIcon name="i-lucide-loader-2" class="mx-auto mb-2 h-6 w-6 animate-spin text-[#457fb6]" />
      <p class="text-gray-500 dark:text-gray-400">Memuat detail arsip...</p>
    </div>

    <div v-else-if="!item" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center shadow-sm">
      <p class="text-gray-500 dark:text-gray-400">Arsip tidak ditemukan.</p>
    </div>

    <div v-else class="w-full space-y-5">
        <!-- Info Arsip -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            class="mb-4 flex w-full items-center justify-between gap-3 text-left"
            :aria-expanded="!infoArsipCollapsed"
            @click="infoArsipCollapsed = !infoArsipCollapsed"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
            <UIcon :name="infoArsipCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-4 w-4 shrink-0 text-gray-400" />
          </button>
          <div v-if="!infoArsipCollapsed" class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Nomor Usulan</span><p class="break-words text-gray-900 dark:text-white">{{ item.no_usulan || '-' }}</p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Kode Berkas</span><p class="break-words text-gray-900 dark:text-white">{{ item.kode_berkas || '-' }}</p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Uraian Informasi Berkas</span><p class="break-words text-gray-900 dark:text-white">{{ item.nama_berkas || '-' }}</p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</span><p class="break-words text-gray-900 dark:text-white">{{ [item.klasifikasi, item.klasifikasiText || item.klasifikasi_text].filter(Boolean).join(' — ') || '-' }}</p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Sekretaris</span><p class="break-words text-gray-900 dark:text-white">{{ item.sekretaris || '-' }}</p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Jenis Penyusutan</span><p class="mt-1">
              <span :class="item.jenis_penyusutan === 'permanen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'" class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
                {{ item.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}
              </span>
            </p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Status</span><p class="mt-1">
              <span :class="statusBadgeClass(item.status)" class="inline-flex text-xs">{{ statusLabel(item.status) }}</span>
            </p></div>
            <div><span class="text-xs text-gray-500 dark:text-gray-400">Tanggal Pengajuan</span><p class="text-gray-900 dark:text-white">{{ formatDate(item.tanggal_pengajuan) }}</p></div>
          </div>
        </div>

        <!-- Verifikator Info -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            class="mb-4 flex w-full items-center justify-between gap-3 text-left"
            :aria-expanded="!verifikasiAtasanCollapsed"
            @click="verifikasiAtasanCollapsed = !verifikasiAtasanCollapsed"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Verifikasi Atasan Managerial</h3>
            <UIcon :name="verifikasiAtasanCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5 shrink-0 text-gray-500" />
          </button>
          <div v-if="!verifikasiAtasanCollapsed" class="space-y-2">
            <div
              v-for="(v, i) in item.atasan_managerial"
              :key="i"
              class="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
            >
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-[#457fb6] text-white text-xs flex items-center justify-center font-medium">{{ v.urutan }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-white">{{ v.name }}</p>
                  <p class="text-xs text-gray-500">{{ v.jabatan }}</p>
                </div>
              </div>
              <span :class="verifikatorBadgeClass(v.status)" class="text-[11px]">{{ verifikatorLabel(v.status) }}</span>
            </div>
          </div>
        </div>

        <TransferDetailCard
          v-if="transferForTables"
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
          preview-from="penyusutan"
        />

        <section
          v-if="transferForTables?.id"
          class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Lampiran</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                PDF gabungan Berita Acara, Daftar Berkas, dan Daftar Isi Berkas.
              </p>
            </div>
            <button
              type="button"
              :disabled="lampiranLoading"
              @click="openCombinedLampiran"
              :title="lampiranLoading ? 'Memuat lampiran' : 'Preview lampiran'"
              aria-label="Preview lampiran"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <UIcon :name="lampiranLoading ? 'i-lucide-loader-2' : 'i-lucide-eye'" :class="lampiranLoading ? 'animate-spin' : ''" class="h-5 w-5" />
            </button>
          </div>
        </section>

        <TransferBeritaAcaraCard
          v-if="transferForTables"
          :transfer="transferForTables"
          :berita-acara-data="beritaAcaraData"
          preview-icon="eye"
          title="Berita Acara Pemindahan"
        />

        <section
          v-if="transferForTables"
          class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            type="button"
            class="mb-4 flex w-full items-center justify-between gap-3 text-left"
            :aria-expanded="!lokasiPenyimpananCollapsed"
            @click="lokasiPenyimpananCollapsed = !lokasiPenyimpananCollapsed"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Lokasi Penyimpanan</h3>
            <UIcon :name="lokasiPenyimpananCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" class="h-5 w-5 shrink-0 text-gray-500" />
          </button>
          <div v-if="!lokasiPenyimpananCollapsed" class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
            <div class="min-w-0 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">Foto dokumentasi penataan</h3>
              </div>
              <div class="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <a v-if="transferFotoUrl" :href="transferFotoUrl" target="_blank" rel="noopener noreferrer" class="group relative block h-full w-full">
                  <img :src="transferFotoUrl" alt="Foto dokumentasi penataan arsip" class="h-64 w-full rounded-lg object-contain" />
                  <span class="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                    <UIcon name="i-lucide-eye" class="mr-1.5 h-4 w-4" />Lihat foto
                  </span>
                </a>
                <p v-else class="px-4 py-10 text-sm text-gray-400">Foto dokumentasi belum tersedia.</p>
              </div>
            </div>
            <div class="grid min-w-0 content-start gap-5">
              <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <div class="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <div><span class="text-sm text-gray-500 dark:text-gray-400">Lokasi</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ transferForTables.lokasiPenataan || '-' }}</p></div>
                  <div><span class="text-sm text-gray-500 dark:text-gray-400">No. ruang</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ transferForTables.rak || '-' }}</p></div>
                  <div><span class="text-sm text-gray-500 dark:text-gray-400">No. rak</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ transferForTables.baris || '-' }}</p></div>
                  <div><span class="text-sm text-gray-500 dark:text-gray-400">No. boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ transferForTables.kolom || '-' }}</p></div>
                  <div><span class="text-sm text-gray-500 dark:text-gray-400">Label boks</span><p class="mt-1 break-words text-base text-gray-800 dark:text-gray-200">{{ transferForTables.labelPenataan || '-' }}</p></div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <!-- Form Penataan (Permanen) -->
        <div v-if="item.jenis_penyusutan === 'permanen' && item.status === 'diterima'" class="space-y-5">
          <!-- Tombol Submit -->
          <button
            @click="submitPenataan"
            :disabled="submitting || !resolvedLokasiSimpan"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            Simpan Penataan
          </button>
        </div>

        <!-- Form Pemusnahan (Musnah) -->
        <div v-if="item.jenis_penyusutan === 'musnah' && item.status === 'diterima'" class="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900 dark:bg-gray-800">
          <div class="p-5 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
            <h3 class="text-base font-semibold text-red-700 dark:text-red-300">Form Pemusnahan Arsip</h3>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ Arsip akan dipindahkan ke database backup. Arsip asli tidak akan bisa dilihat lagi, hanya berita acara yang bisa diunduh.</p>
          </div>
          <div class="p-5 space-y-4">
            <!-- Upload Berita Acara Serah Terima -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Berita Acara Serah Terima <span class="text-red-500">*</span></label>
              <!-- File terpilih: nama dokumen + tombol hapus -->
              <div v-if="beritaAcaraFiles.length > 0" class="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <UIcon :name="beritaAcaraPreviewType === 'pdf' ? 'i-lucide-file-text' : 'i-lucide-image'" class="w-5 h-5" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-white truncate">{{ beritaAcaraFiles[0].name }}</p>
                    <p class="text-xs text-gray-500">{{ (beritaAcaraFiles[0].size / 1024).toFixed(1) }} KB</p>
                  </div>
                </div>
                <button
                  @click="removeBeritaAcara"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shrink-0"
                  title="Hapus file"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </button>
              </div>
              <!-- Card upload (muncul saat belum ada file) -->
              <FileUpload
                v-else
                v-model="beritaAcaraFiles"
                accept=".pdf,.jpg,.png"
                label="Pilih atau seret file berita acara"
                description="PDF, JPG, PNG (max 5MB)"
              />
            </div>

            <div class="flex items-center gap-3">
              <NuxtLink
                to="/maintenance/penyusutan/penataan-pemusnahan"
                class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </NuxtLink>
              <button
                @click="submitPemusnahan"
                :disabled="submitting || beritaAcaraFiles.length === 0"
                class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                <UIcon v-else name="i-lucide-flame" class="w-4 h-4" />
                Musnahkan
              </button>
            </div>
          </div>
        </div>

        <!-- Status Selesai -->
        <div v-if="item.status === 'selesai'" class="space-y-5">
          <!-- Info Selesai + Foto Dokumentasi (gabungan) — hanya untuk jenis permanen -->
          <div v-if="false" class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Lokasi Penyimpanan
                </h3>
                <button
                  v-if="!showEditFoto"
                  @click="showEditFoto = true"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                  <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <!-- Kolom Kiri: Foto Dokumentasi -->
                <div>
                  <!-- Existing foto preview -->
                  <div v-if="fotoDokumentasiUrl && !showEditFoto" class="relative group inline-block">
                    <a :href="fotoDokumentasiUrl" target="_blank" class="block">
                      <img
                        :src="fotoDokumentasiUrl"
                        alt="Foto dokumentasi"
                        class="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600 transition-shadow group-hover:shadow-lg"
                      />
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-1.5">
                          <UIcon name="i-lucide-eye" class="w-4 h-4" /> Lihat Foto
                        </span>
                      </div>
                    </a>
                  </div>
                  <!-- No foto placeholder -->
                  <div v-else-if="!showEditFoto && !fotoDokumentasiUrl" class="text-sm text-gray-400 italic py-6 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                    <UIcon name="i-lucide-image-off" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Belum ada foto dokumentasi
                  </div>
                  <!-- Edit foto form -->
                  <div v-else class="space-y-3">
                    <FileUpload
                      v-model="editFotoFiles"
                      accept="image/*"
                      label="Pilih atau seret foto dokumentasi"
                      description="JPG, PNG (max 5MB)"
                    />
                    <div v-if="editFotoPreview" class="mt-2">
                      <img :src="editFotoPreview" alt="Preview" class="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="saveFotoDokumentasi"
                        :disabled="editSubmitting || editFotoFiles.length === 0"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UIcon v-if="editSubmitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                        Simpan Foto
                      </button>
                      <button
                        @click="showEditFoto = false; editFotoFiles = []; editFotoPreview = ''"
                        class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Kolom Kanan: Lokasi Penyimpanan -->
                <div v-if="item.jenis_penyusutan === 'permanen' && item.lokasi_simpan">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary-500 mb-1.5" />
                      <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lokasi</span>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ lokasiParts[0] || '-' }}</p>
                    </div>
                    <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <UIcon name="i-lucide-door-open" class="w-5 h-5 text-primary-500 mb-1.5" />
                      <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ruang</span>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ lokasiParts[1] || '-' }}</p>
                    </div>
                    <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <UIcon name="i-lucide-library" class="w-5 h-5 text-primary-500 mb-1.5" />
                      <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Rak</span>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ lokasiParts[2] || '-' }}</p>
                    </div>
                    <div class="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <UIcon name="i-lucide-tag" class="w-5 h-5 text-primary-500 mb-1.5" />
                      <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kode</span>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{{ lokasiParts[3] || '-' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Berita Acara (always show — with edit button) -->
          <div v-if="item.jenis_penyusutan === 'musnah'" class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="p-5 flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500" /> Berita Acara
              </h3>
              <div class="flex items-center gap-2">
                <button v-if="beritaAcaraUrl && !showEditBerita" type="button" @click="openPenyusutanBeritaAcara" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 transition-colors shrink-0" title="Preview berita acara">
                  <UIcon name="i-lucide-eye" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="px-5 pb-5">
              <!-- Existing berita acara preview -->
              <div v-if="beritaAcaraUrl && !showEditBerita" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <iframe
                  :src="beritaAcaraUrl"
                  class="w-full h-[800px] border-none"
                  title="Preview Berita Acara"
                />
              </div>
              <!-- No berita acara placeholder -->
              <div v-else-if="!showEditBerita" class="text-sm text-gray-400 italic py-6 text-center">
                <UIcon name="i-lucide-file-x" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                Belum ada berita acara
              </div>
              <!-- Edit berita acara form -->
              <div v-else class="space-y-3">
                <FileUpload
                  v-model="editBeritaFiles"
                  accept=".pdf,.jpg,.png"
                  label="Pilih atau seret file berita acara"
                  description="PDF, JPG, PNG (max 5MB)"
                />
                <div class="flex items-center gap-2">
                  <button
                    @click="saveBeritaAcara"
                    :disabled="editBeritaSubmitting || editBeritaFiles.length === 0"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UIcon v-if="editBeritaSubmitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                    Simpan
                  </button>
                  <button
                    @click="showEditBerita = false; editBeritaFiles = []"
                    class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Pemusnahan -->
          <div v-if="item.jenis_penyusutan === 'musnah'" class="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-900 p-4">
            <p class="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" />
              Arsip telah dipindahkan ke database backup. Arsip asli tidak dapat dilihat lagi.
            </p>
            <button
              v-if="!item.isBackedUp"
              @click="openBackupModal"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-5 py-2.5 mt-4 text-sm font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Lanjut Backup Data
            </button>
          </div>

          <!-- Info Backup Permanen -->
          <div v-if="item.jenis_penyusutan === 'permanen' && !item.isBackedUp" class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-900 p-4">
            <p class="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" />
              Arsip permanen dapat dibackup ke database arsip. Master berkas tetap tersimpan di database utama.
            </p>
            <button
              @click="openBackupModal"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-5 py-2.5 mt-4 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Lanjut Backup Data
            </button>
          </div>
        </div>
      </div>

    <!-- Modal Konfirmasi Backup Data -->
    <Teleport to="body">
      <div v-if="showBackupModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showBackupModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Backup Data</h3>
            <button @click="showBackupModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              <template v-if="item?.jenis_penyusutan === 'permanen'">
                Backup akan memindahkan data berkas ke database arsip. Master berkas tetap tersimpan di database utama (permanen). Lanjutkan?
              </template>
              <template v-else>
                Backup akan memindahkan data berkas ke database arsip. Master berkas akan dihapus dari database utama. Tabel transaksi tetap tersimpan. Lanjutkan?
              </template>
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Catatan <span class="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                v-model="backupCatatan"
                rows="3"
                placeholder="Catatan untuk backup data..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>
          <div class="flex justify-start gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              @click="showBackupModal = false"
              class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >Batal</button>
            <button
              @click="submitBackupData"
              :disabled="submitting"
              class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <SharedSharePdfViewer
      v-model="beritaAcaraViewerOpen"
      :url="beritaAcaraViewerUrl"
      title="Preview Berita Acara"
      :loading="false"
      @close="closePenyusutanBeritaAcara"
    />

    <SharedSharePdfViewer
      v-model="lampiranViewerOpen"
      :url="lampiranViewerUrl"
      title="Lampiran"
      :loading="lampiranLoading"
      @close="closeCombinedLampiran"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue'
import TransferBeritaAcaraCard from '~/components/transfer-active-to-inactive/TransferBeritaAcaraCard.vue'
import type { ArsipPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth', 'penyusutan-access'] })

const route = useRoute()
const toast = useToast()
const { user } = useAuth()
const { apiGet, apiPost } = useApi()
const { fetchById, simpanPenataan, pemusnahan, updateFotoDokumentasi, updateBeritaAcara, backupData } = usePenyusutan()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penyusutan', to: '/maintenance/penyusutan/daftar-retensi-habis' },
  { label: 'Penataan / Pemusnahan', to: '/maintenance/penyusutan/penataan-pemusnahan' },
  { label: 'Detail', to: `/maintenance/penyusutan/penataan-pemusnahan/${route.params.id}` },
])

const beritaAcaraFiles = ref<File[]>([])
const beritaAcaraPreview = ref('')
const beritaAcaraPreviewType = ref<'pdf' | 'image'>('pdf')
const beritaAcaraViewerOpen = ref(false)
const beritaAcaraViewerUrl = ref('')
const submitting = ref(false)
const detailLoading = ref(true)
const showBackupModal = ref(false)
const backupCatatan = ref('')
const infoArsipCollapsed = ref(false)
const verifikasiAtasanCollapsed = ref(false)
const lokasiPenyimpananCollapsed = ref(false)

/** Buka modal konfirmasi backup data. */
const openBackupModal = () => {
  backupCatatan.value = ''
  showBackupModal.value = true
}

/** Hapus file berita acara yang dipilih — card upload muncul kembali. */
const removeBeritaAcara = () => {
  beritaAcaraFiles.value = []
  beritaAcaraPreview.value = ''
}

/** True jika user login adalah pemilik (TU) dari pengajuan ini. */
const isOwner = computed(() => {
  if (!item.value || !user.value) return false
  return Number(item.value.tuPersnum) === Number(user.value.persnum)
})

// ── Edit Foto Dokumentasi (setelah selesai) ──
const showEditFoto = ref(false)
const editFotoFiles = ref<File[]>([])
const editFotoPreview = ref('')
const editSubmitting = ref(false)

// ── Edit Berita Acara (setelah selesai) ──
const showEditBerita = ref(false)
const editBeritaFiles = ref<File[]>([])
const editBeritaSubmitting = ref(false)

const saveBeritaAcara = async () => {
  if (!item.value || editBeritaFiles.value.length === 0) return
  editBeritaSubmitting.value = true
  try {
    const beritaAcaraKey = await uploadFile(editBeritaFiles.value[0])
    if (!beritaAcaraKey) {
      toast.add({ title: 'Gagal', description: 'File gagal diupload ke MinIO', color: 'error' })
      return
    }
    await updateBeritaAcara(item.value.id, beritaAcaraKey)
    toast.add({ title: 'Berhasil', description: 'Berita acara berhasil diperbarui.', color: 'success' })
    showEditBerita.value = false
    editBeritaFiles.value = []
    // Reload detail + fetch fresh file URLs
    item.value = await fetchById(route.params.id as string)
    await loadFileUrls()
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal memperbarui berita acara', color: 'error' })
  } finally {
    editBeritaSubmitting.value = false
  }
}

watch(editFotoFiles, (newFiles) => {
  if (newFiles.length > 0) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      editFotoPreview.value = ev.target?.result as string
    }
    reader.readAsDataURL(newFiles[0])
  } else {
    editFotoPreview.value = ''
  }
}, { deep: true })

const saveFotoDokumentasi = async () => {
  if (!item.value || editFotoFiles.value.length === 0) return
  editSubmitting.value = true
  try {
    const fotoUrl = await uploadFile(editFotoFiles.value[0])
    if (!fotoUrl) {
      toast.add({ title: 'Gagal', description: 'Foto gagal diupload ke MinIO', color: 'error' })
      return
    }
    await updateFotoDokumentasi(item.value.id, fotoUrl)
    toast.add({ title: 'Berhasil', description: 'Foto dokumentasi berhasil diperbarui.', color: 'success' })
    showEditFoto.value = false
    editFotoFiles.value = []
    editFotoPreview.value = ''
    // Reload detail
    item.value = await fetchById(route.params.id as string)
    await loadFileUrls()
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal memperbarui foto', color: 'error' })
  } finally {
    editSubmitting.value = false
  }
}

const item = ref<ArsipPenyusutan | null>(null)
const transferData = ref<any>(null)
const daftarBerkasRows = ref<any[]>([])
const daftarIsiRows = ref<any[]>([])
const beritaAcaraData = ref<any>(null)
const transferFotoUrl = ref('')
const lampiranLoading = ref(false)
const lampiranViewerOpen = ref(false)
const lampiranViewerUrl = ref('')

const transferForTables = computed(() => {
  if (!transferData.value) return null
  return {
    ...transferData.value,
    id: transferData.value.id ?? item.value?.penataanData?.transferId ?? item.value?.transferId,
    status: transferData.value.status ?? 'SELESAI',
    lokasiPenataan: transferData.value.lokasiPenataan ?? item.value?.penataanData?.lokasiPenataan ?? item.value?.lokasi_simpan,
  }
})

const resolvedLokasiSimpan = computed(() => {
  if (item.value?.lokasi_simpan) return item.value.lokasi_simpan
  const transfer = transferForTables.value
  return [
    transfer?.lokasiPenataan ?? transfer?.lokasi_penataan,
    transfer?.rak,
    transfer?.baris,
    transfer?.kolom,
  ].filter(Boolean).join(' / ')
})

// Split lokasi_simpan into parts for display
const lokasiParts = computed(() => {
  const lokasi = item.value?.lokasi_simpan ?? ''
  return lokasi.split(' / ').map(s => s.trim()).filter(Boolean)
})

const loadTransferCardData = async () => {
  if (!item.value) return
  const metadata = item.value.penataanData
  const transferId = metadata?.transferId ?? metadata?.transfer?.id ?? item.value.transferId ?? item.value.transfer_id
  transferData.value = metadata?.transfer ?? null
  daftarBerkasRows.value = Array.isArray(metadata?.daftarBerkas) ? metadata.daftarBerkas : []
  daftarIsiRows.value = Array.isArray(metadata?.daftarIsi) ? metadata.daftarIsi : []

  if (!transferId) return

  try {
    if (!transferData.value) {
      const transferResponse: any = await apiGet(`/transfer-active-to-inactive/${transferId}`, {}, { skipCache: true })
      transferData.value = transferResponse?.data?.data ?? transferResponse?.data ?? transferResponse
    }
  } catch (error) {
    console.warn('Gagal memuat informasi usulan pemindahan terkait:', error)
  }

  try {
    if (!daftarBerkasRows.value.length || !daftarIsiRows.value.length) {
      const listResponse: any = await apiGet(`/transfer-active-to-inactive/${transferId}/daftar-isi`, {}, { skipCache: true })
      const lists = listResponse?.data?.data ?? listResponse?.data ?? listResponse
      if (Array.isArray(lists?.daftarBerkas)) daftarBerkasRows.value = lists.daftarBerkas
      if (Array.isArray(lists?.daftarIsi)) daftarIsiRows.value = lists.daftarIsi
    }
  } catch (error) {
    console.warn('Gagal memuat daftar berkas penyusutan:', error)
  }

  try {
    const beritaResponse: any = await apiGet(`/transfer-active-to-inactive/${transferId}/berita-acara-data`, {}, { skipCache: true })
    beritaAcaraData.value = beritaResponse?.data?.data ?? beritaResponse?.data ?? beritaResponse
  } catch (error) {
    console.warn('Gagal memuat berita acara pemindahan terkait:', error)
  }

  const fotoKey = transferData.value?.fotoPenataan ?? transferData.value?.foto_penataan
  if (fotoKey) {
    if (/^https?:\/\//i.test(fotoKey)) {
      transferFotoUrl.value = fotoKey
    } else {
      transferFotoUrl.value = await getFileUrl(fotoKey) ?? ''
    }
  }
}

// ── Fresh presigned URLs for MinIO files ──
const beritaAcaraUrl = ref('')
const fotoDokumentasiUrl = ref('')

const loadFileUrls = async () => {
  if (!item.value) {
    console.error('loadFileUrls: item.value is null')
    return
  }
  // Reset URLs
  beritaAcaraUrl.value = ''
  fotoDokumentasiUrl.value = ''

  try {
    console.log('loadFileUrls: fetching for id', item.value.id)
    const res: any = await apiGet(`/penyusutan/${item.value.id}/file-urls`, {}, { skipCache: true })
    console.log('loadFileUrls: response', res)
    const urls = res?.data ?? res
    if (urls?.beritaAcaraUrl) {
      beritaAcaraUrl.value = urls.beritaAcaraUrl
      console.log('loadFileUrls: beritaAcaraUrl set', urls.beritaAcaraUrl)
    }
    if (urls?.fotoDokumentasiUrl) {
      fotoDokumentasiUrl.value = urls.fotoDokumentasiUrl
      console.log('loadFileUrls: fotoDokumentasiUrl set', urls.fotoDokumentasiUrl)
    }
  } catch (e) {
    console.error('loadFileUrls: error', e)
  }
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { diterima: 'Disetujui', selesai: 'Selesai', diajukan: 'Menunggu Persetujuan', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    diterima: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    selesai: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    diajukan: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const verifikatorLabel = (status: string) => {
  const map: Record<string, string> = { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const verifikatorBadgeClass = (status: string) => {
  const s = (status ?? '').toUpperCase()
  const map: Record<string, string> = {
    MENUNGGU: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI: 'px-2 py-0.5 rounded-full font-medium bg-green-500 text-white',
    DITOLAK: 'px-2 py-0.5 rounded-full font-medium bg-red-500 text-white',
  }
  return map[s] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

// Preview file berita acara saat file dipilih.
watch(beritaAcaraFiles, (newFiles) => {
  if (newFiles.length > 0) {
    const file = newFiles[0]
    if (file.type === 'application/pdf') {
      beritaAcaraPreview.value = URL.createObjectURL(file)
      beritaAcaraPreviewType.value = 'pdf'
    } else if (file.type.startsWith('image/')) {
      beritaAcaraPreview.value = URL.createObjectURL(file)
      beritaAcaraPreviewType.value = 'image'
    } else {
      beritaAcaraPreview.value = ''
    }
  } else {
    beritaAcaraPreview.value = ''
  }
}, { deep: true })

// ── Upload foto ke MinIO ──
const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res: any = await apiPost('/upload/file/penyusutan', formData)
    // Save the KEY (permanent), not the URL (presigned, expires in 1 hour)
    return res?.data?.key ?? null
  } catch (e) {
    console.error('Gagal upload file:', e)
    return null
  }
}

/** Get fresh presigned URL from MinIO for a key. */
const getFileUrl = async (key: string): Promise<string | null> => {
  try {
    // Don't encode slashes — backend route uses wildcard (*key) that captures the full path
    const safeKey = key.split('/').map(encodeURIComponent).join('/')
    const res: any = await apiGet(`/upload/url/${safeKey}`, {}, { skipCache: true })
    const url = res?.data?.url ?? res?.url ?? null
    if (!url) {
      console.error('getFileUrl: no URL in response', res)
    }
    return url
  } catch (e) {
    console.error('getFileUrl error:', e)
    return null
  }
}

// ── Format tanggal untuk Berita Acara ──
const formatBaDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const formatBaDay = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[d.getDay()]
}

const openPenyusutanBeritaAcara = () => {
  if (!beritaAcaraUrl.value) return
  beritaAcaraViewerUrl.value = beritaAcaraUrl.value
  beritaAcaraViewerOpen.value = true
}

const closePenyusutanBeritaAcara = () => {
  beritaAcaraViewerUrl.value = ''
}

const closeCombinedLampiran = () => {
  lampiranViewerOpen.value = false
  if (lampiranViewerUrl.value.startsWith('blob:')) URL.revokeObjectURL(lampiranViewerUrl.value)
  lampiranViewerUrl.value = ''
}

const openCombinedLampiran = async () => {
  const transferId = transferForTables.value?.id
  if (!transferId) {
    toast.add({ title: 'Lampiran tidak tersedia', description: 'Data usulan pemindahan terkait belum ditemukan.', color: 'warning' })
    return
  }

  closeCombinedLampiran()
  lampiranViewerOpen.value = true
  lampiranLoading.value = true
  try {
    let response: any = await apiGet(
      `/transfer-active-to-inactive/${transferId}/lampiran-penataan.pdf`,
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
      { skipCache: true },
    )
    if (response && typeof response === 'object' && !(response instanceof Blob) && 'data' in response) {
      response = response.data
    }
    const pdfBlob = response instanceof Blob
      ? response
      : response instanceof ArrayBuffer
        ? new Blob([response], { type: 'application/pdf' })
        : ArrayBuffer.isView(response)
          ? new Blob([new Uint8Array(response.buffer, response.byteOffset, response.byteLength)], { type: 'application/pdf' })
          : null
    if (!pdfBlob || pdfBlob.size === 0 || (await pdfBlob.slice(0, 5).text()) !== '%PDF-') {
      throw new Error('Lampiran gabungan bukan PDF yang valid.')
    }
    lampiranViewerUrl.value = URL.createObjectURL(pdfBlob)
  } catch (error: any) {
    lampiranViewerOpen.value = false
    let description = error?.response?.data?.message || error?.message
    if (error?.response?.data instanceof Blob) {
      try {
        const body = JSON.parse(await error.response.data.text())
        description = body?.message || description
      } catch { /* gunakan pesan fallback */ }
    }
    toast.add({ title: 'Lampiran gagal dibuka', description: description || 'Silakan coba kembali.', color: 'error' })
  } finally {
    lampiranLoading.value = false
  }
}

const submitPenataan = async () => {
  if (!item.value || !resolvedLokasiSimpan.value) return
  submitting.value = true
  try {
    const lokasiFull = resolvedLokasiSimpan.value

    // Gunakan berita acara yang sudah tersedia dari usulan pemindahan terkait
    // atau lampiran penataan yang telah tersimpan; tidak perlu upload duplikat.
    const beritaAcaraPath = item.value.beritaAcara || item.value.berita_acara || beritaAcaraUrl.value ||
      transferForTables.value?.beritaAcaraUrl ||
      transferForTables.value?.berita_acara_url ||
      ''
    const fotoPath = item.value.fotoDokumentasi || item.value.foto_dokumentasi ||
      transferForTables.value?.fotoPenataan || transferForTables.value?.foto_penataan || ''
    await simpanPenataan(item.value.id, { lokasiSimpan: lokasiFull, beritaAcara: beritaAcaraPath, fotoDokumentasi: fotoPath })
    toast.add({ title: 'Berhasil', description: 'Penataan arsip permanen berhasil disimpan.', color: 'success' })
    // Reload detail + fetch fresh file URLs
    item.value = await fetchById(route.params.id as string)
    await loadFileUrls()
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menyimpan penataan', color: 'error' })
  } finally {
    submitting.value = false
  }
}

const submitPemusnahan = async () => {
  if (!item.value || beritaAcaraFiles.value.length === 0) return
  submitting.value = true
  try {
    // Upload berita acara ke MinIO
    let beritaAcaraPath: string | null = null
    if (beritaAcaraFiles.value.length > 0) {
      beritaAcaraPath = await uploadFile(beritaAcaraFiles.value[0])
    }
    await pemusnahan(item.value.id, { beritaAcara: beritaAcaraPath ?? '' })
    toast.add({ title: 'Berhasil', description: 'Arsip berhasil dimusnahkan dan dibackup ke database arsip.', color: 'success' })
    // Reload detail + fetch fresh file URLs
    item.value = await fetchById(route.params.id as string)
    await loadFileUrls()
    // Redirect ke halaman status backup data
    navigateTo('/maintenance/penyusutan/backup-status')
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal memusnahkan arsip', color: 'error' })
  } finally {
    submitting.value = false
  }
}

/** Lanjut backup data — pindahkan berkas ke DB arsip, lalu hapus master dari DB inti. */
const submitBackupData = async () => {
  if (!item.value) return
  showBackupModal.value = false
  submitting.value = true
  try {
    await backupData(item.value.id, { catatan: backupCatatan.value || undefined })
    toast.add({ title: 'Berhasil', description: 'Data berhasil dibackup.', color: 'success' })
    // Reload detail — status menjadi SELESAI
    item.value = await fetchById(route.params.id as string)
    await loadFileUrls()
    // Redirect ke halaman status backup data
    navigateTo('/maintenance/penyusutan/backup-status')
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.response?.data?.message || e?.message || 'Gagal membackup data arsip', color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  detailLoading.value = true
  try {
    item.value = await fetchById(route.params.id as string)
    if (item.value && !isOwner.value) {
      // Endpoint tidak boleh diakses — redirect ke beranda.
      useToast().add({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki akses ke halaman ini.',
        color: 'error',
      })
      await navigateTo('/beranda')
      return
    }
    if (item.value) await Promise.all([loadFileUrls(), loadTransferCardData()])
  } finally {
    detailLoading.value = false
  }
})

onBeforeUnmount(closeCombinedLampiran)
</script>
