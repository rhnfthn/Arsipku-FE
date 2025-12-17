<template>
  <!-- MODAL FORM -->
  <transition name="fade-scale">
    <Modal
      v-if="modelValue"
      :model-value="modelValue"
      :hide-default-footer="true"
      size="xl"
      @update:model-value="handleClose"
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
        <!-- ✅ Tanggal Surat - Simple Date Picker -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Tanggal Surat <span class="text-red-500">*</span></Heading
          >

          <input
            type="date"
            v-model="tanggalString"
            :max="todayString"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        <!-- ✅ DROPDOWN KLASIFIKASI DENGAN FORMAT "CODE - TEXT" -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium">
            Klasifikasi <span class="text-red-500">*</span>
          </Heading>

          <div class="relative" ref="klasifikasiRef">
            <input
              v-model="klasifikasiSearch"
              @click="toggleKlasifikasi"
              @input="openKlasifikasi = true"
              :placeholder="form.klasifikasiDisplay || 'Cari klasifikasi...'"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />

            <div
              v-if="openKlasifikasi && filteredKlasifikasi.length > 0"
              class="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg"
            >
              <button
                v-for="item in filteredKlasifikasi"
                :key="item.code"
                @click="selectKlasifikasi(item)"
                class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100"
              >
                {{ item.display }}
              </button>
            </div>

            <p
              v-if="openKlasifikasi && filteredKlasifikasi.length === 0"
              class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-xs text-center text-gray-400"
            >
              {{ isLoadingKlasifikasi ? "Memuat..." : "Tidak ada hasil" }}
            </p>
          </div>
        </div>

        <!-- ✅ Jenis Naskah - Format "CODE - TEXT" -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Jenis Naskah <span class="text-red-500">*</span></Heading
          >
          <select
            v-model="form.jenis"
            @change="updateJenisDisplay"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
          >
            <option disabled value="">Pilih jenis naskah</option>
            <option
              v-for="item in jenisOptions"
              :key="item.code"
              :value="item.code"
            >
              {{ item.display }}
            </option>
          </select>
        </div>

        <!-- ✅ DROPDOWN PENANDATANGAN - Jabatan (Sub Area) -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Penandatangan <span class="text-red-500">*</span></Heading
          >

          <div class="relative" ref="penandatanganRef">
            <input
              v-model="penandatanganSearch"
              @click="togglePenandatangan"
              @input="openPenandatangan = true"
              :placeholder="
                form.penandatanganJabatan || 'Cari penandatangan...'
              "
              :disabled="isLoadingPositions"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />

            <div
              v-if="openPenandatangan && filteredPenandatangan.length > 0"
              class="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg"
            >
              <button
                v-for="item in filteredPenandatangan"
                :key="item.position"
                @click="selectPenandatangan(item)"
                class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100"
              >
                {{ item.displayText }}
              </button>
            </div>

            <p
              v-if="openPenandatangan && filteredPenandatangan.length === 0"
              class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-xs text-center text-gray-400"
            >
              {{ isLoadingPositions ? "Memuat..." : "Tidak ada hasil" }}
            </p>
          </div>
        </div>

        <!-- ✅ Perihal - Validasi panjang karakter -->
        <div>
          <Heading
            variant="heading11m"
            class="text-xs font-medium focus:primary-500"
            >Perihal <span class="text-red-500">*</span></Heading
          >
          <input
            v-model="form.perihal"
            placeholder="Masukkan perihal"
            maxlength="500"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ form.perihal.length }}/500 karakter
          </p>
        </div>

        <!-- ✅ Jumlah - Validasi min max (1-10) -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Jumlah <span class="text-red-500">*</span></Heading
          >
          <input
            type="number"
            v-model.number="form.jumlah"
            placeholder="Masukkan jumlah (1-10)"
            min="1"
            max="10"
            @keydown="blockInvalidNumber"
            @input="validateJumlah"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />

          <p v-if="jumlahError" class="text-xs text-red-500 mt-1">
            {{ jumlahError }}
          </p>
        </div>
      </div>

      <!-- FOOTER -->
      <template #footer>
        <div
          class="flex justify-end gap-3 border-t border-gray-200 px-5 py-4 w-full"
        >
          <button
            @click="handleCancel"
            class="px-5 py-2 text-xs border border-gray-300 hover:bg-gray-100 rounded-md"
          >
            Batal
          </button>

          <button
            @click="openPreviewModal"
            class="px-5 py-2 text-xs border border-primary-500 hover:bg-primary-50 text-primary rounded-md"
          >
            Pratinjau
          </button>

          <button
            @click="submitAndClose"
            class="px-5 py-2 bg-primary text-white hover:bg-primary-800 text-xs rounded-md"
            :disabled="isLoadingKlasifikasi || isLoadingPositions"
          >
            Simpan Usulan
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

      <div class="p-3 max-w-5xl w-full max-h-[150vh] overflow-y-auto text-sm">
        <p class="text-center text-xs text-gray-500">
          {{ formatDateTime(new Date()) }}
        </p>

        <h3 class="text-center font-bold text-base mt-1 mb-3">
          FORMULIR USULAN NOMOR
        </h3>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Nama</Heading>
          <Heading variant="11sb"> {{ form.penandatanganName || "-" }}</Heading>
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Jabatan</Heading>
          <Heading variant="11sb">
            {{ form.penandatanganJabatan || "-" }}</Heading
          >
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Jenis</Heading>
          <Heading variant="11sb"> {{ form.jenisDisplay }}</Heading>
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Klasifikasi</Heading>
          <Heading variant="11sb"> {{ form.klasifikasiDisplay }}</Heading>
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Tanggal</Heading>
          <Heading variant="11sb"> {{ formatDate(form.tanggal) }}</Heading>
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Jumlah</Heading>
          <Heading variant="11sb"> {{ form.jumlah }} Nomor</Heading>
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Perihal</Heading>
          <Heading variant="11sb"> {{ form.perihal }}</Heading>
        </div>

        <div class="flex justify-between">
          <Heading variant="10sb">Nomor </Heading>
          <span class="text-gray-800 text-xs tracking-widest font-mono">
            {{ form.jenis }}....../O/00/LPPNPI/{{ form.klasifikasi }}/XII/2025
          </span>
        </div>
      </div>

      <hr class="my-0" />

      <div class="flex justify-between items-start px-5 pb-2">
        <div>
          <p class="text-gray-500 uppercase text-xs mb-1">Pengusul</p>
          <p class="font-semibold text-xs">
            {{ user?.nama || "-" }}
          </p>
        </div>

        <div class="text-right">
          <p class="text-gray-500 uppercase text-xs mb-1">Diusulkan</p>
          <p class="text-xs">{{ formatDateTime(new Date()) }}</p>
        </div>
      </div>

      <div
        class="bg-gray-50 border border-gray-200 text-xs p-3 rounded-md mt-4 mx-8 mb-4"
      >
        Cetak formulir dan lampirkan naskah final yang akan diberikan nomor...
      </div>
    </Modal>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import Heading from "~/components/Heading.vue";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["submit", "update:modelValue", "preview"]);
