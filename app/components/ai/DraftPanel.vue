<template>
  <USlideover
    v-model:open="internalOpen"
    title="Buat Draf dengan AI"
    side="right"
    :ui="{
      content: 'max-w-2xl w-full overflow-hidden',
      body: 'p-0',
      footer:
        'border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur p-4',
    }"
  >
    <template #body>
      <div class="custom-scrollbar h-full overflow-y-auto bg-gray-50/80 dark:bg-gray-950">
        <section class="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="p-5">
            <div class="flex items-start gap-4">
              <div
                class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
              >
                <UIcon name="i-lucide-sparkles" class="size-6" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge :label="naskahLabel" color="primary" variant="soft" />
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                  >
                    <UIcon name="i-lucide-wand-sparkles" class="size-3.5" />
                    AI Draft
                  </span>
                </div>

                <h2 class="mt-3 text-xl font-bold text-gray-950 dark:text-white">
                  Susun konsep naskah yang siap diedit
                </h2>
                <p class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Tulis maksud utama naskah, lalu AI akan menyusun draf awalnya.
                </p>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-3 gap-2">
              <div
                v-for="item in contextStats"
                :key="item.label"
                class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900/80"
              >
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <UIcon :name="item.icon" class="size-4" :class="item.iconClass" />
                  <span class="text-xs font-medium">{{ item.label }}</span>
                </div>
                <p class="mt-1 text-sm font-bold text-gray-950 dark:text-white">{{ item.value }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="space-y-4 p-5">
          <section
            class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
                >
                  <UIcon name="i-lucide-file-text" class="size-5" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-900 dark:text-white"
                    >Mau dibuatkan draf tentang apa?</label
                  >
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Cukup isi bagian ini untuk generate
                  </p>
                </div>
              </div>
              <span class="text-xs font-medium text-gray-400 dark:text-gray-500 sm:shrink-0">
                {{ briefCharacterCount }} karakter
              </span>
            </div>

            <UTextarea
              v-model="brief"
              :rows="5"
              :maxrows="10"
              autoresize
              size="xl"
              class="mt-4 w-full"
              :ui="{
                root: 'w-full',
                base: 'min-h-36 w-full resize-y rounded-lg px-4 py-3 text-sm leading-7 shadow-sm break-words whitespace-pre-wrap',
              }"
              placeholder="Contoh: buat nota dinas tentang penyampaian hasil evaluasi implementasi sistem manajemen..."
            />
            <div class="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-3 dark:text-gray-400">
              <span
                v-for="item in promptHints"
                :key="item"
                class="rounded-full bg-gray-100 px-3 py-1.5 text-center leading-5 dark:bg-gray-800"
              >
                {{ item }}
              </span>
            </div>
          </section>

          <div
            v-if="error"
            class="flex items-start gap-3 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-900/60 dark:bg-error-950/30 dark:text-error-300"
          >
            <UIcon name="i-lucide-alert-circle" class="mt-0.5 size-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <section
            v-if="loading"
            class="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-900/60 dark:bg-primary-950/30"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex size-10 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-gray-900 dark:text-primary-300"
              >
                <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
              </div>
              <div>
                <p class="text-sm font-semibold text-primary-800 dark:text-primary-200">
                  AI sedang menyusun draf
                </p>
                <p class="text-xs text-primary-700/70 dark:text-primary-300/70">
                  Mohon tunggu sebentar.
                </p>
              </div>
            </div>
          </section>

          <section
            v-if="result"
            class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800"
            >
              <div class="min-w-0">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400">Hasil Draf</p>
                <h3 class="truncate text-sm font-bold text-gray-950 dark:text-white">
                  {{ result.draftPerihal || 'Perihal belum tersedia' }}
                </h3>
              </div>
              <UBadge
                :label="hasGeneratedDraftBody ? 'Siap Disisipkan' : 'Isi Belum Lengkap'"
                :color="hasGeneratedDraftBody ? 'primary' : 'warning'"
                variant="soft"
              />
            </div>

            <div class="bg-gray-100 p-4 dark:bg-gray-950">
              <div
                v-if="!hasGeneratedDraftBody"
                class="mb-3 flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800 dark:border-warning-900/60 dark:bg-warning-950/30 dark:text-warning-200"
              >
                <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
                <span>AI belum mengembalikan isi draf lengkap. Silakan generate ulang.</span>
              </div>
              <div
                class="max-h-[44vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm leading-7 text-gray-800 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 [&_ol]:ml-5 [&_p]:mb-2 [&_table]:w-full [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_ul]:ml-5"
                v-html="resolvedDraftHtml"
              />
            </div>
          </section>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UButton
          label="Bersihkan"
          color="neutral"
          variant="ghost"
          icon="i-lucide-eraser"
          :disabled="loading || !hasAnyInput"
          @click="handleReset"
        />

        <div class="flex flex-col gap-2 sm:flex-row">
          <UButton
            v-if="result && hasGeneratedDraftBody"
            label="Sisipkan ke Editor"
            color="primary"
            icon="i-lucide-send"
            class="justify-center"
            @click="handleInsert"
          />
          <UButton
            :label="primaryActionLabel"
            :icon="result ? 'i-lucide-refresh-cw' : 'i-lucide-sparkles'"
            :loading="loading"
            :disabled="loading"
            color="primary"
            class="justify-center"
            @click="handleGenerate"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Editor as TinyMCEEditor } from 'tinymce';
