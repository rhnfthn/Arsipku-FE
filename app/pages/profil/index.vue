<template>
  <div class="min-h-screen pt-5 bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <!-- Header -->
      <div class="mb-8">
        <Heading variant="heading6b" class="text-mobile-md">Profil</Heading>
        <PageHeader :items="items" />
      </div>

      <!-- Banner Profil -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div class="p-6 flex flex-col sm:flex-row items-center gap-5">
          <ProfileAvatar size="xl"
            :persnum="(user?.persnum as any)"
            :alt="user?.nama || ''"
            avatar-class="ring-2 ring-primary-500/30 bg-primary-500 text-white font-bold flex items-center justify-center shadow-sm shrink-0">
            {{ getInitials(user?.nama || '') }}
          </ProfileAvatar>
          <div class="flex-1 text-center sm:text-left min-w-0">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {{ user?.nama || '-' }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {{ user?.positionText || '-' }}
            </p>
            <div class="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              <span
                class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 capitalize">
                <UIcon name="i-lucide-shield" class="w-3 h-3" />
                {{ user?.role || '-' }}
              </span>
              <span v-if="user?.companyText"
                class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <UIcon name="i-lucide-building-2" class="w-3 h-3" />
                {{ user?.companyText }}
              </span>
              <span v-if="user?.position_status_label"
                class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                <UIcon name="i-lucide-badge-check" class="w-3 h-3" />
                {{ user?.position_status_label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <!-- Kiri: Detail Akun -->
        <div>
          <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              class="p-5 border-b border-gray-100 dark:border-gray-700 bg-linear-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div class="flex items-center gap-3">
                <div
                  class="p-2.5 rounded-xl bg-primary-500 text-white shadow-sm w-11 h-11 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-user" class="w-6 h-6" />
                </div>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white leading-none">Detail Akun</h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Informasi lengkap pengguna</p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div class="space-y-4 text-left">
                <!-- Identitas -->
                <div class="space-y-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Identitas
                  </p>
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-id" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">NIP / Persnum</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.persnum || '-' }}
                      </p>
                    </div>
                  </div>
                  <div v-if="user?.nik" class="flex items-start gap-3">
                    <UIcon name="i-lucide-fingerprint" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">NIK</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.nik }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-700" />

                <!-- Jabatan & Unit -->
                <div class="space-y-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Jabatan & Unit
                  </p>
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-briefcase" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Jabatan</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.positionText || '-' }}
                      </p>
                    </div>
                  </div>
                  <div v-if="user?.organizationText" class="flex items-start gap-3">
                    <UIcon name="i-lucide-network" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Organisasi</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.organizationText }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-building-2" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Perusahaan</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.companyText || '-' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Area</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.areaText || '-' }}
                        <span v-if="user?.subAreaText" class="text-gray-400 dark:text-gray-500 font-normal">
                          / {{ user?.subAreaText }}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-100 dark:border-gray-700" />

                <!-- Atasan
                <div v-if="user?.atasan_langsung" class="space-y-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Atasan Langsung
                  </p>
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-user-check" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Nama</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ user?.atasan_langsung?.nama || user?.atasan_langsung?.name || '-' }}
                      </p>
                      <p v-if="user?.atasan_langsung?.position_text || user?.atasan_langsung?.positionText"
                        class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {{ user?.atasan_langsung?.position_text || user?.atasan_langsung?.positionText }}
                      </p>
                    </div>
                  </div>
                </div> -->

                <div v-if="user?.alamatInfo" class="border-t border-gray-100 dark:border-gray-700" />

                <!-- Alamat Kantor -->
                <div v-if="user?.alamatInfo" class="space-y-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Alamat Kantor
                  </p>
                  <div class="flex items-start gap-3">
                    <UIcon name="i-lucide-map" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ user?.alamatInfo?.kantor || '-' }}
                      </p>
                      <p v-if="user?.alamatInfo?.gedung || user?.alamatInfo?.kota"
                        class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span v-if="user?.alamatInfo?.gedung">{{ user?.alamatInfo?.gedung }}</span>
                        <span v-if="user?.alamatInfo?.gedung && user?.alamatInfo?.kota">, </span>
                        <span v-if="user?.alamatInfo?.kota">{{ user?.alamatInfo?.kota }}</span>
                      </p>
                      <p v-if="user?.alamatInfo?.alamat"
                        class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-line">
                        {{ plainAddress(user?.alamatInfo?.alamat) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kanan: Pengaturan AI -->
        <div>
          <!-- Loading -->
          <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <USkeleton class="h-6 w-48 rounded" />
            <USkeleton class="h-4 w-full rounded" />
            <USkeleton class="h-10 w-full rounded-lg" />
            <USkeleton class="h-9 w-40 rounded-lg" />
          </div>

          <div v-else
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              class="p-5 border-b border-gray-100 dark:border-gray-700 bg-linear-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div class="flex items-center gap-3">
                <div
                  class="p-2.5 rounded-xl bg-primary-500 text-white shadow-sm w-11 h-11 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-bot" class="w-6 h-6" />
                </div>
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white leading-none">Pengaturan AI</h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Kelola API key Ollama untuk generate draf naskah
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6 space-y-6">
              <!-- Status -->
              <div
                class="flex items-center justify-between gap-4 px-4 py-4 rounded-xl border transition-colors"
                :class="config.hasKey
                  ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'">
                <div class="flex items-center gap-3">
                  <UIcon
                    :name="config.hasKey ? 'i-lucide-key-round' : 'i-lucide-server'"
                    class="w-5 h-5 shrink-0"
                    :class="config.hasKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'" />
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white">
                      {{ config.hasKey ? 'Memakai key sendiri' : 'Memakai key default server' }}
                    </p>
                    <p v-if="config.hasKey && config.keyMasked"
                      class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                      {{ config.keyMasked }}
                    </p>
                    <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Set key sendiri untuk pemakaian per-user
                    </p>
                  </div>
                </div>
                <span
                  class="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                  :class="config.hasKey
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
                  {{ config.hasKey ? 'Aktif' : 'Default' }}
                </span>
              </div>

              <!-- Info -->
              <div
                class="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900">
                <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                <div class="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
                  <span class="font-semibold block mb-1">Informasi</span>
                  <p>
                    API key disimpan per user. Jika kosong, sistem otomatis memakai key default server.
                    Key hanya dipakai saat generate draf dan tidak pernah ditampilkan utuh setelah disimpan.
                  </p>
                </div>
              </div>

              <!-- Form -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key Ollama
                  </label>
                  <input v-model="apiKeyInput" type="password"
                    placeholder="Masukkan API key Ollama"
                    :disabled="loading"
                    class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-200 pl-3 pr-10 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50" />
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <button @click="handleSave" :disabled="loading || apiKeyInput.trim() === ''"
                    class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <UIcon name="i-lucide-save" class="w-4 h-4" />
                    {{ loading ? 'Menyimpan...' : 'Simpan' }}
                  </button>

                  <button v-if="config.hasKey" @click="handleClear" :disabled="loading"
                    class="flex items-center gap-2 px-5 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    Hapus Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui';

const items = [
  { label: 'Home', to: '/' },
  { label: 'Profil' },
] satisfies BreadcrumbItem[];

const { user } = useAuth();
const { get, save, loading } = useUserAiConfig();
const toast = useToast();

const config = ref<{ hasKey: boolean; keyMasked: string | null }>({
  hasKey: false,
  keyMasked: null,
});
const apiKeyInput = ref('');
const isLoading = ref(true);

const getInitials = (n: string) =>
  n ? n.trim().split(' ').slice(0, 2).map((x) => (x[0] ?? '').toUpperCase()).join('') : '?';

const plainAddress = (raw: string) =>
  (raw || '')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');

const loadConfig = async () => {
  try {
    config.value = await get();
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal memuat konfigurasi', color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  try {
    config.value = await save(apiKeyInput.value);
    apiKeyInput.value = '';
    toast.add({ title: 'Tersimpan', description: 'API key AI berhasil disimpan', color: 'success' });
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menyimpan API key', color: 'error' });
  }
};

const handleClear = async () => {
  try {
    config.value = await save('');
    apiKeyInput.value = '';
    toast.add({ title: 'Dihapus', description: 'API key AI dihapus, kembali ke key default', color: 'success' });
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e?.message || 'Gagal menghapus API key', color: 'error' });
  }
};

onMounted(loadConfig);
</script>
