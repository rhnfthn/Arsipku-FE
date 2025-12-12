<template>
  <div class="min-h-screen bg-gray-50 pb-10">
    <!-- HEADER -->
    <div class="mb-5">
      <Heading variant="heading6b" class="text-mobile-md">
        Cek Dokumen
      </Heading>
      <PageHeader :items="breadcrumbs" />
    </div>

    <div class="flex flex-col gap-4 w-full">
      <!-- ================== -->
      <!-- UPLOAD SECTION -->
      <!-- ================== -->
      <div
        class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-3"
      >
        <Heading variant="heading10sb">Unggah Dokumen</Heading>

        <label class="w-full cursor-pointer">
          <input
            type="file"
            class="hidden"
            @change="handleFile"
            accept=".pdf"
          />

          <div
            class="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
          >
            <FileCheck class="w-5 h-5 text-gray-500" />
            <span class="text-gray-600">
              {{ fileName || "Pilih file…" }}
            </span>
            <i class="i-lucide-upload h-5 text-gray-600"></i>
          </div>

          <p class="text-xs text-gray-500 mt-2">
            Format yang didukung: PDF dengan tanda tangan digital
          </p>
        </label>
      </div>

      <!-- ================== -->
      <!-- INFORMASI DOKUMEN -->
      <!-- ================== -->
      <div v-if="fileUploaded" class="mt-2 space-y-4">
        <!-- Informasi Dokumen -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <Heading variant="heading10sb">Informasi Dokumen</Heading>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <Heading variant="heading11m" class="mb-1">Nama Dokumen</Heading>
              <Heading variant="body2">{{ dummyDoc.name }}</Heading>
            </div>

            <div>
              <Heading variant="heading11m" class="mb-1">Keterangan</Heading>
              <Heading variant="body2">{{ dummyDoc.description }}</Heading>
            </div>

            <div>
              <Heading variant="heading11m" class="mb-1"
                >Jumlah Signature</Heading
              >
              <Heading variant="body2">{{ dummyDoc.signatureCount }}</Heading>
            </div>

            <div>
              <Heading variant="heading11m" class="mb-1">Status</Heading>
              <span
                class="bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-xs"
              >
                ✔ VALID
              </span>
            </div>
          </div>
        </div>

        <!-- Info Penanda Tangan -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <!-- HEADER ACCORDION -->
          <button
            @click="signerOpen = !signerOpen"
            class="w-full flex items-center justify-between border-b border-gray-200 px-6 py-4"
          >
            <!-- LEFT SIDE: ICON + TEXT -->
            <div class="flex items-start gap-3">
              <!-- ICON -->
              <div
                class="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <FileCheck class="w-5 h-5" />
              </div>

              <!-- TITLE + NAME -->
              <div class="flex flex-col">
                <Heading variant="heading10sb">Info Penanda Tangan</Heading>
                <Heading variant="heading11m" class="mt-1">
                  {{ dummySigner.name }}
                </Heading>
              </div>
            </div>

            <!-- RIGHT: ARROW -->
            <ChevronDown
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': signerOpen }"
            />
          </button>

          <!-- CONTENT -->
          <transition name="fade">
            <div
              v-if="signerOpen"
              class="grid p-6 grid-cols-1 md:grid-cols-2 gap-4 text-sm"
            >
              <div>
                <Heading variant="heading11m" class="text-gray-500 mb-1"
                  >Diterbitkan oleh</Heading
                >

                <Heading variant="body2">{{ dummySigner.issuer }}</Heading>
              </div>

              <div>
                <Heading variant="heading11m" class="text-gray-500 mb-1"
                  >Algoritma Tanda Tangan</Heading
                >

                <Heading variant="body2">{{ dummySigner.algorithm }}</Heading>
              </div>

              <div>
                <Heading variant="heading11m" class="text-gray-500 mb-1"
                  >Tanggal Sign</Heading
                >

                <Heading variant="body2">{{ dummySigner.signDate }}</Heading>
              </div>

              <div>
                <Heading variant="heading11m" class="text-gray-500 mb-1"
                  >Nama Dokumen</Heading
                >

                <Heading variant="body2">{{ dummySigner.validFrom }}</Heading>
              </div>

              <div>
                <Heading variant="heading11m" class="text-gray-500 mb-1"
                  >Valid Hingga</Heading
                >

                <Heading variant="body2">{{ dummySigner.validUntil }}</Heading>
              </div>

              <div>
                <Heading variant="heading11m" class="text-gray-500 mb-1"
                  >Alasan Signature</Heading
                >

                <Heading variant="body2">{{ dummySigner.reason }}</Heading>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- SUBMIT BUTTON (muncul hanya setelah upload) -->
      <div v-if="fileUploaded" class="flex justify-end mt-3">
        <UButton
          class="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-8 py-2 rounded-lg text-xs"
        >
          Submit
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Heading from "~/components/Heading.vue";
import { FileCheck } from "lucide-vue-next";
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";

const signerOpen = ref(true);

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Cek Dokumen", to: "/admin/digsig/cek-dokumen" },
];

const fileName = ref("");
const fileUploaded = ref(false);

// dummy data
const dummyDoc = {
  name: "20251202.pdf",
  signatureCount: 1,
  description: "Dokumen valid, Sertifikat yang digunakan terpercaya",
};

const dummySigner = {
  name: "ARYA BIMA SETYANTORO",
  issuer: "C=ID,O=Lembaga Sandi Negara,CN=OSD LU Kelas 2",
  algorithm: "RSA with SHA256",
  signDate: "08.03.2024 11:14:52",
  validFrom: "07.12.2023 08:40:34",
  validUntil: "06.12.2025 08:40:33",
  reason: "Dokumen ini ditandatangani secara elektronik",
};

function handleFile(e: any) {
  const file = e.target.files[0];
  if (file) {
    fileName.value = file.name;
    fileUploaded.value = true;
  }
}
</script>
