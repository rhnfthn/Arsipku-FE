<template>
  <div
    class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
      {{ label }}
    </span>

    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu :model-value="selectedValues" value-key="value" :items="combinedOptions" multiple :placeholder="placeholder"
        :virtualize="recipientVirtualizer" @update:model-value="syncDropdownSelection"
        class="w-full p-0 custom-select-menu" variant="none"
        :content="selectContentProps" :filter-fields="['label']" :ui="{
          base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
          wrapper: 'pr-10 w-full',
          input: 'pr-10 w-full',
          value: 'p-0 w-full',
          viewport: 'max-h-[500px]',
          trigger: { base: 'px-0 py-1 w-full' },
          label: 'h-7 px-2 py-1 text-xs leading-5',
          item: 'min-h-8 px-2 py-1 cursor-pointer',
          itemWrapper: 'w-full',
          itemLabel: 'w-full'
        } as any">
        <template #item="{ item }">
          <div v-if="item.type === 'group'" class="flex items-center gap-2 w-full overflow-hidden"
            :class="{ 'opacity-50 cursor-not-allowed': item.disabled }" @click.stop.prevent="handleGroupClick(item)">
            <UCheckbox :model-value="isGroupSelected(item)" class="pointer-events-none shrink-0"
              :disabled="item.disabled" :ui="{ base: 'w-4 h-4' }" />
            <div class="flex-1 min-w-0">
              <span class="block text-sm leading-5 text-left truncate w-full">
                {{ item.label }}
              </span>
              <span v-if="item.disabled" class="text-xs leading-4 text-red-500 italic block">
                {{ disabledMessage }}
              </span>
            </div>
          </div>

          <div v-else class="flex items-center gap-2 w-full overflow-hidden"
            :class="{ 'opacity-50 cursor-not-allowed': item.disabled }" @click.stop.prevent="handlePersonClick(item)">
            <UCheckbox :model-value="isSelected(item)" class="pointer-events-none shrink-0"
              :disabled="item.disabled" :ui="{ base: 'w-4 h-4' }" />
            <img v-if="item.image" :src="item.image" :alt="item.label"
              class="w-6 h-6 rounded-full object-cover shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="block text-sm leading-5 text-left truncate w-full">
                {{ item.label }}
              </span>
              <span v-if="item.disabled" class="text-xs leading-4 text-red-500 italic block">
                {{ disabledMessage }}
              </span>
            </div>
          </div>
        </template>

        <template #default>
          <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full dark:bg-gray-800">
            <UBadge v-for="item in model" :key="item.value" color="primary" variant="soft" size="md"
              class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
              <img v-if="item.image" :src="item.image" :alt="item.label"
                class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
              <span class="text-xs font-medium text-left truncate">
                {{ formatInternalRecipientLabel(item) }}
              </span>
              <UTooltip v-if="isMandatoryCc(item)" :text="routingT('mandatoryHint')">
                <span tabindex="0" :aria-label="routingT('cc')" class="inline-flex items-center gap-1 px-1">
                  <UIcon name="i-lucide-lock-keyhole" class="h-3.5 w-3.5 shrink-0" />
                  <span class="text-xs">{{ routingT('cc') }}</span>
                </span>
              </UTooltip>
              <UButton v-else icon="i-lucide-x" size="xs" color="neutral" variant="ghost" :padded="false"
                class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                :title="routingT('remove')"
                @click.stop="removePerson(item)" />
            </UBadge>
            <span v-if="!model.length" class="text-sm text-gray-400 dark:text-gray-500">
              {{ placeholder }}
            </span>
          </div>
        </template>
      </USelectMenu>
      <Paragraph v-if="model.some(isMandatoryCc)" variant="caption1" class="w-full mt-1 text-muted">
        {{ routingT('mandatoryHint') }}
      </Paragraph>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, useId } from 'vue';
import { routingMessages } from '~/utils/routing-messages';

const { t: routingT } = useI18n({ useScope: 'local', messages: routingMessages });

const props = defineProps<{
  label: string;
  placeholder?: string;
  items: any[];
  groups?: any[];
  excludeItems?: any[];
  disabledMessage?: string;
  /** Kunci tembusan wajib — hanya aktif di field Tembusan. Default false. */
  lockMandatoryCc?: boolean;
  /** Tujuan pemakaian grup. Jika kosong, diturunkan dari label field. */
  recipientType?: 'PENERIMA' | 'TEMBUSAN';
  hideGmAbbreviation?: boolean;
}>();

const model = defineModel<any[]>({ default: [] });
const contentMarker = `recipient-select-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`;
const selectContentProps = computed(() => ({
  side: 'bottom' as const,
  sideOffset: 8,
  class: `max-h-[380px] ${contentMarker}`,
}));

/**
 * Reka UI otomatis menyorot pilihan pertama saat model multiple berubah secara
 * programatik. Efek sampingnya viewport dropdown kembali ke atas. Simpan posisi
 * viewport sebelum mutasi dan pulihkan sesudah komponen selesai render.
 */
