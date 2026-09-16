<script setup lang="ts">
import { X, FileText, KanbanSquare } from 'lucide-vue-next';
import type { TugasReferenceType, TugasTaskPriority } from '~/types/tugas';

/**
 * TugasQuickCreateModal — modal reusable untuk aksi "Buat Tugas" dari
 * konteks naskah (Kotak Masuk/Disposisi/Naskah Lainnya).
 *
 * - Menerima konteks reference (type + id + label awal untuk judul).
 * - Memuat board yang dapat ditulisi user (owner/member).
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
  prioritas: '' as TugasTaskPriority | '',
  tenggat: '',
  assigneeMemberId: '',
});

const isSaving = ref(false);
const isLoadingBoards = ref(false);

const canCreateTask = computed(() => hasPermission('tugas', 'create-task'));
const boardMembers = computed(() => boardDetails.value[form.value.boardId]?.members ?? []);

const close = () => emit('update:modelValue', false);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    form.value = {
      boardId: '',
      judul: props.referenceLabel.slice(0, 255),
      prioritas: '',
      tenggat: '',
      assigneeMemberId: '',
    };
    if (!boards.value.length) {
      isLoadingBoards.value = true;
      try {
        await fetchBoards({ limit: 100 });
      } finally {
        isLoadingBoards.value = false;
      }
    }
    // Default: board pertama.
    if (!form.value.boardId && boards.value.length) {
      form.value.boardId = boards.value[0].id;
    }
  }
);

watch(
  () => form.value.boardId,
  async (boardId) => {
    form.value.assigneeMemberId = '';
    if (!props.modelValue || !boardId || boardDetails.value[boardId]) return;
    try {
      await fetchBoardDetail(boardId);
    } catch {
      // Pembuatan task tetap dapat dilanjutkan tanpa assignee.
    }
  }
);

const save = async () => {
  if (isSaving.value || !form.value.boardId || !form.value.judul.trim()) return;
  isSaving.value = true;
  try {
    const res = await createTask(form.value.boardId, {
      judul: form.value.judul.trim(),
      prioritas: form.value.prioritas || null,
      tenggat: form.value.tenggat || null,
      assigneeMemberId: form.value.assigneeMemberId || null,
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
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      @click.self="close"
    >
      <div
        class="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            {{ t('tugas_buat_dari_naskah') }}
          </h3>
          <button
            class="text-gray-500 hover:text-gray-800 dark:hover:text-white"
            aria-label="Tutup"
            @click="close"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <!-- Konteks referensi (read-only) -->
          <div
            class="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30"
          >
            <FileText class="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p class="line-clamp-2 text-xs text-blue-700 dark:text-blue-300">
              {{ referenceLabel }}
            </p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_pilih_papan') }}
            </label>
            <div v-if="isLoadingBoards" class="space-y-1.5">
              <USkeleton class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <USkeleton class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
            <select
              v-else
              v-model="form.boardId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option v-for="board in boards" :key="board.id" :value="board.id">
                {{ board.nama }}
              </option>
            </select>
            <p v-if="!isLoadingBoards && !boards.length" class="mt-1 text-xs text-gray-400">
              {{ t('tugas_papan_kosong_quick_create') }}
            </p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_judul_task') }}
            </label>
            <input
              v-model="form.judul"
              type="text"
              maxlength="255"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('tugas_prioritas') }}
              </label>
              <select
                v-model="form.prioritas"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">{{ t('tugas_tanpa_prioritas') }}</option>
                <option value="tinggi">{{ t('tugas_prioritas_tinggi') }}</option>
                <option value="sedang">{{ t('tugas_prioritas_sedang') }}</option>
                <option value="rendah">{{ t('tugas_prioritas_rendah') }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('tugas_tenggat') }}
              </label>
              <input
                v-model="form.tenggat"
                type="date"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_assignee') }}
            </label>
            <select
              v-model="form.assigneeMemberId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">{{ t('tugas_tanpa_assignee') }}</option>
              <option v-for="member in boardMembers" :key="member.id" :value="member.id">
                {{ member.nama }}{{ member.positionText ? ` — ${member.positionText}` : '' }}
              </option>
            </select>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <UButton color="neutral" variant="outline" :disabled="isSaving" @click="close">
            {{ t('batal') }}
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            :disabled="!form.boardId || !form.judul.trim() || !canCreateTask"
            @click="save"
          >
            <KanbanSquare class="mr-1 h-4 w-4" />
            {{ t('tugas_buat_task') }}
          </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