const toast = useToast();

// ✅ Jenis Options dengan format "CODE - TEXT"
const jenisOptions = [
  { code: "BAC", display: "BAC - Berita Acara" },
  { code: "SPR", display: "SPR - Surat Perintah" },
  { code: "SK", display: "SK - Surat Keputusan" },
  { code: "MOU", display: "MOU - Memorandum of Understanding" },
  { code: "INS", display: "INS - Instruksi" },
  { code: "PER", display: "PER - Peraturan" },
];

/* STATE DASAR */
const openKlasifikasi = ref(false);
const klasifikasiSearch = ref("");
const klasifikasiRef = ref(null);

const openPenandatangan = ref(false);
const penandatanganSearch = ref("");
const penandatanganRef = ref(null);
const penandatanganOptions = ref([]);
const isLoadingPositions = ref(false);

const jumlahError = ref("");

// ✅ Date handling
const today = new Date();
const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD
const tanggalString = ref(todayString);

/* COMPOSABLE */
const { getKlasifikasi, getPersonWithPosition } = usePenomoran();
const { user, getProfile } = useAuth();

/* FORM STATE - ✅ Default tanggal = current date */
const form = ref({
  tanggal: new Date(),
  klasifikasi: "",
  klasifikasiDisplay: "",
  jenis: "",
  jenisDisplay: "",
  penandatanganName: "",
  penandatanganJabatan: "",
  id_position_penandatangan: null,
  perihal: "",
  jumlah: 1,
});

