<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="`Penutupan Berkas${berkas?.judulBerkas ? `: ${berkas.judulBerkas}` : ''}`"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: '/kelola/pemeliharaan/pemberkasan/berkas-saya' },
        { label: 'Penutupan' },
      ]"
    />

    <div v-if="isLoading" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <template v-else>
      <!-- Back & status -->
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <UButton color="primary" variant="soft" icon="i-lucide-arrow-left" :to="detailPath">
          Kembali ke Detail
        </UButton>
        <UBadge
          v-if="berkas?.status"
          :color="berkas.status === 'aktif' ? 'warning' : berkas.status === 'ditolak' ? 'error' : 'neutral'"
          variant="soft"
          size="lg"
          class="gap-1.5 rounded-full"
        >
          <UIcon :name="berkas.status === 'ditolak' ? 'i-lucide-alert-triangle' : 'i-lucide-info'" class="size-4" />{{ statusLabel }}
        </UBadge>
      </div>

      <!-- Alur berurutan: Informasi → Lampiran → Verifikasi → Catatan → Ajukan -->
      <div class="space-y-5">
        <!-- Informasi Berkas -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
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
                Detail metadata berkas yang akan ditutup.
              </p>
            </div>
          </div>
          <dl class="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
            <div v-for="item in metadata" :key="item.label" class="flex items-start gap-3">
              <span
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
              >
                <UIcon :name="item.icon" class="size-4" />
              </span>
              <div class="min-w-0">
                <dt
                  class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {{ item.label }}
                </dt>
                <dd
                  class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white"
                  :title="item.value"
                >
                  {{ item.value }}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <!-- Lampiran Berkas (Foto & Dokumen Pendukung) -->
        <div
          v-if="berkas?.fotoLokasiFisik || berkas?.dokumenPendukung"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
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
                Foto lokasi fisik & dokumen pendukung.
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-5 px-5 py-5 sm:grid-cols-2">
            <!-- Foto Lokasi Fisik -->
            <div>
              <p
                class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Foto Lokasi Fisik
              </p>
              <div
                v-if="fotoLoading"
                class="flex aspect-video items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/50"
              >
                <span class="text-xs text-gray-400">Memuat foto…</span>
              </div>
              <button
                v-else-if="fotoObjectUrl"
                type="button"
                class="group relative block w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                @click="openLightbox"
              >
                <img
                  :src="fotoObjectUrl"
                  alt="Foto lokasi fisik"
                  class="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                <span
                  class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <UIcon name="i-lucide-eye" class="size-3.5" /> Klik untuk perbesar
                </span>
              </button>
              <div
                v-else
                class="flex aspect-video items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center dark:border-gray-700 dark:bg-gray-700/30"
              >
                <span class="text-xs text-gray-400">{{
                  fotoError ? 'File tidak tersedia' : 'Belum ada foto'
                }}</span>
              </div>
            </div>

            <!-- Dokumen Pendukung -->
            <div>
              <p
                class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Dokumen Pendukung
              </p>
              <div
                v-if="dokumenLoading"
                class="flex aspect-video items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/50"
              >
                <span class="text-xs text-gray-400">Memuat dokumen…</span>
              </div>
              <div
                v-else-if="dokumenObjectUrl"
                class="flex aspect-video flex-col justify-between gap-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-700 dark:from-gray-700/30 dark:to-gray-800"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    :class="dokumenTypeIcon.bg"
                  >
                    <UIcon :name="dokumenTypeIcon.iconName" class="size-6" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span
                        class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        :class="dokumenTypeIcon.badge"
                        >{{ dokumenTypeIcon.label }}</span
                      >
                      <span v-if="dokumenSize" class="text-xs text-gray-500 dark:text-gray-400">{{
                        dokumenSize
                      }}</span>
                    </div>
                    <p
                      class="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white"
                      :title="dokumenFileName"
                    >
                      {{ dokumenFileName }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Dokumen pendukung berkas
                    </p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="xs"
                    icon="i-lucide-eye"
                    class="flex-1 justify-center"
                    @click="openDokumen"
                    >Lihat</UButton
                  >
                  <UButton
                    color="primary"
                    variant="soft"
                    size="xs"
                    icon="i-lucide-download"
                    class="flex-1 justify-center"
                    @click="downloadDokumen"
                    >Unduh</UButton
                  >
                </div>
              </div>
              <div
                v-else
                class="flex aspect-video items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center dark:border-gray-700 dark:bg-gray-700/30"
              >
                <span class="text-xs text-gray-400">{{
                  dokumenError ? 'File tidak tersedia' : 'Belum ada dokumen'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lightbox foto -->
        <UModal
          v-model:open="lightboxOpen"
          :ui="{ content: 'max-w-4xl', overlay: 'bg-black/80 backdrop-blur-sm' }"
        >
          <template #body>
            <div class="flex items-center justify-center bg-black p-2">
              <img
                v-if="fotoObjectUrl"
                :src="fotoObjectUrl"
                alt="Foto lokasi fisik"
                class="max-h-[80vh] w-full rounded-lg object-contain"
              />
            </div>
          </template>
        </UModal>

        <!-- Alur Verifikasi -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <UIcon
                  name="i-lucide-users"
                  class="size-5 text-primary-600 dark:text-primary-400"
                />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Alur Verifikasi</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Tentukan pihak yang memverifikasi.
                </p>
              </div>
            </div>
            <UButton
              v-if="verifikatorList.length < 3"
              icon="i-lucide-user-round-plus"
              variant="outline"
              size="xs"
              @click="addVerifikator"
              >Tambah</UButton
            >
          </div>
          <div class="px-5 py-5">
            <div v-for="(v, idx) in verifikatorList" :key="idx" class="relative pb-5 last:pb-0">
              <div
                v-if="idx < verifikatorList.length - 1"
                class="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-primary-200 dark:bg-primary-900/40"
              />
              <div class="relative flex gap-3">
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white shadow-sm"
                >
                  {{ idx + 1 }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ stepLabel(idx) }}
                    </p>
                    <UButton
                      v-if="idx > 0"
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      aria-label="Hapus verifikator"
                      @click="removeVerifikator(idx)"
                    />
                  </div>
                  <USelectMenu
                    v-model="v.verifikator_persnum"
                    :items="optionsFor(idx)"
                    value-key="value"
                    label-key="label"
                    searchable
                    searchable-placeholder="Cari nama, jabatan, atau persnum..."
                    placeholder="Pilih verifikator..."
                    class="w-full"
                    :disabled="!verifikatorOptions.length"
                    @update:model-value="syncVerifikator(idx)"
                  >
                    <template #item="{ item, selected }: any">
                      <div
                        class="flex min-w-0 items-start gap-2 py-1"
                        :class="item.disabled && 'cursor-not-allowed opacity-40'"
                      >
                        <UIcon
                          name="i-lucide-user-circle-2"
                          class="mt-0.5 size-5 shrink-0 text-gray-400"
                        />
                        <div class="min-w-0 flex-1">
                          <p
                            class="truncate text-sm"
                            :class="[
                              selected && 'font-semibold text-primary-600',
                              item.disabled && 'line-through',
                            ]"
                          >
                            {{ item.label }}
                          </p>
                          <p class="truncate text-xs text-gray-500">
                            {{ item.disabled ? 'Sudah dipilih' : item.positionText || 'Tanpa jabatan' }}
                          </p>
                        </div>
                        <UIcon
                          v-if="selected"
                          name="i-lucide-check"
                          class="size-4 shrink-0 text-primary-500"
                        />
                      </div>
                    </template>
                  </USelectMenu>
                  <p
                    v-if="v.jabatan_verifikator"
                    class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ v.jabatan_verifikator }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Catatan Penutupan -->
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
            >
              <UIcon
                name="i-lucide-message-square"
                class="size-5 text-primary-600 dark:text-primary-400"
              />
            </span>
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Catatan Penutupan</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Diteruskan kepada seluruh verifikator.
              </p>
            </div>
          </div>
          <div class="px-5 py-4">
            <UTextarea
              v-model="catatan"
              :rows="7"
              autoresize
              class="w-full"
              placeholder="Tambahkan alasan penutupan atau catatan penting lainnya di sini..."
            />
          </div>
        </div>

        <!-- Aksi (red zone) -->
        <div
          class="overflow-hidden rounded-xl border border-error-200 bg-gradient-to-br from-error-50 to-white p-5 shadow-sm dark:border-error-900/40 dark:from-error-900/20 dark:to-gray-800"
        >
          <div class="mb-4">
            <h3 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <UIcon
                name="i-lucide-alert-triangle"
                class="size-5 text-error-600 dark:text-error-400"
              />
              Ajukan Penutupan Berkas
            </h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Berkas akan diajukan untuk ditutup dan diverifikasi oleh
              {{ verifikatorList.length }} verifikator.
            </p>
          </div>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <UButton
              class="w-full sm:w-auto"
              size="lg"
              color="error"
              icon="i-lucide-alert-triangle"
              :disabled="!canSubmit"
              @click="openConfirm"
              >Ajukan Penutupan</UButton
            >
          </div>
          <p
            v-if="!canSubmit && ['aktif', 'ditolak'].includes(berkas?.status)"
            class="mt-3 text-center text-xs text-amber-600 dark:text-amber-400"
          >
            Pilih minimal satu verifikator yang berbeda.
          </p>
          <p
            v-else-if="berkas?.status === 'menunggu_verifikasi'"
            class="mt-3 text-center text-xs text-gray-500 dark:text-gray-400"
          >
            Berkas sudah diajukan dan sedang diverifikasi.
          </p>
        </div>

        <!-- Konfirmasi penutupan -->
        <ConfirmModal
          v-model="showConfirm"
          variant="danger"
          title="Ajukan Penutupan Berkas?"
          confirm-text="Ya, Ajukan"
          cancel-text="Batal"
          :loading="isSubmitting"
          @confirm="handleSubmit"
        >
          <template #description>
            Yakin ajukan penutupan berkas ini? Berkas akan diverifikasi oleh
            {{ verifikatorList.length }} verifikator dan tidak dapat diedit lagi setelah diajukan.
          </template>
        </ConfirmModal>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { getBerkasById, ajukanTutupBerkas, getDaftarNaskah, fetchBerkasFileBlob } =
  useArsipDinamis();
