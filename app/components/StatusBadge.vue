<template>
  <span
    class="px-2.5 py-0.5 text-xs rounded-full font-medium inline-flex items-center gap-1 w-fit"
    :class="colorClass"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * StatusBadge — mendukung 2 mode:
 * 1. Legacy mode: `active` boolean → Aktif/Nonaktif
 * 2. Status mode: `status` string → warna & label sesuai mapping
 *
 * Mapping status (untuk Arsip Dinamis):
 * - draft                → Abu-abu
 * - aktif / active       → Hijau (primary)
 * - menunggu_verifikasi  → Kuning (warning)
 * - ditolak              → Merah (error)
 * - closed_retensi_aktif → Hijau (success)
 */

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft: {
    label: 'Draft',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  aktif: {
    label: 'Aktif',
    bg: 'bg-primary-50 dark:bg-primary-900/30',
    text: 'text-primary-700 dark:text-primary-400',
    dot: 'bg-primary-500',
  },
  active: {
    label: 'Aktif',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  menunggu_verifikasi: {
    label: 'Menunggu Verifikasi',
    bg: 'bg-warning-50 dark:bg-warning-900/30',
    text: 'text-warning-700 dark:text-warning-400',
    dot: 'bg-warning-500',
  },
  ditolak: {
    label: 'Ditolak',
    bg: 'bg-error-50 dark:bg-error-900/30',
    text: 'text-error-700 dark:text-error-400',
    dot: 'bg-error-500',
  },
  closed_retensi_aktif: {
    label: 'Closed — Retensi Aktif',
    bg: 'bg-success-50 dark:bg-success-900/30',
    text: 'text-success-700 dark:text-success-400',
    dot: 'bg-success-500',
  },
};

const props = withDefaults(
  defineProps<{
    active?: boolean;
    status?: string;
  }>(),
  { active: true }
);

const statusConfig = computed(() => {
  if (props.status) {
    const key = props.status.toLowerCase().replace(/[\s-]+/g, '_');
    return STATUS_MAP[key] || STATUS_MAP['draft'];
  }
  return null;
});

const isActive = computed(() => {
  if (statusConfig.value) return true; // has explicit status mapping
  return props.active;
});

const colorClass = computed(() => {
  if (statusConfig.value) {
    return `${statusConfig.value.bg} ${statusConfig.value.text}`;
  }
  return isActive.value
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
});

const dotClass = computed(() => {
  if (statusConfig.value) return statusConfig.value.dot;
  return isActive.value ? 'bg-emerald-500' : 'bg-gray-400';
});

const label = computed(() => {
  if (statusConfig.value) return statusConfig.value.label;
  return isActive.value ? 'Aktif' : 'Nonaktif';
});
</script>
