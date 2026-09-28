<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <UButton :label="$t('f_pilih_template')" color="primary" variant="soft" icon="i-lucide-folder-search"
        class="w-full sm:w-auto justify-center" @click="isTemplateModalOpen = true" />
      <UButton :label="$t('tmpl_template_saya')" icon="i-lucide-folder-pen" variant="soft" color="primary"
        class="w-full sm:w-auto justify-center" @click="openMyTemplateModal" />
      <slot name="after-template-actions" />
    </div>
    <UButton :label="$t('tmpl_simpan_template')" icon="i-lucide-save" variant="soft" color="primary"
      class="w-full sm:w-auto justify-center" @click="openSaveModal(false)" />
  </div>

  <Teleport to="body">
    <div v-if="isTemplateModalOpen" class="fixed inset-0 z-[99] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        @click="isTemplateModalOpen = false">
      </div>

      <div class="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('tmpl_pilih_template_umum') }}</h3>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="isTemplateModalOpen = false" />
        </div>
        <div class="p-4 overflow-y-auto">
          <UAccordion type="multiple" :items="publicTemplatesAccordion" :ui="{
            wrapper: 'space-y-2',
            default: {
              base: 'w-full flex justify-between items-center',
              padding: 'px-4 py-3'
            }
          } as any">

            <template #trailing="{ item, open }">
              <UIcon name="i-heroicons-chevron-down-20-solid"
                class="w-5 h-5 transition-transform duration-200 text-gray-400"
                :class="[open ? 'rotate-180' : 'rotate-0']" />
              <span class="text-sm font-semibold text-left text-gray-900 dark:text-white flex-1 min-w-0">
                {{ item.label }}
              </span>
              <UButton :label="$t('tmpl_gunakan')" size="xs" color="primary" variant="solid" class="shrink-0"
                @click.stop="selectTemplate(item)" />
            </template>

            <template #default>
              <span />
            </template>

            <template #template-body="{ item }">
              <div class="pb-4">
                <iframe :srcdoc="item.content" class="w-full rounded-lg bg-gray-50 shadow-sm border border-gray-200"
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
            {{ isEditMode ? $t('tmpl_edit_template') : $t('tmpl_simpan_template_baru') }}
          </h3>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ $t('tmpl_nama_template') }}</label>
            <UInput v-model="newTemplateName" :placeholder="$t('tmpl_nama_template_placeholder')" icon="i-heroicons-tag"
              size="lg" class="w-full" />
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-300">
              <span v-if="isEditMode" v-html="$t('tmpl_konten_diperbarui')" />
              <span v-else v-html="$t('tmpl_konten_disimpan')" />
            </p>
          </div>
        </div>
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-lg">
          <UButton :label="$t('batal')" variant="ghost" color="neutral" @click="isAddTemplateOpen = false" />
          <UButton :label="isEditMode ? $t('tmpl_simpan_perubahan') : $t('f_simpan')" color="primary"
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
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mr-2">{{ $t('tmpl_template_saya') }}</h3>
            <UBadge color="primary" variant="subtle">{{ myTemplates.length }}</UBadge>
          </div>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="isMyTemplateModalOpen = false" />
        </div>
        <div class="p-4 overflow-y-auto">
          <div v-if="isLoadingList" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>
          <div v-else-if="myTemplates.length === 0" class="p-6 text-center text-gray-500">
            {{ $t('tmpl_belum_ada_template') }}
          </div>
          <div v-else class="space-y-3">
            <!-- <UAccordion multiple :items="myTemplatesAccordion" :ui="{ wrapper: 'space-y-2' }">
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
                  <UButton icon="i-heroicons-pencil-square" color="warning" variant="soft" size="xs"
                    @click="openEditModal(item)" />
                  <UButton icon="i-heroicons-trash" color="error" variant="soft" size="xs"
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
          </UAccordion> -->

            <UAccordion type="multiple" :items="myTemplatesAccordion" :ui="{
              wrapper: 'space-y-2',
              default: {
                base: 'w-full flex justify-between items-center',
                padding: 'px-4 py-3'
              }
            } as any">

              <template #trailing="{ item, open }">
                <UIcon name="i-heroicons-chevron-down-20-solid"
                  class="w-5 h-5 transition-transform duration-200 text-gray-400"
                  :class="[open ? 'rotate-180' : 'rotate-0']" />
                <span class="text-sm font-semibold text-left text-gray-900 dark:text-white flex-1 min-w-0">
                  {{ item.label }}
                </span>
                <div class="flex items-center gap-2">
                  <UButton icon="i-lucide-pencil" color="warning" variant="soft" size="xs"
                    @click="openEditModal(item)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="soft" size="xs"
                    @click="handleDeleteTemplate(item.id)" />
                  <!-- Vertical divider -->
                  <div class="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <UButton :label="$t('tmpl_gunakan')" size="xs" color="primary" variant="solid" @click="selectTemplate(item)" />
                </div>

              </template>

              <template #default>
                <span />
              </template>

              <template #template-body="{ item }">
                <div class="pb-4">
                  <iframe :srcdoc="item.content" class="w-full rounded-lg bg-gray-50 shadow-sm border border-gray-200"
                    style="height: 150px; pointer-events: none;" />
                </div>
              </template>
            </UAccordion>

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useTemplateTulis } from '@/composables/useTemplateTulis';
import type { TemplateSurat, TemplatePayload } from '@/types/templates';

