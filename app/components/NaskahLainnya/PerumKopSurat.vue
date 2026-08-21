<template>
  <div class="flex items-start pb-4 mb-6 border-b-2 border-black select-none font-['Times_New_Roman']">
    <div class="flex items-end gap-4">
      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-20 w-auto object-contain" />
      <div class="flex flex-col">
        <span class="text-xl font-bold tracking-wide text-black uppercase leading-tight">
          Perusahaan Umum (PERUM)
        </span>
        <span class="text-lg font-bold tracking-wide text-black uppercase leading-tight">
          Lembaga Penyelenggara Pelayanan Navigasi Penerbangan Indonesia
        </span>
        <span class="text-base font-semibold tracking-wide text-black">
          AirNav Indonesia
        </span>
      </div>
    </div>

    <div class="ml-auto text-[11px] leading-[1.3] text-black text-left max-w-[220px]">
      <div class="font-bold uppercase">
        {{ alamatInfo?.kantor || 'Kantor Pusat' }}
      </div>
      <div>
        {{ alamatInfo?.gedung || 'Gedung AirNav Indonesia' }}
      </div>
      <div>
        {{ alamatInfo?.kota || 'Tangerang' }}
      </div>
      <div v-html="alamatInfo?.alamat || 'Jl. Raya Perancis No. 1, Benda, Kota Tangerang, Banten 15125'" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  alamatInfo?: {
    kantor?: string;
    gedung?: string;
    kota?: string;
    alamat?: string;
  };
}

defineProps<Props>();
</script>
