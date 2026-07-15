<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <AccessDenied
      v-if="!canAccessPage()"
      permission-key="utama.beranda:read"
    />
    <div v-else class="space-y-6">
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="solid"
        :title="$t('error_title')"
        :description="error"
        :close-button="{
          icon: 'i-heroicons-x-mark-20-solid',
          color: 'white',
          variant: 'link',
          padded: false
        }"
        @close="error = null"
      />

      <div v-if="isLoading && !dashboardData" class="space-y-6 animate-pulse">
        <div
          class="w-full h-64 rounded-3xl shadow-sm bg-gray-100 dark:bg-gray-800 flex items-center px-10 relative overflow-hidden"
        >
          <div class="flex flex-col space-y-3 z-10">
            <USkeleton class="h-9 w-64 sm:w-96 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <USkeleton class="h-5 w-48 sm:w-72 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div class="grid gap-4">
          <UCard v-for="i in 4" :key="i" :ui="cardUI">
            <div class="flex justify-between items-start pl-2">
              <div class="space-y-2">
                <USkeleton class="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
                <USkeleton class="h-8 w-16 bg-gray-200 dark:bg-gray-700" />
              </div>
              <USkeleton class="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </UCard>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
          <!-- <UCard :ui="cardUI" class="w-full lg:flex-1">
            <template #header>
              <USkeleton class="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
            </template>
            <div class="mb-5 flex items-end justify-between space-x-2 h-[250px] px-2">
              <USkeleton class="w-full h-[40%] bg-gray-200 dark:bg-gray-700 rounded-t" />
              <USkeleton class="w-full h-[70%] bg-gray-200 dark:bg-gray-700 rounded-t" />
              <USkeleton class="w-full h-[50%] bg-gray-200 dark:bg-gray-700 rounded-t" />
              <USkeleton class="w-full h-[80%] bg-gray-200 dark:bg-gray-700 rounded-t" />
              <USkeleton class="w-full h-[60%] bg-gray-200 dark:bg-gray-700 rounded-t" />
            </div>
          </UCard> -->

          <UCard :ui="cardUI" class="w-full lg:flex-1">
            <template #header>
              <div class="flex items-center justify-between">
                <USkeleton class="h-6 w-40 bg-gray-200 dark:bg-gray-700" />
                <USkeleton class="h-5 w-20 bg-gray-200 dark:bg-gray-700" />
              </div>
            </template>
            <div class="flex flex-col gap-4">
              <div v-for="j in 3" :key="j" class="flex items-center gap-3">
                <USkeleton
                  class="h-14 w-1.5 rounded-l-full bg-gray-200 dark:bg-gray-700 shrink-0"
                />
                <div class="flex-1 space-y-2">
                  <div class="flex justify-between">
                    <USkeleton class="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
                    <USkeleton class="h-3 w-10 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <USkeleton class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <template v-else>
        <div class="relative w-full h-64 flex items-center transition-all group mb-8">
          <div
            class="absolute inset-0 bg-gradient-to-br from-primary-100 from-45% to-primary dark:from-primary-800 dark:to-primary-600 rounded-3xl shadow-md overflow-hidden dark:border dark:border-primary-800/50"
          ></div>
          <div class="relative z-10 flex flex-col px-10 max-w-lg">
            <Heading variant="heading6b" class="text-primary-600 dark:text-white">
              Halo, {{ formatName(user?.nama) }}
            </Heading>
            <Heading variant="heading9m" class="mt-1 text-primary-400 dark:text-primary-300">
              {{ $t('hero') }}
            </Heading>
          </div>
          <img
            src="/dashboard.png"
            class="absolute -right-6 -bottom-8 h-60 w-auto object-contain opacity-90 animate-float z-20 pointer-events-none"
            alt="Dashboard Decoration"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink v-for="(stat, idx) in stats" :key="idx" :to="stat.link" class="block group">
            <UCard
              :ui="{
                ...cardUI,
                root: `${cardUI.root} hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full`
              }"
            >
              <div
                :class="`absolute left-0 top-0 h-full w-1 ${stat.borderColor} transition-all duration-300 group-hover:w-1.5`"
              ></div>
              <div class="flex flex-col justify-between h-full">
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0">
                    <p class="text-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {{ stat.label }}
                    </p>
                    <Heading
                      variant="heading6b"
                      :class="`text-3xl font-bold mt-2 ${stat.iconColor} transition-transform duration-300 group-hover:scale-105`"
                    >
                      {{ stat.value }}
                    </Heading>
                    <!-- <p
                      v-if="stat.subtitle"
                      class="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate"
                    >
                      {{ stat.subtitle }}
                    </p> -->
                  </div>
                  <div
                    :class="`mt-7 p-2 rounded-lg flex items-center ${stat.bgSolid} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 ml-3`"
                  >
                    <UIcon :name="stat.icon" :class="`w-6 h-6 ${stat.iconColor}`" />
                  </div>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-6">
          <UCard :ui="cardUI" class="w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('righttitle') }}
                </h3>
                <UButton
                  to="/korespondensi/kotak-masuk"
                  size="xs"
                  color="primary"
                  variant="ghost"
                  trailing-icon="i-heroicons-arrow-right"
                >
                  {{ $t('rightbutton') }}
                </UButton>
              </div>
            </template>

            <div
              v-if="recentMails.length === 0"
              class="flex flex-col items-center justify-center h-72 text-gray-400 dark:text-gray-500"
            >
              <UIcon name="i-heroicons-inbox" class="w-16 h-16 mb-2" />
              <p>{{ $t('no_inbox') }}</p>
            </div>

            <div
              v-else
              class="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800 pr-1 flex flex-col gap-2"
            >
              <NuxtLink
                v-for="mail in recentMails"
                :key="mail.id"
                :to="`/korespondensi/kotak-masuk/${mail.id}?jenis=${mail.jenis}`"
                class="py-1 flex items-center gap-3 transition-colors rounded-xl cursor-pointer group"
                :class="
                  mail.is_priority
                    ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                "
              >
                <div
                  class="h-14 w-1.5 border-l-[3px] rounded-l-full shrink-0"
                  :class="mail.is_priority ? 'border-red-500' : 'border-primary'"
                ></div>

                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline">
                    <h4
                      class="text-base truncate font-normal leading-none"
                      :class="
                        mail.is_priority
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-gray-900 dark:text-gray-100'
                      "
                    >
                      {{ mail.pengirim_nama || $t('unknown_sender') }}
                    </h4>

                    <div class="flex items-center gap-2">
                      <div
                        v-if="mail.is_priority"
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shrink-0 whitespace-nowrap"
                      >
                        <AlertTriangle class="w-3 h-3" />
                        <span
                          class="text-[9px] font-bold uppercase tracking-wide leading-none mt-[1px]"
                        >
                          {{ $t('priority') }}
                        </span>
                      </div>

                      <span
                        class="text-xs whitespace-nowrap"
                        :class="
                          mail.is_priority
                            ? 'text-red-600/80 dark:text-red-400/80 font-medium'
                            : 'text-gray-400 dark:text-gray-500'
                        "
                      >
                        {{ formatShortDate(mail.tanggal) }}
                      </span>
                    </div>
                  </div>

                  <p
                    class="text-sm truncate mt-1.5 leading-tight"
                    :class="
                      mail.is_priority
                        ? 'text-red-800/70 dark:text-red-300/70'
                        : 'text-gray-500 dark:text-gray-400'
                    "
                  >
                    {{ mail.perihal || $t('no_subject') }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </UCard>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatShortDate } from "~/utils/mail-helpers";
