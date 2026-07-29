<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Buat Usulan Pindah Arsip Inaktif" :items="items" />
      <NuxtLink to="/usulan-pindah" class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Batal
      </NuxtLink>
    </div>

    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 max-w-3xl mx-auto">
      <form @submit.prevent="onSubmit(false)" class="space-y-5">
        <!-- Tanggal Usulan -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Usulan</label>
          <input v-model="form.tanggalUsulan" type="date" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>

        <!-- Sekretaris (auto-fill) -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sekretaris (Pengusul)</label>
          <input :value="userLabel" disabled class="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
        </div>

        <!-- Divisi (auto-fill) -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Divisi</label>
          <input :value="divisiLabel" disabled class="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
        </div>

        <!-- Atasan Managerial -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Atasan Managerial <span class="text-red-500">*</span></label>
          <input v-model="form.atasanPersnum" type="number" placeholder="Persnum atasan managerial" required class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>

        <!-- Pilih Arsip -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pilih Arsip Inaktif <span class="text-red-500">*</span></label>
          <input v-model="form.arsipId" type="text" placeholder="ID arsip" required class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>

        <!-- Perihal Arsip -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Perihal Arsip</label>
          <input v-model="form.arsipPerihal" type="text" placeholder="Auto-fill dari arsip" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>

        <!-- Tanggal Retensi Aktif Habis -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Retensi Aktif Habis</label>
          <input v-model="form.tanggalRetensiAktifHabis" type="date" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" />
        </div>

        <!-- Keterangan -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Keterangan</label>
          <textarea v-model="form.keterangan" rows="3" placeholder="Keterangan tambahan..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none"></textarea>
        </div>

        <!-- Tombol -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="onSubmit(true)" :disabled="submitting" class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            {{ submitting ? 'Menyimpan...' : 'Simpan Draft' }}
          </button>
          <button type="submit" :disabled="submitting" class="px-5 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors disabled:opacity-50">
            {{ submitting ? 'Mengirim...' : 'Kirim ke Atasan' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useUsulanPindah } from '~/composables/useUsulanPindah';
import { useAuth } from '~/composables/useAuth';

definePageMeta({ middleware: ['auth'] });

const { createUsulan } = useUsulanPindah();
const { user } = useAuth();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Usulan Pindah Arsip Inaktif', to: '/usulan-pindah' },
  { label: 'Buat Usulan', to: '/usulan-pindah/create' },
];

const userLabel = computed(() => {
  const u: any = user.value;
  return u?.nama ?? u?.name ?? u?.persnum ?? '-';
});

const divisiLabel = computed(() => {
  const u: any = user.value;
  return u?.organizationText ?? u?.organization ?? '-';
});

const form = reactive({
  tanggalUsulan: new Date().toISOString().split('T')[0],
  atasanPersnum: undefined as number | undefined,
  arsipId: '',
  arsipPerihal: '',
  tanggalRetensiAktifHabis: '',
  keterangan: '',
});

const submitting = ref(false);

const onSubmit = async (asDraft: boolean) => {
  if (!form.atasanPersnum || !form.arsipId) return;
  submitting.value = true;
  try {
    await createUsulan({
      tanggalUsulan: form.tanggalUsulan,
      atasanPersnum: form.atasanPersnum,
      arsipId: form.arsipId,
      arsipPerihal: form.arsipPerihal,
      tanggalRetensiAktifHabis: form.tanggalRetensiAktifHabis,
      keterangan: form.keterangan,
      submit: !asDraft,
    });
    await navigateTo('/usulan-pindah');
  } catch (e) {
    console.error('Gagal membuat usulan:', e);
    alert('Gagal membuat usulan');
  } finally {
    submitting.value = false;
  }
};
</script>