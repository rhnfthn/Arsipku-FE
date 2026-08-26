<template>
  <div class="bg-white text-black p-8 md:p-12 font-['Times_New_Roman'] text-[14px] leading-relaxed min-h-[800px]">
    <!-- Kop Surat -->
    <div class="flex items-end pb-4 mb-6 border-b-2 border-black">
      <div class="flex items-end gap-4">
        <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
        <div class="flex flex-col mb-1">
          <span class="text-2xl font-bold tracking-wide text-[18px]">AirNav Indonesia</span>
        </div>
      </div>
      <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-left max-w-[220px]">
        <div class="font-bold uppercase">{{ alamatInfo?.kantor || 'Kantor Pusat Perum LPPNPI' }}</div>
        <div>{{ alamatInfo?.gedung }} {{ alamatInfo?.kota }}</div>
        <div v-html="alamatInfo?.alamat"></div>
      </div>
    </div>

    <!-- Tanggal -->
    <div class="flex mb-4 text-[14px]">
      <div>{{ tempat }}, {{ formattedDate }}</div>
    </div>

    <!-- Metadata Surat -->
    <div class="flex flex-col md:flex-row gap-8 mb-8 text-[14px]">
      <div class="w-full">
        <table class="w-full align-top">
          <tbody>
            <tr>
              <td class="w-[80px] align-top">Nomor</td>
              <td class="w-[10px] align-top">:</td>
              <td class="align-top">{{ nomorSurat }}</td>
            </tr>
            <tr>
              <td class="align-top">Sifat</td>
              <td class="align-top">:</td>
              <td class="align-top capitalize">{{ sifatSurat }}</td>
            </tr>
            <tr>
              <td class="align-top">Lampiran</td>
              <td class="align-top">:</td>
              <td class="align-top">{{ lampiran || '-' }}</td>
            </tr>
            <tr>
              <td class="align-top">Perihal</td>
              <td class="align-top">:</td>
              <td class="align-top font-bold text-justify">{{ perihal }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Penerima -->
    <div class="mb-6 text-[14px]">
      <div>Kepada Yth.</div>
      <div class="font-bold">{{ penerimaLabel }}</div>
      <div>{{ alamatPenerima }}</div>
    </div>

    <!-- Isi Surat -->
    <div class="text-justify text-[14px] mb-8" v-html="renderedContent" />

    <!-- Tanda Tangan -->
    <div class="flex mt-12 text-black">
      <div class="text-center min-w-[250px]">
        <div v-if="atasNamaLabel" class="font-bold mb-1">a.n {{ atasNamaLabel }}</div>
        <div class="font-bold mb-24">{{ jabatanSigner }}</div>
        <div class="font-bold underline">{{ namaSigner }}</div>
      </div>
    </div>

    <!-- Tembusan -->
    <div v-if="tembusanList.length > 0" class="mt-8 text-[12px]">
      <div class="font-bold underline mb-1">Tembusan :</div>
      <ol class="list-decimal ml-4 pl-2">
        <li v-for="(t, idx) in tembusanList" :key="idx">{{ t }}</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  penerimaIndex?: number;
}>();

const { user } = useAuth();

const alamatInfo = computed(() => user.value?.alamatInfo);
const tempat = computed(() => {
  const area = user.value?.areaText || '';
  // Kantor Pusat tidak punya kota spesifik di areaText; fallback ke kota kantor
  if (!area || area.toLowerCase().includes('kantor pusat')) {
    return user.value?.alamatInfo?.kota || 'Tangerang';
  }
  return area.replace('Kantor', '').trim() || 'Tangerang';
});