import { onMounted } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useDashboard } from '@/composables/useDashboard'

definePageMeta({
  middleware: 'auth'
})

const { user, getProfile, hasPermission, isSuperadmin } = useAuth()
const { canAccessPage } = useFeatureAccess()
const { isLoading, error, stats, recentMails, fetchDashboardData, dashboardData } =
  useDashboard()

const canViewDashboard = computed(() => hasPermission('utama.beranda', 'read'))

const { t } = useI18n()

const cardUI: Record<string, any> = {
  root: 'rounded-xl ring-0 shadow-sm bg-white dark:bg-gray-800 print:hidden transition-colors relative overflow-hidden',
  header: { padding: 'px-5 py-4 sm:px-6' },
  body: { padding: 'p-5 sm:p-6' },
  divide: 'divide-y divide-gray-100 dark:divide-gray-700'
}

const formatName = (name: string | undefined) => {
  if (!name) return t('default_user')
  return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

/* digantikan formatShortDate dari ~/utils/mail-helpers */

onMounted(async () => {
  if (!user.value) await getProfile()
  await fetchDashboardData()

  // Ensure notification badge is fetched on first login
  const { init: initNotifications } = useNotifications()
  await initNotifications(true)
})
</script>

<style scoped>
@keyframes float {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(0px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.group:hover .text-3xl {
  transform: scale(1.05);
}

.grid > .block {
  display: flex;
}

.grid > .block > div {
  width: 100%;
}
</style>
