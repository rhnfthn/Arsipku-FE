<template>
  <nav
    class="bg-[#F6F8FC] dark:bg-gray-900 dark:border-gray-800 h-20 flex items-center transition-colors duration-300 gap-5 justify-between sticky top-0 z-99"
  >
    <div class="flex items-center gap-3 w-full">
      <button
        class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="$emit('open-mobile-sidebar')"
      >
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>

      <h1
        class="mt-2 font-bold text-xl tracking-tight text-neutral-900 dark:text-white md:hidden"
      >
        ArsipKu
      </h1>

      <UInput
        v-model="search"
        placeholder="Ketik untuk cari naskah dinas ..."
        icon="i-heroicons-magnifying-glass"
        variant="none"
        size="xl"
        class="w-full md:min-w-100 rounded-full [&>input]:placeholder-gray-800 [&>input]:dark:placeholder-gray-500"
        :ui="{
          base: 'py-3 bg-primary-50/80 dark:bg-gray-800 rounded-full focus:bg-white focus:shadow-sm dark:focus:bg-gray-800 transition-all',
          leadingIcon:
            'size-5 text-gray-800 dark:text-gray-400 group-focus-within:text-white dark:group-focus-within:text-white transition-colors',
          icon: {
            trailing: {
              pointer: '',
            },
          },
        }"
      />
    </div>

    <div class="flex items-center gap-5">
      <UDropdownMenu
        :items="menuItems"
        :content="{ align: 'end' }"
        :ui="{
          content: 'w-72 dark:bg-gray-900 dark:ring-gray-800',
          item: 'px-4 py-2.5',
          itemLeadingIcon: 'size-5',
          itemLabel: 'text-sm',
        }"
      >
        <div class="flex items-center gap-2 cursor-pointer">
          <div class="flex flex-col text-right leading-tight">

            <span
              class="hidden md:block text-sm font-semibold text-gray-900 dark:text-gray-100"
            >

            <span class="hidden md:block text-sm font-semibold text-gray-900 dark:text-gray-100 text-nowrap">

              {{ user?.nama }}
            </span>

            <span
              class="hidden md:block text-[11px] font-medium text-gray-500 dark:text-gray-400 tracking-tight text-nowrap"
            >
              {{ user?.positionText }}
            </span>
          </div>

          <UAvatar
            size="md"
            class="ring-2 ring-transparent hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center"
          >
            {{ getInitials(user?.nama) }}
          </UAvatar>
        </div>

        <template #theme-label>
          <div class="flex items-center justify-between w-full py-1 px-2.5">
            <span class="text-sm text-gray-700 dark:text-gray-200"
              >Tampilan</span
            >

            <div class="flex items-center rounded-lg">
              <div
                class="flex items-center p-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 backdrop-blur"
              >
                <button
                  @click="isDark = false"
                  class="p-1.5 rounded-full transition-all duration-200 flex items-center justify-center"
                  :class="
                    !isDark
                      ? 'bg-white dark:bg-gray-700 text-orange-500 shadow scale-105'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  "
                >
                  <UIcon name="i-heroicons-sun" class="w-4 h-4" />
                </button>

                <button
                  @click="isDark = true"
                  class="p-1.5 rounded-full transition-all duration-200 flex items-center justify-center"
                  :class="
                    isDark
                      ? 'bg-gray-700 text-yellow-300 shadow scale-105'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  "
                >
                  <UIcon name="i-heroicons-moon" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <template #lang-label>
          <div class="flex items-center justify-between w-full py-1 px-2.5">
            <span class="text-sm text-gray-700 dark:text-gray-200">Bahasa</span>
            <div
              class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1"
            >
              <UButton
                v-for="lang in locales"
                :key="lang.code"
                :label="lang.name"
                size="2xs"
                :color="currentLocale === lang.code ? 'white' : 'gray'"
                :variant="currentLocale === lang.code ? 'solid' : 'ghost'"
                class="rounded-md text-[10px] font-semibold min-w-[32px] justify-center px-2 py-1 transition"
                :class="{
                  '!bg-white dark:!bg-gray-700 !text-primary-500 shadow-sm':
                    currentLocale === lang.code,
                }"
                @click="setLocale(lang.code)"
              />
            </div>
          </div>
        </template>

        <template #search>
          <div class="block md:hidden px-2 pb-2 pt-1">
            <UInput
              v-model="search"
              placeholder="Cari..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
              autofocus
            />
          </div>
        </template>
      </UDropdownMenu>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useDark } from "@vueuse/core";
import type { DropdownMenuItem } from "#ui/types";

import { useAuth } from "~/composables/useAuth";
import { onMounted } from "vue";

const { user, getProfile, logout } = useAuth();

onMounted(() => {
  if (!user.value) {

    getProfile()

  }
});

async function handleLogout() {
  const success = await logout();

  if (success) {
    return navigateTo("/");
  }

  alert("Gagal logout!");
}

defineEmits(["open-mobile-sidebar"]);
const search = ref("");
const colorMode = useColorMode();
const currentLocale = ref("id");
const locales = [
  { code: "id", name: "ID" },
  { code: "en", name: "EN" },
];
const setLocale = (code: string) => (currentLocale.value = code);

const isDark = useDark();

const menuItems = computed<DropdownMenuItem[][]>(() => [
  // Menu items tanpa icon
  [
    {
      label: "Setting Notif Email",
      class: "text-sm text-gray-700 dark:text-gray-200 truncate",
    },
    {
      label: "Visualisasi Digsig (Visible)",
      class: "text-sm text-gray-700 dark:text-gray-200 truncate",
    },
    {
    
      label:
         `${user.value?.positionText || ""}`,
      class: "text-sm text-gray-700 dark:text-gray-200 truncate"

    },
    {
      label: "Setting Temporary File",
      class: "text-sm text-gray-700 dark:text-gray-200 truncate",
    },
  ],

  // Label khusus: Tema, Bahasa, Cari
  [
    { label: "Tampilan", slot: "theme", type: "label" },
    { label: "Bahasa", slot: "lang", type: "label" },
    { label: "Cari", slot: "search", type: "label" },
  ],

  // Logout tanpa icon
  [
    {
      label: "Keluar",
      class:
        "text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
      onSelect: async () => handleLogout(),
    },
  ],
]);

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};
</script>
