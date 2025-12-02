<template>
  <div class="space-y-6">
    <div class="flex flex-row sm:items-center justify-between gap-6">
      <PageHeader title="Dashboard" />
      <div class="flex gap-3">
        <!-- <UDropdownMenu :items="items" :content="{ align: 'end' }">
          <UButton trailing-icon="i-lucide-chevron-down" label="Tulis" color="primary" size="lg" class="gap-5" />
        </UDropdownMenu> -->
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="(stat, idx) in stats" :key="idx" :ui="cardUI">
        <div class="flex items-center gap-4">
          <div :class="`w-12 h-12 flex items-center justify-center rounded-lg shadow-sm text-white ${stat.bgSolid}`">
            <UIcon :name="stat.icon" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ stat.label }}</p>
            <div class="flex items-end gap-2">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-1">{{ stat.value
                }}</h3>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div class="col-span-3">
        <UCard :ui="cardUI" class="h-full !border-0 !shadow-none">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 dark:text-white">Surat Masuk Terbaru</h3>
              <UButton to="/inbox" size="xs" color="gray" variant="ghost" trailing-icon="i-heroicons-arrow-right">
                Lihat Semua
              </UButton>
            </div>
          </template>

          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="mail in recentMails" :key="mail.id"
              class="py-3 first:pt-0 last:pb-0 flex items-center gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors cursor-pointer">

              <div :class="`w-1 h-10 rounded-full ${mail.accentColor}`"></div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between mb-0.5">
                  <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ mail.sender
                    }}</p>
                  <span class="text-xs text-gray-400 font-medium">{{ mail.date }}</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{{ mail.subject }}</p>
              </div>

              <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton icon="i-heroicons-eye" color="gray" variant="ghost" size="xs" />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

// 1. State untuk Modal Filter
const isFilterOpen = ref(false)

// 2. Data untuk Dropdown Tulis Surat
const tulisItems = [
  [{
    label: 'Naskah Dinas',
    icon: 'i-lucide-scroll-text',
    to: '/admin/tulis/naskah-dinas', // Sesuaikan link
    click: () => console.log('Naskah Dinas clicked')
  }, {
    label: 'Konsep',
    icon: 'i-lucide-pencil-ruler',
    to: '/admin/tulis/konsep', // Sesuaikan link
    click: () => console.log('Konsep clicked')
  }]
]

// --- CONFIGURATION ---
const cardUI = {
  base: 'border-0 !border-0',   // tambah !important
  background: 'bg-white dark:bg-gray-900',
  ring: '!ring-0',
  divide: '!divide-y-0',
  rounded: 'rounded-xl',
  shadow: '',

  body: {
    padding: 'p-5 sm:p-6',
  },
  header: {
    padding: 'px-5 py-4 sm:px-6',
  },
}


// --- DATA DUMMY ---

const stats = [
  { label: 'Surat Masuk', value: '40', icon: 'i-heroicons-inbox-arrow-down', trend: 12, trendUp: true, bgSolid: 'bg-blue-600' },
  { label: 'Terkirim', value: '3', icon: 'i-heroicons-paper-airplane', trend: 5, trendUp: true, bgSolid: 'bg-emerald-600' },
  { label: 'Draft Tersimpan', value: '1', icon: 'i-heroicons-clock', trend: 2, trendUp: false, bgSolid: 'bg-orange-500' },
]

const recentMails = [
  { id: 1, sender: 'Kementerian Dalam Negeri', subject: 'Undangan Rapat Koordinasi Nasional Smart City', date: '10:42', accentColor: 'bg-orange-500' },
  { id: 3, sender: 'Dinas Kesehatan', subject: 'Laporan Bulanan Kesehatan Pegawai', date: 'Kemarin', accentColor: 'bg-green-500' },
  { id: 4, sender: 'CV Maju Mundur', subject: 'Invoice Pengadaan ATK Bulan November', date: 'Kemarin', accentColor: 'bg-gray-400' },
]

const summaryData = [
  { label: 'Selesai', count: 85, color: 'bg-green-500' },
  { label: 'Dalam Proses', count: 24, color: 'bg-blue-500' },
  { label: 'Menunggu', count: 12, color: 'bg-orange-500' },
  { label: 'Ditolak', count: 3, color: 'bg-red-500' },
]

const items = ref<DropdownMenuItem[]>([
  {
    label: 'Nota Dinas',
    to: 'admin/tulis/nota-dinas'
  },
  {
    label: 'Disposisi',
    to: 'admin/tulis/disposisi'
  },
  {
    label: 'Surat Dinas Eksternal',
    to: 'admin/tulis/surat-dinas-eksternal'
  },
  {
    label: 'Surat Dinas Internal',
    to: 'admin/tulis/surat-dinas-internal'
  },
  {
    label: 'Registrasi',
    to: 'admin/tulis/registrasi'
  }
])
</script>
