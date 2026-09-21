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

const { t, locale } = useI18n();

const isOverdue = computed(
  () =>
    Boolean(props.task.tenggat) &&
    props.task.status !== 'done' &&
    (props.task.tenggat ?? '') < props.todayJakarta
);

const isDueToday = computed(
  () =>
    Boolean(props.task.tenggat) &&
    props.task.status !== 'done' &&
    props.task.tenggat === props.todayJakarta
);

const formattedDeadline = computed(() => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(props.task.tenggat ?? '');
  if (!match) return props.task.tenggat ?? '';
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
});

const deadlineClass = computed(() => {
  if (isOverdue.value) {
    return 'border-red-200 bg-red-50 font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-300';
  }
  if (isDueToday.value) {
    return 'border-amber-200 bg-amber-50 font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300';
});

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

    <p
      v-if="task.deskripsi"
      class="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"
    >
      {{ task.deskripsi }}
    </p>

    <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span
        v-if="task.prioritas"
        class="rounded-full px-2 py-1 text-[10px] font-semibold"
        :class="prioritasClass"
      >
        {{ t(`tugas_prioritas_${task.prioritas}`) }}
      </span>
      <span
        v-if="task.tenggat"
        class="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px]"
        :class="deadlineClass"
        :title="`${t('tugas_tenggat')}: ${formattedDeadline}`"
      >
        <CalendarClock class="h-3 w-3" />
        <span v-if="isOverdue">{{ t('tugas_scope_terlambat') }} · </span>
        <span v-else-if="isDueToday">{{ t('tugas_scope_hari_ini') }} · </span>
        {{ formattedDeadline }}
      </span>
    </div>

    <!-- Assignee -->
    <div
      v-if="task.assignee"
      class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-700"
    >
      <ProfileAvatar
        size="2xs"
        :persnum="task.assignee.persnum"
        :alt="task.assignee.nama"
        avatar-class="bg-primary-100 text-[9px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
        :title="`${task.assignee.nama} — ${task.assignee.positionText ?? ''}`"
      >
        {{ initials(task.assignee.nama) }}
      </ProfileAvatar>
      <div class="min-w-0 flex-1">
        <span class="block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          {{ t('tugas_pic') }}
        </span>
        <span class="block truncate text-[11px] font-medium text-gray-600 dark:text-gray-300">
          {{ task.assignee.nama }}
        </span>
      </div>
    </div>
  </div>
</template>
