<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import type { TugasTaskComment } from '~/types/tugas';

/**
 * TugasTaskForum — forum diskusi/chat pada task.
 *
 * Fitur:
 * - Daftar komentar (terbaru di bawah) dengan avatar + nama + jabatan.
 * - Input komentar multi-baris, Enter kirim / Shift+Enter baris baru.
 * - Hapus komentar sendiri (ikon muncul hanya di komentar milik user).
 * - Realtime: komentar baru/dihapus anggota lain muncul otomatis via
 *   event socket tugas:comment-added / tugas:comment-deleted.
 * - Pagination "muat lebih banyak" untuk task dengan diskusi panjang.
 */
const props = defineProps<{
  taskId: string;
  comments: TugasTaskComment[];
  loading: boolean;
  sending: boolean;
  removingIds: Set<string>;
  hasMore: boolean;
  loadingMore: boolean;
  /** Position ID user aktif — dipakai menandai komentar milik sendiri. */
  currentPositionId: string;
}>();

const emit = defineEmits<{
  (e: 'send', isi: string): void;
  (e: 'remove', commentId: string): void;
  (e: 'load-more'): void;
}>();

const { t } = useI18n();

const draft = ref('');
const listRef = ref<HTMLElement | null>(null);

const canSend = computed(() => draft.value.trim().length > 0 && !props.sending);

const submit = () => {
  const isi = draft.value.trim();
  if (!isi || props.sending) return;
  emit('send', isi);
  draft.value = '';
};

const onKeydown = (event: KeyboardEvent) => {
  // Enter kirim; Shift+Enter baris baru (perilaku chat standar).
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
};

const memberInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''}`.toUpperCase();
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));

const isMine = (comment: TugasTaskComment) =>
  comment.actorPositionId === props.currentPositionId;

// Auto-scroll ke komentar terbaru saat daftar berubah (komentar baru masuk).
watch(
  () => props.comments.length,
  async () => {
    await nextTick();
    const el = listRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
  { flush: 'post' }
);

onMounted(async () => {
  await nextTick();
  const el = listRef.value;
  if (el) el.scrollTop = el.scrollHeight;
});
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Daftar komentar -->
    <div
      ref="listRef"
      class="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2"
    >
      <div v-if="hasMore" class="flex justify-center">
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          :loading="loadingMore"
          @click="emit('load-more')"
        >
          {{ t('tugas_muat_aktivitas_lagi') }}
        </UButton>
      </div>

      <div
        v-if="loading && !comments.length"
        class="flex items-center justify-center py-8"
      >
        <UIcon name="i-lucide-loader-circle" class="h-5 w-5 animate-spin text-gray-400" />
      </div>

      <p
        v-else-if="!comments.length"
        class="py-8 text-center text-xs text-gray-500 dark:text-gray-400"
      >
        {{ t('tugas_forum_kosong') }}
      </p>

      <template v-else>
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="group flex gap-2.5"
          :class="isMine(comment) ? 'flex-row-reverse' : ''"
        >
          <ProfileAvatar
            size="xs"
            :persnum="comment.actor.persnum"
            :alt="comment.actor.nama"
            :avatar-class="`shrink-0 text-[10px] font-bold ${
              isMine(comment)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`"
          >
            {{ memberInitials(comment.actor.nama) }}
          </ProfileAvatar>

          <div
            class="flex min-w-0 max-w-[85%] flex-col"
            :class="isMine(comment) ? 'items-end' : 'items-start'"
          >
            <div
              class="flex items-baseline gap-2"
              :class="isMine(comment) ? 'flex-row-reverse' : ''"
            >
              <p class="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                {{ comment.actor.nama }}
              </p>
              <p class="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                {{ formatTime(comment.createdAt) }}
              </p>
            </div>
            <div
              class="mt-1 max-w-full whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm"
              :class="
                isMine(comment)
                  ? 'rounded-tr-sm bg-primary-500 text-white'
                  : 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
              "
            >
              {{ comment.isi }}
            </div>
            <button
              v-if="isMine(comment)"
              class="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400 transition-opacity hover:text-red-500 dark:text-gray-500"
              :class="removingIds.has(comment.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
              :disabled="removingIds.has(comment.id)"
              :aria-label="t('tugas_forum_hapus')"
              @click="emit('remove', comment.id)"
            >
              <Trash2 v-if="!removingIds.has(comment.id)" class="h-3 w-3" />
              <UIcon
                v-else
                name="i-lucide-loader-circle"
                class="h-3 w-3 animate-spin"
              />
              {{ t('tugas_forum_hapus') }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Input komentar -->
    <div class="shrink-0 border-t border-gray-200 pt-3 dark:border-gray-700">
      <div class="flex items-end gap-2">
        <UTextarea
          v-model="draft"
          :rows="1"
          maxlength="2000"
          autoresize
          :placeholder="t('tugas_forum_placeholder')"
          class="flex-1"
          :ui="{ base: 'min-h-[2.5rem] max-h-32' }"
          @keydown="onKeydown"
        />
        <UButton
          icon="i-lucide-send-horizontal"
          color="primary"
          size="sm"
          :loading="sending"
          :disabled="!canSend"
          :aria-label="t('tugas_forum_kirim')"
          @click="submit"
        />
      </div>
      <p class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
        {{ t('tugas_forum_hint') }}
      </p>
    </div>
  </div>
</template>
