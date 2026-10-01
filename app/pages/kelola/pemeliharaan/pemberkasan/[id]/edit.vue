<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="`Edit Berkas${berkas?.judulBerkas ? `: ${berkas.judulBerkas}` : ''}`"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: backPath },
        { label: 'Detail Berkas', to: detailPath },
        { label: 'Edit' },
      ]"
    />

    <div v-if="isLoading" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="canEdit">
      <div class="space-y-5">
        <!-- Back & status -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <UButton color="primary" variant="soft" icon="i-lucide-arrow-left" :to="detailPath">
            Kembali ke Detail
          </UButton>
          <UBadge
            v-if="berkas?.status"
            :color="statusBadgeColor"
            variant="soft"
            size="lg"
            class="gap-1.5 rounded-full"
          >
            <UIcon name="i-lucide-info" class="size-4" />{{ statusLabel }}
          </UBadge>
        </div>

        <!-- Panel tunggal: section dipisah oleh pembatas (divide-y) -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
        >
          <!-- Informasi Berkas -->
          <div>
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <UIcon
                  name="i-lucide-folder-archive"
                  class="size-5 text-primary-600 dark:text-primary-400"
                />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Berkas</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Metadata utama berkas. Retensi mengikuti klasifikasi.
                </p>
              </div>
            </div>
            <div class="space-y-1 px-5 py-2">
              <!-- Klasifikasi -->
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
              >
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                >
                  Klasifikasi <span class="text-red-500">*</span>
                </span>
                <div class="flex-1 w-full">
                  <USelectMenu
                    v-model="form.klasifikasi"
                    :items="klasifikasiItems"
                    value-key="klasifikasi"
                    label-key="searchLabel"
                    searchable
                    :search-attributes="['searchLabel']"
                    placeholder="Pilih klasifikasi arsip"
                    :search-input="{ placeholder: 'Cari klasifikasi…' }"
                    variant="none"
                    class="w-full"
                    :ui="{
                      base: '!px-0 !bg-transparent w-full dark:text-white',
                      ring: 'ring-0',
                      shadow: 'shadow-none',
                      width: 'w-full max-w-[calc(100vw-2rem)]',
                    } as any"
                    @update:model-value="onKlasifikasiChange"
                  >
                    <template #item="{ item }">
                      <div v-if="item.isParent" class="w-full py-1 overflow-hidden">
                        <span
                          class="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest block w-full truncate"
                        >
                          {{ item.klasifikasi }} — {{ item.klasifikasi_text || '' }}
                        </span>
                      </div>
                      <div v-else class="flex flex-col min-w-0 w-full overflow-hidden py-1">
                        <span
                          class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate"
                        >
                          {{ item.klasifikasi }} — {{ item.klasifikasi_text || '' }}
                        </span>
                      </div>
                    </template>
                    <template #default>
                      <span
                        v-if="klasifikasiSelected"
                        class="truncate text-sm block w-full text-left dark:text-white"
                      >
                        {{ klasifikasiSelected.klasifikasi }} —
                        {{ klasifikasiSelected.klasifikasi_text || '' }}
                      </span>
                      <span
                        v-else
                        class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left"
                      >
                        Pilih klasifikasi arsip
                      </span>
                    </template>
                  </USelectMenu>
                  <p v-if="errors.klasifikasi" class="text-xs text-red-500 mt-1">
                    Klasifikasi wajib dipilih
                  </p>
                </div>
              </div>

              <!-- Nama Berkas -->
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
              >
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                >
                  Nama Berkas <span class="text-red-500">*</span>
                </span>
                <div class="flex-1 w-full">
                  <input
                    v-model="form.judul_berkas"
                    type="text"
                    placeholder="Masukkan nama berkas"
                    class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                    @input="errors.judul_berkas = false"
                  />
                  <p v-if="errors.judul_berkas" class="text-xs text-red-500 mt-1">
                    Nama berkas wajib diisi
                  </p>
                </div>
              </div>

              <!-- Retensi (auto, read-only) -->
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
              >
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                >
                  Retensi (Aktif / Inaktif)
                </span>
                <div class="flex-1 w-full">
                  <input
                    :value="retensiLabel"
                    type="text"
                    disabled
                    placeholder="Otomatis dari klasifikasi"
                    class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full opacity-75 cursor-default"
                  />
                </div>
              </div>

              <!-- Kategori Berkas -->
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0"
              >
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                >
                  Kategori / Tag Berkas
                </span>
                <div class="flex-1 w-full">
                  <input
                    v-model="form.kategori_berkas"
                    type="text"
                    placeholder="Penanda tambahan untuk memudahkan pencarian, mis. Pengadaan IT, Keuangan, SDM…"
                    class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                  />
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Opsional — berkas bisa difilter &amp; dicari berdasarkan kategori ini.
                  </p>
                </div>
              </div>

              <!-- Lokasi Fisik -->
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1 sm:gap-0"
              >
                <span
                  class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
                >
                  Lokasi Fisik <span class="text-red-500">*</span>
                </span>
                <div class="flex-1 w-full">
                  <input
                    v-model="form.lokasi"
                    type="text"
                    placeholder="Contoh: Rak A, Baris 2"
                    class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                    @input="errors.lokasi = false"
                  />
                  <p v-if="errors.lokasi" class="text-xs text-red-500 mt-1">
                    Lokasi fisik wajib diisi
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Lampiran Berkas -->
          <div>
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <UIcon
                  name="i-lucide-paperclip"
                  class="size-5 text-primary-600 dark:text-primary-400"
                />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Lampiran Berkas</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Foto lokasi fisik berkas. Kosongkan untuk pertahankan yang lama.
                </p>
              </div>
            </div>
            <div class="px-5 py-5">
              <!-- Foto Lokasi Fisik -->
              <div>
                <p
                  class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Foto Lokasi Fisik
                </p>
                <p
                  v-if="existingFoto && !form.foto_lokasi_fisik"
                  class="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  <UIcon name="i-lucide-check-circle-2" class="size-3.5 text-success-500" />
                  Foto saat ini tersimpan. Pilih file baru untuk mengganti.
                </p>
                <label
                  class="group cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 transition border-gray-300 dark:border-gray-600"
                >
                  <UIcon
                    name="i-lucide-image"
                    class="size-6 text-gray-400 group-hover:text-primary-500 dark:text-gray-500"
                  />
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Seret foto atau
                    <span class="text-primary-500 font-medium">pilih file</span>
                  </p>
                  <p class="text-[10px] text-gray-400 dark:text-gray-500">JPG/PNG, maks 5MB</p>
                  <input
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/png"
                    @change="onFotoChange"
                  />
                </label>
                <div v-if="form.foto_lokasi_fisik" class="mt-2">
                  <span class="text-xs text-gray-600 dark:text-gray-300">{{
                    form.foto_lokasi_fisik.name
                  }}</span>
                  <button
                    type="button"
                    class="ml-2 text-red-400 hover:text-red-600"
                    @click="form.foto_lokasi_fisik = null"
                  >
                    <UIcon name="i-lucide-x" class="size-3.5 inline" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Uraian Berkas -->
          <div>
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <UIcon
                  name="i-lucide-message-square-text"
                  class="size-5 text-primary-600 dark:text-primary-400"
                />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Uraian Berkas</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Keterangan ringkas isi berkas.
                </p>
              </div>
            </div>
            <div class="px-5 py-4">
              <UTextarea
                v-model="form.isi_ringkas"
                :rows="4"
                autoresize
                class="w-full"
                placeholder="Keterangan berkas…"
                @input="errors.isi_ringkas = false"
              />
              <p v-if="errors.isi_ringkas" class="mt-1.5 text-xs text-red-500">
                Uraian wajib diisi
              </p>
            </div>
          </div>

          <!-- Aksi Simpan -->
          <div
            class="bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800"
          >
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
                >
                  <UIcon name="i-lucide-save" class="size-5" />
                </span>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Simpan Perubahan</h3>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Periksa kembali perubahan sebelum menyimpan.
                  </p>
                </div>
              </div>
              <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="lg"
                  icon="i-lucide-x"
                  :to="detailPath"
                >
                  Batal
                </UButton>
                <UButton
                  color="primary"
                  size="lg"
                  icon="i-lucide-save"
                  :loading="isSubmitting"
                  @click="handleSubmit"
                >
                  Simpan Perubahan
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Status tidak bisa diedit -->
    <div
      v-else
      class="rounded-xl border border-amber-200 bg-white px-6 py-16 text-center shadow-sm dark:border-amber-900/50 dark:bg-gray-800"
    >
      <div
        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30"
      >
        <UIcon name="i-lucide-lock" class="size-7 text-amber-500" />
      </div>
      <h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Berkas tidak dapat diedit
      </h2>
      <p class="mx-auto mt-1 max-w-lg text-sm text-gray-500 dark:text-gray-400">
        Berkas dengan status <span class="font-medium">{{ statusLabel }}</span> tidak bisa diubah.
        Hanya berkas berstatus Terbuka atau Verifikasi Ditolak Managerial yang dapat diedit.
      </p>
      <div class="mt-5 flex justify-center gap-2">
        <UButton color="primary" icon="i-lucide-arrow-left" :to="detailPath">
          Kembali ke Detail
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });
const route = useRoute();
const router = useRouter();
const { getBerkasById, updateBerkas, getKlasifikasiDenganRetensi, uploadBerkasFile } =
  useArsipDinamis();
