<template>
  <div class="relative w-full overflow-x-hidden">
    <DataTable
      :columns="columns"
      :rows="sortedData"
      compact
      wrap-headers
      :loading="loading"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      header-class="bg-primary dark:bg-primary-700 text-white text-left"
      body-class="divide-y divide-gray-100 dark:divide-gray-700"
      row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      :row-classes-fn="(row: any) => rowClass(row)"
      empty-message="Belum ada usulan pemindahan arsip yang perlu diverifikasi. Usulan dari Sekretaris akan muncul di sini setelah dikirim kepada Anda."
      @sort="handleSort"
    >
      <template #cell-arsipPerihal="{ row }">
        <div
          class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
          :title="row.arsipPerihal || '-'"
          tabindex="0"
          @mouseenter="showCellTooltip($event, row.arsipPerihal || '-')"
          @mouseleave="hideCellTooltip"
          @focus="showCellTooltip($event, row.arsipPerihal || '-')"
          @blur="hideCellTooltip"
        >
          {{ row.arsipPerihal || '-' }}
        </div>
      </template>
      <template #cell-arsipKode="{ row }">
        <div class="truncate font-medium text-gray-700 dark:text-gray-200" :title="row.arsipKode ?? '-'">
          {{ row.arsipKode ?? '-' }}
        </div>
      </template>
      <template #cell-arsipKlasifikasi="{ row }">
        <div
          class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
          :title="row.arsipKlasifikasi ?? '-'"
          tabindex="0"
          @mouseenter="showCellTooltip($event, row.arsipKlasifikasi ?? '-')"
          @mouseleave="hideCellTooltip"
          @focus="showCellTooltip($event, row.arsipKlasifikasi ?? '-')"
          @blur="hideCellTooltip"
        >
          {{ row.arsipKlasifikasi ?? '-' }}
        </div>
      </template>
      <template #cell-arsipLokasiFisik="{ row }">
        <div class="truncate text-gray-600 dark:text-gray-300" :title="row.arsipLokasiFisik ?? '-'">
          {{ row.arsipLokasiFisik ?? '-' }}
        </div>
      </template>
      <template #cell-tanggalRetensiAktifHabis="{ row }">
        <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">
          {{ row.tanggalRetensiAktifHabis ? formatDate(row.tanggalRetensiAktifHabis) : '-' }}
        </span>
      </template>
      <template #cell-status="{ row }">
        <span
          :class="verifikasiStatusBadge(row.status)"
          class="inline-flex max-w-full whitespace-normal break-words text-[11px] leading-tight"
          :title="verifikasiStatusLabel(row.status)"
        >
          {{ verifikasiStatusLabel(row.status) }}
        </span>
      </template>
      <template #cell-updatedAt="{ row }">
        <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">
          {{ row.updatedAt ? formatDate(row.updatedAt) : '-' }}
        </span>
      </template>
      <template #cell-aksi="{ row }">
        <div class="text-center" @click.stop>
          <button
            type="button"
            @click="openDetail(row)"
            :title="needsVerification(row) ? 'Verifikasi' : 'Detail'"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
          >
            <UIcon v-if="needsVerification(row)" name="i-lucide-file-check-2" class="w-4 h-4" />
            <UIcon v-else name="i-lucide-eye" class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>
    <Teleport to="body">
      <div
        v-if="cellTooltip.visible"
        role="tooltip"
        class="pointer-events-none fixed z-[9999] max-h-[40vh] overflow-y-auto rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-xl"
        :style="{
          top: cellTooltip.top + 'px',
          left: cellTooltip.left + 'px',
          maxWidth: 'min(26rem, calc(100vw - 24px))',
        }"
      >
        {{ cellTooltip.text }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import DataTable from '~/components/DataTable.vue';
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';
import { verifikasiStatusBadge, verifikasiStatusLabel } from '~/utils/verifikasi-status';
import { formatDate } from '~/utils/transfer-status';

const props = defineProps<{
  data: VerifikasiUsulanItem[];
  loading: boolean;
}>();

const emit = defineEmits<{ detail: [row: VerifikasiUsulanItem] }>();
const { rowClass, markViewed } = useViewedRows('verifikasi-usulan');
const sortKey = ref('');
const sortDir = ref<'asc' | 'desc'>('asc');
const cellTooltip = reactive({ visible: false, text: '', top: 0, left: 0 });

const showCellTooltip = (event: MouseEvent | FocusEvent, text: string) => {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || target.scrollWidth <= target.clientWidth) return;

  const rect = target.getBoundingClientRect();
  const padding = 12;
  const width = Math.min(416, window.innerWidth - padding * 2);
  const height = Math.min(320, window.innerHeight * 0.4);
  const left = Math.min(Math.max(padding, rect.left), window.innerWidth - width - padding);
  const below = rect.bottom + 8;
  const top = below + height <= window.innerHeight - padding
    ? below
    : Math.max(padding, rect.top - height - 8);

  cellTooltip.text = text;
  cellTooltip.left = left;
  cellTooltip.top = top;
  cellTooltip.visible = true;
};

const hideCellTooltip = () => {
  cellTooltip.visible = false;
};

// Kolom dan lebar mengikuti tabel Pemindahan Arsip Aktif ke Inaktif milik Sekretaris Divisi.
const columns = [
  { key: 'arsipPerihal', label: 'Nama Berkas', sortable: true, class: 'w-[18%] max-w-0', headerClass: 'w-[18%]' },
  { key: 'arsipKode', label: 'Kode Berkas', sortable: true, class: 'w-[12%] max-w-0', headerClass: 'w-[12%]' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', sortable: true, class: 'w-[13%] max-w-0', headerClass: 'w-[13%]' },
  { key: 'arsipLokasiFisik', label: 'Lokasi Fisik', sortable: true, class: 'w-[11%] max-w-0', headerClass: 'w-[11%]' },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', sortable: true, class: 'w-[13%]', headerClass: 'w-[13%]' },
  { key: 'status', label: 'Status', sortable: true, class: 'w-[16%] max-w-0', headerClass: 'w-[16%]' },
  { key: 'updatedAt', label: 'Updated', sortable: true, class: 'w-[11%]', headerClass: 'w-[11%]' },
  { key: 'aksi', label: 'Aksi', class: 'w-[6%] text-center', headerClass: 'w-[6%] text-center' },
];

const sortedData = computed(() => {
  if (!sortKey.value) return props.data ?? [];
  const key = sortKey.value as keyof VerifikasiUsulanItem;
  const direction = sortDir.value === 'asc' ? 1 : -1;
  return [...(props.data ?? [])].sort((left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];
    if (leftValue == null) return 1;
    if (rightValue == null) return -1;
    const isDate = key === 'tanggalRetensiAktifHabis' || key === 'updatedAt';
    const comparison = isDate
      ? new Date(String(leftValue)).getTime() - new Date(String(rightValue)).getTime()
      : String(leftValue).localeCompare(String(rightValue), 'id', { numeric: true, sensitivity: 'base' });
    return comparison * direction;
  });
});

const handleSort = (key: string) => {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const openDetail = (row: VerifikasiUsulanItem) => {
  markViewed(row);
  emit('detail', row);
};

/** Status yang masih butuh aksi verifikasi (bukan hanya lihat detail). */
const needsVerification = (row: VerifikasiUsulanItem) =>
  row.isCurrentTurn === true && (
    row.status === 'MENUNGGU_VERIFIKASI_ATASAN' ||
    row.status === 'DISETUJUI_ATASAN' ||
    row.status === 'MENUNGGU_VERIFIKASI_TERAKHIR' ||
    row.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'
  );
</script>
