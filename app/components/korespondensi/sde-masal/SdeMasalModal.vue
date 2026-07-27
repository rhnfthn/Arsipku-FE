<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 backdrop-blur-sm pt-10 sm:pt-20"
      @click.self="close"
    >
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[85vh] flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ step === 1 ? 'Konsep SDE Masal' : 'Upload SDE Masal' }}
            </h3>
            <p v-if="step === 1" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Isi data konsep surat untuk SDE Masal.</p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pengirim: {{ concept.pengirimName || '-' }}</p>
          </div>
          <button @click="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto px-5 py-4 flex-1">
          <!-- Step 1: Konsep Surat -->
          <div v-if="step === 1" class="space-y-4">
            <!-- Tanggal Konsep -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Konsep Surat <span class="text-red-500">*</span></label>
              <input
                v-model="concept.tanggalKonsep"
                type="date"
                class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              />
            </div>

            <!-- Klasifikasi -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Klasifikasi <span class="text-red-500">*</span></label>
              <select
                v-model="concept.klasifikasiId"
                @change="onKlasifikasiChange"
                class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              >
                <option value="">Pilih klasifikasi...</option>
                <option v-for="k in klasifikasiList" :key="k.id" :value="k.id">
                  {{ k.klasifikasi }} - {{ k.klasifikasi_text }}
                </option>
              </select>
              <p v-if="klasifikasiLoading" class="text-xs text-gray-400 mt-1">Memuat klasifikasi...</p>
            </div>

            <!-- Pengirim -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pengirim <span class="text-red-500">*</span></label>
              <select
                v-model="concept.pengirimId"
                @change="onPengirimChange"
                class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              >
                <option value="">Pilih pengirim...</option>
                <option v-for="s in senderItems" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
              <p v-if="senderLoading" class="text-xs text-gray-400 mt-1">Memuat pengirim...</p>
              <p v-else-if="senderItems.length === 0 && userPosition" class="text-xs text-gray-400 mt-1">Tidak ada pengirim tersedia.</p>
            </div>
          </div>

          <!-- Step 2: Upload Excel -->
          <div v-else-if="step === 2" class="space-y-4">
            <!-- Info Pengirim -->
            <div class="bg-[#457fb6]/10 dark:bg-[#457fb6]/20 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-user" class="w-4 h-4 text-[#457fb6]" />
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ concept.pengirimName || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Skema Template -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Skema Template <span class="text-red-500">*</span></label>
              <select
                v-model="upload.skemaTemplate"
                class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              >
                <option value="">Pilih skema...</option>
                <option value="SDE-STANDAR">SDE Standar</option>
                <option value="SDE-KHUSUS">SDE Khusus</option>
              </select>
            </div>

            <!-- Versi Template -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Versi Template <span class="text-red-500">*</span></label>
              <select
                v-model="upload.versiTemplate"
                class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              >
                <option value="">Pilih versi...</option>
                <option value="v1">v1</option>
                <option value="v2">v2</option>
              </select>
            </div>

            <!-- Upload File -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">File Excel <span class="text-red-500">*</span></label>
              <div
                @click="$refs.fileInput.click()"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
                :class="[
                  'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors',
                  dragOver
                    ? 'border-[#457fb6] bg-[#457fb6]/5'
                    : 'border-gray-300 dark:border-gray-600 hover:border-[#457fb6]',
                ]"
              >
                <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileSelect" />
                <UIcon name="i-lucide-upload" class="w-7 h-7 mx-auto mb-1.5 text-gray-400" />
                <p v-if="!selectedFile" class="text-sm text-gray-500 dark:text-gray-400">
                  Klik atau drag file Excel ke sini (.xlsx, max 5MB)
                </p>
                <p v-else class="text-sm text-[#457fb6] font-medium">
                  {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between">
          <!-- Step 1 buttons -->
          <template v-if="step === 1">
            <button
              @click="close"
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              @click="goToStep2"
              :disabled="!canProceedStep1"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50"
            >
              Simpan Pengirim
            </button>
          </template>

          <!-- Step 2 buttons -->
          <template v-else>
            <div class="flex items-center gap-2">
              <button
                @click="step = 1"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Kembali
              </button>
              <button
                @click="close"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="downloadTemplate"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 dark:hover:bg-[#457fb6]/20 transition-colors"
              >
                <UIcon name="i-lucide-download" class="w-4 h-4 mr-1 inline" />
                Download Template
              </button>
              <button
                @click="submitUpload"
                :disabled="submitting || !canSubmitUpload"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50"
              >
                <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
                Submit Upload
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import { useMasterCache } from '~/composables/useMasterCache';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';

const props = defineProps<{
  modelValue: boolean;
  parentNaskahId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'success': [result: any];
}>();

const { saveConcept, uploadExcel, downloadTemplate } = useSdeMasal();
const { getKlasifikasiList } = useKlasifikasi();
const { klasifikasi: klasifikasiList } = useMasterCache();
const { apiGet } = useApi();
const { user } = useAuth();

const step = ref(1);
const submitting = ref(false);
const dragOver = ref(false);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const klasifikasiLoading = ref(false);
const senderLoading = ref(false);
const senderItems = ref<{ label: string; value: string; labelJob?: string; raw?: any }[]>([]);

const userPosition = computed(() => user.value?.position || user.value?.idPosition);

const concept = reactive({
  tanggalKonsep: new Date().toISOString().split('T')[0],
  klasifikasiId: '',
  klasifikasiName: '',
  pengirimId: '',
  pengirimName: '',
  parentNaskahId: props.parentNaskahId || '',
});

const upload = reactive({
  skemaTemplate: '',
  versiTemplate: '',
});

const canProceedStep1 = computed(() => {
  return !!(concept.tanggalKonsep && concept.klasifikasiId && concept.pengirimId);
});

const canSubmitUpload = computed(() => {
  return !!(upload.skemaTemplate && upload.versiTemplate && selectedFile.value);
});

const close = () => {
  emit('update:modelValue', false);
};

const resetState = () => {
  step.value = 1;
  concept.tanggalKonsep = new Date().toISOString().split('T')[0];
  concept.klasifikasiId = '';
  concept.klasifikasiName = '';
  concept.pengirimId = '';
  concept.pengirimName = '';
  upload.skemaTemplate = '';
  upload.versiTemplate = '';
  selectedFile.value = null;
};

const onKlasifikasiChange = () => {
  const k = klasifikasiList.value?.find((item: any) => item.id === concept.klasifikasiId);
  concept.klasifikasiName = k ? `${k.klasifikasi} - ${k.klasifikasi_text}` : '';
};

const onPengirimChange = () => {
  const s = senderItems.value.find((item) => item.value === concept.pengirimId);
  concept.pengirimName = s ? s.label : '';
};

const fetchSenderList = async (posId: string | number) => {
  senderLoading.value = true;
  try {
    const res: any = await apiGet(`/SDE/get-senders?pengirim=${posId}`);
    if (res?.success && Array.isArray(res.data)) {
      senderItems.value = res.data.map((r: any) => ({
        label: `${r.persnum_person_text} - ${r.position_text}`,
        labelJob: r.position_text,
        value: String(r.position),
        raw: r,
      }));
      if (senderItems.value.length === 1) {
        concept.pengirimId = senderItems.value[0].value;
        concept.pengirimName = senderItems.value[0].label;
      }
    }
  } catch (e) {
    console.error('Gagal memuat pengirim:', e);
  } finally {
    senderLoading.value = false;
  }
};

const goToStep2 = () => {
  if (!canProceedStep1.value) return;
  step.value = 2;
};

const onFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    validateAndSetFile(target.files[0]);
  }
};

