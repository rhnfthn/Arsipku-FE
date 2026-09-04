<template>
  <div class="bg-white text-black p-8 md:p-12 font-['Times_New_Roman'] text-[14px] leading-relaxed min-h-[1123px]">
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

    <!-- Isi Surat (template dirender utuh, termasuk tanda tangan & tembusan) -->
    <div class="text-justify text-[14px]" v-html="renderedContent" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useApi } from '~/composables/useApi';
import {
  renderSdeMasalKonten,
  setTertujuEksternalLookup,
  setInternalPositionLookup,
} from '~/utils/sde-masal-render';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  penerimaIndex?: number;
}>();

const { user } = useAuth();
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();
// Trigger reaktif: naikkan nilainya setelah lookup posisi internal dimuat
const internalLookupVersion = ref(0);

onMounted(async () => {
  try {
    await fetchTertujuEksternal();
    setTertujuEksternalLookup(tertujuEksternal.value);
  } catch (error) {
    console.warn('Gagal memuat master tertuju eksternal untuk preview surat SDE Masal', error);
  }
  // Muat posisi internal untuk resolve tembusan internal (position ID → jabatan)
  try {
    const { apiGet } = useApi();
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    setInternalPositionLookup(rows);
    internalLookupVersion.value++;
  } catch {
    /* gagal load → fallback tampilkan kode position */
  }
});

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
const findTertujuEksternal = (value: string | number | null | undefined) => {
  const raw = String(value ?? '').trim();
  const code = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find((item) => String(item.kode ?? '').trim().padStart(3, '0') === code) || null;
};
const selectedTertujuEksternal = computed(() => {
  return findTertujuEksternal(selectedPenerima.value?.idTertuju || selectedPenerima.value?.tertuju);
});
const recipientCompanyName = computed(() => {
  return selectedTertujuEksternal.value?.nama || null;
});

const penerimaLabel = computed(() => {
  const p = selectedPenerima.value;
  if (!p) return '[Jabatan Penerima]';
  return p.jabatanPenerima || recipientCompanyName.value || p.idTertuju || p.tertuju || `${p.nama || ''}${p.nama && p.jabatan ? ' - ' : ''}${p.jabatan || ''}` || '[Jabatan Penerima]';
});

const alamatPenerima = computed(() => {
  const p = selectedPenerima.value;
  if (!p) return '[Alamat Penerima]';
  return p.alamatPenerima || p.alamat || selectedTertujuEksternal.value?.alamat || 'Di tempat';
});

const renderedContent = computed(() => {
  // internalLookupVersion: trigger reaktif agar konten dirender ulang
  // setelah data posisi internal selesai dimuat.
  void internalLookupVersion.value;
  return renderSdeMasalKonten(
    props.template?.konten || '',
    selectedPenerima.value,
    props.konsep,
    recipientCompanyName.value,
  );
});
</script>
