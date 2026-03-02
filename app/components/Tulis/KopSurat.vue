<template>
  <div class="flex items-center pb-2 mb-6 select-none">
    <div class="flex items-end gap-4">
      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
      <div class="flex flex-col mb-1">
        <span class="text-2xl font-bold tracking-wide text-[18px] text-black">
          AirNav Indonesia
        </span>
      </div>
    </div>

    <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-left">
      <div class="font-bold uppercase">
        {{ alamatInfo?.kantor }}
      </div>
      <div>
        {{ alamatInfo?.gedung }}
        {{ alamatInfo?.kota }}
      </div>
      <div v-html="alamatInfo?.alamat"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  alamatInfo?: {
    kantor?: string;
    gedung?: string;
    kota?: string;
    alamat?: string;
  }
}>();
</script>
