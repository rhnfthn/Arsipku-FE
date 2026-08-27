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
              <USelectMenu
                v-model="previewIndex"
                :items="previewOptions"
                value-key="value"
                class="w-full"
                variant="outline"
              />
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

const skemaModel = ref<string>('');
const versiModel = ref<string>('');
const kontenModel = ref<string>('');
const showPreview = ref(false);
const previewIndex = ref<number>(0);
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const skemaOptions = [
  { label: 'Keuangan / Tagihan PINP', value: 'KEUANGAN' },
  { label: 'Umum', value: 'UMUM' },
];

const versiOptions = [
  { label: 'v1', value: 'v1' },
  { label: 'v2', value: 'v2' },
];

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
  { var: '{{idramount}}', desc: 'IDR Amount', skema: 'UMUM' },
  { var: '{{usdamount}}', desc: 'USD Amount', skema: 'UMUM' },
  { var: '{{namacro}}', desc: 'Nama Macro', skema: 'UMUM' },
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
</script>