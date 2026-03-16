<template>
  <div :class="[
    'bg-base page-container relative h-screen w-full overflow-hidden',
    loaded ? 'page-loaded' : ''
  ]">
    <!-- Background Animasi: Tech Grid & Menara ATC -->
    <div class="fixed inset-0 z-0 tech-grid pointer-events-none">
      <div class="absolute top-17 right-10 w-64 md:right-20 md:w-96">
        <img src="~/assets/towertebal.png" class="w-full opacity-10" alt="ATC Tower" />
      </div>
    </div>

    <!-- Latar Belakang Radar Canvas -->
    <canvas class="fixed inset-0 z-[1] pointer-events-none" id="aircraftCanvas"></canvas>

    <div class="bg-leftGlow absolute top-0 left-0 h-full w-1/3"></div>
    <div class="bg-middleGlow absolute top-1/2 left-1/2 h-full w-1/2 -translate-x-1/2 -translate-y-1/2 transform"></div>
    <div class="bg-rightGlow absolute top-0 right-0 h-full w-1/3"></div>

    <div class="relative z-20 flex h-full w-full items-center justify-center">
      <img src="~/assets/logoAirnav.png" :class="logoClass" class="absolute transition-all duration-1000"
        :style="logoStyle" />

      <p
        class="absolute top-[33rem] left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-[170px] font-bold text-[#e3f1ff] opacity-100 sm:top-[30rem] sm:text-[200px] md:top-[40rem] md:text-[260px] lg:top-[33rem] lg:text-[350px]">
        13
      </p>

      <h1 :class="textClass"
        class="absolute top-[10rem] left-1/2 -translate-x-1/2 transform bg-clip-text text-[34px] font-bold text-transparent opacity-0 transition-all duration-1000 sm:top-[18rem] sm:text-[90px] md:top-[15rem] md:text-[80px] lg:top-[6.5rem] lg:text-[110px]"
        style="background-image: linear-gradient(135deg, #2b5b8a 0%, #457fb6 40%, #8caede 100%)">
        {{ $t("Arsipku") }}
      </h1>

      <div :class="airnavClass"
        class="absolute top-5 right-10 flex flex-col items-end opacity-0 transition-opacity duration-1000">
        <h2 class="text-xl font-bold text-[#457FB6]">Airnav Indonesia</h2>
        <div class="mt-2 flex gap-2">
          <button v-for="locale in locales" :key="locale.code" @click="setLocale(locale.code)"
            class="mt-1 inline-flex items-center justify-center rounded-md bg-white/70 px-5 py-2 text-sm font-semibold text-[#457FB6] transition-all duration-200 hover:bg-white sm:px-2 sm:py-0.5 md:px-3 md:py-1">
            {{ locale.name }}
          </button>
        </div>
      </div>

      <img v-if="showPlane" src="~/assets/Pesawat.png"
        class="plane-base absolute w-[320px] sm:w-[500px] md:w-[550px] lg:w-[700px]"
        :class="{ 'plane-appear': planeAppear, 'plane-takeoff': planeTakeoff }" alt="Pesawat" />

      <div v-if="showText"
        class="fade-slide-up absolute top-[14rem] left-1/2 w-[90%] max-w-md -translate-x-1/2 transform text-center opacity-0 sm:top-[21rem] sm:w-auto sm:max-w-xl md:top-[21rem] md:max-w-2xl lg:top-[16.5rem]">
        <p class="mb-6 text-sm leading-snug font-regular text-[#7D7D80] sm:text-base md:text-[16px]">
          {{ $t('title') }}
        </p>

        <UButton @click="redirectToSSO" external target="_self" rel="noreferrer"
          class="items-center gap-1 rounded-full bg-[#457FB6] px-5 py-1.5 text-sm text-white transition hover:bg-[#35629B] sm:px-6 sm:py-2 sm:text-base md:px-6 md:py-3 md:text-[16px]">
          <span>{{ $t('Masuk') }}</span>
          <ArrowRight class="h-4 w-6 sm:h-5 sm:w-8" />
        </UButton>
      </div>

      <div v-if="showOnboarding" :class="[OnboardingClass, 'fade-slide-up']" :style="OnboardingStyle"
        class="absolute bottom-6 left-1/2 w-[90%] max-w-5xl -translate-x-1/2 transform lg:bottom-12">
        <div
          class="flex flex-col items-center justify-between gap-6 rounded-[1.5rem] bg-white/40 px-8 py-6 shadow-[0_10px_40px_-10px_rgba(31,38,135,0.2)] border border-white/50 md:flex-row md:items-center md:gap-10 md:px-12 md:py-8 lg:h-[140px]"
          style="backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);">
          <!-- Left: Title -->
          <div class="shrink-0 text-center md:text-left">
            <h3 class="text-2xl font-bold leading-tight text-slate-900 md:text-3xl drop-shadow-sm">
              Airnav<br />{{ $t("Arsipku") }}.
            </h3>
          </div>

          <!-- Middle: Description -->
          <div class="max-w-lg text-center md:text-left">
            <p class="text-sm leading-relaxed font-regular text-slate-700 md:text-base">
              {{ $t('card-teks') }}
            </p>
          </div>

          <!-- Right: Icons -->
          <div class="flex shrink-0 items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100/80 text-blue-700 transition-transform hover:scale-105">
              <Headset class="h-6 w-6" />
            </div>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100/80 text-purple-700 transition-transform hover:scale-105">
              <Plane class="h-6 w-6" />
            </div>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100/80 text-green-700 transition-transform hover:scale-105">
              <Settings class="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight, Headset, Plane, Settings } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { setLocale } = useI18n()
