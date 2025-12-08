<template>
  <!-- MODAL FORM -->
  <transition name="fade-scale">
    <Modal
      v-if="modelValue"
      :model-value="modelValue"
      :hide-default-footer="true"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <template #title>
        <Heading
          variant="heading9b"
          class="font-semibold text-sm mb-3 mt-5 ml-5"
        >
          Tambah Usulan Penomoran
        </Heading>
      </template>

      <!-- FORM -->
      <div class="px-5 flex flex-col gap-4 pb-4">
        <div>
          <label class="text-xs font-medium">Tanggal Surat</label>
          <input
            type="date"
            v-model="form.tanggal"
            :max="today"
            class="mt-1 w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700"
          />
        </div>

        <div>
          <label class="text-xs font-medium"
            >Klasifikasi <span class="text-red-500">*</span></label
          >
          <select
            v-model="form.klasifikasi"
            class="mt-1 border w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-2 text-xs"
          >
            <option disabled value="">Pilih klasifikasi</option>
            <option
              v-for="item in klasifikasiOptions"
              :key="item"
              :value="item"
            >
              {{ item }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium"
            >Jenis Naskah <span class="text-red-500">*</span></label
          >
          <select
            v-model="form.jenis"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-2 text-xs"
          >
            <option disabled value="">Pilih jenis naskah</option>
            <option v-for="item in jenisOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium"
            >Pengirim <span class="text-red-500">*</span></label
          >
          <select
            v-model="form.pengirim"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-2 text-xs"
          >
            <option disabled value="">Pilih pengirim</option>
            <option v-for="item in pengirimOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium focus:primary-500"
            >Perihal <span class="text-red-500">*</span></label
          >
          <UInput
            class="mt-1 w-full focus:ring-primary-500 focus:border-primary-500"
            v-model="form.perihal"
            placeholder="Masukkan perihal"
          />
        </div>

        <div>
          <label class="text-xs font-medium"
            >Jumlah <span class="text-red-500">*</span></label
          >
          <UInput
            type="number"
            class="mt-1 w-full"
            v-model="form.jumlah"
            placeholder="Masukkan jumlah"
          />
        </div>
      </div>

      <!-- FOOTER -->
      <template #footer>
        <div
          class="flex justify-end gap-3 border-t border-gray-200 px-5 py-4 w-full"
        >
          <button
            @click="emit('update:modelValue', false)"
            class="px-5 py-2 text-xs border border-gray-300 hover:bg-gray-100 rounded-md"
          >
            Batal
          </button>

          <button
            @click="openPreview"
            class="px-5 py-2 text-xs border border-primary-500 hover:bg-primary-50 text-primary rounded-md"
          >
            Pratinjau
          </button>

          <button
            @click="submitAndClose"
            class="px-5 py-2 bg-primary text-white hover:bg-primary-800 text-xs rounded-md"
          >
            Submit
          </button>
        </div>
      </template>
    </Modal>
  </transition>

  <!-- MODAL PRATINJAU -->
  <transition name="fade-scale">
    <Modal
      v-if="previewModal"
      :model-value="previewModal"
      :hide-default-footer="true"
      @update:model-value="closePreview"
    >
      <template #title>
        <div class="flex justify-between items-center px-6 pt-6 pb-2">
          <h2 class="text-lg font-semibold">Pratinjau</h2>
        </div>
      </template>

      <div class="p-8 max-w-5xl w-full max-h-[150vh] overflow-y-auto text-sm">
        <p class="text-center text-xs text-gray-500">
          {{ formatDateTime(new Date()) }}
        </p>

        <h3 class="text-center font-bold text-base mt-1">
          FORMULIR USULAN NOMOR
        </h3>

        <p class="text-center text-xs text-gray-500 mb-6">
          ID. {{ form.perihal.length }}{{ form.jumlah
          }}{{ form.tanggal.replace(/-/g, "") }}
        </p>

        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Nama</span>
            <span class="text-gray-800 text-xs">-</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Jabatan</span>
            <span class="text-gray-800 text-xs">-</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Jenis</span>
            <span class="text-gray-800 text-xs">{{ form.jenis }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Klasifikasi</span>
            <span class="text-gray-800 text-xs">{{ form.klasifikasi }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Tanggal</span>
            <span class="text-gray-800 text-xs">{{
              formatDate(form.tanggal)
            }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Jumlah</span>
            <span class="text-gray-800 text-xs">{{ form.jumlah }} NOMOR</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500 uppercase text-xs">Nomor Surat</span>
            <span class="text-gray-800 text-xs tracking-widest">
              . . . . /V/34/LP/NNPI/{{ form.klasifikasi }}/2025
            </span>
          </div>
        </div>

        <hr class="my-6" />

        <div class="flex justify-between items-start">
          <div>
            <p class="text-gray-500 uppercase text-xs">Pemohon</p>
            <p class="font-semibold text-xs">FIRDA KABISATIKA</p>
          </div>

          <div class="text-right">
            <p class="text-gray-500 uppercase text-xs">Diusulkan</p>
            <p class="text-xs">{{ formatDateTime(new Date()) }}</p>
          </div>
        </div>

        <div
          class="bg-gray-50 border border-gray-200 text-xs p-3 rounded-md mt-6"
        >
          Cetak formulir dan lampirkan naskah final yang akan diberikan nomor...
        </div>
      </div>
    </Modal>
  </transition>
</template>

<script setup>
import { ref } from "vue";
import Heading from "~/components/Heading.vue";
import { UInput } from "#components";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "submit"]);

// FORM STATE
const form = ref({
  tanggal: "",
  klasifikasi: "",
  jenis: "",
  pengirim: "",
  perihal: "",
  jumlah: "",
});

// BATAS TANGGAL (hanya hari ini & hari yang sudah lewat)
const today = new Date().toISOString().split("T")[0];

// OPTIONS
const klasifikasiOptions = ["Terbatas", "Rahasia", "Biasa"];
const jenisOptions = ["BAC", "SPR", "SK", "MOU"];
const pengirimOptions = ["Direktur Utama", "Direktur SDM", "Direktur Operasi"];

const previewModal = ref(false);

// OPEN PREVIEW
function openPreview() {
  emit("update:modelValue", false);
  previewModal.value = true;
}

// CLOSE PREVIEW
function closePreview() {
  previewModal.value = false;
  emit("update:modelValue", true);
}

// SUBMIT
function submitAndClose() {
  emit("submit", { ...form.value });
  emit("update:modelValue", false);
}

// FORMATTING
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  return (
    date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.22s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
</style>
