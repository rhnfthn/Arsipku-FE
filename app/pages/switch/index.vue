<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5"
    >
      <div>
        <PageHeader title="Pindah Perusahaan" :items="items" />
      </div>

      <button
        class="px-4 py-2 rounded-lg text-sm text-white bg-gray-600 hover:bg-gray-700 transition disabled:opacity-50"
        :disabled="loading"
        @click="onResetCompany"
      >
        Kembali ke Perusahaan Default
      </button>
    </div>

    <!-- Card -->
    <div class="bg-white rounded-xl shadow border border-gray-200">
      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-primary-400 text-white">
            <tr>
              <th class="px-6 py-4 text-left font-semibold">Perusahaan</th>
              <th class="px-6 py-4 text-left font-semibold">Kode</th>
              <th class="px-6 py-4 text-left font-semibold">Masa Berlaku</th>
              <th class="px-6 py-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in companies"
              :key="item.relationSpId"
              class="border-b border-b-gray-200 last:border-b-0 hover:bg-gray-50"
            >
              <!-- Company Text -->
              <td class="px-6 py-4 font-medium">
                {{ item.companyText }}
              </td>

              <!-- Company Code -->
              <td class="px-6 py-4">
                {{ item.company }}
              </td>

              <!-- Masa Berlaku -->
              <td class="px-6 py-4 text-gray-600">
                {{ formatDate(item.startDate) }} –
                {{ formatDate(item.endDate) }}
              </td>

              <!-- Aksi -->
              <td class="px-6 py-4 text-center">
                <button
                  class="px-4 py-2 rounded-lg text-white bg-primary-400 hover:bg-primary-500 transition disabled:opacity-50"
                  :disabled="
                    item.isCurrentCompany || switchingId === item.relationSpId
                  "
                  @click="onSwitch(item)"
                >
                  <span v-if="switchingId === item.relationSpId">
                    Memindahkan...
                  </span>
                  <span v-else>
                    {{ item.isCurrentCompany ? "Aktif" : "Pindah" }}
                  </span>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="!loading && companies.length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-500">
                Tidak ada perusahaan tersedia
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Memuat data...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useSwitch } from "@/composables/useSwitch";
import { useToast } from "#imports";
import { useRouter } from "vue-router";

const toast = useToast();
const items = [
  { label: "Beranda", to: "/" },
  { label: "Pindah Perusahaan", to: "/switch" },
] satisfies BreadcrumbItem[];

const {
  companies,
  loading,
  switchingId,
  getAvailableCompanies,
  switchCompany,
  resetCompany,
} = useSwitch();

onMounted(() => {
  getAvailableCompanies();
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("id-ID");
};

const router = useRouter();

const onSwitch = async (item: any) => {
  if (item.isCurrentCompany) return;

  const res = await switchCompany(item.relationSpId);

  toast.add({
    title: "Berhasil",
    description: `Berhasil pindah perusahaan ${res.data.activeCompany.companyText}`,
    color: "success",
    icon: "i-lucide-check-circle",
  });

  setTimeout(() => {
    window.location.href = "/beranda";
  }, 800);
};

const onResetCompany = async () => {
  const res = await resetCompany();

  const companyText =
    res?.data?.activeCompany?.companyText ??
    res?.data?.user?.companyText ??
    "Perusahaan Default";

  toast.add({
    title: "Berhasil",
    description: `Berhasil kembali ke perusahaan default (${companyText})`,
    color: "success",
    icon: "i-lucide-check-circle",
  });

  setTimeout(() => {
    window.location.reload(); // 🔥 INI KUNCI
  }, 800);
};
</script>
