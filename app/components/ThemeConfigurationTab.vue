<template>
  <section class="p-6">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Heading variant="heading9sb">{{ t('theme_config_title') }}</Heading>
        <Paragraph variant="body2" class="mt-1 text-gray-500 dark:text-gray-400">
          {{ t('theme_config_desc') }}
        </Paragraph>
      </div>
      <UButton v-if="canUpdate" icon="i-lucide-plus" color="primary" @click="openCreate">
        {{ t('theme_add') }}
      </UButton>
    </div>

    <div
      class="mb-6 overflow-hidden rounde d-xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30"
    >
      <div
        class="flex items-center gap-2 border-b border-primary-200 px-4 py-3 dark:border-primary-800"
      >
        <UIcon name="i-lucide-sparkles" class="size-4 text-primary" />
        <span class="text-sm font-semibold text-primary-800 dark:text-primary-200">
          {{ t('theme_current') }}
        </span>
      </div>
      <div v-if="isLoadingCurrent" class="p-4">
        <USkeleton class="h-28 w-full rounded-lg" />
      </div>
      <div v-else-if="currentTheme" class="grid gap-4 p-4 md:grid-cols-[240px_1fr]">
        <div class="relative h-28 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
          <img
            :src="currentTheme.imageUrl"
            :alt="currentTheme.name"
            class="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
            :style="getBackgroundImageStyle(currentTheme)"
          />
        </div>
        <div class="min-w-0 self-center">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-semibold text-gray-900 dark:text-white">{{ currentTheme.name }}</p>
            <UBadge
              :color="currentTheme.source === 'manual' ? 'warning' : 'success'"
              variant="subtle"
            >
              {{ currentTheme.source === 'manual' ? t('theme_manual') : t('theme_scheduled') }}
            </UBadge>
          </div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ currentTheme.description || t('theme_no_description') }}
          </p>
        </div>
      </div>
      <div v-else class="p-5 text-sm text-gray-500 dark:text-gray-400">
        {{ t('theme_default_active') }}
      </div>
    </div>

    <div v-if="isLoadingList" class="grid gap-4 md:grid-cols-2">
      <USkeleton v-for="index in 4" :key="index" class="h-64 rounded-xl" />
    </div>
    <div v-else class="grid gap-4 md:grid-cols-2">
      <article
        class="flex h-full flex-col overflow-hidden rounded-xl border bg-white dark:bg-gray-800"
        :class="
          defaultThemeActive || !currentTheme
            ? 'border-primary-400 ring-2 ring-primary-100 dark:border-primary-600 dark:ring-primary-900/40'
            : 'border-gray-200 dark:border-gray-700'
        "
      >
        <div
          class="relative flex h-40 items-center overflow-hidden bg-gradient-to-br from-primary-100 from-45% to-primary dark:from-primary-800 dark:to-primary-600"
        >
          <div class="relative z-10 px-6">
            <p class="font-bold text-primary-600 dark:text-white">Halo, Pengguna</p>
            <p class="mt-1 text-xs text-primary-400 dark:text-primary-200">
              {{ t('theme_default_greeting') }}
            </p>
          </div>
          <img
            src="/dashboard_light.png"
            :alt="t('theme_default_name')"
            class="absolute -bottom-5 -right-3 h-44 object-contain"
          />
          <UBadge
            v-if="defaultThemeActive || !currentTheme"
            color="primary"
            variant="solid"
            class="absolute left-3 top-3"
          >
            {{ t('theme_current_badge') }}
          </UBadge>
        </div>
        <div class="flex flex-1 flex-col p-4">
          <p class="font-semibold text-gray-900 dark:text-white">{{ t('theme_default_name') }}</p>
          <p class="mt-1 line-clamp-2 min-h-10 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_default_desc') }}
          </p>
          <div v-if="canUpdate" class="mt-auto pt-4">
            <UButton
              size="xs"
              color="primary"
              variant="subtle"
              icon="i-lucide-rotate-ccw"
              :loading="isChangingDefault"
              :disabled="defaultThemeActive"
              @click="activateDefault"
            >
              {{
                defaultThemeActive ? t('theme_default_active_button') : t('theme_activate_default')
              }}
            </UButton>
          </div>
        </div>
      </article>

      <article
        v-for="theme in themes"
        :key="theme.id"
        class="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="relative isolate h-40 shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <img
            :src="theme.imageUrl"
            :alt="theme.name"
            class="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
            :style="getBackgroundImageStyle(theme)"
          />
          <div class="absolute inset-0" :style="getOverlayStyle(theme)" />
          <div
            v-if="theme.textPosition !== 'hidden'"
            class="absolute inset-0 flex p-4"
            :class="getPositionClass(theme.textPosition)"
          >
            <div :class="getTextAlignClass(theme.textPosition)">
              <p
                class="text-sm font-bold drop-shadow"
                :class="theme.textTone === 'dark' ? 'text-gray-950' : 'text-white'"
              >
                Halo, Pengguna
              </p>
              <p
                class="text-[10px] drop-shadow"
                :class="theme.textTone === 'dark' ? 'text-gray-800' : 'text-white/90'"
              >
                {{ t('theme_default_greeting') }}
              </p>
            </div>
          </div>
          <div class="absolute left-3 top-3 flex flex-wrap gap-2">
            <UBadge v-if="theme.manualOverride" color="warning" variant="solid">
              {{ t('theme_manual_active') }}
            </UBadge>
            <UBadge :color="theme.isEnabled ? 'success' : 'neutral'" variant="solid">
              {{ theme.isEnabled ? t('theme_enabled') : t('theme_disabled') }}
            </UBadge>
          </div>
        </div>

        <div class="flex flex-1 flex-col p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-semibold text-gray-900 dark:text-white">{{ theme.name }}</p>
              <p class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                {{ theme.description || t('theme_no_description') }}
              </p>
            </div>
            <span class="shrink-0 text-xs text-gray-400">
              {{ t('theme_priority') }}: {{ theme.priority }}
            </span>
          </div>

          <div
            class="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/60 dark:text-gray-300"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar-days" class="size-4 text-primary" />
              <span v-if="theme.startDate">
                {{ formatSchedule(theme) }}
              </span>
              <span v-else>{{ t('theme_manual_only') }}</span>
            </div>
          </div>

          <div
            v-if="canUpdate"
            class="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4"
          >
            <UButton
              size="xs"
              :color="theme.manualOverride ? 'neutral' : 'warning'"
              :variant="theme.manualOverride ? 'outline' : 'subtle'"
              :icon="theme.manualOverride ? 'i-lucide-calendar-sync' : 'i-lucide-hand'"
              :loading="changingManualId === theme.id"
              :disabled="!theme.isEnabled"
              @click="toggleManual(theme)"
            >
              {{ theme.manualOverride ? t('theme_use_schedule') : t('theme_activate_manual') }}
            </UButton>
            <div class="flex items-center gap-1">
              <UButton
                size="xs"
                color="warning"
                variant="ghost"
                icon="i-lucide-pencil"
                :aria-label="t('theme_edit')"
                @click="openEdit(theme)"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :loading="deletingId === theme.id"
                :aria-label="t('theme_delete')"
                @click="confirmDelete(theme)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <Modal v-model="showForm" size="xl" :hide-default-footer="true">
      <template #title>
        <Heading variant="heading9b" class="px-5 pt-5">
          {{ editingTheme ? t('theme_edit_title') : t('theme_create_title') }}
        </Heading>
      </template>

      <form class="space-y-4 px-5" @submit.prevent="submitForm">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('theme_name') }} <span class="text-error">*</span>
          </label>
          <UInput v-model="form.name" class="w-full" :placeholder="t('theme_name_placeholder')" />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('theme_description') }}
          </label>
          <UTextarea v-model="form.description" class="w-full" :rows="2" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('theme_start_date') }}
            </label>
            <UInput v-model="form.startDate" type="date" class="w-full" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('theme_end_date') }}
            </label>
            <UInput
              v-model="form.endDate"
              type="date"
              class="w-full"
              :min="form.startDate || undefined"
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('theme_navigation_accent') }}
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="form.navigationAccentColor"
              type="color"
              class="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800"
            />
            <UInput
              v-model="form.navigationAccentColor"
              maxlength="7"
              placeholder="#D3E3FD"
              class="w-36"
            />
            <div
              class="flex h-10 flex-1 items-center rounded-full px-4 text-sm font-semibold text-gray-900"
              :style="{ backgroundColor: form.navigationAccentColor }"
            >
              {{ t('theme_navigation_preview') }}
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_navigation_accent_desc') }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div
            class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ t('theme_repeat_yearly') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('theme_repeat_yearly_desc') }}
              </p>
            </div>
            <USwitch v-model="form.repeatYearly" />
          </div>
          <div
            class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ t('theme_enabled') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('theme_enabled_desc') }}</p>
            </div>
            <USwitch v-model="form.isEnabled" />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('theme_priority') }}
          </label>
          <UInput v-model.number="form.priority" type="number" min="0" max="1000" class="w-full" />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_priority_desc') }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('theme_text_position') }}
            </label>
            <USelect
              v-model="form.textPosition"
              :items="textPositionOptions"
              value-key="value"
              label-key="label"
              portal="body"
              :ui="{ content: 'theme-dropdown-content !z-[var(--z-toast)]' }"
              class="w-full"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('theme_text_tone') }}
            </label>
            <USelect
              v-model="form.textTone"
              :items="textToneOptions"
              value-key="value"
              label-key="label"
              portal="body"
              :ui="{ content: 'theme-dropdown-content !z-[var(--z-toast)]' }"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('theme_overlay_strength') }}
            </label>
            <span class="text-xs text-gray-500">{{ form.overlayStrength }}%</span>
          </div>
          <input
            v-model.number="form.overlayStrength"
            type="range"
            min="0"
            max="80"
            step="5"
            class="w-full accent-primary-600"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_overlay_desc') }}
          </p>
        </div>

        <div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('theme_background_width') }}
                </label>
                <span class="text-xs text-gray-500">{{ form.backgroundWidth }}%</span>
              </div>
              <input
                v-model.number="form.backgroundWidth"
                type="range"
                min="50"
                max="200"
                step="5"
                class="w-full accent-primary-600"
              />
            </div>
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('theme_background_height') }}
                </label>
                <span class="text-xs text-gray-500">{{ form.backgroundHeight }}%</span>
              </div>
              <input
                v-model.number="form.backgroundHeight"
                type="range"
                min="50"
                max="200"
                step="5"
                class="w-full accent-primary-600"
              />
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_background_size_desc') }}
          </p>
        </div>

        <div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('theme_banner_width') }}
                </label>
                <span class="text-xs text-gray-500">{{ form.bannerWidth }}%</span>
              </div>
              <input
                v-model.number="form.bannerWidth"
                type="range"
                min="50"
                max="100"
                step="5"
                class="w-full accent-primary-600"
              />
            </div>
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('theme_banner_height') }}
                </label>
                <span class="text-xs text-gray-500">{{ form.bannerHeight }} px</span>
              </div>
              <input
                v-model.number="form.bannerHeight"
                type="range"
                min="160"
                max="500"
                step="8"
                class="w-full accent-primary-600"
              />
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_banner_size_desc') }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('theme_existing_image') }}
          </label>
          <USelect
            v-model="selectedAssetKey"
            :items="assetOptions"
            value-key="value"
            label-key="label"
            portal="body"
            :ui="{ content: 'theme-dropdown-content !z-[var(--z-toast)]' }"
            class="w-full"
          >
            <template #leading>
              <img
                v-if="selectedAssetPreviewUrl"
                :src="selectedAssetPreviewUrl"
                alt=""
                class="size-6 rounded object-cover"
              />
              <UIcon v-else name="i-lucide-upload" class="size-4 text-gray-400" />
            </template>
            <template #item-leading="{ item }">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.label"
                class="size-10 rounded-md border border-gray-200 object-cover dark:border-gray-700"
              />
              <div
                v-else
                class="flex size-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800"
              >
                <UIcon name="i-lucide-upload" class="size-4 text-gray-500" />
              </div>
            </template>
          </USelect>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('theme_existing_image_desc') }}
          </p>
        </div>

        <div>
          <FileUpload
            v-model="files"
            accept="image/png,.png"
            :max-size="5 * 1024 * 1024"
            :label="editingTheme ? t('theme_replace_image') : t('theme_upload_image')"
            :description="t('theme_upload_help')"
            @invalid-files="handleInvalidFiles"
          />
        </div>

        <div v-if="formPreviewUrl">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('theme_final_preview') }}
          </label>
          <div
            class="relative mx-auto overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900"
            :style="getBannerPreviewStyle(form)"
          >
            <img
              :src="formPreviewUrl"
              alt="Preview"
              class="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
              :style="getBackgroundImageStyle(form)"
            />
            <div class="absolute inset-0" :style="getOverlayStyle(form)" />
            <div
              v-if="form.textPosition !== 'hidden'"
              class="absolute inset-0 flex p-5"
              :class="getPositionClass(form.textPosition)"
            >
              <div :class="getTextAlignClass(form.textPosition)">
                <p
                  class="font-bold drop-shadow"
                  :class="form.textTone === 'dark' ? 'text-gray-950' : 'text-white'"
                >
                  Halo, Pengguna
                </p>
                <p
                  class="text-xs drop-shadow"
                  :class="form.textTone === 'dark' ? 'text-gray-800' : 'text-white/90'"
                >
                  {{ t('theme_default_greeting') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t border-gray-200 py-5 dark:border-gray-700">
          <UButton color="neutral" variant="ghost" type="button" @click="showForm = false">
            {{ t('theme_cancel') }}
          </UButton>
          <UButton color="primary" type="submit" :loading="isSaving">
            {{ t('theme_save') }}
          </UButton>
        </div>
      </form>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import type {
  KonfigurasiThemeItem,
  KonfigurasiThemePayload,
  ThemeTextPosition,
  ThemeTextTone,
} from '~/types/konfigurasi';
import { Alert } from '~/composables/useAlert';

const { t } = useI18n();
const toast = useToast();
const { hasPermission, isSuperadmin } = useAuth();
const canUpdate = computed(() => isSuperadmin.value || hasPermission('konfigurasi', 'update'));

const {
  currentTheme,
  themes,
  availableAssets,
  defaultThemeActive,
  isLoadingCurrent,
  isLoadingList,
  isSaving,
  changingManualId,
  deletingId,
  isChangingDefault,
  fetchCurrentTheme,
  fetchThemes,
  fetchThemeAssets,
  fetchDefaultStatus,
  createTheme,
  updateTheme,
  setManualTheme,
  setDefaultTheme,
  deleteTheme,
} = useThemeConfiguration();

const showForm = ref(false);
const editingTheme = ref<KonfigurasiThemeItem | null>(null);
const files = ref<File[]>([]);
const selectedFilePreviewUrl = ref<string | null>(null);
const NEW_IMAGE_OPTION = '__upload_new__';
const selectedAssetKey = ref(NEW_IMAGE_OPTION);
const form = reactive({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  repeatYearly: false,
  isEnabled: true,
  priority: 0,
  textPosition: 'center-left' as ThemeTextPosition,
  textTone: 'light' as ThemeTextTone,
  overlayStrength: 45,
  backgroundWidth: 100,
  backgroundHeight: 100,
  bannerWidth: 100,
  bannerHeight: 256,
  navigationAccentColor: '#D3E3FD',
});

const textPositionOptions = computed(() => [
  { value: 'top-left', label: t('theme_position_top_left') },
  { value: 'top-center', label: t('theme_position_top_center') },
  { value: 'top-right', label: t('theme_position_top_right') },
  { value: 'center-left', label: t('theme_position_center_left') },
  { value: 'center', label: t('theme_position_center') },
  { value: 'center-right', label: t('theme_position_center_right') },
  { value: 'bottom-left', label: t('theme_position_bottom_left') },
  { value: 'bottom-center', label: t('theme_position_bottom_center') },
  { value: 'bottom-right', label: t('theme_position_bottom_right') },
  { value: 'hidden', label: t('theme_position_hidden') },
]);

const textToneOptions = computed(() => [
  { value: 'light', label: t('theme_tone_light') },
  { value: 'dark', label: t('theme_tone_dark') },
]);

const assetOptions = computed(() => [
  { value: NEW_IMAGE_OPTION, label: t('theme_upload_new'), imageUrl: null },
  ...availableAssets.value.map((asset) => ({
    value: asset.key,
    label: asset.name,
    imageUrl: asset.imageUrl,
  })),
]);

const selectedAssetPreviewUrl = computed(
  () =>
    availableAssets.value.find((asset) => asset.key === selectedAssetKey.value)?.imageUrl || null
);

const formPreviewUrl = computed(
  () =>
    selectedFilePreviewUrl.value ||
    selectedAssetPreviewUrl.value ||
    editingTheme.value?.imageUrl ||
    null
);

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    repeatYearly: false,
    isEnabled: true,
    priority: 0,
    textPosition: 'center-left',
    textTone: 'light',
    overlayStrength: 45,
    backgroundWidth: 100,
    backgroundHeight: 100,
    bannerWidth: 100,
    bannerHeight: 256,
    navigationAccentColor: '#D3E3FD',
  });
  selectedAssetKey.value = NEW_IMAGE_OPTION;
  files.value = [];
};

