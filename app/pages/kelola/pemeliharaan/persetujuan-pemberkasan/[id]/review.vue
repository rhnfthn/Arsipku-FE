<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        {
          label: 'Persetujuan Pemberkasan',
          to: '/kelola/pemeliharaan/persetujuan-pemberkasan',
        },
        { label: 'Review' },
      ]"
    >
      <template #title>
        <div class="flex flex-wrap items-center gap-3">
          <h1
            class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl"
          >
            Review Penutupan Berkas
          </h1>
          <span
            class="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
          >
            Ref: #{{ berkas?.kodeBerkas || berkasId.slice(0, 8).toUpperCase() }}
          </span>
        </div>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <main v-else class="mx-auto max-w-6xl space-y-5">
      <!-- Langkah Verifikasi -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Langkah Verifikasi</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Progress persetujuan penutupan berkas.
            </p>
          </div>
          <span
            class="ml-auto inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
          >
            {{ progressLabel }}
          </span>
        </div>
        <div class="overflow-x-auto px-5 py-5">
          <div class="flex min-w-[600px] items-center px-1 py-2">
            <template v-for="(step, index) in stepItems" :key="step.id">
              <div class="flex min-w-36 items-center gap-3">
                <div
                  class="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold"
                  :class="step.className"
                >
                  <UIcon v-if="step.status === 'approved'" name="i-lucide-check" class="size-5" />
                  <UIcon
                    v-else-if="step.status === 'closed'"
                    name="i-lucide-check-check"
                    class="size-5"
                  />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="text-sm font-semibold" :class="step.textClass">{{ step.label }}</span>
              </div>
              <div
                v-if="index < stepItems.length - 1"
                class="mx-4 h-0.5 min-w-12 flex-1 bg-gray-300 dark:bg-gray-600"
              />
            </template>
          </div>
        </div>
      </section>

      <!-- Informasi Berkas -->
      <section
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
              Metadata berkas yang diajukan untuk ditutup.
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
      </section>

      <!-- Lampiran Berkas (Foto & Dokumen Pendukung) -->
      <section
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
      </section>

      <!-- Daftar Naskah (Isi Berkas) -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-files" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Daftar Naskah</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ naskahTotal }} naskah dalam berkas ini.
            </p>
          </div>
        </div>
        <div class="overflow-x-auto p-5">
          <DataTable
            :columns="naskahColumns"
            :rows="naskahList"
            empty-message="Belum ada naskah dalam berkas ini."
          >
            <template #cell-nomorSurat="{ row }"
              ><span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{
                row.nomorSurat || '-'
              }}</span></template
            >
            <template #cell-perihal="{ row }"
              ><span class="text-sm text-gray-900 dark:text-white">{{
                row.perihal || '-'
              }}</span></template
            >
            <template #cell-naskahTipe="{ row }"
              ><span
                class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              >
                {{ naskahTipeLabel(row.naskahTipe) }}
              </span></template
            >
            <template #cell-tanggalNaskah="{ row }"
              ><span class="text-sm text-gray-600 dark:text-gray-400">{{
                formatDate(row.tanggalNaskah)
              }}</span></template
            >
            <template #cell-status
              ><span
                class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400"
              >
                <span class="size-1.5 rounded-full bg-success-500" /> Final
              </span></template
            >
          </DataTable>
        </div>
      </section>

      <!-- Uraian / Catatan Pengusul -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
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
            <h2 class="font-semibold text-gray-900 dark:text-white">Uraian & Catatan Pengusul</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Catatan pengusul saat mengajukan penutupan berkas.
            </p>
          </div>
        </div>
        <div class="px-5 py-4">
          <p
            class="whitespace-pre-wrap border-l-2 border-primary-300 pl-4 text-sm leading-6 text-gray-600 dark:border-primary-700 dark:text-gray-300"
          >
            {{ berkas?.catatanPenutupan || 'Tidak ada catatan pengusul.' }}
          </p>
        </div>
      </section>

      <!-- Timeline Singkat -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-history" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Timeline Singkat</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Ringkasan waktu penting berkas.
            </p>
          </div>
        </div>
        <ol class="space-y-4 px-5 py-5">
          <li v-for="item in timelineItems" :key="item.label" class="flex items-start gap-3">
            <span class="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary-500" />
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.label }}</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.value }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- Aksi Verifikasi -->
      <section
        v-if="!isLoading && !verifikasiSelesai"
        class="overflow-hidden rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
            >
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Aksi Verifikasi</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{
                  isLastVerifikator
                    ? 'Setujui untuk menutup berkas, atau tolak pengajuan ini.'
                    : 'Setujui untuk meneruskan ke verifikator berikutnya, atau tolak.'
                }}
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <UButton
              class="w-full sm:w-auto"
              color="error"
              variant="outline"
              size="lg"
              icon="i-lucide-circle-x"
              :loading="isProcessing"
              @click="openReject"
              >Tolak Penutupan</UButton
            >
            <UButton
              class="w-full sm:w-auto"
              color="primary"
              size="lg"
              icon="i-lucide-arrow-right"
              :loading="isProcessing"
              @click="openApprove"
              >{{ isLastVerifikator ? 'Setujui Penutupan' : 'Lanjutkan Verifikasi' }}</UButton
            >
          </div>
        </div>
      </section>

      <!-- Verifikasi Selesai (tidak ada langkah pending) -->
      <section
        v-else-if="!isLoading && verifikasiSelesai"
        class="overflow-hidden rounded-xl border border-success-100 bg-gradient-to-br from-success-50 to-white p-5 shadow-sm dark:border-success-900/40 dark:from-success-900/20 dark:to-gray-800"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400"
            >
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Verifikasi Selesai</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Pengajuan penutupan berkas ini sudah selesai diproses. Tidak ada aksi lain
                diperlukan.
              </p>
            </div>
          </div>
          <UButton
            class="w-full sm:w-auto"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-lucide-arrow-left"
            to="/kelola/pemeliharaan/persetujuan-pemberkasan"
            >Kembali ke Daftar Persetujuan</UButton
          >
        </div>
      </section>
    </main>

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

    <UModal v-model:open="showApproveModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400"
          >
            <UIcon name="i-lucide-circle-check" class="size-5" />
          </span>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Konfirmasi Persetujuan
            </h3>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Tuliskan catatan persetujuan Anda.
            </p>
          </div>
        </div>
      </template>
      <template #body>
        <div class="space-y-4 p-4">
          <div
            class="flex items-start gap-2.5 rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-800 dark:border-success-900/40 dark:bg-success-900/20 dark:text-success-300"
          >
            <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
            <span>{{
              isLastVerifikator
                ? 'Anda akan menyetujui penutupan berkas ini. Berkas ditutup setelah seluruh verifikator menyetujui.'
                : 'Anda akan menyetujui verifikasi ini dan meneruskannya ke verifikator berikutnya.'
            }}</span>
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Catatan Persetujuan <span class="text-error-500">*</span>
            </label>
            <UTextarea
              v-model="approveCatatan"
              :rows="4"
              autoresize
              class="w-full"
              placeholder="Tuliskan catatan persetujuan (minimal 10 karakter)…"
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ approveCatatan.trim().length }}/10 karakter minimum
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="closeApprove">Batal</UButton>
          <UButton
            color="primary"
            icon="i-lucide-check"
            :disabled="approveCatatan.trim().length < 10"
            :loading="isProcessing"
            @click="handleApprove"
            >Ya, Setujui</UButton
          >
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showRejectModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-400"
          >
            <UIcon name="i-lucide-circle-x" class="size-5" />
          </span>
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tolak Penutupan</h3>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Tuliskan alasan penolakan Anda.
            </p>
          </div>
        </div>
      </template>
      <template #body>
        <div class="space-y-4 p-4">
          <div
            class="flex items-start gap-2.5 rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-800 dark:border-error-900/40 dark:bg-error-900/20 dark:text-error-300"
          >
            <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-4 shrink-0" />
            <span
              >Penolakan akan membatalkan pengajuan penutupan berkas ini. Berkas kembali ke status
              ditolak (dapat direvisi &amp; diajukan ulang).</span
            >
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alasan Penolakan <span class="text-error-500">*</span>
            </label>
            <UTextarea
              v-model="rejectCatatan"
              :rows="4"
              autoresize
              class="w-full"
              placeholder="Tuliskan alasan penolakan (minimal 10 karakter)…"
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ rejectCatatan.trim().length }}/10 karakter minimum
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="closeReject">Batal</UButton>
          <UButton
            color="error"
            icon="i-lucide-x"
            :disabled="rejectCatatan.trim().length < 10"
            :loading="isProcessing"
            @click="handleReject"
            >Tolak Penutupan</UButton
          >
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });
const route = useRoute();
const router = useRouter();
const {
  getBerkasById,
  getVerifikasiDetail,
  getDaftarNaskah,
  approveVerifikasi,
  rejectVerifikasi,
  fetchBerkasFileBlob,
} = useArsipDinamis();
const toast = useToast();
const berkasId = computed(() => route.params.id as string);
const berkas = ref<any>(null);
const verifikasiList = ref<any[]>([]);
const naskahList = ref<any[]>([]);
const naskahTotal = ref(0);
const isLoading = ref(true);
const isProcessing = ref(false);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const approveCatatan = ref('');
const rejectCatatan = ref('');
const openApprove = () => {
  showApproveModal.value = true;
};
const openReject = () => {
  showRejectModal.value = true;
};
const closeApprove = () => {
  showApproveModal.value = false;
};
const closeReject = () => {
  showRejectModal.value = false;
};

