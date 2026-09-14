<template>
  <UAvatar
    :size="size"
    :src="activeSrc"
    :alt="alt"
    :class="avatarClass"
    @error="onImageError"
  >
    <slot />
  </UAvatar>
</template>

<script setup lang="ts">
/**
 * Avatar foto profile dengan fallback berantai:
 * 1. e-chain (persnum lengkap) — sumber utama
 * 2. PPID (5 digit terakhir persnum) — metode sebelumnya
 * 3. Initials nama (slot default UAvatar)
 *
 * Dipakai untuk foto pegawai AirNav; persnum diambil dari user login
 * atau prop persnum eksplisit.
 */
import { computed, ref, watch, type PropType } from 'vue';
import { getProfilePhotoUrl, getProfilePhotoFallbackUrl } from '~/utils/profile-photo';

const props = defineProps({
  /** Persnum pegawai — sumber URL foto profile */
  persnum: {
    type: [String, Number] as PropType<string | number | null | undefined>,
    default: null,
  },
  alt: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
  },
  avatarClass: {
    type: String,
    default: '',
  },
});

// Tahap fallback: 0 = e-chain, 1 = PPID, 2 = initials (src null)
const stage = ref(0);

watch(
  () => props.persnum,
  () => {
    stage.value = 0;
  },
);

const activeSrc = computed(() => {
  if (stage.value === 0) return getProfilePhotoUrl(props.persnum);
  if (stage.value === 1) return getProfilePhotoFallbackUrl(props.persnum);
  return null;
});

const onImageError = () => {
  if (stage.value < 2) stage.value += 1;
};
</script>
