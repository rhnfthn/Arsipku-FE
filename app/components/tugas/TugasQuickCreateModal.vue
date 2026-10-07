<script setup lang="ts">
import { parseDate, today, type CalendarDate } from '@internationalized/date';
import { FileText, KanbanSquare } from 'lucide-vue-next';
import TulisInputTanggal from '~/components/Tulis/InputTanggal.vue';
import type { TugasReferenceType, TugasTaskPriority } from '~/types/tugas';

/**
 * TugasQuickCreateModal — modal reusable untuk aksi "Buat Tugas" dari
 * konteks naskah (Kotak Masuk/Disposisi/Terkirim).
 *
 * - Menerima konteks reference (type + id + label awal untuk judul).
 * - Memuat papan personal yang dapat ditulisi user.
 * - Judul awal terisi dari nomor/perihal; user bisa mengubah sebelum simpan.
 * - Reference disimpan server-side (route/label dibentuk backend).
 */
const props = defineProps<{
  modelValue: boolean;
  referenceType: TugasReferenceType;
  referenceId: string;
  referenceLabel: string; // nomor/perihal untuk prefill judul
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', task: { id: string; boardId: string }): void;
}>();

const { t } = useI18n();
const toast = useToast();
const { hasPermission } = useAuth();
const { boards, boardDetails, fetchBoards, fetchBoardDetail, createTask, mapTugasError } =
  useTugas();

const form = ref({
  boardId: '',
  judul: '',
  prioritas: null as TugasTaskPriority | null,
  tenggat: '',
  assigneeMemberId: null as string | null,
});

const isSaving = ref(false);
const isLoadingBoards = ref(false);

const canCreateTask = computed(() => hasPermission('tugas', 'create-task'));
const boardMembers = computed(() => boardDetails.value[form.value.boardId]?.members ?? []);
const NO_PRIORITY = '__NO_PRIORITY__';
const NO_PIC = '__NO_PIC__';
const minimumDeadline = computed(() => today('Asia/Jakarta'));
const deadlineDate = computed<CalendarDate | null>({
  get: () => {
    if (!form.value.tenggat) return null;
    try {
      return parseDate(form.value.tenggat);
    } catch {
      return null;
    }
  },
  set: (value) => {
    form.value.tenggat = value?.toString() ?? '';
  },
});

const boardOptions = computed(() =>
  boards.value
    .filter((board) => board.tipe === 'personal')
    .map((board) => ({
      label: board.nama,
      value: board.id,
      icon: 'i-lucide-kanban',
    }))
);
const priorityOptions = computed(() => [
  { label: t('tugas_tanpa_prioritas'), value: NO_PRIORITY, icon: 'i-lucide-minus' },
  { label: t('tugas_prioritas_tinggi'), value: 'tinggi', icon: 'i-lucide-chevrons-up' },
  { label: t('tugas_prioritas_sedang'), value: 'sedang', icon: 'i-lucide-equal' },
  { label: t('tugas_prioritas_rendah'), value: 'rendah', icon: 'i-lucide-chevrons-down' },
]);
const assigneeOptions = computed(() => [
  { label: t('tugas_tanpa_assignee'), value: NO_PIC },
  ...boardMembers.value.map((member) => ({
    label: member.positionText ? `${member.nama} — ${member.positionText}` : member.nama,
    value: member.id,
  })),
]);

const selectedPriority = computed({
  get: () => form.value.prioritas ?? NO_PRIORITY,
  set: (value: string) => {
    form.value.prioritas = value === NO_PRIORITY ? null : (value as TugasTaskPriority);
  },
});
const selectedAssignee = computed({
  get: () => form.value.assigneeMemberId ?? NO_PIC,
  set: (value: string) => {
    form.value.assigneeMemberId = value === NO_PIC ? null : value;
  },
});
const selectedAssigneeMember = computed(() =>
  boardMembers.value.find((member) => member.id === form.value.assigneeMemberId)
);

const close = () => emit('update:modelValue', false);
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    form.value = {
      boardId: '',
      judul: props.referenceLabel.slice(0, 255),
      prioritas: null,
      tenggat: minimumDeadline.value.toString(),
      assigneeMemberId: null,
    };
    if (!boards.value.length) {
      isLoadingBoards.value = true;
      try {
        await fetchBoards({ limit: 100 });
      } finally {
        isLoadingBoards.value = false;
      }
    }
    // Tautan naskah hanya boleh masuk papan personal.
    if (!form.value.boardId && boardOptions.value.length) {
      form.value.boardId = boardOptions.value[0]!.value;
    }
  }
);

watch(
  () => form.value.boardId,
  async (boardId) => {
    form.value.assigneeMemberId = null;
    if (!props.modelValue || !boardId || boardDetails.value[boardId]) return;
    try {
      await fetchBoardDetail(boardId);
    } catch {
      // Pembuatan task tetap dapat dilanjutkan tanpa assignee.
    }
  }
);

