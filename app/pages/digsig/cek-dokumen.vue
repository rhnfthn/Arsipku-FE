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
            ref="fileInput"
            class="hidden"
            @change="handleFile"
            accept=".pdf"
            :disabled="loadingCheck"
          />

          <div
            class="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            :class="{ 'opacity-50 cursor-not-allowed': loadingCheck }"
          >
            <FileText class="w-5 h-5 text-gray-500" />
            <span class="text-gray-600 flex-1 text-center">
              {{ fileName || "no file selected" }}
            </span>
            <Upload class="w-5 h-5 text-gray-600" />
          </div>

          <p class="text-xs text-gray-500 mt-2">
            Format yang didukung: PDF dengan tanda tangan digital
          </p>
        </label>

        <!-- Error Message -->
        <div
          v-if="error && !showConfirmDialog"
          class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800">Error</p>
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>

        <!-- SUBMIT BUTTON -->
        <div
          v-if="selectedFile && !fileUploaded"
          class="flex justify-start mt-2"
        >
          <UButton
            @click="showConfirmation"
            :disabled="loadingCheck"
            class="bg-primary hover:bg-primary-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </UButton>
        </div>
      </div>

      <!-- ================== -->
      <!-- CONFIRMATION DIALOG -->
      <!-- ================== -->
      <!-- <Teleport to="body">
        <Modal
          v-if="showConfirmDialog"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click.self="cancelSubmit"
        >
          <div
            class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in"
          >
            <p class="text-gray-800 mb-6">Yakin ingin melanjutkannya?</p>

            <div class="flex justify-end gap-3">
              <button
                @click="cancelSubmit"
                class="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                @click="submitDocument"
                :disabled="loadingCheck"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                <span v-if="!loadingCheck">OK</span>
                <span v-else class="flex items-center gap-2">
                  <i class="i-lucide-loader animate-spin h-4"></i>
                  Memeriksa...
                </span>
              </button>
            </div>
          </div>
        </Modal>
      </Teleport> -->

      <!-- ================== -->
      <!-- INFORMASI DOKUMEN -->
      <!-- ================== -->
      <div
        v-if="fileUploaded && !loadingCheck && documentCheck"
        class="space-y-4"
      >
        <!-- Informasi Dokumen Card -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <Heading variant="heading10sb" class="mb-5"
            >Informasi Dokumen</Heading
          >

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <!-- Nama Dokumen -->
            <div>
              <p class="text-sm font-medium text-gray-700 mb-1">Nama Dokumen</p>
              <p class="text-sm text-gray-900">
                {{ documentCheck.data.document.name }}
              </p>
            </div>

            <!-- Keterangan -->
            <div>
              <p class="text-sm font-medium text-gray-700 mb-1">Keterangan</p>
              <p class="text-sm text-gray-900">
                {{ documentCheck.data.document.description }}
              </p>
            </div>

            <!-- Jumlah Signature -->
            <div>
              <p class="text-sm font-medium text-gray-700 mb-1">
                Jumlah Signature
              </p>
              <p class="text-sm text-gray-900">
                {{ documentCheck.data.document.signatureCount }}
              </p>
            </div>

            <!-- Status -->
            <div>
              <p class="text-sm font-medium text-gray-700 mb-1">Status</p>
              <span
                class="inline-block px-3 py-1 rounded-lg text-xs font-medium"
                :class="getStatusClass(documentCheck.data.document.status)"
              >
                {{ getStatusIcon(documentCheck.data.document.status) }}
                {{ documentCheck.data.document.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Info Penanda Tangan -->
        <div
          v-for="(signature, index) in documentCheck.data.signatures"
          :key="index"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <!-- HEADER ACCORDION -->
          <button
            @click="toggleSigner(index)"
            class="w-full flex items-center justify-between px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <FileCheck class="w-5 h-5" />
              </div>

              <div class="text-left">
                <p class="text-sm font-semibold text-gray-900">
                  Info Penanda Tangan
                </p>
                <p class="text-sm text-gray-600 mt-0.5">{{ signature.name }}</p>
              </div>
            </div>

            <ChevronDown
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': openSigners.has(index) }"
            />
          </button>

          <!-- CONTENT -->
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 max-h-0"
            leave-to-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[600px]"
            leave-from-class="opacity-100 max-h-[600px]"
          >
            <div v-if="openSigners.has(index)" class="px-6 py-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <!-- Diterbitkan Oleh -->
                <div>
                  <p class="text-sm font-medium text-gray-500 mb-1">
                    Diterbitkan Oleh
                  </p>
                  <p class="text-sm text-gray-900 break-all">
                    {{ signature.issuer }}
                  </p>
                </div>

                <!-- Algoritma Tanda Tangan -->
                <div>
                  <p class="text-sm font-medium text-gray-500 mb-1">
                    Algoritma Tanda Tangan
                  </p>
                  <p class="text-sm text-gray-900">{{ signature.algorithm }}</p>
                </div>

                <!-- Tanggal Sign -->
                <div>
                  <p class="text-sm font-medium text-gray-500 mb-1">
                    Tanggal Sign
                  </p>
                  <p class="text-sm text-gray-900">{{ signature.signDate }}</p>
                </div>

                <!-- Reason -->
                <div>
                  <p class="text-sm font-medium text-gray-500 mb-1">Reason</p>
                  <p class="text-sm text-gray-900">{{ signature.reason }}</p>
                </div>

                <!-- Valid Dari -->
                <div>
                  <p class="text-sm font-medium text-gray-500 mb-1">
                    Valid dari
                  </p>
                  <p class="text-sm text-gray-900">{{ signature.validFrom }}</p>
                </div>

                <!-- Valid Hingga -->
                <div>
                  <p class="text-sm font-medium text-gray-500 mb-1">
                    Valid hingga
                  </p>
                  <p class="text-sm text-gray-900">
                    {{ signature.validUntil }}
                  </p>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- SUBMIT BUTTON AT BOTTOM -->
        <div class="flex justify-end">
          <UButton
            @click="finalSubmit"
            class="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium"
          >
            Submit
          </UButton>
        </div>
      </div>
    </div>
  </div>
  <ConfirmPopup
    v-model="showConfirmDialog"
    type="question"
    title="Konfirmasi"
    message="Yakin ingin melanjutkan pemeriksaan dokumen ini?"
    confirmText="OK"
    cancelText="Cancel"
    :isLoading="loadingCheck"
    @confirm="submitDocument"
    @cancel="cancelSubmit"
  />
</template>

<script setup lang="ts">
import Heading from "~/components/Heading.vue";
import {
  FileCheck,
  ChevronDown,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-vue-next";
import { ref } from "vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
const showResultView = ref(false);

const { checkDocument, loadingCheck, error, documentCheck } = useDigsig();

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Cek Dokumen", to: "/admin/digsig/cek-dokumen" },
];

const fileName = ref("");
const fileUploaded = ref(false);
const selectedFile = ref<File | null>(null);
const openSigners = ref(new Set<number>());
const fileInput = ref<HTMLInputElement | null>(null);
const showConfirmDialog = ref(false);

/* Handle File Selection */
function handleFile(e: any) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    error.value = "File harus berformat PDF";
    selectedFile.value = null;
    fileName.value = "";
    return;
  }

  error.value = null;
  fileName.value = file.name;
  selectedFile.value = file;
  fileUploaded.value = false;
  documentCheck.value = null;
}

