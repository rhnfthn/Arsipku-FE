<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

const route = useRoute();
const id = route.params.id as string;

const { fetchInboxDetail, pending, error } = useInbox(null);

const selected = ref<any>(null);

onMounted(async () => {
  selected.value = await fetchInboxDetail(id);
});

// format tanggal
const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// list kepada
const kepadaList = computed(() => {
  return Array.isArray(selected.value?.kepada) ? selected.value.kepada : [];
});

onMounted(async () => {
  selected.value = await fetchInboxDetail(id);
  console.log("SELECTED:", selected.value);
});
</script>

<template>
  <div
    class="w-full flex flex-col bg-white overflow-hidden rounded-xl shadow-lg border-gray-100 py-5"
  >
    <UContainer>
      <!-- judul -->
      <div class="flex justify-between items-start mb-2">
        <h1 class="text-2xl font-normal text-gray-900">
          {{ selected?.perihal }}
        </h1>
        <UButton icon="i-heroicons-printer" variant="ghost" color="gray" />
      </div>

      <!-- badge -->
      <div class="flex gap-2 mb-8">
        <UBadge
          color="yellow"
          variant="subtle"
          :ui="{ rounded: 'rounded-md' }"
          class="px-3 py-1 bg-yellow-100 text-yellow-800"
        >
          {{ selected }}
        </UBadge>
        <UBadge
          color="gray"
          variant="subtle"
          :ui="{ rounded: 'rounded-md' }"
          class="px-3 py-1 bg-gray-200 text-gray-700"
        >
          {{ selected?.sifat || "-" }}
        </UBadge>
      </div>

      <!-- pengirim -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex gap-4">
          <UAvatar
            size="md"
            class="bg-purple-600 text-white"
            :ui="{ background: 'bg-purple-600' }"
          >
            {{ selected?.pengirim?.nama?.charAt(0) || "?" }}
          </UAvatar>

          <div>
            <div class="flex flex-col">
              <span class="font-bold text-gray-900">
                {{ selected?.pengirim?.nama || "-" }} ini jabatan pengirim
              </span>
              <span class="text-gray-500 text-sm">
                {{ selected?.pengirim?.position_text || "-" }} ini nama pengirim
              </span>
            </div>

            <div>
              <div class="text-sm text-gray-500 mb-1">Kepada</div>

              <!-- jika lebih dari satu -->
              <ol
                v-if="kepadaList.length > 1"
                class="list-decimal pl-5 text-gray-900"
              >
                <li v-for="(k, i) in kepadaList" :key="i">
                  {{ k.nama }} – {{ k.position_text }}
                </li>
              </ol>

              <!-- jika satu -->
              <div v-else class="text-gray-900">
                {{ kepadaList[0]?.nama || "-" }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 text-gray-500 text-sm">
          <span>{{ formatDate(selected?.tanggal) }} ini tanggal</span>
          <span>{{ formatDate(selected?.tanggal) }} ini no surat</span>
        </div>
      </div>

      <!-- isi berita -->
      <div class="text-gray-800 leading-relaxed mb-8 text-[15px]">
        <p>catatan</p>
        <p>{{ selected?.perihal || "-" }}</p>
      </div>

      <!-- lampiran -->
      <div class="text-gray-800 leading-relaxed mb-8 text-[15px]">
        <p>lampiran</p>
        <p>{{ selected?.perihal || "-" }}</p>
      </div>

      <!-- action -->
      <div class="mt-8">
        <UButton
          to="/admin/korespondensi/tulis/konsep"
          block
          size="md"
          color="primary"
          variant="solid"
          icon="i-heroicons-document-text"
          :ui="{ rounded: 'rounded-lg', font: 'font-semibold' }"
          class="bg-primary hover:bg-primary-600 text-white h-12"
        >
          Lanjut Konsep
        </UButton>
      </div>
    </UContainer>
  </div>
</template>