const { apiGet } = useApi();
const { user, getProfile } = useAuth();
const toast = useToast();

const berkasId = computed(() => route.params.id as string);
const detailPath = computed(() => `/kelola/pemeliharaan/pemberkasan/${berkasId.value}`);
const berkas = ref<any>(null);
const naskahTotal = ref(0);
const catatan = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);
const showConfirm = ref(false);
const openConfirm = () => {
  showConfirm.value = true;
};
const verifikatorOptions = ref<any[]>([]);
const verifikatorList = ref([
  { verifikator_persnum: '', verifikator_position_id: null, jabatan_verifikator: '' },
]);

const selectedPersnums = computed(() =>
  verifikatorList.value.map((v) => v.verifikator_persnum).filter(Boolean)
);
const canSubmit = computed(
  () =>
    ['aktif', 'ditolak'].includes(berkas.value?.status) &&
    verifikatorList.value.every((v) => v.verifikator_persnum) &&
    new Set(selectedPersnums.value).size === selectedPersnums.value.length
);
const statusLabel = computed(() => {
  const map: Record<string, string> = {
    aktif: 'Siap Ditutup',
    menunggu_verifikasi: 'Sedang Diverifikasi',
    ditolak: 'Ditolak — Silakan Revisi',
  };
  return map[berkas.value?.status] || 'Penutupan Berkas';
});
const display = (value: any) =>
  value === null || value === undefined || value === '' ? '-' : String(value);

