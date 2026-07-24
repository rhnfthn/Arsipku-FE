<script setup lang="ts">
import { User, Calendar, StickyNote, CheckCircle2, Circle, FileText, ShieldOff } from 'lucide-vue-next';
import type { ShareItem } from '~/composables/useNaskahShare';
import { getCategoryStyle, getCategoryFullName, formatShortDate } from '~/utils/mail-helpers';

const props = defineProps<{
  share: ShareItem;
  isSender?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'revoke-recipient', payload: { share: ShareItem; recipientId: string; recipientName: string }): void;
}>();

const isOpen = ref(true);

const handleClose = () => {
  isOpen.value = false;
  emit('close');
};

watch(isOpen, (val) => {
  if (!val) handleClose();
});
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      content: 'w-full sm:max-w-xl shadow-2xl',
      overlay: 'bg-black/50 backdrop-blur-sm',
      header: 'border-b border-gray-100 dark:border-gray-800 px-0 py-0',
      body: 'px-0 py-0',
      footer: 'border-t border-gray-100 dark:border-gray-800 px-6 py-3.5',
    }"
    @close="handleClose"
  >
    <template #header>
      <div class="px-6 pt-5 pb-4">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/20 flex items-center justify-center shrink-0 shadow-sm">
            <FileText class="w-5 h-5 text-primary-500 dark:text-primary-400" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-bold text-gray-900 dark:text-white leading-snug">
              {{ share.naskahPerihal || '(Tanpa perihal)' }}
            </h3>
            <div class="flex items-center gap-2 mt-1.5">
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
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div class="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
        <!-- Info Cards -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Pemberi -->
          <div class="col-span-2 sm:col-span-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                <User class="w-3 h-3 text-primary-500 dark:text-primary-400" />
              </div>
              <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pemberi Akses</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ share.pemberiNama || '-' }}</p>
            <p v-if="share.pemberiPositionText" class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{{ share.pemberiPositionText }}</p>
          </div>

          <!-- Tanggal -->
          <div class="col-span-2 sm:col-span-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Calendar class="w-3 h-3 text-blue-500 dark:text-blue-400" />
              </div>
              <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tanggal Dibagikan</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatShortDate(share.createdAt) }}</p>
          </div>
        </div>

        <!-- Catatan -->
        <div v-if="share.catatan" class="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
          <div class="flex items-center gap-2 mb-1.5">
            <StickyNote class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <p class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Catatan</p>
          </div>
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ share.catatan }}</p>
        </div>

        <!-- Status Penerima -->
        <div v-if="share.recipients && share.recipients.length">
          <div class="flex items-center gap-2 mb-2.5">
            <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <User class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Status Penerima ({{ share.recipients.length }})
            </p>
          </div>
          <div class="space-y-2">
            <div
              v-for="recipient in share.recipients"
              :key="recipient.id"
              class="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                :class="recipient.status === 'DIBACA' ? 'bg-emerald-100 dark:bg-emerald-900/40' : recipient.status === 'DIBUKA' ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-gray-200 dark:bg-gray-700'"
              >
                <span class="text-[11px] font-bold"
                  :class="recipient.status === 'DIBACA' ? 'text-emerald-600 dark:text-emerald-400' : recipient.status === 'DIBUKA' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'"
                >
                  {{ recipient.nama?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{{ recipient.nama }}</p>
                <p v-if="recipient.positionText" class="text-[10px] text-gray-400 dark:text-gray-500 truncate">{{ recipient.positionText }}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <!-- DICABUT = akses dicabut -->
                <template v-if="recipient.status === 'DICABUT'">
                  <ShieldOff class="w-4 h-4 text-red-400 dark:text-red-500" />
                  <span class="text-[10px] font-semibold text-red-500 dark:text-red-400">Dicabut</span>
                </template>
                <!-- DIBACA = sudah baca -->
                <template v-else-if="recipient.status === 'DIBACA'">
                  <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                  <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Dibaca</span>
                </template>
                <!-- DIBUKA = sudah buka PDF -->
                <template v-else-if="recipient.status === 'DIBUKA'">
                  <CheckCircle2 class="w-4 h-4 text-orange-500" />
                  <span class="text-[10px] font-semibold text-orange-600 dark:text-orange-400">Terkirim</span>
                </template>
                <!-- BELUM_DIBACA = belum dibaca -->
                <template v-else>
                  <Circle class="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500">Terkirim</span>
                </template>
                <!-- Revoke button per recipient -->
                <UTooltip v-if="props.isSender && share.status === 'AKTIF' && recipient.status !== 'DICABUT'" text="Cabut akses">
                  <UButton
                    icon="i-lucide-shield-off"
                    color="error"
                    variant="ghost"
                    size="xs"
                    class="ml-1"
                    @click="emit('revoke-recipient', { share, recipientId: recipient.recipientId || recipient.id, recipientName: recipient.nama })"
                  />
                </UTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Tutup"
          variant="outline"
          color="neutral"
          size="sm"
          @click="handleClose"
        />
      </div>
    </template>
  </UModal>
</template>