const openCreate = () => {
  editingTheme.value = null;
  resetForm();
  showForm.value = true;
};

const openEdit = (theme: KonfigurasiThemeItem) => {
  editingTheme.value = theme;
  Object.assign(form, {
    name: theme.name,
    description: theme.description || '',
    startDate: theme.startDate || '',
    endDate: theme.endDate || '',
    repeatYearly: theme.repeatYearly,
    isEnabled: theme.isEnabled,
    priority: theme.priority,
    textPosition: theme.textPosition || 'center-left',
    textTone: theme.textTone || 'light',
    overlayStrength: theme.overlayStrength ?? 45,
    backgroundWidth: theme.backgroundWidth ?? 100,
    backgroundHeight: theme.backgroundHeight ?? 100,
    bannerWidth: theme.bannerWidth ?? 100,
    bannerHeight: theme.bannerHeight ?? 256,
    navigationAccentColor: theme.navigationAccentColor || '#D3E3FD',
  });
  selectedAssetKey.value = theme.imageKey;
  files.value = [];
  showForm.value = true;
};

const submitForm = async () => {
  if (!form.name.trim()) {
    toast.add({
      title: t('theme_validation_title'),
      description: t('theme_name_required'),
      color: 'error',
    });
    return;
  }
  if (
    !editingTheme.value &&
    files.value.length === 0 &&
    selectedAssetKey.value === NEW_IMAGE_OPTION
  ) {
    toast.add({
      title: t('theme_validation_title'),
      description: t('theme_image_required'),
      color: 'error',
    });
    return;
  }
  if (form.endDate && !form.startDate) {
    toast.add({
      title: t('theme_validation_title'),
      description: t('theme_start_required'),
      color: 'error',
    });
    return;
  }
  if (!form.repeatYearly && form.startDate && form.endDate && form.endDate < form.startDate) {
    toast.add({
      title: t('theme_validation_title'),
      description: t('theme_date_invalid'),
      color: 'error',
    });
    return;
  }
  if (!/^#[0-9a-f]{6}$/i.test(form.navigationAccentColor)) {
    toast.add({
      title: t('theme_validation_title'),
      description: t('theme_navigation_color_invalid'),
      color: 'error',
    });
    return;
  }

  const payload: KonfigurasiThemePayload = {
    name: form.name.trim(),
    description: form.description.trim(),
    start_date: form.startDate || undefined,
    end_date: form.endDate || undefined,
    repeat_yearly: form.repeatYearly,
    is_enabled: form.isEnabled,
    priority: Number(form.priority) || 0,
    text_position: form.textPosition,
    text_tone: form.textTone,
    overlay_strength: Number(form.overlayStrength),
    background_width: Number(form.backgroundWidth),
    background_height: Number(form.backgroundHeight),
    banner_width: Number(form.bannerWidth),
    banner_height: Number(form.bannerHeight),
    navigation_accent_color: form.navigationAccentColor.toUpperCase(),
    image_key: selectedAssetKey.value === NEW_IMAGE_OPTION ? undefined : selectedAssetKey.value,
    image: files.value[0],
  };

  try {
    if (editingTheme.value) await updateTheme(editingTheme.value.id, payload);
    else await createTheme(payload);
    toast.add({ title: t('theme_success'), description: t('theme_saved'), color: 'success' });
    showForm.value = false;
  } catch (error: any) {
    toast.add({
      title: t('theme_failed'),
      description: error?.response?.data?.message || t('theme_save_failed'),
      color: 'error',
    });
  }
};

