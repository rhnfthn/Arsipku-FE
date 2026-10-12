<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="isPenandatangananRoute ? 'Detail Penandatanganan BAC' : isBacSignerView ? 'Preview Berita Acara' : `Detail Usulan ${item?.nomorUsulan ?? ''}`"
        :items="items"
      />
      <NuxtLink
        v-if="!isBacSignerView"
        to="/kelola/pemeliharaan/pemindahan-arsip"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
      <NuxtLink
        v-else
        to="/pemeliharaan/penandatanganan"
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
      <!-- Urutan baku lintas status: Informasi Usulan, Daftar Berkas, Daftar Isi,
           Atasan, Penandatangan BAC, Tembusan BAC, status/aksi, Berita Acara,
           Timeline Riwayat, lalu Persetujuan Terakhir sebagai card paling bawah. -->
      <div v-if="!isBacSignerView || isPenandatangananRoute" class="mx-auto w-full max-w-none space-y-5">
          <TransferDetailCard
            :transfer="item"
            :daftar-berkas="daftarBerkasRows"
            :daftar-isi="daftarIsiRows"
            :collapsible="true"
            :fit-berkas-table="isPenandatangananRoute"
            :show-header-status="false"
            :show-information-card="true"
            information-layout="usul"
            berkas-layout="usul"
            :description-next-to-number="isSekretarisPengusul || isPenandatangananRoute"
            :show-bac-status="!isSekretarisPengusul"
            :status-context="isPenandatangananRoute ? 'bac-signing' : 'secretary-division'"
            :signer-signed-at="isPenandatangananRoute ? bacSignerSignedAt : undefined"
            :information-date-label="isPenandatangananRoute ? 'Tanggal Diajukan ke TU' : undefined"
            :information-date-value="isPenandatangananRoute ? (item.tanggalDikirim || item.tanggalUsulan) : undefined"
            :hide-secretary-info="isPenandatangananRoute"
            :show-approval-levels="false"
            :show-bac-signer="true"
            :show-bac-tembusan="true"
            :show-tu-approval-levels="true"
            :show-classification-code="false"
            :unit-kerja-pihak-pertama="bacUnitKerjaPengusul"
          />

          <div
            v-if="isSekretarisPengusul && item.status === 'DRAFT'"
            class="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              @click="isAjukanModalOpen = true"
              class="inline-flex items-center gap-2 rounded-lg bg-[#457fb6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3a6d9c]"
            >
              <UIcon name="i-lucide-send" class="h-4 w-4" />
              Ajukan ke Atasan
            </button>
          </div>

          <!-- Catatan Penolakan (hanya jika DITOLAK_ATASAN) -->
          <div
            v-if="item.status === 'DITOLAK_ATASAN' && item.rejectedNote"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div class="flex-1">
                <h3 class="text-base font-semibold text-red-700 dark:text-red-300 mb-1">Usulan Ditolak</h3>
                <p class="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg mt-2">
                  {{ item.rejectedNote }}
                </p>
              </div>
            </div>
          </div>

          <!-- ─── Button Action (di bawah detail) ─── -->

          <!-- Sekretaris TU melanjutkan usulan yang sudah dikirim oleh atasan -->
          <div
            v-if="isSekretarisTu && !isSekretarisPengusul && tuIntakeStatus.includes(item.status)"
            class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-send" class="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Usulan Siap Diproses TU</h3>
                <p class="text-sm text-purple-600 dark:text-purple-400 mb-3">
                  Usulan sudah dikirim ke Unit Tata Naskah. Lanjutkan verifikasi berkas dan pengajuan ke Atasan Managerial TU.
                </p>
                <NuxtLink
                  :to="`/pemeliharaan/penerimaan-arsip/${item.id}?jenis=aktif_ke_inaktif`"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-800 text-white transition-colors"
                >
                  <UIcon name="i-lucide-file-check" class="w-4 h-4" /> Buka Penerimaan Arsip
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Aksi Sekretaris (DRAFT/DITOLAK) dihapus -->

            <!-- DISETUJUI_ATASAN / MENUNGGU_VERIFIKASI_TERAKHIR -->
            <div
              v-if="item.status === 'DISETUJUI_ATASAN' || item.status === 'MENUNGGU_VERIFIKASI_TERAKHIR'"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi Terakhir</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400">
                    Usulan disetujui atasan. Menunggu verifikasi terakhir.
                  </p>
                </div>
              </div>
            </div>

            <!-- DISETUJUI_VERIFIKASI_TERAKHIR: hanya verifikator terakhir yang kirim ke TU -->
            <div
              v-if="item.status === 'DISETUJUI_VERIFIKASI_TERAKHIR' && isFinalVerifier"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    Verifikasi terakhir selesai. Atasan Managerial akan mengirim usulan ke Unit Tata Naskah.
                  </p>
                  <button
                    @click="onDispatch"
                    :disabled="actionLoading"
                    class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
                  >
                    <UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim ke TU
                  </button>
                </div>
              </div>
            </div>

            <!-- Berita Acara (Generate) dihapus — BA format resmi ada di card bawah -->

            <!-- SELESAI -->
            <div
              v-if="item.status === 'SELESAI'"
              class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Usulan Selesai</h3>
                  <p class="text-sm text-green-600 dark:text-green-400">
                    Proses pemindahan arsip selesai.
                  </p>
                </div>
              </div>
            </div>

          <!-- Status verifikasi -->
          <div
            v-if="item.status === 'MENUNGGU_VERIFIKASI_ATASAN'"
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi Atasan</h3>
                <p class="text-sm text-blue-600 dark:text-blue-400">
                  Usulan dikirim ke {{ item.atasanName }}. Menunggu verifikasi.
                </p>
              </div>
            </div>
          </div>

      </div>

      <!-- Berita Acara Serah Terima (di bawah grid, lebar sama dengan kolom kiri) -->
      <div v-if="showBeritaAcara || isBacSignerView" class="mx-auto w-full max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 mt-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Berita Acara</h3>
            <span
              v-if="item.bacSignedAt"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              <UIcon name="i-lucide-badge-check" class="h-3.5 w-3.5" /> Ditandatangani
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="openBeritaAcaraPreview"
              title="Preview Berita Acara"
              aria-label="Preview Berita Acara"
              class="inline-flex h-9 w-9 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            >
              <UIcon name="i-lucide-printer" class="h-5 w-5" />
            </button>
          <button
            type="button"
            :aria-expanded="!isBeritaAcaraCollapsed"
            :title="isBeritaAcaraCollapsed ? 'Buka Berita Acara' : 'Lipat Berita Acara'"
            :aria-label="isBeritaAcaraCollapsed ? 'Buka Berita Acara' : 'Lipat Berita Acara'"
            class="inline-flex h-9 w-9 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            @click="isBeritaAcaraCollapsed = !isBeritaAcaraCollapsed"
          >
            <UIcon
              name="i-lucide-chevron-up"
              class="h-5 w-5 transition-transform"
              :class="isBeritaAcaraCollapsed ? 'rotate-180' : ''"
            />
          </button>
          </div>
        </div>

        <div v-show="!isBeritaAcaraCollapsed">
        <!-- BAC ditampilkan sebagai gambar dokumen A4, bukan PDF viewer. -->
        <div v-if="isBacSignerView && (bacImageUrl || bacImageLoading)" class="flex justify-center overflow-auto rounded-xl bg-transparent p-0">
          <div class="relative w-full max-w-[794px] overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <div v-if="bacImageLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-gray-800/90">
              <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary" />
            </div>
            <img
              v-if="bacImageUrl"
              :key="bacImageUrl"
              :src="bacImageUrl"
              alt="Berita Acara Serah Terima"
              class="block h-auto w-full"
            />
          </div>
        </div>

        <!-- Jika rasterisasi gambar gagal, template BAC tetap ditampilkan langsung sebagai dokumen A4. -->
        <div
          id="berita-acara-print"
          ref="bacImageSourceRef"
          v-show="!isBacSignerView || !bacImageUrl"
          class="text-sm"
          :style="isBacSignerView && (bacImageUrl || bacImageLoading)
            ? { position: 'absolute', left: '-10000px', top: '0', width: '794px', minHeight: '1123px', padding: '48px 56px', backgroundColor: '#ffffff', color: '#111111', fontFamily: '\'Times New Roman\', serif', fontSize: '16px', lineHeight: '1.55' }
            : { width: '100%', maxWidth: '794px', minHeight: '1123px', margin: '0 auto', padding: '48px 56px', backgroundColor: '#ffffff', color: '#111111', fontFamily: '\'Times New Roman\', serif', fontSize: '16px', lineHeight: '1.55', boxShadow: '0 1px 3px rgba(0,0,0,.12)', border: '1px solid #e5e7eb' }"
        >
          <div style="text-align:center;margin:0 0 24px;">
            <p style="margin:0;">BERITA ACARA</p>
            <p style="margin:0;">TENTANG</p>
            <p style="margin:0;text-transform:uppercase;">PEMINDAHAN ARSIP INAKTIF TAHUN {{ item.tanggalUsulan ? new Date(item.tanggalUsulan).getFullYear() : new Date().getFullYear() }} - UNIT KERJA {{ bacUnitKerjaPengusul }}</p>
            <p style="margin:8px 0 0;">Nomor : {{ item.beritaAcaraNomor ?? `BA/${item.nomorUsulan}` }}</p>
          </div>

          <p style="margin:0 0 22px;text-align:justify;">
            Pada hari ini {{ formatBaDay(item.tanggalUsulan) }} tanggal {{ formatBaDate(item.tanggalUsulan) }}, dilaksanakan pemindahan arsip inaktif dari Unit Kerja {{ bacUnitKerjaPengusul }} ke Unit Kerja {{ bacUnitKerjaTu }} yang melibatkan:
          </p>

          <table style="width:calc(100% - 42px);margin:0 0 12px 42px;border:0;border-collapse:collapse;table-layout:fixed;">
            <tbody>
              <tr>
                <td style="width:42px;padding:0;vertical-align:top;">1.</td>
                <td style="width:92px;padding:0;vertical-align:top;">Nama</td>
                <td style="width:22px;padding:0;vertical-align:top;">:</td>
                <td style="padding:0;vertical-align:top;">{{ item.bacPihakPertamaName ?? '-' }}</td>
              </tr>
              <tr>
                <td style="padding:0;"></td>
                <td style="padding:0;vertical-align:top;">e-NIK</td>
                <td style="padding:0;vertical-align:top;">:</td>
                <td style="padding:0;vertical-align:top;">{{ item.bacPihakPertamaPersnum ?? '-' }}</td>
              </tr>
              <tr>
                <td style="padding:0;"></td>
                <td style="padding:0;vertical-align:top;">Jabatan</td>
                <td style="padding:0;vertical-align:top;">:</td>
                <td style="padding:0;vertical-align:top;">{{ item.bacPihakPertamaJabatan ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin:18px 0 22px;padding-left:84px;text-align:justify;">Dalam hal ini bertindak atas nama pimpinan Unit Kerja {{ bacUnitKerjaPihakPertama }} yang selanjutnya disebut PIHAK PERTAMA.</p>

          <table style="width:calc(100% - 42px);margin:0 0 12px 42px;border:0;border-collapse:collapse;table-layout:fixed;">
            <tbody>
              <tr>
                <td style="width:42px;padding:0;vertical-align:top;">2.</td>
                <td style="width:92px;padding:0;vertical-align:top;">Nama</td>
                <td style="width:22px;padding:0;vertical-align:top;">:</td>
                <td style="padding:0;vertical-align:top;">{{ beritaAcaraData?.pihakKedua?.nama || item.bacPihakKeduaName || '-' }}</td>
              </tr>
              <tr>
                <td style="padding:0;"></td>
                <td style="padding:0;vertical-align:top;">e-NIK</td>
                <td style="padding:0;vertical-align:top;">:</td>
                <td style="padding:0;vertical-align:top;">{{ beritaAcaraData?.pihakKedua?.enik || item.bacPihakKeduaPersnum || '-' }}</td>
              </tr>
              <tr>
                <td style="padding:0;"></td>
                <td style="padding:0;vertical-align:top;">Jabatan</td>
                <td style="padding:0;vertical-align:top;">:</td>
                <td style="padding:0;vertical-align:top;">{{ beritaAcaraData?.pihakKedua?.jabatan || item.bacPihakKeduaJabatan || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin:18px 0 26px;padding-left:84px;text-align:justify;">Dalam hal ini bertindak atas nama pimpinan Unit Kerja {{ bacUnitKerjaPihakKedua }} yang selanjutnya disebut PIHAK KEDUA.</p>

          <p style="margin:0 0 22px 84px;text-align:justify;">Menyatakan telah melaksanakan serah terima pemindahan arsip inaktif seperti tercantum pada daftar arsip terlampir.</p>
          <p style="margin:0 0 4px 84px;">Daftar arsip:</p>
          <p v-if="bacArsip.length === 1" style="margin:0 0 22px 84px;">{{ bacArsip[0].kode ?? '-' }} — {{ bacArsip[0].perihal ?? '-' }}</p>
          <ol v-else style="margin:0 0 22px 84px;padding-left:0;list-style:none;">
            <li v-for="(arsip, idx) in bacArsip" :key="idx">{{ arsip.kode ?? '-' }} — {{ arsip.perihal ?? '-' }}</li>
          </ol>

          <p style="margin:0 0 58px 84px;text-align:justify;">Demikian Berita Acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
          <table style="width:100%;border:0;margin:0;">
            <tbody>
              <tr>
                <td style="width:50%;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 20px;">Pihak Pertama</p>
                  <div v-if="item.bacSignedAt && item.bacSignatureQr" style="height:92px;margin:0 0 10px;display:flex;justify-content:center;">
                    <img :src="item.bacSignatureQr" alt="QR tanda tangan Pihak Pertama" style="display:block;width:82px;height:82px;object-fit:contain;">
                  </div>
                  <p v-else style="margin:0 0 78px;">Ttd</p>
                  <p style="margin:0;">({{ item.bacPihakPertamaJabatan ?? 'Jabatan' }})</p>
                </td>
                <td style="width:50%;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 20px;">Pihak Kedua</p>
                  <div v-if="item.bacPihakKeduaSignedAt && item.bacPihakKeduaSignatureQr" style="height:92px;margin:0 0 10px;display:flex;justify-content:center;">
                    <img :src="item.bacPihakKeduaSignatureQr" alt="QR tanda tangan Pihak Kedua" style="display:block;width:82px;height:82px;object-fit:contain;">
                  </div>
                  <p v-else style="margin:0 0 78px;">Ttd</p>
                  <p style="margin:0;">({{ item.bacPihakKeduaJabatan ?? 'Jabatan' }})</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        </div>
      </div>

      <!-- Menunggu Penerimaan (di bawah Pengingat) -->
      <div
        v-if="!isBacSignerView && !isSekretarisPengusul && item && item.status === 'DIKIRIM'"
        class="mx-auto w-full max-w-none bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm p-5 mt-5"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-clock" class="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
          <div>
            <h3 class="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Menunggu Penerimaan</h3>
            <p class="text-sm text-purple-600 dark:text-purple-400">
              Usulan dikirim ke Unit Tata Naskah. Menunggu penerimaan dari Atasan Managerial TU.
            </p>
          </div>
        </div>
      </div>

      <!-- Tombol Lanjutkan Penataan (untuk ARSIP_INAKTIF_DITERIMA — kirim ke TU untuk penataan) -->
      <div
        v-if="!isBacSignerView && item && item.status === 'ARSIP_INAKTIF_DITERIMA' && !isAtasanTu"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5 mt-5"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-archive" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Lanjutkan Penataan</h3>
            <p class="text-sm text-blue-600 dark:text-blue-400 mb-3">
              Arsip telah diterima oleh Atasan TU. Silakan lanjutkan ke penataan arsip inaktif.
            </p>
            <button
              @click="onLanjutkanPenataan"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-arrow-right" class="w-4 h-4 mr-1 inline" /> Lanjutkan Penataan
            </button>
          </div>
        </div>
      </div>

      <TimelineRiwayat v-if="item" :item="item" class="mt-5" />

      <!-- Aksi penandatanganan berada paling bawah setelah Timeline Riwayat. -->
      <div
        v-if="isBacSignerView && !bacSignerSignedAt"
        class="mt-5 flex flex-wrap justify-start gap-2"
      >
        <button
          type="button"
          @click="cancelBacSigning"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Batal
        </button>
        <button
          type="button"
          @click="openBacSign"
          :disabled="bacSigning"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#457fb6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3a6d9c] disabled:cursor-wait disabled:opacity-50"
        >
          <UIcon :name="bacSigning ? 'i-lucide-loader-2' : 'i-lucide-pen-tool'" class="h-4 w-4" :class="bacSigning ? 'animate-spin' : ''" />
          Tanda Tangan
        </button>
      </div>

      <!-- Persetujuan terakhir selalu menjadi card paling bawah setelah Timeline Riwayat. -->
      <div
        v-if="!isBacSignerView && item && (item.status === 'DISETUJUI_PERSETUJUAN_TU' || item.status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') && isAtasanTuFinal"
        class="mx-auto mt-5 w-full max-w-none rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-check-check" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div class="flex-1">
            <h3 class="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Persetujuan Terakhir Diperlukan</h3>
            <p class="mb-3 text-sm text-emerald-600 dark:text-emerald-400">
              Penerimaan usulan telah disetujui. Berikan persetujuan terakhir agar pejabat pihak kedua dapat menandatangani Berita Acara.
            </p>
            <button
              @click="onSetujuiTerakhir"
              :disabled="actionLoading"
              class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="mr-1 inline h-4 w-4 animate-spin" />
              <UIcon v-else name="i-lucide-check-check" class="mr-1 inline h-4 w-4" /> Konfirmasi Persetujuan Terakhir
            </button>
          </div>
        </div>
      </div>
    </template>
    <div v-else-if="signingAccessError" class="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-gray-800 dark:text-red-300">
      <p>{{ signingAccessError }}</p>
      <NuxtLink to="/pemeliharaan/penandatanganan" class="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" /> Kembali ke Penandatanganan
      </NuxtLink>
    </div>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Edit Modal -->
    <CreateTransferModal
      v-model="isEditModalOpen"
      :edit-data="item"
      :prefill-atasan="prefillAtasan"
      @updated="onUpdated"
    />

    <AjukanAtasanModal
      v-model="isAjukanModalOpen"
      :usulan="item"
      :berkas="null"
      @submitted="onDraftSubmitted"
    />

    <!-- Resubmit Confirm Modal -->
    <Teleport to="body">
      <div v-if="isResubmitModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);" @click="isResubmitModalOpen = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan Kembali Usulan</h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Usulan akan diajukan ulang ke Atasan Managerial untuk verifikasi.
            </p>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="isResubmitModalOpen = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button @click="confirmResubmit" :disabled="actionLoading" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50">
              {{ actionLoading ? 'Mengirim...' : 'Ajukan Kembali' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Setujui Persetujuan Terakhir -->
    <Teleport to="body">
      <div v-if="isSetujuiTerakhirModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);" @click="isSetujuiTerakhirModalOpen = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Persetujuan Terakhir</h3>
          <button @click="isSetujuiTerakhirModalOpen = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>
        <!-- Body -->
        <div class="p-6">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-check-check" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Arsip akan diterima dan TU dapat melanjutkan ke penataan arsip inaktif. Apakah Anda yakin ingin menyetujui persetujuan terakhir?
              </p>
            </div>
          </div>
          <!-- Catatan (opsional) -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan (opsional)</label>
            <textarea
              v-model="catatanSetujuiTerakhir"
              rows="3"
              placeholder="Catatan..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            ></textarea>
          </div>
        </div>
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button @click="isSetujuiTerakhirModalOpen = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
          <button
            @click="onConfirmSetujuiTerakhir"
            :disabled="actionLoading"
            class="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
          >
            <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
            <UIcon v-else name="i-lucide-check-check" class="w-4 h-4 mr-1 inline" />
            Setujui
          </button>
        </div>
        </div>
      </div>
    </Teleport>

    <DigsigPassphraseModal
      :open="isBacSignModalOpen"
      :signer-info="bacSignerInfo"
      :is-loading="bacSigning"
      :bsre-disabled="bacSignConfig.bsreDisabled"
      :hide-qr="bacSignConfig.hideQr"
      :hide-basah="bacSignConfig.hideBasah"
      :allow-basah-upload="true"
      @update:open="(value: boolean) => (isBacSignModalOpen = value)"
      @submit="submitBacSign"
    />

    <SharedSharePdfViewer
      v-model="bacPreviewOpen"
      :url="bacPreviewUrl"
      :title="bacPreviewTitle"
      :loading="bacPreviewLoading"
      @close="closeBacPreview"
    />

  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #daftar-isi-print,
  #daftar-isi-print *,
  #berita-acara-print,
  #berita-acara-print * {
    visibility: visible;
  }
  #daftar-isi-print,
  #berita-acara-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
  }
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useTuVerifikasi } from '~/composables/useTuVerifikasi';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue';
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue';
import AjukanAtasanModal from '~/components/transfer-active-to-inactive/AjukanAtasanModal.vue';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import DigsigPassphraseModal from '~/components/Tulis/DigsigPassphraseModal.vue';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { useDigsig } from '~/composables/useDigsig';

definePageMeta({
  middleware: ['auth'],
  alias: [
    '/pemeliharaan/penandatanganan/:id',
    '/maintenance/penandatanganan/:id',
  ],
});

const route = useRoute();
const isPenandatangananRoute = computed(() =>
  route.path.startsWith('/pemeliharaan/penandatanganan/') ||
  route.path.startsWith('/maintenance/penandatanganan/'),
);
const { apiGet, apiPost } = useApi();
const { user, isAdmin, isSuperadmin } = useAuth();
const { getConfigDigsig } = useDigsig();
const { setujuiTerakhir: tuSetujuiTerakhir } = useTuVerifikasi();
const {
  fetchDetail,
  send,
  resubmit,
  dispatch,
  dispatchSignedBacToTu,
} = useTransferActiveToInactive();

// Atasan Managerial TU: cek berdasarkan posisi managerial (EVP/VP/AVP/bodTag),
// bukan hardcode persnum — konsisten dengan AtasanTuGuard di backend.
const isAtasanTu = computed(() => {
  const posText = (user.value?.positionText || '').toUpperCase();
  const hasBod = !!user.value?.bodTag?.trim();
  return posText.includes('EVP') || posText.includes('AVP') ||
    posText.includes(' VP ') || posText.startsWith('VP ') || posText.endsWith(' VP') || posText === 'VP' ||
    hasBod || isAdmin.value || isSuperadmin.value;
});

/** True jika user login adalah atasan TU level terakhir (untuk persetujuan terakhir). */
const isAtasanTuFinal = computed(() => {
  if (!item.value || !user.value) return false
  const levels = (item.value as any).tuApprovalLevels
  if (!levels || levels.length === 0) return isAtasanTu.value // Legacy: single atasan
  const finalLevel = levels.reduce((latest: any, level: any) =>
    level.urutan > latest.urutan ? level : latest,
  )
  return finalLevel ? Number(finalLevel.persnum) === Number(user.value.persnum) : false
});

/** True jika user login adalah sekretaris pengusul (pembuat usulan ini). */
const isSekretarisPengusul = computed(() => {
  if (!item.value || !user.value) return false;
  return Number(item.value.sekretarisPersnum) === Number(user.value.persnum);
});

/** True jika user login adalah verifikator terakhir pada alur berjenjang. */
const isFinalVerifier = computed(() => {
  if (!item.value || !user.value || isSekretarisPengusul.value) return false;
  const levels = item.value.approvalLevels ?? [];
  if (levels.length > 0) {
    const finalLevel = levels.reduce((latest, level) =>
      level.urutan > latest.urutan ? level : latest,
    );
    return Number(finalLevel.atasanPersnum) === Number(user.value.persnum);
  }
  // Fallback untuk usulan lama yang belum memiliki tabel level approval.
  return Number(item.value.atasanPersnum) === Number(user.value.persnum);
});

/** Sekretaris TU dapat meneruskan usulan pada tahap penerimaan TU. */
const isSekretarisTu = computed(() => user.value?.tuRoles?.includes('sekretaris') ?? false);
const tuIntakeStatus = ['DIKIRIM', 'MENUNGGU_VERIFIKASI_BERKAS_FISIK'];

const item = ref<TransferActiveToInactive | null>(null);
const loading = ref(true);
const signingAccessError = ref('');
const actionLoading = ref(false);
const isEditModalOpen = ref(false);
const isAjukanModalOpen = ref(false);
const isResubmitModalOpen = ref(false);
const isSetujuiTerakhirModalOpen = ref(false);
const catatanSetujuiTerakhir = ref('');
const isBacSignModalOpen = ref(false);
const bacSigning = ref(false);
const bacSignConfig = reactive({
  bsreDisabled: false,
  hideQr: true,
  hideBasah: true,
});
const bacImageSourceRef = ref<HTMLElement | null>(null);
const bacImageUrl = ref<string | null>(null);
const bacImageLoading = ref(false);
const isBeritaAcaraCollapsed = ref(false);
const {
  bacPreviewOpen,
  bacPreviewLoading,
  bacPreviewUrl,
  bacPreviewTitle,
  openBacPreview,
  closeBacPreview,
} = useBacPdfPreview();
/** Pre-fill atasan di CreateTransferModal? false saat buka dari tombol Kirim (Draft). */
const prefillAtasan = ref(true);
const daftarBerkasRows = ref<any[]>([]);
const daftarIsiRows = ref<any[]>([]);
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] });

