<script setup lang="ts">
import { computed } from "vue";
import { Hash, Calendar, Paperclip, FileText, ArrowLeft, Printer, MoreHorizontal, ChevronUp, CheckCircle, XCircle, Edit3, Send, Users, Building2 } from "lucide-vue-next";

// --- PROPS ---
const props = defineProps<{
  data: any;
  isHead?: boolean;
  showFinalize?: boolean;
  showEdit?: boolean;
  showFooterActions?: boolean;
  allowedActions?: string[];
  context?: string;
  userPositionId?: string | number;
}>();

// --- EMITS ---
const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'preview', url: string): void;
  (e: 'preview-file', file: any): void;
  (e: 'finalize'): void;
  (e: 'reject'): void;
  (e: 'edit'): void;
  (e: 'lanjut-nota'): void;
  (e: 'lanjut-sdi'): void;
  (e: 'lanjut-sde'): void;
  (e: 'lanjut-disposisi'): void;
  (e: 'lanjut-konsep'): void;
}>();

const shouldShowFinalize = computed(() => {
  if (typeof props.showFinalize === 'boolean') {
    return props.showFinalize;
  }

  // Ini menjaga backward compatibility jika komponen dipakai di halaman lain tanpa prop.
  const isInbox = props.context === 'inbox' || props.context === 'kotak-masuk';
  const isPendingConcept = props.data?.aksi === 'create';

  if (isInbox && isPendingConcept) {
    return true;
  }

  return false;
});

// --- CONSTANTS ---
const LIMIT_DISPLAY = 2;
const MAX_FLOW_HEIGHT = 200;

// --- HELPERS ---
const formatDate = (v: string) => v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
const formatDisposisiInline = (v: any) => Array.isArray(v) ? v.join(', ') : String(v || '').replace(/(\r\n|\n|\r)/gm, ", ");
const getFlowInitials = (n: string) => n ? n.trim().split(" ").slice(0, 2).map((x: string) => x[0].toUpperCase()).join("") : "?";

// --- AKSI BADGE (tambahan) ---
const aksiConfig: Record<string, { label: string; color: string }> = {
  create:  { label: 'BUAT KONSEP', color: 'bg-blue-500' },
  forward: { label: 'REVISI',      color: 'bg-amber-500' },
  reject:  { label: 'DITOLAK',     color: 'bg-red-500' },
};

const aksiBadge = computed(() => {
  const aksi = props.data?.aksi as string;
  return aksiConfig[aksi] ?? null; // null = badge tidak ditampilkan
});

// --- IFRAME LOGIC ---
const handleFlowIframeLoad = (e: Event, flow: any) => {
  const iframe = e.target as HTMLIFrameElement;
  if (!iframe || !iframe.contentWindow) return;

  const doc = iframe.contentWindow.document;
  iframe.style.height = '10px';

  const rawHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
  const contentHeight = rawHeight + 10;
  flow.realHeight = contentHeight;

  if (contentHeight > MAX_FLOW_HEIGHT) {
    flow.showReadMore = true;
    flow.iframeHeight = flow.isExpanded ? `${contentHeight}px` : `${MAX_FLOW_HEIGHT}px`;
  } else {
    flow.showReadMore = false;
    flow.iframeHeight = `${contentHeight}px`;
  }
};

const toggleFlowContent = (flow: any) => {
  flow.isExpanded = !flow.isExpanded;
  flow.iframeHeight = flow.isExpanded ? `${flow.realHeight}px` : `${MAX_FLOW_HEIGHT}px`;
};

