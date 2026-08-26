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
    <div v-else class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">No</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nama</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Jabatan</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Unit</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Level</th>
            <th class="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Aktif</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="(person, idx) in persons"
            :key="person.positionId"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 text-gray-500">{{ idx + 1 }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ person.nama }}</span>
                <UBadge v-if="person.chief" color="primary" size="sm">Chief</UBadge>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ person.jabatan }}</td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ person.unitName }}</td>
            <td class="px-4 py-3 text-gray-500">L{{ person.level }}</td>
            <td class="px-4 py-3 text-center">
              <button
                type="button"
                @click="togglePerson(person)"
                :disabled="togglingId === person.positionId"
                :class="[
                  'relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  person.isActive
                    ? 'bg-primary'
                    : 'bg-gray-200 dark:bg-gray-600',
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    person.isActive ? 'translate-x-6' : 'translate-x-0',
                  ]"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const { apiGet, apiPatch } = useApi();
const toast = useToast();

const persons = ref([]);
const loading = ref(true);
const togglingId = ref('');

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