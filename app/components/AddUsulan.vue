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
            @click.stop
            @mousedown.stop
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
          >
            <option disabled value="">Pilih jenis naskah</option>
            <option v-for="item in jenisOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <!-- ✅ DROPDOWN PENANDATANGAN DENGAN API -->
        <div>
          <Heading variant="heading11m" class="text-xs font-medium"
            >Penandatangan <span class="text-red-500">*</span></Heading
          >

          <div>
            <UPopover
              v-model:open="openPenandatangan"
              :content="{ side: 'bottom', sideOffset: 6 }"
            >
              <!-- Input pencarian -->
              <div @click="openPenandatangan = true" class="mt-1">
                <UInput
                  v-model="penandatanganSearch"
                  placeholder="Cari penandatangan..."
                  class="w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  :loading="isLoadingPositions"
                />
              </div>

              <!-- Dropdown -->
              <template #content>
                <div
                  class="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md p-1 w-100"
                >
                  <button
                    v-for="item in filteredPenandatangan"
                    :key="item.position"
                    @click="selectPenandatangan(item)"
                    class="w-full text-left px-3 py-2 text-xs hover:bg-primary-100 rounded leading-tight"
                  >
                    {{ item.positionText }}
                  </button>

                  <p
                    v-if="filteredPenandatangan.length === 0"
                    class="text-xs text-center text-gray-400 py-2"
                  >
                    {{ isLoadingPositions ? "Memuat..." : "Tidak ada hasil" }}
                  </p>
                </div>
              </template>
            </UPopover>
          </div>
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
          <Heading variant="11sb"> {{ form.jenis }}</Heading>
        </div>

        <div class="flex justify-between mb-1">
          <Heading variant="10sb">Klasifikasi</Heading>
          <Heading variant="11sb"> {{ form.klasifikasi }}</Heading>
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
import { ref, onMounted, computed } from "vue";
import Heading from "~/components/Heading.vue";
import { UInput } from "#components";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["submit", "update:modelValue", "preview"]);
const toast = useToast();
const jenisOptions = ["BAC", "SPR", "SK", "MOU", "INS", "PER"];

/* STATE DASAR */
const open = ref(false);
const openKlasifikasi = ref(false);
const klasifikasiSearch = ref("");

const openPenandatangan = ref(false);
const penandatanganSearch = ref("");
const penandatanganOptions = ref([]);
const isLoadingPositions = ref(false);

/* COMPOSABLE */
const { getKlasifikasi, getPersonWithPosition } = usePenomoran();
const { user, getProfile } = useAuth();

/* FORM STATE */
const form = ref({
  tanggal: null,
  klasifikasi: "",
  jenis: "",
  penandatanganName: "",
  penandatanganJabatan: "",
  id_position_penandatangan: null,
  perihal: "",
  jumlah: 1,
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
    Number(form.value.jumlah) < 1
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description: "Lengkapi form sebelum pratinjau",
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
  return klasifikasiOptions.value.filter((i) =>
    i.toLowerCase().includes(klasifikasiSearch.value.toLowerCase()),
  );
});

const filteredPenandatangan = computed(() => {
  if (!penandatanganSearch.value) return penandatanganOptions.value;
  return penandatanganOptions.value.filter((item) =>
    (item.nama + " " + item.positionText)
      .toLowerCase()
      .includes(penandatanganSearch.value.toLowerCase()),
  );
});

/* SELECT HANDLER */
function selectKlasifikasi(item) {
  form.value.klasifikasi = item;
  klasifikasiSearch.value = item;
  openKlasifikasi.value = false;
}

function selectPenandatangan(item) {
  form.value.penandatanganName = item.nama;
  form.value.penandatanganJabatan = item.positionText;
  form.value.id_position_penandatangan = Number(item.position);

  penandatanganSearch.value = item.positionText;
  openPenandatangan.value = false;

  console.log("✅ Penandatangan selected:", {
    nama: item.nama,
    position_text: item.positionText,
    position_id: item.position,
    position_id_type: typeof Number(item.position),
  });
}

/* FETCH DATA */
const fetchPositions = async () => {
  isLoadingPositions.value = true;
  try {
    const response = await getPersonWithPosition();
    const raw = response?.data ?? response;

    const list = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
        ? raw
        : [];

    penandatanganOptions.value = list.map((item) => ({
      nama: item.nama,
      positionText: item.position_text,
      position: item.position,
    }));

    console.log("✅ Positions loaded:", penandatanganOptions.value.length);
  } catch (err) {
    console.error("❌ Error fetch positions:", err);
  } finally {
    isLoadingPositions.value = false;
  }
};

const fetchKlasifikasi = async () => {
  isLoadingKlasifikasi.value = true;
  try {
    const response = await getKlasifikasi();
    const list = Array.isArray(response) ? response : (response.data ?? []);

    klasifikasiOptions.value = [
      ...new Set(list.map((item) => item.klasifikasi)),
    ].sort();

    console.log("✅ Klasifikasi loaded:", klasifikasiOptions.value.length);
  } catch (err) {
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

/* SUBMIT */
const submitAndClose = async () => {
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.penandatanganJabatan ||
    !form.value.perihal ||
    Number(form.value.jumlah) < 1
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description: "Pastikan semua field diisi",
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

  // ✅ Payload dengan PENOMORAN yang akan digenerate
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

    // ✅ TAMBAHAN: Data penomoran untuk generate nomor
    penomoran: {
      jenis: form.value.jenis,
      klasifikasi: form.value.klasifikasi,
      tanggal: form.value.tanggal,
      jumlah: Number(form.value.jumlah),
    },
  };

  console.log("📤 PAYLOAD SUBMIT:", JSON.stringify(payload, null, 2));

  // Validasi final
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

const resetForm = () => {
  form.value = {
    tanggal: null,
    klasifikasi: "",
    jenis: "",
    id_position_penandatangan: null,
    penandatanganText: "",
    penandatanganName: "",
    penandatanganJabatan: "",
    perihal: "",
    jumlah: 1,
  };

  klasifikasiSearch.value = "";
  penandatanganSearch.value = "";
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
