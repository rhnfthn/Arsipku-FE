<template>
  <div>
    <!-- Header Sticky -->
    <!-- <div class="sticky top-[88px] bg-white dark:bg-gray-900 z-30 p-4 sm:px-6 rounded-t-lg mb-0"> -->
    <div class="bg-white dark:bg-gray-900 z-30 p-4 sm:px-6 rounded-t-lg mb-0">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <!-- Konten Card -->
    <UCard variant="soft" :ui="{ root: 'rounded-t-none ring-0 shadow-none bg-white' }">
      <div class="flex-1 overflow-y-auto  space-y-1">

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Berkas</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="senders_selected" :items="senders" value-key="value" placeholder="Pilih Pengirim"
              :search-input="{ placeholder: 'Cari berkas', size: 'lg' }" variant="none" class="w-full" :ui="{
                base: '!px-0 !bg-transparent w-full',
                ring: 'ring-0',
                shadow: 'shadow-none',
              }">
              <template #item="{ item }">
                <div class="flex items-center gap-3 w-full py-1 overflow-hidden">
                  <span class="truncate text-sm">{{ item.label }}</span>
                </div>
              </template>

              <template #default>
                <span v-if="selectedSender" class="truncate text-sm block w-full text-left">
                  {{ selectedSender.label }}
                </span>
                <span v-else class="text-gray-400 text-sm block w-full text-left">
                  Pilih berkas
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal Surat</span>
          <div class="relative w-full">
            <UPopover v-model:open="open" :content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 8,
              alignOffset: 0
            }">
              <div class="flex items-center gap-2 cursor-pointer w-full pr-2" @click="open = true">
                <UInputDate locale="id-ID" ref="inputDateRef" v-model="date" :default-placeholder="today" variant="none"
                  size="sm" class="flex-1" :ui="{
                    base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex flex-row items-center h-8',
                    segment: '!text-gray-900 !font-medium data-placeholder:!text-gray-400 !rounded-none focus:!bg-transparent shrink-0 inline-block data-[segment=literal]:mx-2 whitespace-nowrap',
                  }" />
                <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 shrink-0 mr-1" />
              </div>

              <template #content>
                <UCalendar v-model="date" class="p-2" @update:model-value="open = false" />
              </template>
            </UPopover>

          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
              :search-input="{ placeholder: 'Cari tertuju', size: 'lg' }" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #item="{ item, selected: isSel }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
                  <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item)" />
                  <img v-if="item.image" :src="item.image" :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </template>

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                    <img v-if="item.image" :src="item.image" :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, $event)" />
                  </UBadge>

                  <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
                    Pilih tertuju
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tembusan</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
              :search-input="{ placeholder: 'Cari tembusan', size: 'lg' }" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #item="{ item, selected: isSel }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
                  <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item)" />
                  <img v-if="item.image" :src="item.image" :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </template>

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                    <img v-if="item.image" :src="item.image" :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, $event)" />
                  </UBadge>
                  <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
                    Pilih tembusan
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 group gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-32 text-sm text-gray-500 font-medium shrink-0">Perihal</span>
            <input type="text" class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
              placeholder="Ketik perihal" />
          </div>
        </div>

        <div class="flex flex-col py-4">

          <!-- BAGIAN BUTTON ATAS -->
          <div class="flex flex-wrap items-center justify-between w-full gap-3">

            <!-- KIRI -->
            <div class="flex flex-wrap gap-3 flex-shrink-0">

              <!-- PILIH TEMPLATE -->
              <UModal title="Pilih Template" :close="{ color: 'primary', variant: 'outline', class: 'rounded-full' }">
                <UButton label="Pilih Template" color="primary" variant="soft" icon="i-heroicons-adjustments-horizontal"
                  class="px-6 font-medium" />

                <template #body>
                  <div class="flex flex-col gap-2">
                    <UCard v-for="template in templates" :key="template.id"
                      class="cursor-pointer hover:bg-gray-50 transition" @click="applyTemplate(template)">
                      <div class="py-3">
                        <h3 class="font-bold">{{ template.name }}</h3>
                        <p class="text-sm text-gray-500 whitespace-pre-line">
                          {{ template.preview }}
                        </p>
                      </div>
                    </UCard>
                  </div>
                </template>
              </UModal>

              <!-- TEMPLATE SAYA -->
              <UButton label="Template Saya" color="primary" variant="soft" icon="i-heroicons-rectangle-stack"
                class="px-6 font-medium" />

              <!-- SIMPAN TEMPLATE -->
              <Modal title="Simpan Template" variant="modal2" :descriptions="['Masukan Nama Template']"
                :inputs="[{ placeholder: 'Nama Template' }]" primary-button="Simpan" secondary-button="Batal"
                open="Simpan Template" icon="plus" primary-color="primary" secondary-color="primary"
                open-color="primary" />

            </div>

            <!-- KANAN -->
            <div class="flex flex-wrap items-center gap-3">

              <!-- Dropdown -->
              <UDropdownMenu :items="insertMenuItems">
                <UButton color="neutral" variant="soft" icon="i-lucide-plus" trailing-icon="i-lucide-chevron-down"
                  label="Sisipkan" />
              </UDropdownMenu>
              <!-- FULLSCREEN -->
              <UButton :icon="isFullscreenEditor ? 'i-lucide-minimize' : 'i-lucide-maximize'" color="neutral"
                variant="soft" :label="isFullscreenEditor ? 'Exit Fullscreen' : 'Fullscreen'"
                @click="toggleFullscreenEditor" />

              <!-- PREVIEW -->
              <UButton icon="i-lucide-eye" color="neutral" variant="soft" label="Preview" @click="openPreview" />

            </div>
          </div>

          <!-- EDITOR -->
          <ClientOnly>
            <!-- Main container dengan conditional fullscreen -->
            <div class="flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden transition-all duration-300"
              :class="isFullscreenEditor ? 'fixed inset-0 z-50' : 'h-screen'">

              <!-- HEADER TOOLBAR -->
              <div class="bg-white dark:bg-gray-800 border-b border-gray-200 shadow-sm">
                <div class="py-3" :class="isFullscreenEditor ? 'max-w-full' : 'container mx-auto'">

                  <!-- TOOLBAR LENGKAP -->
                  <div id="toolbar"
                    class="flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 mt-2">
                    <!-- Undo/Redo -->
                    <span class="ql-formats">
                      <button class="ql-undo" title="Undo">
                        <svg viewBox="0 0 18 18">
                          <polygon class="ql-fill" points="6 10 4 12 2 10 6 10"></polygon>
                          <path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path>
                        </svg>
                      </button>
                      <button class="ql-redo" title="Redo">
                        <svg viewBox="0 0 18 18">
                          <polygon class="ql-fill" points="12 10 14 12 16 10 12 10"></polygon>
                          <path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path>
                        </svg>
                      </button>
                    </span>

                    <!-- Format Dropdown -->
                    <span class="ql-formats">
                      <select class="ql-header" title="Format">
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option selected>Normal</option>
                      </select>
                    </span>

                    <!-- Font Style -->
                    <span class="ql-formats">
                      <button class="ql-bold" title="Bold"></button>
                      <button class="ql-italic" title="Italic"></button>
                      <button class="ql-underline" title="Underline"></button>
                      <button class="ql-strike" title="Strikethrough"></button>
                    </span>

                    <!-- Colors -->
                    <span class="ql-formats">
                      <select class="ql-color" title="Text Color"></select>
                      <select class="ql-background" title="Background Color"></select>
                    </span>

                    <!-- Alignment -->
                    <span class="ql-formats">
                      <button class="ql-align" value="" title="Align Left"></button>
                      <button class="ql-align" value="center" title="Align Center"></button>
                      <button class="ql-align" value="right" title="Align Right"></button>
                      <button class="ql-align" value="justify" title="Justify"></button>
                    </span>

                    <!-- Lists -->
                    <span class="ql-formats">
                      <button class="ql-list" value="ordered" title="Numbered List"></button>
                      <button class="ql-list" value="bullet" title="Bullet List"></button>
                    </span>

                    <!-- Indent -->
                    <span class="ql-formats">
                      <button class="ql-indent" value="-1" title="Decrease Indent"></button>
                      <button class="ql-indent" value="+1" title="Increase Indent"></button>
                    </span>

                    <!-- Insert -->
                    <span class="ql-formats">
                      <button class="ql-link" title="Insert Link"></button>
                      <button class="ql-image" title="Insert Image"></button>
                      <!-- <button class="ql-video" title="Insert Video"></button> -->
                    </span>

                    <!-- Clean Format -->
                    <span class="ql-formats">
                      <button class="ql-clean" title="Clear Formatting"></button>
                    </span>
                  </div>
                </div>
              </div>

              <!-- EDITOR CONTENT -->
              <div class="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-900 transition-all duration-300"
                :class="isFullscreenEditor ? 'p-0' : 'p-8'">
                <div class="bg-white shadow-xl relative transition-all duration-300" :class="{
                  'fullscreen-editor': isFullscreenEditor,
                  'editor-container mx-auto max-w-[210mm]': !isFullscreenEditor
                }">
                  <div v-if="!isFullscreenEditor"
                    class="absolute top-0 left-0 right-0 h-[2.5cm] border-b border-gray-100 flex items-center justify-center text-gray-300 select-none pointer-events-none z-10">
                    Header
                  </div>

                  <div ref="editorRef" class="editor-content"></div>

                  <div v-if="!isFullscreenEditor"
                    class="absolute bottom-0 left-0 right-0 h-[2.5cm] border-t border-gray-100 flex items-center justify-center text-gray-300 select-none pointer-events-none z-10">
                    Footer
                  </div>
                </div>
                <p v-if="!isFullscreenEditor" class="text-center text-gray-500 mt-4 text-sm">
                  *Tampilan edit tersambung. Klik <b>Preview</b> untuk melihat pemisahan halaman fisik.
                </p>
              </div>

            </div>

            <!-- PREVIEW MODAL -->
            <UModal v-model:open="showPreview" fullscreen :ui="{
              overlay: 'bg-gray-900/90 backdrop-blur-sm',
              content: 'bg-gray-100 flex flex-col',
              header: 'bg-white border-b border-gray-200 px-6 py-4 shrink-0',
              body: 'flex-1 overflow-hidden p-0'
            }">
              <template #header>
                <div class="flex items-center justify-between w-full">
                  <h3 class="font-bold text-lg">Preview Dokumen</h3>
                  <div class="flex gap-2">
                    <UButton color="neutral" variant="outline" icon="i-lucide-x" label="Tutup"
                      @click="showPreview = false" />
                    <UButton color="primary" icon="i-lucide-printer" label="Print PDF" @click="printContent" />
                  </div>
                </div>
              </template>

              <template #body>
                <div class="h-full overflow-y-auto bg-gray-100 p-8">
                  <div class="flex flex-col items-center gap-8 pb-8">
                    <div v-for="(pageContent, index) in paginatedPages" :key="index"
                      class="real-a4-page bg-white shadow-2xl relative flex flex-col">

                      <!-- Header -->
                      <div class="h-[4cm] px-10 py-4 flex items-center font-['Times_New_Roman']">

                        <!-- KIRI: Logo + Nama -->
                        <div class="flex items-end gap-4">
                          <img src="/logoAirnav.png" alt="Logo AirNav" class="h-24 w-auto object-contain" />
                          <div class="flex flex-col">
                            <span class="text-2xl font-semibold">AirNav Indonesia</span>
                          </div>
                        </div>

                        <!-- KANAN: Alamat -->
                        <div class="ml-auto text-[12px] leading-[1.1] text-gray-700">
                          <div class="font-semibold">Kantor Pusat Perum LPPNPI</div>
                          <div>Gedung AirNav Indonesia</div>
                          <div>Jl. Ir. H. Juanda</div>
                          <div>Tangerang 15121</div>
                          <div>Banten – Indonesia</div>
                          <div>Telp: 021-5591 5000</div>
                          <div>Fax: 021-5591 5100</div>
                          <div>www.airnavindonesia.co.id</div>
                        </div>
                      </div>

                      <!-- Content -->
                      <div class="flex-1 px-10 py-6 overflow-hidden">
                        <div class="prose prose-sm max-w-none ql-editor" v-html="pageContent"></div>
                      </div>

                      <!-- Footer -->
                      <div class="h-[2cm] px-10 flex items-center shrink-0">
                        <!-- <div class="w-full flex justify-between items-center text-xs text-gray-500">
                  <span class="font-medium">Rahasia & Terbatas</span>
                  <span>Halaman {{ index + 1 }} dari {{ paginatedPages.length }}</span>
                </div> -->
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </UModal>
          </ClientOnly>

          <!-- FILE UPLOAD -->
          <div class="flex items-center justify-between py-3">
            <UFileUpload class="w-full" multiple position="inside" layout="list" label="Lampiran File"
              description="PDF, DOCX atau XLSX (max. 10MB)" />
          </div>

          <div class="flex items-center justify-between py-3">
            <UCheckbox v-model="isSecret" label="Rahasia" size="lg" help="Tandai dokumen ini sebagai dokumen rahasia" />
          </div>
        </div>

        <div class="py-4 gap-3 border-t border-gray-100 flex items-center justify-end bg-white">
          <UButton label="Lihat" color="neutral" size="lg" icon="i-heroicons-eye"
            class="w-full sm:w-auto justify-center" />
          <UButton label="Simpan Draft" color="warning" size="lg" icon="i-heroicons-document-text"
            class="w-full sm:w-auto justify-center" />
          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" />
        </div>

      </div>
    </UCard>

  </div>