const toast = useToast();

const berkasId = computed(() => route.params.id as string);
const detailPath = computed(() => `/kelola/pemeliharaan/pemberkasan/${berkasId.value}`);
const backPath = '/kelola/pemeliharaan/pemberkasan/berkas-saya';

const berkas = ref<any>(null);
const isLoading = ref(true);
const isSubmitting = ref(false);
const klasifikasiList = ref<any[]>([]);

const form = reactive({
  klasifikasi: '',
  judul_berkas: '',
  kategori_berkas: '',
  lokasi: '',
  isi_ringkas: '',
  foto_lokasi_fisik: null as File | null,
});
const errors = reactive({
  klasifikasi: false,
  judul_berkas: false,
  lokasi: false,
  isi_ringkas: false,
});
const existingFoto = ref('');
const selectedRetensiAktif = ref(0);
const selectedRetensiInaktif = ref(0);

const EDITABLE_STATUSES = ['aktif', 'ditolak'];
const canEdit = computed(() => EDITABLE_STATUSES.includes(berkas.value?.status));

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    aktif: 'Terbuka',
    menunggu_verifikasi: 'Menunggu Verifikasi Managerial',
    ditolak: 'Verifikasi Ditolak Managerial',
    closed_retensi_aktif: 'Tertutup',
  };
  return map[berkas.value?.status] || berkas.value?.status || '-';
});
const statusBadgeColor = computed(() => {
  const map: Record<string, string> = {
    draft: 'neutral',
    aktif: 'warning',
    ditolak: 'error',
    menunggu_verifikasi: 'warning',
  };
  return map[berkas.value?.status] || 'neutral';
});

