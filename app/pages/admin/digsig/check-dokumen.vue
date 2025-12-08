<template>
  <div class="space-y-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <PageHeader title="Check Dokumen" :items="items" />
    </div>
    <!-- <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm w-full"> -->
    <div class="items-center gap-4">
      <!-- ======= -->
      <!-- UPLOAD FILE  -->
      <!-- ======= -->
      <div
        class="bg-white p-6 rounded-xl shadow-sm w-full rounded-xl border border-gray-200 flex flex-col gap-3"
      >
        <Heading variant="heading10m">Unggah Dokumen</Heading>

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
          <Heading variant="body3" class="text-gray-600 mt-2"
            >Format yang didukung: PDF dengan tanda tangan digital</Heading
          >
        </label>

        <p v-if="fileName" class="text-sm text-gray-500">
          File: {{ fileName }}
        </p>
      </div>
      <!-- ======= -->
      <!-- SECTION  -->
      <!-- ======= -->
      <div
        class="flex flex-col p-3 mt-4 bg-white p-6 rounded-xl shadow-sm w-full rounded-xl border border-gray-200"
      >
        <Heading variant="heading10m">Informasi Dokumen</Heading>
        <div class="flex flex-col mt-5">
          <Heading variant="heading11m">Nama Dokumen</Heading>
          <Heading variant="body2">25250.pdf</Heading>
        </div>
        <div class="mt-2">
          <Heading variant="heading11m">Jumlah Signature</Heading>
          <Heading variant="body2">1</Heading>
        </div>
        <div class="mt-2">
          <Heading variant="heading10m">Keterangan</Heading>
          <Heading variant="body2">25250.pdf</Heading>
        </div>
        <div class="mt-2">
          <Heading variant="heading10m">Status</Heading>
          <Heading variant="body2">VALID</Heading>
        </div>
        <div class="mt-2">
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
    <!-- </div> -->
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
