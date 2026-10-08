<script setup lang="ts">
import { Trash2, Hash, X, SendHorizontal, AtSign } from 'lucide-vue-next';
import type { DropdownMenuItem } from '#ui/types';
import type { TugasMember, TugasTask, TugasTaskComment } from '~/types/tugas';

/**
 * TugasTaskForum — forum diskusi umum papan (channel chat seluruh anggota).
 *
 * Fitur:
 * - Satu channel umum per papan — tanpa pemilih task.
 * - Tag task opsional: user dapat men-tag task sebagai rujukan diskusi;
 *   komentar yang men-tag task menampilkan chip judul task.
 * - Mention anggota dengan "@": popup daftar anggota papan muncul saat
 *   mengetik @, mention di-render sebagai highlight biru di pesan.
 * - Input komentar multi-baris, Enter kirim / Shift+Enter baris baru.
 * - Hapus komentar dua opsi (pola WhatsApp):
 *   • "Hapus untuk saya" — sembunyikan hanya untuk user aktif, kapan saja.
 *   • "Hapus untuk semua orang" — hapus permanen, hanya penulis dan
 *     hanya dalam 5 menit setelah pesan dikirim.
 * - Realtime: komentar baru/dihapus anggota lain muncul otomatis via
 *   event socket tugas:comment-added / tugas:comment-deleted.
 * - Pagination "muat lebih banyak" untuk diskusi panjang.
 */
const props = defineProps<{
  boardId: string;
  /** Daftar task papan — untuk fitur tag task pada komentar. */
  tasks: TugasTask[];
  /** Daftar anggota papan — untuk fitur mention "@". */
  members: TugasMember[];
  comments: TugasTaskComment[];
  loading: boolean;
  sending: boolean;
  removingIds: Set<string>;
  reactingIds: Set<string>;
  hasMore: boolean;
  loadingMore: boolean;
  /** Position ID user aktif — dipakai menandai komentar milik sendiri. */
  currentPositionId: string;
}>();

const emit = defineEmits<{
  (e: 'send', isi: string, taskId: string | null): void;
  (e: 'remove', commentId: string, scope: 'me' | 'everyone'): void;
  (e: 'load-more'): void;
  (e: 'react', commentId: string, emoji: string, active: boolean): void;
}>();

const reactionOptions = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🙏'];
const openReactionId = ref<string | null>(null);
const selectReaction = (comment: TugasTaskComment, emoji: string) => {
  const reacted = (comment.reactions ?? []).some((reaction) => reaction.emoji === emoji && reaction.reacted);
  openReactionId.value = null;
  emit('react', comment.id, emoji, !reacted);
};

const { t } = useI18n();

// Status koneksi socket realtime — dipakai indikator "live" di header.
const { isConnected } = useRealtimeSocket();

const draft = ref('');
const listRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLElement | null>(null);

/** Task yang di-tag pada pesan berikutnya — null = komentar umum. */
const taggedTaskId = ref<string | null>(null);
const taggedTask = computed(
  () => props.tasks.find((task) => task.id === taggedTaskId.value) ?? null
);

// ─── Mention "@" (anggota) dan "#" (task) ─────────────────────────────────────

/**
 * State popup mention: aktif saat user mengetik "@" (tag anggota) atau
 * "#" (tag task) di textarea. Trigger menentukan daftar kandidat.
 */
const mentionQuery = ref<string | null>(null);
const mentionStart = ref(-1);
const mentionActiveIndex = ref(0);
const mentionTrigger = ref<'@' | '#' | null>(null);

/** Kandidat sesuai trigger: "@" → anggota papan, "#" → task papan (maks 8). */
const mentionCandidates = computed<
  { kind: 'member'; member: TugasMember }[] | { kind: 'task'; task: TugasTask }[]
