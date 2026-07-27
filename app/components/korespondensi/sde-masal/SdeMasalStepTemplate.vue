<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Ringkasan singkat -->
    <div class="bg-[#457fb6]/10 dark:bg-[#457fb6]/20 rounded-lg p-3 flex items-center gap-2">
      <UIcon name="i-lucide-users" class="w-4 h-4 text-[#457fb6]" />
      <span class="text-sm text-gray-700 dark:text-gray-200">
        Total penerima: <strong>{{ penerimaList.length }}</strong> surat akan digenerate
      </span>
    </div>

    <!-- Pilih Skema Template -->
    <div>
      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        Skema Template <span class="text-red-500">*</span>
      </label>
      <USelectMenu
        v-model="skemaModel"
        :items="skemaOptions"
        value-key="value"
        placeholder="Pilih skema template..."
        class="w-full"
        variant="outline"
      />
    </div>

    <!-- Pilih Versi Template -->
    <div>
      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        Versi Template <span class="text-red-500">*</span>
      </label>
      <USelectMenu
        v-model="versiModel"
        :items="versiOptions"
        value-key="value"
        placeholder="Pilih versi template..."
        class="w-full"
        variant="outline"
      />
    </div>

    <!-- Template Manager (existing) -->
    <div class="pt-2">
      <TulisTemplateManager :current-content="kontenModel" @apply="handleApplyTemplate" />
    </div>

    <!-- Info variabel dinamis -->
    <div class="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30 px-4 py-3">
      <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Variabel Dinamis untuk Massal</p>
      <p class="text-xs text-blue-700 dark:text-blue-400">Gunakan variabel berikut dalam konten, akan otomatis diganti per penerima:</p>
      <div class="flex flex-wrap gap-2 mt-2">
        <code v-for="v in dynamicVariables" :key="v.var" class="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-mono cursor-pointer" @click="insertVariable(v.var)">
          {{ v.var }} <span class="opacity-60">({{ v.desc }})</span>
        </code>
      </div>
    </div>

    <!-- Editor Konten -->
    <div class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-4 font-['Times_New_Roman']">
      <div class="bg-white pt-6 pb-6 border-b border-gray-100 select-none text-black min-h-[400px]">
        <ClientOnly>
          <TinymceEditorAsync
            api-key="no-api-key"
            v-model="kontenModel"
            :initial-value="kontenModel"
            :init="tinyMceInit"
          />
        </ClientOnly>
      </div>
    </div>

    <!-- Preview perwakilan 1 surat -->
    <div class="pt-2">
      <UButton
        label="Preview Perwakilan Surat"
        color="primary"
        variant="soft"
        icon="i-lucide-eye"
        @click="showPreview = true"
      />
    </div>

    <!-- Preview Modal sederhana -->
    <Teleport to="body">
      <div v-if="showPreview" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPreview = false" />
        <div class="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[85vh]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Preview Perwakilan Surat</h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="showPreview = false" />
          </div>
          <div class="p-4 overflow-y-auto">
            <div class="bg-white text-black p-8 font-['Times_New_Roman'] text-[14px] leading-relaxed" v-html="previewHtml" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { SdeMasalTemplate, SdeMasalConcept, SdeMasalPenerima } from '~/types/sde-masal';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
}>();

const model = defineModel<SdeMasalTemplate | null>({ default: null });

const skemaModel = ref<string>('');
const versiModel = ref<string>('');
const kontenModel = ref<string>('');
const showPreview = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const skemaOptions = [
  { label: 'SDE Standar', value: 'SDE-STANDAR' },
  { label: 'SDE Khusus', value: 'SDE-KHUSUS' },
];

const versiOptions = [
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' },
];

const dynamicVariables = [
  { var: '{{tertuju}}', desc: 'Nama - Jabatan' },
  { var: '{{nama}}', desc: 'Nama penerima' },
  { var: '{{jabatan}}', desc: 'Jabatan penerima' },
  { var: '{{persnum}}', desc: 'Nomor pegawai' },
  { var: '{{keterangan}}', desc: 'Keterangan' },
];

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten surat... Gunakan variabel {{tertuju}}, {{alamat}}, dll untuk personalisasi massal.',
  plugins: 'lists advlist link image code table fullscreen',
  toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; }`,
  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor;
  },
};

const handleApplyTemplate = (htmlContent: string) => {
  if (tinymceEditor.value) {
    const cleanContent = htmlContent.trim().replace(/>\s+</g, '><');
    tinymceEditor.value.setContent(cleanContent);
    kontenModel.value = tinymceEditor.value.getContent();
  } else {
    kontenModel.value = htmlContent;
  }
};

const insertVariable = (varName: string) => {
  if (tinymceEditor.value) {
    tinymceEditor.value.insertContent(varName);
    kontenModel.value = tinymceEditor.value.getContent();
  } else {
    kontenModel.value += varName;
  }
};

// Preview HTML dengan variabel diganti dari penerima pertama
const previewHtml = computed(() => {
  const first = props.penerimaList[0];
  let html = kontenModel.value || '<p>(Konten kosong)</p>';
  if (first) {
    html = html
      .replace(/\{\{tertuju\}\}/g, first.tertuju || '-')
      .replace(/\{\{nama\}\}/g, first.nama || '-')
      .replace(/\{\{jabatan\}\}/g, first.jabatan || '-')
      .replace(/\{\{persnum\}\}/g, first.persnum || '-')
      .replace(/\{\{keterangan\}\}/g, first.keterangan || '-');
  }
  return html;
});

// Sync ke model parent
watch([skemaModel, versiModel, kontenModel], () => {
  model.value = {
    skema: skemaModel.value,
    versi: versiModel.value,
    konten: kontenModel.value,
  };
}, { deep: true });
</script>