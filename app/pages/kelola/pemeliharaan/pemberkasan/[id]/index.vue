<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="berkas?.judulBerkas || 'Detail Berkas'"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: backPath },
        { label: 'Detail Berkas' },
      ]"
    />

    <div v-if="pending" class="space-y-5" aria-busy="true">
      <div class="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div class="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-error-200 bg-white px-6 py-16 text-center shadow-sm dark:border-error-900/50 dark:bg-gray-800"
    >
      <div
        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/30"
      >
        <CircleAlert class="h-7 w-7 text-error-500" />
      </div>
      <h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Detail berkas tidak dapat dimuat
      </h2>
      <p class="mx-auto mt-1 max-w-lg text-sm text-gray-500 dark:text-gray-400">{{ loadError }}</p>
      <div class="mt-5 flex justify-center gap-2">
        <UButton variant="outline" icon="i-lucide-arrow-left" :to="backPath">Kembali</UButton>
        <UButton color="primary" icon="i-lucide-refresh-cw" @click="loadPage">Coba Lagi</UButton>
      </div>
    </div>

    <template v-else-if="berkas">
      <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <StatusBadge v-if="berkas?.status" :status="berkas.status" />
        <div class="flex flex-wrap justify-end gap-2">
          <UButton color="primary" variant="soft" icon="i-lucide-arrow-left" :to="backPath">
            Kembali
          </UButton>
          <UButton color="primary" variant="soft" icon="i-lucide-printer" @click="printPage">
            Cetak
          </UButton>
          <UButton
            v-if="canEdit"
            color="primary"
            variant="soft"
            icon="i-lucide-pencil"
            :to="`${detailPath}/edit`"
          >
            Edit Berkas
          </UButton>
          <UButton
            v-if="canClose"
            color="primary"
            icon="i-lucide-lock-keyhole"
            :to="`${detailPath}/tutup`"
          >
            Ajukan Penutupan
          </UButton>
          <UButton
            v-if="canDelete"
            color="error"
            variant="outline"
            icon="i-lucide-trash-2"
            @click="showDeleteModal = true"
          >
            Hapus
          </UButton>
        </div>
      </div>

      <!-- Keterangan: berkas ditolak, perlu direvisi sebelum diajukan ulang -->
      <div
        v-if="berkas?.status === 'ditolak' && !ditolakBannerDismissed"
        class="relative mt-5 overflow-hidden rounded-xl border border-error-200 bg-error-50/60 dark:border-error-900/40 dark:bg-error-900/10"
      >
        <button
          type="button"
          class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Tutup keterangan"
          @click="ditolakBannerDismissed = true"
        >
          <UIcon name="i-lucide-x" class="size-4" />
        </button>
        <div class="flex items-start gap-3 p-5">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-100 text-error-600 dark:bg-error-900/40 dark:text-error-400"
          >
            <UIcon name="i-lucide-alert-triangle" class="size-5" />
          </span>
          <div class="min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Verifikasi Ditolak Managerial — Perlu Revisi
            </h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Verifikasi penutupan berkas ini ditolak manager. Revisi metadata dan/atau daftar
              naskah, lalu ajukan ulang penutupan.
            </p>
            <div
              v-if="alasanPenolakan"
              class="mt-2.5 flex gap-2 rounded-md bg-white/70 px-3 py-2 dark:bg-gray-800/40"
            >
              <UIcon name="i-lucide-quote" class="size-3.5 shrink-0 text-gray-400" />
              <div class="min-w-0">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ alasanPenolakan.jabatan }}
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-300">
                  {{ alasanPenolakan.catatan || '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="card in quickInfoCards"
          :key="card.label"
          class="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400"
            >
              <component :is="card.icon" class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p
                class="truncate text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {{ card.label }}
              </p>
              <p
                class="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white"
                :title="card.value"
              >
                {{ card.value }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 print:hidden">
        <div
          class="overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <nav class="flex gap-1" aria-label="Bagian detail berkas">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              type="button"
              class="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all"
              :class="
                activeTab === tab.value
                  ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
              "
              @click="activeTab = tab.value"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
              <span
                v-if="tab.value === 'naskah'"
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="
                  activeTab === tab.value
                    ? 'bg-primary-200 text-primary-800 dark:bg-primary-700 dark:text-primary-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                "
                >{{ naskahTotal }}</span
              >
            </button>
          </nav>
        </div>
      </div>

      <section v-if="activeTab === 'overview'" class="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div class="space-y-5 xl:col-span-2">
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <FolderSearch class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Berkas</h2>
            </div>
            <dl class="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
              <div
                v-for="item in metadataList"
                :key="item.label"
                class="flex items-start gap-3 border-b border-gray-100 py-4 last:border-0 dark:border-gray-700"
              >
                <span
                  class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                >
                  <component :is="item.icon" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt
                    class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {{ item.label }}
                  </dt>
                  <dd
                    class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {{ item.value }}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <AlignLeft class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <h2 class="font-semibold text-gray-900 dark:text-white">Uraian Berkas</h2>
            </div>
            <div class="px-5 py-4">
              <p
                class="whitespace-pre-line border-l-2 border-primary-300 pl-4 text-sm leading-6 text-gray-600 dark:border-primary-700 dark:text-gray-300"
              >
                {{ berkas.isiRingkas || 'Belum ada uraian berkas.' }}
              </p>
            </div>
          </div>

          <!-- Foto Lokasi Fisik -->
          <div
            v-if="berkas.fotoLokasiFisik"
            class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <ImageIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                Foto Lokasi Fisik
              </h2>
            </div>
            <div class="grid grid-cols-1 gap-5 px-5 py-5">
              <!-- Foto Lokasi Fisik -->
              <div>
                <p
                  class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Foto Lokasi Fisik
                </p>
                <div
                  v-if="fotoLoading"
                  class="flex aspect-video max-w-sm items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/50"
                >
                  <span class="text-xs text-gray-400">Memuat foto…</span>
                </div>
                <button
                  v-else-if="fotoObjectUrl"
                  type="button"
                  class="group relative block aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  @click="lightboxOpen = true"
                >
                  <img
                    :src="fotoObjectUrl"
                    alt="Foto lokasi fisik"
                    class="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  <span
                    class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Eye class="h-3.5 w-3.5" /> Klik untuk perbesar
                  </span>
                </button>
                <div
                  v-else
                  class="flex aspect-video max-w-sm items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center dark:border-gray-700 dark:bg-gray-700/30"
                >
                  <span class="text-xs text-gray-400">{{
                    fotoError ? 'File tidak tersedia' : 'Belum ada foto'
                  }}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <aside class="space-y-5">
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <Clock3 class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <h2 class="font-semibold text-gray-900 dark:text-white">Jadwal Retensi Arsip</h2>
            </div>
            <div class="px-5 py-5">
              <ol class="space-y-6">
                <li v-for="item in retentionTimeline" :key="item.label" class="flex gap-3.5">
                  <div class="flex flex-col items-center">
                    <span
                      class="flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800"
                      :class="item.dotClass"
                    >
                      <component :is="item.icon" class="h-4 w-4 text-white" />
                    </span>
                    <span
                      v-if="!item.last"
                      class="mt-1 h-full min-h-8 w-0.5 bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                  <div class="-mt-0.5 pb-1">
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ item.label }}
                    </p>
                    <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                      {{ item.value }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.helper }}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
          <div
            class="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 dark:border-primary-900/50 dark:from-primary-900/20 dark:to-gray-800"
          >
            <div class="flex gap-3">
              <Info class="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <h3 class="text-sm font-semibold text-primary-800 dark:text-primary-300">
                  Dasar perhitungan retensi
                </h3>
                <p class="mt-1 text-xs leading-5 text-primary-700 dark:text-primary-400">
                  {{ berkas.hitungWaktuRetensiDari || 'Belum ditentukan' }} dengan nasib akhir
                  <strong>{{ berkas.tindakanPenyusutanAkhir || 'belum ditentukan' }}</strong
                  >.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section v-else-if="activeTab === 'naskah'" class="mt-5">
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <FileText class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  Daftar Naskah
                  <span
                    class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >{{ naskahTotal }}</span
                  >
                </h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Naskah yang telah dikelompokkan ke dalam berkas ini.
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <UInput
                v-model="naskahSearch"
                icon="i-lucide-search"
                placeholder="Cari nomor atau perihal…"
                class="sm:w-72"
              />
              <UButton
                color="primary"
                icon="i-lucide-download"
                :loading="isExporting"
                class="shadow-sm"
                :ui="{ label: 'font-semibold' }"
                @click="openExport('daftar')"
                >Export</UButton
              >
              <UButton
                v-if="canAddNaskah"
                color="primary"
                icon="i-lucide-file-plus-2"
                @click="openAddNaskahModal"
                >Tambah Naskah</UButton
              >
            </div>
          </div>
          <DataTable
            :columns="naskahColumns"
            :rows="naskahList"
            :loading="naskahPending"
            empty-message="Belum ada naskah dalam berkas ini."
          >
            <template #cell-nomorSurat="{ row }"
              ><div class="min-w-40">
                <p class="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                  {{ row.nomorSurat || '-' }}
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(row.tanggalNaskah) }}
                </p>
              </div></template
            >
            <template #cell-perihal="{ row }"
              ><p class="min-w-64 max-w-xl font-medium text-gray-800 dark:text-gray-200">
                {{ row.perihal || 'Tanpa perihal' }}
              </p></template
            >
            <template #cell-naskahTipe="{ row }"
              ><span
                class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                >{{ getNaskahTypeLabel(row.naskahTipe) }}</span
              ></template
            >
            <template #cell-sumber="{ row }"
              ><span
                class="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
                ><component :is="row.sumber === 'terkirim' ? Send : Inbox" class="h-3.5 w-3.5" />{{
                  getSourceLabel(row.sumber)
                }}</span
              ></template
            >
            <template #cell-status="{ row }"
              ><span
                v-if="row.status === 'inaktif'"
                class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >Inaktif</span
              ><span
                v-else
                class="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-900/30 dark:text-success-400"
                >Aktif</span
              ></template
            >
            <template #cell-aksi="{ row }">
              <div class="flex items-center justify-center gap-1">
                <button
                  type="button"
                  class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                  title="Lihat PDF naskah"
                  @click="openNaskahPreview(row)"
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  v-if="canRemoveNaskah"
                  type="button"
                  class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30"
                  title="Keluarkan dari berkas"
                  @click="requestRemoveNaskah(row)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
          <DataPagination
            v-if="naskahTotal > naskahPerPage"
            v-model:current-page="naskahPage"
            :total-items="naskahTotal"
            :per-page="naskahPerPage"
          />
        </div>
      </section>

      <section v-else-if="activeTab === 'timeline'" class="mt-5">
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
              >
                <History class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  Rantai Verifikasi & Status
                </h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Riwayat persetujuan penutupan berkas.
                </p>
              </div>
            </div>
            <div v-if="verifikasiList.length" class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-success-500" /> Disetujui
                {{ verifikasiSummary.approved }}</span
              >
              <span
                v-if="verifikasiSummary.rejected"
                class="inline-flex items-center gap-1.5 rounded-full bg-error-50 px-2.5 py-1 text-xs font-medium text-error-700 dark:bg-error-900/30 dark:text-error-400"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-error-500" /> Ditolak
                {{ verifikasiSummary.rejected }}</span
              >
              <span
                v-if="verifikasiSummary.pending"
                class="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-900/30 dark:text-warning-400"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-warning-500" /> Menunggu
                {{ verifikasiSummary.pending }}</span
              >
              <span class="text-xs text-gray-400 dark:text-gray-500"
                >dari {{ verifikasiSummary.total }} verifikator</span
              >
            </div>
          </div>

          <div v-if="verifikasiList.length === 0" class="px-5 py-6">
            <EmptyState
              icon="i-lucide-inbox"
              title="Belum ada aktivitas verifikasi"
              description="Berkas ini belum diajukan penutupan."
            />
          </div>
          <ol v-else class="px-5 py-5">
            <li v-for="(v, idx) in verifikasiList" :key="v.id" class="flex gap-3.5">
              <div class="flex flex-col items-center">
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800"
                  :class="verifikasiStatusMeta(v.status).dot"
                >
                  <component :is="verifikasiStatusMeta(v.status).icon" class="h-4 w-4 text-white" />
                </span>
                <span
                  v-if="idx < verifikasiList.length - 1"
                  class="mt-1 h-full min-h-10 w-0.5"
                  :class="verifikasiStatusMeta(v.status).line"
                />
              </div>
              <div class="flex-1 pb-5">
                <div class="rounded-lg p-3.5" :class="verifikasiStatusMeta(v.status).card">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ v.jabatanVerifikator || `Verifikator ${v.urutan}` }}
                      </p>
                      <span
                        v-if="v.urutan && verifikasiList.length > 1"
                        class="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800/70 dark:text-gray-400"
                        >Tahap {{ v.urutan }}</span
                      >
                    </div>
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="verifikasiStatusMeta(v.status).chip"
                    >
                      <component :is="verifikasiStatusMeta(v.status).icon" class="h-3 w-3" />
                      {{ verifikasiStatusMeta(v.status).label }}
                    </span>
                  </div>
                  <p v-if="v.actionAt" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDateTime(v.actionAt) }}
                  </p>
                  <div
                    v-if="v.catatan"
                    class="mt-2.5 flex gap-2 rounded-md bg-white/60 px-3 py-2 dark:bg-gray-800/40"
                  >
                    <Quote class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <p class="text-xs text-gray-600 dark:text-gray-300">{{ v.catatan }}</p>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section v-else-if="activeTab === 'activity-log'" class="mt-5">
        <EmptyState
          icon="i-lucide-list-tree"
          title="Activity Log belum tersedia"
          description="COMING SOON"
        />
      </section>

      <section v-else-if="activeTab === 'retensi'" class="mt-5 space-y-5">
        <template v-if="retensiPhase">
          <!-- Hero progress (warna konsisten primary; bar mengikuti urgensi) -->
          <div
            class="overflow-hidden rounded-xl border shadow-sm"
            :class="retensiHero.wrap"
          >
            <div
              class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-start gap-3">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  :class="retensiHero.iconBox"
                >
                  <Clock3 class="h-6 w-6" />
                </span>
                <div>
                  <h3
                    class="flex flex-wrap items-center gap-2 font-semibold text-gray-900 dark:text-white"
                  >
                    {{ retensiHero.title }}
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="retensiHero.badgeCls"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="retensiHero.dot" />
                      {{ retensiHero.badge }}
                    </span>
                  </h3>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ retensiInfo }}</p>
                </div>
              </div>
              <div class="text-left sm:text-right">
                <p class="text-3xl font-bold" :class="retensiHero.pct">
                  {{ retensiProgress }}%
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  masa {{ retensiPhase === 'inaktif' ? 'inaktif' : 'aktif' }} berjalan
                </p>
              </div>
            </div>
            <div class="px-5 pb-5">
              <div
                class="relative h-3.5 w-full overflow-hidden rounded-full"
                :class="retensiHero.track"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                  :class="retensiBar"
                  :style="{ width: retensiProgress + '%' }"
                />
              </div>
              <div
                class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
              >
                <span class="inline-flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full" :class="retensiHero.dot" />
                  {{ retensiHero.startLabel }} · {{ retensiHero.startDate }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  {{ retensiHero.endLabel }} · {{ retensiHero.endDate }}
                  <span class="h-2 w-2 rounded-full" :class="retensiHero.dot" />
                </span>
              </div>
            </div>
          </div>

          <!-- Siklus Retensi (lifecycle stepper) -->
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div
              class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-lg"
                :class="retensiHero.iconBox"
              >
                <Clock3 class="h-5 w-5" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Siklus Retensi Arsip</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Tahap retensi berjalan menuju nasib akhir.
                </p>
              </div>
            </div>
            <div class="overflow-x-auto px-5 py-6">
              <div class="flex min-w-[640px] items-start">
                <template v-for="(step, i) in retensiSteps" :key="step.label">
                  <div class="flex min-w-40 flex-col items-center text-center">
                    <div
                      class="flex size-12 items-center justify-center rounded-full shadow-sm ring-4"
                      :class="stepCircle(step.state)"
                    >
                      <UIcon :name="step.icon" class="size-5" />
                    </div>
                    <p class="mt-2 text-sm font-semibold" :class="stepLabel(step.state)">
                      {{ step.label }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ step.sub }}</p>
                    <p class="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {{ step.date }}
                    </p>
                  </div>
                  <div
                    v-if="i < retensiSteps.length - 1"
                    class="mt-6 h-0.5 flex-1 bg-gray-200 dark:bg-gray-700"
                  />
                </template>
              </div>
            </div>
          </div>

          <!-- Stat grid -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="card in retensiStatCards"
              :key="card.label"
              class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                :class="retensiHero.iconBox"
              >
                <UIcon :name="card.icon" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
                <p
                  class="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white"
                  :title="card.value"
                >
                  {{ card.value }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tindakan akhir callout -->
          <div
            v-if="berkas?.tindakanPenyusutanAkhir"
            class="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-900/40 dark:bg-warning-900/20"
          >
            <AlertTriangle class="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
            <p class="text-xs leading-5 text-warning-800 dark:text-warning-300">
              Pada akhir masa retensi, berkas akan dikenakan nasib akhir
              <strong>{{ berkas.tindakanPenyusutanAkhir }}</strong
              >.
            </p>
          </div>
        </template>
        <EmptyState
          v-else
          icon="i-lucide-clock"
          title="Retensi belum berjalan"
          description="Berkas ini belum ditutup. Retensi aktif berjalan setelah berkas ditutup dan disetujui."
        />
      </section>
    </template>

    <UModal
      v-model:open="showAddNaskahModal"
      fullscreen
      :ui="{
        overlay: 'bg-black/50 backdrop-blur-sm',
        content: 'flex flex-col',
        body: 'p-0 flex-1 min-h-0 overflow-hidden',
        footer: 'shrink-0',
      }"
    >
      <template #header
        ><div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            Tambahkan Naskah ke Berkas
          </h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Pilih naskah final yang belum berada di berkas ini.
          </p>
        </div></template
      >
      <template #body>
        <div class="flex h-full min-h-0 flex-col p-4">
          <div
            class="mb-4 shrink-0 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <nav class="flex gap-1" aria-label="Sumber naskah">
              <button
                v-for="tab in addNaskahTabs"
                :key="tab.value"
                type="button"
                class="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all"
                :class="
                  addNaskahTab === tab.value
                    ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                "
                @click="addNaskahTab = tab.value"
              >
                <UIcon :name="tab.icon" class="h-4 w-4" />
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- Filter toolbar -->
          <div
            class="mb-3 shrink-0 rounded-lg border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-900/40 dark:bg-primary-900/10"
          >
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative min-w-50 flex-1">
                <UIcon
                  name="i-lucide-search"
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model="candidateSearch"
                  type="text"
                  placeholder="Cari nomor, perihal, atau nama…"
                  class="h-9 w-full rounded-md border border-primary-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-primary-900/40 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <select
                v-model="candidateJenisFilter"
                class="h-9 w-56 rounded-md border border-primary-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-primary-900/40 dark:bg-gray-800 dark:text-gray-200"
              >
                <option v-for="opt in jenisFilterOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <select
                v-model="candidateStatusFilter"
                class="h-9 w-56 rounded-md border border-primary-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-primary-900/40 dark:bg-gray-800 dark:text-gray-200"
              >
                <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <select
                v-model="candidateDivisiFilter"
                class="h-9 w-56 rounded-md border border-primary-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-primary-900/40 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Semua Divisi</option>
                <option v-for="d in candidateDivisiOptions" :key="d" :value="d">{{ d }}</option>
              </select>
              <select
                v-model="candidateJabatanFilter"
                class="h-9 w-56 rounded-md border border-primary-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-primary-900/40 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Semua Jabatan</option>
                <option v-for="j in candidateJabatanOptions" :key="j" :value="j">{{ j }}</option>
              </select>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span class="text-xs font-medium text-primary-700 dark:text-primary-400"
                >Periode</span
              >
              <UInput v-model="candidateDateFrom" type="date" color="primary" class="w-40" />
              <span class="text-xs text-gray-400">—</span>
              <UInput v-model="candidateDateTo" type="date" color="primary" class="w-40" />
              <UButton
                color="primary"
                size="sm"
                icon="i-lucide-download"
                :loading="isExporting"
                class="shadow-sm"
                :ui="{ label: 'font-semibold' }"
                @click="openExport('kandidat')"
                >Export</UButton
              >
              <UButton
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-lucide-rotate-ccw"
                @click="resetCandidateFilters"
                >Reset</UButton
              >
            </div>
          </div>

          <!-- Selection actions -->
          <div class="mb-2 flex shrink-0 items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                @click="selectAllVisible"
              >
                Pilih semua tampil
              </button>
              <button
                v-if="selectionCount"
                type="button"
                class="text-gray-500 hover:text-error-600 dark:text-gray-400"
                @click="clearSelection"
              >
                Bersihkan pilihan
              </button>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 dark:text-gray-400"
                >Menampilkan {{ filteredCandidates.length }} dari
                {{ candidateList.length }} naskah</span
              >
            </div>
          </div>

          <div
            class="custom-scrollbar min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <DataTable
              :columns="candidateColumns"
              :rows="filteredCandidates"
              :loading="candidatePending"
              empty-message="Tidak ada naskah yang cocok dengan filter."
            >
              <template #cell-select="{ row }">
                <UCheckbox
                  :model-value="isNaskahSelected(row.id)"
                  :disabled="!!row.sudah_masuk_berkas"
                  @update:model-value="toggleNaskahSelection(row)"
                />
              </template>
              <template #cell-nomor_surat="{ row }">
                <div class="min-w-36 max-w-44">
                  <p class="truncate font-mono text-xs font-semibold" :title="row.nomor_surat || row.nomorSurat || ''">
                    {{ row.nomor_surat || row.nomorSurat || '-' }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ formatDate(row.tanggal_naskah || row.tanggalNaskah) }}
                  </p>
                </div>
              </template>
              <template #cell-perihal="{ row }">
                <p class="min-w-32 max-w-xs text-sm font-medium">
                  {{ row.perihal || 'Tanpa perihal' }}
                </p>
              </template>
              <template #cell-naskah_tipe="{ row }">
                <span
                  class="whitespace-nowrap rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  {{ getNaskahTypeLabel(row.naskah_tipe || row.naskahTipe) }}
                </span>
              </template>
              <template #cell-sumber="{ row }">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="sourceBadgeClass(row.sumber)"
                >
                  <component :is="row.sumber === 'terkirim' ? Send : Inbox" class="h-3.5 w-3.5" />
                  {{ getSourceLabel(row.sumber) }}
                </span>
              </template>
              <template #cell-divisi="{ row }">
                <span class="block min-w-28 max-w-40 text-xs text-gray-600 dark:text-gray-300">
                  {{ row.divisi || '—' }}
                </span>
              </template>
              <template #cell-jabatan="{ row }">
                <span class="block min-w-28 max-w-40 text-xs text-gray-600 dark:text-gray-300">
                  {{ row.jabatan || '—' }}
                </span>
              </template>
              <template #cell-nama="{ row }">
                <span class="block min-w-24 text-xs font-medium text-gray-800 dark:text-gray-200">
                  {{ row.nama || '—' }}
                </span>
              </template>
              <template #cell-berkas="{ row }">
                <span
                  v-if="row.sudah_masuk_berkas"
                  class="inline-flex items-center gap-1 text-xs text-primary-700 dark:text-primary-400"
                >
                  <Folder class="h-3.5 w-3.5" /> {{ row.kode_berkas || 'Sudah Masuk Berkas' }}
                </span>
                <span v-else class="text-xs text-gray-400">Belum</span>
              </template>
              <template #cell-aksi="{ row }">
                <div class="flex items-center justify-center">
                  <UButton
                    color="primary"
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-eye"
                    title="Lihat PDF naskah"
                    @click="openCandidatePdf(row)"
                  />
                </div>
              </template>
            </DataTable>
          </div>
          <p class="mt-3 shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {{ selectionCount }} naskah dipilih untuk ditambahkan.
          </p>
        </div>
      </template>
      <template #footer
        ><div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" @click="showAddNaskahModal = false">Batal</UButton
          ><UButton
            color="primary"
            icon="i-lucide-folder-plus"
            :disabled="Object.keys(selectedNaskahSumber).length === 0"
            :loading="isSubmittingNaskah"
            @click="handleAddNaskah"
            >Tambahkan
            {{
              Object.keys(selectedNaskahSumber).length
                ? `(${Object.keys(selectedNaskahSumber).length})`
                : ''
            }}</UButton
          >
        </div></template
      >
    </UModal>

    <UModal v-model:open="showRemoveModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header><h3 class="text-base font-semibold">Keluarkan Naskah</h3></template>
      <template #body
        ><div class="p-4 text-sm text-gray-600 dark:text-gray-300">
          Naskah <strong>{{ selectedNaskah?.nomorSurat || selectedNaskah?.perihal }}</strong> akan
          dikeluarkan dari berkas ini. Naskah asli tidak akan dihapus.
        </div></template
      >
      <template #footer
        ><div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" @click="showRemoveModal = false">Batal</UButton
          ><UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isRemovingNaskah"
            @click="handleRemoveNaskah"
            >Keluarkan</UButton
          >
        </div></template
      >
    </UModal>

    <UModal v-model:open="showDeleteModal" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header
        ><h3 class="text-base font-semibold text-error-700 dark:text-error-400">Hapus Berkas</h3
        ></template>
      <template #body>
        <div class="space-y-3 p-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Berkas <strong>{{ berkas?.judulBerkas }}</strong> akan dihapus. Hanya berkas
            <span class="font-medium">Terbuka tanpa naskah</span> yang dapat dihapus.
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Aksi ini tidak dapat dibatalkan.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" @click="showDeleteModal = false">Batal</UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isDeleting"
            @click="handleDeleteBerkas"
            >Hapus Berkas</UButton
          >
        </div>
      </template>
    </UModal>

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

    <SharedSharePdfViewer
      v-model="showNaskahPreview"
      :url="naskahPreviewUrl || ''"
      :title="naskahPreviewTitle"
      :loading="naskahPreviewLoading"
      @close="clearNaskahPreview"
    />

    <!-- Popup PDF naskah kandidat (dibuka dari modal Tambah Naskah) -->
    <UModal
      v-model:open="showCandidatePdfModal"
      fullscreen
      :ui="{
        overlay: 'bg-black/80 backdrop-blur-sm',
        body: 'p-0',
      }"
    >
      <template #header>
        <div class="flex w-full items-center justify-between gap-3 pr-2">
          <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
            {{ candidatePdfTitle }}
          </p>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            :padded="false"
            @click="closeCandidatePdfModal"
          />
        </div>
      </template>
      <template #body>
        <div class="relative flex h-full min-h-0 w-full flex-col bg-gray-100 dark:bg-gray-900">
          <div
            v-if="candidatePdfLoading"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="mb-2 size-10 animate-spin text-primary-500"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">Memuat Dokumen...</span>
          </div>
          <iframe
            v-if="candidatePdfUrl"
            :src="candidatePdfUrl"
            class="h-full w-full flex-1 border-none"
            title="Preview dokumen"
          />
          <div
            v-else-if="!candidatePdfLoading"
            class="flex h-full flex-col items-center justify-center gap-2 text-gray-500"
          >
            <UIcon name="i-lucide-file-text" class="size-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Export Column Modal (Daftar Naskah / Kandidat Tambah Naskah) -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="exportScope === 'daftar' ? naskahList.length : filteredCandidates.length"
      :title="exportScope === 'daftar' ? 'Pilih Kolom Export Daftar Naskah' : 'Pilih Kolom Export Kandidat Naskah'"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';
