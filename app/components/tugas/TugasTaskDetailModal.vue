<script setup lang="ts">
import { X, Trash2, Link2, TriangleAlert } from 'lucide-vue-next';
import type {
  TugasMember,
  TugasReferenceType,
  TugasTask,
  TugasTaskPriority,
  TugasTaskReference,
  TugasTaskStatus,
} from '~/types/tugas';

const props = defineProps<{
  modelValue: boolean;
  task: TugasTask | null;
  members: TugasMember[];
  saving: boolean;
  moving: boolean;
  canUpdateTask: boolean;
  canDeleteTask: boolean;
  references: TugasTaskReference[];
  addingReference: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'save',
    payload: {
      judul: string;
      deskripsi: string;
      prioritas: TugasTaskPriority | null;
      tenggat: string | null;
      assigneeMemberId: string | null;
    }
  ): void;
  (e: 'move', status: TugasTaskStatus): void;
  (e: 'archive'): void;
  (e: 'unarchive'): void;
  (e: 'delete'): void;
  (e: 'remove-reference', referenceId: string): void;
  (e: 'add-reference', referenceType: TugasReferenceType, referenceId: string): void;
}>();

const { t } = useI18n();

const form = ref({
  judul: '',
  deskripsi: '',
  prioritas: '' as TugasTaskPriority | '',
  tenggat: '',
  assigneeMemberId: '' as string | '',
});
const referenceForm = ref({
  type: 'naskah_masuk' as TugasReferenceType,
  id: '',
});

const isCreateMode = computed(() => props.mode === 'create');

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (isCreateMode.value) {
      // Mode create: form kosong — task BELUM tersimpan sampai user konfirmasi.
      form.value = {
        judul: '',
        deskripsi: '',
        prioritas: '',
        tenggat: '',
        assigneeMemberId: '',
      };
      referenceForm.value.id = '';
      return;
    }
    if (!props.task) return;
    form.value = {
      judul: props.task.judul,
      deskripsi: props.task.deskripsi ?? '',
      prioritas: props.task.prioritas ?? '',
      tenggat: props.task.tenggat ?? '',
      assigneeMemberId: props.task.assignee?.id ?? '',
    };
    referenceForm.value.id = '';
  }
);

const close = () => emit('update:modelValue', false);

const save = () => {
  if (!form.value.judul.trim()) return;
  const payload = {
    judul: form.value.judul.trim(),
    deskripsi: form.value.deskripsi.trim(),
    prioritas: form.value.prioritas || null,
    tenggat: form.value.tenggat || null,
    assigneeMemberId: form.value.assigneeMemberId || null,
  };
  // Mode create: task baru dibuat server-side hanya saat user konfirmasi.
  if (isCreateMode.value) {
    emit('create', payload);
    return;
  }
  emit('save', payload);
};

const addReference = () => {
  const referenceId = referenceForm.value.id.trim();
  if (!referenceId) return;
  emit('add-reference', referenceForm.value.type, referenceId);
};

const statusOptions = computed(() => [
  { label: t('tugas_status_todo'), value: 'todo' as TugasTaskStatus },
  { label: t('tugas_status_in_progress'), value: 'in_progress' as TugasTaskStatus },
  { label: t('tugas_status_done'), value: 'done' as TugasTaskStatus },
]);

