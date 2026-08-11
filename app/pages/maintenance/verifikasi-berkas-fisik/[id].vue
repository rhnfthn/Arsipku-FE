<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Verifikasi Berkas Fisik — ${item?.nomorUsulan ?? ''}`"
        :items="breadcrumbs"
      />
      <NuxtLink
        to="/maintenance/verifikasi-berkas-fisik"
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
        <div class="lg:col-span-8 space-y-5">
          <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip -->
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
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Dikirim ke TU</span>
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
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
                <p class="text-gray-900 dark:text-white font-bold">{{ item.atasanName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalRetensiAktifHabis) }}</p>
              </div>
              <div class="md:col-span-2">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
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

          <!-- Card 2: Daftar Berkas Fisik -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Daftar Arsip yang Akan Dipindahkan ({{ daftarBerkas.length }})
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

          <!-- Card 3: Daftar Atasan Verifikasi (Berjenjang) -->
          <div
            v-if="item.approvalLevels && item.approvalLevels.length > 0"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Daftar Atasan Verifikasi (Berjenjang)</h3>
            <div class="space-y-2">
              <div
                v-for="level in item.approvalLevels"
                :key="level.id"
                class="flex items-center gap-3 p-3 rounded-lg border"
                :class="levelStatusClass(level.status)"
              >
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                  {{ level.urutan }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">{{ level.atasanName }}</p>
                  <p v-if="level.atasanPositionText" class="text-xs text-gray-500 dark:text-gray-400">{{ level.atasanPositionText }}</p>
                </div>
                <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {{ levelStatusLabel(level.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card 4: Daftar Atasan TU Verifikasi (Berjenjang) -->
          <div
            v-if="item.tuApprovalLevels && item.tuApprovalLevels.length > 0"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
          >
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Daftar Atasan TU Verifikasi (Berjenjang)</h3>
            <div class="space-y-2">
              <div
                v-for="level in item.tuApprovalLevels"
                :key="level.urutan"
                class="flex items-center gap-3 p-3 rounded-lg border"
                :class="levelStatusClass(level.status)"
              >
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                  {{ level.urutan }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">{{ level.name }}</p>
                  <p v-if="level.jabatan" class="text-xs text-gray-500 dark:text-gray-400">{{ level.jabatan }}</p>
                </div>
                <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                  {{ levelStatusLabel(level.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card: Daftar Isi -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Isi</h3>
              <button @click="printDaftarIsi" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <UIcon name="i-lucide-printer" class="w-3.5 h-3.5" /> Print Daftar Isi
              </button>
            </div>
            <div id="daftar-isi-print" class="text-sm">
              <p class="font-semibold text-gray-900 dark:text-white mb-3">Daftar Isi — {{ item.nomorUsulan }}</p>
              <table class="w-full border-collapse text-xs">
                <thead>
                  <tr class="border-b-2 border-gray-300 dark:border-gray-500">
                    <th class="text-center py-2 px-2 text-gray-500 w-8">✓</th>
                    <th class="text-left py-2 px-2 text-gray-500 w-10">No</th>
                    <th class="text-left py-2 px-2 text-gray-500">Nama Berkas / Perihal</th>
                    <th class="text-left py-2 px-2 text-gray-500">Keterangan</th>
                    <th class="text-center py-2 px-2 text-gray-500 w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, idx) in daftarIsi" :key="idx" class="border-b border-gray-100 dark:border-gray-700">
                    <td class="text-center py-2 px-2">
                      <input type="checkbox" class="w-4 h-4 text-primary border-gray-300 rounded" />
                    </td>
                    <td class="py-2 px-2 text-gray-600 dark:text-gray-300">{{ d.no }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">
                      <span v-if="d.kode" class="text-xs text-gray-400 block">{{ d.kode }}</span>
                      {{ d.namaBerkas }}
                    </td>
                    <td class="py-2 px-2 text-gray-500">{{ d.keterangan }}</td>
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
                    <td colspan="5" class="py-4 text-center text-gray-400 italic">Tidak ada arsip</td>
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
              <p class="text-xs leading-relaxed mb-3">
                Pihak pertama telah menyerahkan kepada pihak kedua berupa:
              </p>
              <ol class="list-decimal list-inside text-xs space-y-1 mb-4 ml-2">
                <li v-for="(arsip, idx) in (beritaAcaraData?.daftarArsip ?? [])" :key="idx">
                  {{ arsip.kode ?? '-' }} — {{ arsip.perihal }}
                </li>
                <li v-if="beritaAcaraData?.keterangan || item.keterangan">
                  {{ beritaAcaraData?.keterangan ?? item.keterangan }}
                </li>
              </ol>

              <p class="text-xs leading-relaxed mb-6">
                Demikian Berita Acara serah terima ini dibuat rangkap 2 untuk dapat digunakan sebagaimana mestinya.
              </p>

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

          <!-- Tombol Aksi langsung di bawah Daftar Berkas Fisik -->
          <div v-if="!isAlreadyVerified" class="flex gap-2">
            <button
              @click="openKembalikanModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon name="i-lucide-undo-2" class="w-4 h-4 mr-1 inline" /> Kembalikan ke Atasan
            </button>
            <button
              @click="openAjukanModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Ajukan ke Atasan TU
            </button>
          </div>

          <!-- Status info: Sudah diajukan ke Atasan TU -->
          <div
            v-if="item.tuApprovedAt"
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Sudah Diajukan ke Atasan TU</h3>
                <p class="text-sm text-blue-600 dark:text-blue-400">Berkas fisik dan berita acara serah terima telah dikonfirmasi cocok. Usulan telah diajukan ke Atasan Managerial TU.</p>
              </div>
            </div>
          </div>

          <!-- Status info: Berkas dikembalikan -->
          <div
            v-if="item.status === 'BERKAS_FISIK_TIDAK_SESUAI'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Berkas Tidak Sesuai</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ item.physicalVerificationNote || 'Berkas dikembalikan ke pengirim.' }}</p>
              </div>
            </div>
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
            <!-- Card: Atasan Managerial TU -->
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
                  @click="addAtasanTu"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
              <div class="px-5 py-5 space-y-3">
                <!-- Multi dropdown -->
                <div
                  v-for="(input, idx) in atasanTuInputs"
                  :key="idx"
                  class="relative"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Atasan Managerial TU{{ idx === 0 ? ' *' : ` ${idx + 1}` }}
                    </label>
                    <button
                      v-if="idx > 0"
                      type="button"
                      @click="removeAtasanTu(idx)"
                      class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Hapus atasan"
                    >
                      <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    @click="toggleAtasanDropdown(idx)"
                    class="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary flex items-center justify-between min-h-[48px]"
                    :class="{ 'ring-2 ring-primary border-primary': openDropdownIdx === idx }"
                  >
                    <span v-if="!input" class="text-gray-400">Pilih atasan TU...</span>
                    <span v-else class="font-medium">{{ getAtasanName(input) }}</span>
                    <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 shrink-0" :class="{ 'rotate-180': openDropdownIdx === idx }" />
                  </button>
                  <div v-if="openDropdownIdx === idx" class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-[10001] overflow-hidden">
                    <!-- Search input -->
                    <div class="p-2 border-b border-gray-100 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-700 z-10">
                      <div class="relative">
                        <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          v-model="atasanTuSearch"
                          type="text"
                          placeholder="Cari nama, jabatan, atau persnum..."
                          @input.stop
                          @click.stop
                          class="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <!-- Options list -->
                    <div class="max-h-[240px] overflow-y-auto">
                      <button
                        v-for="a in filteredAtasanTuList"
                        :key="a.persnum"
                        :disabled="isAtasanSelectedElsewhere(a.persnum, idx)"
                        @click="selectAtasanTu(idx, a)"
                        class="w-full text-left py-3 px-4 border-b border-gray-100 dark:border-gray-600 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        :class="{ 'bg-primary/10': input === a.persnum }"
                      >
                        <p class="text-base font-medium text-gray-900 dark:text-white">{{ a.name }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ a.persnum }} — {{ a.positionText || a.jabatan }}</p>
                      </button>
                      <div v-if="filteredAtasanTuList.length === 0" class="py-6 text-center text-sm text-gray-400">
                        Tidak ada atasan ditemukan
                      </div>
                    </div>
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
              v-model="catatanKembalikan"
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
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { fetchNotifikasiDetail, fetchAtasanTuOptions, ajukanAtasanTu, kembalikanKeAtasan } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)

const showAjukanModal = ref(false)
const showKembalikanModal = ref(false)
const atasanTuInputs = ref<string[]>([''])
const openDropdownIdx = ref<number | null>(null)
const catatanAjuan = ref('')
const catatanKembalikan = ref('')
const daftarIsi = ref<any[]>([])
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] })

// Daftar atasan managerial TU diambil dinamis dari backend (semua anggota
// Corporate Secretary Division dengan chief=1), bukan hardcode.
const atasanTuList = ref<any[]>([])
const atasanTuSearch = ref('')

const filteredAtasanTuList = computed(() => {
  const q = atasanTuSearch.value.trim().toLowerCase()
  if (!q) return atasanTuList.value
  return atasanTuList.value.filter((a) =>
    String(a.name ?? '').toLowerCase().includes(q) ||
    String(a.persnum ?? '').includes(q) ||
    String(a.positionText ?? a.jabatan ?? '').toLowerCase().includes(q),
  )
})

const getAtasanName = (persnum: string) => atasanTuList.value.find((a) => String(a.persnum) === String(persnum))?.name || persnum

const isAtasanSelectedElsewhere = (persnum: string, currentIdx: number) => {
  return atasanTuInputs.value.some((p, i) => i !== currentIdx && p === persnum)
}

const toggleAtasanDropdown = (idx: number) => {
  if (openDropdownIdx.value !== idx) {
    atasanTuSearch.value = ''
  }
  openDropdownIdx.value = openDropdownIdx.value === idx ? null : idx
}

const selectAtasanTu = (idx: number, a: any) => {
  atasanTuInputs.value[idx] = a.persnum
  openDropdownIdx.value = null
  atasanTuSearch.value = ''
}

const addAtasanTu = () => {
  if (atasanTuInputs.value.length < 3) {
    atasanTuInputs.value.push('')
  }
}

const removeAtasanTu = (idx: number) => {
  if (idx > 0) {
    atasanTuInputs.value.splice(idx, 1)
    if (openDropdownIdx.value === idx) openDropdownIdx.value = null
  }
}

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penerimaan Usulan', to: '/maintenance/notifikasi-usulan-pindah-arsip' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/verifikasi-berkas-fisik/${route.params.id}` },
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