// Props & Emits
const props = defineProps<{ currentContent: string }>();
const emit = defineEmits<{ (e: 'apply', content: string): void }>();

// Composables
// const { Alert } = useSwal();
import { Alert } from '@/composables/useAlert';
const toast = useToast();
const { t } = useI18n();
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
  { id: 'list-decimal', name: 'Default', nameKey: 'tmpl_tpl_default', content: '<ol><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li></ol>' },
  { id: 'list-alpha', name: 'Numbering with child', nameKey: 'tmpl_tpl_numbering_child', content: '<ol><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.<ol type="a"><li>Satu</li><li>Dua</li><li>Tiga</li></ol></li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.<ol type="a"><li>Satu</li><li>Dua</li><li>Tiga</li></ol></li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.<ol type="a"><li>Satu</li><li>Dua</li><li>Tiga</li></ol></li></ol>' },
  { id: 'list-roman', name: 'Normal Table', nameKey: 'tmpl_tpl_normal_table', content: '<ol><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<table border="1"><thead><tr><th>Kolom 1</th><th>Kolom 2</th><th>Kolom 3</th><th>Kolom 4</th><th>Kolom 5</th></tr></thead><tbody><tr><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td></tr><tr><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td></tr><tr><td>Baris 3</td><td>Baris 3</td><td>Baris 3</td><td>Baris 3</td><td>Baris 3</td></tr></tbody></table></li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li></ol>' },
  { id: 'list-bullet', name: 'Table Merge', nameKey: 'tmpl_tpl_table_merge', content: '<ol><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<table border="1"><thead><tr><th rowspan="2">Kolom Merge 1</th><th colspan="5">Kolom Merge 2</th></tr><tr><th>Kolom 3</th><th>Kolom 4</th><th>Kolom 5</th><th>Kolom 6</th><th>Kolom 7</th></tr></thead><tbody><tr><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td></tr><tr><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td></tr></tbody></table></li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li></ol>' },
  { id: 'list-combination', name: 'Numbering & Table', nameKey: 'tmpl_tpl_numbering_table', content: '<ol><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<ol type="a"><li>Satu</li><li>Dua</li><li>Tiga</li></ol></li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<table border="1"><thead><tr><th>Kolom 1</th><th>Kolom 2</th><th>Kolom 3</th><th>Kolom 4</th><th>Kolom 5</th><th>Kolom 6</th></tr></thead><tbody><tr><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td><td>Baris 1</td></tr><tr><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td><td>Baris 2</td></tr></tbody></table></li><li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li></ol>' },
  { id: 'table-identity', name: 'Tabel Identitas Kegiatan', nameKey: 'tmpl_tpl_tabel_identitas', content: '<table border="1" width="100%" cellpadding="6" cellspacing="0"><tr><td width="30%">Nama Kegiatan</td><td width="70%">:</td></tr><tr><td>Tanggal</td><td>:</td></tr><tr><td>Waktu</td><td>:</td></tr><tr><td>Tempat</td><td>:</td></tr></table>' },
  { id: 'table-participant', name: 'Tabel Peserta', nameKey: 'tmpl_tpl_tabel_peserta', content: '<table border="1" width="100%" cellpadding="6" cellspacing="0"><tr><th width="5%">No</th><th width="35%">Nama</th><th width="30%">Jabatan</th><th width="30%">Keterangan</th></tr><tr><td align="center">1</td><td></td><td></td><td></td></tr><tr><td align="center">2</td><td></td><td></td><td></td></tr></table>' },
  { id: 'table-agenda', name: 'Tabel Agenda Kegiatan', nameKey: 'tmpl_tpl_tabel_agenda', content: '<table border="1" width="100%" cellpadding="6" cellspacing="0"><tr><th width="10%">No</th><th width="30%">Hari / Tanggal</th><th width="30%">Waktu</th><th width="30%">Agenda</th></tr><tr><td align="center">1</td><td></td><td></td><td></td></tr><tr><td align="center">2</td><td></td><td></td><td></td></tr></table>' },
  {
    id: 'list-decimal-parentheses',
    name: 'Daftar Angka (1))',
    nameKey: 'tmpl_tpl_daftar_angka',
    content: `
      <ol style="list-style-type: decimal;">
        <li style="list-style-type: none;">1) Poin pertama</li>
        <li style="list-style-type: none;">2) Poin kedua</li>
        <li style="list-style-type: none;">3) Poin ketiga</li>
      </ol>
    `
  },

  // 1. 1.1 1.1.1
  {
    id: 'list-multilevel',
    name: 'Daftar Bertingkat (1.1.1)',
    nameKey: 'tmpl_tpl_daftar_bertingkat',
    content: `
      <ol>
        <li>Poin utama
          <ol>
            <li>Sub poin
              <ol>
                <li>Sub sub poin</li>
                <li>Sub sub poin</li>
              </ol>
            </li>
            <li>Sub poin</li>
          </ol>
        </li>
        <li>Poin utama</li>
      </ol>
    `
  },

  // Contoh eksplisit 1.1.2, 1.1.3
  {
    id: 'list-manual-numbering',
    name: 'Daftar Bertingkat Manual (1.1.2)',
    nameKey: 'tmpl_tpl_daftar_bertingkat_manual',
    content: `
    <ol style="list-style: none; padding-left: 0;">
      <li>1. Pendahuluan
        <ol style="list-style: none; padding-left: 20px;">
          <li>1.1 Latar Belakang
            <ol style="list-style: none; padding-left: 20px;">
              <li>1.1.1 Sejarah Singkat</li>
              <li>1.1.2 Kondisi Saat Ini</li>
            </ol>
          </li>
          <li>1.2 Tujuan dan Manfaat</li>
        </ol>
      </li>

      <li>2. Tinjauan Pustaka
        <ol style="list-style: none; padding-left: 20px;">
          <li>2.1 Landasan Teori</li>
          <li>2.2 Penelitian Terdahulu
            <ol style="list-style: none; padding-left: 20px;">
              <li>2.2.1 Metode Pertama</li>
              <li>2.2.2 Metode Kedua</li>
            </ol>
          </li>
        </ol>
      </li>

      <li>3. Metodologi Pelaksanaan
        <ol style="list-style: none; padding-left: 20px;">
          <li>3.1 Tahap Persiapan</li>
          <li>3.2 Tahap Pengumpulan Data
            <ol style="list-style: none; padding-left: 20px;">
              <li>3.2.1 Observasi Lapangan</li>
              <li>3.2.2 Wawancara Mendalam</li>
              <li>3.2.3 Studi Dokumen</li>
            </ol>
          </li>
          <li>3.3 Tahap Analisis Data</li>
        </ol>
      </li>

      <li>4. Hasil dan Pembahasan
        <ol style="list-style: none; padding-left: 20px;">
          <li>4.1 Deskripsi Data</li>
          <li>4.2 Analisis Temuan Utama</li>
        </ol>
      </li>

      <li>5. Kesimpulan dan Saran
        <ol style="list-style: none; padding-left: 20px;">
          <li>5.1 Kesimpulan
            <ol style="list-style: none; padding-left: 20px;">
              <li>5.1.1 Implikasi Teoritis</li>
              <li>5.1.2 Implikasi Praktis</li>
            </ol>
          </li>
          <li>5.2 Saran untuk Tindak Lanjut</li>
        </ol>
      </li>
    </ol>
  `
  }
]

