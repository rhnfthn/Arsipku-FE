<template>
  <div class="space-y-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <PageHeader title="Check Dokumen" :items="items" />
    </div>
    <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm w-full">
      <div class="items-center gap-4">
        <!-- Upload Dokumen -->
        <div class="p-3 rounded-xl border border-gray-200 flex flex-col gap-3">
          <Heading variant="heading10m">Upload Dokumen</Heading>

          <label class="w-full cursor-pointer">
            <input
              type="file"
              class="hidden"
              @change="handleFile"
              accept=".pdf,.doc,.docx"
            />

            <div
              class="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            >
              <FileCheck class="w-5 h-5 text-gray-500" />
              <span class="text-gray-600">Pilih file...</span>
              <i class="i-lucide-upload h-5 text-gray-600"></i>
            </div>
          </label>

          <p v-if="fileName" class="text-sm text-gray-500">
            File: {{ fileName }}
          </p>
        </div>

        <div class="flex flex-col p-3 mt-2 rounded-xl border border-gray-200">
          <!-- Nama Dokumen -->
          <div
            class="flex justify-between items-center py-3 border-b border-gray-200"
          >
            <Heading variant="heading10m">Nama Dokumen</Heading>
            <Heading variant="body1">25250.pdf</Heading>
          </div>

          <!-- Jumlah Signature -->
          <div
            class="flex justify-between items-center py-3 border-b border-gray-200"
          >
            <Heading variant="heading10m">Jumlah Signature</Heading>
            <Heading variant="body2">1</Heading>
          </div>

          <!-- Keterangan -->
          <div
            class="flex justify-between items-center py-3 border-b border-gray-200"
          >
            <Heading variant="heading10m">Keterangan</Heading>
            <Heading variant="body2">25250.pdf</Heading>
          </div>

          <!-- Status -->
          <div
            class="flex justify-between items-center py-3 border-b border-gray-200"
          >
            <Heading variant="heading10m">Status</Heading>
            <Heading variant="body2">VALID</Heading>
          </div>

          <!-- Info Signer (tanpa border bawah terakhir) -->
          <div class="flex justify-between items-center py-3">
            <Heading variant="heading10m">Info Signer</Heading>
            <Heading variant="body2">Arya Bimo</Heading>
          </div>
        </div>
      </div>
      <div class="flex mt-3">
        <UButton
          class="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-5 py-2 rounded-lg text-xs"
        >
          Submit
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Heading from "~/components/Heading.vue";
import { FileCheck, ChevronRight as ChevronRightIcon } from "lucide-vue-next";
import { ref } from "vue";

const fileName = ref("");

function handleFile(e) {
  const file = e.target.files[0];
  if (file) {
    fileName.value = file.name;
  }
}

const items = [
  {
    label: "Dashboard",
    to: "/user/dashboard",
  },

  {
    label: "Check Dokumen ",
    to: "/admin/DigSig/check-dokumen",
  },
] satisfies BreadcrumbItem[];
</script>
