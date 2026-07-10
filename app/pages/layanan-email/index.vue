<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="pt-5 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-4">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          Layanan Email
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- MAIN CARD -->
    <div class="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- HEADER -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <div class="px-5 py-3 text-sm font-medium text-primary border-b-2 border-primary dark:text-primary-400">
          Kirim Email
        </div>
      </div>

      <!-- FORM -->
      <div class="p-6 flex flex-col gap-4">
        <!-- Subjek -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
            Subjek <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.subjek"
            type="text"
            placeholder="Masukkan subjek email"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- From As -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
            From As <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.from_as"
            type="text"
            placeholder="Contoh: SWORD, ASIAP"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- To -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
            To <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.to"
            type="text"
            placeholder="email@example.com (pisahkan dengan koma untuk multiple)"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
          />

          <!-- Select dari kontak eksternal -->
          <div class="mt-1">
            <USelectMenu
              v-model="selectedEksternalTo"
              :items="eksternalOptions"
              multiple
              placeholder="Pilih dari Kontak Eksternal..."
              :loading="eksternalLoading"
              class="w-full"
              :ui="{ base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full' }"
              @update:model-value="onEksternalSelect('to', $event)"
            >
              <template #item="{ item }">
                <div class="flex flex-col py-0.5">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ item.label }}</span>
                  <span class="text-xs text-gray-400">{{ item.email }}</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- CC & BCC -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">CC</label>
            <input
              v-model="form.cc"
              type="text"
              placeholder="cc@example.com"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">BCC</label>
            <input
              v-model="form.bcc"
              type="text"
              placeholder="bcc@example.com"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <!-- Konten -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
            Konten <span class="text-red-500">*</span>
          </label>
          <TinymceEditorAsync
            api-key="no-api-key"
            v-model="form.konten"
            :init="tinyMceInit"
          />
        </div>

        <!-- Lampiran -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Lampiran</label>
          </div>

          <FileUpload
            v-model="selectedFiles"
            accept="application/pdf,image/*"
            :multiple="true"
            description="Klik atau drag & drop untuk upload file (Maks 10MB)"
          />

          <!-- List file yang dipilih -->
          <div v-if="selectedFiles.length > 0" class="mt-2 space-y-2">
            <div
              v-for="(file, idx) in selectedFiles"
              :key="idx"
              class="flex items-center justify-between p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <div class="flex items-center gap-2 overflow-hidden flex-1">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
                <div class="flex flex-col min-w-0">
                  <span class="text-sm text-gray-700 dark:text-gray-200 truncate font-medium">
                    {{ file.name }}
                  </span>
                  <span class="text-xs text-gray-400">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
              <button
                @click="removeFile(idx)"
                class="text-red-500 hover:text-red-700 shrink-0 ml-2"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-3 pt-2">
          <button
            v-if="hasPermission('layanan-email', 'create')"
            @click="handleSubmit"
            :disabled="loading"
            class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Send v-else class="w-4 h-4" />
            {{ submitLabel }}
          </button>

          <button
            @click="resetForm"
            class="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition"
          >
            Reset
          </button>
        </div>

        <!-- Response -->
        <div v-if="response" class="mt-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Response:</p>
          <pre class="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(response, null, 2) }}</pre>
        </div>

        <div v-if="errorMsg" class="mt-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400">{{ errorMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { canAccessPage } = useFeatureAccess();
const { hasPermission } = useAuth();
import { X, Send, Loader2, FileText } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue'
import type { Editor as TinyMCEEditor } from 'tinymce'
import { useMailService, type SendMailPayload, type MailLampiran } from '~/composables/useMailService'
import { Alert } from '~/composables/useAlert'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const { sendMailBase64 } = useMailService()
const { apiGet } = useApi()

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Layanan Email', to: '/layanan-email' },
]

const activeTab = ref<'send'>('send')
const loading = ref(false)
const response = ref<any>(null)
const errorMsg = ref('')
const selectedFiles = ref<File[]>([])

// Kontak eksternal untuk dropdown
const eksternalRecipients = ref<any[]>([])
const eksternalLoading = ref(false)
const selectedEksternalTo = ref<any[]>([])

const eksternalOptions = computed(() =>
  eksternalRecipients.value.map((e: any) => ({
    label: e.nama,
    value: e.id,
    email: e.email,
  }))
)

const fetchEksternal = async () => {
  eksternalLoading.value = true
  try {
    const res = await apiGet('/persuratan/eksternal')
    eksternalRecipients.value = (res?.data || []).filter((e: any) => e.email)
  } catch {
    eksternalRecipients.value = []
  } finally {
    eksternalLoading.value = false
  }
}

const onEksternalSelect = (field: 'to' | 'cc' | 'bcc', selected: any[]) => {
  const emails = selected.map((s: any) => s.email).filter(Boolean)
  form.value[field] = emails.join(', ')
}

const addEksternalToField = (email: string, field: 'to' | 'cc' | 'bcc') => {
  const current = (form.value[field] || '').trim()
  if (!current) {
    form.value[field] = email
  } else if (!current.split(',').map(s => s.trim()).includes(email)) {
    form.value[field] = `${current}, ${email}`
  }
}

onMounted(() => {
  fetchEksternal()
})

const form = ref<SendMailPayload>({
  subjek: '',
  from_as: '',
  to: '',
  konten: '',
  cc: '',
  bcc: '',
  lampiran: [],
})

// --- TinyMCE Config ---
const tinymceEditor = ref<TinyMCEEditor | null>(null)
const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 300,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Isi pesan email...',
  plugins: 'lists advlist link image code table fullscreen',
  toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
  content_style: `body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }`,
  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor
    editor.on('change keyup input', () => {
      form.value.konten = editor.getContent()
    })
  },
}

