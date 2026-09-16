<template>
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
    @click="closeMobile"
  ></div>

  <aside
    class="h-full z-50 flex transition-all duration-300 bg-[#F6F8FC] dark:bg-gray-900 shadow-xl md:shadow-none"
    :class="[
      isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      collapsed && !isMobile ? 'w-[72px]' : 'w-[320px] md:w-[320px]',
    ]"
  >
    <div
      class="w-[72px] flex flex-col items-center py-4 bg-primary-50 dark:bg-gray-950 h-full shrink-0 space-y-6 relative z-50 dark:border-r dark:border-gray-800"
    >
      <button
        @click="handleMenuClick"
        class="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 mb-2 transition-colors"
      >
        <UIcon
          :name="isMobile ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
          class="w-6 h-6 text-gray-700 dark:text-gray-200"
        />
      </button>

      <div class="flex flex-col gap-4 w-full items-center">
        <div
          v-for="app in apps"
          :key="`${isAdminOrSuperadmin ? 'admin' : 'user'}-${app.id}`"
          @click="setActiveApp(app.id)"
          @mouseenter="hoveredApp = app.id"
          @mouseleave="hoveredApp = null"
          class="group flex flex-col items-center gap-1 cursor-pointer relative w-full"
        >
          <div
            class="w-14 h-8 rounded-full flex items-center justify-center relative transition-colors duration-200"
            :class="
              activeApp === app.id
                ? 'bg-blue-200 dark:bg-gray-800'
                : 'hover:bg-white/50 bg-transparent'
            "
          >
            <UIcon
              :key="app.icon"
              :name="app.icon"
              class="w-6 h-6 transition-colors"
              :class="
                activeApp === app.id
                  ? 'text-gray-800 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              "
            />
            <div
              v-if="app.hasNotification"
              class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full border-2 border-white dark:border-gray-950 shadow-md z-10 animate-pulse"
            ></div>
          </div>
          <span
            class="text-[10px] font-medium transition-colors"
            :class="
              activeApp === app.id
                ? 'text-gray-900 font-bold dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            "
            >{{ app.label }}
          </span>

          <div
            v-if="collapsed && hoveredApp === app.id && !isMobile"
            class="absolute left-[60px] top-0 w-[260px] bg-[#F6F8FC] dark:bg-gray-800 shadow-2xl rounded-r-xl rounded-b-xl border border-gray-200 dark:border-gray-700 py-4 px-2 z-60 animate-fade-in origin-top-left"
          >
            <div class="px-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {{ app.label }}
              </h3>
            </div>
            <div class="max-h-[300px] overflow-y-auto custom-scrollbar">
              <SidebarItem
                v-for="(item, idx) in app.menus"
                :key="idx"
                :item="item"
                :collapsed="false"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Helpdesk button (bottom of icon bar) -->
      <div class="mt-auto pt-4 w-full flex flex-col items-center gap-1">
        <button
          @click="showHelpdeskConfirm = true"
          class="group flex flex-col items-center gap-1 cursor-pointer relative w-full"
          title="Helpdesk AirNav"
        >
          <div
            class="w-14 h-8 rounded-full flex items-center justify-center relative transition-colors duration-200 hover:bg-white/50 bg-transparent"
          >
            <UIcon
              name="i-lucide-headset"
              class="w-6 h-6 transition-colors text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-blue-400"
            />
          </div>
          <span
            class="text-[10px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
          >
            Helpdesk
          </span>
        </button>
      </div>
    </div>

    <div
      v-show="!collapsed || isMobile"
      class="flex-1 flex flex-col h-full overflow-hidden bg-[#F6F8FC] dark:bg-gray-900"
    >
      <NuxtLink
        to="/beranda"
        class="h-20 flex items-center px-4 gap-3 shrink-0 hover:opacity-80 transition-opacity"
      >
        <img src="/logoAirnav.png" alt="ArsipKu Logo" class="w-8 h-8" />
        <span class="text-xl text-gray-600 dark:text-gray-100 font-medium">ArsipKu</span>
      </NuxtLink>

      <div class="flex-1 overflow-y-auto hover:overflow-y-scroll custom-scrollbar">
        <SidebarItem
          v-for="(item, index) in currentAppData.menus"
          :key="index"
          :item="item"
          :collapsed="false"
        />

        <div v-if="activeApp.includes('utama')" class="mt-6 mb-4">
          <div class="flex items-center justify-between px-7 mb-2 group">
            <span class="text-[14px] font-bold text-gray-600 dark:text-gray-400">Label</span>
            <button
              @click="openCreateLabelModal"
              class="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              title="Tambah Label Baru"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-0.5">
            <div v-if="isLoadingLabels" class="px-7 space-y-2 mt-2">
              <USkeleton
                class="h-8 w-full rounded-full bg-gray-200 dark:bg-gray-800"
                v-for="n in 3"
                :key="n"
              />
            </div>
            <div v-else>
              <SidebarLabelItem
                v-for="rootLabel in labelTree"
                :key="rootLabel.id"
                :item="rootLabel"
                :level="0"
                :labelCounts="labelCounts"
                @edit="openEditLabelModal"
                @delete="openDeleteConfirm"
              />
            </div>
            <div
              v-if="!isLoadingLabels && labels.length === 0"
              class="px-7 py-2 text-xs text-gray-400 italic"
            >
              Belum ada label
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- MODAL ADD / EDIT LABEL -->
  <div v-if="showLabelModal" class="fixed inset-0 z-100 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 transition-opacity" @click="closeLabelModal"></div>
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden transform transition-all"
    >
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Label' : 'Label baru' }}
        </h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Masukkan nama label {{ isEditing ? '' : 'baru' }}:
          </label>
          <input
            v-model="labelForm.nama"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 dark:text-white"
            placeholder="Contoh: Penting"
          />
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="labelForm.isNested"
            id="check-nest"
            type="checkbox"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="check-nest" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Pilih label parent:
          </label>
        </div>
        <div>
          <select
            v-model="labelForm.parentId"
            :disabled="!labelForm.isNested"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400"
          >
            <option value="">Pilih Induk</option>
            <option v-for="l in availableParents" :key="l.id" :value="l.id">
              {{ l.nama }}
            </option>
          </select>
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-end gap-3">
        <button
          @click="closeLabelModal"
          class="px-4 py-2 text-sm font-medium text-primary-600 bg-transparent hover:bg-primary-50 rounded-md transition-colors"
        >
          Batal
        </button>
        <button
          @click="saveLabel"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 rounded-md shadow-sm transition-colors"
          :disabled="!labelForm.nama || isProcessing"
        >
          {{ isProcessing ? 'Menyimpan...' : isEditing ? 'Simpan' : 'Buat' }}
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL CONFIRM DELETE LABEL -->
  <div v-if="showDeleteModal" class="fixed inset-0 z-100 flex items-center justify-center p-4">
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="showDeleteModal = false"
    ></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm relative z-10 p-6">
      <div class="text-center">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="mx-auto h-12 w-12 text-red-500 mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Hapus Label?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Apakah Anda yakin ingin menghapus label "<strong>{{ labelToDelete?.nama }}</strong
          >"? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Batal
          </button>
          <button
            @click="confirmDelete"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            :disabled="isProcessing"
          >
            {{ isProcessing ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Helpdesk Confirmation Dialog -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-150"
  >
    <div
      v-if="showHelpdeskConfirm"
      class="fixed inset-0 z-200 flex items-center justify-center p-4"
    >
      <div class="fixed inset-0 bg-black/40" @click="showHelpdeskConfirm = false"></div>

      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8 text-center"
      >
        <div
          class="w-14 h-14 mx-auto rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4"
        >
          <UIcon name="i-lucide-headset" class="w-7 h-7 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Buka Helpdesk?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Anda akan diarahkan ke portal Helpdesk AirNav di tab baru.
        </p>
        <div class="flex gap-3">
          <button
            @click="showHelpdeskConfirm = false"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            @click="openHelpdesk"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  onUnmounted,
  nextTick,
  reactive,
} from 'vue';
import { useRoute } from 'vue-router';

import { useAuth } from '~/composables/useAuth';
import { useDelegationMode } from '~/composables/useDelegationMode';
import { usePenomoran } from '~/composables/usePenomoran';
import { useUsulanAksesBerkasCounts } from '~/composables/useUsulanAksesBerkasCounts';
import { useNaskahShareCounts } from '~/composables/useNaskahShareCounts';
import { useInboxCount } from '~/composables/useInboxCount';
import { useNotifications } from '~/composables/useNotifications';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useLabel } from '~/composables/useLabel';
import { useApi } from '~/composables/useApi';
import { useRealtimeSocket } from '~/composables/useRealtimeSocket';
import { useDigsig } from '~/composables/useDigsig';
import { usePemeliharaanAccess } from '~/composables/usePemeliharaanAccess';
import { buildLabelTree } from '~/utils/treeHelper';
import SidebarLabelItem from '~/components/SidebarLabelItem.vue';

const { user, getProfile, hasRole, hasPermission, isSuperadmin, isLegalRole } = useAuth();
const { isReadOnly, activePositionStatus } = useDelegationMode();
const { adminCounts, userCounts, getNomorRequestCountAdmin, getNomorRequestCountUser } =
  usePenomoran();

// ── Usulan Akses Berkas counts (badge notifikasi) ──
// Counts sudah exclude usulan yang viewed (filter di BE service getCounts).
const { counts: usulanCounts, fetchCounts: fetchUsulanCounts } = useUsulanAksesBerkasCounts();
const { counts: shareCounts, fetchCounts: fetchShareCounts } = useNaskahShareCounts();
const { unreadCount, fetchInboxCount } = useInboxCount();
const {
  sdeMasalUnreadCount,
  notifications,
  fetchNotifications,
} = useNotifications();
const { fetchFolders, fetchVerificationFolders } = useSdeMasal();
const { apiGet } = useApi();
const { bsreAlert } = useDigsig();
const {
  labels,
  labelCounts,
  isLoadingLabels,
  fetchLabels,
  fetchLabelCounts,
  createLabel,
  updateLabel,
  deleteLabel,
} = useLabel();

