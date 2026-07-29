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
 * - aktif / active       → Hijau
 * - menunggu_verifikasi  → Kuning
 * - ditolak              → Merah
 * - closed_retensi_aktif → Biru
 * Warna berkas-status disamakan dengan badge di tabel Berkas Saya (berkas-saya.vue STATUS_STYLE).
 */

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft: {
    label: 'Draft',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  aktif: {
    label: 'Terbuka',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-700',
  },
  active: {
    label: 'Aktif',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  menunggu_verifikasi: {
    label: 'Menunggu Verifikasi Managerial',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-700',
  },
  ditolak: {
    label: 'Verifikasi Ditolak Managerial',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-600',
  },
  closed_retensi_aktif: {
    label: 'Tertutup',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-600',
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
