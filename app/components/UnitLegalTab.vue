<template>
  <div class="p-6">
    <Heading variant="heading9sb" class="text-mobile-md">
      Unit Legal
    </Heading>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
      Personil unit Legal, Compliance, And Sustainability Division. Aktifkan/nonaktifkan
      untuk menentukan siapa yang berperan sebagai legal role pada workflow naskah-lainnya.
    </p>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
      <p class="text-gray-500 dark:text-gray-400 text-sm">Memuat data...</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <DataTable
        :columns="columns"
        :rows="persons"
        :skeleton-rows="5"
        empty-message="Belum ada data Unit Legal."
      >
        <template #cell-no="{ index }">
          {{ index + 1 }}
        </template>
        <template #cell-nama="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-white">{{ row.nama }}</span>
            <UBadge v-if="row.chief" color="primary" size="sm">Chief</UBadge>
          </div>
        </template>
        <template #cell-jabatan="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ row.jabatan }}</span>
        </template>
        <template #cell-unitName="{ row }">
          <span class="text-gray-600 dark:text-gray-300">{{ row.unitName }}</span>
        </template>
        <template #cell-level="{ row }">
          <span class="text-gray-500">L{{ row.level }}</span>
        </template>
        <template #cell-aktif="{ row }">
          <button
            type="button"
            class="mx-auto flex"
            @click="togglePerson(row)"
            :disabled="togglingId === row.positionId"
            :class="[
              'relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
              row.isActive
                ? 'bg-primary'
                : 'bg-gray-200 dark:bg-gray-600',
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                row.isActive ? 'translate-x-6' : 'translate-x-0',
              ]"
            />
          </button>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
const { apiGet, apiPatch } = useApi();
const toast = useToast();

const persons = ref([]);
const loading = ref(true);
const togglingId = ref('');

// Kolom DataTable Unit Legal — konsisten dengan tabel lain (header primary).
const columns = [
  { key: 'no', label: 'No' },
  { key: 'nama', label: 'Nama' },
  { key: 'jabatan', label: 'Jabatan' },
  { key: 'unitName', label: 'Unit' },
  { key: 'level', label: 'Level' },
  { key: 'aktif', label: 'Aktif' },
];

async function fetchPersons() {
  loading.value = true;
  try {
    const res = await apiGet('/konfigurasi/unit-legal');
    persons.value = res.data || [];
  } catch {
    toast.add({ title: 'Gagal memuat data unit legal', color: 'error' });
  } finally {
    loading.value = false;
  }
}

async function togglePerson(person) {
  togglingId.value = person.positionId;
  try {
    const res = await apiPatch(`/konfigurasi/unit-legal/${person.positionId}/toggle`);
    person.isActive = res.data.isActive;
    toast.add({
      title: person.isActive ? 'Legal role diaktifkan' : 'Legal role dinonaktifkan',
      color: person.isActive ? 'success' : 'warning',
    });
  } catch {
    toast.add({ title: 'Gagal mengubah status', color: 'error' });
  } finally {
    togglingId.value = '';
  }
}

onMounted(fetchPersons);
</script>
