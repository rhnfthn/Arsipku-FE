<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ShareItem } from '~/composables/useNaskahShare';
import { getCategoryStyle, getCategoryLabel, getCategoryFullName, formatShortDate } from '~/utils/mail-helpers';

const props = defineProps<{
  shares: ShareItem[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
}>();

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
  (e: 'open', share: ShareItem): void;
  (e: 'view', share: ShareItem): void;  (e: 'open-pdf', share: ShareItem): void;  (e: 'refresh'): void;
}>();

const columns = computed(() => [
  { key: 'naskahPerihal', label: 'Perihal', sortable: false },
  { key: 'naskahJenis', label: 'Jenis', sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'naskahNomor', label: 'Nomor', sortable: false },
  { key: 'pemberi', label: 'Dari', sortable: false },
  { key: 'createdAt', label: 'Tanggal', sortable: false },
  { key: 'aksi', label: '', headerClass: 'text-center', class: 'text-center' },
]);

const getMyRecipientStatus = (share: ShareItem) => {
  return share.recipients?.[0]?.status || 'BELUM_DIBACA';
};
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :rows="shares"
      :loading="loading"
      :empty-message="'Belum ada naskah yang dibagikan ke Anda'"
    >
      <template #cell-naskahPerihal="{ row }">
        <div class="max-w-[260px]">
          <p class="text-sm font-medium text-neutral-900 dark:text-white truncate">
            {{ row.naskahPerihal || '(Tanpa perihal)' }}
          </p>
        </div>
      </template>

      <template #cell-naskahJenis="{ row }">
        <UTooltip :text="getCategoryFullName(row.naskahJenis)">
          <span
            :class="[
              getCategoryStyle(row.naskahJenis),
              'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide',
            ]"
          >
            {{ getCategoryLabel(row.naskahJenis) }}
          </span>
        </UTooltip>
      </template>

      <template #cell-naskahNomor="{ row }">
        <span class="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
          {{ row.naskahNomor || '-' }}
        </span>
      </template>

      <template #cell-pemberi="{ row }">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <span class="text-[10px] font-semibold text-primary-600 dark:text-primary-400">
              {{ row.pemberiNama?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div class="min-w-0">
            <p class="text-sm text-neutral-900 dark:text-white truncate">{{ row.pemberiNama }}</p>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{{ row.pemberiPositionText }}</p>
          </div>
        </div>
      </template>

      <template #cell-createdAt="{ row }">
        <span class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ formatShortDate(row.createdAt) }}
        </span>
      </template>

      <template #cell-aksi="{ row }">
        <div class="flex items-center justify-center gap-1">
          <UTooltip text="Lihat detail">
            <UButton
              icon="i-lucide-eye"
              color="primary"
              variant="ghost"
              size="xs"
              @click="emit('view', row)"
            />
          </UTooltip>
          <UTooltip text="Buka PDF">
            <UButton
              icon="i-lucide-file-text"
              color="success"
              variant="ghost"
              size="xs"
              @click="emit('open-pdf', row)"
            />
          </UTooltip>
          <UButton
            v-if="getMyRecipientStatus(row) === 'BELUM_DIBACA'"
            label="Buka"
            icon="i-lucide-book-open"
            size="xs"
            @click="emit('open', row)"
          />
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div v-if="total > limit" class="flex justify-center py-3 border-t border-gray-100 dark:border-gray-800">
      <DataPagination
        :current-page="page"
        :total-items="total"
        :per-page="limit"
        @update:current-page="emit('update:page', $event)"
      />
    </div>
  </div>
</template>