const submitLabel = computed(() => 'Kirim Email')

const removeFile = (idx: number) => {
  selectedFiles.value.splice(idx, 1)
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const filesToBase64 = async (): Promise<MailLampiran[]> => {
  const result: MailLampiran[] = []
  for (const file of selectedFiles.value) {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    result.push({
      filename: file.name,
      filebase64: base64,
    })
  }
  return result
}

const validate = (): boolean => {
  if (!form.value.subjek) { errorMsg.value = 'Subjek wajib diisi'; return false }
  if (!form.value.from_as) { errorMsg.value = 'From As wajib diisi'; return false }
  if (!form.value.to) { errorMsg.value = 'To wajib diisi'; return false }
  if (!form.value.konten) { errorMsg.value = 'Konten wajib diisi'; return false }
  errorMsg.value = ''
  return true
}

const handleSubmit = async () => {
  response.value = null
  errorMsg.value = ''

  if (!validate()) return

  loading.value = true
  try {
    // Convert selected files to base64 lampiran
    const lampiran = await filesToBase64()
    const payload = { ...form.value, lampiran }

    const result = await sendMailBase64(payload)
    response.value = result
    Alert.warning('Berhasil', 'Email berhasil dikirim')
    setTimeout(() => {
      navigateTo('/layanan-email/log')
    }, 1500)
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || 'Terjadi kesalahan'
    Alert.error('Gagal', errorMsg.value)
  } finally {
    loading.value = false
  }
}

const resetForm = async () => {
  // Cek apakah form ada isinya
  const hasContent =
    form.value.subjek ||
    form.value.from_as ||
    form.value.to ||
    form.value.konten ||
    form.value.cc ||
    form.value.bcc ||
    selectedFiles.value.length > 0 ||
    selectedEksternalTo.value.length > 0

  if (hasContent) {
    const confirmed = await Alert.confirm(
      'Reset Form?',
      'Semua data yang telah diisi akan dihapus. Lanjutkan?',
      'Ya, Reset',
      'Batal',
      false,
    )
    Alert.close()
    if (!confirmed) return
  }

  form.value = {
    subjek: '',
    from_as: '',
    to: '',
    konten: '',
    cc: '',
    bcc: '',
    lampiran: [],
  }
  selectedFiles.value = []
  selectedEksternalTo.value = []
  response.value = null
  errorMsg.value = ''
  tinymceEditor.value?.setContent('')
}
</script>
