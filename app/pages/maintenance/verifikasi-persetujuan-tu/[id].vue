<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Verifikasi Persetujuan — ${item?.nomorUsulan ?? ''}`"
        :items="breadcrumbs"
      />
      <NuxtLink
        to="/maintenance/verifikasi-persetujuan-tu"
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
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
                <p class="text-gray-900 dark:text-white font-bold">{{ item.atasanName || '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">TU Pengirim</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item.tuName || '-' }}</p>
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

            <!-- Total Arsip -->
            <div class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Total Arsip</h4>
                <button @click="showTotalArsip = !showTotalArsip" class="text-xs text-primary hover:underline">
                  {{ showTotalArsip ? 'Sembunyikan' : 'Tampilkan' }}
                </button>
              </div>
              <div v-if="showTotalArsip" class="text-sm text-gray-600 dark:text-gray-300">
                <p>Total: <span class="font-semibold text-gray-900 dark:text-white">{{ daftarBerkas.length }} berkas</span></p>
              </div>
            </div>
          </div>

          <!-- Card 2: Daftar Arsip yang Akan Dipindahkan -->
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

          <!-- Status: Ditolak -->
          <div
            v-if="item.status === 'DITOLAK_PERSETUJUAN_TU'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Penerimaan Ditolak</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ item.rejectedNote || 'Penerimaan usulan ditolak oleh Atasan TU.' }}</p>
              </div>
            </div>
          </div>

          <!-- Status: Diterima (final) -->
          <div
            v-if="item.status === 'ARSIP_INAKTIF_DITERIMA' || item.status === 'SELESAI'"
            class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Arsip Diterima</h3>
                <p class="text-sm text-emerald-600 dark:text-emerald-400">Usulan telah diterima dan disetujui secara final. TU dapat melanjutkan ke penataan arsip inaktif.</p>
              </div>
            </div>
          </div>

          <!-- Tombol Aksi (di bawah card detail) -->
          <div v-if="canAct" class="flex flex-wrap gap-2">
            <button
              @click="openTolakModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
            </button>
            <button
              v-if="item.status === 'DIKIRIM' || item.status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU'"
              @click="openSetujuiModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui
            </button>
            <button
              v-if="item.status === 'DISETUJUI_PERSETUJUAN_TU' || item.status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU'"
              @click="openSetujuiTerakhirModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-check-check" class="w-4 h-4 mr-1 inline" /> Setujui Persetujuan Terakhir
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

    <!-- Modal Setujui Penerimaan -->
    <Teleport to="body">
      <div v-if="showSetujuiModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showSetujuiModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[520px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Persetujuan</h3>
            <button @click="showSetujuiModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin menyetujui penerimaan usulan ini?
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
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">TU Pengirim</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.tuName ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Jumlah Arsip</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ daftarBerkas.length }} berkas</p>
              </div>
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi (opsional)</label>
            <textarea
              v-model="catatanVerifikasi"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showSetujuiModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmSetujui"
              :disabled="actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Setujui
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Tolak Penerimaan -->
    <Teleport to="body">
      <div v-if="showTolakModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showTolakModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tolak Persetujuan</h3>
            <button @click="showTolakModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Berikan alasan penolakan penerimaan.
            </p>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Alasan Penolakan *</label>
            <textarea
              v-model="alasanPenolakan"
              rows="4"
              placeholder="Isi alasan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showTolakModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmTolak"
              :disabled="!alasanPenolakan.trim() || actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Tolak
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Setujui Persetujuan Terakhir -->
    <Teleport to="body">
      <div v-if="showSetujuiTerakhirModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" @click="showSetujuiTerakhirModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[560px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Persetujuan Terakhir</h3>
            <button @click="showSetujuiTerakhirModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin menyetujui penerimaan usulan ini secara final?
              Berita Acara Serah Terima akan digenerate dan usulan akan diterima.
            </p>
            <div class="space-y-2 mb-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ item?.nomorUsulan ?? '-' }}</p>
              </div>
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan Verifikasi Terakhir (opsional)</label>
            <textarea
              v-model="catatanVerifikasi"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            ></textarea>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showSetujuiTerakhirModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button
              @click="onConfirmSetujuiTerakhir"
              :disabled="actionLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Setujui Persetujuan Terakhir
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
import { useAuth } from '~/composables/useAuth'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { user } = useAuth()
const { fetchAtasanTuDetail, setujuiPenerimaan, tolakPenerimaan, setujuiTerakhir } = useTuVerifikasi()

const item = ref<TuUsulanItem | null>(null)
const loading = ref(true)
const actionLoading = ref(false)
const showTotalArsip = ref(true)
const daftarIsi = ref<any[]>([])
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] })

const showSetujuiModal = ref(false)
const showTolakModal = ref(false)
const showSetujuiTerakhirModal = ref(false)

const catatanVerifikasi = ref('')
const alasanPenolakan = ref('')

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Persetujuan', to: '/maintenance/verifikasi-persetujuan-tu' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/verifikasi-persetujuan-tu/${route.params.id}` },
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