>(() => {
  if (mentionQuery.value === null || !mentionTrigger.value) return [];
  const query = mentionQuery.value.toLowerCase();
  if (mentionTrigger.value === '@') {
    return props.members
      .filter(
        (member) =>
          !query ||
          member.nama.toLowerCase().includes(query) ||
          (member.positionText ?? '').toLowerCase().includes(query)
      )
      .slice(0, 8)
      .map((member) => ({ kind: 'member' as const, member }));
  }
  return props.tasks
    .filter((task) => !query || task.judul.toLowerCase().includes(query))
    .slice(0, 8)
    .map((task) => ({ kind: 'task' as const, task }));
});

const isMentionOpen = computed(
  () => mentionQuery.value !== null && mentionCandidates.value.length > 0
);

/** Tutup popup mention dan reset state token. */
const closeMention = () => {
  mentionQuery.value = null;
  mentionStart.value = -1;
  mentionTrigger.value = null;
};

/**
 * Deteksi token mention pada posisi kursor:
 * "@"/"#" di awal baris atau setelah spasi, diikuti keyword.
 * Dipanggil pada setiap input dan klik/keyup di textarea.
 *
 * PENTING: baca teks langsung dari elemen textarea (DOM), bukan draft.value —
 * saat event input, v-model belum tentu sinkron sehingga posisi token bisa
 * off-by-one dan mention terpilih menjadi ganda (@@Nama).
 */
const detectMention = () => {
  const el = textareaRef.value?.querySelector('textarea') as HTMLTextAreaElement | null;
  if (!el) return;
  const cursor = el.selectionStart ?? 0;
  const textBefore = el.value.slice(0, cursor);
  // Cari token @ atau # terakhir sebelum kursor.
  const match = /(^|\s)([@#])([\p{L}\p{N}._-]*)$/u.exec(textBefore);
  if (match) {
    mentionTrigger.value = match[2] as '@' | '#';
    mentionQuery.value = match[3] ?? '';
    mentionStart.value = cursor - (match[3]?.length ?? 0) - 1;
    mentionActiveIndex.value = 0;
  } else {
    closeMention();
  }
};

const onDraftInput = () => {
  detectMention();
};

/** Tombol @/# manual: sisipkan trigger di kursor lalu buka popup mention. */
const insertMentionTrigger = (trigger: '@' | '#') => {
  const el = textareaRef.value?.querySelector('textarea') as HTMLTextAreaElement | null;
  if (!el) return;
  const cursor = el.selectionStart ?? draft.value.length;
  const needsSpace = cursor > 0 && !/\s$/.test(draft.value.slice(0, cursor));
  const insert = needsSpace ? ` ${trigger}` : trigger;
  draft.value = `${draft.value.slice(0, cursor)}${insert}${draft.value.slice(cursor)}`;
  nextTick(() => {
    el.focus();
    const pos = cursor + insert.length;
    el.setSelectionRange(pos, pos);
    detectMention();
  });
};

/**
 * Sisipkan pilihan popup: ganti token trigger+keyword dengan teks final.
 * "@" → "@Nama ", "#" → "#JudulTask " (judul task di-render sebagai chip
 * tag oleh backend via taskJudul bila task masih ada).
 *
 * Baca teks dari elemen textarea (DOM) — bukan draft.value — agar posisi
 * token akurat saat v-model belum sinkron (cegah mention ganda @@Nama).
 */
const selectMention = (
  candidate: { kind: 'member'; member: TugasMember } | { kind: 'task'; task: TugasTask }
) => {
  const el = textareaRef.value?.querySelector('textarea') as HTMLTextAreaElement | null;
  if (mentionStart.value < 0 || !el || !mentionTrigger.value) return;
  const trigger = mentionTrigger.value;
  const replacement =
    candidate.kind === 'member'
      ? `@${candidate.member.nama} `
      : `#${candidate.task.judul} `;
  const currentText = el.value;
  const before = currentText.slice(0, mentionStart.value);
  const after = currentText.slice(
    mentionStart.value + 1 + (mentionQuery.value?.length ?? 0)
  );
  draft.value = `${before}${replacement}${after}`;
  closeMention();
  // Fokus kembali ke textarea, kursor setelah token yang disisipkan.
  nextTick(() => {
    el.focus();
    const pos = (before + replacement).length;
    el.setSelectionRange(pos, pos);
  });
};

/** Navigasi popup mention dengan keyboard (↑/↓ pilih, Enter sisip, Esc tutup). */
const onMentionKeydown = (event: KeyboardEvent): boolean => {
  if (!isMentionOpen.value) return false;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    mentionActiveIndex.value =
      (mentionActiveIndex.value + 1) % mentionCandidates.value.length;
    return true;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    mentionActiveIndex.value =
      (mentionActiveIndex.value - 1 + mentionCandidates.value.length) %
      mentionCandidates.value.length;
    return true;
  }
  if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault();
    const candidate = mentionCandidates.value[mentionActiveIndex.value];
    if (candidate) selectMention(candidate);
    return true;
  }
  if (event.key === 'Escape') {
    closeMention();
    return true;
  }
  return false;
};

