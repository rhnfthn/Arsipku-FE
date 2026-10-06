<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ShareItem } from '~/composables/useNaskahShare';
import { getCategoryStyle, getCategoryLabel, getCategoryFullName, formatShortDate } from '~/utils/mail-helpers';

const { t } = useI18n();
const { hasPermission } = useFeatureAccess();

const props = defineProps<{
  shares: ShareItem[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
  (e: 'view', share: ShareItem): void;
  (e: 'open-pdf', share: ShareItem): void;
  (e: 'revoke-all', share: ShareItem): void;
}>();

const columns = computed(() => [
  { key: 'naskahPerihal', label: t('share_perihal'), sortable: false },
  { key: 'naskahJenis', label: t('share_jenis'), sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'naskahNomor', label: t('share_nomor'), sortable: false },
  { key: 'penerima', label: t('share_dibagikan_kepada'), sortable: false },
  { key: 'accessType', label: t('share_akses'), sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'status', label: t('share_status'), sortable: false, headerClass: 'text-center', class: 'text-center' },
  { key: 'createdAt', label: t('share_tanggal'), sortable: false },
]);

/** Display status for sender: check share.status, then per-recipient for SEKALI_LIHAT. */
const getDisplayStatus = (share: ShareItem): 'AKTIF' | 'BERAKHIR' => {
  if (share.status === 'BERAKHIR') return 'BERAKHIR';
  // For SEKALI_LIHAT: if all recipients are BERAKHIR, show as BERAKHIR
  if (share.accessType === 'SEKALI_LIHAT' && share.recipients?.length) {
    const allEnded = share.recipients.every((r) => r.status === 'BERAKHIR');
    if (allEnded) return 'BERAKHIR';
  }
  return 'AKTIF';
};

/** Apakah share masih aktif (bisa dicabut semua aksesnya). */
const isActive = (share: ShareItem): boolean => share.status === 'AKTIF';
const canOpenSharedDocument = computed(() => hasPermission('naskah-share', 'open'));
const canRevokeShare = computed(() => hasPermission('naskah-share', 'delete'));

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const highlightText = (text: string, query?: string) => {
  // Escape dulu agar perihal/nomor (data user) tidak dirender sebagai HTML
  // (mencegah XSS via v-html).
  const safeText = escapeHtml(text || '');
  if (!query || !safeText) return safeText;
  const safeQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  return safeText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-500/50 text-inherit px-0.5 rounded">$1</mark>');
};
</script>

<template>
  <div>
    <DataTable
      :columns="columns"
      :rows="shares"
      :loading="loading"
      :empty-message="t('share_belum_ada')"
    >
      <template #cell-naskahPerihal="{ row }">
        <div class="max-w-[260px]">
          <p
            class="text-sm font-medium text-gray-900 dark:text-white truncate"
            v-html="highlightText(row.naskahPerihal || t('share_tanpa_perihal'), searchQuery)"
          ></p>
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
        <span
          class="text-xs text-gray-600 dark:text-gray-400 font-mono"
          v-html="highlightText(row.naskahNomor || '-', searchQuery)"
        ></span>
      </template>

      <template #cell-penerima="{ row }">
        <div class="max-w-[220px] flex items-center gap-2">
          <template v-if="row.recipients?.length">
            <div class="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-[9px] font-semibold text-primary-600 dark:text-primary-400">
                {{ row.recipients[0]?.nama?.charAt(0)?.toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
                {{ row.recipients[0]?.nama }}<span v-if="row.recipients.length > 1" class="text-primary-500 dark:text-primary-400 font-medium"> +{{ row.recipients.length - 1 }}</span>
              </p>
              <p v-if="row.recipients[0]?.positionText" class="text-[10px] text-gray-500 dark:text-gray-400 truncate">{{ row.recipients[0]?.positionText }}</p>
            </div>
          </template>
          <span v-else class="text-xs text-gray-400">-</span>
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
        <SharedShareBadge :status="getDisplayStatus(row as ShareItem)" size="xs" />
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
          <UTooltip v-if="canOpenSharedDocument" :text="t('share_buka_pdf')">
            <button
              type="button"
              class="text-success dark:text-success-400 hover:opacity-80 transition-opacity"
              @click="emit('open-pdf', row as ShareItem)"
            >
              <UIcon name="i-lucide-file-text" class="w-4 h-4" />
            </button>
          </UTooltip>
          <!-- Divider pemisah aksi cabut semua -->
          <div v-if="canRevokeShare" class="w-px h-5 bg-gray-200 dark:bg-gray-600" />
          <UTooltip v-if="canRevokeShare" :text="isActive(row as ShareItem) ? t('share_cabut_semua') : t('share_akses_berakhir')">
            <button
              type="button"
              :disabled="!isActive(row as ShareItem)"
              class="transition-opacity"
              :class="isActive(row as ShareItem)
                ? 'text-red-600 dark:text-red-400 hover:opacity-80'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'"
              @click="isActive(row as ShareItem) && emit('revoke-all', row as ShareItem)"
            >
              <UIcon name="i-lucide-shield-off" class="w-4 h-4" />
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
