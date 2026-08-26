<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <PageHeader title="SDE Masal (Surat Dinas Eksternal Massal)" :items="breadcrumbs" />

    
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

      <!-- Step 2: Upload Penerima Massal -->
      <SdeMasalStepUpload
        v-else-if="currentStep === 2"
        v-model="wizardState.penerimaList"
        :konsep="wizardState.konsep"
        @update:skema-template="wizardState.skemaTemplate = $event"
      />

      <!-- Step 3: Template dan Konten -->
      <SdeMasalStepTemplate
        v-else-if="currentStep === 3"
        v-model="wizardState.template"
        :konsep="wizardState.konsep"
        :penerima-list="wizardState.penerimaList"
        :default-skema="wizardState.skemaTemplate"
      />

      <!-- Step 4: Preview dan Konfirmasi -->
      <SdeMasalStepPreview
        v-else-if="currentStep === 4"
        :konsep="wizardState.konsep"
        :penerima-list="wizardState.penerimaList"
        :template="wizardState.template"
        :generating="generating"
        @generate="handleGenerate"
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
          v-if="currentStep < 4"
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
import { reactive, computed, ref } from 'vue';
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
const { generateMassal, generateNaskah } = useSdeMasal();

const steps = [
  { id: 1, label: 'Konsep Surat' },
  { id: 2, label: 'Upload Penerima' },
  { id: 3, label: 'Template & Konten' },
  { id: 4, label: 'Preview & Kirim' },
];

const currentStep = ref(1);
const generating = ref(false);

const wizardState = reactive<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  skemaTemplate: 'KEUANGAN' | 'UMUM' | null;
}>({
  konsep: null,
  penerimaList: [],
  template: null,
  skemaTemplate: null,
});

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '#' },
]);

// Validasi per step
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    const k = wizardState.konsep;
    return !!(k && k.tanggalKonsep && k.klasifikasiId && k.pengirimId && k.pengirimName);
  }
  if (currentStep.value === 2) {
    return wizardState.penerimaList.length > 0 && wizardState.penerimaList.every((p) => p.isValid);
  }
  if (currentStep.value === 3) {
    return !!(wizardState.template && wizardState.template.skema && wizardState.template.konten);
  }
  return true;
});

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const goNext = () => {
  if (!canProceed.value) {
    toast.add({ title: 'Validasi Gagal', description: 'Mohon lengkapi data pada step ini terlebih dahulu', color: 'error' });
    return;
  }
  if (currentStep.value < 4) currentStep.value++;
};

const handleGenerate = async () => {
  if (!wizardState.konsep || !wizardState.template) {
    toast.add({ title: 'Error', description: 'Data wizard tidak lengkap', color: 'error' });
    return;
  }

  generating.value = true;
  try {
    // Step 1: Simpan data wizard ke sde_masal (staging table)
    const result = await generateMassal({
      konsep: wizardState.konsep,
      penerimaList: wizardState.penerimaList,
      template: wizardState.template,
    });

    // Step 2: Generate naskah SDE individual per penerima
    const ids = result?.items?.map((item: any) => item.id) || [];
    if (ids.length > 0) {
      await generateNaskah(ids);
    }

    toast.add({
      title: 'Berhasil',
      description: `${ids.length} naskah SDE berhasil dibuat dan dikirim`,
      color: 'success',
    });

    // Reset wizard state
    wizardState.konsep = null;
    wizardState.penerimaList = [];
    wizardState.template = null;
    wizardState.skemaTemplate = null;
    currentStep.value = 1;

    // Redirect ke dashboard
    router.push('/korespondensi/sde-masal');
  } catch (e: any) {
    console.error('Gagal generate massal:', e);
    toast.add({
      title: 'Gagal Generate',
      description: e?.message || 'Terjadi kesalahan saat generate massal',
      color: 'error',
    });
  } finally {
    generating.value = false;
  }
};
</script>