<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <Heading variant="heading6b" class="text-mobile-md"
          >Penandatanganan Dokumen</Heading
        >
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- TABLE CONTAINER -->
    <div
      class="bg-white dark:bg-gray-800 dark:border-gray-600 rounded-xl shadow-sm border border-gray-200"
    >
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b border-gray-200"
      >
        <div class="flex items-center gap-2">
          <select
            v-model="rowsPerPage"
            class="border border-gray-300 bg-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <div class="relative">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 hover:bg-gray-200 text-sm px-4 py-2 rounded-lg min-w-[140px] transition"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span>{{ filterStatusLabel }}</span>
            <ChevronDown
              :class="[
                'w-4 h-4 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : '',
              ]"
            />
          </button>

          <div
            v-if="openFilterStatus"
            data-custom-dropdown
            class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <button
              v-for="item in filterOptions"
              :key="item.value"
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition"
              @click.prevent="selectFilterStatus(item)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="relative w-full justify-between">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari nomor dokumen atau perihal..."
            class="w-full bg-gray-50 border border-gray-200 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-primary text-white text-sm">
            <tr>
              <th @click="handleSort('tanggalDibuat')" class="cursor-pointer">
                <div class="flex items-center gap-2 ml-5">
                  <span>Tanggal Dibuat</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'tanggalDibuat'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>
              <th class="px-4 py-3 font-semibold text-sm">No Dokumen</th>
              <th class="px-4 py-3 font-semibold text-sm">Perihal</th>
              <th class="px-4 py-3 font-semibold text-sm text-center">
                Penandatangan
              </th>
              <th class="px-4 py-3 font-semibold text-sm text-center">
                Dokumen
              </th>
              <th @click="handleSort('status')" class="cursor-pointer">
                <div class="flex items-center gap-2 ml-5">
                  <span>Status</span>
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="
                      sortKey === 'status'
                        ? sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0'
                        : 'opacity-50'
                    "
                  />
                </div>
              </th>
              <th class="px-4 py-3 font-semibold text-sm text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <!-- LOADING (SHIMMER) -->
            <tr v-if="loading">
              <td colspan="7" class="p-4">
                <div class="space-y-3">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="w-full h-10 bg-gray-200 animate-pulse rounded-md"
                  ></div>
                </div>
              </td>
            </tr>

            <tr v-else-if="paginatedRows.length === 0">
              <td colspan="7" class="p-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <FileX class="w-12 h-12 text-gray-400" />
                  <p class="text-gray-500 font-medium">Tidak ada data</p>
                  <p class="text-sm text-gray-400">
                    Belum ada dokumen yang perlu ditandatangani
                  </p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="row in paginatedRows"
              :key="row.id"
              class="border-b border-gray-100 hover:bg-primary-50 transition"
            >
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ formatDate(row.tanggalDibuat) }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ row.nomorDokumen }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ row.perihal }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-700">
                {{ row.totalPenandatangan }}
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  @click="viewDocument(row)"
                  :disabled="!row.filePreviewUrl && !row.signedFilePreviewUrl"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition"
                  :class="
                    row.filePreviewUrl || row.signedFilePreviewUrl
                      ? 'bg-blue-50 text-primary hover:bg-blue-100'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  "
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat
                </button>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="row.mySignerStatus === 'waiting'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700"
                >
                  <Clock class="w-3.5 h-3.5" />
                  Menunggu
                </span>
                <span
                  v-else-if="row.mySignerStatus === 'signed'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  Sudah TTD
                </span>
                <span
                  v-else-if="row.mySignerStatus === 'rejected'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"
                >
                  <XCircle class="w-3.5 h-3.5" />
                  Ditolak
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                >
                  {{ row.mySignerStatus }}
                </span>
              </td>

              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="handleViewDetail(row)"
                    class="p-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <Eye class="w-5 h-5" />
                  </button>

                  <button
                    @click="row.canSign ? handleOpenSign(row) : null"
                    :disabled="!row.canSign"
                    :class="[
                      'p-2 rounded-lg transition',
                      row.canSign
                        ? 'text-primary hover:bg-blue-50 cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed',
                    ]"
                    :title="
                      row.canSign
                        ? 'Tanda Tangan'
                        : 'Tidak dapat ditandatangani'
                    "
                  >
                    <Signature class="w-5 h-5" />
                  </button>

                  <button
                    @click="row.canReject ? handleReject(row) : null"
                    :disabled="!row.canReject"
                    :class="[
                      'p-2 rounded-lg transition',
                      row.canReject
                        ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed',
                    ]"
                    :title="row.canReject ? 'Tolak' : 'Tidak dapat ditolak'"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        class="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-4"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ startRow }} - {{ endRow }} dari {{ totalRows }} data
        </div>
        <div class="flex gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
            ]"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>

            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 text-sm"
              >...</span
            >

            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary',
              ]"
            >
              {{ page }}
            </button>

            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 text-sm"
              >...</span
            >

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
            ]"
          >
            Next
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL -->
    <Teleport to="body">
      <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
        <template #title>
          <h2 class="text-xl font-semibold ml-5 mt-5 mb-4">Detail Dokumen</h2>
        </template>

        <div v-if="loadingDetail" class="p-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
            ></div>
            <p class="text-gray-500 text-sm">Memuat detail...</p>
          </div>
        </div>

        <div
          v-else-if="penandatanganDetail"
          class="px-6 pb-6 space-y-6 max-h-[calc(100vh-150px)] overflow-y-auto"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p class="text-gray-600 mb-1">No. Dokumen</p>
              <p class="font-medium text-gray-900">
                {{ penandatanganDetail.nomorDokumen }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Tanggal Dokumen</p>
              <p class="font-medium text-gray-900">
                {{ formatDate(penandatanganDetail.tanggalDokumen) }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Jenis Naskah</p>
              <p class="font-medium text-gray-900">
                {{
                  penandatanganDetail.jenisNaskahText ||
                  penandatanganDetail.jenisNaskah
                }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Klasifikasi</p>
              <p class="font-medium text-gray-900">
                {{
                  penandatanganDetail.klasifikasiText ||
                  penandatanganDetail.klasifikasi
                }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Perihal</p>
              <p class="font-medium text-gray-900">
                {{ penandatanganDetail.perihal }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Status Dokumen</p>
              <span
                class="px-3 py-1 rounded-lg text-xs font-medium inline-block"
                :class="getDocStatusClass(penandatanganDetail.documentStatus)"
              >
                {{ getDocStatusLabel(penandatanganDetail.documentStatus) }}
              </span>
            </div>

            <!-- Rejection Info (if rejected) -->
            <!-- <div v-if="penandatanganDetail.rejectedAt" class="md:col-span-2">
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm font-semibold text-red-800 mb-2">
                  Dokumen Ditolak
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-red-600 mb-1">Ditolak Oleh</p>
                    <p class="font-medium text-red-900">
                      {{ penandatanganDetail.rejectedBy || "-" }}
                    </p>
                  </div>
                  <div>
                    <p class="text-red-600 mb-1">Waktu Ditolak</p>
                    <p class="font-medium text-red-900">
                      {{ formatDate(penandatanganDetail.rejectedAt) }}
                    </p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-red-600 mb-1">Alasan Penolakan</p>
                    <p class="font-medium text-red-900">
                      {{ penandatanganDetail.rejectionReason || "-" }}
                    </p>
                  </div>
                </div>
              </div>
            </div> -->
          </div>

          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="p-3 text-left font-semibold">No</th>
                  <th class="p-3 text-left font-semibold">E-NIK</th>
                  <th class="p-3 text-left font-semibold">Nama/Jabatan</th>
                  <th class="p-3 text-center font-semibold">Status</th>
                  <th class="p-3 text-left font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="signer in penandatanganDetail.signers"
                  :key="signer.id"
                  class="border-b border-gray-100"
                >
                  <td class="p-3">{{ signer.urutan }}</td>
                  <td class="p-3 font-mono">{{ signer.persnum }}</td>
                  <td class="p-3">
                    <div class="font-semibold text-gray-900">
                      {{ signer.nama }}
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">
                      {{ signer.jabatan }}
                    </div>
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="px-3 py-1 rounded-full text-xs font-semibold inline-block"
                      :class="getSignerStatusClass(signer.status)"
                    >
                      {{ getSignerStatusLabel(signer.status) }}
                    </span>
                  </td>
                  <td class="p-3">
                    <div v-if="signer.status === 'signed' && signer.signedAt">
                      <p class="text-xs text-gray-600">Ditandatangani</p>
                      <p class="font-medium">
                        {{ formatDate(signer.signedAt) }}
                      </p>
                      <p
                        v-if="signer.keterangan"
                        class="text-xs text-gray-600 mt-1"
                      >
                        {{ signer.keterangan }}
                      </p>
                    </div>
                    <div
                      v-else-if="
                        signer.status === 'rejected' && signer.rejectedAt
                      "
                    >
                      <p
                        v-if="signer.keterangan"
                        class="text-xs mt-1 text-center"
                      >
                        {{ signer.keterangan }}
                      </p>
                    </div>
                    <div v-else>
                      <p class="text-gray-400">-</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL SIGNATURE -->
    <Teleport to="body">
      <Modal v-model="openSign" :hideDefaultFooter="true" size="xl">
        <template #title>
          <h2 class="text-lg font-semibold ml-5 mt-5 mb-3">
            Tanda Tangan Digital
          </h2>
        </template>

        <div class="px-6 pb-6 space-y-5">
          <div
            v-if="selectedDoc"
            class="border rounded-xl p-4 flex gap-4 items-start bg-blue-50 border-blue-200"
          >
            <div
              class="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
            >
              <User class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-xs text-gray-600 mb-1">
                Ditandatangani secara digital oleh
              </p>
              <p class="font-semibold text-gray-900">
                {{ selectedDoc.mySignerInfo?.nama }}
              </p>
              <p class="text-sm text-gray-700 mt-0.5">
                {{ selectedDoc.mySignerInfo?.jabatan }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Passphrase <span class="text-red-500">*</span>
            </label>
            <input
              v-model="passphrase"
              type="password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan passphrase sertifikat digital"
            />
            <p class="text-xs text-gray-500 mt-1">
              Passphrase yang digunakan untuk sertifikat digital Anda
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Keterangan <span class="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <textarea
              v-model="keterangan"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contoh: Disetujui, sudah sesuai"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              Tambahkan catatan atau komentar untuk tanda tangan ini
            </p>
          </div>

          <button
            @click="handleSign"
            :disabled="!passphrase || loadingSign"
            :class="[
              'w-full rounded-lg py-3 font-semibold text-sm transition',
              passphrase && !loadingSign
                ? 'bg-primary hover:bg-primary-700 text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed',
            ]"
          >
            <span
              v-if="loadingSign"
              class="flex items-center justify-center gap-2"
            >
              <div
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              Memproses...
            </span>
            <span v-else>Proses Tanda Tangan</span>
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL REJECT -->
    <Teleport to="body">
      <Modal v-model="confirmRejectOpen" :hideDefaultFooter="true" size="xl">
        <template #title>
          <h2 class="text-lg font-semibold ml-5 mt-5 mb-3 text-black">
            Tolak Dokumen
          </h2>
        </template>

        <div class="px-6 pb-6 space-y-4">
          <div
            class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertTriangle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-800">Peringatan</p>
              <p class="text-sm text-red-700 mt-1">
                Yakin ingin menolak penandatanganan dokumen ini? Tindakan ini
                tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Alasan Penolakan <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Masukkan alasan penolakan..."
            ></textarea>
          </div>

          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button
              @click="confirmRejectOpen = false"
              class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              @click="rejectNow"
              :disabled="!rejectReason || loadingReject"
              class="flex-1 px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loadingReject">Memproses...</span>
              <span v-else>Tolak Dokumen</span>
            </button>
          </div>
        </div>
      </Modal>
    </Teleport>
    <USlideover
      v-model:open="isOpenPreview"
      title="Pratinjau Dokumen"
      side="bottom"
      :dismissible="true"
      :ui="{
        content: 'h-screen max-h-screen',
        body: 'p-0',
        footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
      }"
    >
      <template #body>
        <div
          class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"
        >
          <iframe
            v-if="pdfUrl"
            :key="pdfUrl"
            :src="pdfUrl"
            class="w-full h-full border-0"
            allowfullscreen
          />

          <div v-else class="flex flex-col items-center gap-2">
            <UIcon
              name="i-lucide-loader-2"
              class="animate-spin w-8 h-8 text-primary-500"
            />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  Eye,
  X,
  Signature,
  User,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  FileX,
  FileCheck,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-vue-next";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import Modal from "~/components/Modal.vue";
import { useDigsig } from "~/composables/useDigsig";
import type { PenandatangananDocument } from "~/types/digsig";

const {
  penandatanganDocuments,
  penandatanganDetail,
  penandatanganMeta,
  penandatanganSummary,
  loading,
  loadingDetail,
  fetchPenandatanganDocuments,
  fetchPenandatanganDetail,
  signDocument,
  rejectDocument,
} = useDigsig();

const openDetail = ref(false);
const openSign = ref(false);
const selectedDoc = ref<PenandatangananDocument | null>(null);
const loadingSign = ref(false);

const confirmRejectOpen = ref(false);
const itemToReject = ref<PenandatangananDocument | null>(null);
const rejectReason = ref("");
const loadingReject = ref(false);

const passphrase = ref("");
const keterangan = ref("");

const search = ref("");
const filterStatus = ref("");
const openFilterStatus = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];

// sort
const sortKey = ref("");
const sortOrder = ref("asc");
function handleSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
}

const filterOptions = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "waiting" },
  { label: "Sudah TTD", value: "signed" },
  { label: "Ditolak", value: "rejected" },
];

