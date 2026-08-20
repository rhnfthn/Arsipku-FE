<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-4xl mx-auto">
      <!-- Breadcrumb -->
      <div class="mb-6">
        <NuxtLink to="/maintenance/penyusutan/penataan-pemusnahan" class="inline-flex items-center gap-1.5 text-sm text-[#457fb6] hover:underline mb-3">
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali ke Penataan / Pemusnahan
        </NuxtLink>
        <Heading variant="heading6b" class="text-mobile-md">Detail Penataan / Pemusnahan</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <div v-if="!item" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
        <p class="text-gray-500 dark:text-gray-400">Arsip tidak ditemukan.</p>
      </div>

      <div v-else class="space-y-5">
        <!-- Info Arsip -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Arsip</h3>
          </div>
          <div class="p-5 space-y-3">
            <div class="flex justify-between text-sm"><span class="text-gray-500">Kode Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item.kode_berkas }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">No Usulan</span><span class="font-medium text-gray-800 dark:text-white">{{ item.no_usulan }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Nama Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ item.nama_berkas }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Sekretaris</span><span class="font-medium text-gray-800 dark:text-white">{{ item.sekretaris }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Jenis Penyusutan</span>
              <span :class="item.jenis_penyusutan === 'permanen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'" class="px-2 py-0.5 rounded-full text-[11px] font-medium">
                {{ item.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}
              </span>
            </div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Status</span>
              <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
            </div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Pengajuan</span><span class="font-medium text-gray-800 dark:text-white">{{ formatDate(item.tanggal_pengajuan) }}</span></div>
          </div>
        </div>

        <!-- Verifikator Info -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Verifikasi Atasan Managerial</h3>
          </div>
          <div class="p-5 space-y-2">
            <div
              v-for="(v, i) in item.atasan_managerial"
              :key="i"
              class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
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

        <!-- Daftar Arsip (Berkas) -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Daftar Arsip
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ daftarArsipItems.length }}</span>
            </h3>
          </div>
          <div class="p-5">
            <div v-if="daftarArsipItems.length" class="space-y-1.5">
              <div
                v-for="(a, idx) in daftarArsipItems"
                :key="a.id || idx"
                class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 dark:text-white truncate">
                    <span v-if="a.kode" class="font-mono text-xs text-gray-500">{{ a.kode }}</span>
                    <span v-if="a.kode"> — </span>
                    {{ a.nama }}
                  </p>
                </div>
                <NuxtLink
                  v-if="item.jenis_penyusutan === 'permanen'"
                  :to="`/maintenance/preview-berkas/${a.id}?from=penyusutan`"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 transition-colors shrink-0"
                  title="Lihat detail berkas"
                >
                  <UIcon name="i-lucide-eye" class="w-4 h-4" />
                </NuxtLink>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400 italic py-2">
              Tidak ada arsip
            </div>
          </div>
        </div>

        <!-- Form Penataan (Permanen) -->
        <div v-if="item.jenis_penyusutan === 'permanen' && item.status === 'diterima'" class="space-y-5">
          <!-- Card: Berita Acara (Upload) -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-5">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Berita Acara</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload file berita acara penataan arsip.</p>
            </div>
            <div class="px-5 pb-5">
              <!-- File terpilih: nama dokumen + tombol hapus -->
              <div v-if="beritaAcaraFiles.length > 0" class="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-9 h-9 rounded-lg bg-[#457fb6]/10 text-[#457fb6] flex items-center justify-center shrink-0">
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
          </div>

          <!-- Card: Lokasi Penyimpanan -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-5">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Lokasi Penyimpanan</h3>
              <div class="space-y-4">
              <div>
                <input
                  v-model="lokasiSimpan"
                  type="text"
                  placeholder="Contoh: Gudang Arsip Inaktif Lantai 3"
                  class="w-full h-10 px-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Ruang</label>
                  <input
                    v-model="ruang"
                    type="text"
                    placeholder="Contoh: Ruang Arsip 1"
                    class="w-full h-10 px-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Rak</label>
                  <input
                    v-model="rak"
                    type="text"
                    placeholder="Contoh: Rak A"
                    class="w-full h-10 px-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Kode</label>
                  <input
                    v-model="kode"
                    type="text"
                    placeholder="Contoh: KODE-001"
                    class="w-full h-10 px-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
                  />
                </div>
              </div>
              </div>
            </div>
          </div>

          <!-- Card: Foto Dokumentasi -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-5">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Foto Dokumentasi</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload foto dokumentasi arsip (opsional).</p>
            </div>
            <div class="px-5 pb-5">
              <!-- File terpilih: nama dokumen + tombol hapus -->
              <div v-if="fotoFiles.length > 0" class="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-9 h-9 rounded-lg bg-[#457fb6]/10 text-[#457fb6] flex items-center justify-center shrink-0">
                    <UIcon name="i-lucide-image" class="w-5 h-5" />
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-white truncate">{{ fotoFiles[0].name }}</p>
                    <p class="text-xs text-gray-500">{{ (fotoFiles[0].size / 1024).toFixed(1) }} KB</p>
                  </div>
                </div>
                <button
                  @click="removeFoto"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shrink-0"
                  title="Hapus file"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </button>
              </div>
              <!-- Card upload (muncul saat belum ada file) -->
              <FileUpload
                v-else
                v-model="fotoFiles"
                accept="image/*"
                label="Pilih atau seret foto dokumentasi"
                description="JPG, PNG (max 5MB)"
              />
            </div>
          </div>

          <!-- Tombol Submit -->
          <button
            @click="submitPenataan"
            :disabled="submitting || !lokasiSimpan || beritaAcaraFiles.length === 0"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            Simpan Penataan
          </button>
        </div>

        <!-- Form Pemusnahan (Musnah) -->
        <div v-if="item.jenis_penyusutan === 'musnah' && item.status === 'diterima'" class="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
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
          <div v-if="item.jenis_penyusutan === 'permanen'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-5">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Lokasi Penyimpanan
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <!-- Kolom Kiri: Foto Dokumentasi -->
                <div>
                  <div class="flex items-center justify-end mb-3">
                    <button
                      v-if="!showEditFoto"
                      @click="showEditFoto = true"
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                    >
                      <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
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
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-5 flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500" /> Berita Acara
              </h3>
              <div class="flex items-center gap-2">
                <a v-if="beritaAcaraUrl && !showEditBerita" :href="beritaAcaraUrl" target="_blank" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                  <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" /> Buka
                </a>
                <button
                  v-if="!showEditBerita"
                  @click="showEditBerita = true"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                  <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" /> Edit
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import type { ArsipPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth'] })

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

const lokasiSimpan = ref('')
const rak = ref('')
const kode = ref('')
const ruang = ref('')
const beritaAcaraFiles = ref<File[]>([])
const beritaAcaraPreview = ref('')
const beritaAcaraPreviewType = ref<'pdf' | 'image'>('pdf')
const fotoFiles = ref<File[]>([])
const fotoPreview = ref('')
const submitting = ref(false)
const showBackupModal = ref(false)
const backupCatatan = ref('')

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

/** Hapus file foto dokumentasi yang dipilih — card upload muncul kembali. */
const removeFoto = () => {
  fotoFiles.value = []
  fotoPreview.value = ''
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

// Split lokasi_simpan into parts for display
const lokasiParts = computed(() => {
  const lokasi = item.value?.lokasi_simpan ?? ''
  return lokasi.split(' / ').map(s => s.trim()).filter(Boolean)
})

// Daftar arsip (naskah) — normalize dari daftar_arsip (snake_case) atau daftarArsip (camelCase)
const daftarArsipItems = computed(() => {
  const raw = item.value?.daftar_arsip ?? item.value?.daftarArsip ?? []
  return Array.isArray(raw) ? raw : []
})

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

// Preview foto saat fotoFiles berubah
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

watch(fotoFiles, (newFiles) => {
  if (newFiles.length > 0) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      fotoPreview.value = ev.target?.result as string
    }
    reader.readAsDataURL(newFiles[0])
  } else {
    fotoPreview.value = ''
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

// ── Print Berita Acara ──
const printBeritaAcara = () => {
  const el = document.getElementById('berita-acara-print')
  if (!el || !item.value) return
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Berita Acara Penataan Arsip</title><style>
    *{box-sizing:border-box}body{font-family:'Times New Roman',serif;padding:40px;max-width:800px;margin:0 auto;color:#111}
    .text-sm{font-size:13px}.text-xs{font-size:12px}.text-base{font-size:16px}
    .text-center{text-align:center}.text-right{text-align:right}
    .font-bold{font-weight:700}.font-semibold{font-weight:600}.italic{font-style:italic}
    .mb-1{margin-bottom:4px}.mb-3{margin-bottom:12px}.mb-4{margin-bottom:16px}
    .mb-6{margin-bottom:24px}.mb-16{margin-bottom:64px}.space-y-3>*+*{margin-top:12px}
    .leading-relaxed{line-height:1.625}.text-gray-500{color:#6b7280}
    .grid{display:grid}.grid-cols-2{grid-template-columns:1fr 1fr}
    .gap-8{gap:32px}.border-t{border-top:1px solid #9ca3af}.pt-1{padding-top:4px}
    ol{padding-left:20px;margin:0}li{margin-bottom:4px}p{margin:0}
    .py-4{padding-top:16px;padding-bottom:16px}
  </style></head><body>${el.innerHTML}</body></html>`)
  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250)
}

const submitPenataan = async () => {
  if (!item.value || !lokasiSimpan.value || beritaAcaraFiles.value.length === 0) return
  submitting.value = true
  try {
    // Gabungkan lokasi: lokasiSimpan + ruang + rak + kode
    const lokasiParts = [lokasiSimpan.value]
    if (ruang.value) lokasiParts.push(ruang.value)
    if (rak.value) lokasiParts.push(rak.value)
    if (kode.value) lokasiParts.push(kode.value)
    const lokasiFull = lokasiParts.join(' / ')

    // Upload berita acara ke MinIO
    let beritaAcaraPath: string | null = null
    if (beritaAcaraFiles.value.length > 0) {
      beritaAcaraPath = await uploadFile(beritaAcaraFiles.value[0])
    }
    // Upload foto dokumentasi ke MinIO jika ada
    let fotoPath: string | null = null
    if (fotoFiles.value.length > 0) {
      fotoPath = await uploadFile(fotoFiles.value[0])
      if (!fotoPath) {
        toast.add({ title: 'Peringatan', description: 'Foto dokumentasi gagal diupload, tetapi penataan tetap disimpan.', color: 'warning' })
      }
    }
    await simpanPenataan(item.value.id, { lokasiSimpan: lokasiFull, beritaAcara: beritaAcaraPath ?? '', fotoDokumentasi: fotoPath ?? '' })
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
  item.value = await fetchById(route.params.id as string)
  if (item.value && !isOwner.value) {
    // Endpoint tidak boleh diakses — redirect ke beranda.
    useToast().add({
      title: 'Akses Ditolak',
      description: 'Anda tidak memiliki akses ke halaman ini.',
      color: 'error',
    })
    navigateTo('/beranda')
    return
  }
  await loadFileUrls()
})
</script>