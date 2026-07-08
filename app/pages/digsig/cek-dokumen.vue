<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <AccessDenied v-if="!canAccessPage()" />
    <div v-else>
    <!-- HEADER -->
    <div class="mb-2">
      <Heading variant="heading6b" class="text-mobile-md">
        {{ $t('cek_title') }}
      </Heading>
      <PageHeader :items="breadcrumbs" />
    </div>

    <div class="flex flex-col gap-4 w-full">
      <!-- ================== -->
      <!-- UPLOAD SECTION -->
      <!-- ================== -->
      <div
        class="bg-white p-6 mt-2 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3 dark:text-white dark:bg-gray-800 dark:border-gray-600"
      >
        <Heading variant="heading10sb">{{ $t('cek_upload_title') }}</Heading>

        <label class="w-full cursor-pointer">
          <input type="file" ref="fileInput" class="hidden" @change="handleFile" accept=".pdf" />

          <div
            class="flex items-center justify-between px-4 py-3 border border-gray-300 dark:text-white dark:hover:bg-gray-700 dark:bg-gray-900 dark:border-gray-600 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            :class="{ 'opacity-50 cursor-not-allowed': loadingCheck }"
          >
            <FileText class="w-5 h-5 text-gray-500" />
            <span class="text-gray-600 dark:text-white flex-1 text-center">
              {{ fileName || $t('cek_pilih_file') }}
            </span>
            <Upload class="w-5 h-5 text-gray-600" />
          </div>

          <p class="text-xs text-gray-500 mt-4">
            {{ $t('cek_format_info') }}
            <span class="text-xs text-gray-500 font-semibold mt-2">
              {{ $t('cek_format_detail') }}
            </span>
          </p>
        </label>

        <!-- Error Message -->
        <div
          v-if="error && !showConfirmDialog"
          class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800">
              {{ $t('cek_error_label') }}
            </p>
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>

        <!-- SUBMIT BUTTON -->
        <div v-if="selectedFile && !fileUploaded" class="flex justify-end mt-2">
          <Button
            @click="submitDocument"
            :disabled="loadingCheck"
            class="bg-primary hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('cek_btn_periksa') }}
          </Button>
        </div>
      </div>

      <!-- ================== -->
      <!-- HASIL PEMERIKSAAN -->
      <!-- ================== -->
      <div v-if="fileUploaded && !loadingCheck && documentCheck" class="space-y-4">
        <!-- Status Card -->
        <div
          class="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div class="flex items-center justify-between mb-4">
            <Heading variant="heading10sb">{{ $t('cek_status_verifikasi') }}</Heading>
            <span
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              :class="getStatusBadgeClass(documentCheck.data.status)"
            >
              <component :is="getStatusIcon(documentCheck.data.status)" class="w-5 h-5" />
              {{ formatStatus(documentCheck.data.status) }}
            </span>
          </div>

          <!-- Warning untuk status UNKNOWN -->
          <div
            v-if="documentCheck.data.status === 'UNKNOWN'"
            class="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4"
          >
            <AlertTriangle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800">
                {{ $t('cek_info_label') }}
              </p>
              <p class="text-sm text-yellow-700">{{ documentCheck.message }}</p>
            </div>
          </div>

          <!-- Grid Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-white mb-1">
                {{ $t('cek_nama_dokumen') }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white break-all">
                {{ documentCheck.data.namaDokumen }}
              </p>
            </div>

            <div>
              <p class="text-sm font-medium dark:text-white text-gray-700 mb-1">
                {{ $t('cek_keterangan') }}
              </p>
              <p class="text-sm dark:text-white text-gray-900">
                {{ documentCheck.data.keterangan }}
              </p>
            </div>

            <div>
              <p class="text-sm font-medium dark:text-white text-gray-700 mb-1">
                {{ $t('cek_jumlah_ttd') }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ documentCheck.data.jumlahSignature }}
              </p>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-white mb-1">
                {{ $t('cek_waktu_verifikasi') }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(documentCheck.data.verifiedAt) }}
              </p>
            </div>

            <div>
              <p class="text-sm font-medium dark:text-white dark:text-semibold text-gray-700 mb-1">
                {{ $t('cek_status_valid') }}
              </p>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
                :class="
                  documentCheck.data.isValid
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                "
              >
                <component
                  :is="documentCheck.data.isValid ? CheckCircle2 : XCircle"
                  class="w-4 h-4"
                />
                {{ documentCheck.data.isValid ? $t('cek_valid') : $t('cek_tidak_valid') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Info Penanda Tangan (jika ada) -->
        <div
          v-if="documentCheck.data.signers && documentCheck.data.signers.length > 0"
          v-for="(signer, index) in documentCheck.data.signers"
          :key="index"
          class="bg-white dark:text-white rounded-xl shadow-sm border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 overflow-hidden"
        >
          <!-- HEADER ACCORDION -->
          <button
            @click="toggleSigner(index)"
            class="w-full flex items-center justify-between px-6 py-4 border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <FileCheck class="w-5 h-5" />
              </div>

              <div class="text-left">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ $t('cek_penanda_tangan') }} {{ index + 1 }}
                </p>
                <p class="text-sm text-gray-600 mt-0.5 dark:text-white">
                  {{ signer.name || $t('cek_tidak_diketahui') }}
                </p>
              </div>
            </div>

            <ChevronDown
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openSigners.has(index) }"
            />
          </button>

          <!-- CONTENT -->
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 max-h-0"
            leave-to-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[600px]"
            leave-from-class="opacity-100 max-h-[600px]"
          >
            <div v-if="openSigners.has(index)" class="px-6 py-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div v-for="(value, key) in signer" :key="key">
                  <p class="text-sm font-medium text-gray-500 dark:text-white mb-1 capitalize">
                    {{ formatKey(key) }}
                  </p>
                  <p class="text-sm text-gray-900 dark:text-white break-all">
                    {{ value || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Empty State jika tidak ada signature -->
        <div
          v-if="!documentCheck.data.signers || documentCheck.data.signers.length === 0"
          class="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center"
        >
          <FileQuestion class="w-16 h-16 text-gray-400 mx-auto mb-3" />
          <p class="text-gray-600 font-medium">
            {{ $t('cek_empty_ttd') }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ $t('cek_empty_ttd_hint') }}
          </p>
        </div>

        <!-- Verification Details (jika ada) -->
        <div
          v-if="
            documentCheck.data.verificationDetails &&
            Object.keys(documentCheck.data.verificationDetails).length > 0
          "
          class="bg-white p-6 rounded-xl shadow-sm dark:text-white border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <Heading variant="heading10sb" class="mb-4">
            {{ $t('cek_detail_verifikasi') }}
          </Heading>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div v-for="(value, key) in documentCheck.data.verificationDetails" :key="key">
              <p class="text-sm font-medium text-gray-700 dark:text-white mb-1 capitalize">
                {{ formatKey(key) }}
              </p>
              <p class="text-sm text-gray-900 dark:text-white break-all">
                {{ value || '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end items-center gap-3">
          <Button
            @click="resetCheck"
            class="bg-primary hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('cek_btn_periksa_lain') }}
          </Button>

          <Button
            v-if="documentCheck.data.isValid"
            @click="downloadPdf"
            class="border border-primary hover:bg-primary-700 hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            {{ $t('cek_btn_unduh_pdf') }}
          </Button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Heading from '~/components/Heading.vue'
import {
  FileCheck,
  ChevronDown,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileQuestion,
  Download
} from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const { hasPermission, isSuperadmin } = useAuth()

const { canAccessPage } = useFeatureAccess()

// ─── Breadcrumbs (reactive to locale) ────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('cek_title'), to: '/digsig/cek-dokumen' }
])

const { checkDocument, loadingCheck, error, documentCheck } = useDigsig()

const fileName = ref('')
const fileUploaded = ref(false)
const selectedFile = ref<File | null>(null)
const openSigners = ref(new Set<number>())
const fileInput = ref<HTMLInputElement | null>(null)
const showConfirmDialog = ref(false)

/* Handle File Selection */
function handleFile(e: any) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    error.value = t('cek_error_bukan_pdf')
    selectedFile.value = null
    fileName.value = ''
    return
  }

  error.value = null
  fileName.value = file.name
  selectedFile.value = file
  fileUploaded.value = false
  documentCheck.value = null
}