import {
  AlignLeft,
  AlertTriangle,
  Archive,
  Building2,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  Files,
  Folder,
  FolderSearch,
  FolderTree,
  Hash,
  History,
  Image as ImageIcon,
  Inbox,
  Info,
  ListTree,
  MapPin,
  Quote,
  RefreshCw,
  Scale,
  Send,
  Tag,
  Trash2,
  User,
  UserRound,
  XCircle,
} from 'lucide-vue-next';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const {
  addNaskahToBerkas,
  deleteBerkas,
  getBerkasById,
  getBerkasStatusByNaskah,
  getDaftarNaskah,
  getNaskahDetailInBerkas,
  getNaskahPdfBlob,
  getNaskahPdfUrl,
  getNaskahSaya,
  getNaskahSiapArsip,
  getNaskahLainnyaKandidat,
  getVerifikasiDetail,
  removeNaskahFromBerkas,
  fetchBerkasFileBlob,
} = useArsipDinamis();
const {
  canUpdateBerkas,
  canDeleteBerkas,
  canAddNaskah: canAddNaskahPermission,
  canAjukanTutup,
} = useArsipDinamisPermission();
const toast = useToast();
const backPath = '/kelola/pemeliharaan/pemberkasan/berkas-saya';

// ── Export (Daftar Naskah & Kandidat Tambah Naskah) ──────────────
const showExportModal = ref(false);
const isExporting = ref(false);
// 'daftar' = tab Daftar Naskah; 'kandidat' = modal Tambah Naskah
const exportScope = ref<'daftar' | 'kandidat'>('daftar');
const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'nomor', label: 'Nomor Surat', desc: 'Nomor naskah' },
  { key: 'tanggal', label: 'Tanggal', desc: 'Tanggal naskah' },
  { key: 'perihal', label: 'Perihal', desc: 'Perihal naskah' },
  { key: 'jenis', label: 'Jenis', desc: 'Jenis naskah (ND/SDI/SDE/DI/KA)' },
  { key: 'divisi', label: 'Divisi', desc: 'Divisi pengirim/penerima' },
  { key: 'jabatan', label: 'Jabatan', desc: 'Jabatan pengirim/penerima' },
  { key: 'nama', label: 'Nama', desc: 'Nama pengirim/penerima' },
  { key: 'sumber', label: 'Sumber', desc: 'Sumber naskah (Kotak Masuk/Terkirim/Siap Arsip)' },
  { key: 'status', label: 'Status', desc: 'Status naskah' },
]);
const berkasId = computed(() => String(route.params.id || ''));
const detailPath = computed(() => `/kelola/pemeliharaan/pemberkasan/${berkasId.value}`);
const berkas = ref<Record<string, any> | null>(null);
const pending = ref(true);
const loadError = ref('');
const activeTab = ref<'overview' | 'naskah' | 'timeline' | 'activity-log' | 'retensi'>('overview');
const naskahList = ref<Record<string, any>[]>([]);
const naskahSearch = ref('');
const naskahPending = ref(false);
const naskahPage = ref(1);
const naskahPerPage = 20;
const naskahTotal = ref(0);
const showNaskahPreview = ref(false);
const naskahPreviewLoading = ref(false);
const naskahPreviewUrl = ref<string | null>(null);
const naskahPreviewTitle = ref('Preview Naskah');
// Popup PDF naskah kandidat (modal Tambah Naskah — preview sebelum diberkaskan)
const showCandidatePdfModal = ref(false);
const candidatePdfLoading = ref(false);
const candidatePdfUrl = ref<string | null>(null);
const candidatePdfTitle = ref('');
const verifikasiList = ref<Record<string, any>[]>([]);
const showAddNaskahModal = ref(false);
const candidateList = ref<Record<string, any>[]>([]);
const candidateSearch = ref('');
const candidatePending = ref(false);
const selectedNaskahSumber = ref<Record<string, string>>({}); // id -> sumber
const isSubmittingNaskah = ref(false);
const addNaskahTab = ref<'kotak_masuk' | 'terkirim' | 'siap_arsip' | 'naskah_lainnya'>('siap_arsip');
const candidateJenisFilter = ref('');
const candidateStatusFilter = ref('out');
const candidateDivisiFilter = ref('');
const candidateJabatanFilter = ref('');
// Semua org dalam scope delegasi (dari BE meta.scopeDivisi) — filter divisi
// tetap menampilkan unit yang belum punya naskah.
const scopeDivisiOptions = ref<string[]>([]);
const candidateDateFrom = ref('');
const candidateDateTo = ref('');
const jenisFilterOptions = [
  { value: '', label: 'Semua Jenis' },
  { value: 'ND', label: 'Nota Dinas' },
  { value: 'SDI', label: 'Surat Dinas Internal' },
  { value: 'SDE', label: 'SDE' },
  { value: 'DI', label: 'Disposisi' },
  { value: 'KA', label: 'Korespondensi Aktif' },
  { value: 'UND', label: 'Surat Undangan' },
];
const statusFilterOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'out', label: 'Belum masuk berkas' },
  { value: 'in', label: 'Sudah masuk berkas' },
];
const addNaskahTabs = [
  { label: 'Siap Arsip', value: 'siap_arsip' as const, icon: 'i-lucide-folder-check' },
  { label: 'Kotak Masuk', value: 'kotak_masuk' as const, icon: 'i-lucide-inbox' },
  { label: 'Terkirim', value: 'terkirim' as const, icon: 'i-lucide-send' },
  { label: 'Naskah Lainnya', value: 'naskah_lainnya' as const, icon: 'i-lucide-files' },
];
const showRemoveModal = ref(false);
const selectedNaskah = ref<Record<string, any> | null>(null);
const isRemovingNaskah = ref(false);
const showDeleteModal = ref(false);
const isDeleting = ref(false);
let naskahSearchTimer: ReturnType<typeof setTimeout> | undefined;
let candidateSearchTimer: ReturnType<typeof setTimeout> | undefined;
let naskahRequestId = 0;
let candidateRequestId = 0;

