<template>
  <Teleport to="body">
    <!-- Backdrop blur gelap -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="activeMessages.length > 0"
        class="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm"
      />
    </Transition>

    <!-- Banner container -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <div
        v-if="activeMessages.length > 0"
        class="fixed left-0 right-0 z-[200] space-y-2 px-6 pt-3 pb-3"
        :style="{ top: topOffset }"
      >
        <div
          v-for="item in activeMessages"
          :key="item.id"
          :class="[
            'flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm shadow-lg',
            item.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
              : item.type === 'success'
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
          ]"
        >
          <component
            :is="iconFor(item.type)"
            :class="[
              'w-5 h-5 flex-shrink-0 mt-0.5',
              item.type === 'warning'
                ? 'text-yellow-600 dark:text-yellow-400'
                : item.type === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-600 dark:text-blue-400',
            ]"
          />

          <div class="flex-1 min-w-0">
            <p
              :class="[
                'font-semibold',
                item.type === 'warning'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : item.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-blue-800 dark:text-blue-200',
              ]"
            >
              {{ item.title }}
            </p>
            <p
              :class="[
                'mt-0.5 leading-relaxed',
                item.type === 'warning'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : item.type === 'success'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-blue-700 dark:text-blue-300',
              ]"
            >
              {{ item.message }}
            </p>
          </div>

          <button
            @click="dismiss(item.id)"
            :class="[
              'flex-shrink-0 p-0.5 rounded transition-colors',
              item.type === 'warning'
                ? 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900'
                : item.type === 'success'
                  ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900'
                  : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900',
            ]"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { X, Info, TriangleAlert, CircleCheck } from "lucide-vue-next";
import { useKonfigurasi } from "@/composables/useKonfigurasi";
import { useDigsig } from "@/composables/useDigsig";
import type { KonfigurasiMessageItem } from "@/types/konfigurasi";

const STORAGE_KEY = "announcement_dismissed_ids";

const { messageList, fetchMessages } = useKonfigurasi();
const { bsreAlert } = useDigsig();

const topOffset = computed(() => (bsreAlert.value?.isActive ? "52px" : "0px"));

// Set ID yang sudah di-dismiss — sumber kebenaran dari localStorage
const dismissed = ref<Set<string>>(new Set());

// Snapshot showBanner state dari fetch sebelumnya
// Digunakan untuk mendeteksi perubahan false → true (bukan sekadar "sekarang true")
const prevShowBanner = ref<Map<string, boolean>>(new Map());
// Flag: apakah data sudah di-load pertama kali
const initialized = ref(false);

// Baca dari localStorage saat mount
onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      dismissed.value = new Set(JSON.parse(raw) as string[]);
    }
  } catch {
    dismissed.value = new Set();
  }

  fetchMessages();
});

// Watch messageList:
// - Load pertama (initialized=false): hanya catat snapshot, jangan hapus dismissed
// - Setelah itu: jika showBanner berubah false→true, berarti admin aktifkan ulang
//   → hapus dari dismissed agar banner muncul lagi
watch(
  messageList,
  (items) => {
    if (!initialized.value) {
      // Load pertama — simpan snapshot awal, tidak hapus apapun dari dismissed
      const snap = new Map<string, boolean>();
      for (const item of items) {
        snap.set(item.id, item.showBanner);
      }
      prevShowBanner.value = snap;
      initialized.value = true;
      return;
    }

    // Update berikutnya — cek apakah ada yang berubah false→true
    let changed = false;
    for (const item of items) {
      const wasOn = prevShowBanner.value.get(item.id);
      if (item.showBanner && wasOn === false && dismissed.value.has(item.id)) {
        // Admin toggle ON kembali setelah sebelumnya OFF → hapus dari dismissed
        dismissed.value.delete(item.id);
        changed = true;
      }
      // Update snapshot
      prevShowBanner.value.set(item.id, item.showBanner);
    }

    if (changed) {
      dismissed.value = new Set(dismissed.value);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed.value]));
      } catch {
        // abaikan
      }
    }
  },
  { deep: true },
);

// Klik X → simpan ID ke localStorage secara permanen
// Banner akan muncul lagi HANYA jika admin toggle off→on kembali
const dismiss = (id: string) => {
  dismissed.value.add(id);
  dismissed.value = new Set(dismissed.value);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed.value]));
  } catch {
    // localStorage tidak tersedia — abaikan
  }
};

// Filter: tampil hanya jika showBanner=true DAN ID belum di-dismiss user
const activeMessages = computed(() =>
  messageList.value.filter((m) => m.showBanner && !dismissed.value.has(m.id)),
);

const iconFor = (type: KonfigurasiMessageItem["type"]) => {
  if (type === "warning") return TriangleAlert;
  if (type === "success") return CircleCheck;
  return Info;
};
</script>