const pendingIndex = computed(() =>
  verifikasiList.value.findIndex((item) => item.status === 'pending')
);
const isLastVerifikator = computed(
  () =>
    pendingIndex.value >= 0 &&
    pendingIndex.value === verifikasiList.value.length - 1
);
const verifikasiSelesai = computed(() => pendingIndex.value < 0);
const progressLabel = computed(() =>
  pendingIndex.value < 0
    ? 'Verifikasi selesai'
    : `Verifikasi Tahap ${pendingIndex.value + 1} dari ${verifikasiList.value.length}`
);

const display = (value: any) =>
  value === null || value === undefined || value === '' ? '-' : String(value);

const metadata = computed(() => [
  { label: 'Nama Berkas', value: display(berkas.value?.judulBerkas), icon: 'i-lucide-folder-open' },
  { label: 'Kode Berkas', value: display(berkas.value?.kodeBerkas), icon: 'i-lucide-hash' },
  {
    label: 'Klasifikasi',
    value: display(berkas.value?.klasifikasiTeks || berkas.value?.klasifikasi),
    icon: 'i-lucide-tag',
  },
  {
    label: 'Penanggung Jawab',
    value: display(berkas.value?.picPersnum || berkas.value?.pic_persnum),
    icon: 'i-lucide-user-round',
  },
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
    label: 'Tindakan Akhir',
    value: display(berkas.value?.tindakanPenyusutanAkhir),
    icon: 'i-lucide-scale',
  },
  {
    label: 'Jumlah Naskah',
    value: `${naskahTotal.value} Dokumen`,
    icon: 'i-lucide-file-text',
  },
  {
    label: 'Tanggal Dibuat',
    value: formatDate(berkas.value?.tanggalDibuat),
    icon: 'i-lucide-calendar-plus',
  },
]);