// --- COMPUTED ---
const publicTemplatesAccordion = computed(() => {
  return publicTemplates.map(tpl => {
    const name = tpl.nameKey ? t(tpl.nameKey) : tpl.name;
    return { ...tpl, name, label: name, slot: 'template-body' };
  });
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

  const positionId = user.value?.position ?? user.value?.position_id;
  if (!positionId) return;

  try {
    isLoadingList.value = true;
    const data = await getTemplatesByPosition(String(positionId));
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
      Alert.warning(t('tmpl_gagal_menyimpan'), t('tmpl_isi_editor'));
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
  const positionId = user.value?.position ?? user.value?.position_id;

  if (!positionId) {
    Alert.error(t('f_gagal'), t('tmpl_error_posisi'));
    return;
  }

  // Payload
  const payload: TemplatePayload = {
    id_position: String(positionId),
    nama_template: newTemplateName.value,
    content: props.currentContent // Selalu ambil konten dari editor saat ini
  };

  try {
    isLoadingAction.value = true;

    if (isEditMode.value && editingId.value) {
      // --- UPDATE ---
      await updateTemplate(editingId.value, payload);
      toast.add({ title: t('f_berhasil'), description: t('tmpl_template_diperbarui'), color: 'success' });
    } else {
      // --- CREATE ---
      await createTemplate(payload);
      toast.add({ title: t('f_berhasil'), description: t('tmpl_template_disimpan'), color: 'success' });
    }

    // Refresh list & Close modals
    isAddTemplateOpen.value = false;
    await fetchMyTemplates();

  } catch (error) {
    console.error(error);
    Alert.error(t('f_gagal'), t('tmpl_gagal_simpan'));
  } finally {
    isLoadingAction.value = false;
  }
};

// 4. Delete Template
// Tambahkan console.log untuk debugging
const handleDeleteTemplate = async (id: any) => {
  if (!id) {
    Alert.warning(t('f_gagal'), t('tmpl_error_id_template'));
    return;
  }

  // 1. Tampilkan Confirm
  // Saat user klik "Ya, Hapus", tombol akan berubah jadi loading spinner & modal tetap terbuka
  const isConfirmed = await Alert.confirm(
    t('tmpl_konfirmasi_hapus'),
    t('tmpl_konfirmasi_hapus_pesan'),
    t('tmpl_ya_hapus'),
    t('batal'),
    true
  );

  // 2. Jika user klik Batal, proses berhenti (Modal sudah tertutup otomatis oleh onCancel)
  if (!isConfirmed) return;

  try {
    isLoadingList.value = true;

    // 3. Lakukan proses delete ke API
    await deleteTemplateById(String(id));

    toast.add({
      title: t('tmpl_terhapus'),
      description: t('tmpl_template_terhapus'),
      color: 'success'
    });

    // Refresh data
    await fetchMyTemplates();

  } catch (error) {
    console.error('Error saat delete:', error);
    // Tampilkan pesan error (bisa pakai toast atau alert warning)
    toast.add({
      title: t('f_gagal'),
      description: t('tmpl_gagal_hapus'),
      color: 'error'
    });
  } finally {
    isLoadingList.value = false;

    // 4. WAJIB: Tutup Alert manual untuk menghentikan loading spinner
    Alert.close();
  }
};

// 5. Use Template
const selectTemplate = async (template: any) => {
  // Gunakan nama template dari item list (public vs myTemplate punya key berbeda)
  const templateName = template.name || template.label;

  const isConfirmed = await Alert.confirm(
    t('tmpl_gunakan_template'),
    t('tmpl_konfirmasi_gunakan', { name: templateName }),
    t('tmpl_ya_gunakan'),
    t('batal'),
    false
  );

  if (!isConfirmed) return;

  // --- MODAL SEDANG LOADING DISINI ---

  try {
    // 1. Jalankan logika utama Anda di sini (contoh: set content editor)
    // await applyTemplateToEditor(templateName);
    /* log removed */;

    // Simulasi proses async (hapus ini jika kode Anda sinkron)
    await new Promise(r => setTimeout(r, 500));

  } catch (error) {
    console.error("Gagal menerapkan template:", error);
    // Opsional: Tampilkan error alert lain jika perlu
  } finally {
    // 2. WAJIB: Perintah tutup modal setelah proses selesai (sukses/gagal)
    Alert.close();
  }

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
