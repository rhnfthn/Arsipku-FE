<script setup lang="ts">
import { CircleDashed, LoaderCircle, CircleCheckBig, Plus } from 'lucide-vue-next';
import type { TugasTask, TugasTaskStatus } from '~/types/tugas';

const props = defineProps<{
  status: TugasTaskStatus;
  title: string;
  tasks: TugasTask[];
  canCreateTask: boolean;
  isMovingTask: boolean;
}>();

const emit = defineEmits<{
  (e: 'open-task', task: TugasTask): void;
  (e: 'create-task', status: TugasTaskStatus): void;
  (e: 'drop-task', taskId: string, status: TugasTaskStatus): void;
}>();

const { t } = useI18n();

const statusConfig: Record<
  TugasTaskStatus,
  { icon: typeof CircleDashed; iconClass: string; badgeClass: string }
> = {
  todo: {
    icon: CircleDashed,
    iconClass: 'text-gray-400',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  },
  in_progress: {
    icon: LoaderCircle,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  done: {
    icon: CircleCheckBig,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
};

const config = computed(() => statusConfig[props.status]);

// ─── Drag & drop (HTML5 native) ───────────────────────────────────────────────

const isDragOver = ref(false);
const isDropTarget = ref(false);

const onDragOver = (event: DragEvent) => {
  if (!event.dataTransfer) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  const taskId = event.dataTransfer?.getData('text/tugas-task-id');
  if (taskId) {
    emit('drop-task', taskId, props.status);
  }
};
</script>

<template>
  <div
    class="flex h-[clamp(22rem,58vh,40rem)] min-h-0 w-full flex-col rounded-2xl border border-gray-200 bg-gray-50/60 transition-colors dark:border-gray-700 dark:bg-gray-800/40"
    :class="isDragOver ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20' : ''"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Header kolom -->
    <div class="flex items-center justify-between gap-2 px-4 py-3">
      <div class="flex items-center gap-2">
        <component :is="config.icon" :class="['h-4 w-4', config.iconClass]" />
        <span class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </span>
        <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" :class="config.badgeClass">
          {{ tasks.length }}
        </span>
      </div>
      <UButton
        v-if="canCreateTask && status === 'todo'"
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="t('tugas_tambah_task')"
        @click="emit('create-task', status)"
      />
    </div>

    <!-- List task: scroll internal saat task banyak -->
    <div class="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3 pr-2">
      <slot />
      <div
        v-if="tasks.length === 0"
        class="flex items-center justify-center rounded-xl border border-dashed border-gray-300 py-8 text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500"
        @dragover.prevent
        @drop.prevent
      >
        {{ t('tugas_task_kosong') }}
      </div>
    </div>
  </div>
</template>
