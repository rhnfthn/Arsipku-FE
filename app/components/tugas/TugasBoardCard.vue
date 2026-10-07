<script setup lang="ts">
import { Users, CircleCheckBig, Pencil, Trash2, LoaderCircle } from 'lucide-vue-next';
import { resolveTugasBoardIcon } from '~/utils/tugas-board-icon';
import type { TugasBoardSummary } from '~/types/tugas';

const props = defineProps<{
  board: TugasBoardSummary;
  canManage: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', board: TugasBoardSummary): void;
  (e: 'delete', board: TugasBoardSummary): void;
}>();

const { t } = useI18n();

const boardIcon = computed(() => resolveTugasBoardIcon(props.board.icon));

const progressPercent = computed(() => {
  const counts = props.board.counts;
  if (!counts || !counts.total) return 0;
  return Math.round((counts.done / counts.total) * 100);
});

/** Task aktif = belum done (todo + in progress). */
const activeTasks = computed(() => {
  const counts = props.board.counts;
  if (!counts) return 0;
  return Math.max(0, counts.total - counts.done);
});

const initials = (nama: string) => {
  if (!nama) return '?';
  const parts = nama.trim().split(' ');
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const formatTanggal = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
</script>

<template>
  <div
    class="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-800"
  >
    <!-- Aksen warna papan -->
    <div
      class="absolute inset-x-5 top-0 h-1 rounded-b-full"
      :style="{ backgroundColor: board.warna }"
    />

    <div class="flex items-start justify-between gap-3 pt-2">
      <NuxtLink :to="`/tugas/${board.id}`" class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            :style="{
              backgroundColor: `${board.warna}1A`,
              color: board.warna,
            }"
          >
            <component :is="boardIcon" class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <h3
              class="truncate text-sm font-semibold text-gray-900 hover:text-primary dark:text-white"
              :title="board.nama"
            >
              {{ board.nama }}
            </h3>
            <p class="text-[11px] text-gray-400 dark:text-gray-500">
              {{ t('tugas_dibuat') }} {{ formatTanggal(board.createdAt) }}
            </p>
          </div>
        </div>
        <p
          v-if="board.deskripsi"
          class="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400"
        >
          {{ board.deskripsi }}
        </p>
      </NuxtLink>

      <div
        v-if="canManage"
        class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <UTooltip :text="t('tugas_ubah_papan')">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="t('tugas_ubah_papan')"
            @click="emit('edit', board)"
          />
        </UTooltip>
        <UTooltip :text="t('tugas_hapus_papan')">
          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="t('tugas_hapus_papan')"
            @click="emit('delete', board)"
          />
        </UTooltip>
      </div>
    </div>

    <!-- PIC + tipe papan -->
    <div class="mt-4 flex items-center justify-between gap-2">
      <div v-if="board.owner" class="flex min-w-0 items-center gap-1.5">
        <ProfileAvatar
          size="2xs"
          :persnum="board.owner.persnum"
          :alt="board.owner.nama"
          avatar-class="shrink-0 bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
          :title="`${board.owner.nama}${board.owner.positionText ? ` — ${board.owner.positionText}` : ''}`"
        >
          {{ initials(board.owner.nama) }}
        </ProfileAvatar>
        <span class="min-w-0 truncate text-[11px] text-gray-500 dark:text-gray-400">
          {{ board.owner.nama }}
        </span>
      </div>
      <span
        class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
        :class="
          board.tipe === 'bersama'
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        "
      >
        <Users v-if="board.tipe === 'bersama'" class="h-3 w-3" />
        {{ board.tipe === 'bersama' ? t('tugas_papan_bersama') : t('tugas_papan_personal') }}
      </span>
    </div>

    <!-- Progres -->
    <div class="mt-4">
      <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span class="inline-flex items-center gap-1">
          <CircleCheckBig class="h-3.5 w-3.5 text-green-500" />
          {{ board.counts?.done ?? 0 }}/{{ board.counts?.total ?? 0 }}
          {{ t('tugas_selesai') }}
        </span>
        <span
          v-if="activeTasks > 0"
          class="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400"
        >
          <LoaderCircle class="h-3 w-3" />
          {{ activeTasks }} {{ t('tugas_aktif') }}
        </span>
        <span
          v-else-if="progressPercent === 100"
          class="font-medium text-green-600 dark:text-green-400"
        >
          {{ t('tugas_selesai_semua') }}
        </span>
      </div>
      <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          class="h-full rounded-full transition-all"
          :class="progressPercent === 100 ? 'bg-green-500' : ''"
          :style="{
            width: `${progressPercent}%`,
            backgroundColor: progressPercent === 100 ? undefined : board.warna,
          }"
        />
      </div>
    </div>
  </div>
</template>
