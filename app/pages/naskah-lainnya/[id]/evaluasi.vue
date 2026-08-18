<template>
  <div class="flex flex-col gap-4">
    <PageHeader :subtitle="detail?.nomor ?? ''">
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
          <div class="flex gap-2">
            <UButton color="success" icon="i-lucide-check" :loading="busy" @click="putuskan(true)">Sesuai — Lanjut Tanda Tangan</UButton>
            <UButton color="error" variant="soft" icon="i-lucide-x" :loading="busy" @click="putuskan(false)">Tidak Sesuai</UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNaskahLainnya } from '~/composables/useNaskahLainnya';

definePageMeta({ layout: 'default', middleware: ['auth'] });

const route = useRoute();
const id = route.params.id as string;
const { detail, pending, error, fetchDetail, evaluasi } = useNaskahLainnya();

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

onMounted(() => fetchDetail(id));
</script>