const updateModelPreservingScroll = (update: () => void) => {
  const selector = `.${contentMarker} [data-slot="viewport"]`;
  const viewport = document.querySelector<HTMLElement>(selector);
  const scrollTop = viewport?.scrollTop;

  update();

  if (scrollTop == null) return;
  nextTick(() => {
    requestAnimationFrame(() => {
      const updatedViewport = document.querySelector<HTMLElement>(selector);
      if (updatedViewport) updatedViewport.scrollTop = scrollTop;
    });
  });
};

// Metadata routing bisa berada di level atas item ATAU di item.raw (tergantung
// mapping halaman pemanggil), jadi cek keduanya.
const routingMeta = (item: any) => ({
  routing_source: item.routing_source ?? item.raw?.routing_source,
  routing_mandatory: item.routing_mandatory ?? item.raw?.routing_mandatory,
});

const capitalizeWords = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('id-ID')
    .replace(/(^|[\s/.-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('id-ID'));

const isSupervisoryBoard = (item: any) => {
  const raw = item?.raw?.raw ?? item?.raw ?? item;
  const identity = [
    raw?.position_text,
    raw?.positionText,
    raw?.jabatan,
    raw?.organization_text,
    item?.labelJob,
    item?.label,
  ].filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
  return identity.includes('dewan pengawas');
};

const formatInternalRecipientLabel = (item: any) => {
  const raw = item?.raw?.raw ?? item?.raw ?? item;
  const positionText = formatDelegatedPosition(
    raw?.position_text ?? raw?.positionText ?? item?.labelJob,
    raw?.position_status ?? raw?.positionStatus,
  );
  if (!positionText) return item.label;

  const name = raw?.persnum_person_text ?? raw?.nama ?? raw?.name;
  const abbreviation = raw?.position_abbreviation ?? raw?.abbreviation ?? raw?.abbrivation;
  if (!name) return capitalizeWords(positionText);

  const isGeneralManager =
     /^GM(?:[-_\s]|$)/i.test(String(abbreviation || '').trim()) ||
    /^(?:general\s+manager|GM)\b/i.test(String(positionText).replace(/^(?:PT|PH|PS)\.\s*/i, ''));
  const location = isGeneralManager
    ? raw?.area_text || raw?.areaText || raw?.sub_area_text || raw?.subAreaText
    : null;

  return [
    capitalizeWords(name),
    '-',
    abbreviation && !(isGeneralManager && props.hideGmAbbreviation) ? `(${String(abbreviation).toUpperCase()})` : '',
    capitalizeWords(positionText),
    location && !String(positionText).toLocaleLowerCase('id-ID').endsWith(String(location).toLocaleLowerCase('id-ID')) ? `- ${location}` : '',
  ].filter(Boolean).join(' ');
};
// Tembusan wajib hanya terkunci pada field Tembusan (lockMandatoryCc). Di
// field Tertuju item tersebut tetap bisa dipilih dan dihapus secara normal.
const isMandatoryCc = (item: any) =>
  props.lockMandatoryCc === true && routingMeta(item).routing_mandatory === true;
// Label tidak bergantung pada pilihan; hitung ulang hanya ketika master berubah.
const preparedPeople = computed(() =>
  props.items.filter((item) => !isSupervisoryBoard(item)).map((item) => {
    const meta = routingMeta(item);
    return {
      ...item,
      value: String(item.value),
      label: formatInternalRecipientLabel(item),
      type: 'person',
      ...(meta.routing_source ? { routing_source: meta.routing_source } : {}),
      ...(meta.routing_mandatory != null ? { routing_mandatory: meta.routing_mandatory } : {}),
    };
  })
);
const selectedIds = computed(() => new Set(model.value.map((item) => String(item.value))));
const selectedValues = computed(() => [...selectedIds.value]);
const excludedIds = computed(() => new Set((props.excludeItems || []).map((item) => String(item.value))));
const selectedGroupMemberIds = computed(() => new Set<string>(
  model.value.filter((item) => item.isGroup)
    .flatMap((group) => group.raw?.details?.map((item: any) => String(item.position)) || [])
));
const processedPeople = computed(() => preparedPeople.value.map((item) => ({
  ...item,
  disabled: excludedIds.value.has(item.value) || selectedGroupMemberIds.value.has(item.value),
})));

// Penerima tambahan hasil konfigurasi routing persuratan (routing_source === 'configured')
// dipisah ke section "Tambahan" agar mudah dibedakan dari penerima struktural.
const structuralPeople = computed(() =>
  processedPeople.value.filter((item) => routingMeta(item).routing_source !== 'configured')
);
const configuredPeople = computed(() =>
  processedPeople.value.filter((item) => routingMeta(item).routing_source === 'configured')
);

// 2. Memproses Grup - Format Data & Cek Disabled
const processedGroups = computed(() => {
  if (!props.groups) return [];

  const recipientType =
    props.recipientType ??
    (/tembusan/i.test(props.label) ? 'TEMBUSAN' : 'PENERIMA');

  // Ambil ID semua individu yang sudah dipilih secara manual di input ini
  const selectedIndividualIds = new Set(model.value
    .filter(m => !m.isGroup)
    .map(m => String(m.value)));

  return props.groups
    .filter(
      (g) =>
        !Array.isArray(g.tujuan) ||
        g.tujuan.length === 0 ||
        g.tujuan.includes(recipientType),
    )
    .map(g => {
    const groupValue = `GROUP_${g.id}`;
    const groupMemberIds = g.details?.map((d: any) => String(d.position)) || [];

    // Cek apakah grup ini ada di list lawan
    const isExcluded = excludedIds.value.has(groupValue) || groupMemberIds.some((id: string) => excludedIds.value.has(id));

    // Cek apakah salah satu anggota grup ini sudah dipilih secara manual di input ini
    const hasSelectedMemberInSelf = groupMemberIds.some((id: string) => selectedIndividualIds.has(id));

    return {
      ...g,
      label: g.nama,
      labelJob: g.nama,
      value: groupValue,
      type: 'group',
      isGroup: true,
      raw: g,
      disabled: isExcluded || hasSelectedMemberInSelf // Tambahkan pengecekan mandiri
    };
    });
});

// Handle Klik Grup
const handleGroupClick = (group: any) => {
  // Cegah aksi jika grup sedang disabled
  if (group.disabled) return;

  const currentlySelected = isGroupSelected(group);

  // Grup tembusan wajib tidak boleh dilepas dari dropdown. Metadata routing
  // tersimpan pada item model hasil auto-pick, bukan pada master grup.
  const selectedGroup = model.value.find((item) => String(item.value) === String(group.value));
  if (currentlySelected && selectedGroup && isMandatoryCc(selectedGroup)) return;

  if (!currentlySelected) {
    // Hapus individu dari badge model jika mereka ada di dalam grup ini
    const groupPosIds = group.raw.details?.map((d: any) => String(d.position)) || [];
    const filteredModel = model.value.filter(m => !groupPosIds.includes(String(m.value)));

    // Buang properti khusus dropdown
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, count, disabled, ...groupItem } = group;

    updateModelPreservingScroll(() => {
      model.value = [...filteredModel, groupItem];
    });
  } else {
    // UN-CHECKLIST: Hapus badge grup dari model
    updateModelPreservingScroll(() => {
      model.value = model.value.filter(m => String(m.value) !== String(group.value));
    });
  }
};

// 3. Menggabungkan Semua Opsi untuk Dropdown (Header + Grup + Header + Orang)
const combinedOptions = computed(() => {
  const options = [];

  // Bagian Atas: Grup (Jika ada)
  if (processedGroups.value.length > 0) {
    options.push({ label: `Grup ${props.label}`, type: 'label', disabled: true });
    options.push(...processedGroups.value);
  }

  // Bagian Tengah: Orang struktural (baseline organisasi)
  options.push({ label: props.label, type: 'label', disabled: true });
  options.push(...structuralPeople.value);

  // Bagian Bawah: Penerima tambahan dari routing persuratan (jika ada)
  if (configuredPeople.value.length > 0) {
    options.push({ label: routingT('additional'), type: 'label', disabled: true });
    options.push(...configuredPeople.value);
  }

  return options;
});

// USelectMenu expects a numeric estimate. Reserve extra space when disabled
// options show a second line, while keeping normal recipient lists compact.
const recipientVirtualizer = computed(() => ({
  estimateSize: combinedOptions.value.some(item => item.type !== 'label' && item.disabled) ? 44 : 32,
  overscan: 8,
}));

// --- LOGIC SELEKSI ---

const isSelected = (item: any) => selectedIds.value.has(String(item.value));

// Cek Status Centang Grup (Cukup cek berdasarkan Value Prefix Grupnya)
const isGroupSelected = (group: any) => {
  return selectedIds.value.has(String(group.value));
};

// Nilai scalar membuat Reka UI membandingkan ID, bukan seluruh objek org/grup.
// Jalur keyboard menggunakan guard grup dan tembusan wajib yang sama dengan klik.
const syncDropdownSelection = (values: string[]) => {
  const next = new Set(values.map(String));
  for (const item of model.value) {
    if (!next.has(String(item.value))) removePerson(item);
  }
  for (const value of next) {
    if (selectedIds.value.has(value)) continue;
    const item = combinedOptions.value.find((option) => option.value === value);
    if (!item || item.disabled) continue;
    if (item.type === 'group') handleGroupClick(item);
    else handlePersonClick(item);
  }
};

// Handle Klik Orang (Single)
const handlePersonClick = (person: any) => {
  if (person.disabled) return; // Cegah klik jika disabled

  if (isSelected(person)) {
    removePerson(person);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, disabled, ...rest } = person;
    updateModelPreservingScroll(() => {
      model.value = [...model.value, rest];
    });
  }
};

const removePerson = (item: any) => {
  if (isMandatoryCc(item)) return;
  const index = model.value.findIndex((s) => String(s.value) === String(item.value));
  if (index > -1) {
    const newModel = [...model.value];
    newModel.splice(index, 1);
    updateModelPreservingScroll(() => {
      model.value = newModel;
    });
  }
};
</script>