// ── Realtime WebSocket (menggantikan polling 30 detik) ──
const {
  inboxCount: rtInboxCount,
  labelCounts: rtLabelCounts,
  bsreAlert: rtBsreAlert,
  nomorCounts: rtNomorCounts,
  naskahDinasVerifikatorWaitingCount: rtVerifikatorCount,
  arsipPersetujuanWaitingCount: rtArsipPersetujuanCount,
  naskahLainnyaPersetujuanWaitingCount: naskahLainnyaPersetujuanCount,
  naskahLainnyaLegalDraftingWaitingCount: legalDraftingCount,
  correspondenceRoutingUpdate,
  init: rtInit,
  destroy: rtDestroy,
} = useRealtimeSocket();

const labelTree = computed(() => labels.value);
const route = useRoute();
const { t } = useI18n();

// ─── Role helpers ─────────────────────────────────────────────────────────────

const isAdminOrSuperadmin = computed(() => hasRole('SUPERADMIN') || hasRole('ADMIN'));
const { canPemberkasan, canPersetujuan } = usePemeliharaanAccess();
const {
  canCreateSdi,
  fetchCapabilities: fetchRoutingCapabilities,
  invalidateCapabilities: invalidateRoutingCapabilities,
} = useCorrespondenceRoutingAccess();

const hasBodTag = computed(() => !!user.value?.bodTag?.trim());

// ─── Pindah Profile (Sekretaris / Unit Dokumen) ──────────────────────────────
// User dengan delegasi di organization_tu (sekretaris_delegasi / unit_dokumen)
// bisa beralih profile. Menu "Kelola" hanya tampil saat profile aktif
// 'sekretaris' atau 'unit_dokumen'; disembunyikan saat 'akun_asli'.
const tuRoles = computed(() => {
  const roles = user.value?.tuRoles;
  return Array.isArray(roles) ? roles : [];
});
const isTuRole = computed(() => tuRoles.value.includes('tu'));
const isSekretarisRole = computed(() => tuRoles.value.includes('sekretaris'));

// Deteksi delegasi: user punya role sekretaris ATAU unit_dokumen (tu).
const hasDelegationProfile = computed(
  () => isSekretarisRole.value || isTuRole.value || !!user.value?.has_secretary_delegation
);

// Baca active_profile dari localStorage (sumber utama), default 'akun_asli'.
const readStoredProfile = () => {
  if (process.client) {
    const stored =
      localStorage.getItem('active_profile') || localStorage.getItem('arsipku_active_profile');
    if (stored === 'akun_asli' || stored === 'sekretaris' || stored === 'unit_dokumen')
      return stored;
  }
  return 'akun_asli';
};
const currentProfile = ref(readStoredProfile());
const syncProfileFromStorage = () => {
  currentProfile.value = readStoredProfile();
};

const activeProfile = computed(() => {
  if (
    currentProfile.value === 'akun_asli' ||
    currentProfile.value === 'sekretaris' ||
    currentProfile.value === 'unit_dokumen'
  ) {
    return currentProfile.value;
  }
  const fromUser = user.value?.active_profile;
  if (fromUser === 'akun_asli' || fromUser === 'sekretaris' || fromUser === 'unit_dokumen')
    return fromUser;
  return 'akun_asli';
});

// Menu "Kelola" tampil jika user TIDAK punya delegasi profile (perilaku normal),
// ATAU jika punya delegasi dan profile aktif = 'sekretaris' / 'unit_dokumen'.
const showKelolaMenu = computed(
  () =>
    !hasDelegationProfile.value ||
    activeProfile.value === 'sekretaris' ||
    activeProfile.value === 'unit_dokumen'
);

// Cek apakah user pernah dipilih sebagai atasan managerial di usulan pemindahan arsip
// Jika ya, user berhak melihat menu "Verifikasi Usulan" meskipun role-nya USER
const isAtasanManagerialUsulan = ref(false);
const isAtasanManagerialTuUsulan = ref(false);
const checkAtasanManagerialUsulan = async () => {
  try {
    const res = await apiGet(
      '/transfer-active-to-inactive/is-atasan',
      {
        validateStatus: () => true,
      },
      { skipCache: true }
    );
    isAtasanManagerialUsulan.value = res?.data?.isAtasan ?? false;
  } catch {
    isAtasanManagerialUsulan.value = false;
  }
};

// Cek apakah user terdaftar sebagai atasan TU di usulan apapun (tuApprovalLevels).
// Jika ya, user berhak melihat menu "Verifikasi Persetujuan" (TU side).
const checkAtasanManagerialTuUsulan = async () => {
  try {
    const res = await apiGet(
      '/tu/notifikasi-usulan/is-atasan-tu',
      {
        validateStatus: () => true,
      },
      { skipCache: true }
    );
    isAtasanManagerialTuUsulan.value = res?.data?.isAtasanTu ?? res?.isAtasanTu ?? false;
  } catch {
    isAtasanManagerialTuUsulan.value = false;
  }
};

// Cek apakah user pernah dipilih sebagai atasan managerial di penyusutan.
// Jika ya, user berhak melihat menu "Verifikasi Penyusutan".
const isAtasanManagerialPenyusutan = ref(false);
const checkAtasanManagerialPenyusutan = async () => {
  try {
    const res = await apiGet('/penyusutan/is-atasan', {}, { skipCache: true });
    isAtasanManagerialPenyusutan.value = res?.data?.isAtasan ?? res?.isAtasan ?? false;
  } catch {
    isAtasanManagerialPenyusutan.value = false;
  }
};

// ─── Count fetching ───────────────────────────────────────────────────────────
// Nomor count sekarang sepenuhnya dari WebSocket (realtime:summary + nomor:count event).
// Tidak ada lagi REST fallback ke /admin/nomor-request-count atau /nomor-request-count.

// Sinkronkan state global dari WebSocket realtime ke composable lama
// agar UI lain (yang masih baca unreadCount / labelCounts / bsreAlert) tetap up-to-date.
watch(
  rtInboxCount,
  (val) => {
    if (typeof val === 'number') unreadCount.value = val;
  },
  { immediate: true }
);

watch(
  rtLabelCounts,
  (val) => {
    if (val && typeof val === 'object') labelCounts.value = val;
  },
  { immediate: true }
);

watch(
  rtBsreAlert,
  (val) => {
    if (val) bsreAlert.value = val;
  },
  { deep: true, immediate: true }
);

// Saat nomor count event datang dari WebSocket, langsung update adminCounts/userCounts
// dari payload event (backend sudah kirim data lengkap, bukan { refresh: true }).
watch(
  rtNomorCounts,
  (val) => {
    if (val?.admin) adminCounts.value = { ...adminCounts.value, ...val.admin };
    if (val?.user) userCounts.value = { ...userCounts.value, ...val.user };
  },
  { deep: true, immediate: true }
);

watch(correspondenceRoutingUpdate, () => {
  invalidateRoutingCapabilities();
  if (!['BOD-2', 'BOD-3'].includes(String(user.value?.bodTag ?? ''))) return;
  fetchRoutingCapabilities(true).catch(() => {});
});

// Verifikator count event sudah membawa payload lengkap (waiting number),
// UI langsung baca dari rtVerifikatorCount — tidak perlu REST fallback.

// Watch user — hanya fetch label tree (tidak ada count fetch di sini, biar tidak overlap dengan polling).
watch(
  () => user.value,
  (newUser) => {
    if (newUser) {
      fetchLabels();
      // Connect WebSocket realtime — initial summary akan kirim semua count
      // (inbox, label, bsre, verifikator, nomor admin + user)
      rtInit();
      // Cek apakah user adalah atasan managerial di usulan pemindahan arsip
      checkAtasanManagerialUsulan();
      // Cek apakah user terdaftar sebagai atasan TU di usulan apapun
      checkAtasanManagerialTuUsulan();
      // Cek apakah user adalah atasan managerial di penyusutan
      checkAtasanManagerialPenyusutan();
      if (['BOD-2', 'BOD-3'].includes(String(newUser.bodTag ?? '')))
        fetchRoutingCapabilities().catch(() => {});
    }
  },
  { immediate: true }
);

// Cleanup socket saat user logout
watch(
  () => (process.client ? localStorage.getItem('token') : null),
  (token) => {
    if (!token) rtDestroy();
  }
);

onMounted(async () => {
  try {
    if (!user.value) await getProfile();
    await nextTick();
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    // Sinkronkan profile aktif dari localStorage + listen perubahan (tanpa reload).
    syncProfileFromStorage();
    window.addEventListener('storage', syncProfileFromStorage);
    window.addEventListener('profile-changed', syncProfileFromStorage);
    window.addEventListener('active_profile_changed', syncProfileFromStorage);
    // fetchLabels dan rtInit sudah dipanggil dari watch(user, immediate).
    // Fetch usulan akses berkas counts untuk badge sidebar
    if (hasPermission('usulan-akses-berkas', 'read')) fetchUsulanCounts().catch(() => {});
    // Fetch share diterima counts untuk badge sidebar
    if (hasPermission('naskah-share', 'read')) fetchShareCounts().catch(() => {});
    // Sinkronkan badge SDE Massal dengan folder yang benar-benar menunggu aksi.
    await fetchNotifications(1, 100, true);
    await refreshSdeMasalCounts();
    // Count Persetujuan dan Legal Drafting dikirim lewat initial WebSocket summary
    // lalu diperbarui setiap workflow naskah berubah.
  } catch (error) {
    console.error('❌ Error in sidebar mount:', error);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize);
    window.removeEventListener('storage', syncProfileFromStorage);
    window.removeEventListener('profile-changed', syncProfileFromStorage);
    window.removeEventListener('active_profile_changed', syncProfileFromStorage);
  }
  // Socket cleanup di-handle oleh watch(token) saat logout.
  // Jangan rtDestroy() di sini karena Sidebar bisa unmount/remount
  // saat route change tanpa user logout.
});

