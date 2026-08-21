<template>
  <div class="bg-white text-black p-8 min-h-[297mm] w-[210mm] mx-auto shadow print:shadow-none font-['Times_New_Roman'] text-[11pt] leading-normal">
    <PerumKopSurat :alamat-info="modelValue?.alamatInfo" />

    <div class="text-center mb-4">
      <h1 class="text-base font-bold uppercase mb-1">Blanko Verbal</h1>
      <p class="text-[11pt] font-bold uppercase leading-tight">
        Perusahaan Umum (PERUM) Lembaga Penyelenggara Pelayanan Navigasi Penerbangan Indonesia
      </p>
    </div>

    <!-- Tabel utama: kolom kiri (identitas), tengah (legal drafter/checker), kanan (referensi + perihal) -->
    <table class="w-full border border-black border-collapse text-[11pt] mb-0">
      <tbody>
        <!-- Baris 1: tanggal / legal drafter / referensi -->
        <tr>
          <td class="border border-black px-2 py-1 align-top w-[26%]">
            <div class="text-center font-semibold">Tangerang/Tgl/Bln/Tahun</div>
            <div class="text-center mt-1">{{ formatTanggal(modelValue?.tanggal) }}</div>
          </td>
          <td class="border border-black px-2 py-1 align-top w-[40%]">
            <div class="font-semibold">Diusulkan oleh</div>
            <div class="text-center font-semibold mt-2">{{ modelValue?.diusulkanOleh || '(Nama Pejabat 1 level di bawah Direksi)' }}</div>
          </td>
          <td class="border border-black px-2 py-1 align-top w-[17%]">
            <div class="font-semibold">Referensi :</div>
          </td>
          <td class="border border-black px-2 py-1 align-top w-[17%]">
            <div class="font-semibold">Dari</div>
            <div class="mt-1">{{ modelValue?.referensiDari || '' }}</div>
          </td>
        </tr>

        <!-- Baris 2: diusulkan jabatan / legal drafter jabatan / kosong / referensi nomor -->
        <tr>
          <td class="border border-black px-2 py-1 align-top text-center">
            <div class="font-semibold">{{ modelValue?.jabatanDiusulkan || '(Jabatan Unit Pemrakarsa)' }}</div>
          </td>
          <td class="border border-black px-2 py-1 align-top">
            <div class="font-semibold">: {{ modelValue?.legalDrafterJabatan || '(Jabatan Yang memiliki Spesialisasi di Bidang Peraturan)' }}</div>
          </td>
          <td class="border border-black px-2 py-1 align-top"></td>
          <td class="border border-black px-2 py-1 align-top">
            <div class="font-semibold">No. Surat</div>
            <div class="mt-1">{{ modelValue?.referensiNomor || '' }}</div>
          </td>
        </tr>

        <!-- Baris 3: kosong / nama legal drafter / kosong / referensi tanggal -->
        <tr>
          <td class="border border-black px-2 py-1 align-top"></td>
          <td class="border border-black px-2 py-1 align-top text-center">
            <div>({{ modelValue?.legalDrafter || 'Nama Pejabat' }})</div>
          </td>
          <td class="border border-black px-2 py-1 align-top"></td>
          <td class="border border-black px-2 py-1 align-top">
            <div class="font-semibold">Tanggal</div>
            <div class="mt-1">{{ formatTanggal(modelValue?.referensiTanggal) }}</div>
          </td>
        </tr>

        <!-- Baris 4: legal checker / perihal -->
        <tr>
          <td class="border border-black px-2 py-1 align-top" colspan="2">
            <div class="font-semibold">Legal Drafting Diperiksa Oleh</div>
            <div class="font-semibold mt-1">: {{ modelValue?.legalCheckerJabatan || '(Jabatan Satu Tingkat di bawah Direksi yang membidangi hukum)' }}</div>
            <div class="text-center mt-2">({{ modelValue?.legalChecker || 'Nama Pejabat satu tingkat di bawah Direksi yang membidangi hukum' }})</div>
          </td>
          <td class="border border-black px-2 py-1 align-top">
            <div class="font-semibold">Perihal</div>
          </td>
          <td class="border border-black px-2 py-1 align-top">
            <div>{{ modelValue?.perihal || 'Permohonan Persetujuan (Judul Peraturan Direksi, Keputusan Direksi)' }}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Tabel bawah: penetapan kiri + paraf direksi kanan -->
    <table class="w-full border border-black border-collapse text-[11pt] mb-0">
      <tbody>
        <tr>
          <!-- Kolom kiri: nomor/tanggal/ditetapkan + perihal/klasifikasi/lampiran -->
          <td class="border border-black px-2 py-1 align-top w-[50%]">
            <table class="w-full border-collapse">
              <tbody>
                <tr>
                  <td class="py-1 align-top w-[130px]"><span class="font-semibold">Nomor</span></td>
                  <td class="py-1 align-top w-[10px]">:</td>
                  <td class="py-1 align-top">{{ modelValue?.nomor || '' }}</td>
                </tr>
                <tr>
                  <td class="py-1 align-top"><span class="font-semibold">Tanggal</span></td>
                  <td class="py-1 align-top">:</td>
                  <td class="py-1 align-top">{{ formatTanggal(modelValue?.tanggal) }}</td>
                </tr>
                <tr>
                  <td class="py-1 align-top"><span class="font-semibold">Ditetapkan/Disahkan Oleh</span></td>
                  <td class="py-1 align-top">:</td>
                  <td class="py-1 align-top"></td>
                </tr>
              </tbody>
            </table>

            <div class="mt-6 text-center font-semibold">a.n DIREKSI</div>
            <div class="text-center font-semibold">DIREKTUR UTAMA</div>
            <div class="mt-8 text-center font-semibold underline">NAMA LENGKAP TANPA GELAR</div>

            <table class="w-full border-collapse mt-6">
              <tbody>
                <tr>
                  <td class="py-1 align-top w-[130px]"><span class="font-semibold">Penetapan / Pengesahan Perihal</span></td>
                  <td class="py-1 align-top w-[10px]">:</td>
                  <td class="py-1 align-top">Draft (Judul Peraturan Direksi, Keputusan Direksi)</td>
                </tr>
                <tr>
                  <td class="py-1 align-top"><span class="font-semibold">Klasifikasi</span></td>
                  <td class="py-1 align-top">:</td>
                  <td class="py-1 align-top">{{ modelValue?.klasifikasi || 'Penting' }}</td>
                </tr>
                <tr>
                  <td class="py-1 align-top"><span class="font-semibold">Lampiran</span></td>
                  <td class="py-1 align-top">:</td>
                  <td class="py-1 align-top">{{ modelValue?.lampiran || '1 (satu) berkas' }}</td>
                </tr>
              </tbody>
            </table>
          </td>

          <!-- Kolom kanan: sebelum ditetapkan + daftar direktur -->
          <td class="border border-black px-2 py-1 align-top w-[50%]">
            <div class="font-semibold mb-3">Sebelum ditetapkan diketahui oleh :</div>
            <div class="space-y-4">
              <div v-for="(d, idx) in directors" :key="d.index ?? idx" class="min-h-[60px]">
                <p class="font-semibold">{{ d.index ?? idx + 1 }}. {{ d.jabatan || '-' }}</p>
                <p class="mt-2 underline text-center">{{ d.nama?.toUpperCase() || 'NAMA LENGKAP TANPA GELAR' }}</p>
              </div>
              <div v-if="directors.length === 0" class="italic text-gray-500">Belum ada data direksi</div>
            </div>
          </td>
        </tr>

        <!-- Catatan -->
        <tr>
          <td class="border border-black px-2 py-1 align-top">
            Setelah selesai di proses, harap diteruskan kepada (unit yang membidangi hukum)
          </td>
          <td class="border border-black px-2 py-1 align-top">
            <div class="font-semibold">Catatan :</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { SheetFormModel, DirectorApprovalItem } from '~/types/naskah-lainnya';

const modelValue = defineModel<SheetFormModel>({ default: () => ({}) });

const props = withDefaults(defineProps<{
  directors: DirectorApprovalItem[];
  showPlaceholders?: boolean;
  readOnly?: boolean;
}>(), {
  directors: () => [],
  showPlaceholders: true,
  readOnly: false,
});

function formatTanggal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatShortTanggal(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

</script>

<style scoped>
@media print {
  .bg-white { background-color: #ffffff !important; color: #000000 !important; }
}
</style>
