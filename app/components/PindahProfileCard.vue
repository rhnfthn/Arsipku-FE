<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div
      class="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
      <div class="flex items-center gap-3">
        <div
          class="p-2.5 rounded-xl bg-primary-500 text-white shadow-sm w-11 h-11 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-user-switch" class="w-6 h-6" />
        </div>
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-white leading-none">Pindah Profile</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Beralih antara akun asli dan profile delegasi Anda
          </p>
        </div>
      </div>
    </div>

    <div class="p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Akun Asli -->
        <button
          type="button"
          @click="selectProfile('akun_asli')"
          :disabled="switching"
          class="flex items-center justify-between gap-3 p-4 rounded-xl border transition-all text-left"
          :class="isActive('akun_asli')
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 ring-2 ring-primary-500/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="isActive('akun_asli') ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
            >
              <UIcon name="i-lucide-user" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">Akun Asli</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ user?.nama || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <UBadge size="xs" variant="subtle" color="primary" class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize leading-none">
              {{ user?.role || 'User' }}
            </UBadge>
            <UIcon
              v-if="isActive('akun_asli')"
              name="i-heroicons-check-circle-20-solid"
              class="w-4 h-4 text-primary-600 dark:text-primary-400"
            />
          </div>
        </button>

        <!-- Profile Delegasi -->
        <button
          type="button"
          @click="selectProfile(profileValue)"
          :disabled="switching"
          class="flex items-center justify-between gap-3 p-4 rounded-xl border transition-all text-left"
          :class="isActive(profileValue)
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 ring-2 ring-primary-500/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="isActive(profileValue) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
            >
              <UIcon name="i-lucide-briefcase" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ profileLabel }}</p>
              <p v-if="profileDescription" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {{ profileDescription }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <UBadge size="xs" variant="subtle" color="primary" class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize leading-none">
              {{ profileBadge }}
            </UBadge>
            <UIcon
              v-if="isActive(profileValue)"
              name="i-heroicons-check-circle-20-solid"
              class="w-4 h-4 text-primary-600 dark:text-primary-400"
            />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';

const props = defineProps<{
  profileValue: 'sekretaris' | 'unit_dokumen';
  profileLabel: string;
  profileBadge: string;
  profileDescription?: string;
}>();

const { user } = useAuth();
const switching = ref(false);
const activeProfile = ref<'akun_asli' | 'sekretaris' | 'unit_dokumen'>('akun_asli');

const readStoredProfile = (): 'akun_asli' | 'sekretaris' | 'unit_dokumen' => {
  if (process.client) {
    const stored = localStorage.getItem('active_profile') || localStorage.getItem('arsipku_active_profile');
    if (stored === 'akun_asli' || stored === 'sekretaris' || stored === 'unit_dokumen') return stored;
  }
  return 'akun_asli';
};

const isActive = (val: string) => activeProfile.value === val;

const selectProfile = async (profile: 'akun_asli' | 'sekretaris' | 'unit_dokumen') => {
  if (switching.value || profile === activeProfile.value) return;
  switching.value = true;
  try {
    if (process.client) {
      localStorage.setItem('active_profile', profile);
      localStorage.setItem('arsipku_active_profile', profile);
      window.dispatchEvent(new Event('active_profile_changed'));
      window.dispatchEvent(new Event('profile-changed'));
    }
    activeProfile.value = profile;
  } finally {
    switching.value = false;
  }
};

onMounted(() => {
  activeProfile.value = readStoredProfile();
});
</script>