// ─── Props / emits ────────────────────────────────────────────────────────────

const props = defineProps({ collapsed: Boolean });
const emit = defineEmits(['update:collapsed']);

const isMobileOpen = ref(false);
const isMobile = ref(false);
const activeApp = ref('');
const hoveredApp = ref(null);

const hasInboxUnread = computed(() => unreadCount.value > 0);
const sdeMasalPengajuanCount = ref(0);
const sdeMasalVerificationCount = ref(0);

const getUnreadSdeMasalNotifications = () =>
  notifications.value.filter((notification) => {
    const folderId = notification.data?.folderId || notification.data?.folder_id;
    return Boolean(
      !notification.isRead &&
      notification.data?.category === 'SDE_MASAL' &&
      folderId,
    );
  });

const refreshSdeMasalCounts = async () => {
  try {
    const [creatorResponse, verificationFolders] = await Promise.all([
      fetchFolders({ scope: 'creator', page: 1, limit: 100 }),
      fetchVerificationFolders(),
    ]);
    const creatorFolderIds = new Set(
      (creatorResponse?.data || []).map((folder) => String(folder.id)),
    );
    const verificationFolderIds = new Set(
      verificationFolders
        .filter((folder) =>
          folder?.workflowRole === 'VERIFIKATOR' &&
          Number(folder?.waitingCount || 0) > 0,
        )
        .map((folder) => String(folder.id)),
    );

    const countUnreadFolders = (folderIds) =>
      new Set(
        getUnreadSdeMasalNotifications()
          .map((notification) =>
            String(notification.data?.folderId || notification.data?.folder_id),
          )
          .filter((folderId) => folderIds.has(folderId)),
      ).size;

    // Pengajuan: perubahan yang kembali ke konseptor, termasuk status
    // DIKEMBALIKAN. Verifikasi: folder baru yang sedang menunggu giliran.
    sdeMasalPengajuanCount.value = countUnreadFolders(creatorFolderIds);
    sdeMasalVerificationCount.value = countUnreadFolders(verificationFolderIds);
  } catch {
    // Jangan menampilkan badge palsu ketika daftar folder gagal dimuat.
    sdeMasalPengajuanCount.value = 0;
    sdeMasalVerificationCount.value = 0;
  }
};

watch(sdeMasalUnreadCount, async () => {
  await fetchNotifications(1, 100, true);
  await refreshSdeMasalCounts();
});

watch(
  () => route.path,
  async (path) => {
    if (path === '/korespondensi/sde-masal/verifikasi') {
      await fetchNotifications(1, 100, true);
    }
    await refreshSdeMasalCounts();
  },
);

// ─── Menus ────────────────────────────────────────────────────────────────────

const tulisChildrenByBod = computed(() => {
  const tag = user.value?.bodTag ?? '';
  const all = [
    {
      label: t('nota_dinas'),
      to: '/korespondensi/tulis/nota-dinas',
      permission: { resource: 'utama.tulis.nota-dinas', action: 'read' },
    },
    {
      label: t('disposisi'),
      to: '/korespondensi/tulis/disposisi',
      permission: { resource: 'utama.tulis.disposisi', action: 'read' },
    },
    {
      label: t('surat_dinas_internal'),
      to: '/korespondensi/tulis/surat-dinas-internal',
      permission: { resource: 'utama.tulis.surat-dinas-internal', action: 'read' },
    },
    {
      label: t('surat_dinas_eksternal'),
      to: '/korespondensi/tulis/surat-dinas-eksternal',
      permission: { resource: 'utama.tulis.surat-dinas-eksternal', action: 'read' },
    },
    {
      label: t('kajian'),
      to: '/korespondensi/tulis/kajian',
      permission: { resource: 'utama.tulis.kajian', action: 'read' },
    },
  ];
  if (tag === 'BOD' || tag === 'BOD-1') return all;
  if (tag === 'BOD-2' || tag === 'BOD-3') {
    return all.filter(
      (i) =>
        ![t('surat_dinas_eksternal'), t('kajian')].includes(i.label) &&
        (i.label !== t('surat_dinas_internal') || canCreateSdi.value)
    );
  }
  return all.filter((i) => i.label === t('kajian'));
});

const tulisMenu = computed(() => ({
  label: t('tulis'),
  to: '/korespondensi/tulis',
  icon: 'i-lucide-edit',
  permission: { resource: 'utama.tulis.nota-dinas', action: 'read' },
  children: tulisChildrenByBod.value,
}));

const verifikatorMenu = computed(() => ({
  label: 'Verifikasi Naskah',
  to: '/naskah-dinas/verifikator',
  icon: 'i-lucide-file-check-2',
  permission: { resource: 'verifikasi-naskah', action: 'read' },
  badge: rtVerifikatorCount.value > 0 ? rtVerifikatorCount.value : null,
}));

const sdeMasalMenu = computed(() => ({
  label: 'SDE Massal',
  icon: 'i-lucide-files',
  badge:
    sdeMasalPengajuanCount.value + sdeMasalVerificationCount.value > 0
      ? sdeMasalPengajuanCount.value + sdeMasalVerificationCount.value
      : null,
  children: [
    {
      label: 'Pengajuan',
      to: '/korespondensi/sde-masal',
      exact: true,
      badge: sdeMasalPengajuanCount.value > 0 ? sdeMasalPengajuanCount.value : null,
    },
    {
      label: 'Verifikasi',
      to: '/korespondensi/sde-masal/verifikasi',
      exact: true,
      badge: sdeMasalVerificationCount.value > 0 ? sdeMasalVerificationCount.value : null,
    },
  ],
}));

const userMenuUtama = computed(() => [
  {
    label: t('beranda'),
    to: '/beranda',
    icon: 'i-lucide-layout-dashboard',
    permission: { resource: 'utama.beranda', action: 'read' },
  },
  ...(isReadOnly.value ? [] : [tulisMenu.value]),
  {
    label: 'Naskah Lainnya',
    to: '/naskah-lainnya',
    icon: 'i-lucide-file-stack',
    permission: { resource: 'utama.tulis.naskah-lainnya', action: 'read' },
    children: [
      { label: 'Tulis Naskah', to: '/naskah-lainnya/tulis' },
      { label: 'Daftar Naskah', to: '/naskah-lainnya', exact: true },
      {
        label: 'Persetujuan',
        to: '/naskah-lainnya/persetujuan',
        badge: naskahLainnyaPersetujuanCount.value > 0 ? naskahLainnyaPersetujuanCount.value : null,
      },
      ...(isLegalRole.value
        ? [
            {
              label: 'Legal Drafting',
              to: '/naskah-lainnya/legal-drafting',
              badge: legalDraftingCount.value > 0 ? legalDraftingCount.value : null,
            },
          ]
        : []),
    ],
  },
  {
    label: t('kotak_masuk'),
    to: '/korespondensi/kotak-masuk',
    icon: 'i-lucide-inbox',
    permission: { resource: 'utama.kotak-masuk', action: 'read' },
    badge: unreadCount.value > 0 ? unreadCount.value : null,
  },
  {
    label: t('terkirim'),
    to: '/korespondensi/terkirim',
    icon: 'i-lucide-send',
    permission: { resource: 'utama.terkirim', action: 'read' },
  },
  {
    label: t('tertunda'),
    to: '/korespondensi/tertunda',
    icon: 'i-lucide-file-clock',
    permission: { resource: 'utama.tertunda', action: 'read' },
  },
  {
    ...sdeMasalMenu.value,
  },
  {
    label: t('draft'),
    icon: 'i-lucide-file-text',
    permission: { resource: 'utama.draft', action: 'read' },
    children: [
      {
        label: 'Korespondensi',
        to: '/korespondensi/draf',
        permission: { resource: 'utama.draft', action: 'read' },
      },
      {
        label: 'Naskah Lainnya',
        to: '/naskah-lainnya/draf',
        permission: { resource: 'utama.draft', action: 'read' },
      },
    ],
  },
  {
    label: t('berbagi', 'Berbagi'),
    icon: 'i-lucide-share-2',
    children: [
      { label: 'Saya Bagikan', to: '/shared/saya-bagikan' },
      {
        label: 'Dibagikan Kepada Saya',
        to: '/shared/dibagikan-kepada-saya',
        badge: shareCounts.value.unread > 0 ? shareCounts.value.unread : null,
      },
    ],
  },
]);