const activateDefault = async () => {
  try {
    await setDefaultTheme(true);
    toast.add({
      title: t('theme_success'),
      description: t('theme_default_activated'),
      color: 'success',
    });
  } catch (error: any) {
    toast.add({
      title: t('theme_failed'),
      description: error?.response?.data?.message || t('theme_manual_failed'),
      color: 'error',
    });
  }
};

const getPositionClass = (position: ThemeTextPosition) => {
  const vertical = position.startsWith('top')
    ? 'items-start'
    : position.startsWith('bottom')
      ? 'items-end'
      : 'items-center';
  const horizontal = position.endsWith('left')
    ? 'justify-start'
    : position.endsWith('right')
      ? 'justify-end'
      : 'justify-center';
  return `${vertical} ${horizontal}`;
};

const getTextAlignClass = (position: ThemeTextPosition) =>
  position.endsWith('right')
    ? 'text-right'
    : position.endsWith('center') || position === 'center'
      ? 'text-center'
      : 'text-left';

const getOverlayStyle = (theme: {
  textPosition: ThemeTextPosition;
  textTone: ThemeTextTone;
  overlayStrength: number;
}) => {
  if (theme.textPosition === 'hidden' || theme.overlayStrength <= 0) return {};
  const alpha = Math.min(80, Math.max(0, theme.overlayStrength)) / 100;
  const color = theme.textTone === 'dark' ? '255,255,255' : '0,0,0';
  const direction = theme.textPosition.endsWith('right')
    ? 'to left'
    : theme.textPosition.endsWith('left')
      ? 'to right'
      : 'to bottom';
  return {
    background: `linear-gradient(${direction}, rgba(${color},${alpha}), rgba(${color},0))`,
  };
};

