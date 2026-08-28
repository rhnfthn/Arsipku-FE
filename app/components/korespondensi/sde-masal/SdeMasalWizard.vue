<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <PageHeader title="SDE Masal" :items="breadcrumbs" />

    
    <!-- Stepper -->
    <div class="mb-6">
      <div class="flex items-center justify-between max-w-3xl mx-auto">
        <template v-for="(step, idx) in steps" :key="step.id">
          <!-- Step circle + label -->
          <div class="flex flex-col items-center flex-1 relative">
            <!-- Connector line (left) -->
            <div
              v-if="idx > 0"
              class="absolute top-5 left-0 w-full h-0.5 -translate-x-1/2"
              :class="currentStep >= step.id ? 'bg-[#457fb6]' : 'bg-gray-200 dark:bg-gray-700'"
            />
            <!-- Circle -->
            <div
              class="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200"
              :class="[
                currentStep === step.id
                  ? 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20'
                  : currentStep > step.id
                    ? 'bg-[#457fb6] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
              ]"
            >
              <UIcon v-if="currentStep > step.id" name="i-lucide-check" class="w-5 h-5" />
              <span v-else>{{ step.id }}</span>
            </div>
            <!-- Label -->
            <span
              class="mt-2 text-xs font-medium text-center transition-colors"
              :class="currentStep >= step.id ? 'text-[#457fb6] dark:text-[#5a9fd0]' : 'text-gray-400 dark:text-gray-500'"
            >
              {{ step.label }}
            </span>
          </div>
        </template>
      </div>
    </div>

    <!-- Step Content -->
    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">
      <!-- Step 1: Konsep Surat -->
      <SdeMasalStepKonsep
        v-if="currentStep === 1"
        v-model="wizardState.konsep"
        :parent-naskah-id="parentNaskahId"
      />

      <!-- Step 2: Template, variabel, dan penerima dalam satu langkah -->
      <div v-else-if="currentStep === 2" class="space-y-6">
        <div class="overflow-hidden rounded-xl border border-primary-100 bg-white shadow-sm dark:border-primary-900/50 dark:bg-gray-800">
          <div class="flex items-center gap-3 border-b border-primary-100 bg-primary-50/70 px-5 py-3 dark:border-primary-900/50 dark:bg-primary-950/30">
            <div class="flex size-9 items-center justify-center rounded-lg bg-primary-500 text-white shadow-sm">
              <UIcon name="i-lucide-file-text" class="size-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Konsep Surat</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Informasi surat yang akan dibuat massal</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-3 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:bg-gray-900/20">
            <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div class="absolute inset-x-0 top-0 h-1 bg-primary-400" />
              <div class="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"><UIcon name="i-lucide-calendar-days" class="size-3.5 text-primary-500" />Tanggal</div>
              <p class="mt-3 border-t border-slate-100 pt-3 text-left text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">{{ wizardState.konsep?.tanggalKonsep || '-' }}</p>
            </div>
            <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div class="absolute inset-x-0 top-0 h-1 bg-primary-400" />
              <div class="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"><UIcon name="i-lucide-tags" class="size-3.5 text-primary-500" />Klasifikasi</div>
              <p class="mt-3 border-t border-slate-100 pt-3 text-left text-sm font-semibold leading-relaxed text-gray-900 dark:border-gray-700 dark:text-white">{{ wizardState.konsep?.klasifikasiName || '-' }}</p>
            </div>
            <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div class="absolute inset-x-0 top-0 h-1 bg-primary-400" />
              <div class="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"><UIcon name="i-lucide-user-round" class="size-3.5 text-primary-500" />Pengirim</div>
              <p class="mt-3 border-t border-slate-100 pt-3 text-left text-sm font-semibold leading-relaxed text-gray-900 dark:border-gray-700 dark:text-white">{{ wizardState.konsep?.pengirimName || '-' }}</p>
            </div>
            <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div class="absolute inset-x-0 top-0 h-1 bg-primary-400" />
              <div class="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"><UIcon name="i-lucide-shield-check" class="size-3.5 text-primary-500" />Sifat</div>
              <p class="mt-3 border-t border-slate-100 pt-3 text-left text-sm font-semibold capitalize text-gray-900 dark:border-gray-700 dark:text-white">{{ wizardState.konsep?.sifat === 'biasa' ? 'Biasa / Terbuka' : wizardState.konsep?.sifat || '-' }}</p>
            </div>
          </div>
        </div>
        <SdeMasalStepTemplate
          v-model="wizardState.template"
          :konsep="wizardState.konsep"
          :penerima-list="wizardState.penerimaList"
          @update:variables="wizardState.variables = $event"
        />
        <SdeMasalStepUpload
          v-model="wizardState.penerimaList"
          :konsep="wizardState.konsep"
          :dynamic-variables="wizardState.variables"
        />
      </div>

      <!-- Step 3: Preview dan Konfirmasi -->
      <SdeMasalStepPreview
        v-else-if="currentStep === 3"
        :konsep="wizardState.konsep"
        :penerima-list="wizardState.penerimaList"
        :template="wizardState.template"
        :generating="generating"
        @submit-verification="handleSubmitVerification"
      />
    </UCard>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between mt-4 px-1">
      <!-- Kembali -->
      <UButton
        v-if="currentStep > 1"
        label="Kembali"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        @click="goBack"
      />
      <div v-else />

      <!-- Selanjutnya / Generate -->
      <div class="flex items-center gap-2">
        <UButton
          v-if="currentStep < 3"
          label="Selanjutnya"
          color="primary"
          icon="i-lucide-arrow-right"
          :disabled="!canProceed"
          @click="goNext"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useToast } from '#imports';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import SdeMasalStepKonsep from './SdeMasalStepKonsep.vue';