const userMenuUtilitas = computed(() => {
  const badgeCount = userCounts.value.belum_diajukan || 0;
  const menus = [
    {
      label: t('digsig'),
      icon: 'i-lucide-signature',
      permission: { resource: 'digsig', action: 'read-verifikasi-dokumen' },
      children: [
        {
          label: t('verifikasi'),
          to: '/digsig/verifikasi-dokumen',
          permission: { resource: 'digsig', action: 'read-verifikasi-dokumen' },
        },
        {
          label: t('sign'),
          to: '/digsig/penandatanganan',
          permission: { resource: 'digsig', action: 'read-penandatanganan' },
        },
        {
          label: t('check_dokumen'),
          to: '/digsig/cek-dokumen',
          permission: { resource: 'digsig', action: 'read-cek-dokumen' },
        },
      ],
    },
    {
      label: t('short_url'),
      to: '/penyingkat-tautan',
      icon: 'i-lucide-link',
      permission: { resource: 'penyingkat-tautan', action: 'read' },
    },
    {
      label: t('mail_service'),
      icon: 'i-lucide-mail',
      permission: { resource: 'layanan-email', action: 'read' },
      children: [
        {
          label: 'Kirim Email',
          to: '/layanan-email',
          exact: true,
          permission: { resource: 'layanan-email', action: 'read' },
        },
        {
          label: 'Log Email',
          to: '/layanan-email/log',
          permission: { resource: 'layanan-email', action: 'read-log' },
        },
      ],
    },
    {
      label: t('template'),
      to: '/template',
      icon: 'i-lucide-copy',
      permission: { resource: 'template', action: 'read' },
    },
    verifikatorMenu.value,
    {
      label: t('titelatur_inggris'),
      to: '/titelatur',
      icon: 'i-lucide-languages',
      permission: { resource: 'titelatur', action: 'read' },
    },
    {
      label: t('tertuju'),
      to: '/utilitas/tertuju',
      icon: 'i-lucide-list',
    },
  ];

  if (hasBodTag.value) {
    menus.push({
      label: t('penomoran') || 'Penomoran',
      icon: 'i-lucide-hash',
      permission: { resource: 'penomoran', action: 'read' },
      children: [
        {
          label: t('usulan') || 'Usulan',
          to: '/usulan-penomoran',
          permission: { resource: 'penomoran', action: 'read-usulan' },
          badge: userCounts.value.draft > 0 ? userCounts.value.draft : null,
        },
        {
          label: t('Persetujuan') || 'Persetujuan',
          to: '/persetujuan-penomoran',
          permission: { resource: 'penomoran', action: 'read-persetujuan' },
          badge:
            (userCounts.value.menunggu_persetujuan ?? 0) > 0
              ? userCounts.value.menunggu_persetujuan
              : null,
        },
      ],
    });
  } else {
    menus.push({
      label: t('usulan-penomoran') || 'Usulan Penomoran',
      to: '/usulan-penomoran',
      icon: 'i-lucide-hash',
      permission: { resource: 'penomoran', action: 'read' },
      badge: userCounts.value.draft > 0 ? userCounts.value.draft : null,
    });
  }

  return menus;
});

const faqMenuUser = computed(() => [
  {
    label: 'FAQ',
    to: '/faq/menu',
    icon: 'i-lucide-circle-help',
    permission: { resource: 'faq', action: 'read' },
  },
  {
    label: 'Pedoman',
    to: '/pedoman/menu',
    icon: 'i-lucide-book-open',
    permission: { resource: 'pedoman', action: 'read' },
  },
]);

const faqMenuAdmin = computed(() => [
  {
    label: 'FAQ',
    to: '/faq/menu',
    icon: 'i-lucide-circle-help',
    permission: { resource: 'faq', action: 'read' },
  },
  {
    label: 'Manajemen FAQ',
    to: '/faq/manajemen',
    icon: 'i-lucide-file-question',
    permission: { resource: 'faq', action: 'read' },
  },
  {
    label: 'Pedoman',
    to: '/pedoman/menu',
    icon: 'i-lucide-book-open',
    permission: { resource: 'pedoman', action: 'read' },
  },
  {
    label: 'Manajemen Pedoman',
    to: '/pedoman/manajemen',
    icon: 'i-lucide-file-text',
    permission: { resource: 'pedoman', action: 'read' },
  },
]);

// ─── Tugas (section tersendiri, di bawah Utilitas) ────────────────────────────

const tugasMenu = computed(() => [
  {
    label: t('tugas_papan', 'Papan'),
    to: '/tugas',
    icon: 'i-lucide-kanban',
    permission: { resource: 'tugas', action: 'read' },
    // exact: /tugas adalah section-index — tanpa ini, prefix-match membuat
    // menu Papan ikut aktif saat user membuka /tugas/saya.
    exact: true,
  },
  {
    label: t('tugas_saya', 'Tugas Saya'),
    to: '/tugas/saya',
    icon: 'i-lucide-list-todo',
    permission: { resource: 'tugas', action: 'read' },
    // Badge: jumlah task aktif yang ditugaskan ke posisi ini (belum done).
    // Realtime via socket (summary + tugas:assigned-count), konsisten dengan
    // dot merah di ikon app Tugas.
    badge: rtTugasAssignedCount.value > 0 ? rtTugasAssignedCount.value : null,
  },
]);

// ─── Admin menus ──────────────────────────────────────────────────────────────

const adminMenuUtama = computed(() => [
  {
    label: t('beranda'),
    to: '/beranda',
    icon: 'i-lucide-layout-dashboard',
    permission: { resource: 'utama.beranda', action: 'read' },
  },
  ...(isReadOnly.value ? [] : [tulisMenu.value]),
  {
    label: 'Naskah Lainnya',
    to: '/naskah-lainnya',
    icon: 'i-lucide-file-stack',
    permission: { resource: 'utama.tulis.naskah-lainnya', action: 'read' },
    children: [
      { label: 'Tulis Naskah', to: '/naskah-lainnya/tulis' },
      { label: 'Daftar Naskah', to: '/naskah-lainnya', exact: true },
      {
        label: 'Persetujuan',
        to: '/naskah-lainnya/persetujuan',
        badge: naskahLainnyaPersetujuanCount.value > 0 ? naskahLainnyaPersetujuanCount.value : null,
      },
      ...(isLegalRole.value
        ? [
            {
              label: 'Legal Drafting',
              to: '/naskah-lainnya/legal-drafting',
              badge: legalDraftingCount.value > 0 ? legalDraftingCount.value : null,
            },
          ]
        : []),
    ],
  },
  {
    label: t('kotak_masuk'),
    to: '/korespondensi/kotak-masuk',
    icon: 'i-lucide-inbox',
    permission: { resource: 'utama.kotak-masuk', action: 'read' },
    badge: unreadCount.value > 0 ? unreadCount.value : null,
  },
  {
    label: t('terkirim'),
    to: '/korespondensi/terkirim',
    icon: 'i-lucide-send',
    permission: { resource: 'utama.terkirim', action: 'read' },
  },
  {
    label: t('tertunda'),
    to: '/korespondensi/tertunda',
    icon: 'i-lucide-file-clock',
    permission: { resource: 'utama.tertunda', action: 'read' },
  },
  {
    ...sdeMasalMenu.value,
  },
  {
    label: t('draft'),
    icon: 'i-lucide-file-text',
    permission: { resource: 'utama.draft', action: 'read' },
    children: [
      {
        label: 'Korespondensi',
        to: '/korespondensi/draf',
        permission: { resource: 'utama.draft', action: 'read' },
      },
      {
        label: 'Naskah Lainnya',
        to: '/naskah-lainnya/draf',
        permission: { resource: 'utama.draft', action: 'read' },
      },
    ],
  },
  {
    label: t('berbagi', 'Berbagi'),
    icon: 'i-lucide-share-2',
    children: [
      { label: 'Saya Bagikan', to: '/shared/saya-bagikan' },
      {
        label: 'Dibagikan Kepada Saya',
        to: '/shared/dibagikan-kepada-saya',
        badge: shareCounts.value.unread > 0 ? shareCounts.value.unread : null,
      },
    ],
  },
]);

const adminMenuUtilitas = computed(() => {
  const menus = [
    {
      label: t('digsig'),
      icon: 'i-lucide-signature',
      permission: { resource: 'digsig', action: 'read-verifikasi-dokumen' },
      children: [
        {
          label: t('verifikasi'),
          to: '/digsig/verifikasi-dokumen',
          permission: { resource: 'digsig', action: 'read-verifikasi-dokumen' },
        },
        {
          label: t('sign'),
          to: '/digsig/penandatanganan',
          permission: { resource: 'digsig', action: 'read-penandatanganan' },
        },
        {
          label: t('check_dokumen'),
          to: '/digsig/cek-dokumen',
          permission: { resource: 'digsig', action: 'read-cek-dokumen' },
        },
        {
          label: 'Log Digsig',
          to: '/digsig/log-digsig',
          permission: { resource: 'digsig', action: 'read-log-disdig' },
        },
      ],
    },
    {
      label: t('short_url'),
      to: '/penyingkat-tautan',
      icon: 'i-lucide-link',
      permission: { resource: 'penyingkat-tautan', action: 'read' },
    },
    {
      label: t('mail_service'),
      icon: 'i-lucide-mail',
      permission: { resource: 'layanan-email', action: 'read' },
      children: [
        {
          label: 'Kirim Email',
          to: '/layanan-email',
          exact: true,
          permission: { resource: 'layanan-email', action: 'read' },
        },
        {
          label: 'Log Email',
          to: '/layanan-email/log',
          permission: { resource: 'layanan-email', action: 'read-log' },
        },
      ],
    },
    {
      label: t('template'),
      to: '/template',
      icon: 'i-lucide-copy',
      permission: { resource: 'template', action: 'read' },
    },
    verifikatorMenu.value,
  ];

  // if (hasBodTag.value) {
  //   menus.push({
  //     label: t('Persetujuan') || 'Persetujuan',
  //     to: '/persetujuan-penomoran',
  //     icon: 'i-lucide-stamp',
  //     badge:
  //       (userCounts.value.menunggu_persetujuan ?? 0) > 0
  //         ? userCounts.value.menunggu_persetujuan
  //         : null
  //   });
  // }

  return menus;
});

