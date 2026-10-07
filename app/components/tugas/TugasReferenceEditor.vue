<script setup lang="ts">
import type { TugasReferenceType, TugasTaskReference, TugasTaskEvidence } from '~/types/tugas';

const props = defineProps<{
  taskId: string;
  boardType: 'personal' | 'bersama';
  references: TugasTaskReference[];
  editable: boolean;
  adding: boolean;
}>();
const emit = defineEmits<{
  (e: 'add', type: TugasReferenceType, number: string, done: () => void): void;
  (e: 'remove', id: string): void;
}>();
const { t } = useI18n();
const toast = useToast();
const { fetchTaskReferenceFiles, addTaskReferenceFile, removeTaskReferenceFile, mapTugasError } =
  useTugas();
const source = ref<'inbox' | 'sent'>('inbox');
const referenceNumber = ref('');
const files = ref<TugasTaskEvidence[]>([]);
const selectedFiles = ref<File[]>([]);
const loading = ref(false);
const savingFile = ref(false);
const loadError = ref('');
let request = 0;

const load = async () => {
  const current = ++request;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await fetchTaskReferenceFiles(props.taskId);
    if (current === request) files.value = result;
  } catch (error) {
    if (current === request) loadError.value = mapTugasError(error);
  } finally {
    if (current === request) loading.value = false;
  }
};
watch(
  () => [props.taskId, props.boardType, props.editable],
  () => {
    referenceNumber.value = '';
    void load();
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  ++request;
});
const add = () => {
  const number = referenceNumber.value.trim();
  if (!props.editable || props.adding || !number) return;
  const type: TugasReferenceType = source.value === 'sent' ? 'naskah_terkirim' : 'naskah_masuk';
  emit('add', type, number, () => {
    referenceNumber.value = '';
  });
};
const upload = async (selection: File[]) => {
  const file = selection[0];
  if (!file || !props.editable || savingFile.value) return;
  savingFile.value = true;
  selectedFiles.value = selection;
  try {
    await addTaskReferenceFile(props.taskId, file);
    await load();
    toast.add({ title: t('tugas_referensi_berhasil_ditambahkan'), color: 'success' });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    savingFile.value = false;
    selectedFiles.value = [];
  }
};
const removeFile = async (id: string) => {
  if (!props.editable || savingFile.value) return;
  savingFile.value = true;
  try {
    await removeTaskReferenceFile(props.taskId, id);
    files.value = files.value.filter((file) => file.id !== id);
    toast.add({ title: t('tugas_referensi_berhasil_dihapus'), color: 'success' });
  } catch (error) {
    toast.add({ title: mapTugasError(error), color: 'error' });
  } finally {
    savingFile.value = false;
  }
};
</script>

<template>
  <div>
    <Paragraph variant="body3m" class="mb-1.5 text-gray-700 dark:text-gray-300">{{
      t('tugas_referensi')
    }}</Paragraph>
    <Paragraph variant="caption2" class="mb-2 text-gray-500 dark:text-gray-400">{{
      t('tugas_ref_personal_info')
    }}</Paragraph>
    <div
      v-for="reference in references"
      :key="reference.id"
      class="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-600"
    >
      <NuxtLink
        v-if="reference.available"
        :to="reference.route"
        class="min-w-0 flex-1 truncate text-xs text-primary-600 hover:underline dark:text-primary-400"
        >{{ reference.labelSnapshot }}</NuxtLink
      >
      <span v-else class="min-w-0 flex-1 text-xs text-amber-700 dark:text-amber-300"
        >{{ reference.labelSnapshot }} — {{ t('tugas_referensi_tidak_tersedia') }}</span
      >
      <UButton
        v-if="editable"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        :disabled="adding"
        :aria-label="t('tugas_hapus_referensi')"
        @click="emit('remove', reference.id)"
      />
    </div>
    <div
      v-for="file in files"
      :key="file.id"
      class="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-600"
    >
      <a
        :href="file.url"
        target="_blank"
        rel="noopener noreferrer"
        class="min-w-0 flex-1 truncate text-xs text-primary-600 hover:underline dark:text-primary-400"
        >{{ file.originalName }}</a
      >
      <UButton
        v-if="editable"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        :disabled="savingFile"
        :aria-label="t('tugas_hapus_referensi')"
        @click="removeFile(file.id)"
      />
    </div>
    <Paragraph v-if="loadError" variant="caption2" class="text-red-600 dark:text-red-400">{{
      loadError
    }}</Paragraph>
    <Paragraph v-else-if="loading" variant="caption2" class="text-gray-500 dark:text-gray-400">{{
      t('memuat')
    }}</Paragraph>
    <Paragraph
      v-else-if="!references.length && !files.length"
      variant="caption2"
      class="text-gray-500 dark:text-gray-400"
      >{{ t('tugas_referensi_kosong') }}</Paragraph
    >
    <div v-if="editable" class="mt-3 grid gap-2 sm:grid-cols-[140px_1fr_auto]">
      <USelect
        v-model="source"
        value-key="value"
        class="w-full"
        :ui="{ content: 'z-[var(--z-toast)]' }"
        :items="[
          { label: t('tugas_ref_kotak_masuk'), value: 'inbox' },
          { label: t('tugas_ref_terkirim'), value: 'sent' },
        ]"
        :disabled="adding"
      />
      <UInput
        v-model="referenceNumber"
        :placeholder="t('tugas_referensi_id_placeholder')"
        :maxlength="100"
        :disabled="adding"
        icon="i-lucide-hash"
        @keyup.enter="add"
      />
      <UButton
        icon="i-lucide-link-2"
        color="primary"
        variant="solid"
        size="xs"
        :loading="adding"
        :disabled="!referenceNumber.trim()"
        @click="add"
        >{{ t('tugas_tambah_referensi') }}</UButton
      >
    </div>
    <FileUpload
      v-if="editable"
      class="mt-3"
      :model-value="selectedFiles"
      accept=".pdf,.jpg,.jpeg,.png"
      :max-size="10 * 1024 * 1024"
      :multiple="false"
      :class="{ 'pointer-events-none opacity-70': savingFile }"
      :label="t('tugas_ref_upload')"
      :description="t('tugas_ref_manual_info')"
      @update:model-value="upload"
      @invalid-files="toast.add({ title: t('tugas_evidence_ketentuan'), color: 'error' })"
    />
  </div>
</template>
