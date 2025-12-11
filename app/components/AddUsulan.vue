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
          <Heading variant="heading11m" class="text-xs font-medium"
            >Tanggal Surat</Heading
          >

          <ClientOnly>
            <UPopover
              v-model:open="open"
              :max="today"
              :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
            >
              <div
                class="mt-1 flex w-full items-center px-2 py-2 border border-gray-300 rounded-lg gap-2 cursor-pointer focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 pr-2"
                @click="open = true"
              >
                <UInputDate
                  locale="id-ID"
                  v-model="form.tanggal"
                  variant="none"
                  size="sm"
                  format="DD MMMM YYYY"
                  readonly
                  class="flex-1"
                  :ui="{
                    base: '!bg-transparent !text-sm !px-0 select-none inline-flex items-center h-3',
                  }"
                />

                <UIcon
                  name="i-lucide-calendar"
                  class="size-4 text-gray-400 shrink-0 mr-1"
                />
              </div>
              <template #content>
                <UCalendar
                  v-model="form.tanggal"
                  class="p-2"
                  @update:model-value="open = false"
                />
              </template>
            </UPopover>
          </ClientOnly>
        </div>

        <!-- ✅ DROPDOWN KLASIFIKASI DARI API -->

        <div>
          <Heading variant="heading11m" class="text-xs font-medium">
            Klasifikasi <span class="text-red-500">*</span>
          </Heading>

          <UPopover
            v-model:open="openKlasifikasi"
            :content="{ side: 'bottom', sideOffset: 6 }"
          >
            <div @click="openKlasifikasi = true" class="mt-1">
              <UInput
                v-model="klasifikasiSearch"
                placeholder="Cari klasifikasi..."
                class="w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <template #content>
              <div
                class="max-h-52 overflow-y-auto bg-white border border-gray-100 rounded-md p-1 w-100"
              >
                <button
                  v-for="item in filteredKlasifikasi"
                  :key="item"
                  @click="selectKlasifikasi(item)"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 rounded"
                >
                  {{ item }}
                </button>

                <p
                  v-if="filteredKlasifikasi.length === 0"
                  class="text-xs text-center text-gray-400 py-2"
                >
                  Tidak ada hasil
                </p>
              </div>
            </template>
          </UPopover>
        </div>

        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Jenis Naskah <span class="text-red-500">*</span></Heading
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
          <Heading variant="heading11m" class="text-xs font-medium"
            >Pengirim <span class="text-red-500">*</span></Heading
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
          <Heading
            variant="heading11m"
            class="text-xs font-medium focus:primary-500"
            >Perihal <span class="text-red-500">*</span></Heading
          >
          <UInput
            class="mt-1 w-full focus:ring-primary-500 focus:border-primary-500"
            v-model="form.perihal"
            placeholder="Masukkan perihal"
          />
        </div>

        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Jumlah <span class="text-red-500">*</span></Heading
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
            :disabled="isLoadingKlasifikasi"
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

      <div class="p-8 max-w-5xl w-full max-h-[150vh] overflow-y-auto text-sm">
        <p class="text-center text-xs text-gray-500">
          {{ formatDateTime(new Date()) }}
        </p>

        <h3 class="text-center font-bold text-base mt-1">
          FORMULIR USULAN NOMOR
        </h3>

        <p class="text-center text-xs text-gray-500 mb-6">
          ID. {{ form.perihal.length }}{{ form.jumlah
          }}{{ form.tanggal ? form.tanggal.toString().replace(/-/g, "") : "" }}
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
import { ref, onMounted } from "vue";
import Heading from "~/components/Heading.vue";
import { UInput } from "#components";
import { usePenomoran } from "~/composables/usePenomoran";

const props = defineProps({
  modelValue: Boolean,
});

const open = ref(false);
const emit = defineEmits(["submit", "update:modelValue"]);
const toast = useToast();