const adminMenuAdministrasi = computed(() => {
  const penomoranChildren = [
    {
      label: t('usulan'),
      to: '/penomoran/usulan',
      permission: { resource: 'penomoran', action: 'read-usulan' },
      badge: adminCounts.value.draft > 0 ? adminCounts.value.draft : null,
    },
  ];

  // Persetujuan di urutan ke-2, hanya kalau ada bodTag
  if (hasBodTag.value) {
    penomoranChildren.push({
      label: t('Persetujuan') || 'Persetujuan',
      to: '/persetujuan-penomoran',
      permission: { resource: 'penomoran', action: 'read-persetujuan' },
      badge:
        (userCounts.value.menunggu_persetujuan ?? 0) > 0
          ? userCounts.value.menunggu_persetujuan
          : null,
    });
  }

  penomoranChildren.push(
    {
      label: t('ver'),
      to: '/penomoran/verifikasi',
      permission: { resource: 'penomoran', action: 'read-verifikasi' },
      badge:
        adminCounts.value.menunggu_verifikasi > 0 ? adminCounts.value.menunggu_verifikasi : null,
    },
    {
      label: t('penomoran'),
      to: '/penomoran/nomor',
      permission: { resource: 'penomoran', action: 'read-penomoran' },
    }
  );

  const base = [
    {
      label: t('delegasi'),
      to: '/delegasi',
      icon: 'i-lucide-users',
      permission: { resource: 'delegasi', action: 'read' },
    },
    {
      label: t('titelatur_inggris'),
      to: '/titelatur',
      icon: 'i-lucide-languages',
      permission: { resource: 'titelatur', action: 'read' },
    },
    {
      label: t('penomoran'),
      icon: 'i-lucide-hash',
      permission: { resource: 'penomoran', action: 'read' },
      children: penomoranChildren,
    },
    {
      label: t('naskah_masuk'),
      to: '/naskah-dinas',
      icon: 'i-lucide-file-input',
      permission: { resource: 'naskah-masuk', action: 'read-verifikasi' },
    },
  ];

  if (!isSuperadmin.value) {
    base.push({
      label: t('tertuju'),
      to: '/administrasi/tertuju',
      icon: 'i-lucide-list',
    });
  }

  if (isSuperadmin.value) {
    base.push(
      {
        label: t('master_data'),
        icon: 'i-lucide-database',
        children: [
          {
            label: t('tertuju'),
            to: '/administrasi/datamaster/tertuju',
            permission: { resource: 'master-data', action: 'read-tertuju' },
          },
          {
            label: t('perusahaan'),
            to: '/master/perusahaan',
            icon: 'i-lucide-building-2',
            permission: { resource: 'master-data', action: 'read-perusahaan' },
          },
          {
            label: t('klasifikasi'),
            to: '/master/klasifikasi',
            permission: { resource: 'master-data', action: 'read-klasifikasi' },
          },
          {
            label: t('jenis'),
            to: '/master/jenis',
            permission: { resource: 'master-data', action: 'read-jenis' },
          },
          {
            label: t('grup_penerima') || 'Grup Penerima',
            to: '/master/grup-penerima',
            icon: 'i-lucide-users',
            permission: { resource: 'master-data', action: 'read-grup-penerima' },
          },
        ],
      },
      {
        label: t('rbac_management'),
        icon: 'i-lucide-shield-check',
        permission: { resource: 'role', action: 'read' },
        children: [
          {
            label: t('rbac_roles'),
            to: '/rbac/roles',
            icon: 'i-lucide-shield',
            permission: { resource: 'role', action: 'read' },
          },
          {
            label: t('rbac_permissions'),
            to: '/rbac/permissions',
            icon: 'i-lucide-key-round',
            permission: { resource: 'role', action: 'read' },
          },
          {
            label: t('rbac_resources'),
            to: '/rbac/resources',
            icon: 'i-lucide-box',
            permission: { resource: 'role', action: 'read' },
          },
          {
            label: t('rbac_users'),
            to: '/rbac/users',
            icon: 'i-lucide-user-cog',
            permission: { resource: 'user', action: 'read' },
          },
        ],
      },
      {
        label: t('konfigurasi'),
        to: '/konfigurasi-sistem',
        icon: 'i-lucide-settings-2',
        permission: { resource: 'konfigurasi', action: 'read' },
      },
      {
        label: 'Audit Trail',
        icon: 'i-lucide-file-search-2',
        children: [
          { label: 'Log Aktivitas', to: '/admin/audit' },
          { label: 'Anomali / Alert', to: '/admin/audit/anomaly' },
          { label: 'Laporan Audit', to: '/admin/audit/report' },
        ],
      }
    );
  }

  return base;
});

const adminMenuLaporan = computed(() => [
  {
    label: t('rekap'),
    to: '/laporan/rekap-naskah',
    icon: 'i-lucide-file-bar-chart-2',
    permission: { resource: 'laporan', action: 'read-rekap-naskah' },
  },
  {
    label: t('detail'),
    to: '/laporan/detail-naskah',
    icon: 'i-lucide-file-search',
    permission: { resource: 'laporan', action: 'read-detail-naskah' },
  },
  {
    label: t('naskah'),
    to: '/laporan/naskah-masuk',
    icon: 'i-lucide-folder-input',
    permission: { resource: 'laporan', action: 'read-naskah-masuk' },
  },
]);

// ─── Menu Kelola (Arsip Dinamis) ─────────────────────────────────────────────

const isManagerialPosition = computed(() => {
  const ps = activePositionStatus.value;
  if (ps === 'SE' || ps === 'PS' || ps === 'VI') return false;
  const posText = (user.value?.positionText || '').toUpperCase();
  if (posText.includes('EVP')) return true;
  if (posText.includes('AVP')) return true;
  if (
    posText.includes(' VP ') ||
    posText.startsWith('VP ') ||
    posText.endsWith(' VP') ||
    posText === 'VP'
  )
    return true;
  if (hasBodTag.value) return true; // BOD juga managerial
  return false;
});

// Cek apakah user adalah SE/PS (Sekretaris yang didelegasikan via switch role)
// ATAU punya role 'sekretaris' dari organization_tu (Unit TU)
const isSekretarisActor = computed(
  () =>
    activePositionStatus.value === 'SE' ||
    activePositionStatus.value === 'PS' ||
    isSekretarisRole.value
);

const unitDokumenKelolaMenus = computed(() => [
  {
    label: 'Pemeliharaan',
    icon: 'i-lucide-folder-cog',
    children: [
      {
        label: 'Pemberkasan',
        to: '/kelola/pemeliharaan/pemberkasan/berkas-saya',
        icon: 'i-lucide-folder-plus',
      },
      {
        label: 'Usulan Akses',
        to: '/kelola/penggunaan/usulan-akses-berkas',
        icon: 'i-lucide-folder-key',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Penerimaan Usulan',
        to: '/maintenance/penerimaan-usulan',
        icon: 'i-lucide-bell',
      },
      {
        label: 'Penataan Arsip Inaktif',
        to: '/maintenance/penataan-arsip-inaktif',
        icon: 'i-lucide-archive',
      },
    ],
  },
  {
    label: 'Penggunaan',
    icon: 'i-lucide-folder-open',
    children: [
      {
        label: 'Verifikasi Usulan',
        to: '/kelola/penggunaan/verifikasi-usulan',
        icon: 'i-lucide-file-check-2',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Pemberian',
        to: '/kelola/penggunaan/pemberian',
        icon: 'i-lucide-folder-check',
        badge:
          usulanCounts.value.aksesDiterbitkanBaru > 0
            ? usulanCounts.value.aksesDiterbitkanBaru
            : null,
      },
    ],
  },
  {
    label: 'Penyusutan',
    icon: 'i-lucide-file-minus',
    children: [
      {
        label: 'Pengajuan Penyusutan',
        to: '/maintenance/penyusutan/pengajuan-penyusutan',
        icon: 'i-lucide-list',
      },
      {
        label: 'Penataan dan Pemusnahan',
        to: '/maintenance/penyusutan/penataan-pemusnahan',
        icon: 'i-lucide-archive',
      },
      {
        label: 'Backup Status',
        to: '/maintenance/penyusutan/backup-status',
        icon: 'i-lucide-database',
      },
    ],
  },
]);

const sekretarisKelolaMenus = computed(() => [
  {
    label: 'Pemeliharaan',
    icon: 'i-lucide-folder-cog',
    children: [
      {
        label: 'Pemberkasan',
        to: '/kelola/pemeliharaan/pemberkasan/berkas-saya',
        icon: 'i-lucide-folder-plus',
      },
      {
        label: 'Pemindahan Arsip',
        to: '/maintenance/transfer-active-to-inactive-file',
        icon: 'i-lucide-file-up',
      },
    ],
  },
  {
    label: 'Penggunaan',
    icon: 'i-lucide-folder-open',
    children: [
      {
        label: 'Usulan Saya',
        to: '/kelola/penggunaan/usulan-saya',
        icon: 'i-lucide-file-plus',
        badge: usulanCounts.value.pilihBerkas > 0 ? usulanCounts.value.pilihBerkas : null,
      },
      {
        label: 'Verifikasi Usulan',
        to: '/kelola/penggunaan/verifikasi-usulan',
        icon: 'i-lucide-file-check-2',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Pemberian',
        to: '/kelola/penggunaan/pemberian',
        icon: 'i-lucide-folder-check',
        badge:
          usulanCounts.value.aksesDiterbitkanBaru > 0
            ? usulanCounts.value.aksesDiterbitkanBaru
            : null,
      },
    ],
  },
]);

const atasanManagerialSekretarisKelolaMenus = computed(() => [
  {
    label: 'Pemeliharaan',
    icon: 'i-lucide-folder-cog',
    children: [
      {
        label: 'Pemberkasan',
        to: '/kelola/pemeliharaan/pemberkasan/berkas-saya',
        icon: 'i-lucide-folder-plus',
      },
      {
        label: 'Persetujuan',
        to: '/kelola/pemeliharaan/persetujuan-pemberkasan',
        icon: 'i-lucide-file-check',
        badge: rtArsipPersetujuanCount.value > 0 ? rtArsipPersetujuanCount.value : null,
      },
      {
        label: 'Usulan Akses',
        to: '/kelola/penggunaan/usulan-akses-berkas',
        icon: 'i-lucide-folder-key',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Verifikasi Usulan',
        to: '/maintenance/verifikasi-usulan',
        icon: 'i-lucide-file-check-2',
      },
    ],
  },
  {
    label: 'Penggunaan',
    icon: 'i-lucide-folder-open',
    children: [
      {
        label: 'Verifikasi Usulan',
        to: '/kelola/penggunaan/verifikasi-usulan',
        icon: 'i-lucide-file-check-2',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Pemberian',
        to: '/kelola/penggunaan/pemberian',
        icon: 'i-lucide-folder-check',
        badge:
          usulanCounts.value.aksesDiterbitkanBaru > 0
            ? usulanCounts.value.aksesDiterbitkanBaru
            : null,
      },
    ],
  },
  {
    label: 'Penyusutan',
    icon: 'i-lucide-file-minus',
    children: [
      {
        label: 'Verifikasi Penyusutan',
        to: '/maintenance/penyusutan/verifikasi-penyusutan',
        icon: 'i-lucide-file-check',
      },
    ],
  },
]);

