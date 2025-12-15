<template>
  <div>
    <div v-if="isLoadingData || isSdiLoading"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-900 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden">
      <PageHeader title="Tulis Disposisi" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{ root: 'rounded-t-none ring-0 shadow-none bg-white print:hidden' }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <div class="grid grid-cols-1 gap-x-6 gap-y-2 mb-6">
          <div class="space-y-2">
            <TulisInputTanggal v-model="date" label="Tanggal Disposisi" />

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
              <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Sifat</span>
              <div class="flex flex-wrap gap-1 w-full items-center">
                <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat ..."
                  class="w-full p-0" variant="none">
                  <template #default>
                    <span v-if="selectedSifat" class="text-sm font-medium">{{ selectedSifat.label }}</span>
                    <span v-else class="text-sm text-gray-400">Pilih sifat</span>
                  </template>
                </USelectMenu>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
              <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Ref. Nomor</span>
              <input type="text" v-model="refNumber"
                class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
                placeholder="Nomor Surat Masuk" />
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
              <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Ref. Perihal</span>
              <input type="text" v-model="subject"
                class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
                placeholder="Perihal Surat Masuk" />
            </div>
          </div>
        </div>

        <div class="flex flex-col py-3 border-b border-gray-200 gap-3 mb-6">
          <span class="text-sm font-medium text-gray-500">Instruksi / Disposisi</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="opt in checklistOptions" :key="opt" class="flex gap-2 items-start">
              <input type="checkbox" :id="opt" :value="opt" v-model="selectedChecklist"
                class="mt-0.5 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer">
              <label :for="opt" class="text-sm text-gray-700 cursor-pointer select-none leading-tight">
                {{ opt }}
              </label>
            </div>
          </div>
        </div>

        <div class="flex flex-col py-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-bold text-gray-700">Preview Layout</h3>
            <UButton icon="i-lucide-eye" color="primary" size="md" label="Preview" @click="openPreview" />
          </div>

          <ClientOnly>
            <div class="border border-gray-300 shadow-sm rounded-lg bg-gray-50 p-1 md:p-6 overflow-x-auto">
              <div
                class="bg-white mx-auto max-w-[210mm] border border-gray-400 p-8 min-h-[297mm] shadow-lg text-black font-serif relative">

                <div class="border-2 border-black mb-0">
                  <div class="flex border-b-2 border-black">
                    <div class="w-2/3 p-4 flex items-center gap-4 border-r-2 border-black">
                      <img src="/logoAirnav.png" alt="Logo" class="h-12 w-auto object-contain" />
                      <span class="font-bold text-xl tracking-wide">AirNav Indonesia</span>
                    </div>
                    <div class="w-1/3 p-2 flex flex-col justify-center text-center font-bold text-sm">
                      <div>LEMBAR DISPOSISI</div>
                      <div class="uppercase">{{ user?.positionText || 'NAMA JABATAN' }}</div>
                    </div>
                  </div>

                  <div class="flex border-b-2 border-black">
                    <div class="w-[15%] border-r-2 border-black p-2 flex flex-col justify-between">
                      <div class="font-bold underline mb-4">AGENDA</div>
                      <div class="text-xs font-bold space-y-2">
                        <div>No: ........</div>
                        <div>Tgl: ........</div>
                      </div>
                    </div>

                    <div class="w-[55%] border-r-2 border-black p-2 text-xs">
                      <table class="w-full">
                        <tr>
                          <td class="w-16 py-1">Surat dari</td>
                          <td class="py-1">: {{ selectedSender?.label || '.....................' }}</td>
                        </tr>
                        <tr>
                          <td class="py-1">Tanggal</td>
                          <td class="py-1">: {{ formattedDate }}</td>
                        </tr>
                        <tr>
                          <td class="py-1">Nomor</td>
                          <td class="py-1">: {{ refNumber || '.....................' }}</td>
                        </tr>
                        <tr>
                          <td class="py-1 align-top">Perihal</td>
                          <td class="py-1 align-top">: {{ subject || '.....................' }}</td>
                        </tr>
                      </table>
                    </div>

                    <div class="w-[30%] p-2 text-xs">
                      <div class="font-bold underline mb-2">KLASIFIKASI</div>
                      <div class="space-y-1">
                        <div v-for="s in sifatOptions" :key="s.value" class="flex items-center gap-2">
                          <div class="w-4 h-4 border border-black flex items-center justify-center text-[10px]">
                            {{ selectedSifat?.value === s.value ? '✓' : '' }}
                          </div>
                          <span>{{ s.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="border-b-2 border-black p-2 text-xs">
                    <div class="font-bold underline mb-1">Kepada Yth. :</div>
                    <div class="pl-4 italic text-gray-500">
                      (Pilih penerima pada tahap selanjutnya / sistem)
                    </div>
                  </div>

                  <div class="border-b-2 border-black p-2 text-xs flex">
                    <div class="w-20 font-bold underline shrink-0">DISPOSISI :</div>
                    <div class="flex-1 grid grid-cols-3 gap-2">
                      <div v-for="opt in checklistOptions" :key="opt" class="flex items-start gap-1">
                        <div
                          class="w-3 h-3 border border-black flex items-center justify-center text-[8px] mt-0.5 shrink-0">
                          {{ selectedChecklist.includes(opt) ? '✓' : '' }}
                        </div>
                        <span class="leading-tight">{{ opt }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="p-0 min-h-[300px] relative">
                    <div class="p-2 font-bold text-xs underline bg-gray-100 border-b border-gray-200">CATATAN :</div>

                    <div v-if="showEditor" class="relative">
                      <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                    </div>
                    <div v-else class="h-[300px] bg-white w-full"></div>

                    <div class="absolute bottom-4 right-4 z-10 pointer-events-none">
                      <div
                        class="border-2 border-black w-24 h-16 flex items-center justify-center font-bold text-xs bg-white/50">
                        Paraf
                      </div>
                    </div>
                  </div>

                  <div class="border-t-2 border-black p-1 text-[10px] font-bold text-center bg-gray-50">
                    Lembar disposisi ini menjadi bagian yang tidak terpisahkan dari nomor dan tanggal surat pada agenda
                    ini.
                  </div>
                </div>

              </div>
            </div>
          </ClientOnly>

          <div class="flex flex-col py-3 gap-2 mt-4">
            <label class="text-sm font-medium text-gray-700">Lampiran File Tambahan</label>
            <FileUpload v-model="uploadedFiles" accept="application/pdf" :multiple="true"
              description="Klik atau drag & drop untuk upload file PDF" />
          </div>

        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800">
          <UButton label="Preview Dokumen" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="openPreview" />
        </div>

      </div>
    </UCard>

    <ClientOnly>
      <div class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden">
        <div ref="pdfSourceRef"
          style="width: 800px; padding: 20px; background-color: #ffffff; color: #000000; font-family: 'Times New Roman', serif;">

          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000000;">
            <tr style="border-bottom: 2px solid #000000;">
              <td colspan="2" style="padding: 10px; border-right: 2px solid #000000; width: 60%;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="/logoAirnav.png" style="height: 50px;" />
                  <span style="font-size: 18px; font-weight: bold; color: #000000;">AirNav Indonesia</span>
                </div>
              </td>
              <td style="padding: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #000000;">
                <div>LEMBAR DISPOSISI</div>
                <div style="text-transform: uppercase;">{{ user?.positionText || 'NAMA JABATAN' }}</div>
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #000000;">
              <td style="width: 15%; padding: 5px; border-right: 2px solid #000000; vertical-align: top;">
                <div style="font-weight: bold; text-decoration: underline; margin-bottom: 20px; color: #000000;">AGENDA
                </div>
                <div style="font-size: 11px; color: #000000;">No: .........</div>
                <div style="font-size: 11px; color: #000000;">Tgl: .........</div>
              </td>
              <td style="width: 55%; padding: 5px; border-right: 2px solid #000000; vertical-align: top;">
                <table style="width: 100%; font-size: 11px; color: #000000;">
                  <tr>
                    <td style="width: 60px;">Surat dari</td>
                    <td>: {{ selectedSender?.label || '-' }}</td>
                  </tr>
                  <tr>
                    <td>Tanggal</td>
                    <td>: {{ formattedDate }}</td>
                  </tr>
                  <tr>
                    <td>Nomor</td>
                    <td>: {{ refNumber || '-' }}</td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top;">Perihal</td>
                    <td style="vertical-align: top;">: {{ subject || '-' }}</td>
                  </tr>
                </table>
              </td>
              <td style="width: 30%; padding: 5px; vertical-align: top;">
                <div
                  style="font-weight: bold; text-decoration: underline; font-size: 11px; margin-bottom: 5px; color: #000000;">
                  KLASIFIKASI</div>
                <div style="font-size: 11px; color: #000000;">
                  <div v-for="s in sifatOptions" :key="s.value">
                    [ {{ selectedSifat?.value === s.value ? 'X' : ' ' }} ] {{ s.label }}
                  </div>
                </div>
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #000000;">
              <td colspan="3" style="padding: 5px; font-size: 11px; color: #000000;">
                <span style="font-weight: bold; text-decoration: underline;">Kepada Yth. :</span>
                <div style="margin-left: 10px; margin-top: 5px;">(Daftar Penerima)</div>
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #000000;">
              <td colspan="3" style="padding: 5px;">
                <div style="display: flex;">
                  <div
                    style="width: 80px; font-weight: bold; text-decoration: underline; font-size: 11px; color: #000000;">
                    DISPOSISI :</div>
                  <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 10px;">
                    <div v-for="opt in checklistOptions" :key="opt"
                      style="font-size: 10px; width: 30%; color: #000000;">
                      [ {{ selectedChecklist.includes(opt) ? 'X' : ' ' }} ] {{ opt }}
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td colspan="3" style="padding: 10px; min-height: 300px; vertical-align: top; position: relative;">
                <div
                  style="font-weight: bold; text-decoration: underline; font-size: 11px; margin-bottom: 10px; color: #000000;">
                  CATATAN :</div>

                <div v-if="showEditor" v-html="editorContent"
                  style="font-size: 12px; line-height: 1.5; min-height: 200px; color: #000000;"></div>
                <div v-else style="min-height: 200px;"></div>

                <div style="text-align: right; margin-top: 50px; margin-right: 20px;">
                  <div
                    style="border: 2px solid #000000; width: 80px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; margin-left: auto; color: #000000;">
                    Paraf
                  </div>
                </div>
              </td>
            </tr>

            <tr style="border-top: 2px solid #000000;">
              <td colspan="3"
                style="text-align: center; font-size: 9px; font-weight: bold; padding: 2px; color: #000000;">
                Lembar disposisi ini menjadi bagian yang tidak terpisahkan dari nomor dan tanggal surat pada agenda ini.
              </td>
            </tr>
          </table>

        </div>
      </div>
    </ClientOnly>

    <USlideover v-model:open="isOpenPreview" title="Preview PDF" side="bottom"
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0', footer: 'p-4 border-t border-gray-200 dark:border-gray-800' }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat PDF...</span>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-4 w-full">
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" :loading="isSdiLoading" @click="handleSaveDraft" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" @click="handleKirimDokumen" />
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CalendarDate } from '@internationalized/date'
import Editor from '@tinymce/tinymce-vue'
import { useAuth } from "@/composables/useAuth"
import type { Editor as TinyMCEEditor } from 'tinymce'
import { useSdi } from "~/composables/useSdi"
import { type SdiPayload } from "~/types/sdi"

const { user, getProfile } = useAuth()
const toast = useToast()

const { saveDraft, sendMessage, isLoading: isSdiLoading } = useSdi()

// --- STATE ---
const pdfSourceRef = ref<HTMLElement | null>(null)
const editorContent = ref('')
const tinymceEditor = ref<TinyMCEEditor | null>(null)

const date = ref<CalendarDate>()
const senders_selected = ref('')
const subject = ref('')
const refNumber = ref('')
const isLoadingData = ref(false)

// --- PREVIEW STATE ---
const isOpenPreview = ref(false)
const pdfUrl = ref('')
const pdfBlob = ref<Blob | null>(null)

// --- UPLOAD STATE ---
const uploadedFiles = ref<File[]>([])

// --- CHECKBOX STATE & OPTIONS ---
const selectedChecklist = ref<string[]>([])
const checklistOptions = [
  'Untuk Diketahui', 'Proses Lanjut', 'Koordinasikan', 'Cek', 'Monitor', 'Evaluasi',
  'Dikaji Kemungkinannya', 'Laporkan', 'Untuk Menjadi Perhatian', 'Untuk Dijadikan Acuan/Dipergunakan',
  'Harap Mewakili', 'Harap Mendampingi', 'Tunjuk Perwakilan', 'Siapkan Bahan/Materi', 'Lainnya'
]

const showEditor = computed(() => selectedChecklist.value.includes('Lainnya'))

// --- MOCK DATA ---
const senders = [{ label: 'Internal - Divisi SDM', value: 'tes1' }, { label: 'Eksternal - Kemenhub', value: 'tes2' }]
const breadcrumbs = [{ label: 'Dashboard', to: '/user/dashboard' }, { label: 'Tulis Disposisi', to: '#' }]
const sifatOptions = [
  { label: 'Sangat Rahasia', value: 'sangat_rahasia' },
  { label: 'Rahasia', value: 'rahasia' },
  { label: 'Terbatas', value: 'terbatas' },
  { label: 'Biasa', value: 'biasa' }
]
const selectedSifat = ref()

// --- TINYMCE CONFIG ---
const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 300,
  menubar: false,
  promotion: false,
  branding: false,
  statusbar: false,
  placeholder: 'Ketik catatan disposisi disini...',
  plugins: 'lists advlist link table fullscreen',
  toolbar: 'bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | table',
  content_style: `
    body { font-family: "Times New Roman", Times, serif; font-size: 11pt; margin: 10px; }
    p { margin: 0; padding: 0; line-height: 1.4; }
  `,
  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor
  }
}