const moveTargets = computed(() =>
  statusOptions.value.filter((option) => option.value !== props.task?.status)
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && (task || isCreateMode)"
      class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      @click.self="close"
    >
      <div
        class="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            {{ isCreateMode ? t('tugas_tambah_task') : t('tugas_detail_task') }}
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
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_judul_task') }}
            </label>
            <input
              v-model="form.judul"
              type="text"
              maxlength="255"
              :disabled="!canUpdateTask"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_deskripsi_papan') }}
            </label>
            <textarea
              v-model="form.deskripsi"
              rows="4"
              maxlength="10000"
              :disabled="!canUpdateTask"
              class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('tugas_prioritas') }}
              </label>
              <select
                v-model="form.prioritas"
                :disabled="!canUpdateTask"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
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
                :disabled="!canUpdateTask"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_assignee') }}
            </label>
            <select
              v-model="form.assigneeMemberId"
              :disabled="!canUpdateTask"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
            >
              <option value="">{{ t('tugas_tanpa_assignee') }}</option>
              <option v-for="member in members" :key="member.id" :value="member.id">
                {{ member.nama }}{{ member.positionText ? ` — ${member.positionText}` : '' }}
              </option>
            </select>
          </div>

          <!-- Referensi ArsipKu (Phase 7) -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_referensi') }}
            </label>
            <div v-if="references.length" class="space-y-1.5">
              <div
                v-for="reference in references"
                :key="reference.id"
                class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600"
              >
                <Link2 v-if="reference.available" class="h-3.5 w-3.5 shrink-0 text-primary-500" />
                <TriangleAlert v-else class="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <NuxtLink
                  v-if="reference.available"
                  :to="reference.route"
                  class="min-w-0 flex-1 truncate text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                  :title="reference.labelSnapshot"
                >
                  {{ reference.labelSnapshot }}
                </NuxtLink>
                <span
                  v-else
                  class="min-w-0 flex-1 truncate text-xs text-amber-700 dark:text-amber-300"
                  :title="reference.labelSnapshot"
                >
                  {{ reference.labelSnapshot }} — {{ t('tugas_referensi_tidak_tersedia') }}
                </span>
                <button
                  v-if="canUpdateTask && !isCreateMode"
                  class="shrink-0 text-gray-300 transition-colors hover:text-red-600 dark:text-gray-600 dark:hover:text-red-400"
                  :aria-label="t('tugas_hapus_referensi')"
                  @click="emit('remove-reference', reference.id)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('tugas_referensi_kosong') }}
            </p>

            <div v-if="canUpdateTask && !isCreateMode" class="mt-2 grid gap-2 sm:grid-cols-[150px_1fr_auto]">
              <select
                v-model="referenceForm.type"
                :disabled="addingReference"
                class="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="naskah_masuk">{{ t('tugas_ref_naskah_masuk') }}</option>
                <option value="disposisi">{{ t('tugas_ref_disposisi') }}</option>
                <option value="naskah_lainnya">{{ t('tugas_ref_naskah_lainnya') }}</option>
              </select>
              <input
                v-model="referenceForm.id"
                type="text"
                :placeholder="t('tugas_referensi_id_placeholder')"
                :disabled="addingReference"
                class="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                @keyup.enter="addReference"
              />
              <UButton
                size="xs"
                icon="i-lucide-link-2"
                :loading="addingReference"
                :disabled="!referenceForm.id.trim()"
                @click="addReference"
              >
                {{ t('tugas_tambah_referensi') }}
              </UButton>
            </div>
          </div>

          <!-- Pindahkan ke (fallback touch/keyboard) -->
          <div v-if="canUpdateTask && !isCreateMode && !task.archivedAt" class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('tugas_pindahkan_ke') }}:
            </span>
            <UButton
              v-for="target in moveTargets"
              :key="target.value"
              size="xs"
              variant="outline"
              color="neutral"
              :loading="moving"
              @click="emit('move', target.value)"
            >
              {{ target.label }}
            </UButton>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <div class="flex items-center gap-2">
            <UButton
              v-if="canUpdateTask && !isCreateMode && task.status === 'done' && !task.archivedAt"
              icon="i-lucide-archive"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="emit('archive')"
            >
              {{ t('tugas_arsip_task') }}
            </UButton>
            <UButton
              v-if="canUpdateTask && !isCreateMode && task.archivedAt"
              icon="i-lucide-archive-restore"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="emit('unarchive')"
            >
              {{ t('tugas_kembalikan_task') }}
            </UButton>
            <UButton
              v-if="canDeleteTask && !isCreateMode"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="emit('delete')"
            >
              {{ t('tugas_hapus_task') }}
            </UButton>
          </div>
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="outline" :disabled="saving" @click="close">
              {{ t('batal') }}
            </UButton>
            <UButton
              v-if="canUpdateTask"
              :loading="saving"
              :disabled="!form.judul.trim()"
              @click="save"
            >
              {{ isCreateMode ? t('tugas_buat_task', 'Buat Task') : t('simpan_perubahan') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