const atasanManagerialUnitDokumenKelolaMenus = computed(() => [
  {
    label: 'Pemeliharaan',
    icon: 'i-lucide-folder-cog',
    children: [
      {
        label: 'Pemberkasan',
        to: '/kelola/pemeliharaan/pemberkasan/berkas-saya',
        icon: 'i-lucide-folder-plus',
      },
      {
        label: 'Persetujuan',
        to: '/kelola/pemeliharaan/persetujuan-pemberkasan',
        icon: 'i-lucide-file-check',
        badge: rtArsipPersetujuanCount.value > 0 ? rtArsipPersetujuanCount.value : null,
      },
      {
        label: 'Usulan Akses',
        to: '/kelola/penggunaan/usulan-akses-berkas',
        icon: 'i-lucide-folder-key',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Verifikasi Persetujuan',
        to: '/maintenance/verifikasi-persetujuan-tu',
        icon: 'i-lucide-file-check-2',
      },
      {
        label: 'Verifikasi Usulan',
        to: '/maintenance/verifikasi-usulan',
        icon: 'i-lucide-file-check-2',
      },
    ],
  },
  {
    label: 'Penggunaan',
    icon: 'i-lucide-folder-open',
    children: [
      {
        label: 'Verifikasi Usulan',
        to: '/kelola/penggunaan/verifikasi-usulan',
        icon: 'i-lucide-file-check-2',
        badge:
          usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
      },
      {
        label: 'Pemberian',
        to: '/kelola/penggunaan/pemberian',
        icon: 'i-lucide-folder-check',
        badge:
          usulanCounts.value.aksesDiterbitkanBaru > 0
            ? usulanCounts.value.aksesDiterbitkanBaru
            : null,
      },
    ],
  },
  {
    label: 'Penyusutan',
    icon: 'i-lucide-file-minus',
    children: [
      {
        label: 'Verifikasi Penyusutan',
        to: '/maintenance/penyusutan/verifikasi-penyusutan',
        icon: 'i-lucide-file-check',
      },
    ],
  },
]);

// Pengguna yang hanya memiliki satu profile arsip bisa belum menyimpan
// `active_profile` di localStorage. Tetap gunakan role tunggal sebagai fallback
// agar menu Unit Dokumen/Sekretaris tidak jatuh ke menu Kelola umum.
const isUnitDokumenProfile = computed(
  () => activeProfile.value === 'unit_dokumen' || (isTuRole.value && !isSekretarisRole.value)
);
const isSekretarisProfile = computed(
  () => activeProfile.value === 'sekretaris' || (isSekretarisActor.value && !isTuRole.value)
);

const isAtasanManagerialSekretarisProfile = computed(
  () =>
    isSekretarisProfile.value &&
    (isManagerialPosition.value ||
      isAtasanManagerialUsulan.value ||
      isAtasanManagerialPenyusutan.value)
);
const isAtasanManagerialUnitDokumenProfile = computed(
  () =>
    // Penugasan di tuApprovalLevels adalah sumber otoritas untuk Atasan
    // Managerial Unit Dokumen, terlepas dari profile lokal yang sedang tersimpan.
    isAtasanManagerialTuUsulan.value ||
    (isUnitDokumenProfile.value &&
      (isManagerialPosition.value ||
        isAtasanManagerialUsulan.value ||
        isAtasanManagerialPenyusutan.value))
);

const profileKelolaMenus = computed(() => {
  if (isAtasanManagerialUnitDokumenProfile.value)
    return atasanManagerialUnitDokumenKelolaMenus.value;
  if (isAtasanManagerialSekretarisProfile.value) return atasanManagerialSekretarisKelolaMenus.value;
  if (isUnitDokumenProfile.value && isTuRole.value) return unitDokumenKelolaMenus.value;
  if (isSekretarisProfile.value && isSekretarisActor.value) return sekretarisKelolaMenus.value;
  return null;
});

// ── Menu Pemeliharaan (milik Fakhri — JANGAN UBAH) ──
// Struktur asli Fakhri: Pemberkasan + Persetujuan Pemberkasan
// Admin (SUPERADMIN/ADMIN) lihat keduanya, User biasa lihat Pemberkasan saja.

const adminMenuKelola = computed(() => {
  if (profileKelolaMenus.value) return profileKelolaMenus.value;

  const pemeliharaanChildren = [
    {
      label: 'Pemberkasan',
      to: '/kelola/pemeliharaan/pemberkasan/berkas-saya',
      icon: 'i-lucide-folder-plus',
      permission: { resource: 'pemeliharaan.pemberkasan', action: 'read' },
    },
    {
      label: 'Persetujuan',
      to: '/kelola/pemeliharaan/persetujuan-pemberkasan',
      icon: 'i-lucide-file-check',
      permission: { resource: 'pemeliharaan.verifikasi', action: 'read' },
      showIfCanPersetujuan: true,
      badge: rtArsipPersetujuanCount.value > 0 ? rtArsipPersetujuanCount.value : null,
    },
    {
      label: 'Usulan Akses',
      to: '/kelola/penggunaan/usulan-akses-berkas',
      icon: 'i-lucide-folder-key',
      permission: { resource: 'usulan-akses-berkas', action: 'read' },
      badge:
        usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
    },
    {
      label: 'Pemindahan Arsip',
      to: '/maintenance/transfer-active-to-inactive-file',
      icon: 'i-lucide-file-up',
      showIfSekretarisOnly: true,
    },
    {
      label: 'Penerimaan Usulan',
      to: '/maintenance/penerimaan-usulan',
      icon: 'i-lucide-bell',
      showIfTuRole: true,
    },
    {
      label: 'Penataan Arsip Inaktif',
      to: '/maintenance/penataan-arsip-inaktif',
      icon: 'i-lucide-archive',
      showIfTuRole: true,
    },
    {
      label: 'Verifikasi Persetujuan',
      to: '/maintenance/verifikasi-persetujuan-tu',
      icon: 'i-lucide-file-check-2',
      showIfAtasanTu: true,
    },
    {
      label: 'Verifikasi Usulan',
      to: '/maintenance/verifikasi-usulan',
      icon: 'i-lucide-file-check-2',
      showIfAtasan: true,
    },
  ];

  const pemeliharaanBadge = pemeliharaanChildren.reduce((sum, c) => sum + (c.badge || 0), 0);
  // Fallback: kalau child tidak ada badge tapi ada notifikasi global,
  // tetap tampilkan dot di parent (adminMenuKelola).
  const pemeliharaanFallback = pemeliharaanBadge === 0 && unreadCount.value > 0 ? 1 : null;

  const menus = [
    {
      label: 'Pemeliharaan',
      icon: 'i-lucide-folder-cog',
      badge: pemeliharaanBadge > 0 ? pemeliharaanBadge : pemeliharaanFallback,
      children: pemeliharaanChildren,
    },
  ];

  // ── Menu Penggunaan (scope kita) ──
  // Semua user (SE + Managerial + User biasa) lihat dropdown Penggunaan.
  const penggunaanChildren = [];

  if (isSekretarisActor.value) {
    penggunaanChildren.push({
      label: 'Usulan Saya',
      to: '/kelola/penggunaan/usulan-saya',
      icon: 'i-lucide-file-plus',
      badge: usulanCounts.value.pilihBerkas > 0 ? usulanCounts.value.pilihBerkas : null,
      activePaths: ['/kelola/penggunaan/usulan-akses-berkas'],
    });
  }

  penggunaanChildren.push({
    label: 'Verifikasi Usulan',
    to: '/kelola/penggunaan/verifikasi-usulan',
    icon: 'i-lucide-file-check-2',
    badge: usulanCounts.value.menungguVerifikasi > 0 ? usulanCounts.value.menungguVerifikasi : null,
  });

  penggunaanChildren.push({
    label: 'Pemberian',
    to: '/kelola/penggunaan/pemberian',
    icon: 'i-lucide-folder-check',
    badge:
      usulanCounts.value.aksesDiterbitkanBaru > 0 ? usulanCounts.value.aksesDiterbitkanBaru : null,
  });

  if (penggunaanChildren.length > 0) {
    const penggunaanBadge = penggunaanChildren.reduce((sum, c) => sum + (c.badge || 0), 0);
    menus.push({
      label: 'Penggunaan',
      icon: 'i-lucide-folder-open',
      badge: penggunaanBadge > 0 ? penggunaanBadge : null,
      children: penggunaanChildren,
    });
  }

  // ── Menu Penyusutan ──
  const penyusutanChildren = [
    {
      label: 'Pengajuan Penyusutan',
      to: '/maintenance/penyusutan/pengajuan-penyusutan',
      icon: 'i-lucide-list',
      showIfTuRole: true,
    },
    {
      label: 'Penataan & Pemusnahan',
      to: '/maintenance/penyusutan/penataan-pemusnahan',
      icon: 'i-lucide-archive',
      showIfTuRole: true,
    },
    {
      label: 'Verifikasi Penyusutan',
      to: '/maintenance/penyusutan/verifikasi-penyusutan',
      icon: 'i-lucide-file-check',
      showIfAtasanPenyusutan: true,
    },
    {
      label: 'Backup Status',
      to: '/maintenance/penyusutan/backup-status',
      icon: 'i-lucide-database',
      showIfTuRole: true,
    },
  ];

  const filteredPenyusutanChildren = penyusutanChildren.filter((c) => {
    if (c.showIfTuRole && !isTuRole.value) return false;
    if (c.showIfAtasanPenyusutan && !isAtasanManagerialPenyusutan.value) return false;
    return true;
  });

  if (filteredPenyusutanChildren.length > 0) {
    menus.push({
      label: 'Penyusutan',
      icon: 'i-lucide-file-minus',
      children: filteredPenyusutanChildren,
    });
  }

  return menus;
});

