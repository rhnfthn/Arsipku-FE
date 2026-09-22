<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="folder?.judul || 'Folder SDE Massal'" :items="breadcrumbs" />
      <NuxtLink
        to="/korespondensi/sde-masal"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="folder">
      <div class="space-y-5">
      <!-- Informasi Folder -->
      <div class="min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Informasi Folder</h3>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Judul Folder</span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">{{ folder.judul || '-' }}</p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Tanggal</span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">{{ formatDate(folder.tanggal || folder.createdAt) }}</p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Klasifikasi</span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">
              {{ folder.klasifikasi || '-' }}<span v-if="folder.klasifikasiText"> · {{ folder.klasifikasiText }}</span>
            </p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Pengirim</span>
            <p class="w-full truncate text-sm text-gray-900 dark:text-white sm:ml-6">{{ folder.pengirimName || '-' }}</p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Sifat</span>
            <p class="w-full text-sm capitalize text-gray-900 dark:text-white sm:ml-6">{{ folder.sifat || 'biasa' }}</p>
          </div>
        </div>
      </div>

      <!-- Verifikator -->
      <div class="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Verifikator</h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ verifikatorList.length }} orang</span>
          </div>
          <div v-if="verifikatorList.length" class="space-y-2">
            <div
              v-for="verifikator in verifikatorList"
              :key="`${verifikator.urutan}-${verifikator.persnum}-${verifikator.position}`"
              class="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-900/40"
            >
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {{ verifikator.urutan }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white" :title="verifikator.nama">
                  {{ verifikator.nama || '-' }}
                </p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400" :title="verifikator.jabatan">
                  {{ verifikator.jabatan || verifikator.position || '-' }}
                </p>
              </div>
              <span :class="verifikatorStatusBadge(verifikator.status)">
                {{ verifikatorStatusLabel(verifikator.status) }}
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 dark:text-gray-500">Belum ada verifikator.</p>
      </div>

      <!-- Timeline Riwayat -->
      <div class="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h3>
        <div v-if="timelineSteps.length === 0" class="text-sm text-gray-400">
          Belum ada riwayat.
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="(step, idx) in timelineSteps"
            :key="idx"
            class="flex gap-3"
            :class="idx < timelineSteps.length - 1 ? 'pb-4' : ''"
          >
            <div class="flex flex-col items-center">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                :class="step.dotClass"
              >
                <UIcon v-if="step.icon === 'check'" name="i-lucide-check" class="size-4" />
                <UIcon v-else-if="step.icon === 'x'" name="i-lucide-x" class="size-4" />
                <span v-else>{{ step.number }}</span>
              </div>
              <div
                v-if="idx < timelineSteps.length - 1"
                class="mt-1 w-0.5 flex-1"
                :class="step.done ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium" :class="step.textClass">{{ step.label }}</p>
              <p class="mt-0.5 text-xs" :class="step.descClass">{{ step.desc }}</p>
              <p v-if="step.date" class="mt-0.5 text-xs" :class="step.dateClass">{{ step.date }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Daftar Naskah -->
      <div class="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Naskah</h3>
          <p v-if="isSignerAwaiting" class="text-xs text-gray-500 dark:text-gray-400">
            Total {{ items.length }} · Siap dikirim {{ eligibleItems.length }} · Ditolak {{ rejectedItems.length }} · Terkirim {{ sentItems.length }}
          </p>
        </div>
        <EmptyState
          v-if="items.length === 0"
          icon="i-lucide-file-x"
          title="Belum ada naskah"
          description="Naskah akan tampil setelah data penerima diproses."
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-primary text-left text-white dark:bg-primary-700">
              <tr>
                <th v-if="isSignerAwaiting" class="w-12 px-4 py-3 text-center font-semibold whitespace-nowrap">
                  <UCheckbox
                    color="primary"
                    :model-value="allEligibleSelected"
                    @update:model-value="toggleAllEligible"
                  />
                </th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Nomor</th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Perihal</th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Penerima</th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">Email</th>
                <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Status</th>
                <th v-if="!isFolderCompleted" class="px-4 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in items"
                :key="item.id"
                class="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td v-if="isSignerAwaiting" class="px-4 py-2.5 text-center">
                  <UCheckbox
                    color="primary"
                    :model-value="selectedItemIds.includes(item.id)"
                    :disabled="!isEligibleItem(item)"
                    @update:model-value="toggleItem(item)"
                  />
                </td>
                <td class="px-4 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-300">{{ item.nomor || '-' }}</td>
                <td class="max-w-xs px-4 py-2.5">
                  <p class="truncate text-xs font-medium text-gray-700 dark:text-gray-200" :title="item.perihal || ''">
                    {{ item.perihal || '-' }}
                  </p>
                </td>
                <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate" :title="item.penerima || ''">
                  {{ item.penerima || '-' }}
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300">
                    <span v-if="item.emailTertuju" class="truncate" :title="item.emailTertuju">
                      <span class="text-gray-400 dark:text-gray-500">To:</span> {{ item.emailTertuju }}
                    </span>
                    <span v-if="item.emailCc" class="truncate" :title="item.emailCc">
                      <span class="text-gray-400 dark:text-gray-500">CC:</span> {{ item.emailCc }}
                    </span>
                    <span v-if="item.emailBcc" class="truncate" :title="item.emailBcc">
                      <span class="text-gray-400 dark:text-gray-500">BCC:</span> {{ item.emailBcc }}
                    </span>
                    <span v-if="!item.emailTertuju && !item.emailCc && !item.emailBcc" class="text-gray-300 dark:text-gray-600">-</span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span :class="naskahStatusBadge(item.status)">{{ naskahStatusLabel(item.status) }}</span>
                </td>
                <td v-if="!isFolderCompleted" class="px-4 py-2.5">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                      title="Lihat preview surat"
                      @click="openPreview(item)"
                    >
                      <UIcon name="i-lucide-eye" class="size-4" />
                    </button>
                    <button
                      v-if="item.finalPdf"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                      title="Download PDF"
                      @click="downloadPdf(item)"
                    >
                      <UIcon name="i-lucide-download" class="size-4" />
                    </button>
                    <button
                      v-if="isGagal(item.status) && isSignerAwaiting"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      :disabled="retryingId === item.id"
                      :title="retryingId === item.id ? 'Sedang mengirim ulang…' : 'Kirim ulang'"
                      @click="retryItem(item)"
                    >
                      <UIcon
                        :name="retryingId === item.id ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
                        class="size-4"
                        :class="{ 'animate-spin': retryingId === item.id }"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Aksi workflow selalu berada setelah Daftar Naskah. -->
      <div v-if="isVerifierAwaiting || isSignerAwaiting" class="flex flex-wrap justify-start gap-2">
        <template v-if="isVerifierAwaiting && !isBodVerifier">
          <!-- Verifikator non-BOD: read-only, hanya memantau chain -->
          <div class="flex w-full items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <UIcon name="i-lucide-eye" class="size-5 shrink-0" />
            <span>
              Anda terdaftar dalam chain verifikasi ini, namun hanya BOD (Direksi) yang dapat
              menyetujui atau menolak. Anda dapat memantau proses verifikasi secara read-only.
            </span>
          </div>
        </template>
        <template v-else>
          <UButton
            label="Tolak Folder"
            icon="i-lucide-x-circle"
            color="error"
            variant="solid"
            :loading="workflowLoading"
            @click="openRejectModal"
          />
          <UButton
            v-if="isVerifierAwaiting"
            label="Setujui Folder"
            icon="i-lucide-check-circle"
            color="primary"
            :loading="workflowLoading"
            @click="showApproveConfirm = true"
          />
          <UButton
            v-else-if="isSignerAwaiting"
            label="Finalisasi"
            icon="i-lucide-send"
            color="primary"
            :disabled="eligibleItems.length === 0"
            :loading="workflowLoading"
            @click="openFinalizeAll"
          />
        </template>
      </div>

      </div>
    </template>

    <UModal
      v-model:open="showApproveConfirm"
      title="Setujui Folder SDE Massal?"
      :ui="{ overlay: 'bg-black/40 backdrop-blur-[2px]' }"
    >
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Seluruh item dalam folder akan diteruskan ke verifikator berikutnya atau ke Pengirim.
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Batal"
            color="neutral"
            variant="outline"
            :disabled="workflowLoading"
            @click="showApproveConfirm = false"
          />
          <UButton
            label="Setujui Folder"
            icon="i-lucide-check-circle"
            color="primary"
            :loading="workflowLoading"
            @click="approveCurrentFolder"
          />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showSendConfirm"
      title="Kirim Surat SDE Massal?"
      :ui="{ overlay: 'bg-black/40 backdrop-blur-[2px]' }"
    >
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Sebanyak {{ selectedItemIds.length }} surat yang sudah disetujui akan diproses.
          Surat yang sudah terkirim atau ditolak tidak diproses ulang.
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Batal"
            color="neutral"
            variant="outline"
            :disabled="workflowLoading"
            @click="showSendConfirm = false"
          />
          <UButton
            label="Kirim Surat"
            icon="i-lucide-send"
            color="primary"
            :loading="workflowLoading"
            @click="openSendPreview"
          />
        </div>
      </template>
    </UModal>

    <!-- Gunakan modal pilihan tanda tangan yang sama dengan SDE biasa. -->
    <TulisDigsigPassphraseModal
      v-model:open="isPassphraseModalOpen"
      :signer-info="signerInfo"
      :is-loading="workflowLoading"
      :hide-bsre="bsreDisabled"
      :hide-qr="qrDisabled"
      :hide-basah="basahDisabled"
      ref="signMethodModalRef"
      @submit="handleSignMethodSubmit"
    />

    <UModal
      v-model:open="showRejectModal"
      title="Tolak Folder SDE Massal"
      :ui="{ overlay: 'bg-black/40 backdrop-blur-[2px]' }"
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-300">Berikan alasan penolakan agar konseptor dapat memperbaiki folder.</p>
          <textarea
            v-model="rejectReason"
            rows="4"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Tulis alasan penolakan..."
          />
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="neutral" variant="outline" :disabled="workflowLoading" @click="showRejectModal = false" />
          <UButton label="Tolak Folder" color="error" :loading="workflowLoading" :disabled="!rejectReason.trim()" @click="submitVerificationReject" />
        </div>
      </template>
    </UModal>

    <!-- Preview Full-screen PDF (native PDF viewer browser, seragam dengan wizard) -->
    <Teleport to="body">
      <div
        v-if="showPreview"
        class="fixed inset-0 z-[10] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div
          class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Preview Surat — Penerima {{ previewPosition + 1 }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewPreviousDisabled || isLoadingPdf"
              @click="gotoPreviewPrevious"
            />
            <span class="min-w-14 text-center text-xs text-gray-500 dark:text-gray-400"
              >{{ previewPosition + 1 }} / {{ previewTotal }}</span
            >
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewNextDisabled || isLoadingPdf"
              @click="gotoPreviewNext"
            />
            <div class="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Tutup"
              @click="closePreview"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <!-- PDF Content (iframe → native PDF viewer browser) -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <div v-if="isLoadingPdf" class="absolute inset-0 flex items-center justify-center z-10">
            <div
              class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg"
            >
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Memuat dokumen…</p>
            </div>
          </div>
          <iframe v-if="pdfUrl" :key="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
          <div
            v-else-if="pdfError"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-300" />
            <span class="text-sm text-red-500">{{ pdfError }}</span>
          </div>
          <div
            v-else-if="!isLoadingPdf"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">PDF tidak tersedia.</span>
          </div>
        </div>
        <div v-if="sendPreviewFlow" class="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <UButton
            label="Draft"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-document-text"
            @click="closePreview"
          />
          <UButton
            label="Kirim"
            color="primary"
            size="lg"
            icon="i-heroicons-paper-airplane"
            class="font-bold"
            type="button"
            @click.stop="continueToSignature"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { SdeMasalFolder, SdeMasalFolderItem, SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useAuth } from '~/composables/useAuth';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import {
  renderSdeMasalKonten,
  setTertujuEksternalLookup,
  setInternalPositionLookup,
} from '~/utils/sde-masal-render';
import TulisDigsigPassphraseModal from '@/components/Tulis/DigsigPassphraseModal.vue';
import { useFeatureAccess } from '~/composables/useFeatureAccess';

// Akses detail ditentukan backend berdasarkan creator, verifikator aktif,
// atau pengirim akhir; staff perlu dapat membuka folder disposisinya.
definePageMeta({ middleware: ['auth'] });
const route = useRoute();
const { canAccessPage } = useFeatureAccess();
const { api, apiGet } = useApi();
const {
  findNaskahInFolder,
  finalizeDirect,
  rejectFolder,
  approveFolderVerification,
  rejectFolderVerification,
} = useSdeMasal();
const { getConfigDigsig } = useDigsig();
const { user } = useAuth();
const { markSdeMasalFolderNotificationsAsRead } = useNotifications();
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();
const folder = ref<SdeMasalFolder | null>(null);
const items = ref<SdeMasalFolderItem[]>([]);
const workflowLoading = ref(false);
const selectedItemIds = ref<string[]>([]);
const showApproveConfirm = ref(false);
const showSendConfirm = ref(false);
const showRejectModal = ref(false);
const rejectReason = ref('');
const isPassphraseModalOpen = ref(false);
const signMethodModalRef = ref<any>(null);
const bsreDisabled = ref(true);
const qrDisabled = ref(true);
const basahDisabled = ref(true);
const selectedSendType = ref<'digsig' | 'qr_only' | 'ttd_basah'>('qr_only');
const isFolderCompleted = computed(
  () =>
    folder.value?.status === 'TERKIRIM' ||
    (items.value.length > 0 && items.value.every((item) => item.statusVerifikasi === 'TERKIRIM')),
);
const isSignerAwaiting = computed(
  () =>
    !!folder.value &&
    ['MENUNGGU_PENGIRIM', 'SEBAGIAN_TERKIRIM'].includes(folder.value.status) &&
    !isFolderCompleted.value &&
    String(user.value?.position || user.value?.position_id || '') === String(folder.value.pengirimId || ''),
);
const currentPersnum = computed(() => String(user.value?.persnum || '').trim());
const currentPosition = computed(() => String(user.value?.position || user.value?.position_id || '').trim());
const isFolderCreator = computed(
  () =>
    !!folder.value &&
    !!currentPosition.value &&
    String(folder.value.createdBy || '') === currentPosition.value,
);
const isVerifierAwaiting = computed(() => {
  if (!folder.value || folder.value.status !== 'MENUNGGU_VERIFIKASI') return false;
  return items.value.some((item) =>
    (item.verifikators || []).some(
      (verifikator) =>
        verifikator.status === 'waiting' &&
        ((currentPersnum.value && String(verifikator.persnum) === currentPersnum.value) ||
          (currentPosition.value && String(verifikator.position) === currentPosition.value)),
    ),
  );
});
// Hanya BOD (Direksi) yang dapat menyetujui/menolak verifikasi.
// Verifikator non-BOD hanya dapat membaca chain (read-only).
const isBodVerifier = computed(() => {
  const bodTag = String(user.value?.bodTag ?? '').trim().toUpperCase();
  if (['BOD', 'BOD-0', 'BOD-1', 'BOD-2', 'BOD-3'].includes(bodTag)) return true;
  const positionText = String(user.value?.positionText ?? '').toUpperCase();
  return /\bDIREKTUR\b|\bDIRUT\b|\bDIRECTOR\b/.test(positionText);
});
const isEligibleItem = (item: SdeMasalFolderItem) =>
  ['TERVERIFIKASI', 'GAGAL'].includes(item.statusVerifikasi || '') && !item.naskahId;
const eligibleItems = computed(() => items.value.filter(isEligibleItem));
const rejectedItems = computed(() => items.value.filter((item) => item.statusVerifikasi === 'DITOLAK'));
const sentItems = computed(() => items.value.filter((item) => item.statusVerifikasi === 'TERKIRIM'));
const allEligibleSelected = computed(
  () => eligibleItems.value.length > 0 && eligibleItems.value.every((item) => selectedItemIds.value.includes(item.id)),
);

const toggleItem = (item: SdeMasalFolderItem) => {
  if (!isEligibleItem(item)) return;
  const index = selectedItemIds.value.indexOf(item.id);
  if (index >= 0) selectedItemIds.value.splice(index, 1);
  else selectedItemIds.value.push(item.id);
};
const toggleAllEligible = (checked: boolean | 'indeterminate') => {
  selectedItemIds.value = checked === true ? eligibleItems.value.map((item) => item.id) : [];
};

const approveCurrentFolder = async () => {
  if (!folder.value) return;
  workflowLoading.value = true;
  try {
    await approveFolderVerification(folder.value.id);
    showApproveConfirm.value = false;
    toast.add({ title: 'Folder disetujui', description: 'Folder diteruskan sesuai alur verifikasi.', color: 'success' });
    // Tetap di halaman detail folder agar pengguna dapat melihat status dan
    // verifikator berikutnya tanpa kembali ke daftar Verifikasi.
    await loadData();
  } catch (error: any) {
    toast.add({ title: 'Gagal menyetujui folder', description: error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    workflowLoading.value = false;
  }
};

const openRejectModal = () => {
  rejectReason.value = '';
  showRejectModal.value = true;
};

const submitVerificationReject = async () => {
  if (!folder.value || !rejectReason.value.trim()) return;
  workflowLoading.value = true;
  try {
    if (isVerifierAwaiting.value) {
      await rejectFolderVerification(folder.value.id, rejectReason.value.trim());
    } else {
      await rejectFolder(folder.value.id, rejectReason.value.trim());
    }
    showRejectModal.value = false;
    toast.add({ title: 'Folder dikembalikan', description: 'Konseptor dapat memperbaiki folder.', color: 'success' });
    // Setelah ditolak, folder berpindah ke konseptor sehingga verifikator
    // sebelumnya tidak lagi memiliki akses ke detail folder.
    await navigateTo('/korespondensi/sde-masal/verifikasi');
  } catch (error: any) {
    toast.add({ title: 'Gagal menolak folder', description: error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    workflowLoading.value = false;
  }
};

const signerInfo = computed(() => {
  const parts = (folder.value?.finalSenderName || folder.value?.pengirimName || '')
    .split(' - ')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    label: 'Penandatangan SDE Massal',
    role: parts.slice(1).join(' - ') || 'Pengirim',
    name: parts[0] || '-',
  };
});

const openSignatureModal = async () => {
  if (!selectedItemIds.value.length) return;

  // Buka popup terlebih dahulu supaya klik Kirim langsung memberi respons.
  showSendConfirm.value = false;
  isPassphraseModalOpen.value = true;

  try {
    const config: any = await getConfigDigsig('SDE');
    bsreDisabled.value = !config?.data?.digsig;
    qrDisabled.value = !config?.data?.ttdQr;
    basahDisabled.value = !config?.data?.ttdBasah;
  } catch {
    // Jika konfigurasi gagal dimuat, modal tetap dapat memilih opsi fisik.
    bsreDisabled.value = true;
    qrDisabled.value = true;
    basahDisabled.value = true;
  }

};

const openFinalizeAll = async () => {
  // Pengirim akhir memfinalisasi seluruh naskah yang sudah disetujui.
  selectedItemIds.value = eligibleItems.value.map((item) => item.id);
  // Tampilkan pratinjau semua naskah terlebih dahulu. Popup passphrase
  // dibuka setelah tombol "Kirim" pada pratinjau ditekan.
  await openSendPreview();
};

const sendSelectedItems = async (signData: { method: string; passphrase?: string }) => {
  if (!folder.value || !selectedItemIds.value.length || workflowLoading.value) return;

  const method = signData.method === 'tanpa_ttd' ? 'ttd_basah' : signData.method;
  if (method === 'digsig' && !signData.passphrase?.trim()) {
    signMethodModalRef.value?.setPassphraseError('Harap masukkan passphrase Anda');
    return;
  }

  selectedSendType.value = method as typeof selectedSendType.value;
  workflowLoading.value = true;
  const selectedCount = selectedItemIds.value.length;
  try {
    // Seragam dengan finalisasi SDE biasa: modal tetap terbuka dan tombol
    // menampilkan loading sampai seluruh naskah benar-benar selesai diproses.
    const result = await finalizeDirect({
      folderId: folder.value.id,
      itemIds: [...selectedItemIds.value],
      penerimaList: items.value
        .filter((item) => selectedItemIds.value.includes(item.id))
        .map((item) => (item.recipient || {}) as SdeMasalPenerima),
      signOption: selectedSendType.value,
      passphrase: signData.passphrase,
    });

    const success = Number(result?.success || 0);
    const failed = Number(result?.failed || 0);
    if (success === selectedCount && failed === 0) {
      toast.add({
        title: 'Pengiriman selesai',
        description: `${success} naskah berhasil ditandatangani dan dikirim.`,
        color: 'success',
      });
      isPassphraseModalOpen.value = false;
      closePreview();
      showSendConfirm.value = false;
      await navigateTo('/korespondensi/terkirim');
    } else {
      // Jangan keluar dari modal bila masih ada naskah gagal. Pengguna dapat
      // langsung mencoba lagi; backend otomatis melewati naskah yang sukses.
      toast.add({
        title: 'Pengiriman belum selesai',
        description: `${success} berhasil, ${failed} gagal. Silakan kirim ulang naskah yang gagal.`,
        color: 'warning',
      });
      await loadData();
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Coba lagi.';
    if (
      (message.toLowerCase().includes('passphrase') || message.toLowerCase().includes('salah'))
    ) {
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(message);
    } else {
      toast.add({ title: 'Pengiriman gagal', description: message, color: 'error' });
    }
  } finally {
    workflowLoading.value = false;
  }
};

const handleSignMethodSubmit = async (data: { method: string; passphrase?: string }) => {
  await sendSelectedItems(data);
};
const loading = ref(true);
const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'SDE Masal', to: '/korespondensi/sde-masal' },
  { label: folder.value?.judul || 'Folder', to: '#' },
]);

// Preview PDF (native PDF viewer via iframe, seragam dengan wizard)
const showPreview = ref(false);
const sendPreviewFlow = ref(false);
const previewIndex = ref(0);
const isLoadingPdf = ref(false);
const pdfUrl = ref<string | null>(null);
const pdfError = ref<string | null>(null);
let currentBlobUrl: string | null = null;

const previewKonsep = computed<SdeMasalConcept | null>(() => {
  const f = folder.value;
  if (!f) return null;
  return {
    tanggalKonsep: f.tanggal ? String(f.tanggal).slice(0, 10) : '',
    klasifikasiId: f.klasifikasi || '',
    klasifikasiName: [f.klasifikasi, f.klasifikasiText].filter(Boolean).join(' - '),
    pengirimId: f.pengirimId || '',
    pengirimName: f.pengirimName || '',
    sifat: f.sifat || 'biasa',
    perihal: items.value[previewIndex.value]?.perihal || '',
    parentNaskahId: f.parentNaskahId || undefined,
  };
});

const previewTemplate = computed<SdeMasalTemplate | null>(() => {
  const f = folder.value;
  if (!f) return null;
  return { skema: 'DINAMIS', versi: 'v1', konten: f.kontenTemplate || '' };
});

const pengirimParts = computed(() =>
  (folder.value?.pengirimName || '').split(' - ').map((p) => p.trim()).filter(Boolean)
);
const pengirimNama = computed(() => pengirimParts.value[0] || '-');
const pengirimJabatan = computed(() => pengirimParts.value.slice(1).join(' - ') || '-');

const findTertujuEksternal = (value: string | number | null | undefined) => {
  const raw = String(value ?? '').trim();
  const code = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find(
    (item) => String(item.kode ?? '').trim().padStart(3, '0') === code
  );
};

const getRecipientCompanyName = (item: SdeMasalFolderItem) =>
  findTertujuEksternal(item.recipient?.idTertuju || item.recipient?.tertuju)?.nama || null;

let internalPositionLookupLoaded = false;
const ensureInternalPositionLookup = async () => {
  if (internalPositionLookupLoaded) return;
  internalPositionLookupLoaded = true;
  try {
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    setInternalPositionLookup(rows);
  } catch {
    /* gagal load → fallback tampilkan kode position */
  }
};

const revokePdf = () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  pdfUrl.value = null;
};

const closePreview = () => {
  showPreview.value = false;
  sendPreviewFlow.value = false;
  revokePdf();
};

const openPreview = async (item: SdeMasalFolderItem) => {
  const idx = items.value.findIndex((i) => i.id === item.id);
  if (idx < 0) return;
  previewIndex.value = idx;
  sendPreviewFlow.value = false;
  showPreview.value = true;
  await generatePdfFor(idx);
};

const sendPreviewItems = computed(() =>
  items.value.filter((item) => selectedItemIds.value.includes(item.id)),
);
const previewPosition = computed(() => {
  if (!sendPreviewFlow.value) return previewIndex.value;
  const position = sendPreviewItems.value.findIndex((item) => item.id === items.value[previewIndex.value]?.id);
  return position >= 0 ? position : 0;
});
const previewTotal = computed(() => sendPreviewFlow.value ? sendPreviewItems.value.length : items.value.length);
const previewPreviousDisabled = computed(() =>
  sendPreviewFlow.value ? previewPosition.value <= 0 : previewIndex.value <= 0,
);
const previewNextDisabled = computed(() =>
  sendPreviewFlow.value
    ? previewPosition.value >= sendPreviewItems.value.length - 1
    : previewIndex.value >= items.value.length - 1,
);

const openSendPreview = async () => {
  if (!selectedItemIds.value.length) return;
  const firstItem = sendPreviewItems.value[0];
  if (!firstItem) return;
  sendPreviewFlow.value = true;
  showSendConfirm.value = false;
  previewIndex.value = items.value.findIndex((item) => item.id === firstItem.id);
  showPreview.value = true;
  await generatePdfFor(previewIndex.value);
};

const gotoPreviewPrevious = async () => {
  if (sendPreviewFlow.value) {
    const item = sendPreviewItems.value[previewPosition.value - 1];
    if (item) await gotoPreview(items.value.findIndex((candidate) => candidate.id === item.id));
    return;
  }
  await gotoPreview(previewIndex.value - 1);
};

const gotoPreviewNext = async () => {
  if (sendPreviewFlow.value) {
    const item = sendPreviewItems.value[previewPosition.value + 1];
    if (item) await gotoPreview(items.value.findIndex((candidate) => candidate.id === item.id));
    return;
  }
  await gotoPreview(previewIndex.value + 1);
};

const continueToSignature = async () => {
  await openSignatureModal();
};

const gotoPreview = async (idx: number) => {
  if (idx < 0 || idx >= items.value.length) return;
  previewIndex.value = idx;
  await generatePdfFor(idx);
};

const generatePdfFor = async (idx: number) => {
  const item = items.value[idx];
  if (!item || !folder.value) return;

  isLoadingPdf.value = true;
  revokePdf();
  try {
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    await ensureInternalPositionLookup();

    const recipient = (item.recipient || {}) as SdeMasalPenerima;
    const konten = renderSdeMasalKonten(
      folder.value.kontenTemplate || '',
      recipient,
      previewKonsep.value,
      getRecipientCompanyName(item)
    );

    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('konten', konten);
    formData.append('klasifikasi', previewKonsep.value?.klasifikasiName?.split(' - ')[0] || '');
    formData.append('perihal', item.perihal || previewKonsep.value?.perihal || '');
    formData.append('sifat', previewKonsep.value?.sifat || 'biasa');
    formData.append(
      'penerima',
      JSON.stringify([getRecipientCompanyName(item) || item.penerima || ''])
    );
    formData.append('tembusan_eksternal', recipient.tembusanEksternal || '');
    formData.append('tembusan_internal', recipient.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(recipient.tembusan ? [recipient.tembusan] : []));
    const directRefs = Array.isArray(recipient.lampiran)
      ? recipient.lampiran.filter((attachment: any) => attachment?.key && attachment?.fileName)
      : [];
    if (directRefs.length) formData.append('lampiran_direct_refs', JSON.stringify(directRefs));
    formData.append(
      'nama_tempat',
      user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang'
    );
    formData.append('nama_jabatan', pengirimJabatan.value || user.value?.positionText || '');
    formData.append('nama_lengkap', pengirimNama.value || user.value?.nama || '');
    if (previewKonsep.value?.tanggalKonsep) {
      formData.append('tgl', previewKonsep.value.tanggalKonsep);
    }

    const response = await api.post('/sde-masal/preview-pdf', formData, {
      responseType: 'blob',
    });

    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text();
      const errJson = JSON.parse(text);
      throw new Error(errJson?.message?.[0] || errJson?.message || 'Gagal generate PDF');
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    if (blob.size === 0) throw new Error('PDF kosong dari server');
    currentBlobUrl = URL.createObjectURL(blob);
    pdfUrl.value = currentBlobUrl;
  } catch (e: any) {
    console.error('Gagal generate preview PDF SDE Masal:', e);
    let detail = e?.message || 'Gagal generate PDF';
    if (e?.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const errJson = JSON.parse(text);
        detail = errJson?.message?.[0] || errJson?.message || detail;
      } catch {
        /* bukan JSON, pakai pesan default */
      }
    }
    pdfError.value = detail;
    toast.add({ title: 'Gagal membuat preview', description: detail, color: 'error' });
    pdfUrl.value = null;
  } finally {
    isLoadingPdf.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const currentFolderId = String(route.params.folderId);
    const data = await findNaskahInFolder(currentFolderId);
    folder.value = data?.folder || null;
    items.value = data?.items || [];
    // Pilihan naskah harus dimulai kosong agar checkbox header tetap bolong.
    // Pengguna dapat memilih semua naskah melalui checkbox header secara manual.
    selectedItemIds.value = [];
    await markSdeMasalFolderNotificationsAsRead(currentFolderId);
  } finally {
    loading.value = false;
  }
};

// Kirim ulang naskah yang gagal
const retryingId = ref<string | null>(null);
const toast = useToast();
const isGagal = (status: string) =>
  ['GAGAL', 'Gagal'].includes(status) || status?.toLowerCase() === 'gagal';
// Status yang masih dalam alur verifikasi (belum final → link ke verifikasi-detail)
const isVerificationStatus = (status: string) =>
  ['MENUNGGU', 'MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK'].includes(status);
const retryItem = async (item: SdeMasalFolderItem) => {
  if (retryingId.value === item.id) return;
  retryingId.value = item.id;
  try {
    await api.post(`/sde-masal/${item.id}/retry`);
    toast.add({
      title: 'Kirim ulang berhasil',
      description: `Naskah "${item.perihal || '-'}" berhasil dikirim.`,
      color: 'success',
    });
    await loadData();
  } catch (e: any) {
    let detail = e?.response?.data?.message || e?.message || 'Gagal mengirim ulang naskah';
    if (Array.isArray(detail)) detail = detail[0];
    toast.add({ title: 'Kirim ulang gagal', description: String(detail), color: 'error' });
  } finally {
    retryingId.value = null;
  }
};
const downloadPdf = (item: SdeMasalFolderItem) => {
  if (!item.finalPdf) return;
  const base = api?.defaults?.baseURL || '';
  window.open(
    item.finalPdf.startsWith('http')
      ? item.finalPdf
      : `${base}/${item.finalPdf.replace(/^\//, '')}`,
    '_blank'
  );
};
const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const verifikatorList = computed(() => {
  const source = items.value.find((item) => Array.isArray(item.verifikators) && item.verifikators.length > 0);
  return [...(source?.verifikators || [])].sort((a, b) => Number(a.urutan) - Number(b.urutan));
});
const verifikatorStatusLabel = (status: string) => ({
  pending: 'Menunggu',
  waiting: 'Aktif',
  verified: 'Disetujui',
  rejected: 'Ditolak',
}[status] || status);
const verifikatorStatusBadge = (status: string) => ({
  pending: 'shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300',
  waiting: 'shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  verified: 'shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300',
}[status] || 'shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300');

// Timeline Riwayat: seluruh tahapan selalu ditampilkan agar pengguna dapat
// melihat posisi folder saat ini dan tahapan yang masih akan dilalui.
const timelineSteps = computed(() => {
  type TimelineStep = {
    number?: number;
    label: string;
    desc: string;
    date?: string;
    dotClass: string;
    textClass: string;
    descClass: string;
    dateClass: string;
    icon?: string;
    done: boolean;
  };

  const steps: TimelineStep[] = [];
  const firstItem = items.value[0];
  const folderStatus = folder.value?.status;
  const submitted = Boolean(firstItem?.submittedAt || (folderStatus && folderStatus !== 'DRAFT'));

  const pushStep = (step: Omit<TimelineStep, 'number'>) => {
    steps.push({ ...step, number: steps.length + 1 });
  };

  const completedStep = (label: string, desc: string, date?: string, icon = 'check'): Omit<TimelineStep, 'number'> => ({
    label,
    desc,
    date,
    dotClass: icon === 'x' ? 'bg-red-500 text-white' : 'bg-green-500 text-white',
    textClass: icon === 'x' ? 'font-semibold text-red-600 dark:text-red-400' : 'font-semibold text-gray-900 dark:text-white',
    descClass: 'text-gray-500 dark:text-gray-400',
    dateClass: 'text-gray-400 dark:text-gray-500',
    icon,
    done: true,
  });

  const pendingStep = (label: string, desc: string, active = false): Omit<TimelineStep, 'number'> => ({
    label,
    desc,
    dotClass: active
      ? 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20'
      : 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-400',
    textClass: active ? 'font-semibold text-[#457fb6] dark:text-[#5a9ad6]' : 'text-gray-400 dark:text-gray-500',
    descClass: active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600',
    dateClass: 'text-gray-400 dark:text-gray-600',
    done: false,
  });

  const creatorName = String(folder.value?.createdByName || '').trim();
  const creatorPosition = String(folder.value?.createdByPositionText || '').trim();
  const creatorDisplay = [creatorName, creatorPosition].filter(Boolean).join(' — ') || 'Konseptor';

  pushStep(submitted
    ? completedStep('Pengajuan', `${creatorDisplay} mengajukan SDE Massal`, firstItem?.submittedAt ? formatDate(firstItem.submittedAt) : undefined)
    : pendingStep('Pengajuan', 'Menunggu folder diajukan oleh konseptor'));

  for (const verifikator of verifikatorList.value) {
    const urutan = Number(verifikator.urutan);
    const desc = `${verifikator.nama || '-'} — ${verifikator.jabatan || verifikator.position || '-'}`;
    if (verifikator.status === 'verified') {
      pushStep(completedStep(`Disetujui oleh Verifikator ${urutan}`, desc, verifikator.verifiedAt ? formatDate(verifikator.verifiedAt) : undefined));
    } else if (verifikator.status === 'rejected') {
      pushStep(completedStep(`Ditolak oleh Verifikator ${urutan}`, desc, verifikator.rejectedAt ? formatDate(verifikator.rejectedAt) : undefined, 'x'));
    } else if (verifikator.status === 'waiting') {
      pushStep(pendingStep(`Menunggu Verifikasi ${urutan}`, desc, true));
    } else {
      pushStep(pendingStep(`Menunggu Giliran Verifikator ${urutan}`, desc));
    }
  }

  const allVerified = verifikatorList.value.length > 0 && verifikatorList.value.every((v) => v.status === 'verified');
  const senderDone = isFolderCompleted.value || ['DIFINALISASI', 'SEBAGIAN_TERKIRIM', 'TERKIRIM'].includes(folderStatus || '');
  const senderActive = !isFolderCompleted.value && folderStatus === 'MENUNGGU_PENGIRIM';
  pushStep(senderDone
    ? completedStep('Finalisasi Pengirim', 'Pengirim telah memeriksa dan memfinalisasi surat')
    : pendingStep('Finalisasi Pengirim', 'Menunggu pengirim memeriksa dan memfinalisasi surat', senderActive || allVerified));

  const sent = isFolderCompleted.value;
  const partiallySent = folderStatus === 'SEBAGIAN_TERKIRIM';
  pushStep(sent
    ? completedStep('Selesai', 'Naskah SDE Massal telah difinalisasi dan masuk ke Terkirim', firstItem?.updatedAt ? formatDate(firstItem.updatedAt) : undefined)
    : pendingStep('Dikirim ke Penerima', 'Menunggu surat dikirim kepada penerima', partiallySent));

  return steps;
});
const naskahStatusLabel = (status: string) =>
  ({
    draf: 'Draft',
    pending: 'Menunggu TTD',
    final: 'Final',
    final_tte: 'Final (TTE)',
    MENUNGGU: 'Menunggu',
    MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
    TERVERIFIKASI: 'Disetujui',
    TERKIRIM: 'Selesai',
    DITOLAK: 'Ditolak',
    GAGAL: 'Gagal',
  })[status] || status;
const naskahStatusBadge = (status: string) => ({
  draf: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap dark:bg-gray-700 dark:text-gray-300',
  pending: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  final: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  final_tte: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-300',
  MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
  GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');
onMounted(() => {
  if (canAccessPage()) loadData();
});
</script>
