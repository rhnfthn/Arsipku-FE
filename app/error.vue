<template>
    <div
        class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-4 text-center font-sans text-slate-600 selection:bg-slate-100">

        <div class="absolute inset-0 pointer-events-none bg-gradient-radial" :class="config.gradientBg"
            style="background-image: radial-gradient(circle at center, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 40%, var(--tw-gradient-to) 70%);">
        </div>

        <div class="relative z-10 max-w-2xl">

            <p class="mb-2 text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
                ERROR
            </p>

            <h1 class="text-[150px] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b drop-shadow-sm md:text-[180px]"
                :class="config.gradientText">
                {{ error?.statusCode }}
            </h1>

            <h2 class="mt-4 text-xl font-bold text-slate-800 md:text-2xl">
                {{ config.title }}
            </h2>

            <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-500 md:text-base">
                {{ config.desc }}
            </p>

            <p class="mt-8 text-sm font-medium" :class="config.buttonText">
                {{ config.subAction }}
            </p>

            <div class="mt-6 flex flex-wrap justify-center gap-4">
                <button @click="handleError"
                    class="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    :class="[config.buttonPrimary, `focus:ring-${config.color}-500`]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Halaman Utama
                </button>

                <NuxtLink to="/login"
                    class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" x2="3" y1="12" y2="12" />
                    </svg>
                    Login
                </NuxtLink>
            </div>

            <div class="mt-12 flex justify-center gap-8 text-xs font-medium text-slate-400">
                <button @click="handleBack" class="flex items-center gap-1.5 transition-colors hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    Kembali
                </button>
                <NuxtLink to="/help" class="flex items-center gap-1.5 transition-colors hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 14c1.49-1.28 3.6-1.28 3.6-1.28" />
                        <path d="M23 14c-1.28 1.49-1.28 3.6-1.28 3.6" />
                        <path d="M19 14c-1.28-1.49-3.6-1.49-3.6-1.49" />
                        <path d="M23 14c-1.49 1.28-1.49 3.6-1.49 3.6" />
                        <path
                            d="M4 18c-5.163-2.71-2.137-12.01 5-12 1.346 0 2.5.5 3.5 1.5 1-1 2.154-1.5 3.5-1.5 7.137-.01 10.163 9.29 5 12" />
                    </svg>
                    Bantuan
                </NuxtLink>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
    error: Object as () => NuxtError,
})

// Handle clearing the error and redirecting
const handleError = () => clearError({ redirect: '/' })
const handleBack = () => window.history.back()

// Dynamic Configuration based on Status Code
const config = computed(() => {
    const code = props.error?.statusCode || 500

    const themes: Record<number, any> = {
        404: {
            color: 'blue',
            title: 'Halaman Tidak Ditemukan',
            desc: 'Halaman atau halaman yang Anda cari tidak tersedia di Arsipku. Mungkin halaman tersebut telah dipindahkan, diarsipkan ulang, atau rutenya tidak lagi berlaku.',
            subAction: 'Ingin kembali mengakses halaman?',
            gradientText: 'from-blue-400 to-blue-600',
            gradientBg: 'from-blue-500/20 via-blue-500/5 to-transparent',
            buttonPrimary: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
            buttonText: 'text-blue-600',
            iconColor: 'text-blue-500'
        },
        403: {
            color: 'red',
            title: 'Akses Ditolak - Area Terlarang',
            desc: 'Maaf, Anda tidak memiliki boarding pass untuk mengakses area ini. Halaman ini memerlukan otorisasi khusus atau tingkat akses yang lebih tinggi.',
            subAction: 'Butuh Izin Khusus?',
            gradientText: 'from-red-400 to-red-600',
            gradientBg: 'from-red-500/20 via-red-500/5 to-transparent',
            buttonPrimary: 'bg-red-500 hover:bg-red-600 shadow-red-200',
            buttonText: 'text-red-600',
            iconColor: 'text-red-500'
        },
        500: {
            color: 'orange',
            title: 'Mesin Bermasalah - Kesalahan Server',
            desc: 'Tim teknisi kami sedang memperbaiki sistem. Mohon tunggu sebentar karena kami sedang melakukan pengecekan menyeluruh pada server.',
            subAction: 'Coba Lagi Dalam Beberapa Saat',
            gradientText: 'from-orange-400 to-orange-600',
            gradientBg: 'from-orange-500/20 via-orange-500/5 to-transparent',
            buttonPrimary: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
            buttonText: 'text-orange-600',
            iconColor: 'text-orange-500'
        },
        503: {
            color: 'purple',
            title: 'Pesawat Sedang Dalam Perawatan',
            desc: 'Kami sedang melakukan perbaikan untuk memberikan layanan yang lebih baik. Website akan kembali beroperasi setelah pemeliharaan selesai.',
            subAction: 'Akan Segera Kembali Beroperasi',
            gradientText: 'from-purple-400 to-purple-600',
            gradientBg: 'from-purple-500/20 via-purple-500/5 to-transparent',
            buttonPrimary: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200',
            buttonText: 'text-purple-600',
            iconColor: 'text-purple-500'
        }
    }

    // Default to 500 style if code is unknown
    return themes[code] || themes[500]
})
</script>

<style scoped>
/* Custom utility for the specific radial gradient look in the design */
.bg-gradient-radial {
    background-size: 100% 100%;
    background-position: center;
}
</style>
