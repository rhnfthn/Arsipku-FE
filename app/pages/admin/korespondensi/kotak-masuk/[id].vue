<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from "vue";
import {
  Hash,
  Calendar,
  Tag,
  Paperclip,
  FileText,
  Loader2,
  X,
} from "lucide-vue-next";

const route = useRoute();
const id = route.params.id as string;
const jenis = route.query.jenis as string;
const { fetchInboxDetail } = useInbox(null);

const selected = ref<any>(null);
const iframe = ref<HTMLIFrameElement | null>(null);

/* ===============================
   FETCH DATA
================================ */
onMounted(async () => {
  if (!jenis) {
    console.error("Jenis naskah tidak ditemukan di query");
    return;
  }

  selected.value = await fetchInboxDetail(id, jenis);
});

/* ===============================
   FORMAT TANGGAL
================================ */
const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/* ===============================
   INISIAL PENGIRIM
   contoh: "SURYADI JOKO WIRATMO" -> "SJ"
================================ */
const senderInitials = computed(() => {
  const name = selected.value?.pengirim?.nama;
  if (!name) return "?";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n.charAt(0).toUpperCase())
    .join("");
});

/* ===============================
   KEPADA & TEMBUSAN
================================ */
const kepadaList = computed(() =>
  Array.isArray(selected.value?.kepada) ? selected.value.kepada : [],
);

const tembusanList = computed(() =>
  Array.isArray(selected.value?.tembusan) ? selected.value.tembusan : [],
);

/* ===============================
   AUTO RESIZE IFRAME
================================ */
const resizeIframe = () => {
  if (!iframe.value) return;
  const doc = iframe.value.contentDocument;
  if (!doc) return;

  iframe.value.style.height = "auto";
  iframe.value.style.height =
    Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) +
    20 +
    "px";
};

watch(
  () => selected.value?.konten,
  async () => {
    await nextTick();
    setTimeout(resizeIframe, 100);
    setTimeout(resizeIframe, 400);
  },
);

const showAllKepada = ref(false);
const showAllTembusan = ref(false);

const displayedKepada = computed(() => {
  if (showAllKepada.value) return kepadaList.value;
  return kepadaList.value.slice(0, 2);
});

const displayedTembusan = computed(() => {
  if (showAllTembusan.value) return tembusanList.value;
  return tembusanList.value.slice(0, 2);
});

const hiddenKepadaCount = computed(() =>
  Math.max(kepadaList.value.length - 2, 0),
);

const hiddenTembusanCount = computed(() =>
  Math.max(tembusanList.value.length - 2, 0),
);

/* ===============================
   PREVIEW PDF
================================ */
const isPreviewOpen = ref(false);
const previewTitle = ref("Preview Dokumen");
const activePdfUrl = ref<string | null>(null);
const isPdfLoading = ref(false);
const previewFile = ref<any>(null);

const openPreview = async (file: any) => {
  previewFile.value = file;
  previewTitle.value = file.fileName;
  isPreviewOpen.value = true;
  isPdfLoading.value = true;
  activePdfUrl.value = null;

  try {
    const res = await fetch(file.fileUrl);
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: "application/pdf" });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    activePdfUrl.value = file.fileUrl;
  } finally {
    isPdfLoading.value = false;
  }
};

const closePreview = () => {
  isPreviewOpen.value = false;
  if (activePdfUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(activePdfUrl.value);
  }
  activePdfUrl.value = null;
  previewFile.value = null;
};

onUnmounted(() => {
  if (activePdfUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(activePdfUrl.value);
  }
});

const isJenisDI = computed(() => {
  return selected.value?.jenis === "DI";
});
</script>