import { computed, ref, watch } from 'vue';
import { useAiDraft } from '~/composables/useAiDraft';
import { validateDraftPayload, type DraftResult } from '~/types/ai-draft';

const props = defineProps<{
  open: boolean;
  naskahType: 'kajian' | 'disposisi' | 'ND' | 'SDI' | 'SDE';
  editor: TinyMCEEditor | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const { generate, loading, error } = useAiDraft();

const brief = ref('');
const result = ref<DraftResult | null>(null);

const promptHints = [
  'Contoh: buat undangan rapat',
  'Contoh: sampaikan hasil evaluasi',
  'Contoh: instruksi tindak lanjut',
];

const NASKAH_LABEL: Record<string, string> = {
  kajian: 'Kajian',
  disposisi: 'Disposisi',
  ND: 'Nota Dinas',
  SDI: 'Surat Dinas Internal',
  SDE: 'Surat Dinas Eksternal',
};

const naskahLabel = computed(() => NASKAH_LABEL[props.naskahType] ?? props.naskahType);
const briefCharacterCount = computed(() => brief.value.trim().length);
const hasAnyInput = computed(() => Boolean(brief.value.trim() || result.value));
const primaryActionLabel = computed(() => (result.value ? 'Generate Ulang' : 'Generate Draf'));
const hasGeneratedDraftBody = computed(() => Boolean(result.value?.draftHtml?.trim()));
const resolvedDraftHtml = computed(() => {
  const html = result.value?.draftHtml?.trim();
  if (html) return html;

  return '<p>Draf belum tersedia. Silakan generate ulang.</p>';
});

const contextStats = computed(() => [
  {
    label: 'Ringkasan',
    value: briefCharacterCount.value >= 5 ? 'Siap' : 'Perlu isi',
    icon: briefCharacterCount.value >= 5 ? 'i-lucide-check-circle' : 'i-lucide-circle-dot',
    iconClass: briefCharacterCount.value >= 5 ? 'text-primary-500' : 'text-gray-400',
  },
  {
    label: 'Jenis',
    value: naskahLabel.value,
    icon: 'i-lucide-file-badge',
    iconClass: 'text-primary-500',
  },
  {
    label: 'Editor',
    value: props.editor ? 'Siap' : 'Belum siap',
    icon: props.editor ? 'i-lucide-check-circle' : 'i-lucide-circle-dot',
    iconClass: props.editor ? 'text-primary-500' : 'text-gray-400',
  },
]);

watch(
  () => props.open,
  (newOpen) => {
    if (newOpen) {
      result.value = null;
      error.value = null;
    }
  }
);

const buildPayload = () => {
  return {
    naskahType: props.naskahType,
    brief: brief.value,
  };
};

const handleGenerate = async () => {
  const payload = buildPayload();
  const check = validateDraftPayload(payload);
  if (!check.isValid) {
    result.value = null;
    const firstKey = Object.keys(check.errors || {})[0];
    error.value = firstKey ? (check.errors || {})[firstKey] : 'Validasi gagal';
    return;
  }
  try {
    result.value = await generate(check.data!);
  } catch {
    // error already set in composable
  }
};

const handleReset = () => {
  brief.value = '';
  result.value = null;
  error.value = null;
};

const handleInsert = () => {
  if (props.editor && result.value && hasGeneratedDraftBody.value) {
    props.editor.insertContent(resolvedDraftHtml.value);
  }
  internalOpen.value = false;
};
</script>