const metadata = computed(() => [
  { label: 'Nama Berkas', value: display(berkas.value?.judulBerkas), icon: 'i-lucide-folder-open' },
  { label: 'Kode Berkas', value: display(berkas.value?.kodeBerkas), icon: 'i-lucide-hash' },
  {
    label: 'Retensi Aktif',
    value: `${berkas.value?.retensiAktifTahun || 0} Tahun`,
    icon: 'i-lucide-clock',
  },
  {
    label: 'Retensi Inaktif',
    value: `${berkas.value?.retensiInaktifTahun || 0} Tahun`,
    icon: 'i-lucide-archive',
  },
  { label: 'Lokasi Fisik', value: display(berkas.value?.lokasi), icon: 'i-lucide-map-pin' },
  {
    label: 'Jumlah Naskah',
    value: `${naskahTotal.value} Dokumen`,
    icon: 'i-lucide-file-text',
  },
]);
const stepLabel = (idx: number) =>
  verifikatorList.value.length > 1 ? `Verifikator ${idx + 1}` : 'Verifikator';

const optionsFor = (idx: number) => {
  const current = verifikatorList.value[idx]?.verifikator_persnum;
  const selectedElsewhere = new Set(
    verifikatorList.value
      .filter((_, i) => i !== idx)
      .map((v) => v.verifikator_persnum)
      .filter(Boolean)
  );
  return verifikatorOptions.value.map((o) => ({
    ...o,
    // Pilihan yang sudah dipakai di baris lain di-disable (tetap tampil, tak bisa double-pick).
    disabled: o.value !== current && selectedElsewhere.has(o.value),
  }));
};
const syncVerifikator = (idx: number) => {
  const selected = verifikatorOptions.value.find(
    (o) => o.value === verifikatorList.value[idx].verifikator_persnum
  );
  verifikatorList.value[idx].verifikator_position_id = selected?.positionId;
  verifikatorList.value[idx].jabatan_verifikator = selected?.positionText || '';
};
const addVerifikator = () => {
  if (verifikatorList.value.length < 3)
    verifikatorList.value.push({
      verifikator_persnum: '',
      verifikator_position_id: null,
      jabatan_verifikator: '',
    });
};
const removeVerifikator = (idx: number) => {
  verifikatorList.value.splice(idx, 1);
};

