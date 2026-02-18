<template>
  <div
    class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
      {{ label }}
    </span>

    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu :model-value="model" :items="combinedOptions" multiple :placeholder="placeholder"
        class="w-full p-0 custom-select-menu" variant="none"
        :content="{ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' }" :filter-fields="['label']" :ui="{
          base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
          wrapper: 'pr-10 w-full',
          input: 'pr-10 w-full',
          value: 'p-0 w-full',
          viewport: 'max-h-[500px]',
          trigger: { base: 'px-0 py-1 w-full' },
          item: 'cursor-pointer',
          itemWrapper: 'w-full',
          itemLabel: 'w-full'
        }">
        <template #item="{ item }">
          <!-- Label/Header Section -->
          <div v-if="item.type === 'label'" class="header-label">
            <span class="header-label-text">
              {{ item.label }}
            </span>
          </div>

          <!-- Group Section -->
          <div v-else-if="item.type === 'group'" class="flex items-center gap-3 w-full py-1"
            @click.stop.prevent="handleGroupClick(item)">
            <UCheckbox :model-value="isGroupSelected(item)" class="pointer-events-none shrink-0"
              :ui="{ base: 'w-4 h-4' }" />
            <div class="flex-1 min-w-0">
              <span class="block text-sm text-left truncate w-full">
                {{ item.label }}
                <span class="text-xs text-gray-500">
                  ({{ item.count }} Anggota)
                </span>
              </span>
            </div>
          </div>

          <!-- Person Section -->
          <div v-else class="flex items-start gap-3 w-full py-1 overflow-hidden"
            :class="{ 'opacity-50 cursor-not-allowed': item.disabled }" @click.stop.prevent="handlePersonClick(item)">
            <UCheckbox :model-value="isSelected(item)" class="pointer-events-none shrink-0" :checked="isSelected(item)"
              :disabled="item.disabled" />
            <img v-if="item.image" :src="item.image" :alt="item.label"
              class="w-7 h-7 rounded-full object-cover shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="block text-sm text-left truncate w-full">
                {{ item.label }}
              </span>
              <span v-if="item.disabled" class="text-xs text-red-500 italic block">
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
                {{ item.label }}
              </span>
              <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                @click.stop="removePerson(item)" />
            </UBadge>
            <span v-if="!model.length" class="text-sm text-gray-400 dark:text-gray-500">
              {{ placeholder }}
            </span>
          </div>
        </template>
      </USelectMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  placeholder?: string;
  items: any[];
  groups?: any[];
  excludeItems?: any[];
  disabledMessage?: string;
}>();

const model = defineModel<any[]>({ default: [] });

// 1. Memproses Orang (Person) - Menandai Disabled
const processedPeople = computed(() => {
  return props.items.map((item) => ({
    ...item,
    type: 'person', // Penanda tipe
    disabled: props.excludeItems?.some((ex) => ex.value === item.value) || false,
  }));
});

// 2. Memproses Grup - Format Data
const processedGroups = computed(() => {
  if (!props.groups) return [];
  return props.groups.map(g => ({
    ...g,
    label: g.nama, // Mapping nama grup ke label agar bisa disearch
    value: g.id,
    type: 'group',
    count: g.details ? g.details.length : 0
  }));
});

// 3. Menggabungkan Semua Opsi untuk Dropdown (Header + Grup + Header + Orang)
const combinedOptions = computed(() => {
  const options = [];

  // Bagian Atas: Grup (Jika ada)
  if (processedGroups.value.length > 0) {
    options.push({ label: `Grup ${props.label}`, type: 'label', disabled: true });
    options.push(...processedGroups.value);
  }

  // Bagian Bawah: Orang
  options.push({ label: props.label, type: 'label', disabled: true });
  options.push(...processedPeople.value);

  return options;
});

// --- LOGIC SELEKSI ---

const isSelected = (item: any) => model.value.some((s) => s.value === item.value);

// Helper: Ambil Objek Orang Asli berdasarkan Grup
const getValidPeopleInGroup = (group: any) => {
  if (!group.details) return [];
  const groupPosIds = group.details.map((d: any) => String(d.position));

  // Cari orang di master data yang ID-nya cocok DAN tidak disabled (tidak ada di exclude)
  return processedPeople.value.filter(p =>
    groupPosIds.includes(String(p.value)) && !p.disabled
  );
};

// Cek Status Centang Grup
const isGroupSelected = (group: any) => {
  const validPeople = getValidPeopleInGroup(group);
  if (validPeople.length === 0) return false;

  // Grup tercentang HANYA JIKA semua member validnya sudah ada di model
  return validPeople.every(p => isSelected(p));
};

// Handle Klik Grup
const handleGroupClick = (group: any) => {
  const currentlySelected = isGroupSelected(group);
  const validPeople = getValidPeopleInGroup(group);

  if (!currentlySelected) {
    // CHECKLIST: Tambahkan member valid yang belum ada di model
    const newPeople = validPeople.filter(p => !isSelected(p));
    // Kita push objek aslinya (bersihkan properti UI helper jika perlu, tapi di sini aman)
    const cleanNewPeople = newPeople.map(p => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type, disabled, ...rest } = p;
      return rest; // Kembalikan ke format raw item
    });

    // Gabungkan dengan model yang ada
    model.value = [...model.value, ...cleanNewPeople];
  } else {
    // UN-CHECKLIST: Hapus semua member grup ini dari model
    const idsToRemove = validPeople.map(p => p.value);
    model.value = model.value.filter(m => !idsToRemove.includes(m.value));
  }
};

// Handle Klik Orang (Single)
const handlePersonClick = (person: any) => {
  if (person.disabled) return; // Cegah klik jika disabled (validasi cross-check)

  if (isSelected(person)) {
    removePerson(person);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, disabled, ...rest } = person;
    model.value = [...model.value, rest];
  }
};

const removePerson = (item: any) => {
  const index = model.value.findIndex((s) => s.value === item.value);
  if (index > -1) {
    const newModel = [...model.value];
    newModel.splice(index, 1);
    model.value = newModel;
  }
};
</script>

<style scoped>
/* Styling untuk label header */
.header-label {
  width: 100%;
  padding: 0.5rem;
  background-color: rgb(243 244 246);
  text-align: center;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
  pointer-events: none;
}

.dark .header-label {
  background-color: rgb(31 41 55);
}

.header-label-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(75 85 99);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.dark .header-label-text {
  color: rgb(156 163 175);
}

/* Override default USelectMenu item styling untuk label */
:deep(.custom-select-menu .header-label) {
  width: 100% !important;
  padding: 0.5rem !important;
  background-color: rgb(243 244 246) !important;
  text-align: center !important;
  margin-left: -0.5rem !important;
  margin-right: -0.5rem !important;
  pointer-events: none !important;
}

:deep(.custom-select-menu) .dark .header-label {
  background-color: rgb(31 41 55) !important;
}
</style>
