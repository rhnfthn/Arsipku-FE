<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">

    <UButton label="Pilih Template" color="primary" variant="soft" icon="i-heroicons-adjustments-horizontal"
      class="w-full sm:w-auto justify-center" @click="isTemplateModalOpen = true" />

    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <UButton label="Simpan Sebagai Template" icon="i-heroicons-plus" variant="soft" color="primary"
        class="w-full sm:w-auto justify-center" @click="openSaveModal" />

      <UButton label="Template Saya" icon="i-heroicons-bookmark" variant="soft" color="primary"
        class="w-full sm:w-auto justify-center" @click="isMyTemplateModalOpen = true" />
    </div>
  </div>

  <div v-if="isTemplateModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-gray-900/75 transition-opacity" @click="isTemplateModalOpen = false"></div>

    <div class="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">

      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pilih Template</h3>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isTemplateModalOpen = false" />
      </div>

      <div class="p-4 overflow-y-auto">
        <div class="space-y-3">
          <UAccordion class="justify-between" multiple :items="publicTemplatesAccordion" :ui="{ wrapper: 'space-y-2' }">

            <template #default="{ item, open }">
              <UButton color="gray" variant="ghost" class="w-full flex justify-between items-center py-3" :ui="{ rounded: 'rounded-none' }">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-chevron-right" :class="[open && 'transform rotate-90']"
                    class="w-4 h-4 transition-transform" />
                  <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ item.label }}</span>
                </div>

                <UButton label="Gunakan" size="xs" color="primary" variant="solid" @click.stop="selectTemplate(item)" />
              </UButton>
            </template>

            <template #template-body="{ item }">
              <div class="p-2">
                <iframe :srcdoc="item.content" class="w-full rounded bg-white shadow-sm border border-gray-200"
                  style="pointer-events: none;" />
              </div>
            </template>

          </UAccordion>
        </div>
      </div>
    </div>
  </div>

  <div v-if="isAddTemplateOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-gray-900/75 transition-opacity" @click="isAddTemplateOpen = false"></div>

    <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Simpan Template</h3>
      </div>

      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Template</label>
          <UInput v-model="newTemplateName" placeholder="Masukkan nama template" icon="i-heroicons-tag" size="lg"
            class="w-full" />
        </div>
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-300">
            Konten editor saat ini akan disimpan sebagai template <strong>{{ newTemplateName || '...' }}</strong>
          </p>
        </div>
      </div>

      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-lg">
        <UButton label="Batal" variant="ghost" color="gray" @click="isAddTemplateOpen = false" />
        <UButton label="Simpan" color="primary" icon="i-heroicons-check-circle" :disabled="!newTemplateName.trim()"
          @click="saveMyTemplate" />
      </div>
    </div>
  </div>

  <div v-if="isMyTemplateModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-gray-900/75 transition-opacity" @click="isMyTemplateModalOpen = false"></div>

    <div class="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">

      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mr-2">Template Saya</h3>
          <UBadge color="primary" variant="subtle">{{ myTemplates.length }}</UBadge>
        </div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isMyTemplateModalOpen = false" />
      </div>

      <div class="p-4 overflow-y-auto">
        <div v-if="myTemplates.length === 0" class="p-6 text-center text-gray-500">
          Belum ada template tersimpan
        </div>

        <div v-else class="space-y-3">
          <UAccordion multiple :items="myTemplatesAccordion" :ui="{ wrapper: 'space-y-2' }">

            <template #default="{ item, open }">
              <UButton color="gray" variant="ghost"
                class="border-b border-gray-100 dark:border-gray-700 w-full flex justify-between items-center py-3"
                :ui="{ rounded: 'rounded-none' }">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-chevron-right" :class="[open && 'transform rotate-90']"
                    class="w-4 h-4 transition-transform" />
                  <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ item.label }}</span>
                </div>

                <div class="flex items-center gap-2">
                  <UButton icon="i-heroicons-trash" color="red" variant="soft" size="xs"
                    @click.stop="deleteTemplate(item.id)" />
                  <UButton label="Gunakan" size="xs" color="primary" variant="solid"
                    @click.stop="selectTemplate(item)" />
                </div>
              </UButton>
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
import { ref, computed } from 'vue';
const { Alert } = useSwal()

const props = defineProps<{
  currentContent: string
}>();

const emit = defineEmits<{
  (e: 'apply', content: string): void
}>();

const toast = useToast();

// State Modal
const isTemplateModalOpen = ref(false);
const isAddTemplateOpen = ref(false);
const isMyTemplateModalOpen = ref(false);

// State Data
const newTemplateName = ref('');
const myTemplates = ref<any[]>([]);

// Data Mockup Public Template
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

// --- COMPUTED (Menambahkan 'slot' agar tidak render text mentah) ---

const publicTemplatesAccordion = computed(() => {
  return publicTemplates.map(t => ({
    label: t.name,          // Judul Accordion
    slot: 'template-body',  // Body slot
    ...t
  }));
});

const myTemplatesAccordion = computed(() => {
  return myTemplates.value.map(t => ({
    label: t.name,          // Judul Accordion
    slot: 'template-body',  // Body slot
    ...t
  }));
});

// --- Actions ---

const openSaveModal = () => {
  if (!props.currentContent || props.currentContent.trim() === '') {
    Alert.warning('Gagal menyimpan!', 'Isi editor terlebih dahulu.')
    return;
  }
  isAddTemplateOpen.value = true;
}

const selectTemplate = (template: any) => {
  const isConfirmed = confirm(
    `Apakah Anda yakin ingin menggunakan template "${template.name}"? \n\nPERINGATAN: Isi editor saat ini akan diganti seluruhnya.`
  );

  if (!isConfirmed) return;

  emit('apply', template.content);

  isTemplateModalOpen.value = false;
  isMyTemplateModalOpen.value = false;
};

const saveMyTemplate = () => {
  if (!newTemplateName.value.trim()) return;

  myTemplates.value.push({
    id: Date.now(),
    name: newTemplateName.value,
    content: props.currentContent
  });

  newTemplateName.value = '';
  isAddTemplateOpen.value = false;
  toast.add({ title: 'Berhasil', description: 'Template disimpan', color: 'green' });
};

const deleteTemplate = (id: number) => {
  myTemplates.value = myTemplates.value.filter(t => t.id !== id);
};
</script>
