<template>
  <div class="relative">

    <Teleport to="body">
      <div v-if="isLoadingData && loadingMessage !== 'Memuat...'"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-white/75 to-[#e8eff6]/75 backdrop-blur-[2px] transition-all duration-500">

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-[400px] h-[400px] rounded-full bg-gradient-radial from-white/95 via-white/60 to-transparent">
          </div>
        </div>

        <div class="relative flex flex-col items-center gap-6 z-10">
          <div class="relative flex items-center justify-center w-24 h-24">
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#457fb6] border-r-[#749fc8] animate-spin"
              style="animation-duration: 1.5s;">
            </div>
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg relative z-10">
              <div class="plane-float">
                <UIcon name="i-lucide-plane" class="w-8 h-8 text-[#457fb6] -rotate-45" />
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <span class="text-gray-900 font-semibold text-lg">
              {{ loadingMessage || 'Memproses Data' }}
            </span>
            <span class="text-sm text-gray-600">
              Mohon tunggu sebentar
            </span>
          </div>
        </div>
      </div>
    </Teleport>

    <PageHeader title="Lanjut Konsep Surat Dinas Eksternal" :items="breadcrumbs" />

    <div v-if="refData" class="mb-4 mt-6">
      <div class="rounded-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm">

        <div @click="isRefExpanded = !isRefExpanded"
          class="flex items-center justify-between px-5 py-3 cursor-pointer bg-white hover:bg-gray-50 dark:hover:bg-primary-900/30 transition-colors border-b border-primary-100 dark:border-primary-800/50 rounded-lg">
          <div class="flex items-center py-2 gap-3">
            <div
              class="p-0.5 rounded-md bg-primary-500 text-white shadow-sm w-10 h-10 flex items-center justify-center">
              <UIcon name="i-lucide-mail" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-800 dark:text-white leading-none mb-0.5">
                Referensi Surat Asal
              </h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Klik untuk melihat/menyembunyikan detail surat referensi
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <NuxtLink :to="`/korespondensi/kotak-masuk/${refData.id}?jenis=${refData.jenis}`" target="_blank"
              @click.stop
              class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 mr-2 px-3 py-1.5 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors">
              Buka Tab Baru
              <UIcon name="i-lucide-external-link" class="w-3 h-3" />
            </NuxtLink>

            <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': isRefExpanded }" />
          </div>
        </div>

        <div v-show="isRefExpanded">

          <div class="p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-3 break-words">
              {{ refData.perihal || '(Tidak ada perihal)' }}
            </h2>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-1 shrink-0">
                <Hash class="w-3.5 h-3.5" />
                <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                  {{ refData.nomor || '-' }}
                </span>
              </div>
              <span class="opacity-40 hidden sm:inline">•</span>
              <div class="flex items-center gap-1 shrink-0">
                <Calendar class="w-3.5 h-3.5" />
                <span>{{ formatDateRef(refData.tanggal) }}</span>
              </div>
              <span class="opacity-40 hidden sm:inline">•</span>
              <div
                class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                :class="getCategoryStyle(refData.jenis_label)">
                <Tag class="w-3 h-3" />
                {{ refData.jenis_label }}
              </div>
            </div>
          </div>

          <div class="p-5 bg-gray-50/60 dark:bg-gray-950/40 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-start gap-4">
              <UAvatar size="md"
                class="bg-primary-500 text-white font-semibold flex items-center justify-center shrink-0">
                {{ refSenderInitials }}
              </UAvatar>

              <div class="flex-1 min-w-0 space-y-4">
                <div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white block">
                    {{ refData.pengirim_jabatan }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                    {{ refData.pengirim_nama }}
                  </span>
                </div>

                <div class="grid grid-cols-1 gap-4 text-xs">

                  <div class="flex flex-col md:flex-row gap-2 md:gap-4">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[70px] mt-0.5">
                      Kepada</div>
                    <div class="flex flex-col gap-1 w-full">
                      <div v-for="(k, idx) in refData.kepada" :key="idx"
                        class="flex items-start gap-2 text-gray-800 dark:text-gray-200">
                        <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                        <span class="font-medium">{{ k.nama }}</span>
                      </div>
                      <span v-if="!refData.kepada || !refData.kepada.length" class="text-gray-400 italic">-</span>
                    </div>
                  </div>

                  <div v-if="refData.tembusan && refData.tembusan.length > 0"
                    class="flex flex-col md:flex-row gap-2 md:gap-4">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[70px] mt-0.5">
                      Tembusan</div>
                    <div class="flex flex-col gap-1 w-full">
                      <div v-for="(t, idx) in refData.tembusan" :key="idx"
                        class="flex items-start gap-2 text-gray-800 dark:text-gray-200">
                        <span class="text-gray-400 font-mono text-[10px] pt-0.5 w-3 shrink-0">{{ idx + 1 }}.</span>
                        <span class="font-medium">{{ t.nama }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="refData.disposisi" class="flex flex-col md:flex-row gap-2 md:gap-4">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[70px] mt-0.5">
                      Disposisi</div>
                    <div class="text-gray-800 dark:text-gray-200 font-medium">
                      {{ formatDisposisiInline(refData.disposisi) }}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div v-if="refData.catatan"
            class="p-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 rounded-b-lg">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Catatan</div>
            <div class="prose prose-sm prose-blue max-w-none text-gray-800 dark:text-gray-300 text-sm"
              v-html="refData.catatan">
            </div>
          </div>

        </div>
      </div>
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">

      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
        <div class="pt-2">
          <div class="flex justify-between items-center gap-4">
            <div class="flex gap-3 sm:gap-4">
              <USkeleton class="h-8 w-36 rounded" />
              <USkeleton class="h-8 w-36 rounded" />
            </div>
            <USkeleton class="h-8 w-36 rounded" />
          </div>
        </div>
        <div
          class="border border-gray-200 dark:border-gray-700 rounded-lg h-[400px] p-6 space-y-5 bg-white dark:bg-gray-800">
          <div class="flex gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <USkeleton class="h-12 w-12 rounded-full" />
            <div class="flex-1 space-y-2 pt-1">
              <USkeleton class="h-3 w-1/2" />
              <USkeleton class="h-3 w-1/3" />
            </div>
          </div>
          <div class="space-y-3 px-4">
            <USkeleton class="h-3 w-full" />
            <USkeleton class="h-3 w-full" />
            <USkeleton class="h-3 w-11/12" />
            <USkeleton class="h-3 w-full" />
          </div>
        </div>
      </div>


      <div v-else class="flex-1 overflow-y-auto space-y-1">

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Pesan</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Perihal" />
              <span class="text-[10px] font-mono shrink-0 transition-colors"
                :class="subject.length >= maxPerihal ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ subject.length }}/{{ maxPerihal }}
              </span>
            </div>
          </div>
        </div>

        <TulisInputPenerima v-model="selectedTertuju" label="Pengirim" placeholder="Pilih Pengirim" :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items"
          :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <TulisInputSifat v-model="selectedSifat" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Perihal" />
              <span class="text-[10px] font-mono shrink-0 transition-colors"
                :class="subject.length >= maxPerihal ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ subject.length }}/{{ maxPerihal }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col py-4">
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <div class="flex items-center pb-2 mb-6">
                    <div class="flex items-end gap-4">
                      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                      <div class="flex flex-col mb-1">
                        <span class="text-2xl font-bold tracking-wide text-[18px] text-black">
                          AirNav Indonesia
                        </span>
                      </div>
                    </div>

                    <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-left">
                      <div class="font-bold uppercase">
                        {{ user?.alamatInfo?.kantor }}
                      </div>
                      <div>
                        {{ user?.alamatInfo?.gedung }}
                        {{ user?.alamatInfo?.kota }}
                      </div>
                      <div v-html="user?.alamatInfo?.alamat"></div>
                    </div>
                  </div>

                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      NOTA DINAS
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>

                  <table class="w-[50%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black">
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          <span v-if="selectedTertuju.length > 5">
                            Periksa Alamat Terlampir
                          </span>
                          <span v-else v-html="selectedTertuju.length
                            ? selectedTertuju
                              .map((s: any, i: number) =>
                                selectedTertuju.length === 1
                                  ? `<div>${s.labelJob || s.label}</div>`
                                  : `<div style='margin-left:1em;text-indent:-1em'>
                                                                                                        ${i + 1}. ${s.labelJob || s.label}
                                                                                                      </div>`
                              )
                              .join('')
                            : '................................................'
                            "></span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{ user?.positionText || 'Posisi' }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Perihal</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{ subject || "................................................" }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" class="min-h-[400px]" />

                <div class="bg-white px-8 pt-4 pb-8 border-t border-gray-100 select-none">
                  <div class="flex justify-end mb-4 text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>{{ user?.alamatInfo?.kota || 'Tangerang' }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                      </div>
                      <div class="font-bold text-[14px]">{{ user?.nama || 'Nama Lengkap' }}</div>
                    </div>
                  </div>

                  <div class="text-[12px] mt-2 w-full text-left text-black">
                    <div class="font-bold underline mb-1">Tembusan :</div>
                    <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">
                      Periksa Alamat Terlampir
                    </div>
                    <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">
                      {{ selectedTembusan[0]?.labelJob || selectedTembusan[0]?.label }}
                    </div>
                    <ol v-else-if="selectedTembusan.length > 1" class="list-decimal ml-4 pl-2">
                      <li v-for="t in selectedTembusan" :key="t.value">
                        {{ t.labelJob || t.label }}
                      </li>
                    </ol>
                    <div v-else class="text-gray-400 italic">...</div>
                  </div>
                </div>

                <div v-if="selectedTertuju.length > 5 || selectedTembusan.length > 5"
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page">
                </div>
              </div>
            </div>
          </ClientOnly>

          <TulisInputLampiran v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Pratinjau" side="bottom" :dismissible="!alertState.isOpen" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-4 w-full">
          <UButton label="Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" @click="confirmSaveDraft" />

          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" class="px-8 font-bold"
            @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="isPassphraseModalOpen" :dismissible="false" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Pilih Metode Tanda Tangan
          </h3>
        </div>
      </template>

      <template #body>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tentukan metode tanda tangan yang akan digunakan sebelum dokumen dikirim.
        </p>

        <div class="space-y-4">
          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'digsig'
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="digsig" v-model="selectedSendType" class="mt-1" />

            <div class="flex flex-col flex-1">
              <span class="font-medium text-gray-900 dark:text-white">
                Tanda Tangan Digital (BSrE)
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Dokumen ditandatangani secara elektronik resmi (TTE).
              </span>

              <div v-if="selectedSendType === 'digsig'"
                class="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div class="flex items-start gap-4 p-4">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <UIcon name="i-heroicons-user" class="w-6 h-6" />
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 mb-0.5">
                      {{ signerInfo.label }}
                    </span>
                    <span class="text-sm text-gray-700 dark:text-gray-300 leading-tight mb-0.5">
                      {{ signerInfo.role }}
                    </span>
                    <span class="text-base font-semibold text-gray-900 dark:text-white">
                      {{ signerInfo.name }}
                    </span>
                  </div>
                </div>

                <div class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div @click.stop>
                    <UFormGroup label="Passphrase" required>
                      <UInput type="password" v-model="passphrase" size="lg" placeholder="Masukkan passphrase TTE Anda"
                        class="w-full" autofocus />
                    </UFormGroup>
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'qr_only'
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="qr_only" v-model="selectedSendType" class="mt-1" />

            <div class="flex flex-col">
              <span class="font-medium text-gray-900 dark:text-white">
                Kirim Tanpa Tanda Tangan
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Dokumen dikirim tanpa proses tanda tangan digital.
              </span>
            </div>
          </label>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="secondary" size="lg" variant="ghost" @click="isPassphraseModalOpen = false" />
          <UButton label="Lanjutkan" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            :loading="isLoadingData" @click="handlePassphraseSubmit" />
        </div>
      </template>
    </UModal>

  </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* 1. IMPORTS                                                                 */
/* -------------------------------------------------------------------------- */
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import {
  Hash, Calendar, Tag, Paperclip, FileText, Loader2, X, ArrowLeft, Printer, MoreHorizontal, ChevronUp, Info, CheckSquare, Edit3, Users, Building2, ChevronRight, Send, ChevronDown,
  Archive,
  Star
} from "lucide-vue-next";

// Components
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

// Types & Validation
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

// Composables
import { useDigSign } from "@/composables/useDigSign";

/* -------------------------------------------------------------------------- */
/* 2. LOCAL TYPES                                                             */
/* -------------------------------------------------------------------------- */
interface RecipientItem {
  label: string;
  labelJob: string;
  value: string;
  raw: any;
}

interface SifatOption {
  label: string;
  value: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

/* -------------------------------------------------------------------------- */
/* 3. COMPOSABLES & CONFIG                                                    */
/* -------------------------------------------------------------------------- */
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients } = useRecipients();
const { isLoadingDraft, getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND } = useNotaDinas();
const { getKtp } = useDigSign();
const { fetchInboxDetail } = useInbox(null);

/* --- HELPER FUNCTIONS (Tambahkan ini untuk memperbaiki error template) --- */
const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  if (['KAJIAN', 'KA'].includes(c)) return 'bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

const formatDisposisiInline = (val: any) => {
  if (!val) return '';
  if (Array.isArray(val)) return val.join(', ');
  return String(val).replace(/(\r\n|\n|\r)/gm, ", ");
};

const formatDateRef = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch (e) { return value; }
};
/* ----------------------------------------------------------------------- */

const refData = ref<any>(null);
const isRefExpanded = ref(true);

const refSenderInitials = computed(() => {
  if (!refData.value) return "?";
  const name = refData.value.pengirim_nama || refData.value.pengirim?.nama;
  if (!name) return "?";
  return name.trim().split(" ").filter(Boolean).slice(0, 2)
    .map((n: string) => n.charAt(0).toUpperCase()).join("");
});

const breadcrumbs = computed(() => {
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;

  const detailLink = refId
    ? `/korespondensi/kotak-masuk/${refId}?jenis=${refJenis || 'surat'}`
    : '#';

  return [
    { label: "Beranda", to: "/beranda" },
    { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
    {
      label: "Detail Surat",
      to: detailLink,
      class: !refId ? 'opacity-50 cursor-default' : ''
    },
    { label: "Lanjut Konsep Surat Dinas Eksternal", to: "#" },
  ];
});

const maxPerihal = 200;
const sifatOptions: SifatOption[] = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" }
];

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten disini...',
  plugins: 'lists advlist link image code table fullscreen',
  toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; }`,
  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor;
  }
};

/* -------------------------------------------------------------------------- */
/* 4. STATE & REFS                                                            */
/* -------------------------------------------------------------------------- */
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const alertState = useAlertState();

const isPassphraseModalOpen = ref(false)
const selectedSendType = ref('')
const passphrase = ref('')

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}))

// Form Data State
const editDraftId = ref<string | null>(null);
const subject = ref("");
const editorContent = ref("");
const english = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);

// Date State
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

// Classification & Files
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<UploadedFile[]>([]);

// Selection/Recipients
const selectedSifat = ref<SifatOption | null>(null);
const items = ref<RecipientItem[]>([]);
const selectedTertuju = ref<RecipientItem[]>([]);
const selectedTembusan = ref<RecipientItem[]>([]);

// PDF Generation
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

/* -------------------------------------------------------------------------- */
/* 5. COMPUTED PROPERTIES                                                     */
/* -------------------------------------------------------------------------- */
const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

/* -------------------------------------------------------------------------- */
/* 6. METHODS                                                                 */
/* -------------------------------------------------------------------------- */
const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    const errorKeys = Object.keys(validationResult.errors || {});
    const firstKey = errorKeys.length > 0 ? errorKeys[0] : null;
    const firstMessage = firstKey && validationResult.errors
      ? validationResult.errors[firstKey]
      : "Terjadi kesalahan input";

    toast.add({
      title: 'Validasi Gagal',
      description: firstMessage,
      icon: 'i-heroicons-x-circle-20-solid',
      color: 'error'
    });
    return false;
  }
  return true;
};

const getBasePayload = (): DraftPayload => {
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  const tglPreview = date.value
    ? `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`
    : "";

  const lampiranIds = existingFiles.value
    .map((f) => f.id)
    .filter((id): id is string => !!id);

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    penerima: selectedTertuju.value.map(i => i.value),
    tembusan: selectedTembusan.value.map(i => i.value),
    tertuju: selectedTertuju.value.map(i => i.labelJob || i.label),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || null,
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || null,
    sifat: selectedSifat.value?.value || 'biasa',
    perihal: subject.value,
    konten: String(editorContent.value || ''),
    htmlContent: String(editorContent.value || ''),
    english: english.value,
    nama_tempat: user.value?.areaText || "Kantor Pusat",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",
    tgl: tglDb,
    tanggal: tglPreview,
    lampiran_temp_ids: lampiranIds,
  };
};

const createFormData = (payload: DraftPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  (Object.keys(payload) as Array<keyof DraftPayload>).forEach((key) => {
    const value = payload[key];
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  if (includePdf && pdfBlob.value) {
    const safeDate = payload.tanggal ? payload.tanggal.replace(/\//g, '-') : 'draft';
    formData.append("final_pdf", pdfBlob.value, `nota_dinas_${safeDate}.pdf`);
  }

  return formData;
};

// --- Event Handlers ---
const handleApplyTemplate = (htmlContent: string) => {
  if (tinymceEditor.value) {
    const cleanContent = htmlContent.trim().replace(/>\s+</g, '><');
    tinymceEditor.value.setContent(cleanContent);
    editorContent.value = tinymceEditor.value.getContent();
  }
};

const handlePreview = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  loadingMessage.value = "Memproses Pratinjau...";
  isLoadingData.value = true;

  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const formData = createFormData(payload, false);
    const blobResponse = await generatePdf(formData);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmSaveDraft = async () => {
  const isConfirmed = await Alert.confirm(
    'Simpan sebagai Draft?',
    'Dokumen akan disimpan ke folder draft dan bisa Anda edit kembali nanti.',
    'Ya, Simpan',
    'Batal',
    'false'
  );

  if (!isConfirmed) return;

  try {
    await handleSaveDraft();
    Alert.close();
  } catch (error) {
    console.error(error);
    Alert.close();
  }
};

const confirmKirimDokumen = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  passphrase.value = "";
  selectedSendType.value = "digsig";
  isPassphraseModalOpen.value = true;
};

const handlePassphraseSubmit = async () => {
  if (!selectedSendType.value) {
    toast.add({ title: 'Wajib Diisi', description: 'Pilih metode tanda tangan', color: 'warning' });
    return;
  }

  if (selectedSendType.value === 'digsig' && !passphrase.value) {
    toast.add({ title: 'Wajib Diisi', description: 'Harap masukkan passphrase Anda', color: 'warning' });
    return;
  }

  isPassphraseModalOpen.value = false;

  const confirmMessage = selectedSendType.value === 'digsig'
    ? 'Apakah Anda yakin Passphrase benar dan ingin mengirim dokumen ini?'
    : 'Dokumen akan dikirim tanpa tanda tangan BSrE. Lanjutkan?';

  const isConfirmed = await Alert.confirm(
    'Konfirmasi Akhir',
    confirmMessage,
    'Ya, Kirim Sekarang',
    'Periksa Lagi',
    'false'
  );

  if (isConfirmed) {
    await handleKirimDokumen();
  }
};

// --- CORE FUNCTION ---
const handleKirimDokumen = async () => {
  const payload = getBasePayload();

  try {
    loadingMessage.value = "Mengirim Nota Dinas...";
    isLoadingData.value = true;

    // 1. Fetch KTP jika metode TTE dipilih
    let noktpValue = '';

    if (selectedSendType.value === 'digsig') {
      try {
        const ktpResponse = await getKtp();
        if (ktpResponse?.data?.noktp) {
          noktpValue = ktpResponse.data.noktp;
        } else {
          console.warn("Field 'noktp' tidak ditemukan dalam respon");
        }
      } catch (err) {
        console.error("Gagal mengambil data KTP:", err);
        throw new Error("Gagal mengambil data KTP untuk verifikasi TTE");
      }
    }

    // 2. Generate PDF Final
    const formDataPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(formDataPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    // 3. Buat FormData Utama
    const formData = createFormData(payload, true);

    // 4. Append Data Tambahan
    formData.append('passphrase', passphrase.value);
    formData.append('sign_option', selectedSendType.value);

    if (noktpValue) {
      formData.append('nik', noktpValue);
    }

    // 5. Panggil API Kirim
    const result = await sendNotaDinas(formData);

    if (result.data.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Nota Dinas berhasil dikirim', color: 'success' });
      Alert.close();
      router.push("/korespondensi/terkirim");
    } else {
      throw new Error(result.data.message || 'Pengiriman gagal');
    }
  } catch (e: any) {
    isLoadingData.value = false;
    Alert.close();

    console.error("Gagal mengirim:", e);
    let errMsg = e.response?.data?.message || e.message || 'Gagal mengirim dokumen';

    if (errMsg.toLowerCase().includes('passphrase')) {
      isPassphraseModalOpen.value = true;
    }

    toast.add({
      title: 'Gagal Mengirim',
      description: errMsg,
      color: 'error'
    });
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  try {
    loadingMessage.value = "Menyimpan Draft...";
    isLoadingData.value = true;

    const formData = createFormData(payload, false);
    await saveND(formData, editDraftId.value);

    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push("/korespondensi/draf");
  } catch (e: any) {
    console.error("Gagal simpan draft:", e);
    toast.add({
      title: 'Gagal',
      description: e.response?.data?.message || 'Gagal memperbarui draft',
      color: 'error'
    });
  } finally {
    isLoadingData.value = false;
  }
};

/* -------------------------------------------------------------------------- */
/* 7. LIFECYCLE HOOKS                                                         */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  // [LOGIC BARU] Fetch Data Referensi
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;

  if (refId && refJenis) {
    (async () => {
      try {
        const result = await fetchInboxDetail(refId, refJenis);

        if (result) {
          const rawFlow = (result.raw && result.raw.flow && Array.isArray(result.raw.flow) && result.raw.flow.length > 0)
            ? result.raw.flow[0]
            : result;

          refData.value = {
            id: rawFlow.id,
            nomor: rawFlow.nomor || '-',
            tanggal: rawFlow.tanggal,
            perihal: rawFlow.perihal,
            jenis: rawFlow.jenis,
            jenis_label: rawFlow.jenis === 'DI' ? 'DISPOSISI' : (rawFlow.jenis || 'SURAT'),
            // Mapping Pengirim agar sesuai layout detail
            pengirim: rawFlow.pengirim,
            pengirim_nama: rawFlow.pengirim?.nama || rawFlow.pengirim?.name || '-',
            pengirim_jabatan: rawFlow.pengirim?.positionText || rawFlow.pengirim?.position_text || '-',
            // Arrays
            kepada: rawFlow.penerima || [],
            tembusan: rawFlow.tembusan || [],
            lampiran_files: rawFlow.lampiran_files || [],
            // Content
            catatan: rawFlow.catatan,
            disposisi: rawFlow.disposisi,
          };
        }
      } catch (e) {
        console.error("Gagal memuat referensi", e);
      }
    })();
  }

  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const resRec = await getRecipients(user.value?.position);
    const rawData = resRec.recipients || resRec.data || [];

    items.value = rawData.map((r: any): RecipientItem => ({
      label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));
  } catch {
    klasifikasiStatus.value = "error";
  }

  const draftId = route.query.draft_id as string;
  if (draftId) {
    try {
      editDraftId.value = draftId;
      const resDraft = await getDraftDetail(draftId);

      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        english.value = Boolean(d.english);

        if (d.klasifikasi) {
          const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        const mapApiToUI = (list: any[]): RecipientItem[] => {
          return list?.map(item => {
            const posId = String(item.position_id || item.position || item.value);
            const master = items.value.find(m => m.value === posId);
            if (master) return master;
            return {
              label: `${item.persnum || ''} - (${item.abbreviation || ''}) ${item.positionText || item.labelJob || ''}`,
              labelJob: item.positionText || item.labelJob || '',
              value: posId,
              raw: item
            };
          }) || [];
        };

        selectedTertuju.value = mapApiToUI(d.penerima);
        selectedTembusan.value = mapApiToUI(d.tembusan);

        if (d.lampiran_files && Array.isArray(d.lampiran_files)) {
          existingFiles.value = d.lampiran_files.map((f: any): UploadedFile => ({
            id: f.id,
            fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path,
            fileSize: f.fileSize || 0
          }));
        }

        const draftSifat = String(d.sifat || 'biasa').toLowerCase();
        selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions[3];

        if (d.tanggal) {
          const dateParts = d.tanggal.split('-');
          if (dateParts.length === 3) {
            date.value = new CalendarDate(Number(dateParts[0]), Number(dateParts[1]), Number(dateParts[2]));
          }
        }
      }
    } catch (error) {
      console.error("Error loading draft detail:", error);
      toast.add({ title: 'Gagal memuat data draft', color: 'error' });
    }
  }

  isLoadingData.value = false;
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}

.tox-fullscreen {
  z-index: 9999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.tox-dialog-wrap,
.tox-dropzone,
.tox-promotions {
  z-index: 10000 !important;
}
</style>