const bacSignerType = computed<'pihak_pertama' | 'pihak_kedua'>(() =>
  route.query.signer === 'pihak_kedua' ? 'pihak_kedua' : 'pihak_pertama',
);
const bacSignerSignedAt = computed(() =>
  bacSignerType.value === 'pihak_kedua'
    ? item.value?.bacPihakKeduaSignedAt
    : item.value?.bacSignedAt,
);

const isBacSignerView = computed(() => {
  if (!item.value || !user.value) return false;
  if (isPenandatangananRoute.value || route.query.from === 'penandatanganan') {
    const assignedPersnum = bacSignerType.value === 'pihak_kedua'
      ? item.value.bacPihakKeduaPersnum
      : item.value.bacPihakPertamaPersnum;
    return Number(assignedPersnum) === Number(user.value.persnum);
  }
  if (bacSignerType.value === 'pihak_kedua') return false;
  return item.value.status === 'USUL_PINDAH_DIKIRIM'
    && Number(item.value.bacPihakPertamaPersnum) === Number(user.value.persnum);
});

const bacSignerInfo = computed(() => ({
  name: user.value?.nama ?? (bacSignerType.value === 'pihak_kedua' ? item.value?.bacPihakKeduaName : item.value?.bacPihakPertamaName) ?? '-',
  role: user.value?.positionText ?? (bacSignerType.value === 'pihak_kedua' ? item.value?.bacPihakKeduaJabatan : item.value?.bacPihakPertamaJabatan) ?? '-',
  label: 'Berita Acara Serah Terima',
}));