const userMenuKelola = computed(() => {
  if (profileKelolaMenus.value) return profileKelolaMenus.value;

  const pemeliharaanChildren = [
    {
      label: 'Pemberkasan',
      to: '/kelola/pemeliharaan/pemberkasan/berkas-saya',
      icon: 'i-lucide-folder-plus',
      permission: { resource: 'pemeliharaan.pemberkasan', action: 'read' },
    },
    {
      label: 'Persetujuan',
      to: '/kelola/pemeliharaan/persetujuan-pemberkasan',
      icon: 'i-lucide-file-check',
      permission: { resource: 'pemeliharaan.verifikasi', action: 'read' },
      showIfCanPersetujuan: true,
      badge: rtArsipPersetujuanCount.value > 0 ? rtArsipPersetujuanCount.value : null,
    },
    {
      label: 'Pemindahan Arsip',
      to: '/maintenance/transfer-active-to-inactive-file',
      icon: 'i-lucide-file-up',
      showIfSekretarisOnly: true,
    },
    {
      label: 'Penerimaan Usulan',
      to: '/maintenance/penerimaan-usulan',
      icon: 'i-lucide-bell',
      showIfTuRole: true,
    },
    {
      label: 'Penataan Arsip Inaktif',
      to: '/maintenance/penataan-arsip-inaktif',
      icon: 'i-lucide-archive',
      showIfTuRole: true,
    },
    {
      label: 'Verifikasi Persetujuan',
      to: '/maintenance/verifikasi-persetujuan-tu',
      icon: 'i-lucide-file-check-2',
      showIfAtasanTu: true,
    },
    {
      label: 'Verifikasi Usulan',
      to: '/maintenance/verifikasi-usulan',
      icon: 'i-lucide-file-check-2',
      showIfAtasan: true,
    },
  ];

  const pemeliharaanBadge = pemeliharaanChildren.reduce((sum, c) => sum + (c.badge || 0), 0);
  // Fallback: kalau child tidak ada badge tapi ada notifikasi global
  // (persetujuan TU / verifikasi usulan), tetap tampilkan dot di parent.
  const pemeliharaanFallback =
    pemeliharaanBadge === 0 && (rtArsipPersetujuanCount.value > 0 || unreadCount.value > 0)
      ? 1
      : null;

  const menus = [
    {
      label: 'Pemeliharaan',
      icon: 'i-lucide-folder-cog',
      badge: pemeliharaanBadge > 0 ? pemeliharaanBadge : pemeliharaanFallback,
      children: pemeliharaanChildren,
    },
  ];

  // ── Menu Penyusutan ──
  const penyusutanChildrenKelola = [
    {
      label: 'Pengajuan Penyusutan',
      to: '/maintenance/penyusutan/pengajuan-penyusutan',
      icon: 'i-lucide-list',
      showIfTuRole: true,
    },
    {
      label: 'Penataan & Pemusnahan',
      to: '/maintenance/penyusutan/penataan-pemusnahan',
      icon: 'i-lucide-archive',
      showIfTuRole: true,
    },
    {
      label: 'Verifikasi Penyusutan',
      to: '/maintenance/penyusutan/verifikasi-penyusutan',
      icon: 'i-lucide-file-check',
      showIfAtasanPenyusutan: true,
    },
  ];

  const filteredPenyusutanChildrenKelola = penyusutanChildrenKelola.filter((c) => {
    if (c.showIfTuRole && !isTuRole.value) return false;
    if (c.showIfAtasanPenyusutan && !isAtasanManagerialPenyusutan.value) return false;
    return true;
  });

  if (filteredPenyusutanChildrenKelola.length > 0) {
    menus.push({
      label: 'Penyusutan',
      icon: 'i-lucide-file-minus',
      children: filteredPenyusutanChildrenKelola,
    });
  }

  return menus;
});

// ─── Notification flags ───────────────────────────────────────────────────────

const hasAdministrasiNotification = computed(
  () =>
    adminCounts.value.menunggu_verifikasi > 0 ||
    (canPersetujuan.value && (userCounts.value.menunggu_persetujuan ?? 0) > 0)
);
const hasUtilitasNotification = computed(() => {
  if (rtVerifikatorCount.value > 0) return true;
  if (isAdminOrSuperadmin.value) return false;
  return (
    userCounts.value.menunggu_verifikasi > 0 ||
    (canPersetujuan.value && (userCounts.value.menunggu_persetujuan ?? 0) > 0)
  );
});

// Tugas: badge realtime dari summary socket (task aktif yang ditugaskan
// ke posisi ini dan belum done). Phase 6 — tanpa polling baru.
const { tugasAssignedWaitingCount: rtTugasAssignedCount } = useRealtimeSocket();
const hasTugasNotification = computed(() => rtTugasAssignedCount.value > 0);

const filterMenuByPermission = (items) => {
  // Menu RBAC management selalu tampil untuk superadmin (tidak difilter)
  // Menu lain difilter berdasarkan permission, termasuk superadmin
  // Support nested children (recursive) untuk menu 2+ level.
  // Support role-based filtering via `roles` array on item.
  // Atasan Managerial TU: tampilkan menu verifikasi persetujuan TU HANYA jika
  // user terdaftar di tuApprovalLevels suatu usulan (cek via API is-atasan-tu).
  // Admin/Superadmin TIDAK otomatis lihat menu ini — hanya yang memang
  // terdaftar sebagai atasan TU di suatu usulan.
  const isAtasanManagerialTuPersnum = isAtasanManagerialTuUsulan.value;

  const hasRoleAccess = (item) => {
    if (!item.roles || item.roles.length === 0) return true;
    // Superadmin selalu lihat semua menu
    if (isSuperadmin.value) return true;
    // Atasan Managerial TU via posisi managerial
    if (isAtasanManagerialTuPersnum && item.roles.includes('atasan_managerial_tu')) return true;
    // Cek role user
    const role = (user.value?.activeRole?.name ?? user.value?.role ?? '').toLowerCase();
    return item.roles.some((r) => r === role);
  };

  const filterRecursive = (item) => {
    if (!item) return null;
    const cloned = { ...item };

    // Cek permission item itu sendiri
    if (cloned.permission) {
      const hasAccess = hasPermission(cloned.permission.resource, cloned.permission.action);
      if (!hasAccess) return null;
    }

    // Cek role-based access
    if (!hasRoleAccess(cloned)) return null;

    // Cek showIfAtasan — tampilkan HANYA jika user adalah atasan managerial (usulan).
    // Superadmin/admin TIDAK otomatis lihat menu ini kecuali memang terdaftar sebagai atasan.
    if (cloned.showIfAtasan && !isAtasanManagerialUsulan.value) {
      return null;
    }

    // Cek showIfAtasanTu — tampilkan HANYA jika user adalah Atasan Managerial TU
    // (terdaftar di tuApprovalLevels suatu usulan). Menu ini untuk verifikasi
    // persetujuan penerimaan arsip dari TU, bukan verifikasi usulan sekretaris.
    if (cloned.showIfAtasanTu && !isAtasanManagerialTuPersnum) {
      return null;
    }

    // Cek showIfAtasanPenyusutan — tampilkan HANYA jika user adalah Atasan
    // Managerial di penyusutan (terdaftar di penyusutan_verifikator).
    if (cloned.showIfAtasanPenyusutan && !isAtasanManagerialPenyusutan.value) {
      return null;
    }

    // Cek showIfCanPersetujuan — tampilkan HANYA jika user adalah atasan
    // managerial (bisa memberikan persetujuan pemberkasan). Unit Dokumen /
    // non-managerial TIDAK lihat menu "Persetujuan".
    if (cloned.showIfCanPersetujuan && !canPersetujuan.value && !isSuperadmin.value) {
      return null;
    }

    // Cek showIfTuOrSekretaris — tampilkan HANYA jika user punya role unit_dokumen (tu)
    // atau sekretaris (delegasi/organization_tu). Superadmin/admin TIDAK otomatis lihat.
    if (cloned.showIfTuOrSekretaris && !isTuRole.value && !isSekretarisRole.value) {
      return null;
    }

    // Cek showIfSekretarisOnly — tampilkan HANYA jika user adalah sekretaris
    // (delegasi/organization_tu). TU (unit_dokumen) TIDAK lihat menu ini.
    if (cloned.showIfSekretarisOnly && !isSekretarisRole.value && !isSekretarisActor.value) {
      return null;
    }

    // Cek showIfTuRole — tampilkan HANYA jika user punya role unit_dokumen (tu).
    // Superadmin/admin TIDAK otomatis lihat.
    if (cloned.showIfTuRole && !isTuRole.value) {
      return null;
    }

    // Cek hideIfAtasan — sembunyikan jika user adalah atasan managerial
    if (cloned.hideIfAtasan && (isAtasanManagerialUsulan.value || isAdminOrSuperadmin.value)) {
      return null;
    }

    // Cek hideIfManagerial — sembunyikan jika user adalah Managerial (EVP/VP/AVP)
    // tapi bukan Sekretaris delegasi (SE) — SE tetap bisa lihat menu pemindahan arsip.
    if (cloned.hideIfManagerial && isManagerialPosition.value && !isSekretarisActor.value) {
      return null;
    }

    // Filter children secara recursive
    if (item.children) {
      cloned.children = item.children
        .map((child) => filterRecursive(child))
        .filter((child) => child !== null);
      // Jika semua children hilang, parent juga hilang
      if (cloned.children.length === 0) return null;
    }

    return cloned;
  };

  return items.map((item) => filterRecursive(item)).filter((item) => item !== null);
};

