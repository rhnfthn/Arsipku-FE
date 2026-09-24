<template>
  <div ref="root" class="relative shrink-0">
    <button
      type="button"
      class="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
      @keydown.esc="open = false"
    >
      <span class="whitespace-nowrap">{{ selectedLabel }}</span>
      <ChevronDown
        class="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-150 dark:text-gray-300"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <Transition name="audit-filter-dropdown">
      <div
        v-if="open"
        class="absolute left-0 top-full z-[80] mt-1 min-w-full w-max max-w-none overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-xl shadow-gray-900/10 dark:border-gray-600 dark:bg-gray-800 dark:shadow-black/30"
        role="listbox"
        :aria-label="ariaLabel"
      >
        <button
          v-for="option in options"
          :key="option.value || '__all__'"
          type="button"
          role="option"
          :aria-selected="(modelValue || '') === option.value"
          class="block w-full rounded-md px-3 py-2 text-left text-xs transition-colors"
          :class="(modelValue || '') === option.value
            ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20 dark:text-primary-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'"
          @click="selectOption(option.value)"
        >
          <span class="block whitespace-nowrap">{{ option.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

interface FilterOption {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue?: string | null;
  options: FilterOption[];
  ariaLabel: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);

const selectedLabel = computed(() => {
  return props.options.find((option) => option.value === (props.modelValue || ''))?.label || props.options[0]?.label || '';
});

const selectOption = (value: string) => {
  emit('update:modelValue', value);
  open.value = false;
};

const closeOnOutsideClick = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false;
};

onMounted(() => document.addEventListener('click', closeOnOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick));
</script>

<style scoped>
.audit-filter-dropdown-enter-active,
.audit-filter-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.audit-filter-dropdown-enter-from,
.audit-filter-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