onMounted(async () => {
  const now = new Date()
  date.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  if (!user.value) await getProfile()
})

const formattedDate = computed(() => {
  if (!date.value) return '-'
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day)
  return jsDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})
const selectedSender = computed(() => senders.find(s => s.value === senders_selected.value))

// --- PAYLOAD PREPARATION ---
const getPayload = () => {
  const tglStr = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0];

  return {
    pengirim: user.value?.position || "70000000",
    penerima: [],
    tembusan: [],
    klasifikasi: "DISPOSISI",
    klasifikasi_text: "Lembar Disposisi",
    sifat: selectedSifat.value?.value || 'biasa',
    perihal: subject.value,
    konten: showEditor.value ? editorContent.value : '-',
    english: false,
    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "Jabatan",
    tanda_tangan: "hash_ttd_placeholder",
    nama_lengkap: user.value?.nama || "User",
    tgl: tglStr,
    lampiran: uploadedFiles.value.length > 0 ? "Terlampir" : "-",
    final_pdf: null
  } as SdiPayload
}

const createFormData = (payload: SdiPayload, includePdf: boolean = false) => {
  const formData = new FormData();
  formData.append("pengirim", String(payload.pengirim));
  formData.append("sifat", payload.sifat);
  formData.append("perihal", payload.perihal);
  formData.append("konten", payload.konten);
  formData.append("tgl", payload.tgl);

  formData.append("checklist", JSON.stringify(selectedChecklist.value));
  formData.append("ref_number", refNumber.value);

  if (uploadedFiles.value.length > 0) {
    uploadedFiles.value.forEach((file) => formData.append("lampiran_files", file, file.name));
  }

  if (includePdf && pdfBlob.value) {
    formData.append("final_pdf", pdfBlob.value, `Disposisi_${payload.tgl}.pdf`);
  }
  return formData;
}