<template>
  <div class="w-full bg-white rounded-xl shadow border-gray-100">
    <!-- ===== PERIHAL ===== -->
    <div
      class="p-5 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
    >
      <h2
        class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-4"
      >
        {{ selected?.perihal || "-" }}
      </h2>

      <div class="flex flex-wrap items-center gap-2">
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50"
        >
          <Hash class="w-3.5 h-3.5" />
          <span class="font-mono text-xs font-semibold">{{
            selected?.nomor || "-"
          }}</span>
        </div>
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700"
        >
          <Calendar class="w-3.5 h-3.5" />
          <span class="text-xs font-medium">{{
            formatDate(selected?.tanggal)
          }}</span>
        </div>
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50"
        >
          <Tag class="w-3.5 h-3.5" />
          <span class="text-[10px] uppercase font-bold tracking-wider">
            {{ selected?.jenis_label || "-" }}</span
          >
        </div>
      </div>
    </div>

    <!-- ===== PENGIRIM (DENGAN INISIAL) ===== -->
    <div class="p-8 border-b border-gray-100">
      <!-- GRID UTAMA -->
      <div class="grid grid-cols-[40px_1fr] gap-4">
        <!-- AVATAR -->
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center bg-primary-400 text-white font-semibold text-sm mt-1"
        >
          {{ senderInitials }}
        </div>

        <!-- KONTEN KANAN -->
        <div class="space-y-6">
          <!-- NAMA & JABATAN -->
          <div>
            <div class="text-sm font-semibold text-gray-900">
              {{ selected?.pengirim?.positionText || "-" }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ selected?.pengirim?.nama || "-" }}
            </div>
          </div>

          <!-- KEPADA -->
          <div class="grid grid-cols-[120px_1fr] text-sm">
            <div
              class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5"
            >
              Kepada
            </div>

            <div>
              <ol class="list-decimal pl-5 space-y-1">
                <li
                  v-for="k in displayedKepada"
                  :key="k.id"
                  class="text-xs text-gray-400"
                >
                  <span class="font-medium text-sm text-gray-900">
                    {{ k.positionText }}
                  </span>
                  <span class="text-xs text-gray-500 ml-1">
                    ({{ k.nama }})
                  </span>
                </li>
              </ol>

              <button
                v-if="kepadaList.length > 2"
                @click="showAllKepada = !showAllKepada"
                class="mt-1 text-primary-400 font-bold text-xs hover:underline"
              >
                <span v-if="!showAllKepada">
                  +{{ hiddenKepadaCount }} lainnya
                </span>
                <span v-else>Sembunyikan</span>
              </button>
            </div>
          </div>

          <!-- TEMBUSAN -->
          <div
            v-if="tembusanList.length"
            class="grid grid-cols-[120px_1fr] text-sm"
          >
            <div
              class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5"
            >
              Tembusan
            </div>

            <div>
              <ol class="list-decimal pl-5 space-y-1">
                <li
                  v-for="t in displayedTembusan"
                  :key="t.id"
                  class="text-xs text-gray-400"
                >
                  <span class="font-medium text-sm text-gray-900">
                    {{ t.positionText }}
                  </span>
                  <span class="text-xs text-gray-500 ml-1">
                    ({{ t.nama }})
                  </span>
                </li>
              </ol>

              <button
                v-if="tembusanList.length > 2"
                @click="showAllTembusan = !showAllTembusan"
                class="mt-1 text-primary-400 font-bold text-xs hover:underline"
              >
                <span v-if="!showAllTembusan">
                  +{{ hiddenTembusanCount }} lainnya
                </span>
                <span v-else>Sembunyikan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ===== ISI SURAT ===== -->
    <div class="border-b border-b-gray-100">
      <iframe
        ref="iframe"
        :srcdoc="selected?.konten || ''"
        class="w-full block"
        style="border: none"
        scrolling="no"
      />
    </div>

    <!-- ===== LAMPIRAN ===== -->
    <div
      v-if="selected?.lampiran_files?.length"
      class="p-8 border-b border-b-gray-100"
    >
      <h3
        class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"
      >
        <Paperclip class="w-3.5 h-3.5" /> Lampiran
      </h3>

      <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start"
      >
        <button
          v-for="f in selected.lampiran_files"
          :key="f.id"
          @click="openPreview(f)"
          class="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 transition-all text-center"
        >
          <!-- Preview box -->
          <div class="p-3">
            <div
              class="h-36 rounded-xl bg-gray-100 dark:bg-gray-700/40 flex flex-col items-center justify-center gap-2"
            >
              <FileText class="w-8 h-8 text-red-500" />
              <span
                class="text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                PDF
              </span>
            </div>
          </div>

          <!-- Filename -->
          <div class="px-3 pb-4">
            <p
              class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2"
            >
              {{ f.fileName }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- ===== MODAL PREVIEW PDF (CHROME STYLE) ===== -->
    <div v-if="isPreviewOpen" class="fixed inset-0 z-50 bg-white flex flex-col">
      <!-- HEADER -->
      <div
        class="h-12 flex items-center justify-between px-4 border-b border-b-gray-100 bg-white"
      >
        <span class="text-sm font-bold text-black truncate">
          {{ previewTitle }}
        </span>

        <button
          @click="closePreview"
          class="p-1.5 rounded hover:bg-gray-100 transition"
          aria-label="Tutup"
        >
          <X class="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <!-- BODY -->
      <div class="relative flex-1 p-5">
        <!-- LOADING -->
        <div
          v-if="isPdfLoading"
          class="absolute inset-0 flex flex-col items-center justify-center bg-white z-10"
        >
          <Loader2 class="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span class="text-xs text-gray-500">Memuat dokumen…</span>
        </div>

        <!-- PDF -->
        <iframe
          v-if="activePdfUrl && !isPdfLoading"
          :src="activePdfUrl"
          class="w-full h-full border-none"
        />
      </div>
    </div>

    <div class="p-8 w-full flex gap-2">
      <div
        class="flex bg-primary-400 py-2 w-full rounded-lg text-white gap-1 justify-center"
      >
        <FileText class="w-5 h-5"></FileText>
        <button class="text-sm">Lanjut Nota Dinas</button>
      </div>
      <div
        class="flex bg-purple-500 py-2 w-full rounded-lg text-white gap-1 justify-center"
      >
        <FileText class="w-5 h-5"></FileText>
        <button class="text-sm">Lanjut Disposisi</button>
      </div>
      <div
        v-if="isJenisDI"
        class="flex bg-gray-500 py-2 w-full rounded-lg text-white gap-1 justify-center"
      >
        <FileText class="w-5 h-5" />
        <button class="text-sm">Lanjut Konsep</button>
      </div>
    </div>
  </div>
</template>