// Watch tanggalString and update form.tanggal
watch(tanggalString, (newVal) => {
  if (newVal) {
    form.value.tanggal = new Date(newVal);
  }
});

// ✅ Close dropdowns when clicking outside
const handleClickOutside = (e) => {
  if (klasifikasiRef.value && !klasifikasiRef.value.contains(e.target)) {
    openKlasifikasi.value = false;
  }
  if (penandatanganRef.value && !penandatanganRef.value.contains(e.target)) {
    openPenandatangan.value = false;
  }
};

// ✅ Toggle dropdowns - hanya buka jika ada data
const toggleKlasifikasi = () => {
  if (klasifikasiOptions.value.length > 0) {
    openKlasifikasi.value = !openKlasifikasi.value;
  }
};

const togglePenandatangan = () => {
  if (penandatanganOptions.value.length > 0) {
    openPenandatangan.value = !openPenandatangan.value;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

/* PRATINJAU */
const previewModal = ref(false);
function openPreviewModal() {
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.penandatanganJabatan ||
    !form.value.perihal ||
    form.value.perihal.length === 0 ||
    form.value.perihal.length > 500 ||
    Number(form.value.jumlah) < 1 ||
    Number(form.value.jumlah) > 10
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description:
        "Lengkapi form sebelum pratinjau. Perihal maksimal 500 karakter.",
      color: "yellow",
    });
    return;
  }

  previewModal.value = true;
}

function closePreview() {
  previewModal.value = false;
}

/* FILTER */
const klasifikasiOptions = ref([]);
const isLoadingKlasifikasi = ref(false);

