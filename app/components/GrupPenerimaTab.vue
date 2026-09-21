<template>
  <div class="p-6">
    <!-- Header: pola sama dengan tab Digsig -->
    <Heading variant="heading9sb" class="text-mobile-md">
      Grup Penerima
    </Heading>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-7 mt-1">
      Atur grup penerima yang ditampilkan pada setiap jenis naskah dinas.
    </p>

    <!-- Search -->
    <div class="relative mb-4">
      <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Cari grup penerima..."
        class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>

    <!-- Loading skeleton: pola sama dengan tab Digsig -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="space-y-2">
          <USkeleton class="h-4 w-32 rounded" />
          <USkeleton class="h-3 w-48 rounded" />
        </div>
        <USkeleton class="h-9 w-full sm:w-[380px] rounded-lg shrink-0" />
      </div>
    </div>

    <!-- Data: pola row sama dengan tab Digsig -->
    <div v-else class="space-y-3">
      <div v-for="group in filteredGroups" :key="group.id"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors">
        <div>
          <p class="text-sm font-semibold text-gray-800 dark:text-white">
            {{ group.nama }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ group.details?.length || 0 }} anggota
            <template v-if="!hasAnyJenis(group)"> · tampil di semua naskah</template>
          </p>
        </div>

        <!-- Segmented control: pola sama dengan tab Digsig -->
        <div class="flex w-full sm:w-[380px] bg-[#f3f4f6] dark:bg-gray-800 rounded-lg p-1 shrink-0 gap-1">
          <button v-for="jenis in jenisOptions" :key="jenis.value" type="button"
            @click="toggleJenis(group, jenis.value)" :disabled="busyId === group.id" :class="[
              'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap',
              isJenisActive(group, jenis.value)
                ? 'bg-[#457fb6] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'
            ]">
            {{ jenis.label }}
          </button>
        </div>

      </div>
    </div>

    <!-- Info box: pola sama dengan tab Digsig -->
    <div
      class="mt-6 flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900">
      <UIcon name="i-lucide-info" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
      <div class="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
        <span class="font-semibold block mb-1">Informasi</span>
        <p>
          Pilih jenis naskah tempat grup penerima ditampilkan. Grup dengan minimal satu jenis aktif hanya muncul di
          jenis naskah tersebut, sedangkan grup tanpa jenis aktif ditampilkan di <strong>semua</strong> jenis naskah.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const { apiGet, apiPut } = useApi();
const toast = useToast();

interface GrupPenerima {
  id: string;
  company: string;
  nama: string;
  deskripsi?: string | null;
  jenis_naskah?: string[] | null;
  aktif: boolean;
  details?: Array<{ id: string; position: string }>;
}

const jenisOptions = [
  { label: "ND", value: "ND", hint: "Nota Dinas" },
  { label: "SDI", value: "SDI", hint: "Surat Dinas Internal" },
  { label: "SDE", value: "SDE", hint: "Surat Dinas Eksternal" },
  { label: "DI", value: "DI", hint: "Disposisi" },
  { label: "KAJIAN", value: "KAJIAN", hint: "Kajian" },
];

const groups = ref<GrupPenerima[]>([]);
const isLoading = ref(false);
const busyId = ref<string | null>(null);
const search = ref("");

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return groups.value;
  return groups.value.filter(
    (g) =>
      g.nama.toLowerCase().includes(q) ||
      (g.deskripsi || "").toLowerCase().includes(q),
  );
});

const isJenisActive = (group: GrupPenerima, jenis: string) =>
  Array.isArray(group.jenis_naskah) && group.jenis_naskah.includes(jenis);

const hasAnyJenis = (group: GrupPenerima) =>
  Array.isArray(group.jenis_naskah) && group.jenis_naskah.length > 0;

const fetchGroups = async () => {
  isLoading.value = true;
  try {
    const res = await apiGet<{ success: boolean; data: GrupPenerima[] }>(
      "/persuratan/grup-penerima?includeInactive=true",
    );
    groups.value = res?.data || [];
  } catch (e) {
    console.error("[GrupPenerimaTab] fetch error:", e);
    toast.add({ title: "Gagal memuat grup penerima", color: "error" });
  } finally {
    isLoading.value = false;
  }
};

const toggleJenis = async (group: GrupPenerima, jenis: string) => {
  if (busyId.value) return;
  const current = Array.isArray(group.jenis_naskah) ? [...group.jenis_naskah] : [];
  const next = current.includes(jenis)
    ? current.filter((j) => j !== jenis)
    : [...current, jenis];

  // Optimistic update
  const prev = group.jenis_naskah;
  group.jenis_naskah = next.length ? next : null;

  busyId.value = group.id;
  try {
    await apiPut(`/persuratan/grup-penerima/${group.id}/jenis-naskah`, {
      jenis_naskah: next.length ? next : null,
    });
  } catch (e) {
    // Rollback
    group.jenis_naskah = prev;
    console.error("[GrupPenerimaTab] toggle error:", e);
    toast.add({ title: "Gagal memperbarui konfigurasi", color: "error" });
  } finally {
    busyId.value = null;
  }
};

onMounted(fetchGroups);
</script>
