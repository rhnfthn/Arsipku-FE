<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="pageTitle"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: '/kelola/pemeliharaan/pemberkasan/berkas-saya' },
        { label: 'Detail Naskah' },
      ]"
    />

    <div v-if="pending" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="details.length">
      <div class="space-y-4">
        <div
          v-for="(detail, index) in details"
          :key="detail.id || index"
          :id="`card-${detail.id || index}`"
        >
          <DetailNaskah
            context="inbox"
            read-only
            :data="detail"
            :is-head="index === 0"
            :collapsed="isCardCollapsed(detail.id, index)"
            :user-position-id="positionId"
            @back="goBack"
            @preview="openDocumentPreview($event, detail.perihal || 'Naskah')"
            @preview-file="openPreviewFile"
            @toggle-collapse="toggleCardCollapse(detail.id, index)"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex min-h-96 flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-file-question" class="size-10" />
      <p>Naskah tidak ditemukan di berkas ini.</p>
    </div>

    <!-- Preview modal -->
    <UModal v-model:open="isPreviewOpen" :ui="{ width: 'sm:max-w-5xl' }">
      <template #header>
        <span class="font-medium">{{ previewTitle }}</span>
      </template>
      <div class="min-h-96">
        <div v-if="isPdfLoading" class="flex min-h-96 items-center justify-center">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
        </div>
        <iframe
          v-if="activePdfUrl"
          :src="activePdfUrl"
          class="h-96 w-full sm:h-[70vh]"
          title="Preview dokumen"
        />
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DetailNaskah from '@/components/DetailNaskah.vue';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { getNaskahDetailInBerkas } = useArsipDinamis();
const toast = useToast();

const berkasId = computed(() => String(route.params.id || ''));
const naskahIdParam = computed(() => String(route.params.naskahId || ''));
const positionId = computed(
  () => user.value?.position?.id || user.value?.position_id || user.value?.position || '',
);

const details = ref<any[]>([]);
const pending = ref(true);
const collapsed = ref<Set<string>>(new Set());

const pageTitle = computed(() => 'Detail Naskah');

// Grouping penerima/tembusan (menyamakan tampilan dengan kotak masuk/terkirim):
// anggota grup lengkap dirangkum jadi 1 entri "Grup", sisanya individual.
function processGrouping(individuals: any[], groups: any[], senderPositionId?: string) {
  if (!Array.isArray(individuals) || individuals.length === 0) return [];
  if (!Array.isArray(groups) || groups.length === 0) return individuals;
  const individualIds = new Set(individuals.map((i) => String(i.position_id || i.id)));
  const matched = new Set<string>();
  const myPosId = String(positionId.value || '');
  const excluded = new Set([myPosId, senderPositionId].filter(Boolean));
  const out: any[] = [];
  for (const g of groups) {
    const req = (g.position_ids || []).map(String);
    const complete =
      req.length > 0 && req.every((id: string) => individualIds.has(id) || excluded.has(id));
    if (complete) {
      out.push({
        id: g.id || `group-${g.nama}`,
        nama: g.nama,
        position_text: g.nama,
        organization_text: 'Grup Penerima',
        is_group: true,
      });
      req.forEach((id: string) => matched.add(id));
    }
  }
  for (const indiv of individuals) {
    if (!matched.has(String(indiv.position_id || indiv.id))) out.push(indiv);
  }
  return out;
}

function mapFlowToDetail(item: any, index: number, flow: any[]) {
  const senderPosId = String(item.pengirim?.position_id || item.from?.position_id || '');
  const penerimaGrup = item.penerima_grup || [];
  const tembusanGrup = item.tembusan_grup || [];
  const to = processGrouping(item.penerima || item.to || [], penerimaGrup, senderPosId);
  const cc = processGrouping(item.tembusan || item.cc || [], tembusanGrup, senderPosId);
  return {
    id: item.id,
    sifat: item.sifat,
    aksi: item.status || item.aksi || 'read',
    jenis: item.jenis,
    jenis_label: item.jenis_label,
    nomor: item.nomor || '-',
    tanggal: item.tanggal || item.created_at,
    created_at: item.created_at,
    perihal: item.perihal,
    pengirim: item.pengirim,
    from: item.pengirim,
    to,
    cc,
    // Isi surat (HTML) dirender via v-html blok di DetailNaskah (rich_content/
    // mainDisplayContentHtml). JANGAN set `konten` — itu memunculkan blok "Instruksi"
    // disposisi untuk SEMUA jenis & merender HTML sebagai text biasa.
    rich_content: item.konten || '',
    mainDisplayContentHtml: item.konten || '',
    // Khusus DI: instruksi disposisi (plain) + catatan (body v-html).
    disposisi: item.detail?.disposisi || item.disposisi || '',
    catatan: item.detail?.catatan || item.catatan || '',
    lampiran_files: item.lampiran_files || [],
    final_pdf_url: item.final_pdf_url || item.final_pdf || '',
    pdf_snapshot: item.final_pdf_url || item.final_pdf || '',
    _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false },
    _hasNewer: false,
    _hasOlder: false,
  };
}

function isCardCollapsed(id: string, index: number) {
  return collapsed.value.has(String(id || index));
}
function toggleCardCollapse(id: string, index: number) {
  const key = String(id || index);
  const next = new Set(collapsed.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  collapsed.value = next;
}

// Preview PDF via blob.
const isPreviewOpen = ref(false);
const isPdfLoading = ref(false);
const activePdfUrl = ref<string | null>(null);
const previewTitle = ref('Dokumen');

async function openDocumentPreview(url: string, title = 'Dokumen') {
  if (!url) {
    toast.add({ title: 'URL dokumen tidak valid', color: 'error' });
    return;
  }
  previewTitle.value = title;
  isPreviewOpen.value = true;
  isPdfLoading.value = true;
  activePdfUrl.value = null;
  try {
    const res = await fetch(url);
    const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch {
    activePdfUrl.value = url;
  } finally {
    isPdfLoading.value = false;
  }
}
function openPreviewFile(file: any) {
  openDocumentPreview(file.file_url || file.file_pdf || file.file_path, file.file_name || 'Lampiran');
}

function goBack() {
  router.push(`/kelola/pemeliharaan/pemberkasan/${berkasId.value}`);
}

onMounted(async () => {
  if (!berkasId.value || !naskahIdParam.value) {
    pending.value = false;
    return;
  }
  try {
    const response = await getNaskahDetailInBerkas(berkasId.value, naskahIdParam.value);
    const rawData: any = response?.data ?? response;
    let flow: any[] = [];
    if (Array.isArray(rawData)) flow = rawData;
    else if (rawData && Array.isArray(rawData.flow)) flow = rawData.flow;
    else if (rawData) flow = [rawData];
    details.value = flow.map((item, index) => mapFlowToDetail(item, index, flow));
  } catch (error: any) {
    details.value = [];
    toast.add({
      title: 'Detail naskah gagal dimuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    pending.value = false;
  }
});
</script>