const isAlreadyVerified = computed(() => {
  if (!item.value) return false
  return !!item.value.tuApprovedAt || item.value.status === 'BERKAS_FISIK_TIDAK_SESUAI'
})

/** Riwayat aktor yang terlibat dalam usulan. */
const riwayatList = computed(() => {
  if (!item.value) return []
  const u = item.value
  const items: { label: string; oleh: string; tanggal: string }[] = []

  // 1. Draft — Sekretaris
  items.push({
    label: 'Draft',
    oleh: u.sekretarisName ?? '-',
    tanggal: formatDate(u.tanggalUsulan ?? u.createdAt),
  })

  // 2. Menunggu Persetujuan — Atasan Managerial Sekretaris
  if (u.atasanName) {
    items.push({
      label: 'Menunggu Persetujuan',
      oleh: u.atasanName,
      tanggal: '-',
    })
  }

  // 3. Menunggu Verifikasi — Atasan Managerial Sekretaris
  items.push({
    label: 'Menunggu Verifikasi',
    oleh: u.atasanName ?? '-',
    tanggal: '-',
  })

  // 4. Menunggu Penerimaan — TU
  if (u.tuName) {
    items.push({
      label: 'Menunggu Penerimaan',
      oleh: u.tuName,
      tanggal: u.tanggalDikirim ? formatDate(u.tanggalDikirim) : '-',
    })
  }

  // 5. Verifikasi Atasan TU
  if (u.atasanTuName) {
    items.push({
      label: 'Verifikasi Atasan TU',
      oleh: u.atasanTuName,
      tanggal: '-',
    })
  }

  return items
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    DIKIRIM: 'Menunggu Verifikasi',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'Menunggu Verifikasi',
    BERKAS_FISIK_SESUAI: 'Berkas Sesuai',
    BERKAS_FISIK_TIDAK_SESUAI: 'Berkas Tidak Sesuai',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Persetujuan TU',
    DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU',
    ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima',
    SELESAI: 'Selesai',
  }
  return m[s] || s
}