const openKlasifikasi = ref(false);
const klasifikasiSearch = ref("");

// filter klasifikasi berdasarkan input
const filteredKlasifikasi = computed(() => {
  if (!klasifikasiSearch.value) return klasifikasiOptions.value;

  return klasifikasiOptions.value.filter((i) =>
    i.toLowerCase().includes(klasifikasiSearch.value.toLowerCase()),
  );
});

function selectKlasifikasi(item) {
  form.value.klasifikasi = item;
  klasifikasiSearch.value = item;
  openKlasifikasi.value = false;
}

// ✅ FETCH KLASIFIKASI DARI API
const { getKlasifikasi } = usePenomoran();

const klasifikasiOptions = ref([]);
const isLoadingKlasifikasi = ref(false);

const fetchKlasifikasi = async () => {
  isLoadingKlasifikasi.value = true;

  try {
    const response = await getKlasifikasi();

    // BE selalu mengembalikan bentuk:
    // { success: true, data: [...] }
    const list = Array.isArray(response) ? response : (response.data ?? []);

    // Ambil hanya kode klasifikasi → "AUD", "AUD.01", dst
    const uniqueKlasifikasi = [
      ...new Set(list.map((item) => item.klasifikasi)),
    ];

    klasifikasiOptions.value = uniqueKlasifikasi.sort();

    console.log("✅ Klasifikasi berhasil dimuat:", klasifikasiOptions.value);
  } catch (error) {
    console.error("❌ Error fetch klasifikasi:", error);

    toast.add({
      title: "Gagal memuat klasifikasi",
      description: "Menggunakan data default",
      color: "yellow",
    });

    klasifikasiOptions.value = ["Biasa", "Terbatas", "Rahasia"];
  } finally {
    isLoadingKlasifikasi.value = false;
  }
};

// ✅ Load klasifikasi saat modal dibuka
onMounted(() => {
  fetchKlasifikasi();
});

const submitAndClose = async () => {
  // Validasi form
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.pengirim ||
    !form.value.perihal ||
    Number(form.value.jumlah) < 1
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description: "Pastikan semua field diisi dan jumlah minimal 1",
      color: "red",
    });
    return;
  }

  // ✅ Payload tanpa field pengirim (karena BE tidak accept)
  const payload = {
    position_id: 70016786,
    tanggal: form.value.tanggal, // Akan diconvert ke Date di composable
    jenis: form.value.jenis,
    klasifikasi: form.value.klasifikasi,
    perihal: form.value.perihal,
    jumlah: Number(form.value.jumlah),
  };

  console.log("📤 PAYLOAD FINAL:", payload);

  try {
    // Emit ke parent untuk proses save ke BE
    emit("submit", payload);

    // Reset form setelah emit
    resetForm();

    // Tutup modal
    emit("update:modelValue", false);
  } catch (error) {
    console.error("❌ Gagal submit:", error);

    toast.add({
      title: "Gagal",
      description: error.message || "Terjadi kesalahan saat menambahkan usulan",
      color: "red",
    });
  }
};

const resetForm = () => {
  form.value = {
    tanggal: null,
    klasifikasi: "",
    jenis: "",
    pengirim: "",
    perihal: "",
    jumlah: 1,
  };
};

// FORM STATE
const form = ref({
  tanggal: null,
  klasifikasi: "",
  jenis: "",
  pengirim: "",
  perihal: "",
  jumlah: 1,
});

// BATAS TANGGAL (hanya hari ini & hari yang sudah lewat)
const today = new Date().toISOString().split("T")[0];

// OPTIONS (static)
const jenisOptions = ["BAC", "SPR", "SK", "MOU"];
const pengirimOptions = ["Direktur Utama", "Direktur SDM", "Direktur Operasi"];

const previewModal = ref(false);

function openPreview() {
  previewModal.value = true;
}

function closePreview() {
  previewModal.value = false;
  emit("update:modelValue", true);
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
