<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShieldOff, RefreshCw, Check, X } from 'lucide-vue-next';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';
import type { ShareItem } from '~/composables/useNaskahShare';
import { getCategoryStyle, getCategoryFullName, formatFullDateTime } from '~/utils/mail-helpers';

const props = defineProps<{
  share: ShareItem;
  isSender?: boolean;
  userPosition?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'revoke-recipient', payload: { share: ShareItem; recipientId: string; recipientName: string }): void;
  (e: 'revoke-all', share: ShareItem): void;
  (e: 'request-reopen', share: ShareItem): void;
  (e: 'approve-reopen', share: ShareItem): void;
  (e: 'reject-reopen', share: ShareItem): void;
}>();

const isOpen = ref(true);

// Cari recipient milik user saat ini (untuk status request)
const myRecipient = computed(() => {
  if (!props.userPosition) return null;
  return props.share.recipients?.find((r) => r.recipientId === props.userPosition) || null;
});

// Penerima: bisa minta akses ulang jika SEKALI_LIHAT & sudah BERAKHIR & belum ada request MENUNGGU
const canRequestReopen = computed(() => {
  if (props.isSender) return false;
  if (props.share.accessType !== 'SEKALI_LIHAT') return false;
  if (myRecipient.value?.status !== 'BERAKHIR') return false;
  if (myRecipient.value?.requestStatus === 'MENUNGGU') return false;
  return true;
});

// Penerima: request sedang MENUNGGU
const isRequestPending = computed(() => {
  return myRecipient.value?.requestStatus === 'MENUNGGU';
});

// Pemberi: ada request MENUNGGU dari salah satu penerima
const hasPendingRequest = computed(() => {
  return props.share.recipients?.some((r) => r.requestStatus === 'MENUNGGU') || false;
});

const handleClose = () => {
  isOpen.value = false;
  emit('close');
};

watch(isOpen, (val) => {
  if (!val) handleClose();
});
</script>