const items = computed(() => [
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: isPenandatangananRoute.value ? '/pemeliharaan/penandatanganan' : '/kelola/pemeliharaan/pemindahan-arsip' },
  { label: isPenandatangananRoute.value ? 'Penandatanganan' : 'Pemindahan Arsip', to: isPenandatangananRoute.value ? '/pemeliharaan/penandatanganan' : '/kelola/pemeliharaan/pemindahan-arsip' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: route.fullPath },
]);

const showBeritaAcara = computed(() => {
  if (!item.value || !isSekretarisPengusul.value) return false;
  return Boolean(item.value.bacSignedAt || item.value.bacPihakKeduaSignedAt);
});

const bacArsip = computed(() => beritaAcaraData.value?.daftarArsip ?? []);
const bacUnitKerjaPengusul = computed(
  () => beritaAcaraData.value?.unitKerjaPengusul || item.value?.divisiName || '.........',
);
const bacUnitKerjaTu = computed(
  () => beritaAcaraData.value?.unitKerjaTu || 'UC',
);
const bacUnitKerjaPihakPertama = computed(
  () => beritaAcaraData.value?.pihakPertama?.unitKerja || bacUnitKerjaPengusul.value,
);
// Pihak Kedua baru dipilih Unit Dokumen. Biarkan kosong sampai tahap tersebut.
const bacUnitKerjaPihakKedua = computed(
  () => beritaAcaraData.value?.pihakKedua?.unitKerja || '',
);