</template>


<script setup lang="ts">
const isSecret = ref(false)

const senders = [
  { label: 'Berkas - On Time Performance (OTP) / OPS.01.02 On Time Performance (OTP)', value: 'tes1' },
  { label: 'Berkas - Analisis Runway Capacity / OPS.01.03 Analisis Runway Capacity', value: 'tes2' },
  { label: 'Berkas - Pemantauan Delay / OPS.01.04 Pemantauan Delay', value: 'tes3' },
]
const senders_selected = ref('')

const date = ref();

// Computed untuk selected sender
const selectedSender = computed(() =>
  senders.find(s => s.value === senders_selected.value)
)

const breadcrumbs = [
  { label: 'Dashboard', to: '/user/dashboard' },
  { label: 'Tulis Nota Dinas', to: '/admin/korespondensi/tulis/nota-dinas' }
]

const items = ref([
  { type: 'label', label: 'Grup Tertuju' },
  { label: 'Direksi Perum LPPNPI', value: 'direksi', image: 'https://ui-avatars.com/api/?name=Direksi+Perum+LPPNPI&size=128&rounded=true&background=random' },
  { label: 'Para Executive Vice President', value: 'evp', image: 'https://ui-avatars.com/api/?name=Executive+Vice+President&size=128&rounded=true&background=random' },
  { type: 'separator' },
  { type: 'label', label: 'Tertuju' },
  { label: 'PT / PH - (-) Ketua Dewan Pengawas Kantor Pusat', value: 'ketua', image: 'https://ui-avatars.com/api/?name=Ketua+Dewan+Pengawas&size=128&rounded=true&background=random' },
  { label: 'Avirianto Suratno - (U) Direktur Utama Kantor Pusat', value: 'avirianto', image: 'https://ui-avatars.com/api/?name=Avirianto+Suratno&size=128&rounded=true&background=random' },
  { label: 'Azizatun Azhimah - (K) Direktur Keuangan dan Manajemen Risiko Kantor Pusat', value: 'azizah', image: 'https://ui-avatars.com/api/?name=Azizatun+Azhimah&size=128&rounded=true&background=random' },
  { label: 'Setio Anggoro - (O) Direktur Operasi Kantor Pusat', value: 'setio', image: 'https://ui-avatars.com/api/?name=Setio+Anggoro&size=128&rounded=true&background=random' }
]);

