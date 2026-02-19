<template>
  <div class="min-h-screen pt-5 bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <Heading variant="heading6b" class="text-mobile-md">
          Konfigurasi Sistem
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Single Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Tab Bar -->
        <div
          class="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800"
        >
          <div
            class="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1.5 gap-2 w-fit"
          >
            <button
              @click="activeTab = 'digsig'"
              :class="[
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'digsig'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
              Konfigurasi DigSig
            </button>
            <button
              @click="activeTab = 'pengumuman'"
              :class="[
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'pengumuman'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              <UIcon name="i-lucide-megaphone" class="w-4 h-4" />
              Pengumuman Pemeliharaan
            </button>
          </div>
        </div>

        <!-- ===================== TAB: DIGSIG ===================== -->
        <div v-if="activeTab === 'digsig'" class="p-6">
          <Heading variant="heading9sb" class="text-mobile-md">
            Konfigurasi Digsig
          </Heading>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
            Atur pengaturan global untuk fitur tanda tangan digital
          </p>

          <div class="space-y-3">
            <div
              v-for="doc in digsigList"
              :key="doc.id"
              class="flex items-center justify-between px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white">
                  {{ doc.description }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Izinkan pengguna menggunakan Digsig pada dokumen
                  {{ doc.description }}
                </p>
              </div>

              <button
                type="button"
                @click="toggleDigsig(doc.jenisNaskah)"
                :disabled="isToggling === doc.jenisNaskah"
                :class="[
                  'relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                  doc.enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600',
                ]"
              >
                <span
                  :class="[
                    'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out',
                    doc.enabled ? 'translate-x-6' : 'translate-x-0',
                  ]"
                />
              </button>
            </div>
          </div>

          <div class="pt-5 flex justify-end">
            <button
              @click="saveDigsig"
              class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
            >
              <Save class="w-4 h-4" />
              Simpan Konfigurasi
            </button>
          </div>
        </div>

        <!-- ===================== TAB: PENGUMUMAN ===================== -->
        <div v-if="activeTab === 'pengumuman'">
          <!-- Form buat pengumuman -->
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <Heading variant="heading9sb" class="text-mobile-md">
              Pengumuman Pemeliharaan
            </Heading>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
              Buat pengumuman maintenance yang akan ditampilkan ke semua
              pengguna
            </p>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Judul Pengumuman <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="announcementForm.judul"
                  placeholder="Contoh: Maintenance Fitur Tulis"
                  class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm dark:text-gray-200 pl-3 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Pesan Pengumuman <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="announcementForm.pesan"
                  rows="3"
                  placeholder="Tulis pesan pengumuman di sini..."
                  class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm dark:text-gray-200 pl-3 pr-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Jenis Pengumuman <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    @click="announcementForm.jenis = 'info'"
                    :class="[
                      'flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium',
                      announcementForm.jenis === 'info'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300',
                    ]"
                  >
                    <UIcon name="i-lucide-info" class="w-5 h-5" /> Info
                  </button>
                  <button
                    @click="announcementForm.jenis = 'warning'"
                    :class="[
                      'flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all text-sm font-medium',
                      announcementForm.jenis === 'warning'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300',
                    ]"
                  >
                    <UIcon name="i-lucide-triangle-alert" class="w-5 h-5" />
                    Peringatan
                  </button>
                </div>
              </div>
              <div class="flex justify-end pt-1">
                <button
                  @click="handleCreateAnnouncement"
                  :disabled="
                    !announcementForm.judul ||
                    !announcementForm.pesan ||
                    isCreatingMessage
                  "
                  class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Megaphone class="w-4 h-4" />
                  {{ isCreatingMessage ? "Menyimpan..." : "Buat Pengumuman" }}
                </button>
              </div>
            </div>
          </div>

          <!-- Daftar pengumuman -->
          <div class="p-6 space-y-4">
            <!-- Loading state -->
            <div v-if="isLoadingMessage" class="py-12 text-center">
              <UIcon
                name="i-lucide-loader-2"
                class="w-8 h-8 text-primary animate-spin mx-auto mb-3"
              />
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                Memuat pengumuman...
              </p>
            </div>

            <!-- Empty state -->
            <div v-else-if="messageList.length === 0" class="py-12 text-center">
              <UIcon
                name="i-lucide-megaphone-off"
                class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
              />
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                Belum ada pengumuman. Buat pengumuman baru di atas.
              </p>
            </div>

            <!-- Card tiap pengumuman -->
            <div
              v-for="(item, index) in messageList"
              :key="item.id"
              class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <!-- Toggle row -->
              <div
                class="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700"
              >
                <div>
                  <p
                    class="text-sm font-semibold text-gray-800 dark:text-white"
                  >
                    Aktifkan Pengumuman
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pengumuman akan muncul di setiap halaman aplikasi
                  </p>
                </div>
                <!-- Custom toggle switch -->
                <button
                  type="button"
                  @click="handleToggleBanner(item.id)"
                  :disabled="isTogglingBanner === item.id"
                  :class="[
                    'relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    item.showBanner
                      ? 'bg-primary'
                      : 'bg-gray-200 dark:bg-gray-600',
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                      item.showBanner ? 'translate-x-6' : 'translate-x-0',
                    ]"
                  />
                </button>
              </div>

              <!-- Preview row -->
              <div class="px-5 py-4 bg-white dark:bg-gray-800">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0"
                    >
                      <span
                        class="text-sm font-bold text-primary-600 dark:text-primary-400"
                        >{{ index + 1 }}</span
                      >
                    </div>
                    <div>
                      <p
                        class="text-sm font-semibold text-gray-800 dark:text-white"
                      >
                        Preview
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Tampilan pengumuman untuk pengguna
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      @click="openEditModal(item)"
                      class="p-1.5 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950 rounded-md transition-colors"
                    >
                      <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                    </button>
                    <button
                      @click="openDeleteConfirm(item)"
                      class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                    >
                      <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Banner preview -->
                <div
                  :class="[
                    'flex items-start gap-3 p-4 mt-5 rounded-xl border',
                    item.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800'
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
                  ]"
                >
                  <UIcon
                    :name="
                      item.type === 'warning'
                        ? 'i-lucide-triangle-alert'
                        : 'i-lucide-info'
                    "
                    :class="[
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      item.type === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400',
                    ]"
                  />
                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'text-sm font-semibold mb-0.5',
                        item.type === 'warning'
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-blue-800 dark:text-blue-200',
                      ]"
                    >
                      {{ item.title }}
                    </p>
                    <p
                      :class="[
                        'text-sm leading-relaxed',
                        item.type === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-blue-700 dark:text-blue-300',
                      ]"
                    >
                      {{ item.message }}
                    </p>
                  </div>
                  <button
                    :class="[
                      'flex-shrink-0 p-0.5 rounded',
                      item.type === 'warning'
                        ? 'text-yellow-500 hover:bg-yellow-100'
                        : 'text-blue-500 hover:bg-blue-100',
                    ]"
                  >
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== MODAL EDIT — pakai komponen Modal ===================== -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <div class="p-3 ml-2 mt-2">
            <h3 class="text-xl font-bold dark:text-white">Edit Pengumuman</h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Judul Pengumuman <span class="text-red-500">*</span>
            </label>
            <input
              v-model="editForm.judul"
              type="text"
              placeholder="Judul pengumuman"
              class="mt-1 mb-2 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Pesan Pengumuman <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="editForm.pesan"
              rows="4"
              placeholder="Pesan pengumuman"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            ></textarea>
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Jenis Pengumuman</label
            >
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="editForm.jenis = 'info'"
                :class="[
                  'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium',
                  editForm.jenis === 'info'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
                ]"
              >
                <UIcon name="i-lucide-info" class="w-4 h-4" /> Info
              </button>
              <button
                @click="editForm.jenis = 'warning'"
                :class="[
                  'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium',
                  editForm.jenis === 'warning'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400',
                ]"
              >
                <UIcon name="i-lucide-triangle-alert" class="w-4 h-4" />
                Peringatan
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- ===================== CONFIRM DELETE — pakai komponen ConfirmPopup ===================== -->
    <ConfirmPopup
      v-model="showDeleteModal"
      type="danger"
      title="Hapus Pengumuman?"
      :message="`Apakah Anda yakin ingin menghapus pengumuman &quot;${messageToDelete?.title}&quot;? Tindakan ini tidak dapat dibatalkan.`"
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="isDeletingMessage"
      @confirm="handleDeleteMessage"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Save, Megaphone } from "lucide-vue-next";