/** Format tanggal untuk Berita Acara: "31 Juli 2026" */
const formatBaDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/** Format hari untuk Berita Acara: "Jumat" */
const formatBaDay = (dateStr: string | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[d.getDay()];
};

const loadDetail = async () => {
  loading.value = true;
  try {
    item.value = await fetchDetail(route.params.id as string);
    // BAC lama yang sudah ditandatangani sebelum alur otomatis aktif harus
    // tetap diteruskan ke TU saat sekretaris membuka detail.
    if (
      ['USUL_PINDAH_DIKIRIM', 'SIAPKAN_BERKAS_FISIK'].includes(item.value?.status ?? '') &&
      item.value.bacSignedAt &&
      Number(item.value.sekretarisPersnum) === Number(user.value?.persnum)
    ) {
      try {
        await dispatchSignedBacToTu(item.value.id);
        item.value = await fetchDetail(route.params.id as string);
      } catch (dispatchError: any) {
        useToast().add({
          title: 'Usulan belum terkirim ke TU',
          description: dispatchError?.data?.message ?? 'Gagal meneruskan usulan setelah BAC ditandatangani.',
          color: 'error',
        });
      }
    }
    await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
    await renderBacImage();
  } catch (e) {
    console.error('Gagal memuat detail:', e);
  } finally {
    loading.value = false;
  }
};