const getBackgroundImageStyle = (theme: {
  backgroundWidth?: number;
  backgroundHeight?: number;
}) => ({
  width: `${Math.min(200, Math.max(50, theme.backgroundWidth ?? 100))}%`,
  height: `${Math.min(200, Math.max(50, theme.backgroundHeight ?? 100))}%`,
});

const getBannerPreviewStyle = (theme: { bannerWidth?: number; bannerHeight?: number }) => ({
  width: `${Math.min(100, Math.max(50, theme.bannerWidth ?? 100))}%`,
  height: `${Math.round(Math.min(500, Math.max(160, theme.bannerHeight ?? 256)) / 2)}px`,
});

watch(files, (value) => {
  if (selectedFilePreviewUrl.value) URL.revokeObjectURL(selectedFilePreviewUrl.value);
  selectedFilePreviewUrl.value = value[0] ? URL.createObjectURL(value[0]) : null;
  if (value[0]) selectedAssetKey.value = NEW_IMAGE_OPTION;
});

watch(selectedAssetKey, (value) => {
  if (value !== NEW_IMAGE_OPTION && files.value.length) files.value = [];
});

const toggleManual = async (theme: KonfigurasiThemeItem) => {
  try {
    await setManualTheme(theme.id, !theme.manualOverride);
    toast.add({
      title: t('theme_success'),
      description: t('theme_manual_updated'),
      color: 'success',
    });
  } catch (error: any) {
    toast.add({
      title: t('theme_failed'),
      description: error?.response?.data?.message || t('theme_manual_failed'),
      color: 'error',
    });
  }
};

