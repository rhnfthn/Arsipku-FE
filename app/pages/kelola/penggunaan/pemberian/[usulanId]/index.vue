<script setup lang="ts">
// Detail timeline — alur lengkap dari usulan sampai akses diberikan
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ChevronLeft, FileText, Building2, User, Clock, Key, CheckCircle2, XCircle, AlertTriangle, Users, Paperclip } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { Keputusan } from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Detail Pemberian Akses Berkas' });

const route = useRoute();
const { t } = useI18n();
const { usulanDetail, pending, fetchDetail } = useUsulanAksesBerkas();
const toast = useToast();

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

const usulanId = computed(() => route.params.usulanId as string);

const breadcrumbs = computed(() => [
  { label: 'Kelola', to: '#' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Pemberian', to: '/kelola/penggunaan/pemberian' },
  { label: usulanDetail.value?.nomorUsulan || 'Detail', to: '#' },
]);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const loadDetail = async () => {
  try {
    await fetchDetail(usulanId.value);
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  }
};

onMounted(() => { loadDetail(); });

// ── Progress & Status helpers (sinkron dengan tabel pemberian) ──
const getProgressPercent = (detail: any): number => {
  if (!detail?.tanggalMulai || !detail?.tanggalSelesai) return 0;
  const mulai = new Date(detail.tanggalMulai).getTime();
  const selesai = new Date(detail.tanggalSelesai).getTime();
  const now = Date.now();
  if (now <= mulai) return 0;
  if (now >= selesai) return 100;
  return Math.round(((now - mulai) / (selesai - mulai)) * 100);
};

const getProgressBarClass = (percent: number): string => {
  if (percent < 50) return 'bg-green-500';
  if (percent < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getProgressLabel = (detail: any): string => {
  if (!detail?.tanggalSelesai) return '-';
  const sisa = Math.ceil((new Date(detail.tanggalSelesai).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (sisa <= 0) return 'Habis';
  return `${sisa} hari`;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {{ usulanDetail?.nomorUsulan || 'Detail Pemberian' }}
          </h1>
          <UsulanAksesBerkasBadge v-if="usulanDetail" :status="usulanDetail.status" />
        </div>
      </template>
    </PageHeader>

    <button @click="navigateTo('/kelola/penggunaan/pemberian')"
      class="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
      <ChevronLeft class="size-4" /> Kembali
    </button>

    <div v-if="pending && !usulanDetail" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <main v-else-if="usulanDetail" class="mx-auto max-w-4xl space-y-5">
      <!-- Informasi Usulan -->
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <FileText class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Pemberian</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Detail usulan peminjaman akses berkas.</p>
          </div>
        </div>
        <dl class="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><User class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Pengusul</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.pengusulInfo?.nama || usulanDetail.pengusulPersnum }}</dd></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><Building2 class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Divisi Pemberi</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.divisiPemberiNama || usulanDetail.divisiPemberiId }}</dd></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><Building2 class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Divisi Pengusul</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.divisiPengusulNama || usulanDetail.divisiPengusulId }}</dd></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><Key class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Jenis Akses</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.jenisAkses?.join(', ') }}</dd></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><FileText class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Judul Usulan</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.judulUsulan || '-' }}</dd></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><FileText class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Jenis Berkas</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.jenisBerkas === 'AKTIF' ? 'Aktif' : 'Inaktif' }}</dd></div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700/50"><Clock class="size-4 text-gray-500" /></span>
            <div><dt class="text-xs font-medium uppercase text-gray-500">Periode Akses</dt><dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(usulanDetail.tanggalMulai) }} — {{ formatDate(usulanDetail.tanggalSelesai) }}</dd></div>
          </div>
        </dl>
        <div class="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <p class="mb-1 text-xs font-medium uppercase text-gray-500">Tujuan Akses</p>
          <p class="text-sm text-gray-800 dark:text-gray-200">{{ usulanDetail.tujuanAkses }}</p>
        </div>
        <!-- Penerima Akses Tambahan (jika ada) -->
        <div v-if="usulanDetail.penerimaAksesTambahan?.length" class="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <p class="mb-2 text-xs font-medium uppercase text-gray-500">Penerima Akses Tambahan</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="p in usulanDetail.penerimaAksesTambahan"
              :key="p.persnum"
              class="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-200 text-[9px] font-semibold text-primary-700 dark:bg-primary-800 dark:text-primary-300">
                {{ (p.nama || String(p.persnum)).charAt(0).toUpperCase() }}
              </span>
              <span>{{ p.nama || `Persnum ${p.persnum}` }}</span>
              <span v-if="p.jabatan" class="text-[10px] text-primary-400 dark:text-primary-500">· {{ p.jabatan }}</span>
            </span>
          </div>
        </div>
      </section>

      <!-- Progress & Status (sinkron dengan tabel pemberian) -->
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <Clock class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Progress & Status</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Sisa waktu akses berkas.</p>
          </div>
        </div>
        <div class="px-5 py-5">
          <div class="flex items-center gap-3">
            <div class="h-2.5 w-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getProgressBarClass(getProgressPercent(usulanDetail))"
                :style="{ width: `${getProgressPercent(usulanDetail)}%` }"
              />
            </div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ getProgressLabel(usulanDetail) }}</span>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              :class="getProgressPercent(usulanDetail) >= 100
                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
            >
              {{ getProgressPercent(usulanDetail) >= 100 ? 'Habis' : 'Aktif' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Verifikator Pengusul & Pemberi -->
      <section v-if="usulanDetail.verifikatorPengusul?.length || usulanDetail.verifikatorPemberi?.length" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <Users class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Verifikator</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Jenjang yang memverifikasi usulan ini.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          <!-- Verifikator Pengusul -->
          <div v-if="usulanDetail.verifikatorPengusul?.length">
            <p class="mb-2 text-xs font-medium uppercase text-gray-500">Verifikator Pengusul</p>
            <div class="space-y-2">
              <div v-for="v in usulanDetail.verifikatorPengusul" :key="v.persnum" class="flex items-center gap-2">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                  {{ (v.nama || String(v.persnum)).charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ v.nama || `Persnum ${v.persnum}` }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">{{ v.jabatan || v.levelJabatan }}<span v-if="v.divisiNama"> · {{ v.divisiNama }}</span></p>
                </div>
              </div>
            </div>
          </div>
          <!-- Verifikator Pemberi -->
          <div v-if="usulanDetail.verifikatorPemberi?.length">
            <p class="mb-2 text-xs font-medium uppercase text-gray-500">Verifikator Pemberi</p>
            <div class="space-y-2">
              <div v-for="v in usulanDetail.verifikatorPemberi" :key="v.persnum" class="flex items-center gap-2">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                  {{ (v.nama || String(v.persnum)).charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ v.nama || `Persnum ${v.persnum}` }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">{{ v.jabatan || v.levelJabatan }}<span v-if="v.divisiNama"> · {{ v.divisiNama }}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Berkas Dipilih -->
      <section v-if="usulanDetail.selectedBerkas?.length" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <Paperclip class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Berkas Dipilih</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Berkas yang dipilih oleh Sekretaris pemberi.</p>
          </div>
          <span class="ml-auto text-xs text-gray-400">{{ usulanDetail.selectedBerkas.length }} berkas</span>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          <div v-for="b in usulanDetail.selectedBerkas" :key="b.id" class="flex items-start gap-3 px-4 py-2.5">
            <UIcon name="i-lucide-file" class="mt-0.5 size-4 shrink-0 text-gray-400" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ b.judulBerkas || b.berkasId }}</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">
                <span v-if="b.kodeBerkas">{{ b.kodeBerkas }}</span>
                <span v-if="b.klasifikasiTeks"> · {{ b.klasifikasiTeks }}</span>
                <span v-if="b.berkasStatus"> · {{ b.berkasStatus }}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Timeline Verifikasi -->
      <section v-if="usulanDetail.steps?.length" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Alur Verifikasi</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Riwayat dari usulan sampai akses diberikan.</p>
          </div>
        </div>
        <div class="space-y-4 px-5 py-5">
          <div v-for="step in usulanDetail.steps" :key="step.id" class="flex gap-3">
            <div class="flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-full"
                :class="{ 'bg-green-100 dark:bg-green-900/30': step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT, 'bg-red-100 dark:bg-red-900/30': step.keputusan === Keputusan.TOLAK, 'bg-orange-100 dark:bg-orange-900/30': step.keputusan === Keputusan.REVISI }">
                <CheckCircle2 v-if="step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT" class="size-5 text-green-600 dark:text-green-400" />
                <XCircle v-else-if="step.keputusan === Keputusan.TOLAK" class="size-5 text-red-600 dark:text-red-400" />
                <AlertTriangle v-else class="size-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div class="flex-1 border-l-2 border-gray-100 pb-4 pl-4 dark:border-gray-700">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ step.roleTahap }}</span>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{ 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT, 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': step.keputusan === Keputusan.TOLAK, 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': step.keputusan === Keputusan.REVISI }">
                  {{ step.keputusan }}
                </span>
              </div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ step.verifierNama || `Persnum ${step.verifierPersnum}` }}<span v-if="step.verifierJabatan"> · {{ step.verifierJabatan }}</span> · {{ formatDate(step.verifiedAt) }}
              </div>
              <div v-if="step.catatan" class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ step.catatan }}</div>
              <div v-if="step.catatanRevisi" class="mt-1 text-sm text-orange-600 dark:text-orange-400">Revisi: {{ step.catatanRevisi }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA: Lihat Berkas -->
      <div class="flex justify-center">
        <NuxtLink :to="`/kelola/penggunaan/pemberian/${usulanId}/berkas`"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
          <FileText class="size-4" /> Lihat Berkas yang Diberikan
        </NuxtLink>
      </div>
    </main>
  </div>
</template>