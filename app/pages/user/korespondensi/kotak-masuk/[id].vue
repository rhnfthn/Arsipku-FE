<script setup lang="ts">
const icons = [
    'i-heroicons-arrow-left',
    'i-heroicons-archive-box',
    'i-heroicons-exclamation-circle',
    'i-heroicons-trash',
    'i-heroicons-envelope',
    'i-heroicons-clock',
    'i-heroicons-folder-arrow-down',
    'i-heroicons-tag',
    'i-heroicons-ellipsis-vertical'
]
</script>

<template>
    <div
      class="w-full flex flex-col bg-white overflow-hidden rounded-xl shadow-lg border-gray-100 py-5">

        <UContainer class="">

            <div class="flex items-center gap-1 mb-6 text-gray-500">
                <UButton v-for="(icon, index) in icons" :key="index" :icon="icon" variant="ghost" color="gray"
                    class="hover:bg-gray-100" />
            </div>

            <div class="flex justify-between items-start mb-2">
                <h1 class="text-2xl font-normal text-gray-900">Undangan Rapat Koordinasi</h1>
                <UButton icon="i-heroicons-printer" variant="ghost" color="gray" />
            </div>

            <div class="flex gap-2 mb-8">
                <UBadge color="yellow" variant="subtle" :ui="{ rounded: 'rounded-md' }"
                    class="px-3 py-1 bg-yellow-100 text-yellow-800">Internal</UBadge>
                <UBadge color="gray" variant="subtle" :ui="{ rounded: 'rounded-md' }"
                    class="px-3 py-1 bg-gray-200 text-gray-700">Kotak Masuk</UBadge>
            </div>

            <div class="flex items-start justify-between mb-6">
                <div class="flex gap-4">
                    <UAvatar alt="Siti Rahma" size="md" class="bg-purple-600 text-white"
                        :ui="{ background: 'bg-purple-600' }">S</UAvatar>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-gray-900">Siti Rahma</span>
                            <span class="text-gray-500 text-sm">&lt;siti.rahma@email.com&gt;</span>
                        </div>
                        <div class="text-sm text-gray-500">kepada saya</div>
                    </div>
                </div>

                <div class="flex items-center gap-3 text-gray-500 text-sm">
                    <span>2025-11-21 08:15</span>
                    <UIcon name="i-heroicons-star" class="w-5 h-5 cursor-pointer hover:text-yellow-400" />
                    <UIcon name="i-heroicons-arrow-uturn-left" class="w-5 h-5 cursor-pointer hover:text-gray-700" />
                    <UIcon name="i-heroicons-ellipsis-vertical" class="w-5 h-5 cursor-pointer hover:text-gray-700" />
                </div>
            </div>

            <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 relative">
                <div class="text-gray-600 text-sm mb-1">Sepertinya pesan ini ditulis dalam Inggris</div>
                <button class="text-blue-600 text-sm font-medium hover:underline">Terjemahkan ke Indonesia</button>
                <UButton icon="i-heroicons-x-mark" variant="ghost" color="gray" size="xs"
                    class="absolute top-2 right-2 text-gray-400" />
            </div>

            <div class="text-gray-800 leading-relaxed mb-8 text-[15px]">
                <p>
                    Sehubungan dengan rapat koordinasi tim operasional, dimohon kehadiran seluruh anggota tim pada:
                    Hari/Tanggal: Jumat, 22 November 2025, Waktu: 09.00 - 12.00 WIB, Tempat: Ruang Rapat Lantai 3.
                    Agenda: Evaluasi kinerja bulan November dan perencanaan Desember 2025.
                </p>
            </div>

            <UDivider class="mb-6 border-gray-100" />

            <div class="space-y-6 mb-10">
                <div>
                    <div class="text-sm text-gray-500 mb-1">Tertuju</div>
                    <div class="text-gray-900">Tim Operasional</div>
                </div>

                <div>
                    <div class="text-sm text-gray-500 mb-1">Disposisi</div>
                    <div class="text-gray-900">Harap hadir</div>
                </div>

                <div>
                    <div class="text-sm text-gray-500 mb-1">Catatan</div>
                    <div class="text-gray-900">Rapat akan dilaksanakan besok pagi</div>
                </div>

                <div>
                    <div class="text-sm text-gray-500 mb-2">Jenis Surat</div>
                    <UBadge color="blue" variant="subtle"
                        class="rounded-full px-4 py-1 bg-blue-100 text-blue-700 font-normal">
                        Disposisi
                    </UBadge>
                </div>
            </div>

            <div class="mt-8">
                <UButton to="/user/tulis" block size="md" color="primary" variant="solid" icon="i-heroicons-document-text"
                    :ui="{ rounded: 'rounded-lg', font: 'font-semibold' }"
                    class="bg-primary hover:bg-primary-600 text-white h-12">
                    Lanjut Konsep
                </UButton>
            </div>

        </UContainer>
    </div>
</template>