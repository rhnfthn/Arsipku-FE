<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Template manager -->
    <div class="pt-2">
      <TulisTemplateManager :current-content="kontenModel" @apply="handleApplyTemplate">
        <template #after-template-actions>
          <UButton
            label="Tertuju"
            color="primary"
            variant="soft"
            icon="i-lucide-contact"
            class="w-full justify-center sm:w-auto"
            to="/master/tertuju-eksternal"
            target="_blank"
          />
        </template>
      </TulisTemplateManager>
    </div>

    <!-- Kanvas surat mengikuti struktur Surat Dinas Eksternal. -->
    <div
      class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']"
    >
      <div
        class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black min-h-[1000px]"
      >
        <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
          <TulisKopSurat :alamat-info="user?.alamatInfo" />
        </div>

        <div class="flex mb-4 text-[14px] px-10">
          <div>{{ formattedDate }}</div>
        </div>

        <div class="flex flex-col md:flex-row gap-8 mb-8 text-[14px] px-10">
          <div class="w-full">
            <table class="w-full align-top">
              <tbody>
                <tr>
                  <td class="w-[80px] align-top">Nomor</td>
                  <td class="w-[10px] align-top">:</td>
                  <td class="align-top">................................................</td>
                </tr>
                <tr>
                  <td class="align-top">Sifat</td>
                  <td class="align-top">:</td>
                  <td class="align-top capitalize">{{ konsep?.sifat || 'Biasa' }}</td>
                </tr>
                <tr>
                  <td class="align-top">Lampiran</td>
                  <td class="align-top">:</td>
                  <td class="align-top">-</td>
                </tr>
                <tr>
                  <td class="align-top">Perihal</td>
                  <td class="align-top">:</td>
                  <td class="align-top font-bold text-justify" v-pre>
                    <span class="sde-var-preview">{{perihal}}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-5">Kepada Yth.</div>
            <div class="mb-1 font-bold" v-pre><span class="sde-var-preview">{{tertuju}}</span></div>
            <div class="mb-1">Di Tempat</div>
          </div>
        </div>

        <div class="min-h-[300px] relative group">
          <ClientOnly>
            <TinymceEditorAsync
              api-key="no-api-key"
              v-model="kontenModel"
              :initial-value="kontenModel"
              :init="tinyMceInit"
            />
          </ClientOnly>
        </div>

        <div class="flex mt-12 text-black px-10">
          <div class="text-center min-w-[250px]">
            <div class="mb-24 text-[14px]">
              <div v-if="konsep?.atasNama" class="font-bold mb-1">a.n {{ konsep.atasNama }}</div>
              <div class="font-bold">{{ signaturePosition }}</div>
            </div>
            <div class="font-bold text-[14px] underline">{{ signatureName }}</div>
          </div>
        </div>
        <div class="mt-8 px-10 text-[12px] text-black">
          <div class="font-bold mb-1">Tembusan Yth:</div>
          <div v-pre><span class="sde-var-preview">{{tembusan_internal}}</span></div>
          <div v-pre><span class="sde-var-preview">{{tembusan_eksternal}}</span></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { SdeMasalTemplate, SdeMasalConcept, SdeMasalPenerima } from '~/types/sde-masal';
import { formatSdeMasalDate } from '~/utils/sde-masal-render';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
}>();

const model = defineModel<SdeMasalTemplate | null>({ default: null });
const emit = defineEmits<{ 'update:variables': [variables: string[]] }>();

const kontenModel = ref<string>('');
const tinymceEditor = ref<TinyMCEEditor | null>(null);
const { user, getProfile } = useAuth();

const tempat = computed(() => {
  const area = user.value?.areaText || '';
  if (!area || area.toLowerCase().includes('kantor pusat')) {
    return user.value?.alamatInfo?.kota || 'Tangerang';
  }
  return area.replace('Kantor', '').trim() || 'Tangerang';
});

const formattedDate = computed(() => {
  const date = formatSdeMasalDate(props.konsep?.tanggalKonsep);
  return date === '[Tanggal Surat]' ? 'Tangerang, Tanggal surat' : `${tempat.value}, ${date}`;
});
const signatureParts = computed(() =>
  (props.konsep?.pengirimName || '')
    .split(' - ')
    .map((value) => value.trim())
    .filter(Boolean)
);
const signatureName = computed(() => signatureParts.value[0] || 'Nama Lengkap');
const signaturePosition = computed(
  () => signatureParts.value.slice(1).join(' - ') || 'Nama Jabatan'
);

const detectedVariables = computed(() => [
  ...new Set(
    Array.from(kontenModel.value.matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g)).map(
      (match) => match[1]
    )
  ),
]);

// Template konten default — KOSONG. User mengetik konten secara dinamis.
// Header surat (nomor/sifat/lampiran/perihal), tujuan, tanda tangan, dan
// tembusan sudah ada di kanvas di luar editor — jangan diduplikat di konten.
const defaultTemplateContent = '';

// Auto-set konten saat step dibuka.
// Prioritas: 1) konten yang sudah tersimpan di model (dari localStorage/wizardState),
//            2) auto-fill default hanya jika konten masih kosong.
const restoreKontenToEditor = (content: string) => {
  const wrapped = wrapVariablesInHtml(content);
  if (tinymceEditor.value) {
    tinymceEditor.value.setContent(wrapped);
    kontenModel.value = tinymceEditor.value.getContent();
  } else {
    kontenModel.value = wrapped;
  }
};

