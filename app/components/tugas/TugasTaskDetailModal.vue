<script setup lang="ts">
import { X, Trash2, Link2, TriangleAlert, ListTodo, SquarePlus, Lock } from 'lucide-vue-next';
import type {
  TugasMember,
  TugasReferenceType,
  TugasTask,
  TugasTaskPriority,
  TugasTaskEvidence,
  TugasTaskReference,
} from '~/types/tugas';

const props = defineProps<{
  modelValue: boolean;
  task: TugasTask | null;
  members: TugasMember[];
  saving: boolean;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canDeleteTask: boolean;
  references: TugasTaskReference[];
  addingReference: boolean;
  evidences: TugasTaskEvidence[];
  uploadingEvidence: boolean;
  removingEvidenceIds: Set<string>;
  mode?: 'create' | 'edit';
  /** Task milik orang lain → semua field read-only, tanpa tombol mutasi. */
  readOnly?: boolean;
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
  (
    e: 'create',
    payload: {
      judul: string;
      deskripsi: string;
      prioritas: TugasTaskPriority | null;
      tenggat: string | null;
      assigneeMemberId: string | null;
    }
  ): void;
  (e: 'archive'): void;
  (e: 'unarchive'): void;
  (e: 'delete'): void;
  (e: 'remove-reference', referenceId: string): void;
  (e: 'add-reference', referenceType: TugasReferenceType, referenceId: string): void;
  (e: 'add-evidence', file: File, onSettled: () => void): void;
  (e: 'remove-evidence', evidenceId: string): void;
  (e: 'invalid-evidence'): void;
}>();

const { t } = useI18n();

const form = ref({
  judul: '',
  deskripsi: '',
  prioritas: null as TugasTaskPriority | null,
  tenggat: '',
  assigneeMemberId: null as string | null,
});
const referenceForm = ref({
  type: 'naskah_masuk' as TugasReferenceType,
  id: '',
});
const evidenceFiles = ref<File[]>([]);

const isCreateMode = computed(() => props.mode === 'create');
const NO_PRIORITY = '__NO_PRIORITY__';
const NO_PIC = '__NO_PIC__';

/** Read-only: task milik orang lain — semua input disabled, tanpa tombol mutasi. */
const isReadOnly = computed(() => !isCreateMode.value && Boolean(props.readOnly));

/** Izin form mengikuti mode: create-task untuk tambah, update-task untuk edit. */
const canSubmit = computed(() => (isCreateMode.value ? props.canCreateTask : props.canUpdateTask));
const isFieldDisabled = computed(() => !canSubmit.value || isReadOnly.value);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (isCreateMode.value) {
      // Mode create: form kosong — task BELUM tersimpan sampai user konfirmasi.
      form.value = {
        judul: '',
        deskripsi: '',
        prioritas: null,
        tenggat: '',
        assigneeMemberId: null,
      };
      referenceForm.value.id = '';
      evidenceFiles.value = [];
      return;
    }
    if (!props.task) return;
    form.value = {
      judul: props.task.judul,
      deskripsi: props.task.deskripsi ?? '',
      prioritas: props.task.prioritas ?? null,
      tenggat: props.task.tenggat ?? '',
      assigneeMemberId: props.task.assignee?.id ?? null,
    };
    referenceForm.value.id = '';
    evidenceFiles.value = [];
  }
);

const close = () => emit('update:modelValue', false);