<template>
  <Teleport to="body">
    <Modal v-model="isOpen" :hideDefaultFooter="true" size="xl">
      <template #title>
        <div class="mt-5 ml-5 mb-3">
          <Heading variant="heading9b" class="font-bold text-sm dark:text-white">
            Detail Naskah Dibagikan
          </Heading>
        </div>
      </template>

      <div class="px-3 max-h-[calc(100vh-150px)] overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-2">
          <!-- Naskah -->
          <div class="md:col-span-2">
            <p class="text-gray-600 dark:text-gray-400 mb-1">Naskah</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ share.naskahPerihal || '(Tanpa perihal)' }}
            </p>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                :class="[
                  getCategoryStyle(share.naskahJenis),
                  'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide',
                ]"
              >
                {{ getCategoryFullName(share.naskahJenis) }}
              </span>
              <span v-if="share.naskahNomor" class="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                {{ share.naskahNomor }}
              </span>
              <SharedShareBadge :status="share.status" size="xs" />
            </div>
          </div>

          <!-- Pemberi Akses -->
          <div>
            <p class="text-gray-600 dark:text-gray-400 mb-1">Pemberi Akses</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ share.pemberiNama || '-' }}</p>
            <p v-if="share.pemberiPositionText" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ share.pemberiPositionText }}</p>
          </div>

          <!-- Tanggal Dibagikan -->
          <div>
            <p class="text-gray-600 dark:text-gray-400 mb-1">Tanggal Dibagikan</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatFullDateTime(share.createdAt) }}</p>
          </div>

          <!-- Jenis Akses -->
          <div class="md:col-span-2">
            <p class="text-gray-600 dark:text-gray-400 mb-1">Jenis Akses</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ share.accessType === 'SEKALI_LIHAT' ? 'Sekali Lihat' : `Rentang Waktu — ${share.durationDays || '-'} hari` }}
            </p>
            <p v-if="share.expiresAt" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Berlaku hingga {{ formatFullDateTime(share.expiresAt) }}
            </p>
            <p v-if="share.accessType === 'SEKALI_LIHAT'" class="text-xs text-amber-500 dark:text-amber-400 mt-1">
              Penerima hanya dapat membuka naskah satu kali
            </p>
          </div>

          <!-- Catatan -->
          <div v-if="share.catatan" class="md:col-span-2">
            <p class="text-gray-600 dark:text-gray-400 mb-1">Catatan</p>
            <p class="font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{{ share.catatan }}</p>
          </div>
        </div>

        <!-- Penerima Table -->
        <!-- Penerima Table (hanya untuk pengirim) -->
        <div v-if="props.isSender && share.recipients && share.recipients.length" class="mt-6 mb-5 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-primary dark:bg-primary-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="p-2 text-left text-white font-semibold">NO</th>
                  <th class="p-2 text-left font-semibold text-white">NAMA</th>
                  <th class="p-2 text-left font-semibold text-white">JABATAN</th>
                  <th class="p-2 text-center font-semibold text-white">STATUS</th>
                  <th class="p-2 text-center font-semibold text-white">AKSI</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(recipient, i) in share.recipients"
                  :key="recipient.id"
                  class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td class="p-2">
                    <span class="text-gray-900 dark:text-white">{{ i + 1 }}</span>
                  </td>
                  <td class="p-2">
                    <span class="font-medium text-gray-900 dark:text-white">{{ recipient.nama || '-' }}</span>
                  </td>
                  <td class="p-2">
                    <span class="text-gray-500 dark:text-gray-400">{{ recipient.positionText || '-' }}</span>
                  </td>
                  <td class="p-2 text-center">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-semibold"
                      :class="recipient.status === 'DIBACA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : recipient.status === 'BERAKHIR' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
                    >
                      {{ recipient.status === 'DIBACA' ? 'Dibaca' : recipient.status === 'BERAKHIR' ? 'Berakhir' : 'Terkirim' }}
                    </span>
                  </td>
                  <td class="p-2 text-center">
                    <button
                      v-if="share.status === 'AKTIF' && recipient.status !== 'BERAKHIR'"
                      @click="emit('revoke-recipient', { share, recipientId: recipient.recipientId || recipient.id, recipientName: recipient.nama })"
                      class="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 inline-flex items-center gap-1 text-[10px] font-medium"
                    >
                      <ShieldOff class="w-3 h-3" />
                      Akhiri
                    </button>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Info Berakhir -->
        <div v-if="share.status === 'BERAKHIR'" class="mt-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-sm font-medium text-red-800 dark:text-red-300">Akses Berakhir</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">
            <span v-if="share.revokedAt">{{ formatFullDateTime(share.revokedAt) }}</span>
            <span v-if="share.revokedReason"> — {{ share.revokedReason }}</span>
          </p>
        </div>

        <!-- Banner Request Akses Ulang (untuk PEMBERI) -->
        <div v-if="props.isSender && hasPendingRequest" class="mt-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p class="text-sm font-medium text-amber-800 dark:text-amber-300">Permintaan Akses Ulang</p>
          <p class="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Ada penerima yang meminta akses ulang untuk naskah ini.
          </p>
          <div class="flex gap-2 mt-3">
            <button
              @click="emit('approve-reopen', share)"
              class="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-700 transition inline-flex items-center gap-1.5"
            >
              <Check class="w-3.5 h-3.5" />
              Setujui
            </button>
            <button
              @click="emit('reject-reopen', share)"
              class="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-1.5"
            >
              <X class="w-3.5 h-3.5" />
              Tolak
            </button>
          </div>
        </div>

        <!-- Status Request (untuk PENERIMA) -->
        <div v-if="!props.isSender && isRequestPending" class="mt-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Permintaan Akses Ulang Terkirim</p>
          <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
            Permintaan Anda sedang menunggu persetujuan pemberi.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700">
        <!-- Cabut Semua Akses (hanya untuk pengirim, share masih AKTIF) -->
        <button
          v-if="props.isSender && share.status === 'AKTIF'"
          @click="emit('revoke-all', share)"
          class="px-4 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-1.5"
        >
          <ShieldOff class="w-3.5 h-3.5" />
          Cabut Semua Akses
        </button>
        <!-- Minta Akses Ulang (hanya untuk penerima, SEKALI_LIHAT & BERAKHIR) -->
        <button
          v-else-if="canRequestReopen"
          @click="emit('request-reopen', share)"
          class="px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-700 transition inline-flex items-center gap-1.5"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          Minta Akses Ulang
        </button>
        <span v-else></span>
        <button
          @click="handleClose"
          class="px-4 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Tutup
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
