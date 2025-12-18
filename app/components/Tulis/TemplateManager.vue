<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <UButton label="Pilih Template" color="primary" variant="soft" icon="i-lucide-folder-search"
        class="w-full sm:w-auto justify-center" @click="isTemplateModalOpen = true" />
      <UButton label="Template Saya" icon="i-lucide-folder-pen" variant="soft" color="primary"
        class="w-full sm:w-auto justify-center" @click="openMyTemplateModal" />
    </div>
    <UButton label="Simpan Template" icon="i-lucide-save" variant="soft" color="primary"
      class="w-full sm:w-auto justify-center" @click="openSaveModal(false)" />
  </div>

  <div v-if="isTemplateModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="isTemplateModalOpen = false">
    </div>

    <div class="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pilih Template Umum</h3>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isTemplateModalOpen = false" />
      </div>
      <div class="p-4 overflow-y-auto">
        <UAccordion multiple :items="publicTemplatesAccordion" :ui="{ wrapper: 'space-y-2' }">
          <template #default="{ item, open }">
            <div
              class="w-full flex justify-between items-center py-3 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded-md border border-transparent hover:border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-2 flex-1 w-full">
                <UIcon name="i-heroicons-chevron-right" :class="[open && 'transform rotate-90']"
                  class="w-4 h-4 transition-transform text-gray-500" />
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.label }}</span>
              </div>
              <UButton label="Gunakan" size="xs" color="primary" class="ml-5" variant="solid"
                @click.stop="selectTemplate(item)" />
            </div>
          </template>
          <template #template-body="{ item }">
            <div class="p-2">
              <iframe :srcdoc="item.content" class="w-full rounded bg-white shadow-sm border border-gray-200"
                style="height: 150px; pointer-events: none;" />
            </div>
          </template>
        </UAccordion>
      </div>
    </div>
  </div>

  <div v-if="isAddTemplateOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="isAddTemplateOpen = false">
    </div>

    <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ isEditMode ? 'Edit Template' : 'Simpan Template Baru' }}
        </h3>
      </div>
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Template</label>
          <UInput v-model="newTemplateName" placeholder="Contoh: Template Undangan Rapat" icon="i-heroicons-tag"
            size="lg" class="w-full" />
        </div>
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-300">
            <span v-if="isEditMode">Konten template ini akan <strong>diperbarui</strong> dengan isi editor saat
              ini.</span>
            <span v-else>Konten editor saat ini akan disimpan sebagai template baru.</span>
          </p>
        </div>
      </div>
      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-lg">
        <UButton label="Batal" variant="ghost" color="gray" @click="isAddTemplateOpen = false" />
        <UButton :label="isEditMode ? 'Simpan Perubahan' : 'Simpan'" color="primary" icon="i-heroicons-check-circle"
          :loading="isLoadingAction" :disabled="!newTemplateName.trim()" @click="submitTemplate" />
      </div>
    </div>
  </div>

  <div v-if="isMyTemplateModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      @click="isMyTemplateModalOpen = false">
    </div>

    <div class="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mr-2">Template Saya</h3>
          <UBadge color="primary" variant="subtle">{{ myTemplates.length }}</UBadge>
        </div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isMyTemplateModalOpen = false" />
      </div>
      <div class="p-4 overflow-y-auto">
        <div v-if="isLoadingList" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        <div v-else-if="myTemplates.length === 0" class="p-6 text-center text-gray-500">
          Belum ada template tersimpan.
        </div>
        <div v-else class="space-y-3">
          <UAccordion multiple :items="myTemplatesAccordion" :ui="{ wrapper: 'space-y-2' }">
            <template #default="{ item, open }">
              <div
                class="w-full flex justify-between items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded-md">
                <div class="flex items-center gap-2 flex-1 overflow-hidden">
                  <UIcon name="i-heroicons-chevron-right" :class="[open && 'transform rotate-90']"
                    class="w-4 h-4 transition-transform text-gray-500 flex-shrink-0" />
                  <div class="flex flex-col text-left min-w-0">
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{{ item.label
                    }}</span>
                    <span class="text-[10px] text-gray-400">Terakhir update: {{ formatDate(item.updated_at ||
                      item.created_at) }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 ml-2" @click.stop>
                  <UButton icon="i-heroicons-pencil-square" color="orange" variant="soft" size="xs"
                    @click="openEditModal(item)" />
                  <UButton icon="i-heroicons-trash" color="red" variant="soft" size="xs"
                    @click="handleDeleteTemplate(item.id)" />
                  <UButton label="Gunakan" size="xs" color="primary" variant="solid" @click="selectTemplate(item)" />
                </div>
              </div>
            </template>
            <template #template-body="{ item }">
              <div class="p-2 bg-gray-50 dark:bg-gray-900/50">
                <iframe :srcdoc="item.content" class="w-full rounded bg-white shadow-sm border border-gray-200"
                  style="height: 150px; pointer-events: none;" />
              </div>
            </template>
          </UAccordion>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useTemplateTulis } from '@/composables/useTemplateTulis';
