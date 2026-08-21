<template>
  <div class="flex flex-col gap-4">
    <PageHeader :subtitle="detail?.perihal ?? ''">
      <template #title>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Evaluasi Naskah</h1>
        <StatusBadge v-if="detail" :status="'evaluasi'" />
      </template>
    </PageHeader>

    <USkeleton v-if="pending" class="h-56" />
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</div>
    <div v-else-if="detail" class="flex flex-col gap-5 max-w-2xl">
      <UCard>
        <template #header><h3 class="text-sm font-semibold">Checklist Evaluasi</h3></template>
        <UCheckboxGroup v-model="checked" :items="checklist" value-key="id" label-key="label" description-key="desc" color="primary" class="text-sm" />
      </UCard>

      <UCard>
        <template #header><h3 class="text-sm font-semibold">Apakah naskah sesuai?</h3></template>
        <div class="flex flex-col gap-3">
          <UTextarea v-model="catatan" placeholder="Catatan (opsional)" />
          <div class="flex flex-wrap gap-2">
            <UButton color="success" icon="i-lucide-check" :loading="busy" @click="putuskan(true)">Sesuai — Lanjut Tanda Tangan</UButton>
            <UButton color="error" variant="soft" icon="i-lucide-x" :loading="busy" @click="putuskan(false)">Tidak Sesuai</UButton>
            <UButton
              v-if="canKembalikanLegal"
              color="warning" variant="soft" icon="i-lucide-undo-2"
              @click="showKembalikanModal = true"
            >Kembalikan ke Legal Drafting</UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Kembalikan ke legal drafting (alasan wajib) — naskah balik ke legal_drafting
         agar drafter legal merevisi sesuai alasan di bawah. -->
    <VerifyActionModal
      v-model="showKembalikanModal"
      variant="reject"
      title="Kembalikan ke Legal Drafting"
      description="Naskah dikembalikan ke legal drafting agar drafter legal merevisi sesuai alasan Anda."
      :require-note="true"
      note-placeholder="Tuliskan alasan pengembalian ke legal drafting…"
      confirm-label="Kembalikan"
      :saving="sendingKembalikan"
      @confirm="doKembalikan"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const route = useRoute();
const id = route.params.id as string;
const { detail, pending, error, fetchDetail, evaluasi, kembalikanEvaluasi } = useNaskahLainnya();

const errorMessage = computed(() => (error.value as any)?.response?.data?.message ?? 'Gagal memuat naskah.');

const checklist = [
  { id: 'format', label: 'Format naskah sesuai kaidah tata naskah dinas', desc: 'Susunan, penomoran bab/pasal, konsistensi.' },
  { id: 'isi', label: 'Isi materi lengkap dan tidak bertentangan dengan peraturan di atasnya' },
  { id: 'legal', label: 'Hasil legal drafting sudah diterapkan' },
  { id: 'pendukung', label: 'Dokumen pendukung lengkap' },
  { id: 'lain', label: 'Hal lain yang perlu dievaluasi' },
];
const checked = ref<string[]>([]);
const catatan = ref('');
const busy = ref(false);

// Kembalikan ke legal drafting — hanya untuk naskah butuh legal (aksi disediakan BE).
const canKembalikanLegal = computed(() =>
  (detail.value?.availableActions ?? []).includes('kembalikan-evaluasi'),
);
const showKembalikanModal = ref(false);
const sendingKembalikan = ref(false);

async function putuskan(sesuai: boolean) {
  busy.value = true;
  try {
    await evaluasi(id, { sesuai, checklist: checked.value, catatan: catatan.value || undefined });
    if (sesuai) navigateTo(`/naskah-lainnya/${id}/tanda-tangan`);
    else {
      useToast().add({ title: 'Naskah perlu perbaikan', color: 'warning' });
      navigateTo(`/naskah-lainnya/${id}`);
    }
  } finally { busy.value = false; }
}

async function doKembalikan(note: string) {
  sendingKembalikan.value = true;
  try {
    await kembalikanEvaluasi(id, note);
    useToast().add({ title: 'Dikembalikan ke Legal Drafting', description: 'Drafter legal akan merevisi naskah.', color: 'warning' });
    navigateTo(`/naskah-lainnya/${id}`);
  } catch (e: any) {
    useToast().add({ title: 'Gagal mengembalikan', description: (e as any)?.response?.data?.message ?? 'Silakan coba kembali.', color: 'error' });
  } finally {
    sendingKembalikan.value = false;
    showKembalikanModal.value = false;
  }
}

onMounted(() => fetchDetail(id));
</script>