import { useKonfigurasi } from "@/composables/useKonfigurasi";
import type { KonfigurasiMessageItem } from "@/types/konfigurasi";

const activeTab = ref("digsig");

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Konfigurasi Sistem", to: "/konfigurasi-sistem" },
];

// ==========================================
//   DIGSIG (tidak diubah)
// ==========================================
const {
  digsigList,
  isLoading,
  isToggling,
  fetchDigsig,
  toggleDigsig,

  messageList,
  isLoadingMessage,
  isCreatingMessage,
  isUpdatingMessage,
  isDeletingMessage,
  isTogglingBanner,
  fetchMessages,
  createMessage,
  updateMessage,
  toggleBanner,
  deleteMessage,

  showToastSaveDigsig,
} = useKonfigurasi();

const isSavingDigsig = ref(false);

const saveDigsig = async () => {
  isSavingDigsig.value = true;
  try {
    await new Promise((r) => setTimeout(r, 800));
    showToastSaveDigsig();
  } finally {
    isSavingDigsig.value = false;
  }
};

onMounted(() => {
  fetchDigsig();
  fetchMessages();
});

// ==========================================
//   PENGUMUMAN — form state
// ==========================================
const announcementForm = reactive({
  judul: "",
  pesan: "",
  jenis: "info" as "info" | "warning" | "success",
});

