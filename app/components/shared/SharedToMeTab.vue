<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ShareItem } from '~/composables/useNaskahShare';
import { getCategoryStyle, getCategoryLabel, getCategoryFullName, formatShortDate } from '~/utils/mail-helpers';

const { t } = useI18n();

const props = defineProps<{
  shares: ShareItem[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  userPosition?: string;
}>();

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
  (e: 'view', share: ShareItem): void;
  (e: 'open-pdf', share: ShareItem): void;
}>();

const columns = computed(() => [
  { key: 'naskahPerihal', label: t('share_perihal'), sortable: false },
  { key: 'naskahJenis', label: t('share_jenis'), sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'naskahNomor', label: t('share_nomor'), sortable: false },
  { key: 'pemberi', label: t('share_dari'), sortable: false },
  { key: 'accessType', label: t('share_akses'), sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'status', label: t('share_status'), sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'createdAt', label: t('share_tanggal'), sortable: false },
]);

/** Display status for recipient: check share.status first, then recipient.status. */
const getMyDisplayStatus = (share: ShareItem): 'AKTIF' | 'BERAKHIR' => {
  // Share ended (auto-expire / revoke all)
  if (share.status === 'BERAKHIR') return 'BERAKHIR';
  const myRecipient = share.recipients?.find((r) => r.recipientId === props.userPosition);
  if (!myRecipient) return 'AKTIF';
  if (myRecipient.status === 'BERAKHIR') return 'BERAKHIR';
  return 'AKTIF';
};

/**
 * Apakah tombol "Buka PDF" boleh ditampilkan.
 * - SEKALI_LIHAT: hilang setelah naskah dibuka (recipient BERAKHIR).
 * - RENTANG_WAKTU: hilang setelah durasi habis (share BERAKHIR).
 */
const canOpenPdf = (share: ShareItem): boolean => {
  // Share sudah berakhir (durasi habis / dicabut) → icon kertas hilang
  if (share.status === 'BERAKHIR') return false;
  // SEKALI_LIHAT: hilang jika recipient sudah membuka (BERAKHIR)
  if (share.accessType === 'SEKALI_LIHAT') {
    const myRecipient = share.recipients?.find((r) => r.recipientId === props.userPosition);
    if (!myRecipient) return true;
    return myRecipient.status !== 'BERAKHIR';
  }
  return true;
};
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :rows="shares"
      :loading="loading"
      :empty-message="t('share_belum_ada_ke_saya')"
    >
      <template #cell-naskahPerihal="{ row }">
        <div class="max-w-[260px]">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ row.naskahPerihal || t('share_tanpa_perihal') }}
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
        <span class="text-xs text-gray-600 dark:text-gray-400 font-mono">
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
            <p class="text-sm text-gray-900 dark:text-white truncate">{{ row.pemberiNama }}</p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">{{ row.pemberiPositionText }}</p>
          </div>
        </div>
      </template>

      <template #cell-accessType="{ row }">
        <div class="flex items-center justify-center">
          <span
            v-if="row.accessType === 'SEKALI_LIHAT'"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 whitespace-nowrap"
          >
            <UIcon name="i-lucide-eye" class="w-3 h-3" />
            {{ t('share_sekali_lihat') }}
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 whitespace-nowrap"
          >
            <UIcon name="i-lucide-calendar" class="w-3 h-3" />
            {{ row.durationDays || '-' }} {{ t('share_hari') }}
          </span>
        </div>
      </template>

      <template #cell-status="{ row }">
        <div class="flex items-center justify-center">
          <SharedShareBadge :status="getMyDisplayStatus(row)" size="xs" />
        </div>
      </template>

      <template #cell-createdAt="{ row }">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatShortDate(row.createdAt) }}
        </span>
      </template>

      <!-- Floating Quick Actions (muncul saat hover baris, menimpa kolom tanggal) -->
      <template #row-extra="{ row }">
        <div class="flex items-center gap-2 p-1">
          <UTooltip :text="t('share_lihat_detail')">
            <button
              type="button"
              class="text-primary dark:text-primary-400 hover:opacity-80 transition-opacity"
              @click="emit('view', row as ShareItem)"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4" />
            </button>
          </UTooltip>
          <UTooltip :text="canOpenPdf(row as ShareItem) ? t('share_buka_pdf') : t('share_akses_berakhir')">
            <button
              type="button"
              :disabled="!canOpenPdf(row as ShareItem)"
              class="transition-opacity"
              :class="canOpenPdf(row as ShareItem)
                ? 'text-success dark:text-success-400 hover:opacity-80'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'"
              @click="canOpenPdf(row as ShareItem) && emit('open-pdf', row as ShareItem)"
            >
              <UIcon name="i-lucide-file-text" class="w-4 h-4" />
            </button>
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
