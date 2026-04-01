<template>
  <div class="mb-0.5">
    <div v-if="hasChildren" @click="toggle" :class="containerClasses">
      <UIcon v-if="item?.icon" :key="item.icon" :name="item.icon" :class="iconClasses" />
      <span class="flex-1 text-[14px] truncate leading-5">{{ item?.label }}</span>

      <span
        v-if="item?.badge"
        class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none"
      >
        {{ item.badge }}
      </span>

      <div
        v-else-if="hasChildrenWithBadges && item.label !== 'Penomoran'"
        class="w-2 h-2 bg-red-600 rounded-full shadow-sm animate-pulse"
      ></div>

      <UIcon
        name="i-heroicons-chevron-down"
        :class="['w-3 h-3 transition-transform duration-200 text-gray-500', isOpen && 'rotate-180']"
      />
    </div>

    <NuxtLink v-else-if="item?.to" :to="item.to" :class="containerClasses">
      <UIcon v-if="item?.icon" :name="item.icon" :class="iconClasses" />
      <span class="flex-1 text-[14px] truncate leading-5">{{ item?.label }}</span>

      <span
        v-if="item?.badge"
        class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none"
      >
        {{ item.badge }}
      </span>
    </NuxtLink>

    <div v-if="hasChildren && isOpen" class="mt-0.5 mx-3 space-y-0.5">
      <template v-for="(child, i) in item.children" :key="i">
        <NuxtLink
          v-if="child && child.to"
          :to="child.to"
          class="whitespace-nowrap flex items-center px-4 py-2.5 my-1 pl-12 rounded-full text-[14px] transition-colors dark:text-gray-400 relative"
          :class="
            isActiveChild(child.to)
              ? 'bg-[#D3E3FD] font-bold text-gray-900 dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          "
        >
          <span class="flex-1">{{ child.label }}</span>

          <span
            v-if="child?.badge"
            class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none ml-2"
          >
            {{ child.badge }}
          </span>
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: { type: Object, required: true },
  collapsed: Boolean
});

const route = useRoute();
const isOpen = ref(false);

// Check if has children
const hasChildren = computed(() => props.item?.children && props.item.children.length > 0);

// Check if any children has badge
const hasChildrenWithBadges = computed(() => {
  if (!hasChildren.value) return false;
  return props.item.children.some((child) => child?.badge && child.badge > 0);
});

// Helper for exact or nested active state
const isActivePath = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// Helper khusus untuk child agar active state lebih akurat
const isActiveChild = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// Logic Active State
const isActive = computed(() => {
  if (!props.item) return false;

  if (props.item.to && !hasChildren.value) {
    return isActivePath(props.item.to);
  }

  if (hasChildren.value) {
    return props.item.children.some((child) => child?.to && isActivePath(child.to));
  }
  return false;
});

// Logic Auto open jika ada notifikasi atau active
const shouldAutoOpen = computed(() => {
  if (!hasChildren.value) return false;
  return isActive.value || hasChildrenWithBadges.value;
});

// Set initial state
if (shouldAutoOpen.value) {
  isOpen.value = true;
}

// Watch untuk auto open saat ada perubahan
watch(shouldAutoOpen, (newVal) => {
  if (newVal) {
    isOpen.value = true;
  }
});

watch(
  () => route.path,
  () => {
    if (shouldAutoOpen.value) {
      isOpen.value = true;
    }
  }
);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const containerClasses = computed(() => [
  'flex items-center gap-3 my-1.5 px-4 py-2.5 mx-0 rounded-full min-w-[200px] cursor-pointer transition-colors duration-200 select-none',
  isActive.value
    ? 'bg-[#D3E3FD] text-gray-900 font-bold dark:bg-gray-700 dark:text-white'
    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  'mx-3'
]);

const iconClasses = computed(() => [
  'w-5 h-5',
  isActive.value ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
]);
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
