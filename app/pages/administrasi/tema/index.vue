<template>
  <div class="min-h-screen bg-gray-50 pt-5 dark:bg-gray-900">
    <AccessDenied v-if="!isSuperadmin" :show-permission-key="false" />

    <div v-else class="mx-auto max-w-7xl">
      <div class="mb-8">
        <Heading variant="heading6b" class="text-mobile-md">Tema</Heading>
        <PageHeader :items="breadcrumbs" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Atur gambar latar kartu sambutan di Beranda. Jika belum diatur,
          aplikasi tetap menggunakan tampilan bawaan saat ini.
        </p>
      </div>

      <div v-if="isThemeLoading && !initialized" class="grid max-w-3xl gap-6">
        <USkeleton class="h-[430px] rounded-2xl" />
      </div>

      <div v-else class="grid max-w-3xl gap-6">
        <section
          v-for="item in themeItems"
          :key="item.target"
          class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="border-b border-gray-100 p-5 dark:border-gray-700">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">{{ item.title }}</h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ item.description }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                :class="currentUrl(item.target)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
              >
                {{ currentUrl(item.target) ? 'Kustom' : 'Default' }}
              </span>
            </div>
          </div>

          <div class="p-5">
            <div
              class="relative mb-5 aspect-[16/7] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <img
                v-if="previewUrl(item.target)"
                :src="previewUrl(item.target)!"
                class="h-full w-full object-cover"
                :alt="`Pratinjau ${item.title}`"
              />

              <template v-else>
                <div class="absolute inset-0 bg-gradient-to-br from-primary-100 from-45% to-primary"></div>
                <div class="absolute inset-y-0 left-0 z-10 flex flex-col justify-center px-6">
                  <strong class="text-lg text-primary-600">Halo, Pengguna</strong>
                  <span class="text-sm text-primary-400">Semoga hari Anda menyenangkan</span>
                </div>
                <img
                  src="/dashboard_light.png"
                  alt="Tema Beranda bawaan"
                  class="absolute -bottom-4 -right-3 h-[110%] object-contain"
                />
              </template>

              <div
                v-if="pendingFiles[item.target]"
                class="absolute bottom-3 left-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow"
              >
                Belum disimpan
              </div>
            </div>

            <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG, atau WEBP · maksimal 10 MB · rekomendasi rasio 16:9.
            </p>

            <div v-if="templatesFor(item.target).length" class="mb-5 space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Template tersimpan
              </p>
              <div class="grid gap-2 sm:grid-cols-2">
                <button
                  v-for="template in templatesFor(item.target)"
                  :key="template.id"
                  type="button"
                  class="flex items-center gap-3 rounded-xl border p-2 text-left transition"
                  :class="activeTemplateId(item.target) === template.id
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-950/30'
                    : 'border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700'"
                  @click="activateTemplate(template.id)"
                >
                  <img
                    :src="template.url"
                    :alt="template.name"
                    class="h-12 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {{ template.name }}
                    </span>
                    <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {{ activeTemplateId(item.target) === template.id ? 'Aktif' : (template.isSystem ? 'Template bawaan' : 'Nonaktif') }}
                    </span>
                  </span>
                  <UIcon
                    v-if="activeTemplateId(item.target) === template.id"
                    name="i-lucide-circle-check"
                    class="size-5 shrink-0 text-primary-600"
                  />
                </button>
              </div>
            </div>

            <input
              :ref="(element) => setFileInput(item.target, element)"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="(event) => selectFile(item.target, event)"
            />

            <div class="flex flex-wrap gap-2">
              <UButton
                icon="i-lucide-image-up"
                color="primary"
                variant="soft"
                @click="openFilePicker(item.target)"
              >
                Pilih gambar
              </UButton>
              <UButton
                v-if="pendingFiles[item.target]"
                icon="i-lucide-save"
                color="primary"
                :loading="savingTarget === item.target"
                :disabled="savingTarget !== null"
                @click="saveBackground(item.target)"
              >
                Simpan
              </UButton>
              <UButton
                v-if="currentUrl(item.target)"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="outline"
                :loading="resettingTarget === item.target"
                :disabled="resettingTarget !== null || savingTarget !== null"
                @click="restoreDefault(item.target)"
              >
                Kembalikan default
              </UButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { ThemeBackgroundTarget } from '~/composables/useTheme'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { isSuperadmin } = useAuth()
const {
  themeConfig,
  themeAdminConfig,
  isThemeLoading,
  fetchAdminThemeConfig,
  uploadThemeBackground,
  resetThemeBackground,
  activateThemeTemplate
} = useTheme()

