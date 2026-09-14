<template>
  <div ref="rootEl" class="space-y-3">
    <div
      v-for="(d, idx) in directors"
      :key="noteKey(d, idx)"
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
            <!-- Catatan approval: render HTML dari editor TinyMCE (pasal/batang tubuh).
                 Konten panjang di-clamp dengan tombol "Lihat selengkapnya". -->
            <div
              v-if="d.catatan"
              class="approval-note mt-1.5 rounded-lg border-l-4 border-primary-400 bg-primary-50/70 px-3 py-1.5 text-xs text-primary-900 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-100"
            >
              <span
                class="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70"
              >
                <UIcon name="i-lucide-message-square-text" class="size-3" />
                Catatan
              </span>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                class="approval-note-content"
                :class="
                  longNotes.has(noteKey(d, idx)) && !expandedNotes.has(noteKey(d, idx))
                    ? 'note-clamped'
                    : ''
                "
                :data-note-id="noteKey(d, idx)"
                v-html="d.catatan"
              ></div>
              <button
                v-if="longNotes.has(noteKey(d, idx))"
                type="button"
                class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70 transition-opacity hover:opacity-100 text-primary-700 dark:text-primary-300"
                @click="toggleNote(noteKey(d, idx))"
              >
                <UIcon
                  :name="expandedNotes.has(noteKey(d, idx)) ? 'i-lucide-chevrons-up' : 'i-lucide-chevrons-down'"
                  class="size-3"
                />
                {{ expandedNotes.has(noteKey(d, idx)) ? 'Tutup' : 'Lihat selengkapnya' }}
              </button>
            </div>
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
import { ref, watch, nextTick, onMounted } from 'vue';
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

// ── Collapse catatan panjang ("Lihat selengkapnya") ──
// Catatan approval bisa memuat pasal/batang tubuh yang panjang; konten penuh
// membuat kartu direksi jadi sangat tinggi. Konten di-clamp (max-height + fade),
// tombol muncul hanya jika konten benar-benar melebihi batas (dideteksi via
// pengukuran DOM setelah render, akurat terhadap lebar kartu saat itu).
const NOTE_CLAMP_PX = 72; // tinggi maksimum konten catatan saat ter-clamp
const rootEl = ref<HTMLElement | null>(null);
const expandedNotes = ref<Set<string>>(new Set());
const longNotes = ref<Set<string>>(new Set());

const noteKey = (d: DirectorApprovalItem, idx: number) =>
  `${d.roleLabel || 'direksi'}-${d.positionId || d.nama || idx}-${idx}`;

const toggleNote = (key: string) => {
  const next = new Set(expandedNotes.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expandedNotes.value = next;
};

/** Ukur tinggi natural tiap catatan; tandai yang melebihi clamp. */
const measureNotes = async () => {
  await nextTick();
  if (!rootEl.value) return;
  const next = new Set<string>();
  rootEl.value.querySelectorAll<HTMLElement>('[data-note-id]').forEach((el) => {
    const id = el.dataset.noteId;
    if (!id) return;
    // Ukur tinggi natural (tanpa clamp) — reset sementara lalu kembalikan.
    const prevMax = el.style.maxHeight;
    const prevOverflow = el.style.overflow;
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
    const natural = el.scrollHeight;
    el.style.maxHeight = prevMax;
    el.style.overflow = prevOverflow;
    if (natural > NOTE_CLAMP_PX + 8) next.add(id);
  });
  longNotes.value = next;
};

const props = defineProps<{
  directors: DirectorApprovalItem[];
  isCurrentUserApprover?: boolean;
  canApprove?: boolean;
  canApproveItem?: (item: DirectorApprovalItem) => boolean;
  busy?: boolean;
  // Label aksi dapat diringkas oleh halaman pemakai (mis. "Setuju").
  parafLabel?: string;
  isLegal?: boolean;
}>();

// Deteksi ulang saat daftar direksi berubah (mis. catatan baru masuk).
watch(
  () => props.directors,
  () => {
    longNotes.value = new Set();
    measureNotes();
  },
  { deep: true }
);

onMounted(measureNotes);

defineEmits<{
  (e: 'paraf', item: DirectorApprovalItem): void;
  (e: 'tolak', item: DirectorApprovalItem): void;
  (e: 'addDelegate', item: DirectorApprovalItem): void;
  (e: 'editDelegate', item: DirectorApprovalItem): void;
  (e: 'removeDelegate', item: DirectorApprovalItem): void;
}>();
</script>

<style scoped>
/* Konten catatan approval (HTML dari TinyMCE — pasal-pasal/batang tubuh) */
/* break-word: kata sangat panjang tanpa spasi tetap wrap di dalam panel,
   tidak meluber keluar section catatan. */
.approval-note-content {
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}
/* Catatan terlalu panjang: clamp + fade, tombol "Lihat selengkapnya" */
.note-clamped {
  max-height: 72px;
  overflow: hidden;
  position: relative;
}
.note-clamped::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 28px;
  background: linear-gradient(to bottom, transparent, var(--note-fade-color, rgba(232, 239, 246, 0.95)));
  pointer-events: none;
}
.dark .note-clamped::after {
  --note-fade-color: rgba(5, 19, 33, 0.95);
}
.approval-note-content :deep(p) {
  margin: 0 0 4px 0;
}
.approval-note-content :deep(p:last-child) {
  margin-bottom: 0;
}
.approval-note-content :deep(ol) {
  list-style: decimal;
  padding-left: 18px;
  margin: 2px 0;
}
.approval-note-content :deep(ul) {
  list-style: disc;
  padding-left: 18px;
  margin: 2px 0;
}
.approval-note-content :deep(li) {
  margin: 0 0 2px 0;
}
.approval-note-content :deep(table) {
  border-collapse: collapse;
  margin: 4px 0;
  width: 100%;
}
.approval-note-content :deep(td),
.approval-note-content :deep(th) {
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 3px 6px;
}
.approval-note-content :deep(strong) {
  font-weight: 700;
}
</style>