const tabs = [
  { label: 'Ringkasan', value: 'overview' as const, icon: FolderSearch },
  { label: 'Daftar Naskah', value: 'naskah' as const, icon: FileText },
  { label: 'Timeline', value: 'timeline' as const, icon: History },
  { label: 'Activity Log', value: 'activity-log' as const, icon: ListTree },
  { label: 'Retensi', value: 'retensi' as const, icon: Clock3 },
];
const naskahColumns = [
  { key: 'nomorSurat', label: 'Nomor & Tanggal' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Jenis' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'status', label: 'Status' },
  {
    key: 'aksi',
    label: 'Aksi',
    class: 'w-24 text-center',
    headerClass: 'w-24 text-center',
  },
];
const candidateColumns = [
  { key: 'select', label: '', class: 'w-12' },
  { key: 'nomor_surat', label: 'Nomor & Tanggal' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskah_tipe', label: 'Jenis' },
  { key: 'divisi', label: 'Divisi' },
  { key: 'jabatan', label: 'Jabatan' },
  { key: 'nama', label: 'Nama' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'berkas', label: 'Status Berkas' },
  {
    key: 'aksi',
    label: 'Aksi',
    class: 'w-20 text-center',
    headerClass: 'w-20 text-center',
  },
];
// Opsi filter divisi: semua org scope (dari BE) + divisi unik dari daftar kandidat.
const candidateDivisiOptions = computed(() => [
  ...new Set([
    ...scopeDivisiOptions.value,
    ...candidateList.value
      .map((r) => r.divisi)
      .filter((d: any) => typeof d === 'string' && d.trim()),
  ]),
] as string[]);
const candidateJabatanOptions = computed(() => [
  ...new Set(
    candidateList.value
      .map((r) => r.jabatan)
      .filter((j: any) => typeof j === 'string' && j.trim())
  ),
] as string[]);
const filteredCandidates = computed(() => {
  let rows = candidateList.value;
  if (candidateStatusFilter.value === 'in') rows = rows.filter((r) => r.sudah_masuk_berkas);
  else if (candidateStatusFilter.value === 'out') rows = rows.filter((r) => !r.sudah_masuk_berkas);
  if (candidateJenisFilter.value)
    rows = rows.filter((r) => (r.naskah_tipe || r.naskahTipe || '') === candidateJenisFilter.value);
  if (candidateDivisiFilter.value) rows = rows.filter((r) => r.divisi === candidateDivisiFilter.value);
  if (candidateJabatanFilter.value)
    rows = rows.filter((r) => r.jabatan === candidateJabatanFilter.value);
  if (candidateDateFrom.value || candidateDateTo.value) {
    rows = rows.filter((r) => {
      const d = (r.tanggal_naskah || r.tanggalNaskah || '').toString().slice(0, 10);
      if (!d) return false;
      if (candidateDateFrom.value && d < candidateDateFrom.value) return false;
      if (candidateDateTo.value && d > candidateDateTo.value) return false;
      return true;
    });
  }
  return rows;
});
const selectionCount = computed(() => Object.keys(selectedNaskahSumber.value).length);
function selectAllVisible() {
  const next = { ...selectedNaskahSumber.value };
  for (const r of filteredCandidates.value) {
    if (!r.sudah_masuk_berkas && r.id != null) next[r.id] = r.sumber;
  }
  selectedNaskahSumber.value = next;
}
function clearSelection() {
  selectedNaskahSumber.value = {};
}
function resetCandidateFilters() {
  candidateJenisFilter.value = '';
  candidateStatusFilter.value = 'out';
  candidateDivisiFilter.value = '';
  candidateJabatanFilter.value = '';
  candidateDateFrom.value = '';
  candidateDateTo.value = '';
}
const canAddNaskah = computed(
  () =>
    canAddNaskahPermission.value &&
    ['aktif', 'ditolak'].includes(berkas.value?.status),
);
const canRemoveNaskah = computed(
  () =>
    canAddNaskahPermission.value &&
    ['aktif', 'ditolak'].includes(berkas.value?.status),
);
const canClose = computed(
  () => canAjukanTutup.value && ['aktif', 'ditolak'].includes(berkas.value?.status),
);
const canEdit = computed(
  () => canUpdateBerkas.value && ['aktif', 'ditolak'].includes(berkas.value?.status),
);
const canDelete = computed(
  () =>
    canDeleteBerkas.value &&
    berkas.value?.status === 'aktif' &&
    naskahList.value.length === 0,
);
const quickInfoCards = computed(() => [
  { label: 'Kode Berkas', value: berkas.value?.kodeBerkas || '-', icon: Hash },
  { label: 'Jumlah Naskah', value: String(naskahTotal.value), icon: Files },
  { label: 'Dibuat Oleh', value: berkas.value?.penciptaNama || '-', icon: UserRound },
  { label: 'Tanggal Dibuat', value: formatDate(berkas.value?.tanggalDibuat), icon: CalendarPlus },
  {
    label: 'Retensi Berakhir',
    value: formatDate(berkas.value?.tanggalRetensiAktifBerakhir),
    icon: CalendarClock,
  },
]);
const isRetensiAktif = computed(() => berkas.value?.status === 'closed_retensi_aktif');
const isRetensiInaktif = computed(() => berkas.value?.status === 'retensi_inaktif');
const retensiPhase = computed<'aktif' | 'inaktif' | null>(() =>
  isRetensiAktif.value ? 'aktif' : isRetensiInaktif.value ? 'inaktif' : null,
);
// Rentang fase berjalan: aktif = tanggalDitutup → tanggalRetensiAktifBerakhir;
// inaktif = tanggalRetensiAktifBerakhir → tanggalRetensiInaktifBerakhir.
const retensiRange = computed(() => {
  const inaktif = retensiPhase.value === 'inaktif';
  return {
    start: inaktif
      ? berkas.value?.tanggalRetensiAktifBerakhir
      : berkas.value?.tanggalDitutup,
    end: inaktif
      ? berkas.value?.tanggalRetensiInaktifBerakhir
      : berkas.value?.tanggalRetensiAktifBerakhir,
    totalTahun: inaktif
      ? berkas.value?.retensiInaktifTahun || 0
      : berkas.value?.retensiAktifTahun || 0,
  };
});
const retensiProgress = computed(() => {
  const { start, end } = retensiRange.value;
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now >= e) return 100;
  if (now <= s) return 0;
  return Math.round(((now - s) / (e - s)) * 100);
});
const retensiInfo = computed(() => {
  const { end, totalTahun } = retensiRange.value;
  const inaktif = retensiPhase.value === 'inaktif';
  if (!end) return 'Tanggal jatuh tempo retensi belum dihitung.';
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (days <= 0)
    return inaktif
      ? 'Masa retensi inaktif telah berakhir.'
      : 'Masa retensi aktif telah berakhir.';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return `Tersisa ${years} tahun ${months} bulan dari total masa retensi ${inaktif ? 'inaktif' : 'aktif'} ${totalTahun} tahun.`;
});
const sisaWaktu = computed(() => {
  const { end } = retensiRange.value;
  if (!end) return '-';
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return days <= 0 ? 'Lewat' : `${days} hari`;
});
const retensiHero = computed(() => {
  const inaktif = retensiPhase.value === 'inaktif';
  const { start, end } = retensiRange.value;
  return {
    title: inaktif ? 'Retensi Inaktif Berjalan' : 'Retensi Aktif Berjalan',
    badge: inaktif ? 'Retensi Inaktif' : 'Retensi Aktif',
    wrap: 'border-primary-200 bg-gradient-to-br from-primary-50 to-white dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800',
    iconBox: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
    badgeCls: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    dot: 'bg-primary-500',
    pct: 'text-primary-600 dark:text-primary-400',
    track: 'bg-primary-100 dark:bg-primary-900/30',
    startLabel: inaktif ? 'Mulai Inaktif' : 'Mulai',
    startDate: formatDate(start),
    endLabel: inaktif ? 'Jatuh Tempo Inaktif' : 'Jatuh Tempo',
    endDate: formatDate(end),
  };
});
// Warna bar mengikuti urgensi: hijau (aman) → amber (separuh) → merah (jatuh tempo dekat).
const retensiBar = computed(() => {
  const p = retensiProgress.value;
  if (p >= 80) return 'from-red-400 to-red-600';
  if (p >= 50) return 'from-amber-400 to-amber-600';
  return 'from-emerald-400 to-emerald-600';
});
const retensiSteps = computed(() => {
  const phase = retensiPhase.value;
  const aktifDone = phase === 'inaktif';
  return [
    {
      label: 'Retensi Aktif',
      sub: aktifDone ? 'Selesai' : phase === 'aktif' ? 'Sedang berjalan' : 'Belum berjalan',
      date: formatDate(berkas.value?.tanggalDitutup),
      state: aktifDone ? 'done' : phase === 'aktif' ? 'active' : 'todo',
      icon: aktifDone ? 'i-lucide-check' : 'i-lucide-play',
    },
    {
      label: 'Retensi Inaktif',
      sub: phase === 'inaktif' ? 'Sedang berjalan' : 'Menunggu',
      date: formatDate(berkas.value?.tanggalRetensiAktifBerakhir),
      state: phase === 'inaktif' ? 'active' : 'todo',
      icon: 'i-lucide-archive',
    },
    {
      label: 'Nasib Akhir',
      sub: berkas.value?.tindakanPenyusutanAkhir || '-',
      date: formatDate(berkas.value?.tanggalRetensiInaktifBerakhir),
      state: 'todo',
      icon: 'i-lucide-flag',
    },
  ];
});
const stepCircle = (state: string) =>
  state === 'done'
    ? 'bg-success-500 text-white ring-success-100 dark:ring-success-900/40'
    : state === 'active'
      ? 'bg-primary-500 text-white ring-primary-100 dark:ring-primary-900/40'
      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 ring-transparent';
const stepLabel = (state: string) =>
  state === 'done'
    ? 'text-success-600 dark:text-success-400'
    : state === 'active'
      ? 'text-primary-700 dark:text-primary-400'
      : 'text-gray-600 dark:text-gray-300';
const metadataList = computed(() => [
  { label: 'Kode Berkas', value: berkas.value?.kodeBerkas || '-', icon: Hash },
  { label: 'Kategori Berkas', value: berkas.value?.kategoriBerkas || '-', icon: Folder },
  { label: 'Kode Klasifikasi', value: berkas.value?.klasifikasi || '-', icon: Tag },
  { label: 'Nama Klasifikasi', value: berkas.value?.klasifikasiTeks || '-', icon: FolderTree },
  { label: 'Lokasi Fisik', value: berkas.value?.lokasi || '-', icon: MapPin },
  { label: 'Dibuat Oleh', value: berkas.value?.penciptaNama || '-', icon: UserRound },
  { label: 'Unit Pencipta', value: berkas.value?.unitPenciptaNama || '-', icon: Building2 },
  { label: 'Nasib Akhir', value: berkas.value?.tindakanPenyusutanAkhir || '-', icon: Scale },
  { label: 'Terakhir Diperbarui', value: formatDateTime(berkas.value?.updatedAt), icon: RefreshCw },
]);
const retentionTimeline = computed(() => [
  {
    label: 'Berkas Dibuat',
    value: formatDate(berkas.value?.tanggalDibuat || berkas.value?.createdAt),
    helper: 'Awal siklus hidup berkas',
    dotClass: 'bg-primary-500',
    icon: CalendarPlus,
    last: false,
  },
  {
    label: 'Retensi Aktif Berakhir',
    value: formatDate(berkas.value?.tanggalRetensiAktifBerakhir),
    helper: `${berkas.value?.retensiAktifTahun ?? 0} tahun masa aktif`,
    dotClass: 'bg-success-500',
    icon: CheckCircle2,
    last: false,
  },
  {
    label: 'Retensi Inaktif Berakhir',
    value: formatDate(berkas.value?.tanggalRetensiInaktifBerakhir),
    helper: `${berkas.value?.retensiInaktifTahun ?? 0} tahun masa inaktif`,
    dotClass: 'bg-warning-500',
    icon: Archive,
    last: true,
  },
]);
const ditolakBannerDismissed = ref(false);
const alasanPenolakan = computed(() => {
  const rejected = verifikasiList.value
    .filter((v) => v.status === 'rejected')
    .slice()
    .sort((a, b) => new Date(b.actionAt || 0).getTime() - new Date(a.actionAt || 0).getTime())[0];
  if (!rejected) return null;
  return {
    jabatan: rejected.jabatanVerifikator || `Verifikator ${rejected.urutan}` || 'Verifikator',
    catatan: rejected.catatan || '',
  };
});
const verifikasiSummary = computed(() => {
  const total = verifikasiList.value.length;
  const approved = verifikasiList.value.filter((v) => v.status === 'approved').length;
  const rejected = verifikasiList.value.filter((v) => v.status === 'rejected').length;
  const pending = Math.max(0, total - approved - rejected);
  return { total, approved, rejected, pending };
});
function verifikasiStatusMeta(status?: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'Disetujui',
        icon: CheckCircle2,
        dot: 'bg-success-500',
        chip: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
        line: 'bg-success-200 dark:bg-success-900/40',
        card: 'border border-success-200 bg-success-50/60 dark:border-success-900/40 dark:bg-success-900/10',
      };
    case 'rejected':
      return {
        label: 'Ditolak',
        icon: XCircle,
        dot: 'bg-error-500',
        chip: 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400',
        line: 'bg-error-200 dark:bg-error-900/40',
        card: 'border border-error-200 bg-error-50/60 dark:border-error-900/40 dark:bg-error-900/10',
      };
    default:
      return {
        label: 'Menunggu',
        icon: Clock3,
        dot: 'bg-warning-500',
        chip: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
        line: 'bg-gray-200 dark:bg-gray-700',
        card: 'border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/30',
      };
  }
}
const retensiStatCards = computed(() => {
  const inaktif = retensiPhase.value === 'inaktif';
  return [
    {
      label: 'Tanggal Ditutup',
      value: formatDate(berkas.value?.tanggalDitutup),
      icon: 'i-lucide-lock-keyhole',
    },
    {
      label: 'JRA Aktif',
      value: `${berkas.value?.retensiAktifTahun || 0} Tahun`,
      icon: 'i-lucide-clock',
    },
    {
      label: inaktif ? 'Sisa Waktu Inaktif' : 'Sisa Waktu Aktif',
      value: sisaWaktu.value,
      icon: 'i-lucide-calendar-clock',
    },
    {
      label: inaktif ? 'Jatuh Tempo Inaktif' : 'Jatuh Tempo Aktif',
      value: formatDate(
        inaktif
          ? berkas.value?.tanggalRetensiInaktifBerakhir
          : berkas.value?.tanggalRetensiAktifBerakhir,
      ),
      icon: 'i-lucide-calendar-x',
    },
    {
      label: 'JRA Inaktif',
      value: `${berkas.value?.retensiInaktifTahun || 0} Tahun`,
      icon: 'i-lucide-archive',
    },
    {
      label: 'Jatuh Tempo Inaktif',
      value: formatDate(berkas.value?.tanggalRetensiInaktifBerakhir),
      icon: 'i-lucide-calendar-x-2',
    },
  ];
});

