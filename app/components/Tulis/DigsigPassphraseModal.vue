<template>
  <UModal v-model:open="isOpen" :dismissible="false"
    :ui="{ overlay: 'bg-black/50 backdrop-blur-sm', content: 'max-w-lg' }">

    <template #header>
      <div v-if="showLupaPassphrase" class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Lupa Passphrase BSrE</h3>
        </div>
        <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm"
          @click="showLupaPassphrase = false" />
      </div>
      <div v-else class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pilih Metode Tanda Tangan</h3>
        <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm" @click="handleCancel" />
      </div>
    </template>

    <template #body>

      <!-- ── Lupa Passphrase Body ──────────────────────────────────────── -->
      <div v-if="showLupaPassphrase">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Untuk mereset Passphrase BSrE Anda, Silakan hubungi tim support kami:
        </p>
        <div class="space-y-3">
          <div class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-phone" class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">IT Helpdesk</div>
              <div class="text-sm font-semibold text-gray-900 dark:text-white">021 29102-191</div>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div
              class="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Email</div>
              <div class="text-sm font-semibold text-gray-900 dark:text-white">helpdesk@airnav.co.id</div>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">BSrE Portal</div>
              <div class="text-sm font-semibold text-gray-900 dark:text-white">bsre.bssn.go.id</div>
            </div>
          </div>
          <div
            class="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p class="text-xs text-yellow-700 dark:text-yellow-300">
              Anda dapat menggunakan opsi kirim tanda tangan lain saat terjadi kendala BSrE.
            </p>
          </div>
        </div>
      </div>

      <!-- ── Main Body ─────────────────────────────────────────────────── -->
      <div v-else class="space-y-3">

        <!-- ── Option 1: BSrE ──────────────────────────────────────────── -->
        <div v-if="!hideBsre" class="rounded-xl border-2 transition-all duration-200 overflow-hidden" :class="bsreDisabled
          ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
          : selectedMethod === 'digsig'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'"
          @click="!bsreDisabled && selectMethod('digsig')">

          <div class="flex items-start gap-3 p-4">
            <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0" :class="!bsreDisabled && selectedMethod === 'digsig'
              ? 'border-primary-500'
              : 'border-gray-300'">
              <div v-if="!bsreDisabled && selectedMethod === 'digsig'" class="w-2 h-2 rounded-full bg-primary-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm text-gray-900 dark:text-white">
                Kirim dengan Tanda Tangan Digital (BSrE)
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Dokumen ditandatangani secara elektronik resmi (TTE)
              </div>
            </div>
          </div>

          <div v-if="!bsreDisabled && selectedMethod === 'digsig'" class="mx-4 mb-4">
            <div
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div class="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700">
                <img src="/logoAirnav.png" alt="Logo" class="h-8 w-auto object-contain"
                  onerror="this.style.display='none'" />
                <div>
                  <div class="text-[10px] text-gray-400 leading-tight">{{ signerInfo.label }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ signerInfo.role }}</div>
                  <div class="text-sm font-bold text-gray-900 dark:text-white">{{ signerInfo.name }}</div>
                </div>
              </div>
              <div class="p-3">
                <div class="relative">
                  <input :type="showPassword ? 'text' : 'password'" v-model="localPassphrase"
                    placeholder="Masukkan Passphrase TTE Anda"
                    class="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white pr-10 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    :class="passphraseError
                      ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600'" @keydown.enter="handleSubmit"
                    @input="passphraseError = ''" />
                  <button type="button"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    @click.stop="showPassword = !showPassword">
                    <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4 h-4" />
                  </button>
                </div>
                <div v-if="passphraseError" class="flex items-center gap-1 mt-1.5">
                  <UIcon name="i-heroicons-x-circle" class="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p class="text-xs text-red-500">{{ passphraseError }}</p>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <button type="button" class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    @click.stop="showLupaPassphrase = true">
                    Lupa Passphrase?
                  </button>
                  <button v-if="passphraseError" type="button"
                    class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    @click.stop="showAllOptions = true">
                    Kirim dengan opsi lain
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Option 2: QR ────────────────────────────────────────────── -->
        <div v-if="!hideQr || showAllOptions"
          class="rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden" :class="selectedMethod === 'qr_only'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
          @click="selectMethod('qr_only')">
          <div class="flex items-start gap-3 p-4">
            <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
              :class="selectedMethod === 'qr_only' ? 'border-primary-500' : 'border-gray-300'">
              <div v-if="selectedMethod === 'qr_only'" class="w-2 h-2 rounded-full bg-primary-500" />
            </div>
            <div class="flex-1">
              <div class="font-semibold text-sm text-gray-900 dark:text-white">
                Kirim dengan Tanda Tangan QR
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Dokumen ditandatangani secara tanda tangan digital internal (QR)
              </div>
            </div>
          </div>
          <div v-if="selectedMethod === 'qr_only'" class="mx-4 mb-4 flex justify-center">
            <div
              class="w-28 h-28 border-2 border border-primary-300 dark:border-primary-700 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800">
              <div class="flex flex-col items-center gap-1">
                <UIcon name="i-heroicons-qr-code" class="w-10 h-10 text-primary-300 dark:text-primary-600" />
                <span class="text-[9px] text-gray-400 uppercase tracking-widest">Preview</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Option 3: Tanda Tangan Basah ───────────────────────────── -->
        <div v-if="!hideBasah || showAllOptions"
          class="rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden" :class="selectedMethod === 'ttd_basah'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
          @click="selectMethod('ttd_basah')">
          <div class="flex items-start gap-3 p-4">
            <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
              :class="selectedMethod === 'ttd_basah' ? 'border-primary-500' : 'border-gray-300'">
              <div v-if="selectedMethod === 'ttd_basah'" class="w-2 h-2 rounded-full bg-primary-500" />
            </div>
            <div class="flex-1">
              <div class="font-semibold text-sm text-gray-900 dark:text-white">
                Tanda Tangan Basah
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Cetak dokumen, tanda tangani secara fisik, lalu scan & unggah kembali
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <div v-if="showLupaPassphrase" class="flex w-full justify-end">
        <UButton label="Mengerti" color="primary" size="lg" @click="showLupaPassphrase = false" />
      </div>
      <div v-else class="flex w-full justify-end">
        <UButton label="Kirim" color="primary" size="lg" class="px-10" :loading="isLoading" @click="handleSubmit" />
      </div>
    </template>

  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface SignerInfo {
  name: string
  role: string
  label: string
}

