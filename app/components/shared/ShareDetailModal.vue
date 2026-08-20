<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShieldOff } from 'lucide-vue-next';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';
import type { ShareItem } from '~/composables/useNaskahShare';
import { getCategoryStyle, getCategoryFullName, formatFullDateTime } from '~/utils/mail-helpers';

const { t } = useI18n();

const props = defineProps<{
  share: ShareItem;
  isSender?: boolean;
  userPosition?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'revoke-recipient', payload: { share: ShareItem; recipientId: string; recipientName: string }): void;
  (e: 'revoke-all', share: ShareItem): void;
}>();

const isOpen = ref(true);

/** Display status for badge in detail modal header. */
const displayStatus = computed<'AKTIF' | 'BERAKHIR'>(() => {
  if (props.share.status === 'BERAKHIR') return 'BERAKHIR';
  // SEKALI_LIHAT: jika semua penerima sudah BERAKHIR (dibuka), tampilkan BERAKHIR.
  if (
    props.share.accessType === 'SEKALI_LIHAT' &&
    props.share.recipients?.length
  ) {
    const allEnded = props.share.recipients.every(
      (r) => r.status === 'BERAKHIR',
    );
    if (allEnded) return 'BERAKHIR';
  }
  return 'AKTIF';
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
            {{ t('share_detail_title') }}
          </Heading>
        </div>
      </template>

      <div class="px-3 max-h-[calc(100vh-150px)] overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-2">
          <!-- Naskah -->
          <div class="md:col-span-2">
            <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('share_naskah') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ share.naskahPerihal || t('share_tanpa_perihal') }}
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
              <SharedShareBadge :status="displayStatus" size="xs" />
            </div>
          </div>

          <!-- Pemberi Akses -->
          <div>
            <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('share_pemberi_akses') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ share.pemberiNama || '-' }}</p>
            <p v-if="share.pemberiPositionText" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ share.pemberiPositionText }}</p>
          </div>

          <!-- Tanggal Dibagikan -->
          <div>
            <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('share_tanggal_dibagikan') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatFullDateTime(share.createdAt) }}</p>
          </div>

          <!-- Jenis Akses -->
          <div class="md:col-span-2">
            <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('share_jenis_akses') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ share.accessType === 'SEKALI_LIHAT' ? t('share_sekali_lihat') : `${t('share_rentang_waktu')} — ${share.durationDays || '-'} ${t('share_hari')}` }}
            </p>
            <p v-if="share.expiresAt" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('share_berlaku_hingga') }} {{ formatFullDateTime(share.expiresAt) }}
            </p>
            <p v-if="share.accessType === 'SEKALI_LIHAT'" class="text-xs text-amber-500 dark:text-amber-400 mt-1">
              {{ t('share_sekali_lihat_info') }}
            </p>
          </div>

          <!-- Catatan -->
          <div v-if="share.catatan" class="md:col-span-2">
            <p class="text-gray-600 dark:text-gray-400 mb-1">{{ t('share_catatan') }}</p>
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
                  <th class="p-2 text-left text-white font-semibold">{{ t('share_no') }}</th>
                  <th class="p-2 text-left font-semibold text-white">{{ t('share_nama') }}</th>
                  <th class="p-2 text-left font-semibold text-white">{{ t('share_jabatan') }}</th>
                  <th class="p-2 text-center font-semibold text-white">{{ t('share_status') }}</th>
                  <th class="p-2 text-center font-semibold text-white">{{ t('share_aksi') }}</th>
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
                      {{ recipient.status === 'DIBACA' ? t('share_dibaca') : recipient.status === 'BERAKHIR' ? t('share_berakhir') : t('share_terkirim') }}
                    </span>
                  </td>
                  <td class="p-2 text-center">
                    <button
                      v-if="share.status === 'AKTIF' && recipient.status !== 'BERAKHIR'"
                      @click="emit('revoke-recipient', { share, recipientId: recipient.recipientId || recipient.id, recipientName: recipient.nama })"
                      class="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 inline-flex items-center gap-1 text-[10px] font-medium"
                    >
                      <ShieldOff class="w-3 h-3" />
                      {{ t('share_akhiri') }}
                    </button>
                    <span v-else class="text-xs text-gray-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cabut Semua Akses (pemberi, share AKTIF) -->
        <div v-if="props.isSender && share.status === 'AKTIF'" class="mt-4 mb-5 flex justify-end">
          <button
            @click="emit('revoke-all', share)"
            class="px-4 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center gap-1.5"
          >
            <ShieldOff class="w-3.5 h-3.5" />
            {{ t('share_cabut_semua') }}
          </button>
        </div>

        <!-- Info Berakhir -->
        <div v-if="share.status === 'BERAKHIR'" class="mt-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ t('share_akses_berakhir') }}</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">
            <span v-if="share.revokedAt">{{ formatFullDateTime(share.revokedAt) }}</span>
            <span v-if="share.revokedReason"> — {{ share.revokedReason }}</span>
          </p>
        </div>

      </div>

      <!-- Footer -->
      <div class="flex justify-end px-5 py-3 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="handleClose"
          class="px-4 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {{ t('share_tutup') }}
        </button>
      </div>
    </Modal>
  </Teleport>
</template>