const unwrapEnvelope = <T = any,>(response: any): T => response?.data ?? response;
const unwrapPaginated = (response: any) => {
  const payload = unwrapEnvelope<any>(response);
  return {
    rows: Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta || {},
  };
};
const getErrorMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message || error?.data?.message || error?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
};
function formatDate(value?: string | Date | null) {
  if (!value) return 'Belum tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        date
      );
}
function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
}
function getNaskahTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    ND: 'Nota Dinas',
    SDI: 'Surat Dinas Internal',
    SDE: 'SDE',
    DI: 'Disposisi',
    KA: 'Korespondensi Aktif',
    UND: 'Surat Undangan',
    K: 'Konsep',
  };
  return labels[String(value || '').toUpperCase()] || value || '-';
}
function getSourceLabel(value?: string) {
  if (value === 'naskah_lainnya') return 'Naskah Lainnya';
  if (value === 'terkirim') return 'Terkirim';
  if (value === 'siap_arsip') return 'Siap Arsip';
  return 'Kotak Masuk';
}
function sourceBadgeClass(value?: string) {
  if (value === 'naskah_lainnya')
    return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  return value === 'terkirim'
    ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400'
    : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
}
function clearNaskahPreview() {
  if (naskahPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(naskahPreviewUrl.value);
  }
  naskahPreviewUrl.value = null;
}