const save = () => {
  if (!canSubmit.value || isReadOnly.value || !form.value.judul.trim()) return;
  const payload = {
    judul: form.value.judul.trim(),
    deskripsi: form.value.deskripsi.trim(),
    prioritas: form.value.prioritas,
    tenggat: form.value.tenggat || null,
    assigneeMemberId: form.value.assigneeMemberId,
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

const handleEvidenceSelection = (files: File[]) => {
  evidenceFiles.value = files;
  const file = files[0];
  if (!file || props.uploadingEvidence) return;
  emit('add-evidence', file, () => {
    evidenceFiles.value = [];
  });
};

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const prioritasSelectOptions = computed(() => [
  { label: t('tugas_tanpa_prioritas'), value: NO_PRIORITY },
  { label: t('tugas_prioritas_tinggi'), value: 'tinggi' },
  { label: t('tugas_prioritas_sedang'), value: 'sedang' },
  { label: t('tugas_prioritas_rendah'), value: 'rendah' },
]);

const assigneeSelectOptions = computed(() => [
  { label: t('tugas_tanpa_assignee'), value: NO_PIC },
  ...props.members.map((member) => ({
    label: member.positionText ? `${member.nama} — ${member.positionText}` : member.nama,
    value: member.id,
  })),
]);

const selectedPrioritas = computed({
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
  props.members.find((member) => member.id === form.value.assigneeMemberId)
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
        class="relative flex max-h-[90dvh] w-full max-w-xl flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
            >
              <SquarePlus v-if="isCreateMode" class="h-5 w-5" />
              <ListTodo v-else class="h-5 w-5" />
            </span>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ isCreateMode ? t('tugas_tambah_task') : t('tugas_detail_task') }}
              </h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ isCreateMode ? t('tugas_tambah_task_desc') : t('tugas_detail_task_desc') }}
              </p>
            </div>
          </div>
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
          <!-- Banner read-only: task milik orang lain -->
          <div
            v-if="isReadOnly"
            class="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
          >
            <Lock class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ t('tugas_task_readonly_desc') }}</span>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_judul_task') }}
            </label>
            <UInput
              v-model="form.judul"
              maxlength="255"
              :disabled="isFieldDisabled"
              class="w-full"
              :placeholder="t('tugas_judul_task_placeholder', 'Judul task…')"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_deskripsi_papan') }}
            </label>
            <UTextarea
              v-model="form.deskripsi"
              :rows="4"
              maxlength="10000"
              :disabled="isFieldDisabled"
              class="w-full"
              autoresize
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('tugas_prioritas') }}
              </label>
              <USelectMenu
                v-model="selectedPrioritas"
                :items="prioritasSelectOptions"
                value-key="value"
                label-key="label"
                :search-input="false"
                :disabled="isFieldDisabled"
                :placeholder="t('tugas_tanpa_prioritas')"
                class="w-full"
                :ui="{
                  base: 'w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
                  content: 'z-[var(--z-toast)]',
                }"
                aria-label="Prioritas"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('tugas_tenggat') }}
              </label>
              <UInput
                v-model="form.tenggat"
                type="date"
                :disabled="isFieldDisabled"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_assignee') }}
            </label>
            <USelectMenu
              v-model="selectedAssignee"
              :items="assigneeSelectOptions"
              value-key="value"
              label-key="label"
              :search-input="{ placeholder: t('tugas_cari_pic') }"
              :disabled="isFieldDisabled"
              :placeholder="t('tugas_tanpa_assignee')"
              class="w-full"
              :ui="{
                base: 'w-full bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-200',
                content: 'z-[var(--z-toast)]',
              }"
              :aria-label="t('tugas_assignee')"
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
                <p class="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {{ selectedAssigneeMember.nama }}
                </p>
                <p class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {{ selectedAssigneeMember.positionText ?? selectedAssigneeMember.positionId }}
                </p>
              </div>
            </div>
          </div>

          <!-- Evidence pekerjaan (JPG/PNG) -->
          <div v-if="!isCreateMode">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('tugas_evidence') }}
            </label>
            <div v-if="evidences.length" class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div
                v-for="evidence in evidences"
                :key="evidence.id"
                class="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900"
              >
                <a
                  :href="evidence.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block aspect-square"
                  :title="evidence.originalName"
                >
                  <img
                    :src="evidence.url"
                    :alt="evidence.originalName"
                    class="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
                <div class="border-t border-gray-200 px-2 py-1.5 dark:border-gray-700">
                  <p class="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">
                    {{ evidence.originalName }}
                  </p>
                  <p class="text-[10px] text-gray-400">
                    {{ formatFileSize(evidence.fileSize) }}
                  </p>
                </div>
                <UButton
                  v-if="!isReadOnly && canUpdateTask"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="solid"
                  size="xs"
                  class="absolute right-1.5 top-1.5 opacity-90"
                  :loading="removingEvidenceIds.has(evidence.id)"
                  :aria-label="t('tugas_hapus_evidence')"
                  @click="emit('remove-evidence', evidence.id)"
                />
              </div>
            </div>
            <p v-else class="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {{ t('tugas_evidence_kosong') }}
            </p>

            <div v-if="!isReadOnly && canUpdateTask" class="space-y-2">
              <FileUpload
                :model-value="evidenceFiles"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                :multiple="false"
                :max-size="10 * 1024 * 1024"
                :label="t('tugas_pilih_evidence')"
                :description="t('tugas_evidence_ketentuan')"
                :class="{ 'pointer-events-none opacity-70': uploadingEvidence }"
                @update:model-value="handleEvidenceSelection"
                @invalid-files="emit('invalid-evidence')"
              />
              <div
                v-if="uploadingEvidence"
                class="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
              >
                <UIcon name="i-lucide-loader-circle" class="h-4 w-4 animate-spin" />
                {{ t('tugas_evidence_sedang_diunggah') }}
              </div>
            </div>
          </div>

          <!-- Referensi ArsipKu (Phase 7) -->
          <div v-if="!isCreateMode">
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
                  v-if="!isReadOnly && canUpdateTask"
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

            <div
              v-if="!isReadOnly && canSubmit"
              class="mt-2 grid gap-2 sm:grid-cols-[150px_1fr_auto]"
            >
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
                color="primary"
                variant="soft"
                :loading="addingReference"
                :disabled="!referenceForm.id.trim()"
                @click="addReference"
              >
                {{ t('tugas_tambah_referensi') }}
              </UButton>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700"
        >
          <div class="flex items-center gap-2">
            <UButton
              v-if="
                !isReadOnly &&
                canUpdateTask &&
                !isCreateMode &&
                task.status === 'done' &&
                !task.archivedAt
              "
              icon="i-lucide-archive"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="emit('archive')"
            >
              {{ t('tugas_arsip_task') }}
            </UButton>
            <UButton
              v-if="!isReadOnly && canUpdateTask && !isCreateMode && task.archivedAt"
              icon="i-lucide-archive-restore"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="emit('unarchive')"
            >
              {{ t('tugas_kembalikan_task') }}
            </UButton>
            <UButton
              v-if="!isReadOnly && canDeleteTask && !isCreateMode"
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
              {{ isReadOnly ? t('tutup_modal', 'Tutup') : t('batal') }}
            </UButton>
            <UButton
              v-if="!isReadOnly && canSubmit"
              color="primary"
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
