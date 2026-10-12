<template>
  <div class="space-y-5">
    <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip + File Rincian -->
    <div
      v-if="showInformationCard"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm"
      :class="informationLayout === 'usul' ? 'overflow-hidden' : 'p-5'"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left"
        :class="[
          collapsible ? 'cursor-pointer' : 'cursor-default',
          informationLayout === 'usul' ? 'min-h-16 px-5 py-4' : 'mb-4',
        ]"
        :aria-expanded="collapsible ? infoOpen : undefined"
        @click="collapsible && (infoOpen = !infoOpen)"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ informationTitle }}</h3>
        <div class="flex items-center gap-3">
          <span
            v-if="showHeaderStatus"
            :class="statusBadgeClass(transfer.status)"
          >{{ statusLabel(transfer.status) }}</span>
          <UIcon
            v-if="collapsible"
            :name="infoOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="h-4 w-4 text-gray-400"
          />
        </div>
      </button>
      <div
        v-show="!collapsible || infoOpen"
        :class="informationLayout === 'usul' ? 'px-5 pb-5' : ''"
      >
        <div v-if="informationLayout === 'usul'" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.nomorUsulan }}</p>
          </div>
          <div v-if="descriptionNextToNumber">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Uraian Informasi Berkas</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.arsipPerihal || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">{{ informationDateLabel }}</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ formatDate(informationDateValue) }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
            <div class="mt-1">
              <span :class="transferDisplayStatusClass">{{ transferDisplayStatusLabel }}</span>
            </div>
          </div>
          <div v-if="showBacStatus">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Status BAC</span>
            <p class="text-gray-900 dark:text-white font-normal">
              {{ bacSigningStatusLabel }}
            </p>
          </div>
          <div v-if="showSecretaryInfo">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.sekretarisName }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.arsipKode ?? '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
            <p class="text-gray-900 dark:text-white font-normal">
              {{ [transfer.arsipKlasifikasiKode, transfer.arsipKlasifikasi].filter(Boolean).join(' — ') || '-' }}
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nasib Akhir</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.arsipTindakanPenyusutan ?? '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ formatDate(transfer.tanggalRetensiAktifHabis) }}</p>
          </div>
          <div v-if="!descriptionNextToNumber" class="md:col-span-2">
            <span class="text-gray-500 dark:text-gray-400 text-xs">Uraian Informasi Berkas</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.arsipPerihal || '-' }}</p>
          </div>
        </div>
        <div v-else-if="informationLayout === 'penataan'" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.nomorUsulan }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Uraian Informasi Berkas</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ primaryBerkasRow?.uraianInformasi || primaryBerkasRow?.namaBerkas || primaryBerkasRow?.perihal || transfer.arsipPerihal || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
            <p class="text-gray-900 dark:text-white font-normal">
              {{ [transfer.arsipKlasifikasiKode, transfer.arsipKlasifikasi].filter(Boolean).join(' ') || '-' }}
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Kurun Waktu</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ primaryBerkasRow?.kurunWaktu || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi Keamanan</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ primaryBerkasRow?.klasifikasiKeamanan || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
            <p class="text-gray-900 dark:text-white font-normal">
              {{ transfer.atasanName || '-' }}<span v-if="atasanPositionText" class="font-normal text-gray-500 dark:text-gray-400"> — {{ atasanPositionText }}</span>
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Nasib Akhir</span>
            <p class="text-gray-900 dark:text-white font-normal">{{ transfer.arsipTindakanPenyusutan ?? '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
            <div class="mt-1">
              <span :class="penataanStatusClass(transfer.status)">{{ penataanStatusLabel(transfer.status) }}</span>
            </div>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Lokasi Simpan</span>
            <p class="text-gray-900 dark:text-white font-normal">
              {{ transfer.status === 'SELESAI' ? (transfer.lokasiPenataan || '-') : (transfer.lokasiAwal || '-') }}
            </p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
            <div v-if="berkasRows.length" class="mt-1 space-y-1">
              <p v-for="row in berkasRows" :key="`kode-${row.id}`" class="break-words text-gray-900 dark:text-white">
                {{ row.kodeBerkas || row.kode || '-' }}
              </p>
            </div>
            <p v-else class="text-gray-900 dark:text-white">{{ transfer.arsipKode || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Inaktif</span>
            <div v-if="retensiInaktifRows.length" class="mt-1 space-y-1">
              <p v-for="row in retensiInaktifRows" :key="row.id" class="break-words text-gray-900 dark:text-white">
                {{ retentionCountdownLabel(row.tanggalRetensiInaktifBerakhir) }}
                <span class="text-gray-500 dark:text-gray-400">(berakhir {{ formatDate(row.tanggalRetensiInaktifBerakhir) }})</span>
              </p>
            </div>
            <p v-else class="text-gray-900 dark:text-white">-</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.nomorUsulan }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">{{ informationDateLabel }}</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(informationDateValue) }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
          <div class="mt-1">
            <span :class="transferDisplayStatusClass">{{ transferDisplayStatusLabel }}</span>
          </div>
        </div>
        <div v-if="showBacStatus">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status BAC</span>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ bacSigningStatusLabel }}
          </p>
        </div>
        <div v-if="showSecretaryInfo">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.sekretarisName }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipKode ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipKlasifikasi ?? '-' }}</p>
          <p
            v-if="showClassificationCode && transfer.arsipKlasifikasiKode"
            class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ transfer.arsipKlasifikasiKode }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ transfer.atasanName }}<span v-if="transfer.atasanPositionText" class="font-normal text-gray-500 dark:text-gray-400"> - {{ transfer.atasanPositionText }}</span>
          </p>
          <p v-if="transfer.totalApprovalLevels && transfer.totalApprovalLevels > 1" class="text-xs text-gray-400 mt-0.5">
            Tahap {{ transfer.currentApprovalLevel }} dari {{ transfer.totalApprovalLevels }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipTindakanPenyusutan ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalRetensiAktifHabis) }}</p>
        </div>
        <div class="md:col-span-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipPerihal }}</p>
        </div>
        </div>
        <div v-if="transfer.rejectedNote" class="mt-4">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
          <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ transfer.rejectedNote }}</p>
        </div>
        <div v-if="transfer.verifyNote" class="mt-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
          <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ transfer.verifyNote }}</p>
        </div>

        <!-- Keterangan -->
        <div v-if="transfer.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
            {{ transfer.keterangan }}
          </p>
        </div>
      </div>
    </div>

    <!-- Card 2: Daftar Berkas (format item-level, seragam dengan halaman atasan managerial) -->
    <div
      v-if="berkasRows.length > 0"
      class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex flex-col gap-3 px-5 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Berkas ({{ berkasRows.length }})
        </h3>
        <div class="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            @click="printDaftarBerkas"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300 dark:hover:text-blue-300"
            title="Print Daftar Berkas"
            aria-label="Print Daftar Berkas"
          >
            <UIcon name="i-lucide-printer" class="h-4 w-4" />
          </button>
          <button
            type="button"
            @click="berkasOpen = !berkasOpen"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300 dark:hover:text-blue-300"
            :title="berkasOpen ? 'Lipat Daftar Berkas' : 'Buka Daftar Berkas'"
            :aria-expanded="berkasOpen"
          >
            <UIcon :name="berkasOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        v-show="!collapsible || berkasOpen"
        id="daftar-berkas-print"
        :class="berkasLayout === 'penataan' || fitBerkasTable ? 'w-full overflow-x-hidden' : 'overflow-x-auto'"
      >
        <table
          class="w-full border-collapse text-xs"
          :class="berkasLayout === 'penataan' || fitBerkasTable ? 'table-fixed' : berkasLayout === 'usul' ? 'min-w-[1240px]' : 'min-w-[1120px]'"
        >
          <thead>
            <tr class="bg-[#457fb6] text-white">
              <template v-if="berkasLayout === 'penataan'">
                <th class="w-[11%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">No Berkas</th>
                <th class="w-[12%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Kode Klasifikasi</th>
                <th class="w-[21%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Uraian Informasi Berkas</th>
                <th class="w-[8%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Kurun Waktu</th>
                <th class="w-[9%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Jumlah Berkas</th>
                <th class="w-[11%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Lokasi Simpan</th>
                <th class="w-[11%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Klasifikasi Keamanan</th>
                <th class="w-[10%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Retensi Arsip Inaktif</th>
              </template>
              <template v-else>
                <th :class="fitBerkasTable ? 'w-[12%] px-1.5 whitespace-normal break-words' : 'px-3 whitespace-nowrap'" class="border border-[#457fb6] py-3 text-center font-semibold">Nomor Berkas</th>
                <th :class="fitBerkasTable ? 'w-[14%] px-1.5 break-words' : 'px-3'" class="border border-[#457fb6] py-3 text-center font-semibold"><span class="block">Kode</span><span class="block">Klasifikasi</span></th>
                <th :class="fitBerkasTable ? 'w-[23%] px-1.5 break-words' : 'px-3 min-w-[280px]'" class="border border-[#457fb6] py-3 text-center font-semibold"><span class="block">Uraian Informasi</span><span class="block">Isi Berkas</span></th>
                <th :class="fitBerkasTable ? 'w-[10%] px-1.5 whitespace-normal break-words' : 'px-3 whitespace-nowrap'" class="border border-[#457fb6] py-3 text-center font-semibold">{{ berkasLayout === 'usul' ? 'Kurun Waktu' : 'Tanggal' }}</th>
                <th :class="fitBerkasTable ? 'w-[6%] px-1.5 whitespace-normal break-words' : 'px-3 whitespace-nowrap'" class="border border-[#457fb6] py-3 text-center font-semibold">Jumlah</th>
                <th :class="fitBerkasTable ? 'w-[9%] px-1.5 break-words' : 'px-3'" class="border border-[#457fb6] py-3 text-center font-semibold"><span class="block">Lokasi</span><span class="block">Simpan</span></th>
                <th :class="fitBerkasTable ? 'w-[10%] px-1.5 break-words' : 'px-3'" class="border border-[#457fb6] py-3 text-center font-semibold"><span class="block">Klasifikasi</span><span class="block">Keamanan</span></th>
                <th v-if="berkasLayout === 'usul'" :class="fitBerkasTable ? 'w-[10%] px-1.5 break-words' : 'px-3'" class="border border-[#457fb6] py-3 text-center font-semibold">Retensi Arsip Aktif</th>
              </template>
              <th :class="berkasLayout === 'penataan' ? 'w-[7%] px-1.5' : fitBerkasTable ? 'w-[6%] px-1.5' : 'px-3'" class="print-action border border-[#457fb6] py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in berkasRows" :key="row.id ?? idx" class="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-700/30">
              <template v-if="berkasLayout === 'penataan'">
                <td class="break-words border-b border-gray-200 px-1.5 py-3 font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kode ?? '-' }}</td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                  <div class="font-semibold">{{ row.klasifikasi ?? '-' }}</div>
                  <div class="mt-0.5 text-xs text-gray-400">{{ row.kodeKlasifikasi ?? '-' }}</div>
                </td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? row.namaBerkas ?? row.perihal ?? '-' }}</td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.kurunWaktu ?? '-' }}</td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.jumlahBerkas ?? row.jumlah ?? '-' }}</td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ berkasLocation(row) }}</td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.klasifikasiKeamanan ?? '-' }}</td>
                <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ formatDate(row.tanggalRetensiInaktifBerakhir) }}</td>
              </template>
              <template v-else>
                <td :class="fitBerkasTable ? 'px-1.5 break-words' : 'px-3'" class="border-b border-gray-200 py-3 font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kode ?? '-' }}</td>
                <td :class="[fitBerkasTable ? 'px-1.5 break-words' : 'px-3', berkasLayout === 'usul' ? 'text-center' : '']" class="border-b border-gray-200 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                  {{ berkasLayout === 'usul'
                    ? [row.kodeKlasifikasi, row.klasifikasi].filter(Boolean).join(' — ') || '-'
                    : row.kodeKlasifikasi ?? '-' }}
                </td>
                <td :class="fitBerkasTable ? 'px-1.5 break-words' : 'px-3'" class="border-b border-gray-200 py-3 text-gray-700 whitespace-normal dark:border-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? row.namaBerkas ?? row.perihal ?? '-' }}</td>
                <td :class="[fitBerkasTable ? 'px-1.5 whitespace-normal break-words' : 'px-3 whitespace-nowrap', berkasLayout === 'usul' ? 'text-center' : '']" class="border-b border-gray-200 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ berkasLayout === 'usul' ? (row.kurunWaktu ?? formatDate(row.tanggal)) : formatDate(row.tanggal) }}</td>
                <td :class="fitBerkasTable ? 'px-1.5 break-words' : 'px-3'" class="border-b border-gray-200 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.jumlah ?? row.jumlahBerkas ?? '-' }}</td>
                <td :class="[fitBerkasTable ? 'px-1.5 break-words' : 'px-3', berkasLayout === 'usul' ? 'text-center' : '']" class="border-b border-gray-200 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.lokasiSimpan ?? '-' }}</td>
                <td :class="[fitBerkasTable ? 'px-1.5 break-words' : 'px-3', berkasLayout === 'usul' ? 'text-center' : '']" class="border-b border-gray-200 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.klasifikasiKeamanan ?? '-' }}</td>
                <td v-if="berkasLayout === 'usul'" :class="fitBerkasTable ? 'px-1.5 whitespace-normal break-words' : 'px-3 whitespace-nowrap'" class="border-b border-gray-200 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ formatDate(row.tanggalRetensiAktifBerakhir) }}</td>
              </template>
              <td :class="fitBerkasTable ? 'px-1.5' : 'px-3'" class="print-action border-b border-gray-200 py-3 text-center dark:border-gray-700">
                <div class="flex items-center justify-center gap-1">
                  <NuxtLink
                    v-if="row.id"
                    :to="`/maintenance/preview-berkas/${row.id}?nomor_usulan=${transfer.nomorUsulan}&usulan_id=${transfer.id}&from=${previewFrom}`"
                    class="inline-flex p-2 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
                    title="Buka detail berkas"
                  >
                    <UIcon name="i-lucide-eye" class="w-4 h-4" />
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Daftar Isi Berkas -->
    <div
      v-if="showDaftarIsiCard"
      class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Isi Berkas ({{ daftarIsiRows.length }})
        </h3>
        <div class="flex items-center gap-1">
          <button
            type="button"
            @click="printDaftarIsi"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            title="Print Daftar Isi Berkas"
            aria-label="Print Daftar Isi Berkas"
          >
            <UIcon name="i-lucide-printer" class="h-4 w-4" />
          </button>
          <button
            type="button"
            @click="daftarIsiOpen = !daftarIsiOpen"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            :title="daftarIsiOpen ? 'Lipat Daftar Isi Berkas' : 'Buka Daftar Isi Berkas'"
            :aria-expanded="daftarIsiOpen"
          >
            <UIcon :name="daftarIsiOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div v-show="!collapsible || daftarIsiOpen" id="daftar-isi-print" class="w-full overflow-hidden">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-[#457fb6] text-white">
              <th v-if="informationLayout !== 'usul'" class="w-[2%] px-0.5 py-3 text-center font-semibold">No</th>
              <th class="px-1.5 py-3 text-center font-semibold" :class="informationLayout === 'usul' ? 'w-[16%]' : 'w-[14%]'">Nomor Naskah</th>
              <th v-if="informationLayout === 'usul'" class="w-[18%] px-1.5 py-3 text-center font-semibold">Kode Klasifikasi</th>
              <th class="w-[10%] px-1.5 py-3 text-center font-semibold">Kode Berkas</th>
              <th v-if="informationLayout !== 'usul'" class="w-[14%] px-1.5 py-3 text-center font-semibold">Kode Klasifikasi</th>
              <th class="px-1.5 py-3 text-center font-semibold" :class="informationLayout === 'usul' ? 'w-[21%]' : 'w-[20%]'">Uraian Informasi Isi Berkas</th>
              <th class="w-[9%] px-1.5 py-3 text-center font-semibold">Tanggal</th>
              <th class="w-[5%] px-1.5 py-3 text-center font-semibold">Jumlah</th>
              <th class="w-[9%] px-1.5 py-3 text-center font-semibold">Lokasi Simpan</th>
              <th class="px-1.5 py-3 text-center font-semibold" :class="informationLayout === 'usul' ? 'w-[8%]' : 'w-[11%]'">Klasifikasi Keamanan</th>
              <th v-if="informationLayout === 'usul'" class="print-action w-[4%] px-1.5 py-3 text-center font-semibold">Aksi</th>
              <th v-else class="print-action w-[6%] px-1.5 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in daftarIsiRows" :key="row.naskahId ?? `${row.id}-${idx}`" class="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-700/30">
              <td v-if="informationLayout !== 'usul'" class="break-words border-b border-gray-100 px-0.5 py-3 text-center text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.no ?? idx + 1 }}</td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.nomorSurat ?? row.nomor_surat ?? row.nomor ?? '-' }}</td>
              <td v-if="informationLayout === 'usul'" class="break-words border-b border-gray-100 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                {{ archiveClassificationLabel(row) }}
              </td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kode ?? row.kodeBerkas ?? '-' }}</td>
              <td v-if="informationLayout !== 'usul'" class="break-words border-b border-gray-100 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                <div class="font-semibold">{{ archiveClassification(row).name }}</div>
                <div class="mt-0.5 text-xs text-gray-400">{{ archiveClassification(row).code }}</div>
              </td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? row.perihal ?? '-' }}</td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ formatDate(row.tanggal) }}</td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.jumlah ?? row.jumlahBerkas ?? '-' }}</td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300" :class="informationLayout === 'usul' ? 'text-center' : ''">{{ berkasLocation(row) }}</td>
              <td class="break-words border-b border-gray-100 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.klasifikasiKeamanan ?? '-' }}</td>
              <td class="print-action border-b border-gray-100 px-1.5 py-3 text-center dark:border-gray-700">
                <button
                  v-if="row.id && row.naskahId"
                  type="button"
                  @click="openNaskahPreview(row)"
                  class="inline-flex p-2 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
                  title="Preview PDF naskah"
                >
                  <UIcon name="i-lucide-eye" class="h-4 w-4" />
                </button>
              </td>
            </tr>
            <tr v-if="daftarIsiRows.length === 0">
              <td :colspan="informationLayout === 'usul' ? 9 : 10" class="border-b border-gray-100 px-4 py-6 text-center text-gray-400 dark:border-gray-700">Belum ada isi berkas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Daftar atasan berada setelah daftar isi berkas. -->
    <div
      v-if="showApprovalLevels && transfer.approvalLevels && transfer.approvalLevels.length > 0"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        :class="collapsible ? 'cursor-pointer' : 'cursor-default'"
        :aria-expanded="collapsible ? approvalOpen : undefined"
        @click="collapsible && (approvalOpen = !approvalOpen)"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Atasan Verifikasi</h3>
        <UIcon
          v-if="collapsible"
          :name="approvalOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="!collapsible || approvalOpen" class="space-y-2">
        <div
          v-for="level in transfer.approvalLevels"
          :key="level.id"
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="levelStatusClass(level.status)"
        >
          <div
            v-if="(transfer.approvalLevels?.length ?? 0) > 1"
            class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0"
          >
            {{ level.urutan }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ level.atasanName }}<span v-if="level.atasanPositionText" class="font-normal text-gray-500 dark:text-gray-400"> - {{ level.atasanPositionText }}</span>
            </p>
          </div>
          <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            {{ levelStatusLabel(level.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Penandatangan BAC ditampilkan setelah daftar atasan. -->
    <div
      v-if="showBacSigner && hasBacSigner"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        aria-expanded="bacSignerOpen"
        @click="bacSignerOpen = !bacSignerOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Penandatangan BAC</h3>
        <UIcon
          :name="bacSignerOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="bacSignerOpen" class="space-y-3">
        <div
          v-if="transfer.bacPihakPertamaPersnum || transfer.bacPihakPertamaName"
          class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-200">
            1
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ transfer.bacPihakPertamaName || '-' }}<span v-if="transfer.bacPihakPertamaJabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ transfer.bacPihakPertamaJabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            Pihak Pertama
          </span>
        </div>
        <div
          v-if="transfer.bacPihakKeduaPersnum || transfer.bacPihakKeduaName"
          class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-200">
            2
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ transfer.bacPihakKeduaName || '-' }}<span v-if="transfer.bacPihakKeduaJabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ transfer.bacPihakKeduaJabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Pihak Kedua
          </span>
        </div>
      </div>
    </div>

    <!-- Card 5: Tembusan BAC -->
    <div
      v-if="showBacTembusan && hasBacTembusan"
      class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        aria-expanded="bacTembusanOpen"
        @click="bacTembusanOpen = !bacTembusanOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tembusan BAC</h3>
        <UIcon
          :name="bacTembusanOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="bacTembusanOpen" class="space-y-2">
        <div
          v-for="(copy, index) in bacTembusan"
          :key="`bac-copy-${copy.persnum}-${index}`"
          class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ copy.name || '-' }}<span v-if="copy.jabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ copy.jabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Tembusan
          </span>
        </div>
      </div>
    </div>

    <!-- Daftar Atasan Verifikasi, ditampilkan pada proses verifikasi TU. -->
    <div
      v-if="showTuApprovalLevels && transfer.tuApprovalLevels && transfer.tuApprovalLevels.length > 0"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        :class="collapsible ? 'cursor-pointer' : 'cursor-default'"
        :aria-expanded="collapsible ? tuApprovalOpen : undefined"
        @click="collapsible && (tuApprovalOpen = !tuApprovalOpen)"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Atasan Verifikasi</h3>
        <UIcon
          v-if="collapsible"
          :name="tuApprovalOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="!collapsible || tuApprovalOpen" class="space-y-2">
        <div
          v-for="level in transfer.tuApprovalLevels"
          :key="level.urutan"
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="levelStatusClass(level.status)"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
            {{ level.urutan }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ level.name }}<span v-if="level.jabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ level.jabatan }}</span>
            </p>
          </div>
          <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            {{ levelStatusLabel(level.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <SharedSharePdfViewer
    v-model="tablePdfPreviewOpen"
    :url="tablePdfPreviewUrl"
    :title="tablePdfPreviewTitle"
    :loading="tablePdfPreviewLoading"
    @close="closeTablePdfPreview"
  />
  <SharedSharePdfViewer
    v-model="naskahPreviewOpen"
    :url="naskahPreviewUrl"
    :title="naskahPreviewTitle"
    :loading="naskahPreviewLoading"
    @close="closeNaskahPreview"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { TransferActiveToInactive, ApprovalLevel } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';
import { useArsipDinamis } from '~/composables/useArsipDinamis';

const props = defineProps<{
  transfer: TransferActiveToInactive;
  daftarBerkas?: any[];
  daftarIsi?: any[];
  unitKerjaPihakPertama?: string;
  collapsible?: boolean;
  showHeaderStatus?: boolean;
  showInformationCard?: boolean;
  previewFrom?: string;
  showApprovalLevels?: boolean;
  showBacSigner?: boolean;
  showBacTembusan?: boolean;
  showTuApprovalLevels?: boolean;
  informationTitle?: string;
  informationLayout?: 'default' | 'penataan' | 'usul';
  berkasLayout?: 'default' | 'penataan' | 'usul';
  hideSecretaryInfo?: boolean;
  fitBerkasTable?: boolean;
  showBacStatus?: boolean;
  showClassificationCode?: boolean;
  statusContext?: 'default' | 'secretary-division' | 'bac-signing';
  signerSignedAt?: string | null;
  informationDateLabel?: string;
  informationDateValue?: string | Date | null;
  descriptionNextToNumber?: boolean;
}>();

const { getNaskahDetailInBerkas, getNaskahPdfUrl } = useArsipDinamis();

const collapsible = computed(() => props.collapsible === true);
const showHeaderStatus = computed(() => props.showHeaderStatus !== false);
const showInformationCard = computed(() => props.showInformationCard !== false);
const showApprovalLevels = computed(() => props.showApprovalLevels !== false);
const showBacSigner = computed(() => props.showBacSigner !== false);
const showBacTembusan = computed(() => props.showBacTembusan !== false);
const showTuApprovalLevels = computed(() => props.showTuApprovalLevels !== false);
const informationTitle = computed(() => props.informationTitle ?? 'Informasi Usulan');
const informationLayout = computed(() => props.informationLayout ?? 'default');
const berkasLayout = computed(() => props.berkasLayout ?? 'default');
const showSecretaryInfo = computed(() => props.hideSecretaryInfo !== true);
const fitBerkasTable = computed(() => props.fitBerkasTable === true);
const showBacStatus = computed(() => props.showBacStatus !== false);
const showClassificationCode = computed(() => props.showClassificationCode !== false);
const informationDateLabel = computed(() => props.informationDateLabel ?? 'Tanggal Usulan');
const informationDateValue = computed(() => props.informationDateValue ?? props.transfer.tanggalUsulan);
const descriptionNextToNumber = computed(() => props.descriptionNextToNumber === true);
const bacSigningStatusLabel = computed(() => {
  if (props.statusContext === 'bac-signing') {
    return props.signerSignedAt ? 'Ditandatangani' : 'Menunggu Tanda Tangan';
  }
  return props.transfer.bacSignedAt
    ? 'Ditandatangani'
    : props.transfer.bacPihakPertamaPersnum
      ? 'Menunggu Tanda Tangan'
      : 'Belum Ditandatangani';
});
const transferDisplayStatusLabel = computed(() =>
  props.statusContext === 'secretary-division' && (props.transfer.bacSignedAt || props.transfer.bacPihakKeduaSignedAt)
    ? 'BAC Ditandatangani'
    : statusLabel(props.transfer.status),
);
const transferDisplayStatusClass = computed(() =>
  props.statusContext === 'secretary-division' && (props.transfer.bacSignedAt || props.transfer.bacPihakKeduaSignedAt)
    ? 'px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
    : statusBadgeClass(props.transfer.status),
);
const atasanPositionText = computed(() =>
  props.transfer.atasanPositionText
  ?? (props.transfer as any).atasan_position_text
  ?? props.transfer.approvalLevels?.[0]?.atasanPositionText
  ?? (props.transfer.approvalLevels?.[0] as any)?.atasan_position_text
  ?? '',
);
const primaryBerkasRow = computed(() =>
  berkasRows.value.find((row: any) => String(row.id ?? '') === String(props.transfer.arsipId ?? ''))
  ?? berkasRows.value[0]
  ?? null,
);
const isRetentionExpired = (date: string | null | undefined) => {
  if (!date) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return String(date).slice(0, 10) <= today;
};
const penataanStatusLabel = (status: string) => {
  if (status !== 'SELESAI') return 'Diterima';
  const primaryArchive = primaryBerkasRow.value;
  if (primaryArchive?.penyusutanSudahDiajukan) return 'Selesai';
  return primaryArchive && isRetentionExpired(primaryArchive.tanggalRetensiInaktifBerakhir)
    ? 'Siap Penyusutan'
    : 'Menunggu Retensi Inaktif';
};
const penataanStatusClass = (status: string) => {
  const label = penataanStatusLabel(status);
  if (label === 'Siap Penyusutan') {
    return 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300';
  }
  if (label === 'Menunggu Retensi Inaktif') {
    return 'inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300';
  }
  if (label === 'Selesai') {
    return 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
  }
  return 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300';
};
const previewFrom = computed(() => props.previewFrom ?? 'transfer');
const infoOpen = ref(true);
const berkasOpen = ref(true);
const daftarIsiOpen = ref(true);
const approvalOpen = ref(true);
const tuApprovalOpen = ref(true);
const bacSignerOpen = ref(true);
const bacTembusanOpen = ref(true);

const bacTembusan = computed(() =>
  Array.isArray(props.transfer.bacTembusan) ? props.transfer.bacTembusan : [],
);
const hasBacSigner = computed(
  () => Boolean(
    props.transfer.bacPihakPertamaPersnum ||
    props.transfer.bacPihakPertamaName ||
    props.transfer.bacPihakKeduaPersnum ||
    props.transfer.bacPihakKeduaName,
  ),
);
const hasBacTembusan = computed(() => bacTembusan.value.length > 0);

const tablePdfPreviewOpen = ref(false);
const tablePdfPreviewLoading = ref(false);
const tablePdfPreviewUrl = ref('');
const tablePdfPreviewTitle = ref('Preview Daftar Berkas');
const naskahPreviewOpen = ref(false);
const naskahPreviewLoading = ref(false);
const naskahPreviewUrl = ref('');
const naskahPreviewTitle = ref('Preview Naskah');

const printDaftarBerkas = () => openTablePrintPreview('Daftar Berkas', 'daftar-berkas-print');

const printDaftarIsi = () => openTablePrintPreview('Daftar Isi Berkas', 'daftar-isi-print');

const closeTablePdfPreview = () => {
  if (tablePdfPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(tablePdfPreviewUrl.value);
  }
  tablePdfPreviewUrl.value = '';
};

onBeforeUnmount(closeTablePdfPreview);

const closeNaskahPreview = () => {
  naskahPreviewOpen.value = false;
  naskahPreviewUrl.value = '';
  naskahPreviewLoading.value = false;
};

const openNaskahPreview = async (row: any) => {
  naskahPreviewTitle.value = row.uraianInformasi || row.nomorSurat || 'Preview Naskah';
  naskahPreviewUrl.value = '';
  naskahPreviewOpen.value = true;
  naskahPreviewLoading.value = true;

  try {
    const detailRes: any = await getNaskahDetailInBerkas(String(row.id), String(row.naskahId));
    const detailData = detailRes?.data?.data ?? detailRes?.data ?? detailRes;
    const detail = Array.isArray(detailData) ? detailData[0] : detailData;
    let pdfUrl = detail?.final_pdf_url ?? detail?.finalPdfUrl ?? detail?.final_pdf ?? detail?.pdf_url ?? null;

    if (!pdfUrl) {
      const pdfRes: any = await getNaskahPdfUrl(String(row.naskahId));
      const pdfData = pdfRes?.data?.data ?? pdfRes?.data ?? pdfRes;
      pdfUrl = pdfData?.url ?? pdfData?.final_pdf_url ?? null;
    }

    if (!pdfUrl) throw new Error('PDF naskah tidak tersedia.');
    naskahPreviewUrl.value = pdfUrl;
  } catch (error: any) {
    naskahPreviewOpen.value = false;
    useToast().add({
      title: 'Preview naskah gagal dibuka',
      description: error?.message || 'PDF naskah tidak tersedia.',
      color: 'error',
    });
  } finally {
    naskahPreviewLoading.value = false;
  }
};

const openTablePrintPreview = async (title: string, elementId: string) => {
  const element = document.getElementById(elementId);
  const sourceTable = element?.querySelector('table');
  if (!sourceTable) return;

  closeTablePdfPreview();
  tablePdfPreviewTitle.value = `Preview ${title}`;
  tablePdfPreviewOpen.value = true;
  tablePdfPreviewLoading.value = true;

  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = 12;
    const pageWidth = 297;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin * 2;
    const unitKerja = props.unitKerjaPihakPertama || props.transfer.divisiName || '................................';
    const getCellText = (cell: Element) => {
      const text = (cell as HTMLElement).innerText || cell.textContent || '';
      return text.split('\n').map((line) => line.trim()).filter(Boolean).join('\n') || '-';
    };
    const headers = Array.from(sourceTable.querySelectorAll('thead th'))
      .filter((cell) => !cell.classList.contains('print-action'));
    const bodyRows = Array.from(sourceTable.querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.querySelectorAll('td'))
        .filter((cell) => !cell.classList.contains('print-action'))
        .map(getCellText),
    );
    const headerLabels = headers.map(getCellText);
    const weights = headerLabels.map((label) => {
      if (/uraian|informasi/i.test(label)) return 3.2;
      if (/nomor|no berkas/i.test(label)) return 1.6;
      if (/kode/i.test(label)) return 1.3;
      if (/aksi/i.test(label)) return 0.65;
      if (/lokasi|keamanan|retensi/i.test(label)) return 1.25;
      return 1;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    const columnWidths = weights.map((weight) => (weight / totalWeight) * contentWidth);
    const xPositions = columnWidths.map((_, index) =>
      margin + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0),
    );
    const lineHeight = 4;
    const drawPageHeading = () => {
      pdf.setTextColor(20, 20, 20);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(15);
      pdf.text(title, pageWidth / 2, 15, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Unit Kerja: ${unitKerja}`, pageWidth / 2, 22, { align: 'center' });
      return 32;
    };
    const drawTableRow = (cells: string[], y: number, isHeader = false) => {
      pdf.setFont('times', isHeader ? 'bold' : 'normal');
      pdf.setFontSize(isHeader ? 9 : 9.5);
      const linesByCell = columnWidths.map((width, index) =>
        pdf.splitTextToSize(cells[index] || '-', Math.max(8, width - 4)) as string[],
      );
      const rowHeight = Math.max(8, ...linesByCell.map((lines) => lines.length * lineHeight + 4));
      const fontHeight = pdf.getFontSize() * 0.3528;

      cells.forEach((_, index) => {
        const x = xPositions[index];
        const width = columnWidths[index];
        const textHeight = (linesByCell[index].length - 1) * lineHeight + fontHeight;
        const textY = y + (rowHeight - textHeight) / 2 + fontHeight;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(40, 40, 40);
        pdf.rect(x, y, width, rowHeight, 'FD');
        pdf.setTextColor(20, 20, 20);
        pdf.text(linesByCell[index], x + width / 2, textY, {
          align: 'center',
          maxWidth: width - 4,
          lineHeightFactor: 1.1,
        });
      });
      return rowHeight;
    };

    let y = drawPageHeading();
    y += drawTableRow(headerLabels, y, true);
    for (const row of bodyRows) {
      const estimatedLines = row.map((text, index) =>
        pdf.splitTextToSize(text, Math.max(8, columnWidths[index] - 4)).length,
      );
      const estimatedHeight = Math.max(8, ...estimatedLines.map((count) => count * lineHeight + 4));
      if (y + estimatedHeight > pageHeight - margin) {
        pdf.addPage();
        y = drawPageHeading();
        y += drawTableRow(headerLabels, y, true);
      }
      y += drawTableRow(row, y);
    }

    tablePdfPreviewUrl.value = URL.createObjectURL(pdf.output('blob'));
  } catch (error: any) {
    useToast().add({
      title: 'Preview PDF gagal dibuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
    tablePdfPreviewOpen.value = false;
  } finally {
    tablePdfPreviewLoading.value = false;
  }
};

const berkasRows = computed(() => {
  if (props.daftarBerkas && props.daftarBerkas.length > 0) {
    return props.daftarBerkas.map((row: any) => ({
      ...row,
      lokasiSimpan: berkasLocation(row),
    }));
  }
  return (props.transfer.arsipIds ?? []).map((a, idx) => ({
    no: idx + 1,
    id: a.id,
    kode: a.kode,
    namaBerkas: a.perihal,
    uraianInformasi: a.perihal,
    kodeKlasifikasi: '-',
    nomorItem: idx + 1,
    tanggal: null,
    jumlah: 1,
    lokasiSimpan: '-',
    klasifikasiKeamanan: '-',
  }));
});

const retensiInaktifRows = computed(() =>
  berkasRows.value.filter((row: any) => row.tanggalRetensiInaktifBerakhir),
);

const retentionCountdownLabel = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const dateText = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '-';

  const endDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((endDate.getTime() - today.getTime()) / 86_400_000);

  if (days > 0) return `${days} hari lagi`;
  if (days === 0) return 'Berakhir hari ini';
  return `Lewat ${Math.abs(days)} hari`;
};

const berkasLocation = (row: any) => props.transfer.status === 'SELESAI'
  ? props.transfer.lokasiPenataan || row.lokasiSimpan || '-'
  : row.lokasiSimpan || '-';

const daftarIsiRows = computed(() => props.daftarIsi ?? []);
const showDaftarIsiCard = computed(() => props.daftarIsi !== undefined);
const archiveClassification = (row: any) => {
  const archive = berkasRows.value.find((item: any) => String(item.id ?? '') === String(row.id ?? ''));
  return {
    name: archive?.klasifikasi ?? '-',
    code: archive?.kodeKlasifikasi ?? row.kodeKlasifikasi ?? '-',
  };
};
const archiveClassificationLabel = (row: any) => {
  const { code, name } = archiveClassification(row);
  return [code !== '-' ? code : '', name !== '-' ? name : ''].filter(Boolean).join(' — ') || '-';
};

const levelStatusClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (status === 'DITOLAK') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
};

const levelBadgeClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
  if (status === 'DITOLAK') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
  return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
};

const levelStatusLabel = (status: string): string => {
  if (status === 'DISETUJUI') return 'Disetujui';
  if (status === 'DITOLAK') return 'Ditolak';
  return 'Menunggu';
};
</script>