const naskahTipeLabel = (t?: string) => {
  const map: Record<string, string> = {
    ND: 'Nota Dinas',
    SDI: 'Surat Dinas Internal',
    SDE: 'Surat Dinas Eksternal',
    DI: 'Disposisi',
    K: 'Konsep',
  };
  return map[String(t || '').toUpperCase()] || t || '-';
};

const naskahColumns = [
  { key: 'nomorSurat', label: 'No Naskah' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Jenis' },
  { key: 'tanggalNaskah', label: 'Tanggal' },
  { key: 'status', label: 'Status' },
];

const stepItems = computed(() => [
  ...verifikasiList.value.map((item, index) => ({
    id: item.id || index,
    label: item.jabatanVerifikator || item.jabatan_verifikator || `Verifikator ${index + 1}`,
    status: item.status,
    className:
      item.status === 'approved'
        ? 'bg-success-500 text-white'
        : item.status === 'pending'
          ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/50'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700',
    textClass:
      item.status === 'approved'
        ? 'text-success-600'
        : item.status === 'pending'
          ? 'text-primary-700 dark:text-primary-300'
          : 'text-gray-500',
  })),
  {
    id: 'closed',
    label: 'Penutupan',
    status: 'closed',
    className:
      pendingIndex.value < 0
        ? 'bg-success-500 text-white'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-700',
    textClass: pendingIndex.value < 0 ? 'text-success-600' : 'text-gray-500',
  },
]);

const timelineItems = computed(() => {
  const items = [{ label: 'Berkas Dibuat', value: formatDate(berkas.value?.tanggalDibuat) }];
  const latestNaskah = naskahList.value
    .map((n: any) => n.tanggalNaskah)
    .filter(Boolean)
    .sort()
    .pop();
  if (latestNaskah)
    items.push({ label: 'Dokumen Terakhir Ditambahkan', value: formatDate(latestNaskah) });
  const pengajuanAt = verifikasiList.value[0]?.createdAt;
  if (pengajuanAt) items.push({ label: 'Pengajuan Penutupan', value: formatDateTime(pengajuanAt) });
  return items;
});

const unwrap = (response: any) =>
  response?.data?.data ? response.data : (response?.data ?? response);
const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

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

const handleApprove = async () => {
  const catatan = approveCatatan.value.trim();
  if (catatan.length < 10) return;

  isProcessing.value = true;
  try {
    await approveVerifikasi(berkasId.value, catatan);
    toast.add({ title: 'Verifikasi berhasil disetujui', color: 'success' });
    router.push('/kelola/pemeliharaan/persetujuan-pemberkasan');
  } catch (e: any) {
    toast.add({ title: e?.data?.message || e?.message || 'Gagal menyetujui', color: 'error' });
  } finally {
    isProcessing.value = false;
    showApproveModal.value = false;
  }
};

const handleReject = async () => {
  if (rejectCatatan.value.length < 10) return;
  isProcessing.value = true;
  try {
    await rejectVerifikasi(berkasId.value, rejectCatatan.value);
    toast.add({ title: 'Penutupan ditolak', color: 'warning' });
    router.push('/kelola/pemeliharaan/persetujuan-pemberkasan');
  } catch (e: any) {
    toast.add({ title: e?.data?.message || e?.message || 'Gagal menolak', color: 'error' });
  } finally {
    isProcessing.value = false;
    showRejectModal.value = false;
  }
};

onMounted(async () => {
  try {
    const [b, v, n] = await Promise.all([
      getBerkasById(berkasId.value),
      getVerifikasiDetail(berkasId.value),
      getDaftarNaskah(berkasId.value, { page: 1, limit: 100 }),
    ]);
    berkas.value = unwrap(b);
    const verificationPayload = unwrap(v);
    verifikasiList.value = Array.isArray(verificationPayload) ? verificationPayload : [];
    const naskahPayload = unwrap(n);
    const naskahRows = Array.isArray(naskahPayload) ? naskahPayload : naskahPayload?.data || [];
    naskahList.value = naskahRows.map((item: any) => ({
      ...item,
      nomorSurat: item.nomorSurat ?? item.nomor_surat,
      tanggalNaskah: item.tanggalNaskah ?? item.tanggal_naskah,
      naskahTipe: item.naskahTipe ?? item.naskah_tipe,
    }));
    naskahTotal.value = Number(naskahPayload?.meta?.total ?? naskahRows.length);
    // Muat lampiran (foto lokasi & dokumen pendukung) secara non-blocking
    loadBerkasFiles();
  } catch (e: any) {
    toast.add({
      title: 'Gagal memuat data review',
      description: e?.data?.message || e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  revokeBerkasFiles();
});
</script>
