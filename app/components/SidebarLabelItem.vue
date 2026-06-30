<template>
  <div>
    <div class="group relative flex items-center gap-2 py-2 mx-3 rounded-full cursor-pointer transition-colors" :class="isActive
      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
      : 'hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'"
      :style="{ paddingLeft: (16 + (level * 20)) + 'px', paddingRight: '16px' }" @click="navigateToLabel">
      <button v-if="item.children && item.children.length > 0" @click.stop="toggleOpen"
        class="p-0.5 -ml-1 rounded hover:text-gray-700 dark:hover:text-gray-300 text-gray-400 dark:text-gray-500 transition-colors">
        <UIcon :name="isOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="w-4 h-4" />
      </button>

      <div v-else class="w-4 h-4 -ml-1 mr-0.5"></div>

      <UIcon name="i-lucide-tag" class="w-5 h-5 shrink-0 transition-transform" :class="[
        level > 0 ? 'scale-90' : '',
      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
      ]" />

      <span class="flex-1 text-[14px] truncate leading-5" :class="{ 'font-semibold': isActive }">
        {{ item.nama }}
      </span>

      <span v-if="count > 0" class="text-[10px] font-semibold px-2 py-0.5 rounded-full group-hover:hidden"
        :class="isActive ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'">
        {{ count }}
      </span>

      <div
        class="hidden group-hover:flex absolute right-1 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-full px-1 gap-0.5 z-10">
        <button @click.stop="$emit('edit', item)" class="p-1 rounded hover:text-primary-500 text-primary-300">
          <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" />
        </button>
        <button @click.stop="$emit('delete', item)" class="p-1 rounded hover:text-error-500 text-error-300">
          <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div v-if="item.children && item.children.length > 0" v-show="isOpen">
      <SidebarLabelItem v-for="child in item.children" :key="child.id" :item="child" :level="level + 1"
        :labelCounts="labelCounts" @edit="$emit('edit', $event)" @delete="$emit('delete', $event)" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'; // Tambahkan import ref
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  item: { type: Object, required: true },
  level: { type: Number, default: 0 },
  labelCounts: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['edit', 'delete', 'click']);

const route = useRoute();
const router = useRouter();

// State untuk expand/collapse (Default false/collapsed)
const isOpen = ref(false);

// Fungsi toggle
const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

// Hitung apakah label ini sedang dibuka berdasarkan URL
const isActive = computed(() => {
  return route.name === 'label-id' && String(route.params.id) === String(props.item.id);
});

const count = computed(() => props.labelCounts[props.item.id] || 0);

// Fungsi navigasi ke halaman detail label
const navigateToLabel = () => {
  emit('click', props.item);
  if (isActive.value) return;
  router.push(`/label/${props.item.id}`);

  // Optional: Auto expand jika diklik (uncomment jika diinginkan)
  // if (props.item.children?.length) isOpen.value = true;
};
</script>