const loadSigningDetail = async () => {
  loading.value = true;
  signingAccessError.value = '';
  try {
    const response: any = await apiGet(
      `/transfer-active-to-inactive/${route.params.id}/signing-detail?signer=${bacSignerType.value}`,
      {},
      { skipCache: true },
    );
    item.value = response?.data ?? null;
    if (!item.value) throw new Error('Detail penandatanganan tidak ditemukan.');
    if (!isBacSignerView.value) throw new Error('Anda bukan penandatangan BAC yang ditugaskan.');
    await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
    await renderBacImage();
  } catch (error: any) {
    item.value = null;
    signingAccessError.value =
      error?.data?.message || error?.response?.data?.message || error?.message ||
      'Anda tidak memiliki akses ke detail penandatanganan ini.';
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  item.value = await fetchDetail(route.params.id as string);
  await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
  await renderBacImage();
};

const loadDaftarIsi = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true });
    // Kedua status menggunakan sumber dan susunan kartu yang sama seperti
    // halaman draft; perubahan status hanya mengubah badge/timeline/aksi.
    daftarBerkasRows.value = res?.data?.daftarBerkas ?? [];
    daftarIsiRows.value = res?.data?.daftarIsi ?? [];
  } catch (e) {
    daftarBerkasRows.value = [];
    daftarIsiRows.value = [];
  }
};