/* Show Confirmation Dialog */
function showConfirmation() {
  if (!selectedFile.value) return;
  showConfirmDialog.value = true;
}

/* Cancel Submit */
function cancelSubmit() {
  showConfirmDialog.value = false;
}

/* Submit Document untuk Cek Digital Signature */
async function submitDocument() {
  if (!selectedFile.value) return;

  try {
    await checkDocument(selectedFile.value);

    fileUploaded.value = true;
    showResultView.value = true;

    if (documentCheck.value?.data.signatures.length) {
      openSigners.value.add(0);
    }
  } catch (err) {
    console.error("Error checking document:", err);
    fileUploaded.value = false;
    showResultView.value = false;
  } finally {
    showConfirmDialog.value = false;
  }
}

/* Final Submit (bottom button) */
function finalSubmit() {
  // Handle final submit action here
  console.log("Final submit - Document validated");
  // You can add navigation or other actions here
}

/* Toggle Signer Accordion */
function toggleSigner(index: number) {
  if (openSigners.value.has(index)) {
    openSigners.value.delete(index);
  } else {
    openSigners.value.add(index);
  }
}

/* Get Status Class */
function getStatusClass(status: string) {
  switch (status.toUpperCase()) {
    case "VALID":
      return "bg-green-100 text-green-700";
    case "INVALID":
      return "bg-red-100 text-red-700";
    case "EXPIRED":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/* Get Status Icon */
function getStatusIcon(status: string) {
  switch (status.toUpperCase()) {
    case "VALID":
      return "✔";
    case "INVALID":
      return "✖";
    case "EXPIRED":
      return "⚠";
    default:
      return "•";
  }
}
</script>

<style scoped>
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
