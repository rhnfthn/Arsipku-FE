<template>
  <UModal v-model:open="open" :title="mode === 'edit' ? 'Ubah Delegate Direksi' : 'Tambah Delegate Direksi'">
    <template #body>
      <div class="space-y-4">
        <UInput
          v-model="q"
          placeholder="Cari nama pegawai…"
          icon="i-lucide-search"
          class="w-full"
          :loading="searching"
        />
        <div v-if="results.length" class="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
          <button
            v-for="p in results"
            :key="p.persnum"
            type="button"
            @click="pick(p)"
            class="w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-700/50 flex justify-between gap-2"
          >
            <span class="text-sm text-gray-900 dark:text-white truncate">{{ p.name }}</span>
            <span class="text-xs text-gray-400 shrink-0">#{{ p.persnum }}</span>
          </button>
        </div>
        <p v-else-if="q && !searching" class="text-xs text-gray-400 text-center py-4">
          Tidak ada pegawai ditemukan.
        </p>

        <div v-if="selected" class="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-700 dark:text-gray-200">
            Terpilih: <span class="font-semibold">{{ selected.name }}</span> (#{{ selected.persnum }})
          </p>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aktor</p>
            <div class="flex gap-1 bg-[#f3f4f6] dark:bg-gray-800 rounded-lg p-1">
              <button
                v-for="opt in statusOptions"
                :key="opt"
                type="button"
                @click="positionStatus = opt"
                :class="[
                  'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition',
                  positionStatus === opt
                    ? 'bg-[#457fb6] text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700',
                ]"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" @click="open = false">Batal</UButton>
        <UButton
          color="primary"
          :disabled="!selected || !positionStatus || saving"
          :loading="saving"
          @click="save"
        >
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useStruktur } from '~/composables/useStruktur';

const props = defineProps<{
  naskahId: string;
  approvalId: string;
  companyId: string | number;
  mode?: 'add' | 'edit';
  currentDelegateName?: string;
  currentDelegatePersnum?: number;
  currentPositionStatus?: 'PT' | 'PH' | 'PS';
}>();
const emit = defineEmits<{ saved: []; }>();

const open = defineModel<boolean>('open', { default: false });
const { searchPerson } = useStruktur();
const { assignDelegasiDireksi } = useNaskahLainnya();
const toast = useToast();

const q = ref('');
const results = ref<{ persnum: number; name: string }[]>([]);
const searching = ref(false);
const selected = ref<{ persnum: number; name: string } | null>(null);
const positionStatus = ref<'PT' | 'PH' | 'PS'>('PT');
const saving = ref(false);
const statusOptions: Array<'PT' | 'PH' | 'PS'> = ['PT', 'PH', 'PS'];

let debounce: any = null;
let abort: AbortController | null = null;

watch(q, (val) => {
  if (selected.value && val.trim() !== selected.value.name) selected.value = null;
  if (debounce) clearTimeout(debounce);
  if (abort) abort.abort();
  if (!val || val.trim().length < 2) {
    results.value = [];
    return;
  }
  debounce = setTimeout(async () => {
    searching.value = true;
    abort = new AbortController();
    try {
      const res: any = await searchPerson(props.companyId, val.trim(), abort.signal);
      results.value = (res?.data ?? res ?? []).map((p: any) => ({
        persnum: p.persnum,
        name: p.name,
      }));
    } catch {
      results.value = [];
    } finally {
      searching.value = false;
    }
  }, 300);
});

watch(open, (v) => {
  if (v && props.mode === 'edit' && props.currentDelegatePersnum) {
    selected.value = { persnum: props.currentDelegatePersnum, name: props.currentDelegateName ?? '' };
    positionStatus.value = props.currentPositionStatus ?? 'PT';
    q.value = props.currentDelegateName ?? '';
  } else if (v) {
    q.value = ''; selected.value = null; positionStatus.value = 'PT'; results.value = [];
  }
});

function pick(p: { persnum: number; name: string }) {
  selected.value = p;
}

async function save() {
  if (!selected.value || !positionStatus.value) return;
  saving.value = true;
  try {
    await assignDelegasiDireksi(props.naskahId, props.approvalId, {
      delegatePersnum: selected.value.persnum,
      delegateName: selected.value.name,
      positionStatus: positionStatus.value,
    });
    toast.add({ title: 'Delegate direksi disimpan', color: 'success' });
    emit('saved');
    open.value = false;
  } catch {
    toast.add({ title: 'Gagal menyimpan delegate', color: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>