const statusBadgeClass = (s: string) => {
  const m: Record<string, string> = {
    DIKIRIM: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    BERKAS_FISIK_SESUAI: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    BERKAS_FISIK_TIDAK_SESUAI: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    ARSIP_INAKTIF_DITERIMA: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    SELESAI: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  }
  return m[s] || 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const levelStatusClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  if (status === 'DITOLAK') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
}

const levelBadgeClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  if (status === 'DITOLAK') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
}

const levelStatusLabel = (status: string): string => {
  if (status === 'DISETUJUI') return 'Disetujui'
  if (status === 'DITOLAK') return 'Ditolak'
  return 'Menunggu'
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await fetchNotifikasiDetail(route.params.id as string)
    item.value = res?.data ?? res
    await loadDaftarIsi()
    await loadBeritaAcaraData()
  } catch (e: any) {
    console.error('Gagal memuat detail:', e)
    useToast().add({ title: 'Gagal', description: 'Gagal memuat detail usulan.', color: 'error' })
  } finally {
    loading.value = false
  }
}

const loadDaftarIsi = async () => {
  try {
    const { apiGet } = useApi()
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true })
    daftarIsi.value = res?.data?.daftarIsi ?? []
  } catch {
    daftarIsi.value = []
  }
}

const printDaftarIsi = () => {
  const el = document.getElementById('daftar-isi-print')
  if (!el) return
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Daftar Isi</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111}
    .text-sm{font-size:13px}.text-xs{font-size:12px}.font-semibold{font-weight:600}
    .mb-3{margin-bottom:12px}.text-gray-500{color:#6b7280}.text-gray-600{color:#4b5563}
    .text-gray-700{color:#374151}.text-gray-400{color:#9ca3af}.text-center{text-align:center}
    .italic{font-style:italic}.w-full{width:100%}.w-8{width:32px}.w-10{width:40px}
    table{width:100%;border-collapse:collapse}
    th{border-bottom:2px solid #d1d5db;padding:8px;text-align:left;font-weight:600}
    td{border-bottom:1px solid #f3f4f6;padding:8px}
    .px-2{padding-left:8px;padding-right:8px}.py-2{padding-top:8px;padding-bottom:8px}
    .py-4{padding-top:16px;padding-bottom:16px}input[type=checkbox]{width:16px;height:16px}p{margin:0}
  </style></head><body>${el.innerHTML}</body></html>`)
  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250)
}

const loadBeritaAcaraData = async () => {
  try {
    const { apiGet } = useApi()
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true })
    beritaAcaraData.value = res?.data ?? { atasan: {}, pengirim: {}, daftarArsip: [] }
  } catch {
    beritaAcaraData.value = { atasan: {}, pengirim: {}, daftarArsip: [] }
  }
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

const refresh = async () => {
  await loadDetail()
}

const loadAtasanTuList = async () => {
  try {
    const res: any = await fetchAtasanTuOptions()
    const data = res?.data ?? res ?? []
    atasanTuList.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Gagal memuat daftar atasan TU:', e)
    atasanTuList.value = []
  }
}

const openAjukanModal = () => {
  atasanTuInputs.value = ['']
  openDropdownIdx.value = null
  catatanAjuan.value = ''
  showAjukanModal.value = true
  loadAtasanTuList()
}

const openKembalikanModal = () => {
  catatanKembalikan.value = ''
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
    await kembalikanKeAtasan(item.value.id, { alasan: catatanKembalikan.value.trim() || 'Dikembalikan oleh TU' })
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