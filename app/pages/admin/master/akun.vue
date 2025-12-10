<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <PageHeader title="Manajemen Akun" :items="items" />  
    </div>
  </div>

  <div class="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto mt-5">

    <!-- Controls -->
    <div class="sticky top-0 bg-white z-40 flex flex-wrap justify-between p-3">
      <div class="flex flex-wrap gap-3 items-center">

        <button
          @click="resetFilter"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Search with Icon -->
        <div class="relative">
          <Search class="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari username / nama / email..."
            class="bg-gray-50 border border-gray-200 text-sm pl-8 pr-3 py-1.5 rounded-lg"
          />
        </div>

        <!-- Select Filter -->
        <select v-model="filters.role" class="bg-gray-100 text-sm px-3 py-1.5 rounded-lg">
          <option value="">Semua Role</option>
          <option value="Admin">Admin</option>
          <option value="User">User</option>
        </select>

        <select v-model="filters.status" class="bg-gray-100 text-sm px-3 py-1.5 rounded-lg">
          <option value="">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
        </select>
      </div>

      <!-- Export Button - Right Side -->
      <button
        class="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
        @click="exportData"
      >
        <FileDown class="w-4 h-4" />
        Export
      </button>
    </div>

    <!-- Table -->
    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-primary-400 text-white text-left">
        <tr>
          <th class="px-4 py-3 border-primary-600 font-semibold">Username</th>
          <th class="px-4 py-3 border-primary-600 font-semibold">Role</th>
          <th class="px-4 py-3 border-primary-600 font-semibold">Status</th>
          <th class="px-4 py-3 border-primary-600 font-semibold text-center">Aksi</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="user in filteredUsers"
          :key="user.username"
          class="border-b border-gray-100 hover:bg-blue-50 transition-colors"
        >
          <td class="px-4 py-3">
            <div class="flex items-start space-x-3">
              <UserRound class="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <p class="font-semibold text-gray-700">{{ user.username }}</p>
                <p class="text-xs text-gray-600">{{ user.name }}</p>
                <p class="text-xs text-gray-400">{{ user.email }}</p>
              </div>
            </div>
          </td>

          <td class="px-4 py-3">
            <span class="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 w-fit"
                  :class="getRoleColor(user.role)">
              <Shield class="w-3 h-3" />
              {{ user.role }}
            </span>
          </td>

          <td class="px-4 py-3">
            <span class="px-3 py-1 text-xs rounded-full font-medium" :class="getStatusColor(user.status)">
              {{ user.status }}
            </span>
          </td>

          <td class="px-4 py-3 text-center space-x-3">
            <button class="text-blue-600 hover:text-blue-800 transition-colors">
              <Pencil class="w-5 h-5" />
            </button>
            <button class="text-red-600 hover:text-red-800 transition-colors">
              <Trash2 class="w-5 h-5" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Pencil, Trash2, UserRound, Shield, RotateCcw, FileDown, Search } from "lucide-vue-next"

const items = [
  { label: "Dashboard", to: "/" },
  { label: "Akun", to: "/admin/master/akun" },
]

const filters = ref({
  search: "",
  role: "",
  status: "",
})

const users = [
  { username: "admin", name: "Administrator", email: "admin@airnav.co.id", role: "Admin", status: "Aktif" },
  { username: "lifa.user", name: "Lifa", email: "lifa@airnav.co.id", role: "User", status: "Aktif" },
  { username: "rahmat.rahim", name: "Rahmat Rahim", email: "rahmat.rahim@airnav.co.id", role: "User", status: "Aktif" },
  { username: "ika.octavia", name: "Ika Octavia", email: "ika.octavia@airnav.co.id", role: "Admin", status: "Aktif" },
  { username: "farid.wazli", name: "Farid Wazli", email: "farid.wazli@airnav.co.id", role: "User", status: "Tidak Aktif" },
]

const filteredUsers = computed(() => {
  return users.filter((user) => {
    const matchesSearch =
      filters.value.search === "" ||
      `${user.username} ${user.name} ${user.email}`
        .toLowerCase()
        .includes(filters.value.search.toLowerCase())

    const matchesRole = filters.value.role === "" || user.role === filters.value.role
    const matchesStatus = filters.value.status === "" || user.status === filters.value.status

    return matchesSearch && matchesRole && matchesStatus
  })
})

const resetFilter = () => {
  filters.value = { search: "", role: "", status: "" }
}

const getRoleColor = (role: string) =>
  role === "Admin" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"

const getStatusColor = (status: string) =>
  status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
</script>