import SdeMasalStepUpload from './SdeMasalStepUpload.vue';
import SdeMasalStepTemplate from './SdeMasalStepTemplate.vue';
import SdeMasalStepPreview from './SdeMasalStepPreview.vue';

const props = defineProps<{
  parentNaskahId?: string;
}>();

const router = useRouter();
const toast = useToast();
const { generateMassal, saveConcept, submitVerification } = useSdeMasal();

const steps = [
  { id: 1, label: 'Konsep Surat' },
  { id: 2, label: 'Template & Penerima' },
  { id: 3, label: 'Preview & Kirim' },
];

const currentStep = ref(1);
const generating = ref(false);
const conceptId = ref<string | null>(null);

const wizardState = reactive<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  variables: string[];
}>({
  konsep: null,
  penerimaList: [],
  template: null,
  variables: [],
});

const draftStorageKey = `sde-masal-wizard:${props.parentNaskahId || 'new'}`;
const persistenceReady = ref(false);

onMounted(() => {
  try {
    const saved = localStorage.getItem(draftStorageKey);
    if (saved) {
      const draft = JSON.parse(saved);
      wizardState.konsep = draft.konsep || null;
      wizardState.penerimaList = Array.isArray(draft.penerimaList) ? draft.penerimaList : [];
      wizardState.template = draft.template || null;
      wizardState.variables = Array.isArray(draft.variables) ? draft.variables : [];
      conceptId.value = draft.conceptId || null;
      currentStep.value = [1, 2, 3].includes(draft.currentStep) ? draft.currentStep : 1;
    }
  } catch (error) {
    console.warn('Gagal memulihkan draft SDE Masal:', error);
  } finally {
    persistenceReady.value = true;
  }
});

watch(
  () => ({
    konsep: wizardState.konsep,
    penerimaList: wizardState.penerimaList,
    template: wizardState.template,
    variables: wizardState.variables,
    conceptId: conceptId.value,
    currentStep: currentStep.value,
  }),
  (draft) => {
    if (!persistenceReady.value) return;
    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  },
  { deep: true },
);

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '#' },
]);

// Validasi per step
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return !!(
      wizardState.konsep?.tanggalKonsep &&
      wizardState.konsep?.klasifikasiId &&
      wizardState.konsep?.pengirimId
    );
  }
  if (currentStep.value === 2) {
    return !!(
      wizardState.konsep?.tanggalKonsep &&
      wizardState.konsep?.klasifikasiId &&
      wizardState.konsep?.pengirimId &&
      wizardState.template?.konten &&
      wizardState.penerimaList.length > 0 &&
      wizardState.penerimaList.every((p) => p.isValid)
    );
  }
  return true;
});

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const goNext = async () => {
  if (!canProceed.value) {
    toast.add({ title: 'Validasi Gagal', description: 'Mohon lengkapi data pada step ini terlebih dahulu', color: 'error' });
    return;
  }
  if (wizardState.konsep && !conceptId.value) {
    try {
      const saved = await saveConcept(wizardState.konsep);
      conceptId.value = saved?.id ?? null;
      toast.add({ title: 'Konsep tersimpan', description: 'Data konsep surat disimpan sebagai draft.', color: 'success' });
    } catch (error: any) {
      toast.add({ title: 'Gagal menyimpan konsep', description: error?.message || 'Coba lagi.', color: 'error' });
      return;
    }
  }
  if (currentStep.value < 3) currentStep.value++;
};

const handleSubmitVerification = async (verifikators: any[]) => {
  if (!wizardState.konsep || !wizardState.template) {
    toast.add({ title: 'Error', description: 'Data wizard tidak lengkap', color: 'error' });
    return;
  }
  if (!Array.isArray(verifikators) || verifikators.length === 0) {
    toast.add({ title: 'Verifikator belum dipilih', description: 'Pilih minimal satu verifikator.', color: 'error' });
    return;
  }

  generating.value = true;
  try {
    const result = await generateMassal({
      konsep: wizardState.konsep,
      conceptId: conceptId.value || undefined,
      penerimaList: wizardState.penerimaList,
      template: wizardState.template,
    });

    const ids = result?.items?.map((item: any) => item.id) || [];
    if (ids.length > 0) {
      await submitVerification(ids, verifikators);
    }

    toast.add({
      title: 'Berhasil',
      description: `${ids.length} SDE Massal berhasil diajukan ke verifikator`,
      color: 'success',
    });

    // Reset wizard state
    wizardState.konsep = null;
    wizardState.penerimaList = [];
    wizardState.template = null;
    wizardState.variables = [];
    conceptId.value = null;
    currentStep.value = 1;
    persistenceReady.value = false;
    localStorage.removeItem(draftStorageKey);

    router.push({
      path: '/korespondensi/sde-masal',
      query: ids[0] ? { detail: ids[0] } : undefined,
    });
  } catch (e: any) {
    console.error('Gagal mengajukan verifikasi SDE Massal:', e);
    toast.add({
      title: 'Gagal Mengajukan',
      description: e?.message || 'Terjadi kesalahan saat mengajukan verifikasi',
      color: 'error',
    });
  } finally {
    generating.value = false;
  }
};
</script>