// Helper permission
const hasAccess = (codes: string[]) => {
  if (!props.allowedActions) return false;
  return codes.some(code => props.allowedActions?.includes(code));
};
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md relative transition-colors">

    <div>
      <div class="h-14 flex items-center justify-between px-4 shrink-0">
        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
          <template v-if="isHead">
            <button @click="emit('back')"
              class="rounded-full text-gray-600 dark:text-gray-300 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <h1 class="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Kembali</h1>
          </template>
          <template v-else>
            <h2 class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {{
                data.subject || (
                  data.aksi === 'create' ? 'Konsep Awal' :
                    data.aksi === 'reject' ? 'Konsep Ditolak' :
                      data.aksi === 'forward' ? 'Revisi Konsep' :
                        'Riwayat'
                )
              }}
            </h2>
          </template>
        </div>

        <div class="flex items-center gap-2 shrink-0 pl-2">
          <UTooltip text="Pratinjau Dokumen">
            <button v-if="data.pdf_snapshot || data.naskah?.final_pdf || data.final_pdf_url"
              @click="emit('preview', data.pdf_snapshot || data.naskah?.final_pdf || data.final_pdf_url)"
              class="p-2 hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
              <Printer class="w-4 h-4" />
            </button>
          </UTooltip>
        </div>
      </div>

      <div class="p-5 sm:py-5 sm:px-8 bg-gray-50/30 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-700">
        <h2 v-if="data.subject || data.perihal"
          class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {{ data.subject || data.perihal || '(Tidak ada perihal)' }}
        </h2>
        <h2 v-else-if="data.jenis_label?.includes('DISPOSISI')"
          class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Disposisi
        </h2>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div v-if="data.naskah?.nomor || data.nomor" class="flex items-center gap-1">
            <Hash class="w-3.5 h-3.5" /><span class="font-mono font-semibold text-gray-700 dark:text-gray-300">{{
              data.naskah?.nomor || data.nomor }}</span>
          </div>
          <span class="opacity-40">•</span>
          <div class="flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5" /><span>{{ formatDate(data.created_at || data.tanggal) }}</span>
          </div>
          <span class="opacity-40">•</span>
          <div
            class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-primary-300 dark:bg-primary-600">
            {{ data.sifat }}
          </div>
          <span class="opacity-40">•</span>
          <div
            class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-primary-500 dark:bg-primary-600">
            {{ data.aksi === 'kirim_disposisi' ?
              'DISPOSISI' : (data.aksi === 'create' ?
                'KONSEP' : (data.jenis_label || data.aksi)) }}
          </div>
          <!-- Badge aksi tambahan: hanya muncul untuk create / forward / reject -->
          <template v-if="aksiBadge">
            <span class="opacity-40">•</span>
            <div
              class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
              :class="aksiBadge.color">
              {{ aksiBadge.label }}
            </div>
          </template>
          <span class="opacity-40" v-if="data.ttd">•</span>
          <div v-if="data.ttd"
            class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white bg-amber-500">
            {{ data.ttd }}
          </div>
        </div>
        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-3 gap-1" v-if="data?.dikirim_oleh">
          <span>Dikirim oleh :</span>
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ data.dikirim_oleh.position_text }}
          </span>
          <span class="text-gray-400 dark:text-gray-500">({{ data.dikirim_oleh.nama }})</span>
        </div>
      </div>
    </div>

    <div class="p-5 sm:p-8">

      <div class="flex items-center gap-4 mb-5 border-gray-200 dark:border-gray-700/50">
        <UAvatar size="md" class="bg-primary-500 text-white font-semibold">
          {{ getFlowInitials(data.from?.nama || data.pengirim?.nama) }}
        </UAvatar>
        <div>
          <span class="text-sm font-semibold block text-gray-900 dark:text-white">
            {{ data.from?.position_text || data.pengirim?.positionText || data.pengirim?.position_text || '-' }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">{{ data.from?.nama ||
            data.pengirim?.nama
            ||
            '-' }}</span>
        </div>
      </div>

      <div v-if="data.aksi === 'create' || data.aksi === 'forward'" class="mb-4 flex flex-col md:flex-row gap-2">
        <div
          class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
          Pengirim </div>
        <div class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
          <div class="truncate min-w-0">
            <span class="font-medium">{{ data.pengirim?.position_text }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ data.pengirim?.nama }})</span>
          </div>
        </div>
      </div>

      <div class="mb-4 flex flex-col md:flex-row gap-2">
        <div
          class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
          Tertuju
        </div>
        <div class="flex flex-col gap-1 max-w-full min-w-0">

          <div v-if="Array.isArray(data.to || data.kepada)" class="flex flex-col gap-0.5 w-full min-w-0">
            <div
              v-for="(t, ti) in (data.showAllTo ? (data.to || data.kepada) : (data.to || data.kepada).slice(0, LIMIT_DISPLAY))"
              :key="ti" class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 min-w-0">
              <span class="text-gray-400 dark:text-gray-500 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ ti + 1
              }}.</span>

              <div class="truncate min-w-0">
                <template v-if="data.jenis === 'SDE' || data.jenis === 'sde'">
                  <span class="font-medium">{{ t.nama }}</span>
                </template>
                <template v-else>
                  <span class="font-medium">{{ t.position_text }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama }})</span>
                </template>
              </div>
            </div>

            <button v-if="(data.to || data.kepada).length > LIMIT_DISPLAY" @click="data.showAllTo = !data.showAllTo"
              class="text-xs font-semibold text-primary hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300 mt-1 flex items-center gap-1 text-left w-fit">
              {{ data.showAllTo ? 'Sembunyikan' : `+${(data.to || data.kepada).length - LIMIT_DISPLAY} lainnya` }}
            </button>
          </div>

          <div v-else class="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200 truncate">
            <div class="break-words">
              <template v-if="data.jenis === 'SDE' || data.jenis === 'sde'">
                <span class="font-medium">{{ data.to?.nama || data.kepada?.nama }}</span>
              </template>
              <template v-else>
                <span class="font-medium">{{ data.to?.position_text }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ data.to?.nama }})</span>
              </template>
            </div>
          </div>

        </div>
      </div>

      <div v-if="(data.cc || data.tembusan) && (data.cc || data.tembusan).length > 0"
        class="mb-6 flex flex-col md:flex-row gap-2">
        <div
          class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
          Tembusan</div>
        <div class="flex flex-col gap-0.5 w-full min-w-0">
          <div
            v-for="(t, ti) in (data.showAllCc ? (data.cc || data.tembusan) : (data.cc || data.tembusan).slice(0, LIMIT_DISPLAY))"
            :key="ti" class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
            <span class="text-gray-400 dark:text-gray-500 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ ti + 1
            }}.</span>
            <div class="truncate min-w-0">
              <span class="font-medium">{{ t.position_text }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({{ t.nama }})</span>
            </div>
          </div>
          <button v-if="(data.cc || data.tembusan).length > LIMIT_DISPLAY" @click="data.showAllCc = !data.showAllCc"
            class="text-xs font-semibold text-primary hover:text-primary-400 dark:text-primary-400 dark:hover:text-primary-300 mt-1 flex items-center gap-1 text-left w-fit">
            {{ data.showAllCc ? 'Sembunyikan' : `+${(data.cc || data.tembusan).length - LIMIT_DISPLAY} lainnya` }}
          </button>
        </div>
      </div>

      <div v-if="data.disposisi_content?.disposisi || data.disposisi || data.jenis === 'DI'"
        class="mb-4 flex flex-col md:flex-row gap-2">
        <div
          class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
          Instruksi</div>
        <div class="flex flex-col gap-1 w-full min-w-0">
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
            {{ data.disposisi_content?.disposisi
              ? data.disposisi_content.disposisi.replace(/\n/g, ', ')
              : data.disposisi
                ? formatDisposisiInline(data.disposisi)
                : (data.mainDisplayContentHtml || '').replace(/\n/g, ', ') }}
          </p>
        </div>
      </div>

      <div v-if="data.aksi === 'reject' || data.aksi === 'create' || data.aksi === 'forward'"
        class="mb-4 flex flex-col md:flex-row gap-2">
        <div
          class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest min-w-[110px] mt-0.5">
          Pesan</div>
        <div class="flex flex-col gap-1 w-full min-w-0">
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
            {{ data.catatan || '-' }}
          </div>
        </div>
      </div>

      <div class="bg-gray-50 dark:bg-gray-900 rounded-lg mt-5 p-5 border border-gray-100 dark:border-gray-700 relative">
        <template v-if="data.rich_content || data.mainDisplayContentHtml">
          <div class="relative w-full">
            <div class="relative overflow-hidden transition-all duration-300 ease-in-out">

              <iframe
                :srcdoc="'<!DOCTYPE html><html><head><style>html,body{background-color:transparent !important;margin:0;padding:0;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;color:#374151;line-height:1.5;} @media (prefers-color-scheme: dark) { body { color: #d1d5db; } }</style></head><body>' + (data.jenis === 'DI' ? (data.catatan || '-') : (data.rich_content || data.mainDisplayContentHtml)) + '</body></html>'"
                class="w-full bg-transparent block" style="border: none;" :style="{
                  height: data.iframeHeight,
                  overflowY: data.isExpanded ? 'auto' : 'hidden'
                }" :scrolling="data.isExpanded ? 'auto' : 'no'" @load="handleFlowIframeLoad($event, data)">
              </iframe>

              <div v-if="data.showReadMore && !data.isExpanded"
                class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 pointer-events-none">
              </div>
            </div>

            <div v-if="data.showReadMore" class="flex justify-center mt-2 relative z-10">
              <button @click="toggleFlowContent(data)"
                class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span v-if="!data.isExpanded" class="flex items-center gap-1">
                  <MoreHorizontal class="w-4 h-4" /> BACA SELENGKAPNYA
                </span>
                <span v-else class="flex items-center gap-1">
                  <ChevronUp class="w-4 h-4" /> TUTUP KONTEN
                </span>
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="data.type === 'disposisi'">
          <div>
            <div v-if="data.disposisi_content?.catatan && data.disposisi_content.catatan !== '-'"
              class="prose prose-sm prose-blue dark:prose-invert max-w-none text-sm"
              v-html="data.disposisi_content.catatan">
            </div>
            <p v-else class="text-sm text-gray-400 italic">
              - Tidak ada catatan disposisi -
            </p>
          </div>
        </template>

        <template v-else>
          <div>
            <p v-if="data.catatan && data.catatan !== '-'"
              class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ data.catatan }}
            </p>
            <p v-else class="text-sm text-gray-400 italic">
              Tidak ada catatan
            </p>
          </div>
        </template>
      </div>

      <div class="mt-6">
        <div v-if="(data.attachments || data.lampiran_files) && (data.attachments || data.lampiran_files).length > 0"
          class="mb-3">
          <h3
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Paperclip class="w-3 h-3" /> Lampiran
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button v-for="file in (data.attachments || data.lampiran_files)" :key="file.id"
              @click="emit('preview-file', file)"
              class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-center flex flex-col h-full overflow-hidden group">
              <div class="p-2 w-full">
                <div
                  class="h-24 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex flex-col items-center justify-center gap-1 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                  <FileText class="w-8 h-8 text-red-500" stroke-width="1.5" />
                  <span
                    class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">PDF</span>
                </div>
              </div>
              <div class="px-3 pb-3 flex-1 flex items-center justify-center w-full">
                <UTooltip :text="file.file_name || file.fileName" :popper="{ placement: 'top' }">
                  <p class="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 break-all leading-tight">
                    {{ file.file_name || file.fileName }}
                  </p>
                </UTooltip>
              </div>
            </button>
          </div>
        </div>
        <!-- {{ data.aksi }} -->
        <div class="flex flex-wrap gap-3 mt-8">
          <template
            v-if="data.pengirim?.position_id == userPositionId && data.aksi === 'create' || data.aksi === 'forward'">

            <div @click="!isHead ? null : emit('finalize')"
              class="flex bg-emerald-500 text-white py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm"
              :class="!isHead ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-600 cursor-pointer active:scale-[0.98]'">
              <CheckCircle class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Setujui</span>
            </div>

            <div @click="!isHead ? null : emit('reject')"
              class="flex bg-red-500 text-white py-2.5 px-6 rounded-lg gap-2 items-center transition-colors shadow-sm"
              :class="!isHead ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600 cursor-pointer active:scale-[0.98]'">
              <XCircle class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Tolak</span>
            </div>
          </template>

          <!-- <div v-if="data.penerima[0].position_id == userPositionId && data.aksi === 'reject'" @click="emit('edit')" -->
          <div v-if="data.penerima?.[0]?.position_id == userPositionId && data.aksi === 'reject'" @click="emit('edit')"
            class="flex bg-amber-500 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-colors shadow-sm active:scale-[0.98]">
            <Edit3 class="w-4 h-4" /><span class="text-sm font-medium whitespace-nowrap">Perbaiki Konsep</span>

          </div>

          <template v-if="showFooterActions">
            <div v-if="hasAccess(['ND'])" @click="emit('lanjut-nota')"
              class="flex bg-emerald-600 hover:bg-emerald-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
              <FileText class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Lanjut Nota Dinas</span>
            </div>

            <div v-if="hasAccess(['SDI'])" @click="emit('lanjut-sdi')"
              class="flex bg-amber-600 hover:bg-amber-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
              <Users class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Lanjut Surat Internal</span>
            </div>

            <div v-if="hasAccess(['SDE'])" @click="emit('lanjut-sde')"
              class="flex bg-sky-600 hover:bg-sky-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
              <Building2 class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Lanjut Surat Eksternal</span>
            </div>

            <div v-if="hasAccess(['DI'])" @click="emit('lanjut-disposisi')"
              class="flex bg-cyan-600 hover:bg-cyan-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
              <Send class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Lanjut Disposisi</span>
            </div>

            <div v-if="hasAccess(['KO'])" @click="emit('lanjut-konsep')"
              class="flex bg-yellow-500 hover:bg-yellow-600 cursor-pointer py-2.5 px-6 rounded-lg text-white gap-2 items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]">
              <Edit3 class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">Lanjut Konsep</span>
            </div>
          </template>

        </div>

      </div>
    </div>
  </div>
</template>
