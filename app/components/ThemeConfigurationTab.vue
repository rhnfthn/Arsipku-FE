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
      class="mb-6 overflow-hidden rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30"
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
        <img
          :src="currentTheme.imageUrl"
          :alt="currentTheme.name"
          class="h-28 w-full rounded-lg object-cover"
        />
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
    <EmptyState
      v-else-if="themes.length === 0"
      icon="i-lucide-image-off"
      :title="t('theme_empty_title')"
      :description="t('theme_empty_desc')"
    />
    <div v-else class="grid gap-4 md:grid-cols-2">
      <article
        v-for="theme in themes"
        :key="theme.id"
        class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="relative h-40 bg-gray-100 dark:bg-gray-900">
          <img :src="theme.imageUrl" :alt="theme.name" class="h-full w-full object-cover" />
          <div class="absolute left-3 top-3 flex flex-wrap gap-2">
            <UBadge v-if="theme.manualOverride" color="warning" variant="solid">
              {{ t('theme_manual_active') }}
            </UBadge>
            <UBadge :color="theme.isEnabled ? 'success' : 'neutral'" variant="solid">
              {{ theme.isEnabled ? t('theme_enabled') : t('theme_disabled') }}
            </UBadge>
          </div>
        </div>

        <div class="p-4">
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

          <div v-if="canUpdate" class="mt-4 flex flex-wrap items-center justify-between gap-2">
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

        <div>
          <FileUpload
            v-model="files"
            accept="image/png,.png"
            :max-size="5 * 1024 * 1024"
            :label="editingTheme ? t('theme_replace_image') : t('theme_upload_image')"
            :description="t('theme_upload_help')"
            @invalid-files="handleInvalidFiles"
          />
          <img
            v-if="editingTheme && files.length === 0"
            :src="editingTheme.imageUrl"
            :alt="editingTheme.name"
            class="mt-3 h-28 w-full rounded-lg object-cover"
          />
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
import type { KonfigurasiThemeItem, KonfigurasiThemePayload } from '~/types/konfigurasi';
import { Alert } from '~/composables/useAlert';

const { t } = useI18n();
const toast = useToast();
const { hasPermission, isSuperadmin } = useAuth();
const canUpdate = computed(() => isSuperadmin.value || hasPermission('konfigurasi', 'update'));

const {
  currentTheme,
  themes,
  isLoadingCurrent,
  isLoadingList,
  isSaving,
  changingManualId,
  deletingId,
  fetchCurrentTheme,
  fetchThemes,
  createTheme,
  updateTheme,
  setManualTheme,
  deleteTheme,
} = useThemeConfiguration();

const showForm = ref(false);
const editingTheme = ref<KonfigurasiThemeItem | null>(null);
const files = ref<File[]>([]);
const form = reactive({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  repeatYearly: false,
  isEnabled: true,
  priority: 0,
});

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    repeatYearly: false,
    isEnabled: true,
    priority: 0,
  });
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
  });
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
  if (!editingTheme.value && files.value.length === 0) {
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

  const payload: KonfigurasiThemePayload = {
    name: form.name.trim(),
    description: form.description.trim(),
    start_date: form.startDate || undefined,
    end_date: form.endDate || undefined,
    repeat_yearly: form.repeatYearly,
    is_enabled: form.isEnabled,
    priority: Number(form.priority) || 0,
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

onMounted(() => Promise.all([fetchThemes(), fetchCurrentTheme()]));
</script>
