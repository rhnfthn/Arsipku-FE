<template>
  <div class="bv-page">
    <div class="bv-header">
      BLANKO VERBAL<br />
      PERUSAHAAN UMUM (PERUM) LEMBAGA PENYELENGGARA PELAYANAN<br />
      NAVIGASI PENERBANGAN INDONESIA
    </div>

    <!-- TOP TABLE -->
    <table class="bv-top">
      <colgroup>
        <col style="width: 24%" />
        <col style="width: 2%" />
        <col style="width: 32%" />
        <col style="width: 14%" />
        <col style="width: 2%" />
        <col style="width: 26%" />
      </colgroup>
      <tbody>
        <tr>
          <td>Tangerang/Tgl/Bln/Tahun</td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-field">{{ formatTanggal(modelValue?.tanggal) }}</div>
          </td>
          <td>Referensi :</td>
          <td colspan="2"><div class="bv-field">&nbsp;</div></td>
        </tr>
        <tr>
          <td><div class="bv-center">Diusulkan oleh</div></td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-small-italic">
              {{ modelValue?.diusulkanOleh || '(Nama Pejabat 1 level di bawah Direksi)' }}<br />{{
                modelValue?.jabatanDiusulkan || '(Jabatan Unit Pemrakarsa)'
              }}
            </div>
          </td>
          <td rowspan="2">
            Dari<br />
            No. Surat<br />
            Tanggal
          </td>
          <td rowspan="2" class="bv-colon">:<br />:<br />:</td>
          <td rowspan="2">
            {{ modelValue?.referensiDari || '' }}<br />
            {{ modelValue?.referensiNomor || '' }}<br />
            {{ formatTanggal(modelValue?.referensiTanggal) }}
          </td>
        </tr>
        <tr>
          <td><div class="bv-center">Legal Drafting Dikerjakan oleh</div></td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-small-italic">
              {{ modelValue?.legalDrafter || '(Nama Pejabat)' }}<br />{{
                modelValue?.legalDrafterJabatan ||
                '(Jabatan Yang memiliki Spesialisasi di Bidang Peraturan)'
              }}
            </div>
          </td>
        </tr>
        <tr>
          <td><div class="bv-center">Legal Drafting Diperiksa Oleh</div></td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-small-italic">
              {{
                modelValue?.legalChecker ||
                '(Nama Pejabat satu tingkat di bawah Direksi yang membidangi hukum)'
              }}<br />{{
                modelValue?.legalCheckerJabatan ||
                '(Jabatan Satu Tingkat di bawah Direksi yang membidangi hukum)'
              }}
            </div>
          </td>
          <td>Perihal</td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-small-italic">
              {{
                modelValue?.perihal ||
                'Permohonan Persetujuan (Judul Peraturan Direksi, Keputusan Direksi)'
              }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- BOTTOM TABLE -->
    <table class="bv-bottom">
      <colgroup>
        <col style="width: 20%" />
        <col style="width: 2%" />
        <col style="width: 36%" />
        <col style="width: 42%" />
      </colgroup>
      <tbody>
        <tr>
          <td>Nomor</td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-field">{{ modelValue?.nomor || '' }}</div>
          </td>
          <td rowspan="2" style="vertical-align: top">Sebelum ditetapkan diketahui oleh :</td>
        </tr>
        <tr>
          <td>Tanggal</td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-field">{{ formatTanggal(modelValue?.tanggal) }}</div>
          </td>
        </tr>
        <tr>
          <td colspan="3">Ditetapkan/Disahkan Oleh</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td colspan="3" style="vertical-align: top">
            <div class="bv-signature-block">
              <div
                v-for="(item, idx) in ditetapkanSlots"
                :key="`ditetapkan-${item.positionId || item.nama || idx}`"
                class="bv-signature-person"
                :class="{ 'bv-signed': isSigned(item) }"
              >
                {{ positionOf(item) }}<br />
                <VisibleDigsig
                  v-if="isSigned(item)"
                  :nama="item.nama"
                  :jabatan="item.jabatan"
                  :delegator="item.delegator"
                  variant="wide"
                />
                <div class="bv-signature-name">
                  {{ nameOf(item) }}
                </div>
              </div>
            </div>
          </td>
          <td style="vertical-align: top">
            <div
              v-if="directorSlots[0]"
              class="bv-director-item bv-director-divider"
              :class="{ 'bv-signed': directorSlots[0] && isSigned(directorSlots[0]) }"
            >
              {{ directorSlots[0].index ?? 1 }}. {{ positionOf(directorSlots[0], '') }}
              <VisibleDigsig
                v-if="isSigned(directorSlots[0])"
                :nama="directorSlots[0].nama"
                :jabatan="directorSlots[0].jabatan"
                :delegator="directorSlots[0].delegator"
              />
              <div class="bv-director-name">
                {{ nameOf(directorSlots[0]) }}
              </div>
            </div>
            <div
              v-if="directorSlots[1]"
              class="bv-director-item"
              :class="{ 'bv-signed': directorSlots[1] && isSigned(directorSlots[1]) }"
            >
              {{ directorSlots[1].index ?? 2 }}. {{ positionOf(directorSlots[1], '') }}
              <VisibleDigsig
                v-if="isSigned(directorSlots[1])"
                :nama="directorSlots[1].nama"
                :jabatan="directorSlots[1].jabatan"
                :delegator="directorSlots[1].delegator"
              />
              <div class="bv-director-name">
                {{ nameOf(directorSlots[1]) }}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td>Penetapan /<br />Pengesahan Perihal</td>
          <td class="bv-colon">:</td>
          <td>
            <div class="bv-small-italic">
              {{ modelValue?.perihal || 'Draft (Judul Peraturan Direksi, Keputusan Direksi)' }}
            </div>
          </td>
          <td style="vertical-align: top">
            <div
              v-if="directorSlots[2]"
              class="bv-director-item"
              :class="{ 'bv-signed': directorSlots[2] && isSigned(directorSlots[2]) }"
            >
              {{ directorSlots[2].index ?? 3 }}. {{ positionOf(directorSlots[2], '') }}
              <VisibleDigsig
                v-if="isSigned(directorSlots[2])"
                :nama="directorSlots[2].nama"
                :jabatan="directorSlots[2].jabatan"
                :delegator="directorSlots[2].delegator"
              />
              <div class="bv-director-name">
                {{ nameOf(directorSlots[2]) }}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td>Klasifikasi</td>
          <td class="bv-colon">:</td>
          <td>{{ modelValue?.klasifikasi || 'Penting' }}</td>
          <td style="vertical-align: top">
            <div
              v-if="directorSlots[3]"
              class="bv-director-item"
              :class="{ 'bv-signed': directorSlots[3] && isSigned(directorSlots[3]) }"
            >
              {{ directorSlots[3].index ?? 4 }}. {{ positionOf(directorSlots[3], '') }}
              <VisibleDigsig
                v-if="isSigned(directorSlots[3])"
                :nama="directorSlots[3].nama"
                :jabatan="directorSlots[3].jabatan"
                :delegator="directorSlots[3].delegator"
              />
              <div class="bv-director-name">
                {{ nameOf(directorSlots[3]) }}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td>Lampiran</td>
          <td class="bv-colon">:</td>
          <td>{{ modelValue?.lampiran || '1 (satu) berkas' }}</td>
          <td style="vertical-align: top">
            <div
              v-if="directorSlots[4]"
              class="bv-director-item"
              :class="{ 'bv-signed': directorSlots[4] && isSigned(directorSlots[4]) }"
            >
              {{ directorSlots[4].index ?? 5 }}. {{ positionOf(directorSlots[4], '') }}
              <VisibleDigsig
                v-if="isSigned(directorSlots[4])"
                :nama="directorSlots[4].nama"
                :jabatan="directorSlots[4].jabatan"
                :delegator="directorSlots[4].delegator"
              />
              <div class="bv-director-name">
                {{ nameOf(directorSlots[4]) }}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="bv-footer-note">
            Setelah selesai di proses, harap diteruskan kepada (unit yang membidangi hukum)
          </td>
        </tr>
        <tr>
          <td colspan="4" class="bv-catatan">Catatan : {{ modelValue?.catatan || '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { SheetFormModel, DirectorApprovalItem } from '~/types/naskah-lainnya';
import VisibleDigsig from '~/components/NaskahLainnya/VisibleDigsig.vue';
import { formatNaskahDate } from '~/utils/naskah-lainnya-date';

const modelValue = defineModel<SheetFormModel>({ default: () => ({}) });

const props = withDefaults(
  defineProps<{
    directors: DirectorApprovalItem[];
    readOnly?: boolean;
    // Pejabat yang sudah memaraf → visible digsig langsung dirender di preview.
    signedDirectors?: DirectorApprovalItem[];
  }>(),
  {
    directors: () => [],
    readOnly: false,
    signedDirectors: () => [],
  }
);

// Samakan dengan isSameDirector di BE: cocokkan positionId dulu, fallback nama.
function isSigned(item: DirectorApprovalItem): boolean {
  return props.signedDirectors.some(
    (s) =>
      (item.positionId && s.positionId && String(item.positionId) === String(s.positionId)) ||
      (item.nama && s.nama && item.nama.trim().toLowerCase() === s.nama.trim().toLowerCase())
  );
}

// Fallback daftar direksi (non-Direktur Utama) standar LPPNPI bila daftar direksi
// belum dimuat. Direktur Utama ditampilkan terpisah di blok tanda tangan a.n DIREKSI.
const STANDARD_DIREKSI: DirectorApprovalItem[] = [
  { index: 1, nama: '', jabatan: 'DIREKTUR OPERASI' },
  { index: 2, nama: '', jabatan: 'DIREKTUR TEKNIK' },
  { index: 3, nama: '', jabatan: 'DIREKTUR KESELAMATAN KEAMANAN DAN STANDARISASI' },
  { index: 4, nama: '', jabatan: 'DIREKTUR KEUANGAN' },
  { index: 5, nama: '', jabatan: 'DIREKTUR SDM & UMUM' },
];
const directorSlots = computed(() => {
  const selected = modelValue.value?.diketahuiOleh;
  if (Array.isArray(selected)) return selected;
  const dirs = Array.isArray(props.directors) ? props.directors : [];
  const filtered = dirs.filter((d) => !/direktur\s*utama/i.test(d.jabatan || ''));
  return filtered.length ? filtered : STANDARD_DIREKSI;
});

const ditetapkanSlots = computed(() => {
  const selected = modelValue.value?.ditetapkanOleh;
  if (Array.isArray(selected)) return selected;
  const dirs = Array.isArray(props.directors) ? props.directors : [];
  const dirut = dirs.find((d) => /direktur\s*utama/i.test(d.jabatan || ''));
  return dirut ? [dirut] : [{ index: 1, nama: '', jabatan: 'DIREKTUR UTAMA' }];
});

function nameOf(director?: DirectorApprovalItem) {
  return (director?.nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase();
}

// Status delegasi PT/PH/PS merupakan keterangan jabatan, bukan bagian nama.
function positionOf(director?: DirectorApprovalItem, fallback = 'DIREKTUR') {
  const position = director?.jabatan || fallback;
  const status = director?.delegator?.trim();
  if (!status || status === 'ybs') return position;
  return new RegExp(`^${status}\\.?\\s+`, 'i').test(position) ? position : `${status}. ${position}`;
}

function formatTanggal(value?: string) {
  return formatNaskahDate(value, '');
}
</script>

<style scoped>
.bv-page {
  width: 100%;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  padding: 15mm 15mm;
  font-family: 'Times New Roman', Times, serif;
  font-size: 13px;
  color: #000;
}

.bv-header {
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

.bv-top {
  margin-bottom: 22px;
}

td {
  border: 1px solid #000;
  padding: 4px 7px;
  vertical-align: top;
  font-size: 13px;
}

.bv-colon {
  width: 14px;
  text-align: center;
  padding-left: 2px;
  padding-right: 2px;
}

.bv-center {
  text-align: center;
}

.bv-small-italic {
  font-size: 11px;
  line-height: 1.3;
}

.bv-signature-block {
  text-align: center;
  padding: 6px 4px 4px 4px;
}

.bv-signature-person {
  margin-bottom: 12px;
}

.bv-signature-name {
  text-decoration: underline;
  display: inline-block;
  margin-top: 55px;
}

/* Sudah diparaf: gap kosong untuk paraf diisi stamp, jarak nama dirapatkan. */
.bv-signature-person.bv-signed .bv-signature-name {
  margin-top: 4px;
}

.bv-director-item {
  margin-bottom: 4px;
}

.bv-director-item :deep(.vd) {
  margin-left: 0;
  margin-right: auto;
}

.bv-director-divider {
  border-bottom: 1px solid #000;
  margin: 0 -7px 6px;
  padding: 0 7px 6px;
}

.bv-director-name {
  text-decoration: underline;
  display: block;
  margin: 45px 0 10px 0;
}

.bv-director-item.bv-signed .bv-director-name {
  margin: 2px 0 8px 0;
}

.bv-catatan {
  height: 60px;
}

.bv-footer-note {
  font-size: 12px;
  line-height: 1.35;
}

.bv-field {
  outline: none;
  min-height: 16px;
}

@media print {
  .bv-page {
    margin: 0;
    padding: 0;
    width: auto;
    min-height: auto;
  }
}
</style>
