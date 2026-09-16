<script setup lang="ts">
import {
  KanbanSquare,
  Rocket,
  Briefcase,
  Target,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  Presentation,
  Megaphone,
  HeartPulse,
  GraduationCap,
  Plane,
  Wrench,
  Banknote,
  FileStack,
  Lightbulb,
  PartyPopper,
  Building2,
} from 'lucide-vue-next';

/**
 * Icon picker papan Tugas — grid ikon lucide yang bisa dipilih.
 * Nilai tersimpan sebagai slug (mis. 'rocket') di kolom tugas_board.icon.
 */
const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const { t } = useI18n();

const iconOptions = [
  { value: null, label: 'Default', component: KanbanSquare },
  { value: 'rocket', label: 'Proyek', component: Rocket },
  { value: 'briefcase', label: 'Kerja', component: Briefcase },
  { value: 'target', label: 'Target', component: Target },
  { value: 'calendar-days', label: 'Agenda', component: CalendarDays },
  { value: 'clipboard-list', label: 'Checklist', component: ClipboardList },
  { value: 'folder-kanban', label: 'Arsip', component: FolderKanban },
  { value: 'presentation', label: 'Laporan', component: Presentation },
  { value: 'megaphone', label: 'Publikasi', component: Megaphone },
  { value: 'heart-pulse', label: 'Kesehatan', component: HeartPulse },
  { value: 'graduation-cap', label: 'Pelatihan', component: GraduationCap },
  { value: 'plane', label: 'Perjalanan', component: Plane },
  { value: 'wrench', label: 'Perbaikan', component: Wrench },
  { value: 'banknote', label: 'Keuangan', component: Banknote },
  { value: 'file-stack', label: 'Dokumen', component: FileStack },
  { value: 'lightbulb', label: 'Ide', component: Lightbulb },
  { value: 'party-popper', label: 'Acara', component: PartyPopper },
  { value: 'building-2', label: 'Organisasi', component: Building2 },
];

const select = (value: string | null) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="grid grid-cols-9 gap-1.5">
    <button
      v-for="icon in iconOptions"
      :key="icon.value ?? 'default'"
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg border transition-all"
      :class="
        (modelValue ?? null) === icon.value
          ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-400'
          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-500 dark:hover:text-gray-300'
      "
      :title="icon.label"
      :aria-label="icon.label"
      @click="select(icon.value)"
    >
      <component :is="icon.component" class="h-4 w-4" />
    </button>
  </div>
</template>