const canSend = computed(() => draft.value.trim().length > 0 && !props.sending);

const submit = () => {
  const isi = draft.value.trim();
  if (!isi || props.sending) return;
  emit('send', isi, taggedTaskId.value);
  draft.value = '';
  taggedTaskId.value = null;
  closeMention();
};

const onKeydown = (event: KeyboardEvent) => {
  // Popup mention terbuka → navigasi mention menang atas kirim.
  if (onMentionKeydown(event)) return;
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

/**
 * Render isi pesan dengan highlight mention "@Nama" dan "#JudulTask".
 * Mengembalikan array segmen: teks biasa, mention anggota, atau tag task.
 * Matching case-insensitive; nama/judul terpanjang diprioritaskan.
 */
type MentionSegment =
  | { text: string; kind: 'text' }
  | { text: string; kind: 'member' }
  | { text: string; kind: 'task' };

const renderMentions = (isi: string): MentionSegment[] => {
  const memberNames = props.members.map((member) => member.nama);
  const taskTitles = props.tasks.map((task) => task.judul);
  if (!memberNames.length && !taskTitles.length) {
    return [{ text: isi, kind: 'text' }];
  }
  // Urutkan terpanjang dulu agar "Budi Santoso" menang atas "Budi".
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const memberPattern = memberNames.length
    ? `(@)(${[...memberNames].sort((a, b) => b.length - a.length).map(escape).join('|')})`
    : null;
  const taskPattern = taskTitles.length
    ? `(#)(${[...taskTitles].sort((a, b) => b.length - a.length).map(escape).join('|')})`
    : null;
  const pattern = new RegExp(
    `(^|\\s)(?:${[memberPattern, taskPattern].filter(Boolean).join('|')})(?=\\s|$)`,
    'giu'
  );
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  for (const match of isi.matchAll(pattern)) {
    const index = match.index ?? 0;
    const [full, prefix, atSign, memberName, hashSign, taskTitle] = match;
    if (index > lastIndex) {
      segments.push({ text: isi.slice(lastIndex, index), kind: 'text' });
    }
    if (prefix) segments.push({ text: prefix, kind: 'text' });
    if (atSign && memberName) {
      segments.push({ text: `@${memberName}`, kind: 'member' });
    } else if (hashSign && taskTitle) {
      segments.push({ text: `#${taskTitle}`, kind: 'task' });
    }
    lastIndex = index + full.length;
  }
  if (lastIndex < isi.length) {
    segments.push({ text: isi.slice(lastIndex), kind: 'text' });
  }
  return segments;
};

/** Batas waktu "hapus untuk semua orang": 5 menit setelah pesan dikirim. */
const DELETE_WINDOW_MS = 5 * 60 * 1000;

/** true bila komentar masih dalam window 5 menit (boleh hapus untuk semua). */
const isWithinDeleteWindow = (comment: TugasTaskComment) =>
  Date.now() - new Date(comment.createdAt).getTime() <= DELETE_WINDOW_MS;

/**
 * Item dropdown hapus per komentar:
 * - "Hapus untuk saya": selalu tersedia untuk komentar apa pun.
 * - "Hapus untuk semua orang": hanya penulis + dalam 5 menit.
 */
const deleteMenuItems = (comment: TugasTaskComment): DropdownMenuItem[] => {
  const items: DropdownMenuItem[] = [
    {
      label: t('tugas_forum_hapus_untuk_saya'),
      icon: 'i-lucide-eye-off',
      onSelect: () => emit('remove', comment.id, 'me'),
    },
  ];
  if (isMine(comment) && isWithinDeleteWindow(comment)) {
    items.push({
      label: t('tugas_forum_hapus_untuk_semua'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('remove', comment.id, 'everyone'),
    });
  }
  return items;
};

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
    <!-- Indikator live: titik hijau berdenyut saat socket realtime terhubung. -->
    <div
      v-if="comments.length || !loading"
      class="mb-2 flex shrink-0 items-center gap-1.5 self-start rounded-full bg-green-50 px-2.5 py-1 dark:bg-green-900/20"
    >
      <span class="relative flex h-2 w-2">
        <span
          v-if="isConnected"
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
        />
        <span
          class="relative inline-flex h-2 w-2 rounded-full"
          :class="
            isConnected
              ? 'bg-green-500'
              : 'bg-gray-400 dark:bg-gray-500'
          "
        />
      </span>
      <span
        class="text-[10px] font-semibold uppercase tracking-wide"
        :class="
          isConnected
            ? 'text-green-700 dark:text-green-300'
            : 'text-gray-500 dark:text-gray-400'
        "
      >
        {{ isConnected ? t('tugas_forum_live') : t('tugas_forum_offline') }}
      </span>
    </div>

    <!-- Daftar komentar -->
    <div
      ref="listRef"
      class="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2"
    >
      <div v-if="hasMore" class="flex justify-center">
        <button
          type="button"
          class="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-[11px] font-semibold text-gray-600 transition-all duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
          :disabled="loadingMore"
          @click="emit('load-more')"
        >
          <UIcon
            v-if="loadingMore"
            name="i-lucide-loader-circle"
            class="h-3.5 w-3.5 animate-spin"
          />
          <UIcon v-else name="i-lucide-chevron-down" class="h-3.5 w-3.5" />
          {{ t('tugas_muat_aktivitas_lagi') }}
        </button>
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
            <!-- Chip task yang di-tag — rujukan diskusi. -->
            <span
              v-if="comment.taskJudul && !comment.isDeletedForEveryone"
              class="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              <Hash class="h-3 w-3 shrink-0" />
              <span class="truncate">{{ comment.taskJudul }}</span>
            </span>
            <div
              class="mt-1 max-w-full whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm"
              :class="
                comment.isDeletedForEveryone
                  ? 'border border-gray-200 bg-gray-50 italic text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  : isMine(comment)
                  ? 'rounded-tr-sm bg-primary-500 text-white'
                  : 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
              "
            >
              <span
                v-if="comment.isDeletedForEveryone"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon name="i-lucide-ban" class="h-3.5 w-3.5 shrink-0" />
                {{ t('tugas_forum_pesan_dihapus') }}
              </span>
              <template
                v-for="(segment, i) in comment.isDeletedForEveryone
                  ? []
                  : renderMentions(comment.isi)"
                :key="i"
              >
                <span
                  v-if="segment.kind !== 'text'"
                  class="font-semibold"
                  :class="
                    isMine(comment)
                      ? 'rounded-md bg-white/25 px-1 py-0.5'
                      : segment.kind === 'member'
                        ? 'rounded-md bg-primary-100 px-1 py-0.5 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                        : 'rounded-md bg-emerald-100 px-1 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  "
                >
                  {{ segment.text }}
                </span>
                <template v-else>{{ segment.text }}</template>
              </template>
            </div>
            <div v-if="!comment.isDeletedForEveryone" class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <button
                v-for="reaction in comment.reactions ?? []"
                :key="reaction.emoji"
                type="button"
                class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-50"
                :class="reaction.reacted ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/40 dark:text-primary-200' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'"
                :aria-pressed="reaction.reacted"
                :aria-label="t('tugas_forum_reaksi_label', { emoji: reaction.emoji, count: reaction.count })"
                :disabled="reactingIds.has(comment.id)"
                @click="emit('react', comment.id, reaction.emoji, !reaction.reacted)"
              >
                <span>{{ reaction.emoji }}</span><span>{{ reaction.count }}</span>
              </button>
              <UPopover
                :open="openReactionId === comment.id"
                :content="{ side: 'top', align: isMine(comment) ? 'end' : 'start', sideOffset: 6 }"
                @update:open="openReactionId = $event ? comment.id : null"
              >
                <UButton icon="i-lucide-smile-plus" color="neutral" variant="ghost" size="xs" :loading="reactingIds.has(comment.id)" :disabled="reactingIds.has(comment.id)" :aria-label="t('tugas_forum_tambah_reaksi')" />
                <template #content>
                  <div class="flex items-center gap-0.5 rounded-lg bg-white p-1.5 dark:bg-gray-800" :aria-label="t('tugas_forum_tambah_reaksi')">
                    <button
                      v-for="emoji in reactionOptions"
                      :key="emoji"
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-50 dark:hover:bg-primary-900/40"
                      :aria-label="emoji"
                      :aria-pressed="(comment.reactions ?? []).some((reaction) => reaction.emoji === emoji && reaction.reacted)"
                      :disabled="reactingIds.has(comment.id)"
                      @click="selectReaction(comment, emoji)"
                    >{{ emoji }}</button>
                  </div>
                </template>
              </UPopover>
            </div>
            <UDropdownMenu
              v-if="!comment.isDeletedForEveryone"
              :items="deleteMenuItems(comment)"
              :content="{ align: isMine(comment) ? 'end' : 'start' }"
              :ui="{
                content: 'w-56',
                item: 'px-3 py-2',
              }"
            >
              <button
                class="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400 transition-opacity hover:text-red-500 dark:text-gray-500"
                :class="removingIds.has(comment.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                :disabled="removingIds.has(comment.id)"
                :aria-label="t('tugas_forum_hapus')"
              >
                <Trash2 v-if="!removingIds.has(comment.id)" class="h-3 w-3" />
                <UIcon
                  v-else
                  name="i-lucide-loader-circle"
                  class="h-3 w-3 animate-spin"
                />
                {{ t('tugas_forum_hapus') }}
              </button>
            </UDropdownMenu>
          </div>
        </div>
      </template>
    </div>

    <!-- Input komentar -->
    <div class="relative shrink-0 border-t border-gray-200 pt-3 dark:border-gray-700">
      <!-- Popup mention "@"/"#": daftar anggota atau task yang cocok keyword. -->
      <div
        v-if="isMentionOpen"
        class="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <p
          class="border-b border-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500"
        >
          {{
            mentionTrigger === '#'
              ? t('tugas_forum_tag_task')
              : t('tugas_forum_mention_title')
          }}
        </p>
        <div class="custom-scrollbar max-h-48 overflow-y-auto">
          <button
            v-for="(candidate, index) in mentionCandidates"
            :key="candidate.kind === 'member' ? candidate.member.id : candidate.task.id"
            type="button"
            class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
            :class="
              index === mentionActiveIndex
                ? 'bg-primary-50 dark:bg-primary-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            "
            @mousedown.prevent="selectMention(candidate)"
            @mouseenter="mentionActiveIndex = index"
          >
            <!-- Kandidat anggota: avatar + nama + jabatan. -->
            <template v-if="candidate.kind === 'member'">
              <ProfileAvatar
                size="2xs"
                :persnum="candidate.member.persnum"
                :alt="candidate.member.nama"
                avatar-class="shrink-0 bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
              >
                {{ memberInitials(candidate.member.nama) }}
              </ProfileAvatar>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {{ candidate.member.nama }}
                </span>
                <span
                  v-if="candidate.member.positionText"
                  class="block truncate text-[10px] text-gray-500 dark:text-gray-400"
                >
                  {{ candidate.member.positionText }}
                </span>
              </span>
              <AtSign
                v-if="index === mentionActiveIndex"
                class="h-3.5 w-3.5 shrink-0 text-primary-500"
              />
            </template>
            <!-- Kandidat task: ikon hash + judul + status. -->
            <template v-else>
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              >
                <Hash class="h-3.5 w-3.5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {{ candidate.task.judul }}
                </span>
                <span class="block truncate text-[10px] text-gray-500 dark:text-gray-400">
                  {{
                    candidate.task.status === 'done'
                      ? t('tugas_status_done')
                      : candidate.task.status === 'in_progress'
                        ? t('tugas_status_in_progress')
                        : t('tugas_status_todo')
                  }}
                </span>
              </span>
              <Hash
                v-if="index === mentionActiveIndex"
                class="h-3.5 w-3.5 shrink-0 text-primary-500"
              />
            </template>
          </button>
        </div>
      </div>

      <!-- Preview task yang sedang di-tag — batal tag dengan klik X. -->
      <div
        v-if="taggedTask"
        class="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
      >
        <Hash class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ taggedTask.judul }}</span>
        <button
          class="shrink-0 rounded-full p-0.5 transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/50"
          :aria-label="t('tugas_forum_batal_tag')"
          @click="taggedTaskId = null"
        >
          <X class="h-3 w-3" />
        </button>
      </div>

      <div class="flex items-end gap-2">
        <!-- Tombol mention anggota (@) — sisipkan @ ke draft. -->
        <UTooltip v-if="members.length" :text="t('tugas_forum_mention_title')">
          <UButton
            icon="i-lucide-at-sign"
            color="neutral"
            variant="outline"
            size="sm"
            :aria-label="t('tugas_forum_mention_title')"
            @click="insertMentionTrigger('@')"
          />
        </UTooltip>

        <!-- Tombol tag task (#) — sisipkan # ke draft. -->
        <UTooltip v-if="tasks.length" :text="t('tugas_forum_tag_task')">
          <UButton
            icon="i-lucide-hash"
            color="neutral"
            variant="outline"
            size="sm"
            :aria-label="t('tugas_forum_tag_task')"
            @click="insertMentionTrigger('#')"
          />
        </UTooltip>

        <div ref="textareaRef" class="flex-1">
          <UTextarea
            v-model="draft"
            :rows="1"
            maxlength="2000"
            autoresize
            :placeholder="t('tugas_forum_placeholder')"
            class="w-full"
            :ui="{ base: 'min-h-[2.5rem] max-h-32' }"
            @keydown="onKeydown"
            @input="onDraftInput"
            @click="detectMention"
          />
        </div>

        <!-- Tombol kirim — lingkaran solid dengan ikon, menonjol saat aktif. -->
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200"
          :class="
            canSend
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 hover:scale-105 hover:bg-primary-600 active:scale-95'
              : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
          "
          :disabled="!canSend || sending"
          :aria-label="t('tugas_forum_kirim')"
          :title="t('tugas_forum_kirim')"
          @click="submit"
        >
          <UIcon
            v-if="sending"
            name="i-lucide-loader-circle"
            class="h-5 w-5 animate-spin"
          />
          <SendHorizontal v-else class="h-5 w-5" />
        </button>
      </div>
      <p class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
        {{ t('tugas_forum_hint_mention') }}
      </p>
    </div>
  </div>
</template>