/** True jika user login adalah atasan TU level saat ini (giliran verifikasi). */
const isCurrentTuTurn = computed(() => {
  if (!item.value || !user.value) return false
  const levels = item.value.tuApprovalLevels
  if (!levels || levels.length === 0) return true // Legacy: single atasan
  const currentLevel = item.value.currentTuApprovalLevel ?? 1
  const level = levels.find((l) => l.urutan === currentLevel)
  return level ? level.persnum === Number(user.value.persnum) : false
})

/** True jika user login adalah atasan TU level 1 (untuk persetujuan terakhir). */
const isTuLevel1 = computed(() => {
  if (!item.value || !user.value) return false
  const levels = item.value.tuApprovalLevels
  if (!levels || levels.length === 0) return true // Legacy
  const firstLevel = levels.find((l) => l.urutan === 1)
  return firstLevel ? firstLevel.persnum === Number(user.value.persnum) : false
})

const canAct = computed(() => {
  if (!item.value) return false
  const s = item.value.status
  if (s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') {
    return isCurrentTuTurn.value
  }
  if (s === 'DISETUJUI_PERSETUJUAN_TU' || s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') {
    return isTuLevel1.value
  }
  return false
})

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    DIKIRIM: 'Menunggu Verifikasi',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Persetujuan TU',
    DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Persetujuan Terakhir',
    DITOLAK_PERSETUJUAN_TU: 'Ditolak TU',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak TU',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final',
    ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima',
    SELESAI: 'Selesai',
  }
  return m[s] || s
}

const statusBadgeClass = (s: string) => {
  const m: Record<string, string> = {
    DIKIRIM: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_PERSETUJUAN_TU: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
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
    const { apiGet } = useApi()
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true })
    daftarIsi.value = res?.data?.daftarIsi ?? []
  } catch {
    daftarIsi.value = []
  }
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
    const res = await fetchAtasanTuDetail(route.params.id as string)
    item.value = res?.data ?? res
    catatanVerifikasi.value = item.value?.physicalVerificationNote ?? ''
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

const openSetujuiModal = () => {
  showSetujuiModal.value = true
}
const openTolakModal = () => {
  alasanPenolakan.value = ''
  showTolakModal.value = true
}
const openSetujuiTerakhirModal = () => {
  showSetujuiTerakhirModal.value = true
}

const onConfirmSetujui = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await setujuiPenerimaan(item.value.id, {
      catatanVerifikasi: catatanVerifikasi.value.trim() || undefined,
    })
    showSetujuiModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Penerimaan usulan disetujui.', color: 'success' })
    await navigateTo(`/maintenance/transfer-active-to-inactive-file/${item.value.id}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menyetujui.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onConfirmTolak = async () => {
  if (!item.value || !alasanPenolakan.value.trim()) return
  actionLoading.value = true
  try {
    await tolakPenerimaan(item.value.id, { alasanPenolakan: alasanPenolakan.value.trim() })
    showTolakModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Penerimaan usulan ditolak.', color: 'success' })
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menolak.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

const onConfirmSetujuiTerakhir = async () => {
  if (!item.value) return
  actionLoading.value = true
  try {
    await setujuiTerakhir(item.value.id, {
      catatanVerifikasi: catatanVerifikasi.value.trim() || undefined,
    })
    showSetujuiTerakhirModal.value = false
    useToast().add({ title: 'Berhasil', description: 'Persetujuan terakhir diberikan. Arsip diterima.', color: 'success' })
    await navigateTo(`/maintenance/transfer-active-to-inactive-file/${item.value.id}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Gagal menyetujui terakhir.'
    useToast().add({ title: 'Gagal', description: msg, color: 'error' })
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => loadDetail())
</script>