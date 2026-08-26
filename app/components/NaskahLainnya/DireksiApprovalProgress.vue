<template>
  <div class="space-y-3">
    <div
      v-for="(d, idx) in directors"
      :key="d.index ?? idx"
      class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      :class="{ 'ring-1 ring-primary-400 dark:ring-primary-600': isCurrentUserApprover && d.status === 'waiting' }"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          >
            {{ d.index ?? idx + 1 }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ d.nama || '-' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ d.jabatan || '-' }}</p>
            <p v-if="d.catatan" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="font-medium">Catatan:</span> {{ d.catatan }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :status="d.status || 'pending'" />

          <template v-if="d.status === 'waiting' && canApprove">
            <UButton
              size="xs"
              color="success"
              icon="i-lucide-check"
              :loading="busy"
              @click="$emit('paraf', d)"
            >
              Paraf
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="outline"
              icon="i-lucide-x"
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

defineProps<{
  directors: DirectorApprovalItem[];
  isCurrentUserApprover?: boolean;
  canApprove?: boolean;
  busy?: boolean;
}>();

defineEmits<{
  (e: 'paraf', item: DirectorApprovalItem): void;
  (e: 'tolak', item: DirectorApprovalItem): void;
}>();
</script>