const loadBeritaAcaraData = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true });
    beritaAcaraData.value = res?.data ?? { atasan: {}, pengirim: {}, daftarArsip: [] };
  } catch (e) {
    beritaAcaraData.value = { atasan: {}, pengirim: {}, daftarArsip: [] };
  }
};

const renderBacImage = async () => {
  if (!isBacSignerView.value || !item.value) {
    if (bacImageUrl.value) URL.revokeObjectURL(bacImageUrl.value);
    bacImageUrl.value = null;
    return;
  }

  bacImageLoading.value = true;
  try {
    bacImageUrl.value = null;
    await nextTick();
    if (!bacImageSourceRef.value) throw new Error('Sumber BAC belum tersedia');
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(bacImageSourceRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794,
    });
    if (bacImageUrl.value) URL.revokeObjectURL(bacImageUrl.value);
    bacImageUrl.value = canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Gagal merender gambar BAC:', e);
    bacImageUrl.value = null;
  } finally {
    bacImageLoading.value = false;
  }
};

const loadBacSignConfig = async () => {
  try {
    const response: any = await getConfigDigsig('BAC');
    const config = response?.data ?? response ?? {};
    bacSignConfig.bsreDisabled = !Boolean(config.digsig);
    bacSignConfig.hideQr = !Boolean(config.ttdQr);
    bacSignConfig.hideBasah = !Boolean(config.ttdBasah);
  } catch (e) {
    // Jika konfigurasi tidak dapat diambil, pertahankan jalur BSrE sebagai
    // fallback aman dan jangan membuka opsi yang statusnya tidak diketahui.
    bacSignConfig.bsreDisabled = false;
    bacSignConfig.hideQr = true;
    bacSignConfig.hideBasah = true;
    console.error('Gagal memuat konfigurasi tanda tangan BAC:', e);
  }
};

