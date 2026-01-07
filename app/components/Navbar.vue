<template>
  <nav
    class="bg-[#F6F8FC] dark:bg-gray-900 dark:border-gray-800 h-20 flex items-center transition-colors duration-300 gap-3 md:gap-5 justify-between sticky top-0 z-[99]">
    <div class="flex items-center gap-3 flex-1">
      <button
        class="md:hidden me-2 mt-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="$emit('open-mobile-sidebar')">
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>

      <h1 class="font-bold text-xl tracking-tight text-neutral-900 dark:text-white md:hidden">
        ArsipKu
      </h1>

      <UInput v-if="searchConfig.show" v-model="search" :placeholder="searchConfig.placeholder" variant="none" size="xl"
        class="hidden md:block w-full rounded-full [&>input]:placeholder-gray-500 [&>input]:dark:placeholder-gray-400"
        @keyup.enter="handleSearch" :ui="{
          base: 'py-3 px-5 bg-primary-50/80 dark:bg-gray-800 rounded-full focus:bg-white focus:shadow-md dark:focus:bg-gray-700 transition-all',
          icon: {
            trailing: {
              pointer: 'pointer-events-auto cursor-pointer'
            }
          }
        }">
        <template #trailing>
          <UButton v-if="search" color="gray" variant="link" icon="i-heroicons-x-mark" :padded="false"
            @click="handleReset" class="hover:text-gray-700 dark:hover:text-gray-200 w-5 h-5" />
          <UIcon v-else name="i-heroicons-magnifying-glass" class="text-gray-400 dark:text-gray-500 w-5 h-5" />
        </template>
      </UInput>
    </div>

    <div class="flex items-center gap-5">
      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{
        content: 'w-72 dark:bg-gray-900 dark:ring-gray-800',
        item: 'px-4 py-3',
        itemLabel: 'text-sm',
      }">
        <div class="flex items-center gap-3 cursor-pointer group">
          <div class="flex flex-col items-end text-right leading-tight">
            <span class="hidden md:block text-sm font-semibold text-gray-900 dark:text-gray-100 text-nowrap">
              {{ user?.nama }}
            </span>

            <UTooltip :text="user?.positionText" :popper="{ placement: 'bottom-end' }">
              <span
                class="hidden md:block text-[11px] font-medium text-gray-500 dark:text-gray-400 tracking-tight truncate max-w-[150px] lg:max-w-[200px]">
                {{ user?.positionText }}
              </span>
            </UTooltip>
          </div>

          <UAvatar size="md"
            class="ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center">
            {{ getInitials(user?.nama) }}
          </UAvatar>
        </div>

        <template #search v-if="searchConfig.show">
          <div class="block w-full md:hidden px-3 pt-3">
            <UInput v-model="search" :placeholder="searchConfig.placeholder" size="md" autofocus class="w-full"
              @keyup.enter="handleSearch" :ui="{
                icon: {
                  trailing: {
                    pointer: 'pointer-events-auto cursor-pointer'
                  }
                }
              }">
              <template #trailing>
                <UButton v-if="search" color="gray" variant="link" icon="i-heroicons-x-mark" :padded="false"
                  @click="handleReset" />
                <UIcon v-else name="i-heroicons-magnifying-glass" class="text-gray-400 dark:text-gray-500 w-5 h-5" />
              </template>
            </UInput>
            <div class="h-px bg-gray-200 dark:bg-gray-800 mt-4 -mx-4"></div>
          </div>
        </template>

        <template #theme-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Tampilan</span>
            <div
              class="flex items-center p-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button @click="isDark = false" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="!isDark ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
                <UIcon name="i-heroicons-sun" class="w-4 h-4" />
              </button>
              <button @click="isDark = true" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="isDark ? 'bg-gray-700 text-yellow-300 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
                <UIcon name="i-heroicons-moon" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>

        <template #lang-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Bahasa</span>
            <div
              class="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 border border-gray-200 dark:border-gray-700">
              <UButton v-for="lang in locales" :key="lang.code" :label="lang.name"
                :variant="currentLocale === lang.code ? 'solid' : 'ghost'"
                class="rounded-md text-[10px] font-bold px-2 py-1 transition-all h-6"
                :class="currentLocale === lang.code ? '!bg-white dark:!bg-gray-700 !text-primary-600 shadow-sm' : 'text-gray-500'"
                @click="setLocale(lang.code)" />
            </div>
          </div>
        </template>

      </UDropdownMenu>
    </div>
  </nav>

  <ConfirmPopup v-model="showLogoutPopup" type="warning" title="Keluar dari akun?"
    message="Anda akan keluar dari sistem. Pastikan semua pekerjaan sudah disimpan." confirmText="Keluar"
    cancelText="Batal" :isLoading="isLoggingOut" @confirm="confirmLogout" @cancel="showLogoutPopup = false" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useDark } from "@vueuse/core";
import type { DropdownMenuItem } from "#ui/types";
import { useAuth } from "~/composables/useAuth";
import ConfirmPopup from "~/components/ConfirmPopup.vue";

const { user, getProfile, logout } = useAuth();
const showLogoutPopup = ref(false);
const isLoggingOut = ref(false);
const search = ref("");
const route = useRoute();

const standardItemClass = "text-sm text-gray-700 dark:text-gray-200 truncate";
const logoutItemClass = "text-sm text-error";

onMounted(() => {
  if (!user.value) getProfile();
});

const searchConfig = computed(() => {
  const path = route.path;
  if (path.includes("kotak-masuk")) {
    return { show: true, placeholder: "Cari naskah masuk...", key: "inbox" };
  } else if (path.includes("terkirim")) {
    return { show: true, placeholder: "Cari naskah terkirim...", key: "sent" };
  } else if (path.includes("draft")) {
    return { show: true, placeholder: "Cari draf naskah...", key: "draft" };
  }
  return { show: false, placeholder: "", key: "" };
});

const handleSearch = () => {
  navigateTo({
    path: route.path,
    query: {
      ...route.query,
      q: search.value
    }
  });
};

const handleReset = () => {
  search.value = "";
  handleSearch();
};

watch(() => route.query.q, (newVal) => {
  search.value = (newVal as string) || "";
}, { immediate: true });

watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    search.value = "";
  }
});

const isDark = useDark();
const currentLocale = ref("id");
const locales = [
  { code: "id", name: "ID" },
  { code: "en", name: "EN" },
];
const setLocale = (code: string) => (currentLocale.value = code);

const openLogoutPopup = () => { showLogoutPopup.value = true; };

const confirmLogout = async () => {
  isLoggingOut.value = true;
  const success = await logout();
  isLoggingOut.value = false;
  showLogoutPopup.value = false;
  if (success) return navigateTo("/");
  alert("Gagal logout!");
};

defineEmits(["open-mobile-sidebar"]);

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [
    ...(searchConfig.value.show
      ? [{ slot: "search", type: "label", class: "md:hidden p-0" }]
      : []),
    {
      label: user.value?.positionText || "Posisi",
      class: standardItemClass,
      slot: undefined
    },
  ],
  [
    { label: "Setting Notif Email", class: standardItemClass },
    { label: "Visualisasi Digsig (Visible)", class: standardItemClass },
    { label: "Setting Temporary File", class: standardItemClass },
  ],
  [
    { slot: "theme-label", type: "label" },
    { slot: "lang-label", type: "label" },
  ],
  [
    {
      label: "Keluar",
      class: logoutItemClass,
      onSelect: () => openLogoutPopup(),
    },
  ],
]);

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};
</script>
