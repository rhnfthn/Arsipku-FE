<template>
    <nav
        class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-20 px-4 flex items-center justify-between transition-colors duration-300">
        <div class="flex items-center gap-3">
            <button
                class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                @click="$emit('open-mobile-sidebar')">
                <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
            </button>

            <h1 class="font-bold text-xl tracking-tight text-gray-900 dark:text-white md:hidden">
                ArsipKu
            </h1>

            <UInput v-model="search" placeholder="Ketik untuk cari naskah dinas ..." icon="i-heroicons-magnifying-glass"
                variant="none" size="xl" class="w-full md:min-w-100 ms-1" :ui="{
                    base: 'ms-2 py-4 bg-white dark:bg-gray-800',
                    icon: {
                        trailing: {
                            pointer: ''
                        }
                    }
                }" />

        </div>

        <div class="flex items-center gap-5">
            <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{
                content: 'w-72',
                item: 'px-4 py-2.5',
                itemLeadingIcon: 'size-5',
                itemLabel: 'text-sm'
            }">

                <!-- Avatar dengan nama di navbar -->
                <div class="flex items-center gap-2 cursor-pointer">
                    <div class="flex flex-col text-right leading-tight">
                        <span class="hidden md:block text-sm font-semibold text-gray-900 dark:text-white">
                            Ivan Dwi Santoso
                        </span>

                        <span
                            class="hidden md:block text-[11px] font-medium text-gray-500 dark:text-gray-400 tracking-tight">
                            AVP of Enterprise Technology Planning
                        </span>
                    </div>

                    <UAvatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Ivan Dwi Santoso" size="md"
                        class="ring-2 ring-transparent hover:ring-primary-500/50 transition-all" />
                </div>

                <template #theme-label>
                    <div class="flex items-center justify-between w-full py-1 px-2.5">
                        <span class="text-sm text-gray-700 dark:text-gray-200">Tampilan</span>
                        <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
                            <UButton v-for="mode in ['light', 'dark']" :key="mode"
                                :icon="mode === 'light' ? 'i-heroicons-sun' : 'i-heroicons-moon'" size="2xs"
                                :color="colorMode.value === mode ? 'white' : 'gray'"
                                :variant="colorMode.value === mode ? 'solid' : 'ghost'" class="rounded-md shadow-sm"
                                :class="{ '!bg-white dark:!bg-gray-700 !text-primary-500': colorMode.value === mode }"
                                @click.stop="colorMode.preference = mode" />
                        </div>
                    </div>
                </template>

                <template #lang-label>
                    <div class="flex items-center justify-between w-full py-1 px-2.5">
                        <span class="text-sm text-gray-700 dark:text-gray-200">Bahasa</span>
                        <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
                            <UButton v-for="lang in locales" :key="lang.code" :label="lang.name" size="2xs"
                                :color="currentLocale === lang.code ? 'white' : 'gray'"
                                :variant="currentLocale === lang.code ? 'solid' : 'ghost'"
                                class="rounded-md text-[10px] font-bold min-w-[32px] justify-center shadow-sm"
                                :class="{ '!bg-white dark:!bg-gray-700 !text-primary-500': currentLocale === lang.code }"
                                @click.stop="setLocale(lang.code)" />
                        </div>
                    </div>
                </template>

                <template #search>
                    <div class="block md:hidden px-2 pb-2 pt-1">
                        <UInput v-model="search" placeholder="Cari..." icon="i-heroicons-magnifying-glass" size="sm"
                            autofocus />
                    </div>
                </template>
            </UDropdownMenu>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { DropdownMenuItem } from "#ui/types";

defineEmits(["open-mobile-sidebar"]);
const search = ref("");
const colorMode = useColorMode();
const currentLocale = ref("id");
const locales = [{ code: "id", name: "ID" }, { code: "en", name: "EN" }];
const setLocale = (code: string) => (currentLocale.value = code);

const menuItems = computed<DropdownMenuItem[][]>(() => [
    // Menu items tanpa icon
    [
        {
            label: "Setting Notif Email",
            class: "text-sm text-gray-700 dark:text-gray-200 truncate"
        },
        {
            label: "Visualisasi Digsig (Visible)",
            class: "text-sm text-gray-700 dark:text-gray-200 truncate"
        },
        {
            label:
                "AVP of Enterprise Technology Planning – Interim Officer / Viewer Junior Manager Pengembangan Sistem Teknologi Informasi",
            class: "text-sm text-gray-700 dark:text-gray-200 truncate max-w-[240px]"
        },
        {
            label: "Setting Temporary File",
            class: "text-sm text-gray-700 dark:text-gray-200 truncate"
        }
    ],

    // Label khusus: Tema, Bahasa, Cari
    [
        { label: "Tampilan", slot: "theme", type: "label" },
        { label: "Bahasa", slot: "lang", type: "label" },
        { label: "Cari", slot: "search", type: "label" }
    ],

    // Logout tanpa icon
    [
        {
            label: "Keluar",
            class: "text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
            onSelect: () => alert("Logout Clicked")
        }
    ]
]);
</script>
