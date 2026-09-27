<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Penerimaan Usulan — ${item?.nomorUsulan ?? ''}`"
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

    <!-- Content -->
    <template v-else-if="item">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Kiri: Informasi Usulan + Daftar Arsip + Berita Acara -->
        <div class="lg:col-span-8 space-y-5">
          <!-- Card 1: Informasi Usulan -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
              <span :class="statusBadgeClass(item.status)" class="text-xs">{{ statusLabel(item.status) }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.nomorUsulan }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diajukan ke TU</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalDikirim) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.sekretarisName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipKode ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipKlasifikasi ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipTindakanPenyusutan ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nama Berkas</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.arsipPerihal }}</p>
              </div>
            </div>

            <!-- Keterangan -->
            <div v-if="item.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
                {{ item.keterangan }}
              </p>
            </div>
          </div>

          <!-- Card 2: Daftar Arsip yang Akan Dipindahkan -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Daftar Arsip ({{ daftarBerkas.length }})
            </h3>
            <div class="space-y-1.5">
              <div
                v-for="(berkas, idx) in daftarBerkas"
                :key="idx"
                class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 dark:text-white truncate">
                    <span v-if="berkas.kode" class="font-mono text-xs text-gray-500">{{ berkas.kode }}</span>
                    — {{ berkas.perihal }}
                  </p>
                </div>
                <NuxtLink
                  v-if="berkas.id"
                  :to="`/maintenance/preview-berkas/${berkas.id}?nomor_usulan=${item.nomorUsulan}&usulan_id=${item.id}&from=tu`"
                  class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 shrink-0"
                  title="Lihat detail berkas"
                >
                  <UIcon name="i-lucide-eye" class="w-4 h-4" />
                </NuxtLink>
              </div>
              <div v-if="daftarBerkas.length === 0" class="text-sm text-gray-400 italic py-2">
                Tidak ada arsip
              </div>
            </div>
          </div>

          <!-- Card: Atasan Managerial Pengusul (Berjenjang) -->
          <div
            v-if="item.approvalLevels && item.approvalLevels.length > 0"
            class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Atasan Managerial <span class="text-red-500">*</span></h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi .</p>
              </div>
            </div>
            <div class="space-y-3 px-5 py-5">
              <div
                v-for="(level, idx) in item.approvalLevels"
                :key="level.id"
                class="relative"
              >
                <div class="mb-1.5 flex items-center justify-between">
                  <label class="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Atasan Managerial{{ idx === 0 ? ' *' : ` ${idx + 1}` }}
                  </label>
                </div>
                <div class="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  <span class="font-medium">{{ level.atasanName }}</span>
                  <UIcon name="i-lucide-chevron-down" class="h-4 w-4 shrink-0 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <!-- Card: Daftar Isi -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Isi</h3>
              <button @click="printDaftarIsi" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <UIcon name="i-lucide-printer" class="w-3.5 h-3.5" /> Print
              </button>
            </div>
            <div id="daftar-isi-print" class="text-sm">
              <p class="font-semibold text-gray-900 dark:text-white mb-3">{{ item.nomorUsulan }}</p>
              <table class="w-full border-collapse text-xs">
                <thead>
                  <tr class="border-b-2 border-gray-300 dark:border-gray-500">
                    <th class="text-left py-2 px-2 text-gray-500 w-10">No</th>
                    <th class="text-left py-2 px-2 text-gray-500">Kode Berkas</th>
                    <th class="text-left py-2 px-2 text-gray-500">Nama Berkas</th>
                    <th class="text-center py-2 px-2 text-gray-500 w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, idx) in daftarIsi" :key="idx" class="border-b border-gray-100 dark:border-gray-700">
                    <td class="py-2 px-2 text-gray-600 dark:text-gray-300">{{ d.no }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ d.kode ?? '-' }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ d.namaBerkas }}</td>
                    <td class="text-center py-2 px-2">
                      <NuxtLink
                        v-if="d.id"
                        :to="`/maintenance/preview-berkas/${d.id}?nomor_usulan=${item.nomorUsulan}&usulan_id=${item.id}&from=tu`"
                        class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                        title="Lihat detail berkas"
                      >
                        <UIcon name="i-lucide-eye" class="w-4 h-4" />
                      </NuxtLink>
                    </td>
                  </tr>
                  <tr v-if="daftarIsi.length === 0">
                    <td colspan="4" class="py-4 text-center text-gray-400 italic">Tidak ada arsip</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Berita Acara Serah Terima -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Berita Acara Serah Terima</h3>
              <button @click="printBeritaAcara" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <UIcon name="i-lucide-printer" class="w-3.5 h-3.5" /> Print
              </button>
            </div>
            <div id="berita-acara-print" class="text-sm" style="font-family: 'Times New Roman', serif;">
              <p class="font-bold text-center text-base mb-1">BERITA ACARA SERAH TERIMA PEKERJAAN</p>
              <p class="text-center text-xs text-gray-500 mb-1">Pemindahan Arsip Aktif ke Inaktif</p>
              <p class="text-center text-xs mb-3">Nomor: {{ beritaAcaraData?.nomorUsulan ?? item.nomorUsulan }}</p>
              <p class="text-center text-xs text-gray-500 mb-4">Tanggal: {{ formatBaDate(item.tanggalUsulan) }}</p>
              <p class="text-xs leading-relaxed mb-4">
                Pada hari ini {{ formatBaDay(item.tanggalUsulan) }} tanggal {{ formatBaDate(item.tanggalUsulan) }}, yang bertanda tangan di bawah ini:
              </p>
              <div class="space-y-3 mb-4 text-xs">
                <div>
                  <p><span class="font-semibold">1. Nama</span> &nbsp;&nbsp;&nbsp;: {{ beritaAcaraData?.atasan?.nama ?? item.atasanName ?? '-' }}</p>
                  <p><span class="font-semibold">&nbsp;&nbsp;&nbsp;Jabatan</span> : {{ beritaAcaraData?.atasan?.jabatan ?? '-' }}</p>
                  <p class="text-gray-500 italic">Selanjutnya disebut pihak pertama</p>
                </div>
                <div>
                  <p><span class="font-semibold">2. Nama</span> &nbsp;&nbsp;&nbsp; :</p>
                  <p><span class="font-semibold">&nbsp;&nbsp;&nbsp;Jabatan</span> :</p>
                  <p class="text-gray-500 italic">Selanjutnya disebut pihak kedua</p>
                </div>
              </div>
              <p class="text-xs leading-relaxed mb-3">Dengan ini menerangkan bahwa:</p>
              <p class="text-xs leading-relaxed mb-3">Pihak pertama telah menyerahkan kepada pihak kedua berupa:</p>
              <ol class="list-decimal list-inside text-xs space-y-1 mb-4 ml-2">
                <li v-for="(arsip, idx) in (beritaAcaraData?.daftarArsip ?? [])" :key="idx">
                  {{ arsip.kode ?? '-' }} — {{ arsip.perihal }}
                </li>
                <li v-if="beritaAcaraData?.keterangan || item.keterangan">
                  {{ beritaAcaraData?.keterangan ?? item.keterangan }}
                </li>
              </ol>
              <p class="text-xs leading-relaxed mb-6">Demikian Berita Acara serah terima ini dibuat rangkap 2 untuk dapat digunakan sebagaimana mestinya.</p>
              <p class="text-xs text-right mb-6">Jakarta, {{ formatBaDate(item.tanggalUsulan) }}</p>
              <div class="grid grid-cols-2 gap-8 text-xs">
                <div class="text-center">
                  <p class="font-semibold mb-16">Pihak Pertama</p>
                  <p class="border-t border-gray-400 pt-1 font-semibold">{{ beritaAcaraData?.atasan?.nama ?? item.atasanName ?? '-' }}</p>
                  <p class="text-gray-500">{{ beritaAcaraData?.atasan?.jabatan ?? '-' }}</p>
                </div>
                <div class="text-center">
                  <p class="font-semibold mb-16">Pihak Kedua</p>
                  <p class="border-t border-gray-400 pt-1 font-semibold">&nbsp;</p>
                  <p class="text-gray-500">&nbsp;</p>
                </div>
              </div>
            </div>
          </div>

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

        <!-- Kanan: Timeline Riwayat -->
        <div class="lg:col-span-4 space-y-5">
          <TimelineRiwayat :item="item as any" />
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
                    placeholder="Ketik nama atau persnum atasan..."
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
              :disabled="!atasanTuInputs[0] || actionLoading"
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
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { apiGet } = useApi()
const { fetchNotifikasiDetail, fetchAtasanTuOptions, ajukanAtasanTu, kembalikanKeAtasan } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const daftarIsi = ref<any[]>([])
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] })

// Modal state
const showAjukanModal = ref(false)
const showKembalikanModal = ref(false)
const atasanTuInputs = ref<string[]>([])
const catatanAjuan = ref('')
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
  { label: 'Penerimaan Usulan', to: '/maintenance/penerimaan-usulan' },
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
    USUL_PINDAH_DIKIRIM: 'Menunggu Verifikasi',
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
    USUL_PINDAH_DIKIRIM: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
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

const formatBaDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const formatBaDay = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[d.getDay()]
}

const loadDaftarIsi = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true })
    daftarIsi.value = res?.data?.daftarIsi ?? []
  } catch {
    daftarIsi.value = []
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

const printDaftarIsi = () => {
  const el = document.getElementById('daftar-isi-print')
  if (!el) return
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>${item.value?.nomorUsulan ?? ''}</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111}
    .text-sm{font-size:13px}.text-xs{font-size:12px}.font-semibold{font-weight:600}
    .mb-3{margin-bottom:12px}.text-gray-500{color:#6b7280}.text-gray-600{color:#4b5563}
    .text-gray-700{color:#374151}.text-gray-400{color:#9ca3af}.text-center{text-align:center}
    .italic{font-style:italic}.w-full{width:100%}.w-10{width:40px}
    table{width:100%;border-collapse:collapse}
    th{border-bottom:2px solid #d1d5db;padding:8px;text-align:left;font-weight:600}
    td{border-bottom:1px solid #f3f4f6;padding:8px}
    .px-2{padding-left:8px;padding-right:8px}.py-2{padding-top:8px;padding-bottom:8px}
    .py-4{padding-top:16px;padding-bottom:16px}p{margin:0}
  </style></head><body>${el.innerHTML}</body></html>`)
  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250)
}

