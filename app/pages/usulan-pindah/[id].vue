<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Detail Usulan ${usulan?.nomorUsulan ?? ''}`" :items="items" />
      <NuxtLink to="/usulan-pindah" class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="usulan">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Info Usulan -->
        <div class="lg:col-span-2 space-y-5">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
              <span :class="statusBadge(usulan.status)">{{ statusLabel(usulan.status) }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ usulan.nomorUsulan }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Usulan</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(usulan.tanggalUsulan) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ usulan.sekretarisName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ usulan.atasanName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Arsip</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ usulan.arsipPerihal }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Aktif Habis</span>
                <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(usulan.tanggalRetensiAktifHabis) }}</p>
              </div>
              <div v-if="usulan.keterangan" class="col-span-2">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Keterangan</span>
                <p class="text-gray-900 dark:text-white text-sm mt-1">{{ usulan.keterangan }}</p>
              </div>
              <div v-if="usulan.rejectedNote" class="col-span-2">
                <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
                <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ usulan.rejectedNote }}</p>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Timeline Status</h3>
            <ol class="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-4">
              <li v-for="step in timelineSteps" :key="step.status" class="ml-6">
                <span :class="step.active ? 'bg-[#457fb6] ring-4 ring-[#457fb6]/20' : step.done ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'" class="absolute -left-[9px] w-4 h-4 rounded-full"></span>
                <p :class="step.active ? 'text-[#457fb6] font-semibold' : step.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'" class="text-sm">{{ step.label }}</p>
              </li>
            </ol>
          </div>
        </div>

        <!-- Aksi Sidebar -->
        <div class="space-y-5">
          <!-- Card Verifikasi Atasan -->
          <div v-if="usulan.status === 'MENUNGGU_VERIFIKASI_ATASAN'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Verifikasi Usulan</h3>
            <div class="space-y-3">
              <textarea v-model="verifyNote" rows="3" placeholder="Catatan verifikasi..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"></textarea>
              <div class="flex gap-2">
                <button @click="onApprove(false)" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50">
                  <UIcon name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui
                </button>
                <button @click="onReject" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
                  <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
                </button>
              </div>
            </div>
          </div>

          <!-- Card Verifikasi Terakhir -->
          <div v-if="usulan.status === 'MENUNGGU_VERIFIKASI_TERAKHIR'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Verifikasi Terakhir</h3>
            <div class="space-y-3">
              <textarea v-model="finalVerifyNote" rows="3" placeholder="Catatan verifikasi terakhir..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"></textarea>
              <div class="flex gap-2">
                <button @click="onFinalVerify" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50">
                  <UIcon name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui
                </button>
                <button @click="onRejectFinal" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
                  <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
                </button>
              </div>
            </div>
          </div>

          <!-- Card Kirim (Sekretaris) -->
          <div v-if="usulan.status === 'DRAFT' || usulan.status === 'DITOLAK_ATASAN'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Kirim Usulan</h3>
            <button @click="onSend" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50">
              <UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim ke Atasan
            </button>
          </div>

          <!-- Card Dispatch (setelah verifikasi terakhir) -->
          <div v-if="usulan.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Kirim Usulan</h3>
            <button @click="onDispatch" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50">
              <UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim
            </button>
          </div>

          <!-- Card Berkas Fisik -->
          <div v-if="usulan.status === 'DIKIRIM'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Checklist Berkas Fisik</h3>
            <div class="space-y-2">
              <label v-for="item in physicalChecklistItems" :key="item.key" class="flex items-center gap-2 cursor-pointer">
                <input v-model="checklist[item.key]" type="checkbox" class="w-4 h-4 text-[#457fb6] border-gray-300 rounded focus:ring-[#457fb6]" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</span>
              </label>
            </div>
            <button @click="onPreparePhysical" :disabled="actionLoading" class="w-full mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50">
              Berkas Fisik Sudah Siap
            </button>
          </div>

          <!-- Card Selesai -->
          <div v-if="usulan.status === 'BERKAS_FISIK_DIPERSIAPKAN'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Tandai Selesai</h3>
            <button @click="onComplete" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50">
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Selesai
            </button>
          </div>

          <!-- Card Berita Acara -->
          <div v-if="usulan.beritaAcaraUrl || ['DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'BERKAS_FISIK_DIPERSIAPKAN', 'SELESAI'].includes(usulan.status)" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Berita Acara Serah Terima</h3>
            <button v-if="!usulan.beritaAcaraUrl" @click="onGenerateBA" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50">
              <UIcon name="i-lucide-file-text" class="w-4 h-4 mr-1 inline" /> Generate Berita Acara
            </button>
            <div v-else class="space-y-2">
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ usulan.beritaAcaraNomor }}</p>
              <a :href="usulan.beritaAcaraUrl" target="_blank" class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 transition-colors">
                <UIcon name="i-lucide-download" class="w-4 h-4" /> Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUsulanPindah } from '~/composables/useUsulanPindah';
import type { UsulanPindah, UsulanPindahStatus } from '~/types/usulan-pindah';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const { fetchUsulanDetail, sendUsulan, approveUsulan, rejectUsulan, finalVerifyUsulan, dispatchUsulan, preparePhysical, completeUsulan, generateBeritaAcara } = useUsulanPindah();

const usulan = ref<UsulanPindah | null>(null);
const loading = ref(true);
const actionLoading = ref(false);

const verifyNote = ref('');
const finalVerifyNote = ref('');
const checklist = reactive<Record<string, boolean>>({});

const physicalChecklistItems = [
  { key: 'berkasAsli', label: 'Berkas arsip asli tersedia' },
  { key: 'beritaAcara', label: 'Berita acara serah terima' },
  { key: 'daftarIsi', label: 'Daftar isi berkas' },
  { key: 'lampiran', label: 'Lampiran pendukung' },
];

const items = computed(() => [
  { label: 'Beranda', to: '/' },
  { label: 'Usulan Pindah Arsip Inaktif', to: '/usulan-pindah' },
  { label: usulan.value?.nomorUsulan ?? 'Detail', to: `/usulan-pindah/${route.params.id}` },
]);

const timelineSteps = computed(() => {
  if (!usulan.value) return [];
  const status = usulan.value.status;
  const steps = [
    { status: 'DRAFT', label: 'Draft', done: false, active: false },
    { status: 'MENUNGGU_VERIFIKASI_ATASAN', label: 'Menunggu Verifikasi Atasan', done: false, active: false },
    { status: 'DISETUJUI_ATASAN', label: 'Disetujui Atasan', done: false, active: false },
    { status: 'MENUNGGU_VERIFIKASI_TERAKHIR', label: 'Menunggu Verifikasi Terakhir', done: false, active: false },
    { status: 'DISETUJUI_VERIFIKASI_TERAKHIR', label: 'Disetujui Verifikasi Terakhir', done: false, active: false },
    { status: 'DIKIRIM', label: 'Dikirim', done: false, active: false },
    { status: 'BERKAS_FISIK_DIPERSIAPKAN', label: 'Berkas Fisik Disiapkan', done: false, active: false },
    { status: 'SELESAI', label: 'Selesai', done: false, active: false },
  ];
  const order = ['DRAFT', 'MENUNGGU_VERIFIKASI_ATASAN', 'DISETUJUI_ATASAN', 'MENUNGGU_VERIFIKASI_TERAKHIR', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'BERKAS_FISIK_DIPERSIAPKAN', 'SELESAI'];
  const currentIdx = order.indexOf(status);
  return steps.map((s, i) => ({
    ...s,
    done: i < currentIdx,
    active: i === currentIdx,
  }));
});

const statusBadge = (status: UsulanPindahStatus) => {
  const map: Record<string, string> = {
    DRAFT: 'px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium',
    MENUNGGU_VERIFIKASI_ATASAN: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
    DITOLAK_ATASAN: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    DISETUJUI_ATASAN: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium',
    DIKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    BERKAS_FISIK_DIPERSIAPKAN: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    SELESAI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium',
  };
  return map[status] || map.DRAFT;
};

const statusLabel = (status: UsulanPindahStatus) => {
  const map: Record<string, string> = {
    DRAFT: 'Draft', MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Verifikasi', DITOLAK_ATASAN: 'Ditolak Atasan',
    DISETUJUI_ATASAN: 'Disetujui Atasan', MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi Terakhir',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir', DIKIRIM: 'Dikirim',
    BERKAS_FISIK_DIPERSIAPKAN: 'Berkas Disiapkan', SELESAI: 'Selesai',
  };
  return map[status] || status;
};

const formatDate = (d: string | Date | null) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const loadDetail = async () => {
  loading.value = true;
  try {
    usulan.value = await fetchUsulanDetail(route.params.id as string);
  } catch (e) {
    console.error('Gagal memuat detail:', e);
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  usulan.value = await fetchUsulanDetail(route.params.id as string);
};

const onSend = async () => {
  actionLoading.value = true;
  try { await sendUsulan(usulan.value!.id); await refresh(); } catch (e) { alert('Gagal mengirim usulan'); } finally { actionLoading.value = false; }
};

const onApprove = async (needFinal: boolean) => {
  actionLoading.value = true;
  try { await approveUsulan(usulan.value!.id, { verifyNote: verifyNote.value, needFinalVerification: needFinal }); await refresh(); } catch (e) { alert('Gagal menyetujui usulan'); } finally { actionLoading.value = false; }
};

const onReject = async () => {
  const note = prompt('Alasan penolakan?');
  if (!note) return;
  actionLoading.value = true;
  try { await rejectUsulan(usulan.value!.id, { rejectedNote: note }); await refresh(); } catch (e) { alert('Gagal menolak usulan'); } finally { actionLoading.value = false; }
};

const onRejectFinal = async () => {
  const note = prompt('Alasan penolakan verifikasi terakhir?');
  if (!note) return;
  actionLoading.value = true;
  try { await rejectUsulan(usulan.value!.id, { rejectedNote: note }); await refresh(); } catch (e) { alert('Gagal menolak usulan'); } finally { actionLoading.value = false; }
};

const onFinalVerify = async () => {
  actionLoading.value = true;
  try { await finalVerifyUsulan(usulan.value!.id, { finalVerifyNote: finalVerifyNote.value }); await refresh(); } catch (e) { alert('Gagal verifikasi terakhir'); } finally { actionLoading.value = false; }
};

const onDispatch = async () => {
  actionLoading.value = true;
  try { await dispatchUsulan(usulan.value!.id); await refresh(); } catch (e) { alert('Gagal mengirim usulan'); } finally { actionLoading.value = false; }
};

const onPreparePhysical = async () => {
  actionLoading.value = true;
  try { await preparePhysical(usulan.value!.id, { checklist: { ...checklist } }); await refresh(); } catch (e) { alert('Gagal menyiapkan berkas fisik'); } finally { actionLoading.value = false; }
};

const onComplete = async () => {
  actionLoading.value = true;
  try { await completeUsulan(usulan.value!.id); await refresh(); } catch (e) { alert('Gagal menyelesaikan usulan'); } finally { actionLoading.value = false; }
};

const onGenerateBA = async () => {
  actionLoading.value = true;
  try { await generateBeritaAcara(usulan.value!.id); await refresh(); } catch (e) { alert('Gagal generate berita acara'); } finally { actionLoading.value = false; }
};

onMounted(() => {
  loadDetail();
});
</script>