const klasifikasiSelected = computed(() =>
  klasifikasiList.value.find((k: any) => k.klasifikasi === form.klasifikasi)
);
// Parent klasifikasi (punya child) di-disable & ditampilkan sebagai group header,
// menyamakan perilaku dengan form klasifikasi di halaman tulis & tambah berkas.
const klasifikasiItems = computed(() => {
  const sorted = [...klasifikasiList.value].sort((a: any, b: any) =>
    String(a.klasifikasi).localeCompare(String(b.klasifikasi))
  );
  const childIds = new Set(
    sorted.map((item: any) => item.id_parent).filter((pid: any) => !!pid)
  );
  return sorted.map((item: any) => {
    const isParent = childIds.has(item.id);
    const selectable = !isParent && Number(item.is_select ?? 1) === 1;
    return {
      ...item,
      searchLabel: item.search_text || [
        item.klasifikasi,
        item.klasifikasi_text,
        item.deskripsi,
      ].filter(Boolean).join(' '),
      isParent,
      disabled: !selectable,
    };
  });
});
const retensiLabel = computed(() =>
  selectedRetensiAktif.value || selectedRetensiInaktif.value
    ? `${selectedRetensiAktif.value}A / ${selectedRetensiInaktif.value}I`
    : ''
);

const onKlasifikasiChange = () => {
  const k = klasifikasiList.value.find((item: any) => item.klasifikasi === form.klasifikasi);
  selectedRetensiAktif.value = k?.retensi_aktif_tahun || 0;
  selectedRetensiInaktif.value = k?.retensi_inaktif_tahun || 0;
};