const cancelBacSigning = () => {
  navigateTo('/pemeliharaan/penandatanganan');
};

const openBacSign = async () => {
  if (!item.value) return;

  const needsBacPreparation =
    !item.value.beritaAcaraUrl || item.value.beritaAcaraUrl.endsWith('/berita-acara.pdf');

  if (needsBacPreparation) {
    bacSigning.value = true;
    try {
      await apiPost(`/transfer-active-to-inactive/${item.value.id}/berita-acara-pdf`, {});
      await loadDetail();
    } catch (e: any) {
      console.error('Gagal menyiapkan BAC untuk TTE:', e);
      useToast().add({
        title: 'BAC belum siap ditandatangani',
        description: e?.response?.data?.message || e?.message || 'PDF BAC tidak dapat dibuat.',
        color: 'error',
      });
      bacSigning.value = false;
      return;
    } finally {
      bacSigning.value = false;
    }
  }

  await loadBacSignConfig();
  isBacSignModalOpen.value = true;
};

const submitBacSign = async (payload: { method: string; passphrase?: string; file?: File }) => {
  if (!item.value) return;

  bacSigning.value = true;
  try {
    const signerQuery = bacSignerType.value === 'pihak_kedua' ? '?signer=pihak_kedua' : '';
    if (payload.method === 'digsig') {
      if (!payload.passphrase) return;
      await apiPost(`/digsig/bac/${item.value.id}/sign${signerQuery}`, {
        passphrase: payload.passphrase,
      });
    } else if (payload.method === 'qr_only') {
      await apiPost(`/digsig/bac/${item.value.id}/sign-qr${signerQuery}`, {});
    } else if (payload.method === 'ttd_basah') {
      if (!payload.file) {
        throw new Error('PDF hasil tanda tangan basah wajib diunggah.');
      }
      const formData = new FormData();
      formData.append('file', payload.file);
      await apiPost(`/digsig/bac/${item.value.id}/sign-physical${signerQuery}`, formData);
    } else {
      throw new Error('Metode tanda tangan BAC tidak dikenali.');
    }
    isBacSignModalOpen.value = false;
    useToast().add({
      title: 'BAC berhasil ditandatangani',
      description: 'Tanda tangan BAC berhasil diproses.',
      color: 'success',
    });
    await navigateTo('/pemeliharaan/penandatanganan');
  } catch (e: any) {
    console.error('Gagal menandatangani BAC:', e);
    useToast().add({
      title: 'Gagal menandatangani BAC',
      description: e?.response?.data?.message || e?.message || 'Periksa passphrase Anda.',
      color: 'error',
    });
  } finally {
    bacSigning.value = false;
  }
};

