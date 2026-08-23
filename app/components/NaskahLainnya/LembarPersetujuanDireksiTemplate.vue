<template>
  <div class="lpd-page">
    <div class="lpd-header">
      LEMBAR PERSETUJUAN DIREKSI<br>
      PERUSAHAAN UMUM (PERUM) LEMBAGA PENYELENGGARA PELAYANAN<br>
      NAVIGASI PENERBANGAN INDONESIA
    </div>

    <!-- TOP TABLE -->
    <table class="lpd-top">
      <colgroup>
        <col style="width:26%">
        <col style="width:2%">
        <col style="width:34%">
        <col style="width:14%">
        <col style="width:2%">
        <col style="width:22%">
      </colgroup>
      <tbody>
      <tr>
        <td>Tangerang/Tgl/Bln/Tahun</td>
        <td class="lpd-colon">:</td>
        <td><div class="lpd-field">{{ formatTanggal(modelValue?.tanggal) }}</div></td>
        <td>Referensi :</td>
        <td colspan="2"><div class="lpd-field">&nbsp;</div></td>
      </tr>
      <tr>
        <td class="lpd-tall">
          <div class="lpd-center">Diusulkan Oleh</div>
          <br><br><br>
          <div class="lpd-small-italic lpd-center">(Nama Pejabat 1 Level di<br>bawah Direksi )</div>
        </td>
        <td class="lpd-colon">:</td>
        <td>
          <div class="lpd-small-italic lpd-center">
            {{ modelValue?.diusulkanOleh || '(Nama Pejabat)' }}<br>
            {{ modelValue?.jabatanDiusulkan || '(Jabatan Unit Pemrakarsa)' }}
          </div>
        </td>
        <td>
          Dari<br><br><br>
          No. Surat<br><br><br>
          Tanggal
        </td>
        <td class="lpd-colon">
          :<br><br><br>:<br><br><br>:
        </td>
        <td>
          {{ modelValue?.referensiDari || '' }}<br><br><br>
          {{ modelValue?.referensiNomor || '' }}<br><br><br>
          {{ formatTanggal(modelValue?.referensiTanggal) }}
        </td>
      </tr>
      <tr>
        <td>Perihal</td>
        <td colspan="5">
          <div class="lpd-small-italic">Permohonan Persetujuan (Judul Naskah Dinas Yang Dimintakan Persetujuan Direksi )</div>
          <div class="lpd-field" style="min-height:34px;">{{ modelValue?.perihal }}</div>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- BOTTOM TABLE -->
    <table class="lpd-bottom">
      <colgroup>
        <col style="width:20%">
        <col style="width:2%">
        <col style="width:36%">
        <col style="width:42%">
      </colgroup>
      <tbody>
      <tr>
        <td>Nomor</td>
        <td class="lpd-colon">:</td>
        <td><div class="lpd-field">{{ modelValue?.nomor }}</div></td>
        <td rowspan="2" style="vertical-align:top;">Sebelum ditetapkan diketahui oleh :</td>
      </tr>
      <tr>
        <td>Tanggal</td>
        <td class="lpd-colon">:</td>
        <td><div class="lpd-field">{{ formatTanggal(modelValue?.tanggal) }}</div></td>
      </tr>
      <tr>
        <td colspan="3">Ditetapkan/Disahkan Oleh</td>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td colspan="3" style="vertical-align:top;">
          <div class="lpd-signature-block">
            a.n DIREKSI<br>
            DIREKTUR UTAMA<br>
            <div class="lpd-signature-name">NAMA LENGKAP TANPA GELAR</div>
          </div>
        </td>
        <td style="vertical-align:top;">
          <div class="lpd-director-item" v-if="directorSlots[0]">
            {{ (directorSlots[0].index ?? 1) }}. {{ directorSlots[0].jabatan || '' }}
            <div class="lpd-director-name">{{ (directorSlots[0].nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase() }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>Penetapan /<br>Pengesahan Perihal</td>
        <td class="lpd-colon">:</td>
        <td>
          <div class="lpd-small-italic">Draft ( {{ modelValue?.perihal || 'Judul Peraturan Direksi, Keputusan Direksi' }} )</div>
        </td>
        <td style="vertical-align:top;">
          <div class="lpd-director-item" v-if="directorSlots[1]">
            {{ (directorSlots[1].index ?? 2) }}. {{ directorSlots[1].jabatan || '' }}
            <div class="lpd-director-name">{{ (directorSlots[1].nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase() }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>Klasifikasi</td>
        <td class="lpd-colon">:</td>
        <td>{{ modelValue?.klasifikasi || 'Penting' }}</td>
        <td style="vertical-align:top;">
          <div class="lpd-director-item" v-if="directorSlots[2]">
            {{ (directorSlots[2].index ?? 3) }}. {{ directorSlots[2].jabatan || '' }}
            <div class="lpd-director-name">{{ (directorSlots[2].nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase() }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>Lampiran</td>
        <td class="lpd-colon">:</td>
        <td>{{ modelValue?.lampiran || '1 (satu) berkas' }}</td>
        <td style="vertical-align:top;">
          <div class="lpd-director-item" v-if="directorSlots[3]">
            {{ (directorSlots[3].index ?? 4) }}. {{ directorSlots[3].jabatan || '' }}
            <div class="lpd-director-name">{{ (directorSlots[3].nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase() }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td class="lpd-colon">&nbsp;</td>
        <td>&nbsp;</td>
        <td style="vertical-align:top;">
          <div class="lpd-director-item" v-if="directorSlots[4]">
            {{ (directorSlots[4].index ?? 5) }}. {{ directorSlots[4].jabatan || '' }}
            <div class="lpd-director-name">{{ (directorSlots[4].nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase() }}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="3" class="lpd-footer-note">Setelah selesai di proses, harap diteruskan kepada (unit yang membidangi hukum)</td>
        <td class="lpd-catatan">Catatan :</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const modelValue = defineModel({ default: () => ({}) });

const props = defineProps({
  directors: { type: Array, default: () => [] },
  showPlaceholders: { type: Boolean, default: true },
  readOnly: { type: Boolean, default: false },
});

// Fallback daftar direksi standar LPPNPI bila daftar direksi belum dimuat.
const STANDARD_DIREKSI = [
  { index: 1, jabatan: 'DIREKTUR OPERASI' },
  { index: 2, jabatan: 'DIREKTUR TEKNIK' },
  { index: 3, jabatan: 'DIREKTUR KESELAMATAN KEAMANAN DAN STANDARISASI' },
  { index: 4, jabatan: 'DIREKTUR KEUANGAN' },
  { index: 5, jabatan: 'DIREKTUR SDM & UMUM' },
];
const directorSlots = computed(() =>
  props.directors && props.directors.length ? props.directors : STANDARD_DIREKSI,
);

function formatTanggal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

</script>

<style scoped>
.lpd-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  padding: 15mm 15mm;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
  font-family: "Times New Roman", Times, serif;
  font-size: 13px;
  color: #000;
}

.lpd-header {
  text-align: center;
  font-weight: bold;
  text-transform: uppercase;
  line-height: 1.4;
  margin-bottom: 14px;
  font-size: 13px;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.lpd-top {
  margin-bottom: 22px;
}

td {
  border: 1px solid #000;
  padding: 4px 7px;
  vertical-align: top;
  font-size: 13px;
}

.lpd-colon {
  width: 14px;
  text-align: center;
  padding-left: 2px;
  padding-right: 2px;
}

.lpd-small-italic {
  font-size: 11px;
  line-height: 1.3;
}

.lpd-center {
  text-align: center;
}

.lpd-tall {
  height: 90px;
}

.lpd-signature-block {
  text-align: center;
  padding: 6px 4px 4px 4px;
}

.lpd-signature-name {
  text-decoration: underline;
  display: inline-block;
  margin-top: 55px;
}

.lpd-director-item {
  margin-bottom: 4px;
}

.lpd-director-name {
  text-decoration: underline;
  display: block;
  margin: 45px 0 10px 0;
}

.lpd-catatan {
  height: 60px;
}

.lpd-footer-note {
  font-size: 12px;
  line-height: 1.35;
}

.lpd-field {
  outline: none;
  min-height: 16px;
}

@media print {
  .lpd-page {
    box-shadow: none;
    margin: 0;
    padding: 0;
    width: auto;
    min-height: auto;
  }
}
</style>