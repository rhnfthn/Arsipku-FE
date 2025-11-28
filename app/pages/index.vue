<template>
  <div
    :class="[
      'relative w-full h-screen overflow-hidden bg-base page-container',
      loaded ? 'page-loaded' : '',
    ]"
  >
    <!-- Glow kiri -->
    <div class="absolute top-0 left-0 w-1/3 h-full bg-leftGlow"></div>

    <!-- Glow tengah -->
    <div
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-full bg-middleGlow"
    ></div>

    <!-- Glow kanan -->
    <div class="absolute top-0 right-0 w-1/3 h-full bg-rightGlow"></div>

    <!-- Konten -->
    <div class="relative z-10 w-full h-full flex items-center justify-center">
      <!-- Logo -->
      <img
        src="/logoAirnav.png"
        :class="logoClass"
        class="absolute transition-all duration-1000"
        :style="logoStyle"
      />

      <!-- Angka 13 tetap -->
      <p
        class="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#e3f1ff] font-bold opacity-100 top-[33rem] sm:top-[30rem] md:top-[40rem] lg:top-[35rem] text-[170px] sm:text-[200px] md:text-[260px] lg:text-[350px]"
      >
        13
      </p>

      <!-- Tulisan ArsipKu -->
      <h1
        :class="textClass"
        class="absolute left-1/2 transform -translate-x-1/2 font-bold opacity-0 transition-all duration-1000 bg-clip-text text-transparent top-[10rem] sm:top-[14rem] md:top-[15rem] lg:top-[3rem] text-[70px] sm:text-[130px] md:text-[110px] lg:text-[170px]"
        style="background-image: linear-gradient(to right, #457fb6, #f5faff)"
      >
        {{ $t("Arsipku") }}
      </h1>

      <!-- Tulisan pojok kanan -->
      <div
        :class="airnavClass"
        class="absolute top-5 right-10 flex flex-col items-end opacity-0 transition-opacity duration-1000"
      >
        <h2 class="text-xl font-bold text-[#457FB6]">Airnav Indonesia</h2>
        <!-- Translate -->
        <div
          class="flex items-center p-1 mt-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700"
        >
          <button
            v-for="locale in locales"
            :key="locale.code"
            @click="setLocale(locale.code)"
            class="px-3 py-2 text-xs font-bold rounded-full transition-all duration-200 ease-out"
            :class="[
              currentLocale === locale.code
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ]"
          >
            {{ locale.name }}
          </button>
        </div>

        <div class="flex gap-2 mt-2">
          <button
            v-for="locale in locales"
            :key="locale.code"
            @click="setLocale(locale.code)"
            class="inline-flex items-center justify-center px-5 py-2 mt-1 text-sm sm:px-2 sm:py-0.5 md:px-3 md:py-1 font-semibold bg-white/70 hover:bg-white text-[#457FB6] rounded-md transition-all duration-200"
          >
            {{ locale.name }}
          </button>
        </div>
      </div>

      <!-- Pesawat muncul di tengah -->
      <img
        v-if="showPlane"
        src="/Pesawat.png"
        class="absolute plane-base w-[320px] sm:w-[500px] md:w-[550px] lg:w-[700px]"
        :class="{ 'plane-appear': planeAppear, 'plane-takeoff': planeTakeoff }"
        alt="Pesawat"
      />

      <!-- Tulisan dan tombol muncul setelah pesawat -->
      <div
        v-if="showText"
        class="absolute left-1/2 transform -translate-x-1/2 text-center opacity-0 fade-slide-up top-[17rem] sm:top-[25rem] md:top-[25rem] lg:top-[18rem] w-[70%] sm:w-auto max-w-xs sm:max-w-sm md:max-w-md"
      >
        <p
          class="text-base sm:text-l md:text-xl font-medium text-[#676767] mb-4 leading-snug"
        >
          {{ $t("title") }}
        </p>

        <UButton
          to="/admin/dashboard"
          class="items-center gap-2 px-8 py-1 text-[18px] sm:px-12 sm:py-2.5 sm:text-[18px] md:px-15 md:py-3 md:text-[20px] bg-[#457FB6] text-white rounded-lg hover:bg-[#35629B] transition"
        >
          <span>{{ $t("Masuk") }}</span>
          <ArrowRight class="w-8 h-5" />
        </UButton>
      </div>

      <!-- ONBOARDING CARD -->
      <div
        v-if="showOnboarding"
        :class="[OnboardingClass, 'fade-slide-up', 'hidden sm:inline-block']"
        :style="OnboardingStyle"
        class="relative group top-[15rem] left-[-1rem] sm:top-[2rem] sm:left-[-10rem] md:top-[18rem] md:left-[-8rem] lg:top-[12rem] lg:left-[-28rem] z-10"
      >
        <!-- <div
        v-if="showOnboarding"
        :class="[OnboardingClass, 'fade-slide-up']"
        :style="OnboardingStyle"
        class="relative inline-block group top-[15rem] left-[-1rem] sm:top-[2rem] sm:left-[-10rem] md:top-[18rem] md:left-[-8rem] lg:top-[12rem] lg:left-[-28rem] z-10"
      > -->
        <img
          src="/onboarding.png"
          class="w-[280px] sm:w-[320px] md:w-[350px] rounded-2xl transition-all duration-400 group-hover:scale-105"
        />

        <div
          class="absolute inset-0 bg-black/30 rounded-2xl pointer-events-none transition-all duration-400 group-hover:scale-105"
        ></div>

        <img
          src="/message.png"
          class="absolute top-4 left-4 w-[45px] sm:w-[50px] md:w-[55px] transition-all duration-100 group-hover:scale-110"
        />

        <div
          class="absolute top-18 left-5 right-4 text-white text-xs sm:text-base md:text-l font-semibold drop-shadow-lg transition-all duration-700 group-hover:scale-105"
        >
          {{ $t("card-teks") }}
        </div>
      </div>

      <!-- ICON PESAWAT kecil -->
      <div
        v-if="showOnboarding"
        :class="OnboardingClass"
        :style="OnboardingStyle"
        class="relative inline-block top-[7rem] left-[7rem] sm:top-[30rem] sm:left-[10rem] md:top-[7rem] md:left-[3rem] lg:top-[10rem] lg:left-[20rem] z-20"
      >
        <img src="/Plane.png" class="w-[50px] sm:w-[60px] md:w-[70px]" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { ArrowRight } from "lucide-vue-next";

