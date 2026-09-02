<template>
  <div class="space-y-3">
    <div
      v-for="(d, idx) in directors"
      :key="`${d.roleLabel || 'direksi'}-${d.positionId || d.nama || idx}-${idx}`"
      class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      :class="{
        'ring-1 ring-primary-400 dark:ring-primary-600':
          isCurrentUserApprover && d.status === 'waiting',
      }"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          >
            {{ d.index ?? idx + 1 }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {{ displayName(d) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ displayPosition(d) }}
            </p>
            <div
              v-if="d.delegatePersnum && isLegal && d.status === 'waiting'"
              class="mt-1 inline-flex items-center gap-2 text-xs font-medium"
            >
              <button
                type="button"
                class="text-primary-600 hover:underline dark:text-primary-400"
                @click="$emit('editDelegate', d)"
              >
                Ubah delegasi
              </button>
              <button
                type="button"
                class="text-red-500 hover:underline"
                @click="$emit('removeDelegate', d)"
              >
                Hapus
              </button>
            </div>
            <button
              v-else-if="isLegal && d.status === 'waiting'"
              type="button"
              class="inline-flex items-center gap-1 mt-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              @click="$emit('addDelegate', d)"
            >
              <UIcon name="i-lucide-plus" class="w-3 h-3" /> Tambah Delegate
            </button>
            <p v-if="d.catatan" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="font-medium">Catatan:</span> {{ d.catatan }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :status="d.status || 'pending'" />

          <template
            v-if="d.status === 'waiting' && canApprove && (!canApproveItem || canApproveItem(d))"
          >
            <UButton
              color="primary"
              icon="i-lucide-pen-line"
              class="font-semibold shadow-sm shadow-primary-500/20"
              :loading="busy"
              @click="$emit('paraf', d)"
            >
              {{ parafLabel || 'Paraf' }}
            </UButton>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-x"
              class="font-semibold"
              :loading="busy"
              @click="$emit('tolak', d)"
            >
              Tolak
            </UButton>
          </template>
        </div>
      </div>
    </div>

    <div v-if="directors.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
      Belum ada daftar direksi.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DirectorApprovalItem } from '~/types/naskah-lainnya';

function displayName(director: DirectorApprovalItem) {
  return director.delegateName?.trim() || director.nama || '-';
}

function displayPosition(director: DirectorApprovalItem) {
  const position = director.jabatan?.trim() || '-';
  const status = director.delegatePositionStatus?.trim();
  if (!director.delegateName?.trim() || !status || position === '-') return position;
  return new RegExp(`^${status}\\.?\\s+`, 'i').test(position) ? position : `${status}. ${position}`;
}

defineProps<{
  directors: DirectorApprovalItem[];
  isCurrentUserApprover?: boolean;
  canApprove?: boolean;
  canApproveItem?: (item: DirectorApprovalItem) => boolean;
  busy?: boolean;
  // Label aksi dapat diringkas oleh halaman pemakai (mis. "Setuju").
  parafLabel?: string;
  isLegal?: boolean;
}>();

defineEmits<{
  (e: 'paraf', item: DirectorApprovalItem): void;
  (e: 'tolak', item: DirectorApprovalItem): void;
  (e: 'addDelegate', item: DirectorApprovalItem): void;
  (e: 'editDelegate', item: DirectorApprovalItem): void;
  (e: 'removeDelegate', item: DirectorApprovalItem): void;
}>();
</script>