const initialized = ref(false)
const savingTarget = ref<ThemeBackgroundTarget | null>(null)
const resettingTarget = ref<ThemeBackgroundTarget | null>(null)
const pendingFiles = reactive<Partial<Record<ThemeBackgroundTarget, File | null>>>({
  dashboard: null
})
const localPreviews = reactive<Partial<Record<ThemeBackgroundTarget, string | null>>>({
  dashboard: null
})
const fileInputs: Partial<Record<ThemeBackgroundTarget, HTMLInputElement>> = {}

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Administrasi' },
  { label: 'Tema' }
]

const themeItems: Array<{
  target: ThemeBackgroundTarget
  title: string
  description: string
}> = [{
  target: 'dashboard',
  title: 'Beranda',
  description: 'Pilih gambar dari seluruh template yang tersedia di folder MinIO tema/.'
}]

const currentUrl = (_target: ThemeBackgroundTarget) => themeConfig.value.dashboardBackgroundUrl

const previewUrl = (target: ThemeBackgroundTarget) =>
  localPreviews[target] || currentUrl(target)

const templatesFor = (target: ThemeBackgroundTarget) =>
  themeAdminConfig.value?.templates.filter((template) => template.target === target) || []

const activeTemplateId = (target: ThemeBackgroundTarget) =>
  themeAdminConfig.value?.activeTemplateIds[target] || null

const activateTemplate = async (templateId: string) => {
  try {
    await activateThemeTemplate(templateId)
    toast.add({
      title: 'Template diaktifkan',
      description: 'Tampilan halaman berhasil diperbarui.',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Gagal mengaktifkan template',
      description: error?.response?.data?.message || 'Silakan coba kembali.',
      color: 'error'
    })
  }
}

const setFileInput = (
  target: ThemeBackgroundTarget,
  element: Element | ComponentPublicInstance | null
) => {
  if (element instanceof HTMLInputElement) fileInputs[target] = element
}

const openFilePicker = (target: ThemeBackgroundTarget) => fileInputs[target]?.click()

const clearLocalPreview = (target: ThemeBackgroundTarget) => {
  if (localPreviews[target]) URL.revokeObjectURL(localPreviews[target]!)
  localPreviews[target] = null
}

const selectFile = (target: ThemeBackgroundTarget, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.add({
      title: 'Format tidak didukung',
      description: 'Gunakan gambar JPG, PNG, atau WEBP.',
      color: 'warning'
    })
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({
      title: 'Ukuran terlalu besar',
      description: 'Ukuran gambar maksimal 10 MB.',
      color: 'warning'
    })
    input.value = ''
    return
  }

  clearLocalPreview(target)
  pendingFiles[target] = file
  localPreviews[target] = URL.createObjectURL(file)
}

const saveBackground = async (target: ThemeBackgroundTarget) => {
  const file = pendingFiles[target]
  if (!file) return
  savingTarget.value = target
  try {
    await uploadThemeBackground(target, file)
    pendingFiles[target] = null
    clearLocalPreview(target)
    if (fileInputs[target]) fileInputs[target]!.value = ''
    toast.add({
      title: 'Tema berhasil disimpan',
      description: 'Latar Beranda sudah diperbarui.',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Gagal menyimpan tema',
      description: error?.response?.data?.message || 'Silakan coba kembali.',
      color: 'error'
    })
  } finally {
    savingTarget.value = null
  }
}

const restoreDefault = async (target: ThemeBackgroundTarget) => {
  resettingTarget.value = target
  try {
    await resetThemeBackground(target)
    pendingFiles[target] = null
    clearLocalPreview(target)
    if (fileInputs[target]) fileInputs[target]!.value = ''
    toast.add({
      title: 'Tampilan default dipulihkan',
      description: 'Halaman kembali menggunakan desain bawaan aplikasi.',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Gagal memulihkan tema',
      description: error?.response?.data?.message || 'Silakan coba kembali.',
      color: 'error'
    })
  } finally {
    resettingTarget.value = null
  }
}

onMounted(async () => {
  if (!isSuperadmin.value) return
  try {
    await fetchAdminThemeConfig()
  } catch {
    toast.add({
      title: 'Gagal memuat tema',
      description: 'Konfigurasi tema belum dapat dimuat.',
      color: 'error'
    })
  } finally {
    initialized.value = true
  }
})

onBeforeUnmount(() => {
  clearLocalPreview('dashboard')
})
</script>
