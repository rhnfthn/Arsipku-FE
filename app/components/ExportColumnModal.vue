<template>
  <Teleport to="body">
    <Modal
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      size="lg"
      :hide-default-footer="true"
    >
      <template #title>
        <div class="ml-5 my-3.5">
          <Heading
            variant="heading8b"
            class="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight"
          >
            {{ title || t('pilih_kolom_export') || 'Pilih Kolom Export' }}
          </Heading>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ description || 'Sesuaikan kolom data yang akan diekspor ke format Excel (.xlsx)' }}
          </p>
        </div>
      </template>

      <div class="space-y-3.5 py-1">
        <!-- Selection Status Bar & Toggle All -->
        <div
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-750/60 border border-gray-200/80 dark:border-gray-700/80 text-xs"
        >
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center justify-center font-semibold px-2.5 py-0.5 rounded-full text-xs transition-colors"
              :class="
                selectedColumns.length > 0
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              "
            >
              {{ selectedColumns.length }} / {{ columns.length }}
            </span>
            <span class="text-gray-600 dark:text-gray-300 font-medium">
              Kolom Terpilih
            </span>
          </div>

          <button
            type="button"
            @click="toggleAll"
            class="font-medium px-2.5 py-1 rounded-lg text-xs transition-colors"
            :class="
              allSelected
                ? 'text-primary hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
            "
          >
            {{ allSelected ? 'Batal Pilih Semua' : (t('pilih_semua') || 'Pilih Semua') }}
          </button>
        </div>

        <!-- Cards Grid -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 -mr-1"
        >
          <div
            v-for="col in columns"
            :key="col.key"
            @click="toggleColumn(col.key)"
            class="group relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none"
            :class="
              selectedColumns.includes(col.key)
                ? 'border-primary-500/80 bg-primary-50/60 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 shadow-sm ring-1 ring-primary-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/70 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'
            "
          >
            <div class="flex items-center gap-3 min-w-0 w-full">
              <!-- Checkmark Box -->
              <div
                class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 flex-shrink-0"
                :class="
                  selectedColumns.includes(col.key)
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-gray-400'
                "
              >
                <Check v-if="selectedColumns.includes(col.key)" class="w-3 h-3 stroke-[3]" />
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold truncate leading-tight">
                  {{ col.label }}
                </p>
                <p
                  v-if="col.desc"
                  class="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5"
                >
                  {{ col.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Notice -->
        <div
          class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1 pt-0.5"
        >
          <span>
            Format: <span class="font-medium text-gray-700 dark:text-gray-300">Microsoft Excel (.xlsx)</span>
          </span>
          <span v-if="totalRows !== undefined">
            Total: <span class="font-semibold text-gray-700 dark:text-gray-200">{{ totalRows }} baris</span>
          </span>
        </div>
      </div>

      <template #footer>
        <div
          class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0 gap-3 px-5 py-3 mt-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl"
        >
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
          >
            {{ t('batal') || 'Batal' }}
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="selectedColumns.length === 0 || isExporting"
            class="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <FileDown v-if="!isExporting" class="w-3.5 h-3.5" />
            <div
              v-else
              class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
            <span>{{ isExporting ? 'Mengekspor...' : 'Export Excel' }}</span>
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Check, FileDown } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

export interface ExportColumnItem {
  key: string;
  label: string;
  desc?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    columns: ExportColumnItem[];
    totalRows?: number;
    title?: string;
    description?: string;
    isExporting?: boolean;
    defaultSelected?: string[];
  }>(),
  {
    totalRows: 0,
    isExporting: false,
    title: '',
    description: '',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [selectedKeys: string[]];
}>();

const { t } = useI18n();

const selectedColumns = ref<string[]>([]);

// Inisialisasi kolom terpilih saat modal dibuka
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.defaultSelected && props.defaultSelected.length > 0) {
        selectedColumns.value = [...props.defaultSelected];
      } else {
        selectedColumns.value = props.columns.map((c) => c.key);
      }
    }
  },
  { immediate: true }
);

const allSelected = computed(
  () =>
    selectedColumns.value.length === props.columns.length &&
    props.columns.length > 0
);

const toggleAll = () => {
  if (allSelected.value) {
    selectedColumns.value = [];
  } else {
    selectedColumns.value = props.columns.map((c) => c.key);
  }
};

const toggleColumn = (key: string) => {
  const index = selectedColumns.value.indexOf(key);
  if (index > -1) {
    selectedColumns.value.splice(index, 1);
  } else {
    selectedColumns.value.push(key);
  }
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleConfirm = () => {
  if (selectedColumns.value.length === 0) return;
  emit('confirm', [...selectedColumns.value]);
};
</script>