// ─── Apps ─────────────────────────────────────────────────────────────────────

const apps = computed(() => {
  // FIX: The core bug. When the page refreshes, user.value is null initially.
  // isAdminOrSuperadmin returns false, so the user apps array is returned first.
  // The watch(apps) with { immediate: true } then sets activeApp to 'user-utama'.
  // When getProfile() resolves and user.value updates, apps switches to admin
  // menus — but activeApp is still 'user-utama', which no longer exists in the
  // new apps array. The watch tries to match from route, but if route matching
  // fails (e.g. /delegasi is only in admin menus), activeApp stays stale.
  //
  // The real fix: guard the entire apps computed with a userReady flag so we
  // never return mismatched menus before user data is loaded.
  if (!userReady.value) return [];

  if (isAdminOrSuperadmin.value) {
    return [
      {
        id: 'admin-utama',
        label: t('utama'),
        // FIX: Use 'i-heroicons-home' consistently — this is the correct icon
        // shown in img 1/2. Never use a computed/dynamic value here.
        icon: 'i-heroicons-home',
        menus: filterMenuByPermission(adminMenuUtama.value),
        hasNotification: hasInboxUnread.value,
      },
      ...(showKelolaMenu.value
        ? [
            {
              id: 'admin-kelola',
              label: 'Kelola',
              icon: 'i-lucide-archive',
              menus: filterMenuByPermission(adminMenuKelola.value),
              hasNotification: rtArsipPersetujuanCount.value > 0,
            },
          ]
        : []),
      {
        id: 'admin-utilitas',
        label: t('utilitas'),
        icon: 'i-heroicons-squares-plus',
        menus: filterMenuByPermission(adminMenuUtilitas.value),
        hasNotification: hasUtilitasNotification.value, // ← UBAH dari false
      },
      {
        id: 'admin-tugas',
        label: t('tugas', 'Tugas'),
        icon: 'i-lucide-square-kanban',
        menus: filterMenuByPermission(tugasMenu.value),
        hasNotification: hasTugasNotification.value,
      },
      {
        id: 'admin-administrasi',
        label: t('administrasi'),
        // FIX: Was 'i-lucide-settings' in original. This is correct per img 1/2.
        // Must be a hardcoded string literal — never a variable or t() call.
        icon: 'i-lucide-settings',
        menus: filterMenuByPermission(adminMenuAdministrasi.value),
        hasNotification: hasAdministrasiNotification.value,
      },
      {
        id: 'admin-laporan',
        label: t('laporan'),
        // FIX: Was 'i-heroicons-presentation-chart-line'. Correct per img 1/2.
        icon: 'i-heroicons-presentation-chart-line',
        menus: filterMenuByPermission(adminMenuLaporan.value),
        hasNotification: false,
      },
      {
        id: 'admin-faq',
        label: 'FAQ',
        icon: 'i-lucide-circle-help',
        menus: filterMenuByPermission(faqMenuAdmin.value),
        hasNotification: false,
      },
    ];
  }

  return [
    {
      id: 'user-utama',
      label: t('utama'),
      icon: 'i-heroicons-home',
      menus: filterMenuByPermission(userMenuUtama.value),
      hasNotification: hasInboxUnread.value,
    },
    ...(showKelolaMenu.value
      ? [
          {
            id: 'user-kelola',
            label: 'Kelola',
            icon: 'i-lucide-archive',
            menus: filterMenuByPermission(userMenuKelola.value),
            hasNotification: rtArsipPersetujuanCount.value > 0,
          },
        ]
      : []),
    {
      id: 'user-utilitas',
      label: t('utilitas'),
      icon: 'i-heroicons-squares-plus',
      menus: filterMenuByPermission(userMenuUtilitas.value),
      hasNotification: hasUtilitasNotification.value,
    },
    {
      id: 'user-tugas',
      label: t('tugas', 'Tugas'),
      icon: 'i-lucide-square-kanban',
      menus: filterMenuByPermission(tugasMenu.value),
      hasNotification: hasTugasNotification.value,
    },
    {
      id: 'user-faq',
      label: 'FAQ',
      icon: 'i-lucide-circle-help',
      menus: filterMenuByPermission(faqMenuUser.value),
      hasNotification: false,
    },
  ];
});

// ─── FIX: userReady flag ──────────────────────────────────────────────────────
// This is the KEY fix. We track whether user data has been loaded at least once.
// Until it's true, apps returns [] and no activeApp is set prematurely.
// This prevents the "flash" where user menus render briefly before admin menus load.
const userReady = ref(false);

watch(
  () => user.value,
  (newUser) => {
    if (newUser) {
      userReady.value = true;
    }
  },
  { immediate: true }
);

// ─── Active app ───────────────────────────────────────────────────────────────

const setActiveApp = (appId) => {
  activeApp.value = appId;
};

const currentAppData = computed(() => {
  return apps.value.find((app) => app.id === activeApp.value) || apps.value[0] || { menus: [] };
});

// FIX: Removed { immediate: true } from this watch.
// With immediate: true, this ran before user was loaded, setting activeApp to
// the first app in the user-role list (user-utama) even for admins.
// Now it only runs after apps actually has content (userReady is true).
watch(
  apps,
  (newApps) => {
    if (newApps.length === 0) return; // guard: user not loaded yet

    const path = route.path;
    let matchedAppId = '';

    for (const app of newApps) {
      if (app.menus && Array.isArray(app.menus)) {
        for (const menu of app.menus) {
          if (menu.to && path.startsWith(menu.to)) {
            matchedAppId = app.id;
            break;
          }
          if (menu.children && Array.isArray(menu.children)) {
            for (const child of menu.children) {
              if (child.to && path.startsWith(child.to)) {
                matchedAppId = app.id;
                break;
              }
            }
          }
        }
        if (matchedAppId) break;
      }
    }

    if (matchedAppId) {
      activeApp.value = matchedAppId;
    } else {
      const exists = newApps.find((a) => a.id === activeApp.value);
      if (!exists) activeApp.value = newApps[0].id;
    }
  }
  // FIX: No { immediate: true } here
);

watch(
  () => route.path,
  (path) => {
    if (!apps.value || apps.value.length === 0) return;

    for (const app of apps.value) {
      if (app.menus && Array.isArray(app.menus)) {
        for (const menu of app.menus) {
          if (menu.to && path.startsWith(menu.to)) {
            activeApp.value = app.id;
            return;
          }
          if (menu.children && Array.isArray(menu.children)) {
            for (const child of menu.children) {
              if (child.to && path.startsWith(child.to)) {
                activeApp.value = app.id;
                return;
              }
            }
          }
        }
      }
    }
  }
);

// ─── Screen / collapse ────────────────────────────────────────────────────────

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768;
};

const handleMenuClick = () => {
  if (isMobile.value) {
    isMobileOpen.value = false;
  } else {
    emit('update:collapsed', !props.collapsed);
  }
};

const closeMobile = () => (isMobileOpen.value = false);
const openMobile = () => (isMobileOpen.value = true);

// ─── Label management ─────────────────────────────────────────────────────────

const showLabelModal = ref(false);
const showDeleteModal = ref(false);
const showHelpdeskConfirm = ref(false);
const isEditing = ref(false);
const isProcessing = ref(false);
const labelToDelete = ref(null);

const openHelpdesk = () => {
  showHelpdeskConfirm.value = false;
  window.open('https://itsupport.airnavindonesia.co.id/', '_blank', 'noopener,noreferrer');
};

const labelForm = reactive({
  id: null,
  name: '',
  isNested: false,
  parentId: '',
});

const availableParents = computed(() => {
  if (!isEditing.value) return labels.value;
  return labels.value.filter((l) => l.id !== labelForm.id);
});

const openCreateLabelModal = () => {
  isEditing.value = false;
  labelForm.id = null;
  labelForm.nama = '';
  labelForm.isNested = false;
  labelForm.parentId = '';
  showLabelModal.value = true;
};

const openEditLabelModal = (label) => {
  isEditing.value = true;
  labelForm.id = label.id;
  labelForm.nama = label.nama;
  labelForm.isNested = !!label.parent_id;
  labelForm.parentId = label.parent_id || '';
  showLabelModal.value = true;
};

const closeLabelModal = () => {
  showLabelModal.value = false;
  isProcessing.value = false;
};

const saveLabel = async () => {
  if (!labelForm.nama) return;
  isProcessing.value = true;
  const payload = {
    nama: labelForm.nama,
    idParent: labelForm.isNested && labelForm.parentId ? labelForm.parentId : null,
  };
  try {
    if (isEditing.value) {
      await updateLabel(labelForm.id, payload);
    } else {
      await createLabel(payload);
    }
    await fetchLabels();
    closeLabelModal();
  } catch (err) {
    console.error('Gagal menyimpan label:', err);
  } finally {
    isProcessing.value = false;
  }
};

const openDeleteConfirm = (label) => {
  labelToDelete.value = label;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!labelToDelete.value) return;
  isProcessing.value = true;
  try {
    await deleteLabel(labelToDelete.value.id);
    await fetchLabels();
    showDeleteModal.value = false;
    labelToDelete.value = null;
  } catch (err) {
    console.error('Gagal menghapus label:', err);
  } finally {
    isProcessing.value = false;
  }
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

defineExpose({ openMobile, closeMobile });
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateX(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
