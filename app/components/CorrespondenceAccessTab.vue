<template>
  <div class="p-6">
    <Heading variant="heading9sb" class="text-mobile-md"> Hak Akses Korespondensi </Heading>
    <p class="mb-7 mt-1 text-sm text-gray-500 dark:text-gray-400">
      Tentukan profil organisasi yang boleh membuat setiap jenis naskah. Kriteria BOD tag, chief,
      dan area diterapkan bersamaan.
    </p>

    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="item in 5" :key="item" class="h-44 w-full rounded-xl" />
    </div>

    <div v-else class="space-y-4">
      <section
        v-for="documentType in documentTypes"
        :key="documentType"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-semibold text-gray-800 dark:text-white">
              {{ documentLabels[documentType] }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ documentType }} ·
              {{
                configured.has(documentType)
                  ? 'Konfigurasi tersimpan'
                  : 'Masih menggunakan akses bawaan'
              }}
            </p>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <UCheckbox v-model="forms[documentType].is_active" color="primary" />
            Aktif
          </label>
        </div>

        <div class="grid gap-4 xl:grid-cols-3">
          <fieldset>
            <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              BOD tag
            </legend>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="tag in bodTags"
                :key="tag"
                class="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                <input
                  v-model="forms[documentType].bod_tags"
                  type="checkbox"
                  :value="tag"
                  class="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {{ tag === 'NONE' ? 'Tanpa BOD tag' : tag }}
              </label>
            </div>
            <p class="mt-2 text-xs text-gray-400">Kosong berarti semua BOD tag.</p>
          </fieldset>

          <fieldset>
            <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Chief
            </legend>
            <div class="flex flex-wrap gap-2">
              <label
                class="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                <input
                  v-model="forms[documentType].chief_values"
                  type="checkbox"
                  :value="1"
                  class="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Chief
              </label>
              <label
                class="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                <input
                  v-model="forms[documentType].chief_values"
                  type="checkbox"
                  :value="0"
                  class="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Non-chief
              </label>
            </div>
            <p class="mt-2 text-xs text-gray-400">Kosong berarti semua nilai chief.</p>
          </fieldset>

          <fieldset>
            <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Area cabang
            </legend>
            <div class="mb-2 flex gap-2">
              <button
                v-for="mode in areaModes"
                :key="mode.value"
                type="button"
                class="rounded-lg border px-3 py-1.5 text-xs font-medium"
                :class="
                  forms[documentType].area_mode === mode.value
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary dark:border-gray-700 dark:text-gray-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-300'
                "
                @click="forms[documentType].area_mode = mode.value"
              >
                {{ mode.label }}
              </button>
            </div>
            <div
              v-if="forms[documentType].area_mode === 'SELECTED'"
              class="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700"
            >
              <label
                v-for="area in areas"
                :key="area.id"
                class="flex items-start gap-2 rounded px-1 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <input
                  v-model="forms[documentType].area_ids"
                  type="checkbox"
                  :value="area.id"
                  class="mt-0.5 size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{{ area.name }}</span>
              </label>
            </div>
          </fieldset>
        </div>

        <div class="mt-4 flex justify-end">
          <UButton
            icon="i-lucide-save"
            label="Simpan"
            color="primary"
            :loading="saving === documentType"
            :disabled="Boolean(saving)"
            @click="save(documentType)"
          />
        </div>
      </section>
    </div>

    <div
      class="mt-6 flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-200"
    >
      <UIcon name="i-lucide-info" class="mt-0.5 size-5 shrink-0" />
      <p>
        Sebelum sebuah jenis naskah disimpan di sini, sistem tetap memakai aturan akses lama.
        Setelah disimpan, konfigurasi ini menjadi sumber akses untuk menu dan halaman tulis
        korespondensi.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
type DocumentType = 'ND' | 'SDI' | 'SDE' | 'DI' | 'KA';
type AreaMode = 'ALL' | 'SELECTED';

interface AccessPolicy {
  document_type: DocumentType;
  bod_tags: string[] | null;
  chief_values: number[] | null;
  area_mode: AreaMode;
  area_ids: string[] | null;
  is_active: boolean | number;
}

interface AccessForm {
  document_type: DocumentType;
  bod_tags: string[];
  chief_values: number[];
  area_mode: AreaMode;
  area_ids: string[];
  is_active: boolean;
}

const documentTypes: DocumentType[] = ['ND', 'SDI', 'SDE', 'DI', 'KA'];
const documentLabels: Record<DocumentType, string> = {
  ND: 'Nota Dinas',
  SDI: 'Surat Dinas Internal',
  SDE: 'Surat Dinas Eksternal',
  DI: 'Disposisi',
  KA: 'Kajian',
};
const areaModes = [
  { label: 'Semua area', value: 'ALL' as const },
  { label: 'Area terpilih', value: 'SELECTED' as const },
];

const createForm = (documentType: DocumentType): AccessForm => ({
  document_type: documentType,
  bod_tags: [],
  chief_values: [],
  area_mode: 'ALL',
  area_ids: [],
  is_active: true,
});

const { apiGet, apiPatch } = useApi();
const toast = useToast();
const { invalidateCapabilities } = useCorrespondenceRoutingAccess();
const loading = ref(false);
const saving = ref<DocumentType | null>(null);
const bodTags = ref<string[]>([]);
const areas = ref<Array<{ id: string; name: string }>>([]);
const configured = ref(new Set<DocumentType>());
const forms = reactive<Record<DocumentType, AccessForm>>(
  Object.fromEntries(documentTypes.map((type) => [type, createForm(type)])) as Record<
    DocumentType,
    AccessForm
  >
);

const fetchPolicies = async () => {
  loading.value = true;
  try {
    const response: any = await apiGet(
      '/correspondence-routing/access-policies',
      {},
      { skipCache: true }
    );
    const data = response?.data?.data ?? response?.data ?? response;
    bodTags.value = Array.isArray(data?.bod_tags) ? data.bod_tags : [];
    areas.value = Array.isArray(data?.areas) ? data.areas : [];
    const policies: AccessPolicy[] = Array.isArray(data?.policies) ? data.policies : [];
    configured.value = new Set(policies.map((policy) => policy.document_type));
    for (const policy of policies) {
      forms[policy.document_type] = {
        document_type: policy.document_type,
        bod_tags: policy.bod_tags ?? [],
        chief_values: (policy.chief_values ?? []).map(Number),
        area_mode: policy.area_mode ?? 'ALL',
        area_ids: (policy.area_ids ?? []).map(String),
        is_active: Boolean(policy.is_active),
      };
    }
  } catch (error) {
    console.error('[CorrespondenceAccessTab] fetch error:', error);
    toast.add({ title: 'Gagal memuat hak akses korespondensi', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const save = async (documentType: DocumentType) => {
  const form = forms[documentType];
  if (form.area_mode === 'SELECTED' && form.area_ids.length === 0) {
    toast.add({ title: 'Pilih minimal satu area', color: 'warning' });
    return;
  }
  saving.value = documentType;
  try {
    await apiPatch('/correspondence-routing/access-policies', { ...form });
    configured.value = new Set([...configured.value, documentType]);
    invalidateCapabilities();
    toast.add({ title: `Hak akses ${documentType} berhasil disimpan`, color: 'success' });
  } catch (error) {
    console.error('[CorrespondenceAccessTab] save error:', error);
    toast.add({ title: `Gagal menyimpan hak akses ${documentType}`, color: 'error' });
  } finally {
    saving.value = null;
  }
};

onMounted(fetchPolicies);
</script>
