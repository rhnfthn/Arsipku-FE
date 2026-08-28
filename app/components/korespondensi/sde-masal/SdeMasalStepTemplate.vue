<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Template manager ditempatkan setelah variabel dinamis. -->
    <div class="pt-2">
      <TulisTemplateManager :current-content="kontenModel" @apply="handleApplyTemplate">
        <template #after-template-actions>
          <UButton label="Lihat Variabel Dinamis" color="primary" variant="soft" icon="i-lucide-braces" class="w-full justify-center sm:w-auto" @click="showVariables = true" />
        </template>
      </TulisTemplateManager>
    </div>

    <!-- Kanvas surat mengikuti struktur Surat Dinas Eksternal. -->
    <div class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-4 font-['Times_New_Roman']">
      <div class="bg-white pb-10 pt-10 border-b border-gray-100 select-none text-black min-h-[900px]">
        <div class="flex items-center px-10">
          <div class="flex items-end gap-4">
            <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
            <span class="mb-1 text-[18px] font-bold tracking-wide">AirNav Indonesia</span>
          </div>
          <div class="ml-auto w-[260px] text-left text-[10px] leading-[1.15] text-slate-700">
            <div class="font-bold uppercase">KANTOR PUSAT PERUM LPPNPI</div>
            <div>Gedung AirNav Indonesia Tangerang</div>
            <div>Jl. Ir. H. Juanda No. 1 Tangerang</div>
            <div>Banten 15121 Indonesia</div>
            <div>Telp : 021-55915000</div>
            <div>www.airnavindonesia.co.id</div>
          </div>
        </div>

        <div class="mt-16 px-10 text-[14px]">{{ formattedDate }}</div>
        <div class="mt-8 px-10 text-[14px]">
          <table class="w-full">
            <tbody>
              <tr><td class="w-20 align-top">Nomor</td><td class="w-3 align-top">:</td><td>................................................</td></tr>
              <tr><td class="align-top">Sifat</td><td class="align-top">:</td><td class="capitalize">{{ konsep?.sifat || 'Biasa' }}</td></tr>
              <tr><td class="align-top">Lampiran</td><td class="align-top">:</td><td>-</td></tr>
              <tr><td class="align-top">Perihal</td><td class="align-top">:</td><td class="font-bold" v-pre>{{perihal}}</td></tr>
            </tbody>
          </table>
          <div class="mt-10">Kepada Yth.</div>
          <div class="mb-3 font-bold" v-pre>{{tertuju}}</div>
          <div>Di Tempat</div>
        </div>

        <div class="mt-16 min-h-[300px] border-t border-gray-200 relative group dark:border-gray-700">
          <ClientOnly>
            <TinymceEditorAsync
              api-key="no-api-key"
              v-model="kontenModel"
              :initial-value="kontenModel"
              :init="tinyMceInit"
            />
          </ClientOnly>
        </div>

        <div class="mt-12 flex px-10 text-black">
          <div class="min-w-[250px] text-center">
            <div class="mb-24 text-[14px]"><div class="font-bold">{{ signaturePosition }}</div></div>
            <div class="text-[14px] font-bold underline">{{ signatureName }}</div>
          </div>
        </div>
        <div class="mt-8 px-10 text-[12px] text-black">
          <div class="mb-1 font-bold underline">Tembusan :</div>
          <div class="ml-4 pl-2" v-pre>{{tembusan}}</div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showVariables" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showVariables = false" />
        <div class="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Variabel Dinamis</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Klik variabel untuk memasukkannya ke isi surat.</p>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" aria-label="Tutup" @click="showVariables = false" />
          </div>
          <div class="grid grid-cols-1 gap-2 overflow-y-auto p-5 sm:grid-cols-2">
            <button
              v-for="variable in dynamicVariables"
              :key="`${variable.var}-${variable.skema}`"
              type="button"
              class="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
              @click="insertVariable(variable.var)"
            >
              <code class="shrink-0 text-xs font-semibold text-primary-600 dark:text-primary-400">{{ variable.var }}</code>
              <span class="min-w-0 truncate text-xs text-gray-600 dark:text-gray-300">{{ variable.desc }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="showPreview" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPreview = false" />
        <div class="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Preview Perwakilan Surat</h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="showPreview = false" />
          </div>
          <div class="p-4 overflow-y-auto">
            <div class="mb-4">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Preview untuk penerima
              </label>
              <select
                v-model.number="previewIndex"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option v-for="option in previewOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <SdeMasalLetterPreview
              :konsep="konsep"
              :penerima-list="penerimaList"
              :template="{ skema: skemaModel, versi: versiModel, konten: kontenModel }"
              :penerima-index="previewIndex"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import SdeMasalLetterPreview from './SdeMasalLetterPreview.vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { SdeMasalTemplate, SdeMasalConcept, SdeMasalPenerima } from '~/types/sde-masal';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  defaultSkema?: 'KEUANGAN' | 'UMUM' | null;
}>();