const currentLocale = ref('id')
const locales = [
  { code: 'id', name: 'ID' },
  { code: 'en', name: 'EN' }
]

const { getSSORedirectUrl } = useAuth();

const redirectToSSO = async () => {
  const url = await getSSORedirectUrl();

  if (!url) {
    console.error("URL SSO tidak ditemukan");
    return;
  }

  navigateTo(url, { external: true });
};

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

// State Animasi
const loaded = ref(false)
const logoClass = ref('opacity-0')
const logoStyle = ref({
  top: '25%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '64px',
  height: 'auto'
})
const textClass = ref('')
const airnavClass = ref('')
const OnboardingClass = ref('opacity-0')
const OnboardingStyle = ref({})
const showPlane = ref(false)
const planeAppear = ref(false)
const planeTakeoff = ref(false)
const showText = ref(false)
const showOnboarding = ref(false)

// Fungsi Responsive Logo Kecil
const getResponsiveLogoSmall = () => {
  const w = window.innerWidth
  if (w <= 640)
    return { top: '1rem', left: '0.2rem', width: '100px', height: 'auto', transform: 'none' }
  if (w <= 1024)
    return { top: '1rem', left: '0.5rem', width: '130px', height: 'auto', transform: 'none' }
  return { top: '1.25rem', left: '2rem', width: '70px', height: 'auto', transform: 'none' }
}

let resizeHandler = null
let animationFrameId = null
let canvasResizeHandler = null

const initAircraftCanvas = () => {
  const canvas = document.getElementById('aircraftCanvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  let aircrafts = []
  const count = 20

  const initCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    aircrafts = []
    for (let i = 0; i < count; i++) {
      aircrafts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        id: (Math.random() > 0.5 ? 'GA' : 'BT') + Math.floor(Math.random() * 900 + 100),
        rotation: Math.random() * Math.PI * 2,
        opacity: 0.1 + Math.random() * 0.2
      })
    }
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    aircrafts.forEach((ac) => {
      ac.x += ac.vx
      ac.y += ac.vy

      // Wrap around screen
      if (ac.x < -20) ac.x = canvas.width + 20
      if (ac.x > canvas.width + 20) ac.x = -20
      if (ac.y < -20) ac.y = canvas.height + 20
      if (ac.y > canvas.height + 20) ac.y = -20

      // Update rotation based on velocity direction
      ac.rotation = Math.atan2(ac.vy, ac.vx) + Math.PI / 2

      ctx.save()
      ctx.translate(ac.x, ac.y)
      ctx.rotate(ac.rotation)

      ctx.fillStyle = `rgba(0, 86, 179, ${ac.opacity})`

      // Draw icon (small airplane silhouette)
      ctx.beginPath()
      ctx.moveTo(0, -6)
      ctx.lineTo(1, -2)
      ctx.lineTo(8, 2)
      ctx.lineTo(1, 1)
      ctx.lineTo(1, 5)
      ctx.lineTo(4, 7)
      ctx.lineTo(0, 6)
      ctx.lineTo(-4, 7)
      ctx.lineTo(-1, 5)
      ctx.lineTo(-1, 1)
      ctx.lineTo(-8, 2)
      ctx.lineTo(-1, -2)
      ctx.closePath()
      ctx.fill()

      ctx.restore()

      // Draw ID tag
      ctx.font = '9px monospace'
      ctx.fillStyle = `rgba(0, 86, 179, ${ac.opacity * 0.8})`
      ctx.fillText(ac.id, ac.x + 10, ac.y + 4)
    })
    animationFrameId = requestAnimationFrame(draw)
  }

  canvasResizeHandler = initCanvas
  window.addEventListener('resize', canvasResizeHandler)
  initCanvas()
  draw()
}