const save = async () => {
  if (
    !canCreateTask.value ||
    isSaving.value ||
    !boardOptions.value.some((board) => board.value === form.value.boardId) ||
    !form.value.judul.trim()
  )
    return;
  isSaving.value = true;
  try {
    const res = await createTask(form.value.boardId, {
      judul: form.value.judul.trim(),
      prioritas: form.value.prioritas,
      tenggat: form.value.tenggat || null,
      assigneeMemberId: form.value.assigneeMemberId,
      referenceType: props.referenceType,
      referenceId: props.referenceId,
    });
    const created = (res as { data?: { id: string; boardId: string } }).data;
    toast.add({ title: t('tugas_task_berhasil_dibuat'), color: 'success' });
    close();
    if (created) emit('created', created);
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <Modal v-model="isOpen" size="md" :saving="isSaving" :hide-default-footer="true">
    <template #title>
      <div class="flex items-center gap-3 px-5 pb-3 pt-4">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
        >
          <KanbanSquare class="h-5 w-5" />
        </span>
        <div>
          <Heading variant="heading9sb" as="h3" class="text-gray-900 dark:text-white">
            {{ t('tugas_buat_dari_naskah') }}
          </Heading>
          <Paragraph variant="body3" class="mt-0.5 text-gray-500 dark:text-gray-400">
            {{ t('tugas_tambah_task_desc') }}
          </Paragraph>
        </div>
      </div>
    </template>

    <div class="space-y-4 pb-1">
      <!-- Konteks referensi (read-only) -->
      <div
        class="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/70 p-3 dark:border-primary-900/60 dark:bg-primary-900/20"
      >
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400"
        >
          <FileText class="h-4 w-4" />
        </span>
        <div class="min-w-0">
          <Paragraph variant="caption2m" class="text-primary-600 dark:text-primary-400">
            {{ t('tugas_referensi') }}
          </Paragraph>
          <Paragraph variant="body3m" class="mt-0.5 line-clamp-2 text-gray-700 dark:text-gray-200">
            {{ referenceLabel }}
          </Paragraph>
        </div>
      </div>

      <UFormField :label="t('tugas_pilih_papan')" required>
        <USelectMenu
          v-model="form.boardId"
          :items="boardOptions"
          value-key="value"
          label-key="label"
          :loading="isLoadingBoards"
          :disabled="isLoadingBoards || !boards.length"
          :search-input="{ placeholder: t('tugas_cari_papan') }"
          :placeholder="t('tugas_pilih_papan')"
          class="w-full"
          :ui="{
            base: 'w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
            content: 'z-[var(--z-toast)]',
          }"
        />
        <Paragraph
          v-if="!isLoadingBoards && !boardOptions.length"
          variant="caption2"
          class="mt-1 text-gray-500 dark:text-gray-400"
        >
          {{ t('tugas_papan_kosong_quick_create') }}
        </Paragraph>
      </UFormField>

      <UFormField :label="t('tugas_judul_task')" required>
        <UInput
          v-model="form.judul"
          maxlength="255"
          :placeholder="t('tugas_judul_task_placeholder')"
          class="w-full"
        />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField :label="t('tugas_prioritas')">
          <USelectMenu
            v-model="selectedPriority"
            :items="priorityOptions"
            value-key="value"
            label-key="label"
            :search-input="false"
            class="w-full"
            :ui="{
              base: 'w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
              content: 'z-[var(--z-toast)]',
            }"
          />
        </UFormField>

        <TulisInputTanggal
          v-model="deadlineDate"
          :label="t('tugas_tenggat')"
          layout="field"
          display-format="DD MMMM YYYY"
          :min-value="minimumDeadline"
          :max-value="null"
        />
      </div>

      <UFormField :label="t('tugas_assignee')">
        <USelectMenu
          v-model="selectedAssignee"
          :items="assigneeOptions"
          value-key="value"
          label-key="label"
          :disabled="!form.boardId"
          :search-input="{ placeholder: t('tugas_cari_pic') }"
          :placeholder="t('tugas_tanpa_assignee')"
          class="w-full"
          :ui="{
            base: 'w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
            content: 'z-[var(--z-toast)]',
          }"
        />
        <div
          v-if="selectedAssigneeMember"
          class="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-gray-700/50"
        >
          <ProfileAvatar
            size="xs"
            :persnum="selectedAssigneeMember.persnum"
            :alt="selectedAssigneeMember.nama"
            avatar-class="shrink-0 bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
          >
            {{
              selectedAssigneeMember.nama
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()
            }}
          </ProfileAvatar>
          <div class="min-w-0">
            <Paragraph variant="caption1sb" class="truncate text-gray-700 dark:text-gray-200">
              {{ selectedAssigneeMember.nama }}
            </Paragraph>
            <Paragraph variant="caption2" class="truncate text-gray-500 dark:text-gray-400">
              {{ selectedAssigneeMember.positionText ?? selectedAssigneeMember.positionId }}
            </Paragraph>
          </div>
        </div>
      </UFormField>
    </div>

    <template #footer>
      <div
        class="mt-5 flex shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700"
      >
        <UButton color="neutral" variant="outline" :disabled="isSaving" @click="close">
          {{ t('batal') }}
        </UButton>
        <UButton
          icon="i-lucide-list-plus"
          color="primary"
          :loading="isSaving"
          :disabled="!form.boardId || !form.judul.trim() || !canCreateTask"
          @click="save"
        >
          {{ t('tugas_buat_task') }}
        </UButton>
      </div>
    </template>
  </Modal>
</template>