// Gunakan viewer preview yang sudah tersedia. Detail naskah dicari berdasarkan
// ID baris agar PDF yang tampil sesuai dengan naskah yang diklik.
async function openNaskahPreview(row: Record<string, any>) {
  const naskahId = row.naskahId || row.id;
  if (!naskahId || !berkasId.value) return;

  clearNaskahPreview();
  naskahPreviewTitle.value = row.perihal || row.nomorSurat || 'Preview Naskah';
  showNaskahPreview.value = true;
  naskahPreviewLoading.value = true;

  try {
    const response = await getNaskahDetailInBerkas(berkasId.value, String(naskahId));
    const payload: any = response?.data ?? response;
    const flow: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.flow)
        ? payload.flow
        : Array.isArray(payload?.data)
          ? payload.data
          : payload
            ? [payload]
            : [];
    const detail =
      flow.find((item) => String(item?.id || '') === String(naskahId)) || flow[0];
    if (!detail?.final_pdf_url && !detail?.final_pdf) {
      throw new Error('Naskah tidak memiliki PDF final');
    }

    const blob = await getNaskahPdfBlob(String(naskahId));
    if (!blob?.size) throw new Error('PDF kosong');
    naskahPreviewUrl.value = URL.createObjectURL(
      new Blob([blob], { type: 'application/pdf' }),
    );
  } catch (error: any) {
    showNaskahPreview.value = false;
    toast.add({
      title: 'Preview naskah gagal dimuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    naskahPreviewLoading.value = false;
  }
}

// Preview PDF naskah kandidat (belum masuk berkas) — ambil presigned URL dari
// endpoint /arsip-dinamis/naskah/:id/pdf, render langsung di iframe (inline).
// Presigned URL sudah ResponseContentDisposition: inline → viewer PDF tampil.
function closeCandidatePdfModal() {
  showCandidatePdfModal.value = false;
  candidatePdfUrl.value = null;
}

async function openCandidatePdf(row: Record<string, any>) {
  const naskahId = row.id || row.naskahId;
  if (!naskahId) return;
  showCandidatePdfModal.value = true;
  candidatePdfLoading.value = true;
  candidatePdfUrl.value = null;
  candidatePdfTitle.value = row.perihal || row.nomor_surat || 'Naskah';
  try {
    const response = await getNaskahPdfUrl(naskahId);
    const payload: any = response?.data ?? response;
    const url = payload?.url || payload?.data?.url || '';
    if (!url) throw new Error('Naskah tidak memiliki PDF final');
    candidatePdfUrl.value = url;
  } catch (e: any) {
    toast.add({
      title: 'Gagal memuat PDF',
      description: e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
    showCandidatePdfModal.value = false;
  } finally {
    candidatePdfLoading.value = false;
  }
}

// ── Export Excel (Daftar Naskah & Kandidat Tambah Naskah) ────────

function openExport(scope: 'daftar' | 'kandidat') {
  const rows = scope === 'daftar' ? naskahList.value : filteredCandidates.value;
  if (rows.length === 0) {
    toast.add({
      title: 'Tidak ada data',
      description: 'Tidak ada data untuk diexport',
      color: 'warning',
    });
    return;
  }
  exportScope.value = scope;
  showExportModal.value = true;
}

function handleExportConfirm(selectedKeys: string[]) {
  const rows = exportScope.value === 'daftar' ? naskahList.value : filteredCandidates.value;
  if (rows.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const data = rows.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      const nomor = r.nomor_surat || r.nomorSurat || r.nomor || '-';
      const tanggal = formatDate(r.tanggal_naskah || r.tanggalNaskah || r.tanggal);
      const perihal = r.perihal || 'Tanpa perihal';
      const jenis = getNaskahTypeLabel(r.naskah_tipe || r.naskahTipe || r.naskahTipe || r.jenis);
      const divisi = r.divisi || '-';
      const jabatan = r.jabatan || '-';
      const nama = r.nama || '-';
      const sumber = getSourceLabel(r.sumber || (exportScope.value === 'daftar' ? '' : ''));
      const status = r.status || '-';
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('nomor')) row['Nomor Surat'] = nomor;
      if (selectedKeys.includes('tanggal')) row['Tanggal'] = tanggal;
      if (selectedKeys.includes('perihal')) row['Perihal'] = perihal;
      if (selectedKeys.includes('jenis')) row['Jenis'] = jenis;
      if (selectedKeys.includes('divisi')) row['Divisi'] = divisi;
      if (selectedKeys.includes('jabatan')) row['Jabatan'] = jabatan;
      if (selectedKeys.includes('nama')) row['Nama'] = nama;
      if (selectedKeys.includes('sumber')) row['Sumber'] = sumber;
      if (selectedKeys.includes('status')) row['Status'] = status;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2,
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    const sheetName = exportScope.value === 'daftar' ? 'Daftar Naskah' : 'Kandidat Naskah';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName =
      exportScope.value === 'daftar'
        ? `daftar_naskah_${berkas.value?.kodeBerkas || berkasId.value}_${new Date().toISOString().slice(0, 10)}.xlsx`
        : `kandidat_naskah_${berkas.value?.kodeBerkas || berkasId.value}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(blob, fileName);

    showExportModal.value = false;
    toast.add({
      title: 'Berhasil',
      description: `${data.length} data berhasil diexport`,
      color: 'success',
    });
  } catch (e) {
    console.error('Gagal export naskah:', e);
    toast.add({ title: 'Gagal export', description: 'Silakan coba kembali.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
}

async function fetchBerkas() {
  const response = await getBerkasById(berkasId.value);
  const payload = unwrapEnvelope<Record<string, any>>(response);
  if (!payload?.id) throw new Error('Data detail berkas tidak ditemukan pada respons server.');
  berkas.value = payload;
}
async function fetchNaskah() {
  const requestId = ++naskahRequestId;
  naskahPending.value = true;
  try {
    const response = await getDaftarNaskah(berkasId.value, {
      search: naskahSearch.value.trim() || undefined,
      page: naskahPage.value,
      limit: naskahPerPage,
    });
    if (requestId !== naskahRequestId) return;
    const { rows, meta } = unwrapPaginated(response);
    naskahList.value = rows;
    naskahTotal.value = Number(meta.total ?? rows.length);
  } catch (error) {
    if (requestId === naskahRequestId) {
      naskahList.value = [];
      naskahTotal.value = 0;
      toast.add({
        title: 'Daftar naskah gagal dimuat',
        description: getErrorMessage(error, 'Silakan coba kembali.'),
        color: 'error',
      });
    }
  } finally {
    if (requestId === naskahRequestId) naskahPending.value = false;
  }
}
// ── Foto lokasi fisik (diambil sebagai blob terautentikasi) ──
const fotoObjectUrl = ref('');
const fotoError = ref(false);
const fotoLoading = ref(false);
const lightboxOpen = ref(false);
const isHttpUrl = (v?: string) => !!v && /^https?:\/\//i.test(v);

async function loadBerkasFiles() {
  if (!berkas.value) return;
  if (fotoObjectUrl.value) URL.revokeObjectURL(fotoObjectUrl.value);
  fotoObjectUrl.value = '';
  fotoError.value = false;

  const fotoKey = berkas.value.fotoLokasiFisik;
  if (!fotoKey) return;
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
}

function revokeBerkasFiles() {
  if (fotoObjectUrl.value) {
    URL.revokeObjectURL(fotoObjectUrl.value);
    fotoObjectUrl.value = '';
  }
}

async function loadPage() {
  pending.value = true;
  loadError.value = '';
  try {
    await Promise.all([fetchBerkas(), fetchNaskah()]);
    await loadBerkasFiles();
  } catch (error) {
    berkas.value = null;
    loadError.value = getErrorMessage(error, 'Terjadi kesalahan saat mengambil data dari server.');
  } finally {
    pending.value = false;
  }
}
async function fetchVerifikasi() {
  try {
    const response = await getVerifikasiDetail(berkasId.value);
    const payload = unwrapEnvelope<any>(response);
    verifikasiList.value = Array.isArray(payload) ? payload : [];
  } catch {
    verifikasiList.value = [];
  }
}
async function fetchCandidates() {
  const requestId = ++candidateRequestId;
  candidatePending.value = true;
  try {
    let rows: any[];
    if (addNaskahTab.value === 'siap_arsip') {
      const response = await getNaskahSiapArsip(berkasId.value, {
        search: candidateSearch.value.trim() || undefined,
        page: 1,
        limit: 100,
      });
      const { rows: siapRows, meta } = unwrapPaginated(response);
      scopeDivisiOptions.value = Array.isArray(meta?.scopeDivisi) ? meta.scopeDivisi : [];
      rows = siapRows.map((r: any) => ({ ...r, sumber: r.sumber }));
      // Tandai naskah yang sudah ada di berkas lain (BE Task 3)
      if (rows.length) {
        const statusMap = await getBerkasStatusByNaskah(rows.map((r) => r.id));
        const arr: any[] = unwrapEnvelope<any>(statusMap) || [];
        const byId = new Map(arr.map((x: any) => [x.naskah_id, x]));
        rows = rows.map((r) => {
          const s = byId.get(r.id);
          return {
            ...r,
            sudah_masuk_berkas: s ? 1 : 0,
            kode_berkas: s?.kode_berkas || null,
            berkas_status: s?.berkas_status || null,
          };
        });
      }
    } else if (addNaskahTab.value === 'naskah_lainnya') {
      const response = await getNaskahLainnyaKandidat(berkasId.value, {
        search: candidateSearch.value.trim() || undefined,
        page: 1,
        limit: 100,
      });
      const payload = unwrapEnvelope<any>(response);
      rows = (Array.isArray(payload) ? payload : payload?.data || []).map((r: any) => ({
        ...r,
        sumber: 'naskah_lainnya',
      }));
    } else {
      const response = await getNaskahSaya(addNaskahTab.value, {
        search: candidateSearch.value.trim() || undefined,
        page: 1,
        limit: 100,
      });
      const payload = unwrapEnvelope<any>(response);
      rows = (Array.isArray(payload) ? payload : payload?.data || []).map((r: any) => ({
        ...r,
        sumber: addNaskahTab.value === 'terkirim' ? 'terkirim' : 'kotak_masuk',
      }));
    }
    if (requestId !== candidateRequestId) return;
    candidateList.value = rows;
  } catch (error) {
    if (requestId === candidateRequestId) {
      candidateList.value = [];
      toast.add({
        title: 'Naskah gagal dimuat',
        description: getErrorMessage(error, 'Coba lagi.'),
        color: 'error',
      });
    }
  } finally {
    if (requestId === candidateRequestId) candidatePending.value = false;
  }
}
async function handleDeleteBerkas() {
  isDeleting.value = true;
  try {
    await deleteBerkas(berkasId.value);
    toast.add({
      title: 'Berkas berhasil dihapus',
      description: 'Berkas telah dihapus secara permanen.',
      color: 'success',
    });
    showDeleteModal.value = false;
    navigateTo(backPath);
  } catch (error) {
    toast.add({
      title: 'Gagal menghapus berkas',
      description: getErrorMessage(error, 'Silakan coba kembali.'),
      color: 'error',
    });
  } finally {
    isDeleting.value = false;
  }
}
function openAddNaskahModal() {
  selectedNaskahSumber.value = {};
  candidateSearch.value = '';
  addNaskahTab.value = 'siap_arsip';
  resetCandidateFilters();
  showAddNaskahModal.value = true;
  fetchCandidates();
}
function isNaskahSelected(id: string) {
  return Object.prototype.hasOwnProperty.call(selectedNaskahSumber.value, id);
}
function toggleNaskahSelection(row: any) {
  const id = row.id;
  if (isNaskahSelected(id)) {
    const copy = { ...selectedNaskahSumber.value };
    delete copy[id];
    selectedNaskahSumber.value = copy;
  } else {
    selectedNaskahSumber.value = { ...selectedNaskahSumber.value, [id]: row.sumber };
  }
}
async function handleAddNaskah() {
  const entries = Object.entries(selectedNaskahSumber.value);
  if (!entries.length) return;
  isSubmittingNaskah.value = true;
  try {
    const bySource = entries.reduce<Record<string, string[]>>((groups, [id, sumber]) => {
      (groups[sumber] ||= []).push(id);
      return groups;
    }, {});
    const results = await Promise.all(
      Object.entries(bySource).map(async ([sumber, naskah_ids]) => {
        const response = await addNaskahToBerkas(berkasId.value, { sumber, naskah_ids });
        const payload = unwrapEnvelope<Record<string, any>>(response);
        return {
          count: Number(payload?.count ?? 0),
          rejected: Number(payload?.rejected ?? 0),
          alreadyExists: Number(payload?.alreadyExists ?? 0),
        };
      })
    );
    const added = results.reduce((sum, r) => sum + r.count, 0);
    const rejected = results.reduce((sum, r) => sum + r.rejected, 0);
    const alreadyExists = results.reduce((sum, r) => sum + r.alreadyExists, 0);
    if (added > 0) {
      const skipped = rejected + alreadyExists;
      toast.add({
        title: `${added} naskah berhasil ditambahkan`,
        description: skipped
          ? `${skipped} naskah dilewati (sudah ada di berkas atau tidak dapat ditambahkan).`
          : undefined,
        color: 'success',
      });
    } else if (alreadyExists > 0) {
      toast.add({
        title: 'Naskah sudah masuk berkas',
        description: `${alreadyExists} naskah tidak ditambahkan karena sudah terdaftar di sebuah berkas.`,
        color: 'warning',
      });
    } else {
      toast.add({
        title: 'Tidak ada naskah yang ditambahkan',
        description: 'Periksa kembali pilihan naskah atau muat ulang daftar naskah.',
        color: 'error',
      });
    }
    showAddNaskahModal.value = false;
    selectedNaskahSumber.value = {};
    naskahPage.value = 1;
    await fetchNaskah();
  } catch (error) {
    toast.add({
      title: 'Gagal menambahkan naskah',
      description: getErrorMessage(error, 'Coba lagi.'),
      color: 'error',
    });
  } finally {
    isSubmittingNaskah.value = false;
  }
}
function requestRemoveNaskah(row: Record<string, any>) {
  selectedNaskah.value = row;
  showRemoveModal.value = true;
}
async function handleRemoveNaskah() {
  if (!selectedNaskah.value?.naskahId) return;
  isRemovingNaskah.value = true;
  try {
    await removeNaskahFromBerkas(berkasId.value, selectedNaskah.value.naskahId);
    toast.add({ title: 'Naskah berhasil dikeluarkan dari berkas', color: 'success' });
    showRemoveModal.value = false;
    selectedNaskah.value = null;
    await fetchNaskah();
  } catch (error) {
    toast.add({
      title: 'Gagal mengeluarkan naskah',
      description: getErrorMessage(error, 'Silakan coba kembali.'),
      color: 'error',
    });
  } finally {
    isRemovingNaskah.value = false;
  }
}
function printPage() {
  window.print();
}
watch(naskahSearch, () => {
  clearTimeout(naskahSearchTimer);
  naskahSearchTimer = setTimeout(() => {
    if (naskahPage.value !== 1) naskahPage.value = 1;
    else fetchNaskah();
  }, 350);
});
watch(naskahPage, fetchNaskah);
watch(addNaskahTab, () => {
  selectedNaskahSumber.value = {};
  fetchCandidates();
});
watch(candidateSearch, () => {
  if (!showAddNaskahModal.value) return;
  clearTimeout(candidateSearchTimer);
  candidateSearchTimer = setTimeout(fetchCandidates, 350);
});
watch(berkasId, loadPage);
watch(activeTab, (tab) => {
  if (tab === 'timeline' && verifikasiList.value.length === 0) fetchVerifikasi();
});
onMounted(loadPage);
onBeforeUnmount(() => {
  clearTimeout(naskahSearchTimer);
  clearTimeout(candidateSearchTimer);
  clearNaskahPreview();
  revokeBerkasFiles();
});
</script>