onMounted(() => {
  // Animasi Masuk
  setTimeout(() => (loaded.value = true), 50)
  setTimeout(() => (logoClass.value = 'opacity-100'), 100)

  resizeHandler = () => {
    if (textClass.value === '') {
      logoStyle.value = {
        top: '10%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '550px',
        height: 'auto'
      }
    } else {
      logoStyle.value = getResponsiveLogoSmall()
    }
  }
  window.addEventListener('resize', resizeHandler)

  // Timeline Animasi
  setTimeout(() => {
    textClass.value = 'opacity-100'
    airnavClass.value = 'opacity-100'
    OnboardingClass.value = 'opacity-100'
    logoStyle.value = getResponsiveLogoSmall()
  }, 1000)

  const startAt = 2000
  setTimeout(() => {
    showPlane.value = true
    setTimeout(() => (planeAppear.value = true), 50)
    setTimeout(() => (planeTakeoff.value = true), 50 + 1200 + 800)
    setTimeout(
      () => {
        showText.value = true
      },
      50 + 1200 + 800 + 600
    )
    setTimeout(
      () => {
        showOnboarding.value = true
      },
      50 + 1200 + 800 + 800
    )
  }, startAt)

  // Start the background aircraft animation
  initAircraftCanvas()
})

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (canvasResizeHandler) window.removeEventListener('resize', canvasResizeHandler)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
/* Background Animation Styles */

.tech-grid {
  background-image: radial-gradient(rgba(0, 51, 102, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Gunakan style CSS yang sama seperti sebelumnya */
.bg-base {
  background: #e3f1ff;
}

.bg-leftGlow {
  background: radial-gradient(circle, rgba(0, 120, 255, 0.3) 40%, rgba(0, 120, 255, 0) 90%);
  filter: blur(50px);
  animation: leftOrbit 6s ease-in-out infinite alternate;
}

.bg-middleGlow {
  background: radial-gradient(circle, #e7f2ff4d 10%, rgba(0, 120, 255, 0) 20%);
  filter: blur(10px);
  border-left: 1px solid #fff;
  border-right: 1px solid #fff;
}

.bg-rightGlow {
  background: radial-gradient(circle, rgba(0, 120, 255, 0.3) 40%, rgba(0, 120, 255, 0) 90%);
  filter: blur(50px);
  animation: rightOrbit 7s ease-in-out infinite alternate;
}

/* Keyframes dan class lain tetap sama seperti kode aslimu */
@keyframes leftOrbit {
  0% {
    transform: translate(-20%, -40%);
  }

  100% {
    transform: translate(-30%, 10%);
  }
}

@keyframes rightOrbit {
  0% {
    transform: translate(20%, 40%);
  }

  100% {
    transform: translate(30%, -10%);
  }
}

.plane-base {
  bottom: -500px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition:
    bottom 1.2s ease-out,
    opacity 0.6s ease-out;
}

.plane-appear {
  bottom: -300px;
  opacity: 1;
  transition:
    bottom 1.2s ease-out,
    opacity 0.8s ease-out;
}

.plane-takeoff {
  bottom: 120%;
  opacity: 1;
  transform: translateX(-50%);
  transition: bottom 1.2s cubic-bezier(0.2, 0.8, 0.1, 1);
}

.page-container {
  opacity: 0;
  transition: opacity 0.35s ease;
}

.page-loaded {
  opacity: 1;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 1s forwards;
}

@keyframes fadeSlideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-slide-up {
  animation: fadeSlideUp 1s forwards;
}
</style>
