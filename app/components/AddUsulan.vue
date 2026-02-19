<template>
  <!-- MODAL FORM - z-index 8000, hidden when preview is open -->
  <transition name="fade-scale">
    <Modal
      v-if="modelValue && !previewModal"
      :model-value="modelValue"
      :hide-default-footer="true"
      size="xl"
      class="z-[8000]"
      @update:model-value="handleClose"
    >
      <template #title>
        <Heading
          variant="heading9b"
          class="font-bold text-sm mb-3 mt-5 ml-5 dark:text-gray-100"
        >
          Tambah Penomoran
        </Heading>
      </template>

      <!-- FORM -->
      <div class="p-1 flex flex-col gap-4 pb-5">
        <!-- Tanggal Surat -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            Tanggal Surat <span class="text-red-500">*</span>
          </Heading>
          <input
            type="date"
            v-model="tanggalString"
            :max="todayString"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
          />
        </div>

        <!-- Klasifikasi - Show dropdown with data, then search inside -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            Klasifikasi <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="klasifikasiRef">
            <!-- Selected value display -->
            <button
              @click="toggleKlasifikasi"
              :disabled="isLoadingKlasifikasi"
              class="mt-1 w-full flex justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :class="{
                'text-gray-400': !form.klasifikasiDisplay,
                'text-gray-900 dark:text-gray-200': form.klasifikasiDisplay,
              }"
            >
              {{ form.klasifikasiDisplay || "Pilih klasifikasi" }}
              <ChevronDown
                class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            </button>

            <!-- Dropdown with search and data -->
            <div
              v-if="openKlasifikasi"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <!-- Search inside dropdown -->
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="klasifikasiSearch"
                  ref="klasifikasiInput"
                  placeholder="Cari klasifikasi"
                  :disabled="isLoadingKlasifikasi"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <!-- Data list -->
              <div class="max-h-52 overflow-y-auto">
                <button
                  v-for="item in filteredKlasifikasi"
                  :key="item.code"
                  @click="selectKlasifikasi(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 dark:text-gray-200"
                >
                  {{ item.display }}
                </button>

                <p
                  v-if="filteredKlasifikasi.length === 0"
                  class="px-3 py-2 text-xs text-center text-gray-400"
                >
                  {{ isLoadingKlasifikasi ? "Memuat..." : "Tidak ada hasil" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Jenis Naskah - Show dropdown with data, then search inside -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            Jenis Naskah <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="jenisRef">
            <!-- Selected value display -->
            <button
              @click="toggleJenis"
              class="mt-1 w-full flex justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:text-gray-200"
              :class="{
                'text-gray-400': !form.jenisDisplay,
                'text-gray-900 dark:text-gray-200': form.jenisDisplay,
              }"
            >
              {{ form.jenisDisplay || "Pilih jenis naskah" }}
              <ChevronDown
                class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            </button>

            <!-- Dropdown with search and data -->
            <div
              v-if="openJenis"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <!-- Search inside dropdown -->
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="jenisSearch"
                  ref="jenisInput"
                  placeholder="Cari jenis naskah"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <!-- Data list -->
              <div class="max-h-60 overflow-y-auto">
                <button
                  v-for="item in filteredJenis"
                  :key="item.code"
                  @click="selectJenis(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 dark:text-gray-200"
                >
                  {{ item.display }}
                </button>

                <p
                  v-if="filteredJenis.length === 0"
                  class="px-3 py-2 text-xs text-center text-gray-400"
                >
                  Tidak ada hasil
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Penandatangan - Show dropdown with data, then search inside -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            Penandatangan <span class="text-red-500">*</span>
          </Heading>
          <div class="relative" ref="penandatanganRef">
            <!-- Selected value display -->
            <button
              @click="togglePenandatangan"
              :disabled="isLoadingPositions"
              class="mt-1 w-full flex justify-between border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:cursor-wait hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              :class="{
                'text-gray-400': !form.penandatanganJabatan,
                'text-gray-900 dark:text-gray-200': form.penandatanganJabatan,
              }"
            >
              {{ form.penandatanganJabatan || "Pilih penandatangan" }}
              <ChevronDown
                class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
            </button>

            <!-- Dropdown with search and data -->
            <div
              v-if="openPenandatangan"
              class="absolute z-[8100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <!-- Search inside dropdown -->
              <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  v-model="penandatanganSearch"
                  ref="penandatanganInput"
                  placeholder="Cari penandatangan"
                  :disabled="isLoadingPositions"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <!-- Data list -->
              <div class="max-h-60 overflow-y-auto">
                <button
                  v-for="item in filteredPenandatangan"
                  :key="item.position"
                  @click="selectPenandatangan(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 dark:text-gray-200"
                >
                  {{ item.displayText }}
                </button>

                <p
                  v-if="filteredPenandatangan.length === 0"
                  class="px-3 py-2 text-xs text-center text-gray-400"
                >
                  {{ isLoadingPositions ? "Memuat..." : "Tidak ada hasil" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Perihal -->
        <div>
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            Perihal <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.perihal"
            placeholder="Masukkan perihal"
            maxlength="100"
            @input="validatePerihal"
            class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
          <div class="flex justify-between mt-1 mb-0">
            <p v-if="perihalError" class="text-xs text-red-500">
              {{ perihalError }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {{ form.perihal.length }}/100 karakter
            </p>
          </div>
        </div>

        <!-- Jumlah -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium dark:text-gray-200"
          >
            Jumlah <span class="text-red-500">*</span>
          </Heading>
          <input
            type="number"
            v-model.number="form.jumlah"
            placeholder="Masukkan jumlah (1-10)"
            min="1"
            max="10"
            @keydown="blockInvalidNumber"
            @input="validateJumlah"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200"
          />
          <p v-if="jumlahError" class="text-xs text-red-500 mt-1">
            {{ jumlahError }}
          </p>
        </div>
      </div>

      <!-- FOOTER -->
      <template #footer>
        <div
          class="flex justify-between w-full gap-3 border-t border-gray-200 dark:border-gray-700 px-5 py-4 w-full"
        >
          <button
            @click="openPreviewModal"
            class="flex-1 px-5 py-2 text-sm border border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary dark:text-primary-400 rounded-md"
          >
            Pratinjau
          </button>
          <button
            @click="submitAndClose"
            :disabled="
              isSubmitting || isLoadingKlasifikasi || isLoadingPositions
            "
            class="flex-1 px-5 py-2 bg-primary text-white hover:bg-primary-800 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isSubmitting ? "Menyimpan..." : "Simpan Usulan" }}
          </button>
        </div>
      </template>
    </Modal>
  </transition>

  <!-- MODAL PRATINJAU - z-index 8200, only shown when preview is active -->
  <transition name="fade-scale">
    <Modal
      v-if="previewModal"
      :model-value="previewModal"
      :hide-default-footer="true"
      size="lg"
      class="z-[8200]"
      @update:model-value="closePreview"
    >
      <template #title>
        <div class="flex justify-between items-center px-6 pt-4 pb-2">
          <h2 class="text-lg font-semibold dark:text-gray-100">
            Pratinjau Usulan
          </h2>
        </div>
      </template>

      <!-- ✅ OPSI B: semua konten dibungkus dalam scrollable container -->
      <div class="max-h-[60vh] overflow-y-auto">
        <div class="w-full px-5 py-2 text-sm">
          <p class="text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ formatDateTime(new Date()) }}
          </p>
          <h3 class="text-center font-bold text-base mb-5 dark:text-gray-100">
            FORMULIR USULAN NOMOR
          </h3>

          <div class="grid grid-cols-[155px_1fr] gap-y-3 w-full">
            <Heading variant="10sb" class="dark:text-gray-200">Nama</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              penandatanganNama || user?.nama || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">Jabatan</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.penandatanganJabatan || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">Jenis</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.jenisDisplay || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200"
              >Klasifikasi</Heading
            >
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.klasifikasiDisplay || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">Tanggal</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              formatDate(tanggalString) || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">Perihal</Heading>
            <Heading variant="11sb" class="dark:text-gray-200">{{
              form.perihal || "-"
            }}</Heading>

            <Heading variant="10sb" class="dark:text-gray-200">Jumlah</Heading>
            <Heading variant="11sb" class="dark:text-gray-200"
              >{{ form.jumlah || 0 }} Nomor</Heading
            >

            <Heading variant="10sb" class="dark:text-gray-200">Nomor</Heading>
            <div
              class="text-gray-800 dark:text-gray-200 text-xs font-mono space-y-1"
            >
              <div v-for="n in form.jumlah" :key="n" class="flex gap-2">
                <span class="text-gray-400 dark:text-gray-500">
                  {{ String(n).padStart(2, "0") }}.
                </span>
                <span class="tracking-widest">
                  {{ form.jenis || "..." }}....../O/00/LPPNPI/{{
                    form.klasifikasi || "..."
                  }}/XII/2025
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr class="my-0 dark:border-gray-600" />

        <div class="flex justify-between items-start px-5 pb-5 pt-3">
          <div>
            <Heading
              variant="10m"
              class="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1"
              >Pengusul</Heading
            >
            <p class="font-semibold text-xs dark:text-gray-200">
              {{ user?.nama || "-" }}
            </p>
          </div>
          <div class="text-right">
            <Heading
              variant="10m"
              class="text-gray-500 dark:text-gray-400 uppercase text-xs mb-1"
              >Diusulkan</Heading
            >
            <p class="font-semibold text-xs dark:text-gray-200">
              {{ formatDateTime(new Date()) }}
            </p>
          </div>
        </div>

        <!-- <div
          class="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs p-3 rounded-md mt-1 mx-5 mb-4 dark:text-gray-300"
        >
          Cetak formulir dan lampirkan naskah final yang akan diberikan nomor,
          kemudian serahkan berkas ke Unit Tata Usaha untuk proses penomoran dan
          arsip
        </div> -->
      </div>
      <!-- ✅ END scrollable container -->

      <template #footer>
        <div
          class="flex justify-end w-full gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            @click="closePreview"
            class="px-5 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
          >
            Tutup
          </button>
        </div>
      </template>
    </Modal>
  </transition>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  watch,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { ChevronDown } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["submit", "update:modelValue"]);
const toast = useToast();

const jenisOptions = [
  { code: "PER", display: "PER - Peraturan" },
  { code: "KEP", display: "KEP - Keputusan Direksi" },
  { code: "INS", display: "INS - Instruksi" },
  { code: "SPR", display: "SPR - Surat Perintah" },
  { code: "SOP", display: "SOP - Standar Operasional Prosedur" },
  { code: "EDR", display: "EDR - Surat Edaran" },
  { code: "ND", display: "ND - Nota Dinas" },
  { code: "SDI", display: "SDI - Surat Dinas Internal" },
  { code: "DI", display: "DI - Disposisi" },
  { code: "SDE", display: "SDE - Surat Dinas Eksternal" },
  { code: "MOU", display: "MOU - Memorandum of Understanding" },
  { code: "PKS", display: "PKS - Perjanjian Kerja Sama" },
  { code: "LOA", display: "LOA - Letter of Agreement" },
  { code: "LOCA", display: "LOCA - Letter of Coordination Agreement" },
  { code: "PROC", display: "PROC - Kontrak Pengadaan" },
  { code: "PJJ", display: "PJJ - Perjanjian Lainnya" },
  { code: "ADD-PJJ", display: "ADD-PJJ - Adendum Perjanjian" },
  { code: "ADD-PROC", display: "ADD-PROC - Kontrak Pengadaan Adendum" },
  { code: "SPK", display: "SPK - Surat Perintah Kerja Pengadaan" },
  {
    code: "ADD-SPK",
    display: "ADD-SPK - Adendum Surat Perintah Kerja Pengadaaan",
  },
  { code: "SKU", display: "SKU - Surat Kuasa" },
  { code: "BAC", display: "BAC - Berita Acara" },
  { code: "UND", display: "UND - Surat Undangan" },
  { code: "KET", display: "KET - Surat Keterangan" },
  { code: "SPE", display: "SPE - Surat Pengantar" },
  { code: "RPT", display: "RPT - Risalah Rapat" },
  { code: "PEN", display: "PEN - Pengumuman" },
  { code: "PGM", display: "PGM - Sertifikat atau Piagam" },
  { code: "LAP", display: "LAP - Laporan" },
];

const openKlasifikasi = ref(false);
const klasifikasiSearch = ref("");
const klasifikasiRef = ref(null);
const klasifikasiInput = ref(null);
const openJenis = ref(false);
const jenisSearch = ref("");
const jenisRef = ref(null);
const jenisInput = ref(null);
const openPenandatangan = ref(false);
const penandatanganSearch = ref("");
const penandatanganRef = ref(null);
const penandatanganInput = ref(null);
const penandatanganOptions = ref([]);
const penandatanganNama = ref("");
const isLoadingPositions = ref(false);
const isSubmitting = ref(false);
const jumlahError = ref("");
const perihalError = ref("");
const hasLoadedPositions = ref(false);
const hasLoadedKlasifikasi = ref(false);
const previewModal = ref(false);

const today = new Date();
const todayString = today.toISOString().split("T")[0];
const tanggalString = ref(todayString);

const { getKlasifikasi } = usePenomoran();
const { user, getProfile } = useAuth();
const { get } = useApi();

const form = ref({
  tanggal: new Date(),
  klasifikasi: "",
  klasifikasiDisplay: "",
  jenis: "",
  jenisDisplay: "",
  penandatanganJabatan: "",
  id_position_penandatangan: null,
  perihal: "",
  jumlah: 1,
});

watch(tanggalString, (newVal) => {
  if (newVal) {
    form.value.tanggal = new Date(newVal);
  }
});

const handleClickOutside = (e) => {
  if (klasifikasiRef.value && !klasifikasiRef.value.contains(e.target)) {
    openKlasifikasi.value = false;
  }
  if (jenisRef.value && !jenisRef.value.contains(e.target)) {
    openJenis.value = false;
  }
  if (penandatanganRef.value && !penandatanganRef.value.contains(e.target)) {
    openPenandatangan.value = false;
  }
};

// ✅ LAZY LOAD KLASIFIKASI
const toggleKlasifikasi = async () => {
  if (!openKlasifikasi.value && !hasLoadedKlasifikasi.value) {
    console.log("🔄 Loading klasifikasi...");
    await fetchKlasifikasi();
    hasLoadedKlasifikasi.value = true;
  }

  openKlasifikasi.value = !openKlasifikasi.value;

  if (openKlasifikasi.value) {
    await nextTick();
    klasifikasiInput.value?.focus();
  }
};

// ✅ TOGGLE JENIS - Show dropdown with data
const toggleJenis = async () => {
  openJenis.value = !openJenis.value;

  if (openJenis.value) {
    await nextTick();
    jenisInput.value?.focus();
  }
};

// ✅ LAZY LOAD POSITIONS
const togglePenandatangan = async () => {
  if (!openPenandatangan.value && !hasLoadedPositions.value) {
    console.log("🔄 Loading positions...");
    await fetchPositions();
    hasLoadedPositions.value = true;
  }

  openPenandatangan.value = !openPenandatangan.value;

  if (openPenandatangan.value) {
    await nextTick();
    penandatanganInput.value?.focus();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

function openPreviewModal() {
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.penandatanganJabatan ||
    !form.value.perihal ||
    form.value.perihal.length === 0 ||
    form.value.perihal.length > 100 ||
    Number(form.value.jumlah) < 1 ||
    Number(form.value.jumlah) > 10
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description:
        "Lengkapi form sebelum pratinjau. Perihal maksimal 100 karakter.",
      color: "yellow",
    });
    return;
  }

  previewModal.value = true;
}

function closePreview() {
  previewModal.value = false;
}

const klasifikasiOptions = ref([]);
const isLoadingKlasifikasi = ref(false);

const filteredKlasifikasi = computed(() => {
  if (!klasifikasiSearch.value) return klasifikasiOptions.value;
  return klasifikasiOptions.value.filter((item) =>
    item.display.toLowerCase().includes(klasifikasiSearch.value.toLowerCase()),
  );
});

const filteredJenis = computed(() => {
  if (!jenisSearch.value) return jenisOptions;
  return jenisOptions.filter((item) =>
    item.display.toLowerCase().includes(jenisSearch.value.toLowerCase()),
  );
});

const filteredPenandatangan = computed(() => {
  if (!penandatanganSearch.value) return penandatanganOptions.value;
  return penandatanganOptions.value.filter((item) =>
    item.displayText
      .toLowerCase()
      .includes(penandatanganSearch.value.toLowerCase()),
  );
});

function selectKlasifikasi(item) {
  form.value.klasifikasi = item.code;
  form.value.klasifikasiDisplay = item.display;
  klasifikasiSearch.value = "";
  openKlasifikasi.value = false;
  console.log("✅ Selected:", item.code, item.display);
}

function selectJenis(item) {
  form.value.jenis = item.code;
  form.value.jenisDisplay = item.display;
  jenisSearch.value = "";
  openJenis.value = false;
  console.log("✅ Selected:", item.code, item.display);
}

function selectPenandatangan(item) {
  form.value.penandatanganJabatan = item.displayText;
  form.value.id_position_penandatangan = Number(item.position);
  penandatanganNama.value = item.nama;
  penandatanganSearch.value = "";
  openPenandatangan.value = false;
  console.log("✅ Selected:", item.displayText, item.nama);
}

function validatePerihal() {
  if (form.value.perihal.length > 100) {
    form.value.perihal = form.value.perihal.slice(0, 100);
    perihalError.value = "Perihal maksimal 100 karakter";
    return;
  }
  if (form.value.perihal.length === 0) {
    perihalError.value = "Perihal wajib diisi";
    return;
  }
  perihalError.value = "";
}

function blockInvalidNumber(e) {
  if (
    e.key === "-" ||
    e.key === "+" ||
    e.key === "e" ||
    e.key === "E" ||
    e.key === "."
  ) {
    e.preventDefault();
    jumlahError.value = "Jumlah harus berupa angka positif (1-10)";
  }
}

function validateJumlah() {
  const val = Number(form.value.jumlah);
  if (!val || isNaN(val)) {
    jumlahError.value = "Jumlah harus antara 1 sampai 10";
    return;
  }
  if (val < 1) {
    jumlahError.value = "Jumlah minimal 1";
    form.value.jumlah = 1;
    return;
  }
  if (val > 10) {
    jumlahError.value = "Jumlah maksimal 10";
    form.value.jumlah = 10;
    return;
  }
  jumlahError.value = "";
}

const fetchPositions = async () => {
  isLoadingPositions.value = true;
  try {
    const response = await get("/person/with-position/all");
    const raw = response?.data ?? response;
    const list = Array.isArray(raw) ? raw : [];

    penandatanganOptions.value = list.map((item) => {
      const positionText = item.position_text || "";
      const subAreaText = item.sub_area_text || "";
      const displayText = subAreaText
        ? `${positionText} - ${subAreaText}`
        : positionText;

      return {
        displayText: displayText,
        position: item.position,
        nama: item.nama,
      };
    });

    console.log("✅ Positions loaded:", penandatanganOptions.value.length);
  } catch (err) {
    console.error("❌ Error fetch positions:", err);
    toast.add({
      title: "Gagal memuat data",
      description: "Tidak dapat memuat daftar penandatangan",
      color: "red",
    });
  } finally {
    isLoadingPositions.value = false;
  }
};

const fetchKlasifikasi = async () => {
  isLoadingKlasifikasi.value = true;
  try {
    const response = await getKlasifikasi();
    klasifikasiOptions.value = response;
    console.log("✅ Klasifikasi loaded:", klasifikasiOptions.value.length);
  } catch (err) {
    console.error("❌ Error fetch klasifikasi:", err);
    toast.add({
      title: "Gagal memuat klasifikasi",
      description: "Coba lagi nanti",
      color: "yellow",
    });
  } finally {
    isLoadingKlasifikasi.value = false;
  }
};

const resetForm = () => {
  tanggalString.value = todayString;
  form.value = {
    tanggal: new Date(),
    klasifikasi: "",
    klasifikasiDisplay: "",
    jenis: "",
    jenisDisplay: "",
    id_position_penandatangan: null,
    penandatanganJabatan: "",
    perihal: "",
    jumlah: 1,
  };
  klasifikasiSearch.value = "";
  jenisSearch.value = "";
  penandatanganSearch.value = "";
  penandatanganNama.value = "";
  jumlahError.value = "";
  perihalError.value = "";
  openKlasifikasi.value = false;
  openJenis.value = false;
  openPenandatangan.value = false;
  hasLoadedPositions.value = false;
  hasLoadedKlasifikasi.value = false;
  previewModal.value = false;
};

const handleClose = (value) => {
  if (!value) {
    resetForm();
  }
  emit("update:modelValue", value);
};

function submitAndClose() {
  const formattedTanggal = tanggalString.value;

  const payload = {
    position_id: Number(user.value.position),
    tanggal: formattedTanggal,
    jenis: form.value.jenis,
    klasifikasi: form.value.klasifikasi,
    perihal: form.value.perihal,
    jumlah: Number(form.value.jumlah),
    penandatangan: form.value.penandatanganJabatan,
    id_position_penandatangan: form.value.id_position_penandatangan,
  };

  console.log("🚀 PAYLOAD:", payload);

  emit("submit", payload);
  handleClose(false);
}

onMounted(async () => {
  if (!user.value) await getProfile();
  console.log("✅ AddUsulan mounted");
});

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
  if (!date) return "-";
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