import type { TemplateSurat, TemplatePayload } from '@/types/template';

// Props & Emits
const props = defineProps<{ currentContent: string }>();
const emit = defineEmits<{ (e: 'apply', content: string): void }>();

// Composables
// const { Alert } = useSwal();
import { Alert } from '@/composables/useAlert';
const toast = useToast();
const { user, getProfile } = useAuth();
const { getTemplatesByPosition, createTemplate, updateTemplate, deleteTemplateById } = useTemplateTulis();

// State Modal
const isTemplateModalOpen = ref(false);
const isAddTemplateOpen = ref(false);
const isMyTemplateModalOpen = ref(false);

// State Data & Loading
const newTemplateName = ref('');
const myTemplates = ref<TemplateSurat[]>([]);
const isLoadingList = ref(false);
const isLoadingAction = ref(false);

// State Edit Mode
const isEditMode = ref(false);
const editingId = ref<string | null>(null);

// Static Data (Public)
const publicTemplates = [
  { id: 'list-decimal', name: 'Daftar Angka', content: '<ol><li>Poin pertama</li><li>Poin kedua</li><li>Poin ketiga</li></ol>' },
  { id: 'list-alpha', name: 'Daftar Huruf (a, b, c)', content: '<ol type="a"><li>Uraian pertama</li><li>Uraian kedua</li><li>Uraian ketiga</li></ol>' },
  { id: 'list-roman', name: 'Daftar Romawi (I, II, III)', content: '<ol type="I"><li>Ketentuan pertama</li><li>Ketentuan kedua</li><li>Ketentuan ketiga</li></ol>' },
  { id: 'list-bullet', name: 'Daftar Bullet', content: '<ul><li>Hal pertama</li><li>Hal kedua</li><li>Hal ketiga</li></ul>' },
  { id: 'list-combination', name: 'Daftar Bertingkat (1.a)', content: '<ol><li>Poin utama<ol type="a"><li>Sub poin</li><li>Sub poin</li></ol></li><li>Poin utama<ol type="a"><li>Sub poin</li><li>Sub poin</li></ol></li></ol>' },
  { id: 'table-identity', name: 'Tabel Identitas Kegiatan', content: '<table border="1" width="100%" cellpadding="6" cellspacing="0"><tr><td width="30%">Nama Kegiatan</td><td width="70%">:</td></tr><tr><td>Tanggal</td><td>:</td></tr><tr><td>Waktu</td><td>:</td></tr><tr><td>Tempat</td><td>:</td></tr></table>' },
  { id: 'table-participant', name: 'Tabel Peserta', content: '<table border="1" width="100%" cellpadding="6" cellspacing="0"><tr><th width="5%">No</th><th width="35%">Nama</th><th width="30%">Jabatan</th><th width="30%">Keterangan</th></tr><tr><td align="center">1</td><td></td><td></td><td></td></tr><tr><td align="center">2</td><td></td><td></td><td></td></tr></table>' },
  { id: 'table-agenda', name: 'Tabel Agenda Kegiatan', content: '<table border="1" width="100%" cellpadding="6" cellspacing="0"><tr><th width="10%">No</th><th width="30%">Hari / Tanggal</th><th width="30%">Waktu</th><th width="30%">Agenda</th></tr><tr><td align="center">1</td><td></td><td></td><td></td></tr><tr><td align="center">2</td><td></td><td></td><td></td></tr></table>' },
]

// --- COMPUTED ---
const publicTemplatesAccordion = computed(() => {
  return publicTemplates.map(t => ({ label: t.name, slot: 'template-body', ...t }));
});

const myTemplatesAccordion = computed(() => {
  // Mapping data API (nama_template) ke UAccordion (label)
  return myTemplates.value.map(t => ({
    label: t.nama_template,
    content: t.content,
    id: t.id,
    created_at: t.created_at,
    updated_at: t.updated_at,
    slot: 'template-body'
  }));
});

