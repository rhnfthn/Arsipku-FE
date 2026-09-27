<template>
  <div class="p-6">
    <Heading variant="heading9sb" class="text-mobile-md">Reset Database Development</Heading>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
      Bersihkan data transaksi sesuai runbook pembersihan database. Data master, RBAC, konfigurasi, dan histori
      migration tetap dipertahankan.
    </p>

    <!-- Peringatan -->
    <div class="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
      <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div class="text-sm text-red-700 dark:text-red-300 leading-relaxed">
        <span class="font-semibold block mb-1">Tindakan berbahaya</span>
        <p>
          Reset menghapus data transaksi secara permanen. Pastikan backup sudah dibuat sebelum eksekusi.
          Tersedia hanya di environment development.
        </p>
      </div>
    </div>

    <!-- Pilihan level -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <button
        v-for="opt in levelOptions"
        :key="opt.value"
        type="button"
        @click="selectedLevel = opt.value"
        :class="[
          'text-left p-4 rounded-xl border transition-all',
          selectedLevel === opt.value
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
        ]"
      >
        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ opt.label }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ opt.desc }}</p>
      </button>
    </div>

    <!-- Statistik tabel target -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-database" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Tabel Target — Level {{ selectedLevel.replace('level', '') }}
          </h3>
        </div>
        <button
          type="button"
          @click="loadStats"
          :disabled="statsLoading"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <UIcon :name="statsLoading ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'" class="w-3.5 h-3.5" :class="{ 'animate-spin': statsLoading }" />
          Muat Ulang
        </button>
      </div>

      <div v-if="statsLoading" class="p-5 space-y-2">
        <USkeleton v-for="i in 4" :key="i" class="h-5 w-full rounded" />
      </div>

      <div v-else-if="stats" class="p-5">
        <div v-for="db in stats.databases" :key="db.name" class="mb-4 last:mb-0">
          <p class="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 mb-2">{{ db.name }}</p>
          <div class="max-h-[280px] overflow-y-auto space-y-1">
            <div
              v-for="t in db.tables"
              :key="t.table"
              class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm"
            >
              <span class="font-mono text-xs text-gray-700 dark:text-gray-200">{{ t.table }}</span>
              <span class="text-xs font-semibold" :class="t.rows > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'">
                {{ t.rows.toLocaleString('id-ID') }} baris
              </span>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total baris yang akan dihapus</span>
          <span class="text-sm font-bold text-red-600 dark:text-red-400">{{ stats.totalRows.toLocaleString('id-ID') }}</span>
        </div>
      </div>

      <div v-else class="p-5 text-sm text-gray-400 italic">
        Klik "Muat Ulang" untuk melihat daftar tabel target dan jumlah barisnya.
      </div>
    </div>

    <!-- Tombol eksekusi -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Eksekusi menghapus data sesuai level terpilih dalam satu transaction (bisa di-rollback otomatis jika gagal).
      </p>
      <button
        type="button"
        @click="showConfirm = true"
        :disabled="resetLoading"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <UIcon :name="resetLoading ? 'i-lucide-loader-2' : 'i-lucide-trash-2'" class="w-4 h-4" :class="{ 'animate-spin': resetLoading }" />
        Reset Database
      </button>
    </div>

    <!-- Hasil eksekusi -->
    <div
      v-if="result"
      class="mt-5 p-4 rounded-xl border"
      :class="result.success
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'"
    >
      <div class="flex items-start gap-3">
        <UIcon
          :name="result.success ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
          class="w-5 h-5 shrink-0 mt-0.5"
          :class="result.success ? 'text-emerald-500' : 'text-red-500'"
        />
        <div class="text-sm">
          <p class="font-semibold" :class="result.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'">
            {{ result.success ? 'Reset berhasil' : 'Reset gagal' }}
          </p>
          <p class="mt-1 text-gray-600 dark:text-gray-300">{{ result.message }}</p>
        </div>
      </div>
    </div>

    <!-- Modal konfirmasi -->
    <Teleport to="body">
      <div v-if="showConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" style="backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);" @click="showConfirm = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Reset Database</h3>
            <button @click="showConfirm = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Anda akan menghapus <span class="font-semibold text-red-600 dark:text-red-400">seluruh data transaksi</span> level
              {{ selectedLevel.replace('level', '') }} dari database development.
            </p>
            <div class="space-y-2 mb-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Level</span>
                <p class="text-gray-900 dark:text-white font-medium">Level {{ selectedLevel.replace('level', '') }}</p>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Total baris</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ stats?.totalRows?.toLocaleString('id-ID') ?? '-' }}</p>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tabel</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ stats?.databases?.reduce((a: number, d: any) => a + d.tables.length, 0) ?? '-' }}</p>
              </div>
            </div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Ketik <span class="font-mono font-semibold">RESET</span> untuk konfirmasi
            </label>
            <input
              v-model="confirmText"
              type="text"
              placeholder="RESET"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showConfirm = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
            <button
              type="button"
              @click="executeReset"
              :disabled="confirmText !== 'RESET' || resetLoading"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UIcon v-if="resetLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Ya, Reset Sekarang
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import Heading from '~/components/Heading.vue'

const { apiGet, apiPost } = useApi()

const selectedLevel = ref<'level1' | 'level2' | 'level3'>('level2')
const statsLoading = ref(false)
const stats = ref<any>(null)
const resetLoading = ref(false)
const showConfirm = ref(false)
const confirmText = ref('')
const result = ref<{ success: boolean; message: string } | null>(null)

const levelOptions = [
  { value: 'level1' as const, label: 'Level 1 — Runtime Only', desc: 'Session, token, notifikasi, log teknis' },
  { value: 'level2' as const, label: 'Level 2 — Transactional', desc: 'Level 1 + persuratan, tugas, arsip, workflow (direkomendasikan)' },
  { value: 'level3' as const, label: 'Level 3 — User Preference', desc: 'Level 2 + label, grup penerima, preferensi pengguna' },
]

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res: any = await apiGet(`/admin/config/db-reset/stats/${selectedLevel.value}`, {}, { skipCache: true })
    stats.value = res?.data ?? res
  } catch (e: any) {
    stats.value = null
    result.value = { success: false, message: e?.data?.message || e?.message || 'Gagal memuat statistik.' }
  } finally {
    statsLoading.value = false
  }
}

const executeReset = async () => {
  resetLoading.value = true
  try {
    const res: any = await apiPost(`/admin/config/db-reset/execute/${selectedLevel.value}`, {})
    const total = res?.data?.totalDeleted ?? res?.totalDeleted ?? 0
    result.value = {
      success: true,
      message: `${total.toLocaleString('id-ID')} baris berhasil dihapus dari database development.`,
    }
    showConfirm.value = false
    confirmText.value = ''
    await loadStats()
  } catch (e: any) {
    result.value = { success: false, message: e?.data?.message || e?.message || 'Reset gagal, transaksi di-rollback.' }
    showConfirm.value = false
  } finally {
    resetLoading.value = false
  }
}

watch(selectedLevel, () => {
  stats.value = null
  result.value = null
  loadStats()
}, { immediate: true })
</script>