const printDaftarIsi = () => {
  const el = document.getElementById('daftar-isi-print');
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Daftar Isi</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 12px; }
    .font-semibold { font-weight: 600; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .text-gray-400 { color: #9ca3af; }
    .text-center { text-align: center; }
    .italic { font-style: italic; }
    .w-full { width: 100%; }
    .w-8 { width: 32px; }
    .w-10 { width: 40px; }
    .w-4 { width: 16px; }
    .h-4 { height: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { border-bottom: 2px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600; }
    td { border-bottom: 1px solid #f3f4f6; padding: 8px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-4 { padding-top: 16px; padding-bottom: 16px; }
    .pr-2 { padding-right: 8px; }
    input[type="checkbox"] { width: 16px; height: 16px; }
    p { margin: 0; }
  </style>
  </head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
};

const openBeritaAcaraPreview = async () => {
  if (!item.value) return;
  await openBacPreview(
    item.value.id,
    item.value.beritaAcaraNomor || item.value.nomorUsulan,
  );
};

const hariIni = computed(() => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[new Date().getDay()];
});

const kotaIni = 'Jakarta';

const formatTanggalLengkap = (d: string | Date | null): string => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

const act = async (fn: () => Promise<any>) => {
  actionLoading.value = true;
  try {
    await fn();
    await refresh();
  } catch (e) {
    console.error('Gagal:', e);
    alert('Gagal melakukan aksi.');
  } finally {
    actionLoading.value = false;
  }
};

const onEdit = () => {
  prefillAtasan.value = true;
  isEditModalOpen.value = true;
};

const onUpdated = async () => {
  isEditModalOpen.value = false;
  await refresh();
};

const onDraftSubmitted = () => {
  isAjukanModalOpen.value = false;
  navigateTo('/kelola/pemeliharaan/pemindahan-arsip');
};

const onSend = () => {
  // Buka CreateTransferModal (mode edit) — arsip terisi, atasan KOSONG
  prefillAtasan.value = false;
  isEditModalOpen.value = true;
};

const onResubmit = () => {
  isResubmitModalOpen.value = true;
};

const confirmResubmit = () => {
  act(async () => {
    await resubmit(item.value!.id);
    isResubmitModalOpen.value = false;
  });
};

const onDispatch = () => {
  if (!confirm('Kirim usulan ke Unit Tata Naskah?')) return;
  act(() => dispatch(item.value!.id));
};

/** Setujui Persetujuan Terakhir oleh Atasan TU → ARSIP_INAKTIF_DITERIMA. */
const onSetujuiTerakhir = () => {
  catatanSetujuiTerakhir.value = '';
  isSetujuiTerakhirModalOpen.value = true;
};

/** Lanjutkan Penataan — redirect ke halaman penataan arsip inaktif. */
const onLanjutkanPenataan = () => {
  if (!item.value) return;
  navigateTo(`/maintenance/penataan-arsip-inaktif/${item.value.id}`);
};

const onConfirmSetujuiTerakhir = async () => {
  if (!item.value) return;
  actionLoading.value = true;
  try {
    await tuSetujuiTerakhir(item.value.id, {
      catatanVerifikasi: catatanSetujuiTerakhir.value.trim() || undefined,
    });
    isSetujuiTerakhirModalOpen.value = false;
    await loadDetail();
  } catch (e: any) {
    console.error('Gagal menyetujui terakhir:', e);
    alert(e?.data?.message || 'Gagal menyetujui persetujuan terakhir.');
  } finally {
    actionLoading.value = false;
  }
};

// Body scroll lock saat modal terbuka
watch([isResubmitModalOpen, isSetujuiTerakhirModalOpen, isEditModalOpen], ([a, b, c]) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = a || b || c ? 'hidden' : '';
  }
});

onMounted(() => isPenandatangananRoute.value ? loadSigningDetail() : loadDetail());

onBeforeUnmount(() => {
  if (bacImageUrl.value?.startsWith('blob:')) URL.revokeObjectURL(bacImageUrl.value);
});
</script>