const confirmDelete = async (theme: KonfigurasiThemeItem) => {
  const confirmed = await Alert.confirm(
    t('theme_delete_title'),
    t('theme_delete_desc', { name: theme.name }),
    t('theme_delete'),
    t('theme_cancel'),
    true
  );
  if (!confirmed) return;
  try {
    await deleteTheme(theme.id);
    toast.add({ title: t('theme_success'), description: t('theme_deleted'), color: 'success' });
  } catch (error: any) {
    toast.add({
      title: t('theme_failed'),
      description: error?.response?.data?.message || t('theme_delete_failed'),
      color: 'error',
    });
  }
};

const handleInvalidFiles = () => {
  toast.add({
    title: t('theme_validation_title'),
    description: t('theme_image_invalid'),
    color: 'error',
  });
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));

const formatSchedule = (theme: KonfigurasiThemeItem) => {
  const start = formatDate(theme.startDate!);
  const end =
    theme.endDate && theme.endDate !== theme.startDate ? ` – ${formatDate(theme.endDate)}` : '';
  return `${start}${end}${theme.repeatYearly ? ` · ${t('theme_every_year')}` : ''}`;
};

onMounted(() =>
  Promise.all([fetchThemes(), fetchCurrentTheme(), fetchDefaultStatus(), fetchThemeAssets()])
);

onBeforeUnmount(() => {
  if (selectedFilePreviewUrl.value) URL.revokeObjectURL(selectedFilePreviewUrl.value);
});
</script>

<style>
.theme-dropdown-content {
  z-index: 10002 !important;
}
</style>