const model = defineModel<SdeMasalTemplate | null>({ default: null });
const emit = defineEmits<{ 'update:variables': [variables: string[]] }>();

const skemaModel = ref<string>('DINAMIS');
const versiModel = ref<string>('v1');
const kontenModel = ref<string>('');
const showPreview = ref(false);
const showVariables = ref(false);
const previewIndex = ref<number>(0);
const tinymceEditor = ref<TinyMCEEditor | null>(null);
const { user, getProfile } = useAuth();
const formattedDate = computed(() => {
  if (!props.konsep?.tanggalKonsep) return 'Tangerang, Tanggal surat';
  const date = new Date(`${props.konsep.tanggalKonsep}T00:00:00`);
  return `${user.value?.areaText?.replace('Kantor', '') || 'Tangerang'}, ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
});
const signatureParts = computed(() => (props.konsep?.pengirimName || '').split(' - ').map((value) => value.trim()).filter(Boolean));
const signatureName = computed(() => signatureParts.value[0] || 'Nama Lengkap');
const signaturePosition = computed(() => signatureParts.value.slice(1).join(' - ') || 'Nama Jabatan');

const allVariables = [
  { var: '{{tertuju}}', desc: 'Nama - Jabatan', skema: 'all' },
  { var: '{{nama}}', desc: 'Nama penerima', skema: 'all' },
  { var: '{{jabatan}}', desc: 'Jabatan penerima', skema: 'all' },
  { var: '{{persnum}}', desc: 'Nomor pegawai', skema: 'all' },
  { var: '{{keterangan}}', desc: 'Keterangan', skema: 'all' },
  { var: '{{perihal}}', desc: 'Perihal penerima', skema: 'all' },
  { var: '{{id_tertuju}}', desc: 'ID Tertuju', skema: 'all' },
  { var: '{{tanggal_surat}}', desc: 'Tanggal Surat', skema: 'UMUM' },
  { var: '{{nomor_surat}}', desc: 'Nomor Surat', skema: 'UMUM' },
  { var: '{{sifat_surat}}', desc: 'Sifat Surat', skema: 'UMUM' },
  { var: '{{jumlah_lampiran}}', desc: 'Jumlah Lampiran', skema: 'UMUM' },
  { var: '{{jabatan_penerima}}', desc: 'Jabatan Penerima', skema: 'UMUM' },
  { var: '{{alamat_penerima}}', desc: 'Alamat Penerima', skema: 'UMUM' },
  { var: '{{panggilan_penerima}}', desc: 'Panggilan Penerima', skema: 'UMUM' },
  { var: '{{nominal_rupiah}}', desc: 'Nominal Rupiah', skema: 'UMUM' },
  { var: '{{nominal_dolar}}', desc: 'Nominal Dolar', skema: 'UMUM' },
  { var: '{{nama_cro}}', desc: 'Nama CRO', skema: 'UMUM' },
  { var: '{{email}}', desc: 'Email', skema: 'UMUM' },
  { var: '{{tembusan_1}}', desc: 'Tembusan 1', skema: 'UMUM' },
  { var: '{{tembusan_2}}', desc: 'Tembusan 2', skema: 'UMUM' },
  { var: '{{tembusan}}', desc: 'Tembusan', skema: 'all' },
  { var: '{{email_tertuju}}', desc: 'Email Tertuju', skema: 'UMUM' },
  { var: '{{email_cc}}', desc: 'Email CC', skema: 'UMUM' },
  { var: '{{email_bcc}}', desc: 'Email BCC', skema: 'UMUM' },
  { var: '{{jumlah_tagihan_idr}}', desc: 'Jumlah Tagihan IDR', skema: 'KEUANGAN' },
  { var: '{{jumlah_tagihan_usd}}', desc: 'Jumlah Tagihan USD', skema: 'KEUANGAN' },
  { var: '{{nama_cro}}', desc: 'Nama CRO', skema: 'KEUANGAN' },
  { var: '{{email_cro}}', desc: 'Email CRO', skema: 'KEUANGAN' },
  { var: '{{jabatan_signer}}', desc: 'Jabatan Signer', skema: 'KEUANGAN' },
  { var: '{{nama_signer}}', desc: 'Nama Signer', skema: 'KEUANGAN' },
];

const dynamicVariables = computed(() => {
  const skema = skemaModel.value;
  if (!skema || skema === 'UMUM') {
    return allVariables.filter((v) => v.skema === 'all' || v.skema === 'UMUM');
  }
  if (skema === 'KEUANGAN') {
    return allVariables.filter((v) => v.skema === 'all' || v.skema === 'KEUANGAN');
  }
  return allVariables;
});

const detectedVariables = computed(() => [...new Set(
  Array.from(kontenModel.value.matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g)).map((match) => match[1]),
)]);

// Template konten default untuk skema KEUANGAN (sesuai desain surat PINP)
const keuanganTemplateContent = `<p style="text-align: center;"><strong style="font-size: 14pt;">{{perihal}}</strong></p>
<p>&nbsp;</p>
<p>Kepada Yth,<br />
<strong>{{tertuju}}</strong><br />
Di tempat</p>
<p>&nbsp;</p>
<p>Dengan hormat,</p>
<p>Berdasarkan catatan keuangan AirNav Indonesia, kami menyampaikan bahwa terdapat tagihan atas Biaya Pelayanan Jasa Navigasi Penerbangan (PINP) yang telah jatuh tempo dan belum kami terima pembayarannya sebesar Rp {{jumlah_tagihan_idr}} / $ {{jumlah_tagihan_usd}}. Statement of Account (SOA) terlampir untuk menjadi perhatian.</p>
<p>&nbsp;</p>
<p>Sehubungan dengan hal tersebut, kami mengharapkan bantuan Bapak/Ibu untuk dapat melakukan penyelesaian atas kewajiban dimaksud secepatnya.</p>
<p>&nbsp;</p>
<p>Mengingat biaya PINP memiliki peran penting dalam mendukung keselamatan penerbangan serta merupakan bagian dari pendapatan negara yang wajib disetorkan sesuai ketentuan peraturan yang berlaku, agar hal ini dapat menjadi perhatian dan prioritas.</p>
<p>&nbsp;</p>
<p>Apabila memerlukan klarifikasi lebih lanjut, dapat menghubungi Customer Relationship Officer (CRO) kami yaitu {{nama_cro}}, melalui alamat email {{email_cro}}.</p>
<p>&nbsp;</p>
<p>Demikian disampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p style="text-align: center;">a.n Direktur Utama</p>
<p style="text-align: center;"><strong>{{jabatan_signer}}</strong></p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><strong>{{nama_signer}}</strong></p>
<p>&nbsp;</p>
<p>Tembusan:</p>
<p>{{tembusan}}</p>`;

// Template konten default untuk skema UMUM (surat tagihan PJNP AirNav)
const umumTemplateContent = `<p style="text-align: right;">Tangerang, {{tanggal_surat}}</p>
<p>&nbsp;</p>
<table style="border-collapse: collapse; width: 100%;">
  <tbody>
    <tr>
      <td style="width: 18%; padding: 4px 0; vertical-align: top;">Nomor</td>
      <td style="width: 2%; padding: 4px 0; vertical-align: top;">:</td>
      <td style="width: 80%; padding: 4px 0; vertical-align: top;">{{nomor_surat}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; vertical-align: top;">Sifat</td>
      <td style="padding: 4px 0; vertical-align: top;">:</td>
      <td style="padding: 4px 0; vertical-align: top;">{{sifat_surat}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; vertical-align: top;">Lampiran</td>
      <td style="padding: 4px 0; vertical-align: top;">:</td>
      <td style="padding: 4px 0; vertical-align: top;">{{jumlah_lampiran}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; vertical-align: top;">Perihal</td>
      <td style="padding: 4px 0; vertical-align: top;">:</td>
      <td style="padding: 4px 0; vertical-align: top;"><strong>Pemberitahuan Tagihan PJNP</strong></td>
    </tr>
  </tbody>
</table>
<p>&nbsp;</p>
<p>Kepada Yth.<br />
<strong>{{jabatan_penerima}}</strong><br />
{{alamat_penerima}}</p>
<p>&nbsp;</p>
<p>Dengan hormat,</p>
<p>Berdasarkan catatan keuangan AirNav Indonesia, kami menyampaikan bahwa terdapat tagihan atas Biaya Pelayanan Jasa Navigasi Penerbangan (PJNP) yang telah jatuh tempo dan belum kami terima pembayarannya sebesar {{nominal_rupiah}} / {{nominal_dolar}}.</p>
<p>&nbsp;</p>
<p>Statement of Account (SOA) terlampir untuk menjadi perhatian.</p>
<p>&nbsp;</p>
<p>Sehubungan dengan hal tersebut, kami mengharapkan bantuan {{panggilan_penerima}} untuk dapat melakukan penyelesaian atas kewajiban dimaksud secepatnya mungkin.</p>
<p>&nbsp;</p>
<p>Mengingat biaya PJNP memiliki peran penting dalam mendukung keselamatan penerbangan serta merupakan bagian dari pendapatan negara yang wajib disetorkan sesuai ketentuan peraturan yang berlaku, agar hal ini dapat menjadi perhatian dan prioritas.</p>
<p>&nbsp;</p>
<p>Apabila memerlukan klarifikasi lebih lanjut, dapat menghubungi Customer Relationship Officer (CRO) kami yaitu {{nama_cro}}, melalui alamat email {{email_cro}}.</p>
<p>&nbsp;</p>
<p>Demikian disampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>a.n Direktur Utama</p>
<p><strong>{{jabatan_signer}}</strong></p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p><strong>{{nama_signer}}</strong></p>
<p>&nbsp;</p>
<p>Tembusan:</p>
<p>1. {{tembusan_1}}</p>
<p>2. {{tembusan_2}}</p>`;

// Auto-set skema & konten dari defaultSkema (dari Step 2) saat step dibuka
onMounted(() => {
  if (!user.value) getProfile();
  if (props.defaultSkema && !skemaModel.value) {
    skemaModel.value = props.defaultSkema;
    // Auto-fill konten sesuai skema
    const templateContent = props.defaultSkema === 'KEUANGAN' ? keuanganTemplateContent : umumTemplateContent;
    if (tinymceEditor.value) {
      tinymceEditor.value.setContent(templateContent);
      kontenModel.value = tinymceEditor.value.getContent();
    } else {
      // TinyMCE belum ready, tunggu sebentar
      setTimeout(() => {
        if (tinymceEditor.value) {
          tinymceEditor.value.setContent(templateContent);
          kontenModel.value = tinymceEditor.value.getContent();
        } else {
          kontenModel.value = templateContent;
        }
      }, 500);
    }
  }
});

const previewOptions = computed(() =>
  props.penerimaList.map((p, idx) => ({
    label: `${p.no || idx + 1}. ${p.idTertuju || p.tertuju || p.perihal || 'Penerima'}`,
    value: idx,
  })),
);

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten disini...',
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

watch(model, (template) => {
  if (!template || kontenModel.value || !template.konten) return;
  kontenModel.value = template.konten;
  if (tinymceEditor.value) tinymceEditor.value.setContent(template.konten);
}, { immediate: true, deep: true });



// Auto-fill konten ketika skema dipilih (hanya jika konten masih kosong)
watch(skemaModel, (newSkema) => {
  if (!newSkema) return;
  if (kontenModel.value && kontenModel.value.trim() !== '') return;

  const templateContent = newSkema === 'KEUANGAN' ? keuanganTemplateContent : umumTemplateContent;
  if (tinymceEditor.value) {
    tinymceEditor.value.setContent(templateContent);
    kontenModel.value = tinymceEditor.value.getContent();
  } else {
    kontenModel.value = templateContent;
  }
});

// Sync ke model parent
watch([skemaModel, versiModel, kontenModel], () => {
  model.value = {
    skema: skemaModel.value,
    versi: versiModel.value,
    konten: kontenModel.value,
  };
}, { deep: true });

watch(detectedVariables, (variables) => emit('update:variables', variables), { immediate: true });
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
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