definePageMeta({ layout: false });

const collapsed = ref(false);
const { setLocale } = useI18n();
const currentLocale = ref("id");
const locales = [
  { code: "id", name: "ID" },
  { code: "en", name: "EN" },
];

// UI states
const loaded = ref(false);
const logoClass = ref("opacity-0");
const logoStyle = ref({
  top: "25%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "600px",
  height: "auto",
});
const textClass = ref("");
const airnavClass = ref("");

// onboarding refs
const OnboardingClass = ref("opacity-0");
const OnboardingStyle = ref({});

// pesawat & content
const showPlane = ref(false);
const planeAppear = ref(false);
const planeTakeoff = ref(false);
const showText = ref(false);
const showOnboarding = ref(false);

// responsive logo kecil setelah title muncul
const getResponsiveLogoSmall = () => {
  const w = window.innerWidth;
  if (w <= 640)
    return {
      top: "1rem",
      left: "0.2rem",
      width: "150px",
      height: "auto",
      transform: "none",
    };
  if (w <= 1024)
    return {
      top: "1rem",
      left: "0.5rem",
      width: "200px",
      height: "auto",
      transform: "none",
    };
  return {
    top: "1.25rem",
    left: "0.5rem",
    width: "230px",
    height: "auto",
    transform: "none",
  };
};

let resizeHandler = null;

onMounted(() => {
  setTimeout(() => (loaded.value = true), 50);

  // logo besar fade in
  setTimeout(() => (logoClass.value = "opacity-100"), 100);

  resizeHandler = () => {
    if (textClass.value === "") {
      // logo masih besar di tengah
      logoStyle.value = {
        top: "10%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "550px",
        height: "auto",
      };
    } else {
      // logo kecil di kiri/top
      logoStyle.value = getResponsiveLogoSmall();
    }
  };
  window.addEventListener("resize", resizeHandler);

  // tampilkan Arsipku, logo kecil, airnav, onboarding
  setTimeout(() => {
    textClass.value = "opacity-100";
    airnavClass.value = "opacity-100";
    OnboardingClass.value = "opacity-100";
    logoStyle.value = getResponsiveLogoSmall();
  }, 1000);

  // sequence pesawat
  const startAt = 2000;
  setTimeout(() => {
    showPlane.value = true;
    setTimeout(() => (planeAppear.value = true), 50);
    setTimeout(() => (planeTakeoff.value = true), 50 + 1200 + 800);
    setTimeout(
      () => {
        showText.value = true;
      },
      50 + 1200 + 800 + 600
    );

    setTimeout(
      () => {
        showOnboarding.value = true;
      },
      50 + 1200 + 800 + 800
    );
  }, startAt);
});

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
});
</script>

<style scoped>
.bg-base {
  background: #e3f1ff;
}

/* Glow */
.bg-leftGlow {
  background: radial-gradient(
    circle,
    rgba(0, 120, 255, 0.3) 40%,
    rgba(0, 120, 255, 0) 90%
  );
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
  background: radial-gradient(
    circle,
    rgba(0, 120, 255, 0.3) 40%,
    rgba(0, 120, 255, 0) 90%
  );
  filter: blur(50px);
  animation: rightOrbit 7s ease-in-out infinite alternate;
}

/* Glow keyframes */
@keyframes leftOrbit {
  0% {
    transform: translate(-20%, -40%);
  }
  25% {
    transform: translate(10%, -10%);
  }
  50% {
    transform: translate(30%, 20%);
  }
  75% {
    transform: translate(-10%, 40%);
  }
  100% {
    transform: translate(-30%, 10%);
  }
}
@keyframes rightOrbit {
  0% {
    transform: translate(20%, 40%);
  }
  25% {
    transform: translate(-10%, 10%);
  }
  50% {
    transform: translate(-30%, -20%);
  }
  75% {
    transform: translate(10%, -40%);
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