const handleCreateAnnouncement = async () => {
  if (!announcementForm.judul || !announcementForm.pesan) return;
  const ok = await createMessage({
    title: announcementForm.judul,
    message: announcementForm.pesan,
    type: announcementForm.jenis,
    show_banner: true,
  });
  if (ok) {
    announcementForm.judul = "";
    announcementForm.pesan = "";
    announcementForm.jenis = "info";
  }
};

const handleToggleBanner = async (id: string) => {
  await toggleBanner(id);
};

// ==========================================
//   EDIT
// ==========================================
const showEditModal = ref(false);
const editTarget = ref<KonfigurasiMessageItem | null>(null);
const editForm = reactive({
  judul: "",
  pesan: "",
  jenis: "info" as "info" | "warning" | "success",
});

const openEditModal = (item: KonfigurasiMessageItem) => {
  editTarget.value = item;
  editForm.judul = item.title;
  editForm.pesan = item.message;
  editForm.jenis = item.type;
  showEditModal.value = true;
};

const handleSaveEdit = async () => {
  if (!editForm.judul || !editForm.pesan || !editTarget.value) return;
  const ok = await updateMessage(editTarget.value.id, {
    title: editForm.judul,
    message: editForm.pesan,
    type: editForm.jenis,
    show_banner: editTarget.value.showBanner,
  });
  if (ok) {
    showEditModal.value = false;
    editTarget.value = null;
  }
};

// ==========================================
//   DELETE
// ==========================================
const showDeleteModal = ref(false);
const messageToDelete = ref<KonfigurasiMessageItem | null>(null);

const openDeleteConfirm = (item: KonfigurasiMessageItem) => {
  messageToDelete.value = item;
  showDeleteModal.value = true;
};

const handleDeleteMessage = async () => {
  if (!messageToDelete.value) return;
  const ok = await deleteMessage(messageToDelete.value.id);
  if (ok) {
    showDeleteModal.value = false;
    messageToDelete.value = null;
  }
};
</script>