// ── Lampiran berkas (foto lokasi fisik & dokumen pendukung) ──
const fotoObjectUrl = ref('');
const fotoError = ref(false);
const fotoLoading = ref(false);
const dokumenObjectUrl = ref('');
const dokumenError = ref(false);
const dokumenLoading = ref(false);
const lightboxOpen = ref(false);
const dokumenSize = ref('');
const dokumenFileName = computed(
  () => berkas.value?.dokumenPendukung?.split('/').pop() || 'dokumen-pendukung'
);
const isHttpUrl = (v?: string) => !!v && /^https?:\/\//i.test(v);
function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
const dokumenTypeIcon = computed(() => {
  const ext = (berkas.value?.dokumenPendukung || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf')
    return {
      iconName: 'i-lucide-file-text',
      label: 'PDF',
      bg: 'bg-error-500',
      badge: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-400',
    };
  if (ext === 'docx' || ext === 'doc')
    return {
      iconName: 'i-lucide-file-text',
      label: ext === 'docx' ? 'DOCX' : 'DOC',
      bg: 'bg-primary-500',
      badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400',
    };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext))
    return {
      iconName: 'i-lucide-image',
      label: ext.toUpperCase(),
      bg: 'bg-success-500',
      badge: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400',
    };
  return {
    iconName: 'i-lucide-file',
    label: ext ? ext.toUpperCase() : 'FILE',
    bg: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
});
async function loadBerkasFiles() {
  if (!berkas.value) return;
  if (fotoObjectUrl.value) URL.revokeObjectURL(fotoObjectUrl.value);
  if (dokumenObjectUrl.value) URL.revokeObjectURL(dokumenObjectUrl.value);
  fotoObjectUrl.value = '';
  dokumenObjectUrl.value = '';
  fotoError.value = false;
  dokumenError.value = false;
  dokumenSize.value = '';
  const fotoKey = berkas.value.fotoLokasiFisik;
  const dokKey = berkas.value.dokumenPendukung;
  const tasks: Promise<void>[] = [];
  if (fotoKey) {
    tasks.push(
      (async () => {
        if (isHttpUrl(fotoKey)) {
          fotoObjectUrl.value = fotoKey;
          return;
        }
        fotoLoading.value = true;
        try {
          const blob = await fetchBerkasFileBlob(fotoKey);
          fotoObjectUrl.value = URL.createObjectURL(blob);
        } catch {
          fotoError.value = true;
        } finally {
          fotoLoading.value = false;
        }
      })()
    );
  }
  if (dokKey) {
    tasks.push(
      (async () => {
        if (isHttpUrl(dokKey)) {
          dokumenObjectUrl.value = dokKey;
          return;
        }
        dokumenLoading.value = true;
        try {
          const blob = await fetchBerkasFileBlob(dokKey);
          dokumenObjectUrl.value = URL.createObjectURL(blob);
          dokumenSize.value = formatFileSize(blob.size);
        } catch {
          dokumenError.value = true;
        } finally {
          dokumenLoading.value = false;
        }
      })()
    );
  }
  await Promise.all(tasks);
}
function revokeBerkasFiles() {
  if (fotoObjectUrl.value) {
    URL.revokeObjectURL(fotoObjectUrl.value);
    fotoObjectUrl.value = '';
  }
  if (dokumenObjectUrl.value) {
    URL.revokeObjectURL(dokumenObjectUrl.value);
    dokumenObjectUrl.value = '';
  }
}
const openLightbox = () => {
  lightboxOpen.value = true;
};
function openDokumen() {
  if (dokumenObjectUrl.value) window.open(dokumenObjectUrl.value, '_blank');
}
function downloadDokumen() {
  if (!dokumenObjectUrl.value) return;
  const a = document.createElement('a');
  a.href = dokumenObjectUrl.value;
  a.download = dokumenFileName.value;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const handleSubmit = async () => {
  if (!canSubmit.value) return;
  isSubmitting.value = true;
  try {
    await ajukanTutupBerkas(berkasId.value, {
      verifikator: verifikatorList.value,
      catatan: catatan.value,
    });
    toast.add({ title: 'Pengajuan penutupan berhasil dikirim', color: 'success' });
    router.push(detailPath.value);
  } catch (e: any) {
    const message = e?.response?.data?.message || e?.data?.message || e?.message;
    toast.add({
      title: 'Gagal mengajukan penutupan',
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
    // Hitung jumlah naskah aktual dari BE (entitas berkas tidak menyimpan count)
    try {
      const naskahRes: any = await getDaftarNaskah(berkasId.value, { page: 1, limit: 1 });
      const nPayload = naskahRes?.data ?? naskahRes;
      naskahTotal.value = Number(nPayload?.meta?.total ?? nPayload?.total ?? 0);
    } catch {
      naskahTotal.value = 0;
    }

    // Verifikator hanya boleh atasan managerial pengaju (rantai parent strict:
    // AVP/VP/EVP/Direktur di garis pelaporan) — GET /org-data/atasan-managerial/:positionId
    if (!user.value) await getProfile();
    const positionId = Number(user.value?.position);
    const atasanRes: any = await apiGet(`/org-data/atasan-managerial/${positionId}`);
    const atasans: any[] = Array.isArray(atasanRes?.data) ? atasanRes.data : [];
    verifikatorOptions.value = atasans.map((r: any) => ({
      label: `${r.persnum_person_text || 'Tanpa nama'} — ${
        r.position_text || 'Tanpa jabatan'
      } (${r.persnum_person})`,
      value: String(r.persnum_person),
      positionId: Number(r.position) || undefined,
      positionText: r.position_text || '',
    }));

    // Muat lampiran (foto lokasi & dokumen pendukung) secara non-blocking
    loadBerkasFiles();
  } catch (e) {
    console.error('Gagal memuat data:', e);
    toast.add({ title: 'Gagal memuat data penutupan', color: 'error' });
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  revokeBerkasFiles();
});
</script>