/* Submit Document */
async function submitDocument() {
  if (!selectedFile.value) return

  try {
    await checkDocument(selectedFile.value)
    fileUploaded.value = true

    if (documentCheck.value?.data.signers?.length) {
      openSigners.value.add(0)
    }
  } catch (err) {
    console.error('Error checking document:', err)
    fileUploaded.value = false
  }
}

/* Reset Check */
function resetCheck() {
  fileName.value = ''
  selectedFile.value = null
  fileUploaded.value = false
  documentCheck.value = null
  error.value = null
  openSigners.value.clear()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

/* Toggle Signer Accordion */
function toggleSigner(index: number) {
  if (openSigners.value.has(index)) {
    openSigners.value.delete(index)
  } else {
    openSigners.value.add(index)
  }
}

/* Format Status — uses t() so it switches with locale */
function formatStatus(status: string) {
  switch (status?.toUpperCase()) {
    case 'VALID':
      return t('cek_status_valid_label')
    case 'INVALID':
      return t('cek_status_invalid_label')

    case 'UNKNOWN':
      return t('cek_status_unknown_label')
    default:
      return status
  }
}

function getStatusBadgeClass(status: string) {
  switch (status.toUpperCase()) {
    case 'VALID':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'INVALID':
      return 'bg-red-100 text-red-700 border border-red-200'
    case 'EXPIRED':
      return 'bg-black text-white border border-black-200'
    case 'UNKNOWN':
      return 'bg-gray-100 text-gray-700 border border-gray-200'
    default:
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
  }
}

function getStatusIcon(status: string) {
  switch (status.toUpperCase()) {
    case 'VALID':
      return CheckCircle2
    case 'INVALID':
      return XCircle
    case 'EXPIRED':
    case 'UNKNOWN':
      return AlertTriangle
    default:
      return AlertCircle
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date)
}

function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

/* PDF / Word report helpers */
function buildReportData() {
  const data = documentCheck.value?.data
  if (!data) return null

  return {
    namaDokumen: data.namaDokumen,
    status: data.status,
    valid: data.isValid ? t('cek_valid') : t('cek_tidak_valid'),
    jumlahSignature: data.jumlahSignature,
    verifiedAt: formatDate(data.verifiedAt),
    keterangan: data.keterangan,
    signers: data.signers || []
  }
}

function downloadPdf() {
  const report = buildReportData()
  if (!report) return

  const pdf = new jsPDF()
  let y = 10

  pdf.setFontSize(14)
  pdf.text('LAPORAN VERIFIKASI DOKUMEN', 10, y)
  y += 10

  pdf.setFontSize(11)
  pdf.text(`${t('cek_nama_dokumen')}: ${report.namaDokumen}`, 10, y)
  y += 7
  pdf.text(`Status: ${report.status}`, 10, y)
  y += 7
  pdf.text(`${t('cek_status_valid')}: ${report.valid}`, 10, y)
  y += 7
  pdf.text(`${t('cek_jumlah_ttd')}: ${report.jumlahSignature}`, 10, y)
  y += 7
  pdf.text(`${t('cek_waktu_verifikasi')}: ${report.verifiedAt}`, 10, y)
  y += 10

  pdf.text(`${t('cek_penanda_tangan')}:`, 10, y)
  y += 7

  report.signers.forEach((s: any, i: number) => {
    pdf.text(`${i + 1}. ${s.name || t('cek_tidak_diketahui')}`, 12, y)
    y += 6
  })

  pdf.save(`laporan-${report.namaDokumen}.pdf`)
}

async function downloadWord() {
  const report = buildReportData()
  if (!report) return

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'LAPORAN VERIFIKASI DOKUMEN',
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph(`${t('cek_nama_dokumen')}: ${report.namaDokumen}`),
          new Paragraph(`Status: ${report.status}`),
          new Paragraph(`${t('cek_status_valid')}: ${report.valid}`),
          new Paragraph(`${t('cek_jumlah_ttd')}: ${report.jumlahSignature}`),
          new Paragraph(`${t('cek_waktu_verifikasi')}: ${report.verifiedAt}`),
          new Paragraph(''),
          new Paragraph({
            children: [new TextRun({ text: `${t('cek_penanda_tangan')}:`, bold: true })]
          }),
          ...report.signers.map(
            (s: any, i: number) => new Paragraph(`${i + 1}. ${s.name || t('cek_tidak_diketahui')}`)
          )
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `laporan-${report.namaDokumen}.docx`)
}
</script>

<style scoped>
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
