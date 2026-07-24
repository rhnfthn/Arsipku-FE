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
  (e: 'view', share: ShareItem): void;
  (e: 'open-pdf', share: ShareItem): void;
  (e: 'refresh'): void;
}>();

const columns = computed(() => [
  { key: 'naskahPerihal', label: 'Perihal', sortable: false },
  { key: 'naskahJenis', label: 'Jenis', sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'naskahNomor', label: 'Nomor', sortable: false },
  { key: 'penerima', label: 'Dibagikan Kepada', sortable: false },
  { key: 'accessType', label: 'Akses', sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'status', label: 'Status', sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'createdAt', label: 'Tanggal', sortable: false },
  { key: 'aksi', label: '', headerClass: 'text-center', class: 'text-center' },
]);


</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :rows="shares"
      :loading="loading"
      :empty-message="'Belum ada naskah yang dibagikan'"
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

      <template #cell-penerima="{ row }">
        <div class="max-w-[220px] space-y-1.5">
          <template v-if="row.recipients?.length">
            <div
              v-for="r in row.recipients.slice(0, 2)"
              :key="r.id"
              class="flex items-center gap-2"
            >
              <div class="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span class="text-[9px] font-semibold text-primary-600 dark:text-primary-400">
                  {{ r.nama?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-neutral-900 dark:text-white truncate">{{ r.nama }}</p>
                <p v-if="r.positionText" class="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{{ r.positionText }}</p>
              </div>
            </div>
            <div v-if="row.recipients.length > 2" class="pl-7">
              <span class="text-[10px] text-primary-500 dark:text-primary-400 font-medium">+{{ row.recipients.length - 2 }} lainnya</span>
            </div>
          </template>
          <span v-else class="text-xs text-neutral-400">-</span>
        </div>
      </template>

      <template #cell-accessType="{ row }">
        <div class="flex flex-col items-center gap-1">
          <span
            v-if="row.accessType === 'SEKALI_LIHAT'"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          >
            <UIcon name="i-lucide-eye" class="w-3 h-3" />
            Sekali Lihat
          </span>
          <template v-else>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <UIcon name="i-lucide-calendar" class="w-3 h-3" />
              {{ row.durationDays || '-' }} hari
            </span>
            <span v-if="row.expiresAt" class="text-[9px] text-neutral-400 dark:text-neutral-500">
              s/d {{ formatShortDate(row.expiresAt) }}
            </span>
          </template>
        </div>
      </template>

      <template #cell-status="{ row }">
        <SharedShareBadge :status="row.status" size="xs" />
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