const filterStatusLabel = computed(() => {
  const found = filterOptions.find((opt) => opt.value === filterStatus.value);
  return found?.label || "Semua";
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Penandatanganan", to: "/admin/digsig/penandatanganan" },
];

const filteredRows = computed(() => {
  let filtered = penandatanganDocuments.value || [];

  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(
      (doc) =>
        doc.nomorDokumen?.toLowerCase().includes(searchLower) ||
        doc.perihal?.toLowerCase().includes(searchLower),
    );
  }

  if (filterStatus.value) {
    filtered = filtered.filter(
      (doc) => doc.mySignerStatus === filterStatus.value,
    );
  }

  return filtered;
});
// uslideover file
const isOpenPreview = ref(false);
const pdfUrl = ref<string | null>(null);

// pagination
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredRows.value.slice(start, start + rowsPerPage.value);
});

const totalRows = computed(() => filteredRows.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalRows.value / rowsPerPage.value)),
);
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1,
);
const endRow = computed(() =>
  Math.min(currentPage.value * rowsPerPage.value, totalRows.value),
);

const paginationPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Convert to WIB (UTC+7)
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return (
    wibDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
};

const getSignerStatusClass = (status: string) => {
  const statusMap = {
    waiting: "bg-yellow-100 text-yellow-700",
    pending: "bg-blue-100 text-blue-600",
    signed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getSignerStatusLabel = (status: string) => {
  const statusMap = {
    waiting: "Menunggu",
    pending: "Pending",
    signed: "Sudah TTD",
    rejected: "Ditolak",
  };
  return statusMap[status] || status;
};

const getDocStatusClass = (status: string) => {
  const statusMap = {
    draft: "bg-gray-100 text-gray-600",
    on_progress: "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getDocStatusLabel = (status: string) => {
  const statusMap = {
    on_progress: "On Progress",
    completed: "Selesai",
    rejected: "Ditolak",
    draft: "Draft",
  };
  return statusMap[status] || status;
};

const selectFilterStatus = (item: { label: string; value: string }) => {
  filterStatus.value = item.value;
  openFilterStatus.value = false;
  currentPage.value = 1;
};

const isUUID = (str: string) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const handleViewDetail = async (doc: PenandatangananDocument) => {
  if (!isUUID(doc.id)) {
    alert("Data dokumen tidak valid");
    return;
  }
  openDetail.value = true;
  await fetchPenandatanganDetail(doc.id);
};

const handleOpenSign = (doc: PenandatangananDocument) => {
  selectedDoc.value = doc;
  openSign.value = true;
  passphrase.value = "";
  keterangan.value = "";
};

const viewDocument = (row: PenandatangananDocument) => {
  const url = row.signedFilePreviewUrl || row.filePreviewUrl;

  if (!url) {
    alert("Preview dokumen tidak tersedia");
    return;
  }

  pdfUrl.value = url;
  isOpenPreview.value = true;
};

const handleSign = async () => {
  if (!passphrase.value || !selectedDoc.value) {
    alert("Mohon masukkan passphrase");
    return;
  }

  loadingSign.value = true;
  try {
    const payload: any = { passphrase: passphrase.value };
    if (keterangan.value.trim()) {
      payload.keterangan = keterangan.value.trim();
    }

    await signDocument(selectedDoc.value.id, payload);
    alert("Dokumen berhasil ditandatangani");
    openSign.value = false;
    passphrase.value = "";
    keterangan.value = "";
    await fetchPenandatanganDocuments({ page: 1, limit: 10000 });
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.message ||
      err?.message ||
      "Gagal menandatangani dokumen";
    if (errorMsg.toLowerCase().includes("passphrase")) {
      alert("Passphrase yang Anda masukkan salah. Silakan coba lagi.");
    } else {
      alert(errorMsg);
    }
  } finally {
    loadingSign.value = false;
  }
};

const handleReject = (doc: PenandatangananDocument) => {
  itemToReject.value = doc;
  rejectReason.value = "";
  confirmRejectOpen.value = true;
};

const rejectNow = async () => {
  if (!itemToReject.value || !rejectReason.value.trim()) {
    alert("Mohon masukkan alasan penolakan");
    return;
  }

  loadingReject.value = true;
  try {
    await rejectDocument(itemToReject.value.id, rejectReason.value.trim());
    alert("Dokumen berhasil ditolak");
    confirmRejectOpen.value = false;
    rejectReason.value = "";
    await fetchPenandatanganDocuments({ page: 1, limit: 10000 });
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.message || err?.message || "Gagal menolak dokumen";
    alert(errorMsg);
  } finally {
    loadingReject.value = false;
  }
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest("[data-custom-dropdown]")) {
    openFilterStatus.value = false;
  }
};

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  await fetchPenandatanganDocuments({ page: 1, limit: 10000 });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch([search, filterStatus, rowsPerPage], () => {
  currentPage.value = 1;
});
watch(isOpenPreview, (open) => {
  if (!open) {
    pdfUrl.value = null;
  }
});
</script>