const selected = ref([])

function isItemSelected(item: any) {
  return selected.value.some(s => s.value === item.value)
}

function removeItem(item: any, event: Event) {
  event.stopPropagation()
  const index = selected.value.findIndex(i => i.value === item.value)
  if (index > -1) {
    selected.value.splice(index, 1)
  }
}
import { ref, onMounted } from 'vue'
import type Quill from 'quill'


const editorRef = ref<HTMLElement>()
const showPreview = ref(false)
const isFullscreenEditor = ref(false)
const paginatedPages = ref<string[]>([])
let quill: Quill | null = null

// Document configuration
const documentConfig = reactive({
  logo: '',
  logoFallback: 'D',
  title: 'Dokumen Resmi',
  classification: 'Rahasia & Terbatas'
})

// Insert menu items untuk dropdown
const insertMenuItems = computed(() => [
  [{
    label: 'Berkas',
    icon: 'i-lucide-file'
  }],
  [{
    label: 'Tanggal Surat',
    icon: 'i-lucide-calendar'
  }],
  [{
    label: 'Tertuju',
    icon: 'i-lucide-arrow-right'
  }],
  [{
    label: 'Tembusan',
    icon: 'i-lucide-copy'
  }],
  [{
    label: 'Perihal',
    icon: 'i-lucide-message-circle'
  }]

])