const printBeritaAcara = () => {
  const el = document.getElementById('berita-acara-print')
  if (!el) return
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Berita Acara Serah Terima</title><style>
    *{box-sizing:border-box}body{font-family:'Times New Roman',serif;padding:40px;max-width:800px;margin:0 auto;color:#111}
    .text-sm{font-size:13px}.text-xs{font-size:12px}.text-base{font-size:16px}
    .text-center{text-align:center}.text-right{text-align:right}
    .font-bold{font-weight:700}.font-semibold{font-weight:600}.italic{font-style:italic}
    .mb-1{margin-bottom:4px}.mb-3{margin-bottom:12px}.mb-4{margin-bottom:16px}
    .mb-6{margin-bottom:24px}.mb-16{margin-bottom:64px}.space-y-3>*+*{margin-top:12px}
    .space-y-1>*+*{margin-top:4px}.leading-relaxed{line-height:1.625}
    .text-gray-500{color:#6b7280}.ml-2{margin-left:8px}
    .grid{display:grid}.grid-cols-2{grid-template-columns:1fr 1fr}
    .gap-8{gap:32px}.border-t{border-top:1px solid #9ca3af}.pt-1{padding-top:4px}
    ol{padding-left:20px;margin:0}li{margin-bottom:4px}p{margin:0}
  </style></head><body>${el.innerHTML}</body></html>`)
  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250)
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
  catatanAjuan.value = ''
  showAjukanModal.value = true
  loadAtasanTuList()
}

const openKembalikanModal = () => {
  alasanKembalikan.value = ''
  showKembalikanModal.value = true
}

const onConfirmAjukan = async () => {
  if (!item.value || !atasanTuInputs.value[0]) return
  actionLoading.value = true
  try {
    // Kirim daftar atasan TU berjenjang
    const atasanList = atasanTuInputs.value
      .filter((p) => p)
      .map((p) => {
        const a = atasanTuList.value.find((x) => String(x.persnum) === String(p))
        return { persnum: p, name: a?.name ?? p, jabatan: a?.positionText ?? a?.jabatan ?? '' }
      })
    await ajukanAtasanTu(item.value.id, { atasanTuList: atasanList })
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