const filteredKlasifikasi = computed(() => {
  if (!klasifikasiSearch.value) return klasifikasiOptions.value;
  return klasifikasiOptions.value.filter((item) =>
    item.display.toLowerCase().includes(klasifikasiSearch.value.toLowerCase()),
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

/* SELECT HANDLER */
function selectKlasifikasi(item) {
  form.value.klasifikasi = item.code;
  form.value.klasifikasiDisplay = item.display;
  klasifikasiSearch.value = item.display;
  openKlasifikasi.value = false;

  console.log("✅ Klasifikasi selected:", {
    code: item.code,
    display: item.display,
  });
}

function selectPenandatangan(item) {
  form.value.penandatanganName = item.nama;
  form.value.penandatanganJabatan = item.displayText;
  form.value.id_position_penandatangan = Number(item.position);

  penandatanganSearch.value = item.displayText;
  openPenandatangan.value = false;

  console.log("✅ Penandatangan selected:", {
    nama: item.nama,
    display_text: item.displayText,
    position_id: item.position,
  });
}

function updateJenisDisplay() {
  const selected = jenisOptions.find((item) => item.code === form.value.jenis);
  if (selected) {
    form.value.jenisDisplay = selected.display;
  }
}

/* ✅ VALIDASI JUMLAH (1-10) dengan error untuk minus dan 0 */
function blockInvalidNumber(e) {
  // blok: minus, plus, e, E, decimal
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

  if (isNaN(val)) {
    jumlahError.value = "Jumlah harus berupa angka";
    form.value.jumlah = 1;
    return;
  }

  if (val < 1) {
    jumlahError.value = "Jumlah tidak boleh kurang dari 1 atau minus";
    form.value.jumlah = 1;
  } else if (val > 10) {
    jumlahError.value = "Jumlah maksimal 10";
    form.value.jumlah = 10;
  } else {
    jumlahError.value = "";
  }
}

/* FETCH DATA */
const fetchPositions = async () => {
  isLoadingPositions.value = true;
  try {
    const response = await getPersonWithPosition();
    console.log("📥 Raw response from API:", response);

    const raw = response?.data ?? response;
    const list = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
        ? raw
        : [];

    console.log("📋 List to process:", list);

    // ✅ Format: "Position Text (Sub Area Text)"
    penandatanganOptions.value = list.map((item) => {
      const positionText = item.position_text || "";
      const subAreaText = item.sub_area_text || "";

      // Format: "Manager Operasi 4 (Cabang Balikpapan)"
      const displayText = subAreaText
        ? `${positionText} (${subAreaText})`
        : positionText;

      return {
        nama: item.nama,
        positionText: item.position_text,
        subAreaText: item.sub_area_text,
        displayText: displayText,
        position: item.position,
      };
    });

    console.log("✅ Positions loaded:", penandatanganOptions.value.length);
    console.log("📋 Sample data:", penandatanganOptions.value.slice(0, 3));
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

/* RESET FORM */
const resetForm = () => {
  tanggalString.value = todayString;
  form.value = {
    tanggal: new Date(),
    klasifikasi: "",
    klasifikasiDisplay: "",
    jenis: "",
    jenisDisplay: "",
    id_position_penandatangan: null,
    penandatanganName: "",
    penandatanganJabatan: "",
    perihal: "",
    jumlah: 1,
  };

  klasifikasiSearch.value = "";
  penandatanganSearch.value = "";
  jumlahError.value = "";
  openKlasifikasi.value = false;
  openPenandatangan.value = false;

  console.log("🔄 Form reset");
};

/* HANDLE CLOSE & CANCEL */
const handleClose = (value) => {
  if (!value) {
    resetForm();
  }
  emit("update:modelValue", value);
};

const handleCancel = () => {
  resetForm();
  emit("update:modelValue", false);
};

/* SUBMIT */
const submitAndClose = async () => {
  // Validasi form dengan validasi perihal
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.penandatanganJabatan ||
    !form.value.perihal ||
    form.value.perihal.length === 0 ||
    form.value.perihal.length > 500 ||
    Number(form.value.jumlah) < 1 ||
    Number(form.value.jumlah) > 10
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description:
        "Pastikan semua field diisi dengan benar. Perihal maksimal 500 karakter.",
      color: "red",
    });
    return;
  }

  if (!user.value) {
    toast.add({
      title: "Error",
      description: "User belum login",
      color: "red",
    });
    return;
  }

  console.log("🔍 Form values before payload:", {
    id_position_penandatangan: form.value.id_position_penandatangan,
    type: typeof form.value.id_position_penandatangan,
  });

  // ✅ Payload dengan klasifikasi CODE dan jenis CODE
  const payload = {
    position_id: Number(user.value.position),
    tanggal: form.value.tanggal,
    jenis: form.value.jenis,
    klasifikasi: form.value.klasifikasi,
    perihal: form.value.perihal,
    penandatangan: form.value.penandatanganJabatan,
    id_position_penandatangan: parseInt(
      form.value.id_position_penandatangan,
      10,
    ),
    jumlah: Number(form.value.jumlah),

    penomoran: {
      jenis: form.value.jenis,
      klasifikasi: form.value.klasifikasi,
      tanggal: form.value.tanggal,
      jumlah: Number(form.value.jumlah),
    },
  };

  console.log("📤 PAYLOAD SUBMIT:", JSON.stringify(payload, null, 2));

  if (
    !payload.id_position_penandatangan ||
    isNaN(payload.id_position_penandatangan)
  ) {
    toast.add({
      title: "Error",
      description: "ID Position Penandatangan tidak valid",
      color: "red",
    });
    return;
  }

  emit("submit", payload);
  resetForm();
  emit("update:modelValue", false);
};

/* INIT */
onMounted(async () => {
  if (!user.value) await getProfile();
  await fetchKlasifikasi();
  await fetchPositions();
});

/* UTIL */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
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
