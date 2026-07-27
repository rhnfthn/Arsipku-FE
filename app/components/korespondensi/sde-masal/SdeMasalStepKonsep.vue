<template>
  <div class="flex-1 overflow-y-auto space-y-1">
    <!-- Tanggal Konsep Surat -->
    <TulisInputTanggal v-model="dateModel" label="Tanggal Konsep Surat" />

    <!-- Klasifikasi -->
    <TulisInputKlasifikasi v-model="klasifikasiModel" :items="klasifikasiList" :loading="klasifikasiStatus === 'loading'" />

    <!-- Klasifikasi loading/error info -->
    <div v-if="klasifikasiStatus === 'loading'" class="text-xs text-gray-400 -mt-1 pl-40">Memuat klasifikasi...</div>
    <div v-else-if="klasifikasiStatus === 'error'" class="text-xs text-red-500 -mt-1 pl-40">Gagal memuat klasifikasi</div>
    <div v-else-if="klasifikasiStatus === 'success' && klasifikasiList.length === 0" class="text-xs text-gray-400 -mt-1 pl-40">Belum ada data klasifikasi</div>

    <!-- Pengirim -->
    <TulisInputPengirim v-model="senderModel" label="Pengirim" placeholder="Pilih Pengirim" :items="senderItems" />

    <!-- Pengirim loading/error info -->
    <div v-if="senderLoading" class="text-xs text-gray-400 -mt-1 pl-40">Memuat daftar pengirim...</div>
    <div v-else-if="!senderLoading && senderItems.length === 0" class="text-xs text-gray-400 -mt-1 pl-40">Belum ada data pengirim</div>

    <!-- Sifat Surat (opsional) -->
    <TulisInputSifat v-model="sifatModel" />

    <!-- Perihal -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
      <div class="flex flex-col sm:flex-row sm:items-center w-full">
        <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
        <div class="flex items-center flex-1 w-full gap-2">
          <input
            type="text"
            v-model="perihalModel"
            :maxlength="maxPerihal"
            class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="Ketik Perihal Surat"
          />
          <span
            class="text-[10px] font-mono shrink-0 transition-colors"
            :class="(perihalModel || '').length >= maxPerihal ? 'text-red-500 font-bold' : 'text-gray-400'"
          >
            {{ (perihalModel || '').length }}/{{ maxPerihal }}
          </span>
        </div>
      </div>
    </div>

    <!-- Info Parent Naskah -->
    <div v-if="parentNaskahId" class="mt-4 p-3 bg-[#457fb6]/10 dark:bg-[#457fb6]/20 rounded-lg">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-link" class="w-4 h-4 text-[#457fb6]" />
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Naskah Induk</p>
          <p class="text-sm font-mono text-gray-700 dark:text-gray-300">{{ parentNaskahId }}</p>
        </div>
      </div>
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
}>();

const model = defineModel<SdeMasalConcept | null>({ default: null });

const { apiGet } = useApi();
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();

const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const senderItems = ref<any[]>([]);
const senderLoading = ref(false);
const maxPerihal = 200;

// --- Internal state ---
const today = new Date();
const dateModel = ref<CalendarDate>(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
);
const klasifikasiModel = ref<string | null>(null);
const senderModel = ref<any>(undefined);
const sifatModel = ref<string | null>('biasa');
const perihalModel = ref<string>('');

// --- Computed untuk konversi tanggal ---
const tanggalKonsepStr = computed(() => {
  if (!dateModel.value) return '';
  return `${dateModel.value.year}-${String(dateModel.value.month).padStart(2, '0')}-${String(dateModel.value.day).padStart(2, '0')}`;
});

const klasifikasiObj = computed(() => klasifikasiList.value.find((k: Klasifikasi) => k.id === klasifikasiModel.value));

// --- Sync ke model parent ---
watch(
  [dateModel, klasifikasiModel, senderModel, sifatModel, perihalModel],
  () => {
    model.value = {
      tanggalKonsep: tanggalKonsepStr.value,
      klasifikasiId: klasifikasiModel.value || '',
      klasifikasiName: klasifikasiObj.value
        ? `${klasifikasiObj.value.klasifikasi} - ${klasifikasiObj.value.klasifikasi_text}`
        : '',
      pengirimId: String(senderModel.value?.value || ''),
      pengirimName: senderModel.value?.label || '',
      sifat: sifatModel.value || 'biasa',
      perihal: perihalModel.value || '',
      parentNaskahId: props.parentNaskahId || undefined,
    };
  },
  { deep: true }
);

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
      senderItems.value = res.data.map((r: any) => ({
        label: `${r.persnum_person_text} - ${r.position_text}`,
        labelJob: r.position_text,
        value: String(r.position),
        raw: r,
      }));
      if (senderItems.value.length === 1 && !senderModel.value) {
        senderModel.value = senderItems.value[0];
      }
      return;
    }

    // Fallback: jika get-senders kosong, ambil semua managerial dari org-data
    // Gunakan tanggal kemarin sebagai fallback (data org mungkin belum di-generate untuk hari ini)
    const tglFallback = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const mgrRes = await apiGet<{ success: boolean; data: any[] }>(
      `/org-data/pengirim/managerial?tgl=${tglFallback}`
    );
    if (mgrRes?.success && Array.isArray(mgrRes.data)) {
      senderItems.value = mgrRes.data.map((r: any) => ({
        label: `${r.persnum_person_text} - ${r.position_text}`,
        labelJob: r.position_text,
        value: String(r.position),
        raw: r,
      }));
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
        senderItems.value = mgrRes.data.map((r: any) => ({
          label: `${r.persnum_person_text} - ${r.position_text}`,
          labelJob: r.position_text,
          value: String(r.position),
          raw: r,
        }));
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