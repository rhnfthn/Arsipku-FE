<script setup lang="ts">
import { CalendarClock, GripVertical, Archive, Lock } from 'lucide-vue-next';
import type { TugasTask } from '~/types/tugas';

const props = defineProps<{
  task: TugasTask;
  isMoving: boolean;
  canMove: boolean;
  canArchive: boolean;
  readOnly: boolean;
  todayJakarta: string;
}>();

const emit = defineEmits<{
  (e: 'open', task: TugasTask): void;
  (e: 'archive', task: TugasTask): void;
  (e: 'drop-before', taskId: string, beforeTaskId: string): void;
}>();

const { t } = useI18n();

const isOverdue = computed(
  () =>
    Boolean(props.task.tenggat) &&
    props.task.status !== 'done' &&
    (props.task.tenggat ?? '') < props.todayJakarta
);

const prioritasClass = computed(() => {
  switch (props.task.prioritas) {
    case 'tinggi':
      return 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'sedang':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'rendah':
      return 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    default:
      return '';
  }
});

const onDragStart = (event: DragEvent) => {
  if (!props.canMove) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData('text/tugas-task-id', props.task.id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDropBefore = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const taskId = event.dataTransfer?.getData('text/tugas-task-id');
  if (taskId && taskId !== props.task.id) {
    emit('drop-before', taskId, props.task.id);
  }
};

const initials = (nama: string) => {
  if (!nama) return '?';
  const parts = nama.trim().split(' ');
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};
</script>

<template>
  <div
    :draggable="canMove"
    class="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    :class="[
      isMoving ? 'opacity-50' : '',
      isOverdue ? 'border-l-4 border-l-red-500' : '',
      canMove ? 'active:cursor-grabbing' : '',
    ]"
    :data-task-id="task.id"
    @dragstart="onDragStart"
    @dragover.prevent
    @drop="onDropBefore"
    @click="emit('open', task)"
  >
    <!-- Grip drag handle -->
    <GripVertical
      v-if="canMove"
      class="absolute -left-0.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 cursor-grab text-gray-300 group-hover:block dark:text-gray-600"
    />

    <div class="flex items-start justify-between gap-2">
      <p
        class="line-clamp-2 flex-1 text-[13px] font-medium leading-snug text-gray-900 dark:text-white"
      >
        {{ task.judul }}
      </p>
      <button
        v-if="canArchive && task.status === 'done' && !task.archivedAt"
        class="shrink-0 text-gray-300 opacity-0 transition-opacity hover:text-gray-600 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-gray-300"
        :aria-label="t('tugas_arsip_task')"
        :title="t('tugas_arsip_task')"
        @click.stop="emit('archive', task)"
      >
        <Archive class="h-3.5 w-3.5" />
      </button>
      <UTooltip v-else-if="readOnly" :text="t('tugas_task_readonly_desc')">
        <Lock class="h-3.5 w-3.5 shrink-0 text-amber-500" />
      </UTooltip>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        v-if="task.prioritas"
        class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
        :class="prioritasClass"
      >
        {{ t(`tugas_prioritas_${task.prioritas}`) }}
      </span>
      <span
        v-if="task.tenggat"
        class="inline-flex items-center gap-1 text-[11px]"
        :class="
          isOverdue
            ? 'font-semibold text-red-600 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400'
        "
      >
        <CalendarClock class="h-3 w-3" />
        {{ task.tenggat }}
      </span>
    </div>

    <!-- Assignee -->
    <div v-if="task.assignee" class="mt-2.5 flex items-center gap-1.5">
      <span
        class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
        :title="`${task.assignee.nama} — ${task.assignee.positionText ?? ''}`"
      >
        {{ initials(task.assignee.nama) }}
      </span>
      <span class="max-w-[140px] truncate text-[11px] text-gray-500 dark:text-gray-400">
        {{ task.assignee.nama }}
      </span>
    </div>
  </div>
</template>