// --- FETCH DATA ---
const fetchMyTemplates = async () => {
  if (!user.value) await getProfile();

  const positionId = user.value?.position;
  if (!positionId) return;

  try {
    isLoadingList.value = true;
    const data = await getTemplatesByPosition(positionId);
    myTemplates.value = data;
  } catch (error) {
    // Error handled in useApi usually, or simple toast
  } finally {
    isLoadingList.value = false;
  }
};

// --- ACTIONS ---

// 1. Buka Modal Simpan (Baru)
const openSaveModal = (edit: boolean) => {
  if (!edit) {
    // Validasi konten kosong saat mau simpan baru
    if (!props.currentContent || props.currentContent.trim() === '') {
      Alert.warning('Gagal menyimpan!', 'Isi editor terlebih dahulu.');
      return;
    }
    // Reset untuk mode CREATE
    isEditMode.value = false;
    newTemplateName.value = '';
    editingId.value = null;
  }
  isAddTemplateOpen.value = true;
};

// 2. Buka Modal Edit (Dari List)
const openEditModal = (item: any) => {
  // Set mode EDIT
  isEditMode.value = true;
  newTemplateName.value = item.label; // Ambil nama existing
  editingId.value = item.id;

  // Buka modal input nama
  isAddTemplateOpen.value = true;
};

// 3. Submit (Create / Update)
const submitTemplate = async () => {
  if (!user.value) await getProfile();
  const positionId = user.value?.position;

  if (!positionId) {
    Alert.error('Error', 'Posisi user tidak ditemukan.');
    return;
  }

  // Payload
  const payload: TemplatePayload = {
    id_position: positionId,
    nama_template: newTemplateName.value,
    content: props.currentContent // Selalu ambil konten dari editor saat ini
  };

  try {
    isLoadingAction.value = true;

    if (isEditMode.value && editingId.value) {
      // --- UPDATE ---
      await updateTemplate(editingId.value, payload);
      toast.add({ title: 'Sukses', description: 'Template berhasil diperbarui.', color: 'green' });
    } else {
      // --- CREATE ---
      await createTemplate(payload);
      toast.add({ title: 'Sukses', description: 'Template berhasil disimpan.', color: 'green' });
    }

    // Refresh list & Close modals
    isAddTemplateOpen.value = false;
    await fetchMyTemplates();

  } catch (error) {
    console.error(error);
    Alert.error('Gagal', 'Terjadi kesalahan saat menyimpan template.');
  } finally {
    isLoadingAction.value = false;
  }
};

// 4. Delete Template
// Tambahkan console.log untuk debugging
const handleDeleteTemplate = async (id: any) => {
  if (!id) {
    Alert.warning('Error', 'ID Template tidak ditemukan.');
    return;
  }

  // 1. Tampilkan Confirm dan tunggu hasilnya
  const isConfirmed = await Alert.confirm(
    'Hapus Template?',
    'Template yang dihapus tidak dapat dikembalikan.',
    'Ya, Hapus',
    'Batal',
    true // Ini akan mengeset type menjadi 'danger'
  );

  // 2. Jika user klik Batal (isConfirmed = false), hentikan proses
  if (!isConfirmed) return;

  try {
    isLoadingList.value = true;
    await deleteTemplateById(String(id));

    toast.add({
      title: 'Terhapus',
      description: 'Template berhasil dihapus.',
      color: 'green'
    });

    await fetchMyTemplates();
  } catch (error) {
    console.error('Error saat delete:', error);
    // Jika Alert.error belum ada di composable, gunakan Alert.warning
    Alert.warning('Gagal', 'Gagal menghapus template.');
  } finally {
    isLoadingList.value = false;
  }
};

// 5. Use Template
const selectTemplate = async (template: any) => {
  // Gunakan nama template dari item list (public vs myTemplate punya key berbeda)
  const templateName = template.name || template.label;

  const isConfirmed = await Alert.confirm(
    "Gunakan Template",
    `Apakah Anda yakin ingin menggunakan template "${templateName}"?<br><br><b>PERINGATAN:</b> Isi editor saat ini akan diganti seluruhnya.`,
    "Ya, Gunakan",
    "Batal",
    false
  );

  if (!isConfirmed) return;

  emit("apply", template.content);

  // Tutup semua modal template
  isTemplateModalOpen.value = false;
  isMyTemplateModalOpen.value = false;
};

// 6. Buka List Template Saya
const openMyTemplateModal = () => {
  isMyTemplateModalOpen.value = true;
  fetchMyTemplates();
};

// Helper Format Date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Init Data
onMounted(() => {
  if (!user.value) getProfile();
});
</script>
