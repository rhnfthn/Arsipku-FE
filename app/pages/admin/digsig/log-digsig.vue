<template>
  <div class="space-y-6">
    <div
      v-if="showGlobalAlert"
      class="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-6 py-3 shadow-lg flex items-center gap-4"
    >
      <!-- ICON -->
      <AlertTriangle class="w-5 h-5 flex-shrink-0" />

      <!-- MARQUEE CONTAINER -->
      <div class="relative overflow-hidden flex-1">
        <div class="animate-marquee whitespace-nowrap text-sm font-medium">
          <strong class="mr-2">PERHATIAN!</strong>
          Sedang terjadi gangguan pada sistem BsrE (Balai Sertifikasi
          Elektronik)
        </div>
      </div>

      <!-- CLOSE BUTTON -->
      <button
        @click="showGlobalAlert = false"
        class="flex-shrink-0 p-1 rounded hover:bg-red-700 transition"
        aria-label="Tutup alert"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- SPACER AGAR KONTEN TIDAK KETUTUP -->
    <div v-if="showGlobalAlert" class="h-[56px]"></div>
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Log Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <!-- HEADER -->
      <div class="flex items-center justify-between gap-4 mb-4">
        <!-- SEARCH -->
        <div class="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari disini..."
            class="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
        </div>

        <!-- RIGHT ACTION -->
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-2 rounded-xl font-medium"
            @click="showConfirmModal = true"
          >
            <AlertTriangle class="w-4 h-4" />
            Gangguan BsrE
          </button>

          <div
            class="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600"
          >
            <button class="hover:text-black">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span>1–8 Dari 8</span>
            <button class="hover:text-black">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-primary-400 text-white">
            <tr>
              <th class="px-4 py-3 text-left">Tanggal</th>
              <th class="px-4 py-3 text-left">IP</th>
              <th class="px-4 py-3 text-left">User</th>
              <th class="px-4 py-3 text-left">Api</th>
              <th class="px-4 py-3 text-left">Naskah</th>
              <th class="px-4 py-3 text-left">Note</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(row, i) in rows" :key="i" class="hover:bg-blue-50">
              <td class="px-4 py-4 whitespace-nowrap">
                {{ row.tanggal }}
              </td>
              <td class="px-4 py-4">{{ row.ip }}</td>
              <td class="px-4 py-4">{{ row.user }}</td>
              <td class="px-4 py-4 font-mono text-xs text-gray-600">
                {{ row.api }}
              </td>
              <td class="px-4 py-4">{{ row.naskah }}</td>
              <td class="px-4 py-4">
                <span
                  :class="statusClass(row.status)"
                  class="px-3 py-1 text-xs rounded-full font-medium inline-block whitespace-nowrap"
                >
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <Modal v-model="showConfirmModal" :hideDefaultFooter="true">
          <!-- TITLE -->
          <template #title>
            <div class="flex items-center gap-3 ml-5 mt-5 mb-3">
              <div class="bg-red-100 text-red-600 p-3 rounded-full">
                <AlertTriangle class="w-5 h-5" />
              </div>
              <Heading variant="heading9b" class="text-sm font-semibold">
                Konfirmasi Alert Gangguan
              </Heading>
            </div>
          </template>

          <!-- BODY -->
          <div class="text-sm text-gray-600 space-y-4">
            <p>
              Apakah Anda yakin ingin mengaktifkan alert gangguan BsrE? Alert
              ini akan ditampilkan ke seluruh pengguna sistem.
            </p>

            <div
              class="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm"
            >
              <AlertTriangle class="w-5 h-5" />
              <span>
                Tindakan ini sangat penting dan akan mempengaruhi seluruh
                pengguna!
              </span>
            </div>
          </div>

          <!-- FOOTER -->
          <template #footer>
            <div class="flex justify-end gap-3 px-5 pb-5 mt-6">
              <button
                @click="showConfirmModal = false"
                class="px-5 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>

              <button
                @click="activateAlert"
                class="px-5 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
              >
                Ya, Aktifkan Alert
              </button>
            </div>
          </template>
        </Modal>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Log Digsig", to: "/admin/digsig/log-digsig" },
];

import Modal from "~/components/Modal.vue";
import {
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-vue-next";

const showConfirmModal = ref(false);
const showGlobalAlert = ref(false);

const activateAlert = () => {
  showConfirmModal.value = false;
  showGlobalAlert.value = true;
};

const rows = [
  {
    tanggal: "12/09/2025 10:30",
    ip: "192.168.1.100",
    user: "Rahmat Rahimi",
    api: "POST /api/sign",
    naskah: "123/TEST/2025",
    status: "Sukses",
  },
  {
    tanggal: "12/09/2025 09:15",
    ip: "192.168.1.105",
    user: "Nazaruddin",
    api: "POST /api/sign",
    naskah: "124/DIGSIG/2025",
    status: "Passphrase anda salah",
  },
  {
    tanggal: "12/08/2025 16:45",
    ip: "192.168.1.110",
    user: "Admin User",
    api: "POST /api/verify",
    naskah: "122/APPROVAL/2025",
    status: "Sukses",
  },
  {
    tanggal: "12/08/2025 14:20",
    ip: "192.168.1.102",
    user: "Rahmat Rahimi",
    api: "POST /api/sign",
    naskah: "121/CONTRACT/2025",
    status: "Issue",
  },
];

const statusClass = (status: string) => {
  if (status === "Sukses") return "bg-green-100 text-green-700";
  if (status === "Issue") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};
</script>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-marquee {
  display: inline-block;
  animation: marquee 15s linear infinite;
}
</style>