const onDrop = (e: DragEvent) => {
  dragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    validateAndSetFile(e.dataTransfer.files[0]);
  }
};

const validateAndSetFile = (file: File) => {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    alert('File harus berformat .xlsx atau .xls');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('Ukuran file maksimal 5MB');
    return;
  }
  selectedFile.value = file;
};

const submitUpload = async () => {
  if (!canSubmitUpload.value) return;

  submitting.value = true;
  try {
    // 1. Simpan konsep
    const conceptData = await saveConcept({
      tanggalKonsep: concept.tanggalKonsep,
      klasifikasiId: concept.klasifikasiId,
      klasifikasiName: concept.klasifikasiName,
      pengirimId: concept.pengirimId,
      pengirimName: concept.pengirimName,
      parentNaskahId: concept.parentNaskahId || undefined,
    });

    if (!conceptData?.id) {
      alert('Gagal menyimpan konsep');
      return;
    }

    // 2. Upload Excel
    const result = await uploadExcel(
      selectedFile.value!,
      conceptData.id,
      upload.skemaTemplate,
      upload.versiTemplate,
    );

    if (result) {
      emit('success', result);
      alert(`Upload berhasil! Total: ${result.total}, Sukses: ${result.success}, Gagal: ${result.failed}`);
      close();
    }
  } catch (e) {
    console.error('Gagal upload:', e);
    alert('Gagal mengupload file');
  } finally {
    submitting.value = false;
  }
};

// Watch modal open to fetch data
watch(() => props.modelValue, (open) => {
  if (open) {
    resetState();
    // Fetch klasifikasi
    if (!klasifikasiList.value || klasifikasiList.value.length === 0) {
      klasifikasiLoading.value = true;
      getKlasifikasiList().finally(() => { klasifikasiLoading.value = false; });
    }
    // Fetch pengirim
    if (userPosition.value) {
      fetchSenderList(userPosition.value);
    }
  }
});
</script>