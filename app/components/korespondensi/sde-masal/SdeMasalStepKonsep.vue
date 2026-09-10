<template>
  <div class="flex-1 overflow-y-auto">
    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
      Konsep SDE Massal
    </h2>

    <!-- Section: Konsep Surat -->
    <div v-if="props.readonly" class="sde-masal-konsep-form space-y-1">
      <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
        <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
          Judul Folder<span class="text-red-500 ml-0.5">*</span>
        </span>
        <p class="relative flex-1 min-w-0 w-full text-sm text-gray-900 dark:text-white sm:ml-6 break-words">
          {{ judulModel || '-' }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 relative gap-1 sm:gap-0">
        <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
          Tanggal Konsep Surat<span class="text-red-500 ml-0.5">*</span>
        </span>
        <p class="relative flex-1 min-w-0 w-full text-sm text-gray-900 dark:text-white sm:ml-6">
          {{ tanggalKonsepDisplay || '-' }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
        <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
          Klasifikasi<span class="text-red-500 ml-0.5">*</span>
        </span>
        <p class="flex-1 min-w-0 w-full text-sm text-gray-900 dark:text-white sm:ml-6 break-words">
          {{ klasifikasiDisplay || '-' }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
        <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
          Pengirim<span class="text-red-500 ml-0.5">*</span>
        </span>
        <p class="flex-1 min-w-0 w-full text-sm text-gray-900 dark:text-white sm:ml-6 break-words">
          {{ senderDisplay || '-' }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
        <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
          Sifat<span class="text-red-500 ml-0.5">*</span>
        </span>
        <p class="flex-1 min-w-0 w-full text-sm text-gray-900 dark:text-white sm:ml-6 capitalize">
          {{ sifatDisplay || '-' }}
        </p>
      </div>
    </div>

    <div v-else class="sde-masal-konsep-form space-y-1">
      <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
        <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
          Judul Folder<span class="text-red-500 ml-0.5">*</span>
        </span>
        <div class="relative flex-1 min-w-0 w-full">
          <UInput
            v-model="judulModel"
            placeholder="Contoh: Tagihan PJNP Agustus 2026"
            maxlength="255"
            variant="none"
            class="w-full"
            :ui="{
              root: 'w-full min-w-0',
              base: '!bg-transparent !text-sm !px-0 !ring-0 !shadow-none w-full min-w-0',
            }"
          />
        </div>
      </div>

      <!-- Tanggal Konsep Surat -->
      <TulisInputTanggal
        v-model="dateModel"
        label="Tanggal Konsep Surat"
        display-format="DD/MM/YYYY"
        required
      />

      <!-- Klasifikasi -->
      <TulisInputKlasifikasi
        v-model="klasifikasiModel"
        :items="klasifikasiList"
        :loading="klasifikasiStatus === 'loading'"
        required
      />

      <!-- Klasifikasi loading/error info -->
      <div v-if="klasifikasiStatus === 'loading'" class="text-xs text-gray-400 -mt-1 pl-40">
        Memuat klasifikasi...
      </div>
      <div v-else-if="klasifikasiStatus === 'error'" class="text-xs text-red-500 -mt-1 pl-40">
        Gagal memuat klasifikasi
      </div>
      <div
        v-else-if="klasifikasiStatus === 'success' && klasifikasiList.length === 0"
        class="text-xs text-gray-400 -mt-1 pl-40"
      >
        Belum ada data klasifikasi
      </div>

      <!-- Pengirim -->
      <TulisInputPengirim
        v-model="senderModel"
        label="Pengirim"
        placeholder="Pilih Pengirim"
        :items="senderItems"
        required
      />

      <!-- Sifat Surat -->
      <TulisInputSifat v-model="sifatModel" required />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import type { Klasifikasi } from '~/types/klasifikasi';
import type { SdeMasalConcept } from '~/types/sde-masal';

const props = defineProps<{
  parentNaskahId?: string;
  readonly?: boolean;
}>();

const model = defineModel<SdeMasalConcept | null>({ default: null });

const { apiGet } = useApi();
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();

const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const senderItems = ref<any[]>([]);
const senderLoading = ref(false);

const setSenderItems = (rows: any[]) => {
  senderItems.value = rows.map((r: any) => ({
    label: `${r.persnum_person_text} - ${r.position_text}`,
    labelJob: r.position_text,
    value: String(r.position),
    raw: r,
  }));

  // Pengirim sengaja tetap kosong saat form dibuka agar user memilih manual.
};

// --- Internal state ---
const today = new Date();
const dateModel = ref<CalendarDate>(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
);
const klasifikasiModel = ref<string | null>(null);
const senderModel = ref<any>(undefined);
const sifatModel = ref<string | null>('biasa');
const judulModel = ref('');
const restoredFromDraft = ref(false);

const restoreDraftForm = () => {
  if (restoredFromDraft.value || !model.value) return;
  const saved = model.value;
  if (saved.tanggalKonsep) {
    const [year, month, day] = saved.tanggalKonsep.split('-').map(Number);
    if (year && month && day) dateModel.value = new CalendarDate(year, month, day);
  }
  klasifikasiModel.value = saved.klasifikasiId || null;
  senderModel.value = saved.pengirimId
    ? { value: saved.pengirimId, label: saved.pengirimName }
    : undefined;
  sifatModel.value = saved.sifat || 'biasa';
  judulModel.value = saved.judul || '';
  restoredFromDraft.value = true;
};

// --- Computed untuk konversi tanggal ---
const tanggalKonsepStr = computed(() => {
  if (!dateModel.value) return '';
  return `${dateModel.value.year}-${String(dateModel.value.month).padStart(2, '0')}-${String(dateModel.value.day).padStart(2, '0')}`;
});

const tanggalKonsepDisplay = computed(() => {
  if (!dateModel.value) return '';
  return `${String(dateModel.value.day).padStart(2, '0')}/${String(dateModel.value.month).padStart(2, '0')}/${dateModel.value.year}`;
});

const klasifikasiObj = computed(() =>
  klasifikasiList.value.find(
    (k: Klasifikasi) =>
      k.id === klasifikasiModel.value || k.klasifikasi === klasifikasiModel.value
  )
);

const klasifikasiDisplay = computed(() =>
  klasifikasiObj.value
    ? `${klasifikasiObj.value.klasifikasi} - ${klasifikasiObj.value.klasifikasi_text}`
    : model.value?.klasifikasiName || klasifikasiModel.value || ''
);

const senderDisplay = computed(() => senderModel.value?.label || model.value?.pengirimName || '');

const sifatDisplay = computed(() => {
  const value = sifatModel.value || model.value?.sifat || '';
  if (value === 'biasa') return 'Biasa / Terbuka';
  return value.replaceAll('_', ' ');
});

// --- Sync ke model parent ---
// klasifikasiList ikut di-watch: saat daftar klasifikasi selesai dimuat,
// klasifikasiName harus di-update ulang (jangan sampai kosong/"-").
watch(
  [dateModel, klasifikasiModel, senderModel, sifatModel, judulModel, klasifikasiList],
  () => {
    const parentNaskahId = props.parentNaskahId || model.value?.parentNaskahId;
    model.value = {
      judul: judulModel.value.trim(),
      tanggalKonsep: tanggalKonsepStr.value,
      klasifikasiId: klasifikasiModel.value || '',
      klasifikasiName: klasifikasiObj.value
        ? `${klasifikasiObj.value.klasifikasi} - ${klasifikasiObj.value.klasifikasi_text}`
        : '',
      pengirimId: String(senderModel.value?.value || ''),
      pengirimName: senderModel.value?.label || '',
      sifat: sifatModel.value || 'biasa',
      parentNaskahId: parentNaskahId || undefined,
    };
  },
  { deep: true }
);

watch(model, restoreDraftForm, { immediate: true, deep: true });

// --- Fetch pengirim (dengan fallback ke managerial) ---
const fetchSenderList = async (posId: string | number) => {
  senderLoading.value = true;
  try {
    // Coba endpoint SDE get-senders (hanya BOD/BOD-1)
    // Gunakan tanggal kemarin sebagai fallback (data org mungkin belum di-generate untuk hari ini)
    const tglParam = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const res = await apiGet<{ success: boolean; data: any[] }>(
      `/SDE/get-senders?pengirim=${posId}&tgl=${tglParam}`
    );
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      setSenderItems(res.data);
      return;
    }

    // Fallback: jika get-senders kosong, ambil semua managerial dari org-data
    // Gunakan tanggal kemarin sebagai fallback (data org mungkin belum di-generate untuk hari ini)
    const tglFallback = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const mgrRes = await apiGet<{ success: boolean; data: any[] }>(
      `/org-data/pengirim/managerial?tgl=${tglFallback}`
    );
    if (mgrRes?.success && Array.isArray(mgrRes.data)) {
      setSenderItems(mgrRes.data);
    } else {
      senderItems.value = [];
    }
  } catch (e) {
    console.error('Gagal memuat list pengirim via SDE/get-senders:', e);
    // Fallback: coba managerial endpoint jika get-senders gagal
    try {
      const tglFallback = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const mgrRes = await apiGet<{ success: boolean; data: any[] }>(
        `/org-data/pengirim/managerial?tgl=${tglFallback}`
      );
      if (mgrRes?.success && Array.isArray(mgrRes.data)) {
        setSenderItems(mgrRes.data);
      } else {
        senderItems.value = [];
      }
    } catch (e2) {
      console.error('Gagal memuat managerial fallback:', e2);
      senderItems.value = [];
    }
  } finally {
    senderLoading.value = false;
  }
};

onMounted(async () => {
  // Load user profile jika belum ada
  if (!user.value) await getProfile();

  // Load klasifikasi (getKlasifikasi mengembalikan array langsung dari response.data.data)
  klasifikasiStatus.value = 'loading';
  try {
    const klasRes = await getKlasifikasi();
    klasifikasiList.value = klasRes || [];
    klasifikasiStatus.value = 'success';
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e);
    klasifikasiStatus.value = 'error';
    klasifikasiList.value = [];
  }

  // Fetch pengirim berdasarkan position user
  const posId = user.value?.position;
  if (posId) {
    await fetchSenderList(posId);
  }
});
</script>

<style scoped>
@media (min-width: 640px) {
  :deep(.sde-masal-konsep-form > div > span) {
    white-space: nowrap;
  }

  :deep(.sde-masal-konsep-form > div > div:last-child) {
    margin-left: 1.5rem;
  }
}
</style>