// --- ACTIONS ---
const handleSaveDraft = async () => {
  if (!user.value) await getProfile();
  const payload = getPayload();
  const formData = createFormData(payload, false);
  try {
    await saveDraft(formData);
    toast.add({ title: 'Berhasil', description: 'Draft Disposisi disimpan', color: 'green' });
    isOpenPreview.value = false;
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal simpan draft', color: 'red' });
  }
}

const handleKirimDokumen = async () => {
  if (!user.value) await getProfile();
  const payload = getPayload();

  if (!pdfBlob.value) {
    toast.add({ title: 'PDF Belum Siap', description: 'Tunggu preview selesai', color: 'orange' });
    return;
  }

  const formData = createFormData(payload, true);
  try {
    await sendMessage(formData);
    toast.add({ title: 'Terkirim', description: 'Disposisi berhasil dikirim', color: 'green' });
    isOpenPreview.value = false;
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal kirim disposisi', color: 'red' });
  }
}

// --- PDF GENERATOR ---
async function openPreview() {
  const element = pdfSourceRef.value
  if (!element) return

  isLoadingData.value = true
  isOpenPreview.value = true
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
  pdfUrl.value = ''
  pdfBlob.value = null

  try {
    const html2pdf = (await import('html2pdf.js')).default
    const { PDFDocument } = await import('pdf-lib')

    const opt = {
      margin: 10,
      filename: `Disposisi_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    const mainPdfBuffer = await html2pdf().set(opt).from(element).output('arraybuffer')

    const mergedPdf = await PDFDocument.create()
    const mainPdfDoc = await PDFDocument.load(mainPdfBuffer)
    const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices())
    mainPages.forEach((page) => mergedPdf.addPage(page))

    if (uploadedFiles.value && uploadedFiles.value.length > 0) {
      for (const file of uploadedFiles.value) {
        if (file.type === 'application/pdf') {
          try {
            const fileBuffer = await file.arrayBuffer()
            const attachmentDoc = await PDFDocument.load(fileBuffer)
            const attachmentPages = await mergedPdf.copyPages(attachmentDoc, attachmentDoc.getPageIndices())
            attachmentPages.forEach((page) => mergedPdf.addPage(page))
          } catch (err) {
            console.error(`Gagal merge file ${file.name}`, err)
          }
        }
      }
    }

    const mergedPdfBytes = await mergedPdf.save()
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    pdfBlob.value = blob
    pdfUrl.value = URL.createObjectURL(blob)

  } catch (err: any) {
    console.error("PDF Error:", err)
    alert("Gagal generate PDF: " + err.message)
    isOpenPreview.value = false
  } finally {
    isLoadingData.value = false
  }
}
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}

input[type="text"]::placeholder {
  color: #9ca3af;
  font-style: italic;
}
</style>
