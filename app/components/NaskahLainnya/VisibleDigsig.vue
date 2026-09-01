<template>
  <div class="vd" :class="{ 'vd--wide': variant === 'wide' }">
    <img class="vd-logo" src="/logoAirnav.png" alt="AirNav" />
    <div class="vd-text">
      <div class="vd-title">Ditandatangani secara elektronik oleh</div>
      <div class="vd-jabatan">{{ jabatanLabel }}</div>
      <div class="vd-nama">{{ namaLabel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Cermin renderVisibleDigsig (be/src/modules/generate_pdf/services/sheet-pdf.shared.ts)
// untuk preview on-screen — ukuran & susunan sengaja disamakan dengan stamp di PDF.
const props = withDefaults(
  defineProps<{
    nama?: string;
    jabatan?: string;
    // Status delegasi: PT/PH/PS di-prefix di depan jabatan; 'ybs' tanpa prefix.
    delegator?: string;
    variant?: 'compact' | 'wide';
  }>(),
  { nama: '', jabatan: '', delegator: '', variant: 'compact' }
);

const namaLabel = computed(() =>
  (props.nama || 'NAMA LENGKAP TANPA GELAR').toUpperCase()
);
const jabatanLabel = computed(() => {
  const status = props.delegator?.trim();
  const jabatan = props.jabatan || 'DIREKTUR';
  return status && status !== 'ybs' ? `${status}. ${jabatan}` : jabatan;
});
</script>

<style scoped>
.vd {
  width: 100%;
  max-width: 143px;
  min-height: 29px;
  border: 1.5px solid #1f2937;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  margin: 3px 0 2px;
  background: #fff;
  break-inside: avoid;
  box-sizing: border-box;
  color: #000;
}
.vd--wide {
  max-width: 176px;
  min-height: 32px;
  margin-left: auto;
  margin-right: auto;
}
.vd-logo {
  width: 23px;
  height: 23px;
  object-fit: contain;
  flex: 0 0 auto;
}
.vd-text {
  min-width: 0;
  flex: 1 1 auto;
  text-align: left;
  font-family: 'Times New Roman', Times, serif;
  line-height: 1.12;
  color: #000;
}
.vd-title {
  font-size: 4.5px;
  font-weight: 400;
  margin-bottom: 1px;
}
.vd-jabatan {
  font-size: 5px;
  font-weight: 700;
  margin-bottom: 4px;
}
.vd-nama {
  font-size: 6.5px;
  font-weight: 700;
  white-space: normal;
  word-break: break-word;
}
.vd--wide .vd-title {
  font-size: 5px;
}
.vd--wide .vd-jabatan {
  font-size: 5.5px;
}
.vd--wide .vd-nama {
  font-size: 7px;
}
</style>