// Fungsi insert
function insertTanggal() {
  if (!quill) return

  const range = quill.getSelection()
  if (range) {
    const tanggal = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    quill.insertText(range.index, tanggal)
    quill.setSelection(range.index + tanggal.length, 0)
  }
}

function insertNama() {
  if (!quill) return

  const range = quill.getSelection()
  if (range) {
    const nama = '[Nama User]' // Ganti dengan data user sebenarnya
    quill.insertText(range.index, nama)
    quill.setSelection(range.index + nama.length, 0)
  }
}

function insertNomor() {
  if (!quill) return

  const range = quill.getSelection()
  if (range) {
    const nomor = '[Nomor Surat]' // Ganti dengan nomor surat sebenarnya
    quill.insertText(range.index, nomor)
    quill.setSelection(range.index + nomor.length, 0)
  }
}

// Format date
function formatDate() {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Handle image error
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

onMounted(async () => {
  if (typeof window === 'undefined') return

  const Quill = (await import('quill')).default
  await import('quill/dist/quill.snow.css')

  // Register custom undo/redo handlers
  const icons = Quill.import('ui/icons')
  icons['undo'] = '<svg viewBox="0 0 18 18"><polygon class="ql-fill" points="6 10 4 12 2 10 6 10"></polygon><path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path></svg>'
  icons['redo'] = '<svg viewBox="0 0 18 18"><polygon class="ql-fill" points="12 10 14 12 16 10 12 10"></polygon><path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path></svg>'

  if (editorRef.value) {
    quill = new Quill(editorRef.value, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: '#toolbar',
          handlers: {
            undo: function () {
              // @ts-ignore
              this.quill.history.undo()
            },
            redo: function () {
              // @ts-ignore
              this.quill.history.redo()
            }
          }
        },
        history: {
          delay: 1000,
          maxStack: 100,
          userOnly: true
        }
      },
      placeholder: 'Mulai mengetik dokumen Anda di sini...'
    })
  }
})