const props = defineProps<{
  open: boolean
  signerInfo: SignerInfo
  isLoading: boolean
  bsreDisabled?: boolean
  hideBsre?: boolean
  hideQr?: boolean
  hideBasah?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [payload: { method: string; passphrase?: string }]
  'cancel': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const showAllOptions = ref(false)
const selectedMethod = ref<'digsig' | 'qr_only' | 'ttd_basah'>('digsig')
const localPassphrase = ref('')
const passphraseError = ref('')
const showPassword = ref(false)
const showLupaPassphrase = ref(false)

watch(() => props.open, (val) => {
  if (val) {
    localPassphrase.value = ''
    passphraseError.value = ''
    showPassword.value = false
    showLupaPassphrase.value = false
    showAllOptions.value = false

    if (!props.hideBsre) selectedMethod.value = 'digsig'
    else if (!props.hideQr) selectedMethod.value = 'qr_only'
    else if (!props.hideBasah) selectedMethod.value = 'ttd_basah'
  }
})

const selectMethod = (method: 'digsig' | 'qr_only' | 'ttd_basah') => {
  selectedMethod.value = method
  passphraseError.value = ''
}

const handleCancel = () => {
  emit('update:open', false)
  emit('cancel')
}

const handleSubmit = async () => {
  if (selectedMethod.value === 'digsig') {
    if (!localPassphrase.value) {
      passphraseError.value = 'Harap masukkan passphrase Anda'
      return
    }
    emit('submit', { method: 'digsig', passphrase: localPassphrase.value })
  } else if (selectedMethod.value === 'qr_only') {
    emit('submit', { method: 'qr_only' })
  } else if (selectedMethod.value === 'ttd_basah') {
    // Langsung emit tanpa validasi file — dokumen masuk tertunda, upload dilakukan di halaman tertunda
    emit('submit', { method: 'ttd_basah' })
  }
}

defineExpose({
  setPassphraseError: (msg: string) => {
    passphraseError.value = msg
    localPassphrase.value = ''
  }
})
</script>
