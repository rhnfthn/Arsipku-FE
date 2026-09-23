<template>
  <div
    :class="
      layout === 'row'
        ? 'relative flex flex-col gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0'
        : 'relative space-y-2'
    "
  >
    <span
      v-if="label"
      :class="
        layout === 'row'
          ? 'mt-0 w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-1.5 sm:w-40'
          : 'block text-sm font-medium text-gray-700 dark:text-gray-300'
      "
    >
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </span>
    <div class="relative w-full">
      <ClientOnly>
        <UPopover
          v-model:open="open"
          :disabled="disabled"
          :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
          :ui="{ content: 'z-[var(--z-toast)]' }"
        >
          <div
            class="flex w-full items-center gap-2"
            :class="[
              layout === 'row'
                ? 'cursor-pointer pr-2'
                : 'h-9 rounded-lg border border-gray-200 bg-white px-3 shadow-sm transition-colors dark:border-gray-600 dark:bg-gray-700',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ]"
            @click="openCalendar"
          >
            <UInputDate
              v-model="model"
              locale="id-ID"
              variant="none"
              size="sm"
              :format="displayFormat"
              :disabled="disabled"
              class="min-w-0 flex-1"
              :ui="{
                base: '!h-8 !bg-transparent !px-0 !text-sm !ring-0 pointer-events-none inline-flex items-center',
              }"
            />
            <UIcon name="i-lucide-calendar" class="mr-0.5 size-4 shrink-0 text-gray-400" />
          </div>
          <template #content>
            <UCalendar
              v-model="model"
              :min-value="minValue ?? undefined"
              :max-value="maxValue ?? undefined"
              class="p-2"
              @update:model-value="open = false"
            />
          </template>
        </UPopover>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone, today } from '@internationalized/date';

const props = withDefaults(
  defineProps<{
    label?: string;
    required?: boolean;
    displayFormat?: string;
    minValue?: CalendarDate | null;
    maxValue?: CalendarDate | null;
    disabled?: boolean;
    layout?: 'row' | 'field';
  }>(),
  {
    label: 'Tanggal Surat',
    required: false,
    displayFormat: 'DD MMMM YYYY',
    minValue: null,
    maxValue: () => today(getLocalTimeZone()),
    disabled: false,
    layout: 'row',
  }
);

// Model ini akan menerima variable 'date' dari parent (CalendarDate object)
const model = defineModel<CalendarDate | null>();
const open = ref(false);

const openCalendar = () => {
  if (!props.disabled) open.value = true;
};
</script>