onMounted(() => {
  if (!user.value) getProfile();
  // Pulihkan konten: prioritas konten yang sudah tersimpan di model
  if (model.value?.konten) {
    restoreKontenToEditor(model.value.konten);
  } else if (!kontenModel.value) {
    // Auto-fill default template hanya jika belum ada konten tersimpan
    // TinyMCE mungkin belum ready saat onMounted, tunggu sebentar
    if (tinymceEditor.value) {
      restoreKontenToEditor(defaultTemplateContent);
    } else {
      setTimeout(() => restoreKontenToEditor(defaultTemplateContent), 500);
    }
  }
});

// Highlight variabel {{...}} dengan warna biru agar mudah dibedakan dari teks biasa.
const VAR_CLASS = 'sde-var';
const VAR_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

// Bungkus semua {{...}} yang belum terbungkus span.sde-var.
function wrapVariablesInHtml(html: string): string {
  if (!html) return html;
  // Lepas span.sde-var yang sudah ada agar tidak dobel-wrap, kembalikan ke {{...}} mentah.
  const unwrapRe = new RegExp(
    `<span[^>]*class="[^"]*${VAR_CLASS}[^"]*"[^>]*>(\{\{[^<]*?\}\})</span>`,
    'gi'
  );
  const unwrapped = html.replace(unwrapRe, '$1');
  // Bungkus ulang semua {{...}}.
  return unwrapped.replace(VAR_PATTERN, (m) => `<span class="${VAR_CLASS}">${m}</span>`);
}

// Debounced wrap saat user mengetik, dengan save/restore posisi kursor.
let wrapTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleWrap() {
  if (wrapTimer) clearTimeout(wrapTimer);
  wrapTimer = setTimeout(() => {
    const editor = tinymceEditor.value;
    if (!editor || editor.destroyed) return;
    const current = editor.getContent();
    const wrapped = wrapVariablesInHtml(current);
    if (wrapped === current) return;
    const bookmark = editor.selection.getBookmark(2, true);
    editor.setContent(wrapped);
    editor.selection.moveToBookmark(bookmark);
    kontenModel.value = editor.getContent();
  }, 700);
}

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten disini...',
  plugins: 'lists advlist link image code table fullscreen',
  toolbar:
    'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; } .${VAR_CLASS} { color: #2563eb; font-weight: 600; background: rgba(37,99,235,0.10); padding: 0 2px; border-radius: 3px; }`,
  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor;
    // Keep the parent model current immediately so TemplateManager never
    // validates a stale/empty value when Save is clicked right after typing.
    editor.on('input', () => {
      kontenModel.value = editor.getContent();
      scheduleWrap();
    });
    editor.on('SetContent', scheduleWrap);
  },
};

const handleApplyTemplate = (htmlContent: string) => {
  if (tinymceEditor.value) {
    const cleanContent = htmlContent.trim().replace(/>\s+</g, '><');
    const wrapped = wrapVariablesInHtml(cleanContent);
    tinymceEditor.value.setContent(wrapped);
    kontenModel.value = tinymceEditor.value.getContent();
  } else {
    kontenModel.value = wrapVariablesInHtml(htmlContent);
  }
};

// Pulihkan konten dari model (localStorage/wizardState) saat komponen di-remount.
// immediate:true berjalan sebelum TinyMCE ready, jadi set ke kontenModel dulu.
// Editor akan di-sync lewat watch(tinymceEditor) di bawah.
//
// PENTING: Jika konten lama mengandung template header (nomor/sifat/lampiran/
// perihal/tertuju/tembusan), itu adalah konten lama sebelum perombakan —
// ganti dengan kosong agar user mulai dari awal.
watch(
  model,
  (template) => {
    if (!template || !template.konten) return;
    // Deteksi konten lama: mengandung blok header surat yang sekarang ada di kanvas
    const isOldTemplate = /{{nomor_surat}}|{{sifat_surat}}|{{jumlah_lampiran}}|{{tertuju}}|{{tanggal_surat}}/.test(
      template.konten,
    );
    if (isOldTemplate) {
      kontenModel.value = defaultTemplateContent;
      if (tinymceEditor.value) tinymceEditor.value.setContent(defaultTemplateContent);
      return;
    }
    // Jangan timpa jika konten sudah sama (hindari loop)
    if (kontenModel.value === template.konten) return;
    // Hanya pulihkan jika kontenModel kosong (remount) atau berbeda signifikan
    if (kontenModel.value && kontenModel.value.trim() !== '') return;
    const wrapped = wrapVariablesInHtml(template.konten);
    kontenModel.value = wrapped;
    if (tinymceEditor.value) tinymceEditor.value.setContent(wrapped);
  },
  { immediate: true, deep: true }
);

// Saat TinyMCE baru saja ready (editor ter-set), pastikan konten model ditampilkan.
watch(tinymceEditor, (editor) => {
  if (!editor) return;
  if (kontenModel.value && editor.getContent() !== kontenModel.value) {
    editor.setContent(kontenModel.value);
  }
});

// Sync ke model parent
watch(
  kontenModel,
  () => {
    model.value = {
      skema: 'DINAMIS',
      versi: 'v1',
      konten: kontenModel.value,
    };
  },
  { deep: true }
);

watch(detectedVariables, (variables) => emit('update:variables', variables), { immediate: true });
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}

/* Variabel {{...}} di kanvas (di luar editor) tampil biru seperti di editor */
.sde-var-preview {
  color: #2563eb;
  font-weight: 600;
  background: rgba(37, 99, 235, 0.1);
  padding: 0 2px;
  border-radius: 3px;
}

.tox-fullscreen {
  z-index: 9999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.tox-dialog-wrap,
.tox-dropzone,
.tox-promotions {
  z-index: 10000 !important;
}
</style>