const onFotoChange = (e: Event) => {
  form.foto_lokasi_fisik = (e.target as HTMLInputElement).files?.[0] || null;
};

const prefill = () => {
  const b = berkas.value;
  if (!b) return;
  form.klasifikasi = b.klasifikasi || '';
  form.judul_berkas = b.judulBerkas || '';
  form.kategori_berkas = b.kategoriBerkas || '';
  form.lokasi = b.lokasi || '';
  form.isi_ringkas = b.isiRingkas || '';
  existingFoto.value = b.fotoLokasiFisik || '';
  selectedRetensiAktif.value = b.retensiAktifTahun || 0;
  selectedRetensiInaktif.value = b.retensiInaktifTahun || 0;
};

const handleSubmit = async () => {
  if (!canEdit.value) return;
  errors.klasifikasi = !form.klasifikasi;
  errors.judul_berkas = !form.judul_berkas;
  errors.lokasi = !form.lokasi;
  errors.isi_ringkas = !form.isi_ringkas;
  if (errors.klasifikasi || errors.judul_berkas || errors.lokasi || errors.isi_ringkas) return;

  isSubmitting.value = true;
  try {
    let fotoKey: string | undefined;
    if (form.foto_lokasi_fisik) {
      try {
        const res: any = await uploadBerkasFile(form.foto_lokasi_fisik);
        fotoKey = res?.data?.key ?? res?.key;
      } catch (e: any) {
        throw new Error(
          `Gagal upload foto lokasi: ${e?.response?.data?.message || e?.message || 'coba lagi'}`
        );
      }
    }

    const payload: Record<string, any> = {
      klasifikasi: form.klasifikasi,
      judul_berkas: form.judul_berkas,
      kategori_berkas: form.kategori_berkas || undefined,
      lokasi: form.lokasi,
      isi_ringkas: form.isi_ringkas,
    };
    if (fotoKey) payload.foto_lokasi_fisik = fotoKey;

    await updateBerkas(berkasId.value, payload);
    toast.add({ title: 'Perubahan berkas tersimpan', color: 'success' });
    router.push(detailPath.value);
  } catch (e: any) {
    const message = e?.response?.data?.message || e?.data?.message || e?.message;
    toast.add({
      title: 'Gagal menyimpan perubahan',
      description: Array.isArray(message) ? message.join(', ') : message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  try {
    const response: any = await getBerkasById(berkasId.value);
    berkas.value = response?.data ?? response;
    prefill();
    // Pastikan klasifikasi terpilih dapat retensi yang benar segera setelah list ter-load
    const data: any = await getKlasifikasiDenganRetensi();
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? []);
    onKlasifikasiChange();
  } catch (e: any) {
    toast.add({
      title: 'Gagal memuat data berkas',
      description: e?.data?.message || e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    isLoading.value = false;
  }
});
</script>
