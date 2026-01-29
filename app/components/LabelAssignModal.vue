<script setup lang="ts">
import { ref, computed, watch, type PropType } from "vue";
import { X, Tag, Plus, Loader2 } from 'lucide-vue-next';
import { useLabel } from '~/composables/useLabel';
import { useToast } from '#imports';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedIds: {
    type: Set as PropType<Set<string>>,
    default: () => new Set()
  },
  source: {
    type: String,
    default: 'inbox' // Ini akan digunakan jika parent tidak mengirimkan prop source
  }
});

const emit = defineEmits(['update:modelValue', 'success']);

const toast = useToast();
const { labels, fetchLabels, createLabel, addNaskahToLabel } = useLabel();

const labelSearchQuery = ref("");
const isLabelProcessing = ref(false);
const newLabelParentId = ref<string | null>("");

// --- LOGIC SORTING TREE ---
const getSortedLabelsWithLevel = (nodes: any[], level = 0, result: any[] = []) => {
  if (!nodes || nodes.length === 0) return result;
  const sorted = [...nodes].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  for (const node of sorted) {
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      getSortedLabelsWithLevel(node.children, level + 1, result);
    }
  }
  return result;
};

// --- COMPUTED: Filter & Sort ---
const filteredLabelsForAssign = computed(() => {
  const query = labelSearchQuery.value.toLowerCase().trim();
  if (query) {
    return labels.value
      .filter(l => l.nama.toLowerCase().includes(query))
      .map(l => ({ ...l, level: 0 }));
  }
  return getSortedLabelsWithLevel(labels.value);
});

const isExactLabelMatch = computed(() => {
  return labels.value.some(l => l.nama.toLowerCase() === labelSearchQuery.value.toLowerCase().trim());
});

// --- ACTION: Assign Label ---
const assignLabelToSelected = async (labelId: string, labelName: string) => {
  if (props.selectedIds.size === 0) return;
  isLabelProcessing.value = true;

  try {
    // KUNCI: Pastikan props.source dikirim ke sini
    const promises = Array.from(props.selectedIds).map(naskahId =>
      addNaskahToLabel(naskahId, labelId, props.source)
    );
    await Promise.all(promises);

    toast.add({
      title: 'Berhasil',
      description: `Label "${labelName}" ditambahkan.`,
      color: 'success'
    });

    closeModal();
    emit('success');
  } catch (error) {
    console.error("Gagal assign label:", error);
    toast.add({ title: 'Gagal', description: 'Gagal menambahkan label.', color: 'error' });
  } finally {
    isLabelProcessing.value = false;
  }
};

// --- ACTION: Create & Assign ---
const createNewAndAssign = async () => {
  const name = labelSearchQuery.value.trim();
  if (!name) return;
  isLabelProcessing.value = true;

  try {
    const payload: any = { nama: name };
    if (newLabelParentId.value) {
      payload.idParent = newLabelParentId.value;
    }

    const res = await createLabel(payload);
    // Terkadang response bersarang di res.data.data tergantung interceptor API kamu
    const newLabel = res.data?.data || res.data;

    if (newLabel && (newLabel.id || newLabel._id)) {
      // Memanggil fungsi assign di atas yang sudah menggunakan props.source
      await assignLabelToSelected(newLabel.id || newLabel._id, newLabel.nama);
      await fetchLabels();
    }
  } catch (error: any) {
    console.error("Gagal buat label:", error);
    const msg = error.response?.data?.message || 'Gagal membuat label baru.';
    toast.add({ title: 'Gagal', description: Array.isArray(msg) ? msg.join(', ') : msg, color: 'error' });
  } finally {
    isLabelProcessing.value = false;
  }
};

const closeModal = () => {
  emit('update:modelValue', false);
  labelSearchQuery.value = "";
  newLabelParentId.value = "";
};

// Fetch labels saat modal dibuka
watch(() => props.modelValue, (val) => {
  if (val) {
    fetchLabels();
    labelSearchQuery.value = "";
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 flex flex-col max-h-[500px]">

        <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 class="font-bold text-gray-900 dark:text-gray-100">Kelola Label</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 flex-1 overflow-y-auto">
          <div class="mb-3">
            <input v-model="labelSearchQuery" type="text" placeholder="Cari atau buat label..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>

          <div v-if="filteredLabelsForAssign.length > 0"
            class="space-y-1 mb-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            <div class="text-xs text-gray-500 mb-2 font-medium sticky top-0 bg-white dark:bg-gray-900 py-1 z-10">
              Label Tersedia
            </div>

            <button v-for="label in filteredLabelsForAssign" :key="label.id"
              @click="assignLabelToSelected(label.id, label.nama)" :disabled="isLabelProcessing"
              class="w-full text-left py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 group transition-colors relative"
              :style="{ paddingLeft: (12 + (label.level * 20)) + 'px', paddingRight: '12px' }">

              <div v-if="label.level > 0" class="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-100 dark:bg-gray-800"
                :style="{ left: (8 + ((label.level - 1) * 20)) + 'px' }">
              </div>

              <Tag class="shrink-0 transition-transform" :class="[
                label.level > 0 ? 'w-3 h-3 text-gray-400' : 'w-3.5 h-3.5 text-gray-500',
                'group-hover:text-primary'
              ]" />

              <span class="truncate">{{ label.nama }}</span>
            </button>
          </div>

          <div v-if="labelSearchQuery && !isExactLabelMatch"
            class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div class="text-xs text-gray-500 mb-2">Buat Label Baru</div>
            <div
              class="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-900/30">
              <div class="font-medium text-sm text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-1">
                <Plus class="w-3.5 h-3.5" /> "{{ labelSearchQuery }}"
              </div>

              <div class="mb-3">
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Induk Label (Opsional)</label>
                <select v-model="newLabelParentId"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none">
                  <option value="">Tanpa Induk</option>
                  <option v-for="l in labels" :key="l.id" :value="l.id">{{ l.nama }}</option>
                </select>
              </div>

              <button @click="createNewAndAssign" :disabled="isLabelProcessing"
                class="w-full py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded shadow-sm flex items-center justify-center gap-2">
                <Loader2 v-if="isLabelProcessing" class="w-3 h-3 animate-spin" />
                {{ isLabelProcessing ? 'Menyimpan...' : 'Simpan & Terapkan' }}
              </button>
            </div>
          </div>

          <div v-if="filteredLabelsForAssign.length === 0 && !labelSearchQuery"
            class="text-center py-6 text-gray-400 text-sm">
            Belum ada label. Ketik untuk membuat baru.
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
}
</style>