const formattedDate = computed(() => {
  const raw = props.konsep?.tanggalKonsep;
  if (!raw) return '[Tanggal Surat]';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const nomorSurat = computed(() => '[Nomor Surat]');
const sifatSurat = computed(() => props.konsep?.sifat || 'Biasa');
const lampiran = computed(() => {
  const p = selectedPenerima.value;
  return p?.jumlahLampiran || '-';
});

const perihal = computed(() => {
  const first = selectedPenerima.value;
  return first?.perihal || props.konsep?.perihal || '[Perihal]';
});

const selectedPenerima = computed(() => {
  const idx = Math.max(0, Math.min(props.penerimaIndex || 0, props.penerimaList.length - 1));
  return props.penerimaList[idx] || null;
});

const penerimaLabel = computed(() => {
  const p = selectedPenerima.value;
  if (!p) return '[Jabatan Penerima]';
  return p.jabatanPenerima || p.idTertuju || p.tertuju || `${p.nama || ''}${p.nama && p.jabatan ? ' - ' : ''}${p.jabatan || ''}` || '[Jabatan Penerima]';
});

const alamatPenerima = computed(() => {
  const p = selectedPenerima.value;
  if (!p) return '[Alamat Penerima]';
  return p.alamatPenerima || p.alamat || 'Di tempat';
});

const atasNamaLabel = computed(() => {
  // Jika pengirim bukan Dirut, tampilkan a.n Dirut (sesuai alur SDE)
  const pengirimName = props.konsep?.pengirimName || '';
  if (pengirimName.toLowerCase().includes('direktur utama')) return '';
  return 'Direktur Utama';
});

const jabatanSigner = computed(() => {
  const p = selectedPenerima.value;
  if (p?.jabatanSigner) return p.jabatanSigner;
  const pengirimName = props.konsep?.pengirimName || '';
  return pengirimName || '[JABATAN_SIGNER]';
});

const namaSigner = computed(() => {
  const p = selectedPenerima.value;
  if (p?.namaSigner) return p.namaSigner;
  return '[NAMA_SIGNER]';
});

const tembusanList = computed(() => {
  const p = selectedPenerima.value;
  const raw = p?.tembusan || '';
  if (!raw) return [];
  return raw
    .split(/[;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
});

const renderedContent = computed(() => {
  const p = selectedPenerima.value;
  let html = props.template?.konten || '<p>(Konten kosong)</p>';
  if (!p) return html;

  const nama = p.nama || '';
  const jabatan = p.jabatan || p.jabatanPenerima || '';
  const tertuju = p.idTertuju || p.tertuju || (nama && jabatan ? `${nama} - ${jabatan}` : nama || jabatan || '-');

  return html
    .replace(/\{\{tertuju\}\}/g, tertuju)
    .replace(/\{\{nama\}\}/g, nama || '-')
    .replace(/\{\{jabatan\}\}/g, jabatan || '-')
    .replace(/\{\{persnum\}\}/g, p.persnum || p.kodePos || '-')
    .replace(/\{\{keterangan\}\}/g, p.keterangan || '-')
    .replace(/\{\{alamat\}\}/g, p.alamat || '-')
    .replace(/\{\{kota\}\}/g, p.kota || '-')
    .replace(/\{\{kode_pos\}\}/g, p.kodePos || '-')
    .replace(/\{\{kodepos\}\}/g, p.kodePos || '-')
    .replace(/\{\{perihal\}\}/g, p.perihal || props.konsep?.perihal || '-')
    .replace(/\{\{id_tertuju\}\}/g, p.idTertuju || '-')
    .replace(/\{\{idramount\}\}/g, p.idramount || '-')
    .replace(/\{\{usdamount\}\}/g, p.usdamount || '-')
    .replace(/\{\{namacro\}\}/g, p.namacro || '-')
    .replace(/\{\{email\}\}/g, p.email || '-')
    .replace(/\{\{tembusan\}\}/g, p.tembusan || '-')
    .replace(/\{\{email_tertuju\}\}/g, p.emailTertuju || '-')
    .replace(/\{\{email_cc\}\}/g, p.emailCc || '-')
    .replace(/\{\{email_bcc\}\}/g, p.emailBcc || '-')
    .replace(/\{\{jumlah_tagihan_idr\}\}/g, p.jumlahTagihanIdr || '-')
    .replace(/\{\{jumlah_tagihan_usd\}\}/g, p.jumlahTagihanUsd || '-')
    .replace(/\{\{nama_cro\}\}/g, p.namaCro || '-')
    .replace(/\{\{email_cro\}\}/g, p.emailCro || '-')
    .replace(/\{\{jabatan_signer\}\}/g, p.jabatanSigner || '-')
    .replace(/\{\{nama_signer\}\}/g, p.namaSigner || '-')
    .replace(/\{\{tanggal_surat\}\}/g, props.konsep?.tanggalKonsep ? new Date(props.konsep.tanggalKonsep).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Tanggal Surat]')
    .replace(/\{\{nomor_surat\}\}/g, '[Nomor Surat]')
    .replace(/\{\{sifat_surat\}\}/g, props.konsep?.sifat || 'Biasa')
    .replace(/\{\{jumlah_lampiran\}\}/g, p.jumlahLampiran || '-')
    .replace(/\{\{jabatan_penerima\}\}/g, p.jabatanPenerima || '-')
    .replace(/\{\{alamat_penerima\}\}/g, p.alamatPenerima || p.alamat || 'Di tempat')
    .replace(/\{\{panggilan_penerima\}\}/g, p.panggilanPenerima || 'Bapak/Ibu')
    .replace(/\{\{nominal_rupiah\}\}/g, p.nominalRupiah || p.idramount || '-')
    .replace(/\{\{nominal_dolar\}\}/g, p.nominalDolar || p.usdamount || '-')
    .replace(/\{\{tembusan_1\}\}/g, p.tembusan1 || (p.tembusan ? p.tembusan.split(';')[0] : '-'))
    .replace(/\{\{tembusan_2\}\}/g, p.tembusan2 || (p.tembusan ? p.tembusan.split(';')[1] || '-' : '-'));
});
</script>