// Toggle fullscreen editor mode
function toggleFullscreenEditor() {
  isFullscreenEditor.value = !isFullscreenEditor.value

  // Prevent body scroll when fullscreen
  if (isFullscreenEditor.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// LOGIKA PEMISAH HALAMAN
function openPreview() {
  if (!quill) {
    alert('Editor belum siap. Silakan tunggu sebentar.')
    return
  }

  const fullHtml = quill.root.innerHTML

  // Check if there's content
  if (!fullHtml || fullHtml.trim() === '<p><br></p>' || fullHtml.trim() === '') {
    paginatedPages.value = ['<p class="text-gray-400 text-center">Belum ada konten. Mulai menulis di editor untuk melihat preview.</p>']
    showPreview.value = true
    return
  }

  // 1. Buat elemen sementara di memory (invisible)
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = fullHtml
  tempDiv.className = 'ql-editor'
  tempDiv.style.width = '170mm' // Lebar konten (210mm - 2*2cm padding)
  tempDiv.style.visibility = 'hidden'
  tempDiv.style.position = 'absolute'
  tempDiv.style.top = '-9999px'
  tempDiv.style.fontFamily = '"Times New Roman", serif'
  tempDiv.style.fontSize = '12pt'
  tempDiv.style.lineHeight = '1.5'
  document.body.appendChild(tempDiv)

  // 2. Siapkan variabel
  const pages: string[] = []
  let currentPageHeight = 0
  let currentPageNodes: HTMLElement[] = []

  // Tinggi konten aman per halaman
  const MAX_HEIGHT_PX = 870

  // 3. Loop setiap elemen (p, h1, ul, dll)
  const children = Array.from(tempDiv.children)

  if (children.length === 0) {
    pages.push('<p class="text-gray-400">Tidak ada konten.</p>')
  } else {
    children.forEach((child) => {
      const node = child as HTMLElement
      const nodeHeight = node.offsetHeight

      // Jika elemen ini bikin overflow halaman saat ini
      if (currentPageHeight + nodeHeight > MAX_HEIGHT_PX && currentPageNodes.length > 0) {
        // Simpan halaman lama
        pages.push(currentPageNodes.map(n => n.outerHTML).join(''))

        // Reset untuk halaman baru
        currentPageNodes = [node]
        currentPageHeight = nodeHeight
      } else {
        // Masukkan ke halaman saat ini
        currentPageNodes.push(node)
        currentPageHeight += nodeHeight
      }
    })

    // Push halaman terakhir
    if (currentPageNodes.length > 0) {
      pages.push(currentPageNodes.map(n => n.outerHTML).join(''))
    }
  }

  // Bersihkan memory
  document.body.removeChild(tempDiv)

  // Update state
  paginatedPages.value = pages
  showPreview.value = true
}

function printContent() {
  window.print()
}

function saveContent() {
  if (!quill) {
    alert('Editor belum siap.')
    return
  }

  const content = quill.root.innerHTML
  console.log('Saving content:', content)

  alert('Konten berhasil disimpan!\n\n(Implementasi save ke database belum ditambahkan)')
}

const isTemplateModalOpen = ref(false)
const templates = [
  {
    id: 1,
    name: 'Default',
    preview: `1. Lorem ipsum dolor sit amet...\n2. Lorem ipsum...\n3. Lorem ipsum...`,
    content: `
            <ol>
                <li>Lorem ipsum dolor sit amet...</li>
                <li>Lorem ipsum dolor sit amet...</li>
                <li>Lorem ipsum dolor sit amet...</li>
            </ol>
            `
  },
  {
    id: 2,
    name: 'Numbering With Child',
    content: `
            <ol>
                <li>Lorem ipsum dolor sit amet...
                <ol type="a">
                    <li>Satu</li>
                    <li>Dua</li>
                    <li>Tiga</li>
                </ol>
                </li>
                <li>Lorem ipsum dolor sit amet...
                <ol type="a">
                    <li>Satu</li>
                    <li>Dua</li>
                    <li>Tiga</li>
                </ol>
                </li>
            </ol>
            `,
    get preview() {
      return htmlListToPreview(this.content)
    }
  },

]
const applyTemplate = (template: any) => {
  editor.value?.commands.setContent(template.content)
  isTemplateModalOpen.value = false
}
</script>

<style scoped>
/* UKURAN KERTAS EDIT MODE */
.editor-container {
  width: 210mm;
  min-height: 297mm;
  padding-top: 2.5cm;
  padding-bottom: 2.5cm;
}

/* FULLSCREEN EDITOR MODE */
.fullscreen-editor {
  width: 100% !important;
  min-height: 100vh !important;
  max-width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.fullscreen-editor .ql-editor {
  min-height: calc(100vh - 140px) !important;
  padding: 3rem 6rem !important;
  max-width: 1400px !important;
  margin: 0 auto !important;
}

/* CSS EDITOR OVERRIDE */
.ql-editor {
  min-height: 200mm;
  padding: 0 2.5cm;
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #1a1a1a;
}

.ql-editor p {
  margin-bottom: 0.5em;
}

.ql-editor h1 {
  font-size: 2em;
  font-weight: bold;
  margin-top: 0.67em;
  margin-bottom: 0.67em;
}

.ql-editor h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0.83em;
  margin-bottom: 0.83em;
}

.ql-editor h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 1em;
}

/* HILANGKAN BORDER BAWAAN QUILL */
.ql-container.ql-snow {
  border: none !important;
}

.ql-toolbar.ql-snow {
  border: none !important;
  padding: 0;
  background: transparent;
}

/* Toolbar button styling */
.ql-toolbar button {
  width: 32px !important;
  height: 32px !important;
  padding: 4px !important;
  border-radius: 4px !important;
}

.ql-toolbar button:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.ql-toolbar button.ql-active {
  background-color: rgba(59, 130, 246, 0.1) !important;
  color: rgb(59, 130, 246) !important;
}

.ql-toolbar .ql-stroke {
  stroke: #444;
}

.ql-toolbar .ql-fill {
  fill: #444;
}

.ql-toolbar button:hover .ql-stroke {
  stroke: #06c;
}

.ql-toolbar button:hover .ql-fill {
  fill: #06c;
}

.ql-toolbar button.ql-active .ql-stroke {
  stroke: rgb(59, 130, 246);
}

.ql-toolbar button.ql-active .ql-fill {
  fill: rgb(59, 130, 246);
}

/* Dropdown styling */
.ql-toolbar select {
  height: 32px !important;
  border-radius: 4px !important;
  border: 1px solid #e5e7eb !important;
  padding: 0 8px !important;
}

/* UKURAN KERTAS PREVIEW MODE (REAL) */
.real-a4-page {
  width: 210mm;
  height: 297mm;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* Prose styling untuk preview */
.prose {
  color: #1a1a1a;
}

.prose p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.prose h1,
.prose h2,
.prose h3 {
  color: #1a1a1a;
  font-weight: 600;
}

/* PRINT STYLING */
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  body * {
    visibility: hidden;
  }

  .real-a4-page,
  .real-a4-page * {
    visibility: visible;
  }

  .real-a4-page {
    position: relative;
    margin: 0;
    page-break-after: always;
    box-shadow: none !important;
    width: 210mm;
    height: 297mm;
  }

  .real-a4-page:last-child {
    page-break-after: auto;
  }

  .real-a4-page .prose {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}

/* Dark mode support */
.dark #toolbar {
  background-color: rgb(55 65 81) !important;
  border-color: rgb(75 85 99) !important;
}

.dark .ql-toolbar button {
  color: rgb(229 231 235);
}

.dark .ql-toolbar button:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .ql-toolbar .ql-stroke {
  stroke: rgb(229 231 235);
}

.dark .ql-toolbar .ql-fill {
  fill: rgb(229 231 235);
}

.dark .ql-toolbar select {
  background-color: rgb(55 65 81);
  color: rgb(229 231 235);
  border-color: rgb(75 85 99) !important;
}

.dark .ql-editor {
  color: rgb(229 231 235);
  background-color: rgb(31 41 55);
}
</style>
