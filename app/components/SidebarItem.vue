<template>
  <div class="mb-0.5">
    <div v-if="hasChildren" @click="toggle" :class="containerClasses" :title="item?.label">
      <UIcon v-if="item?.icon" :key="item.icon" :name="item.icon" :class="iconClasses" />
      <span class="flex-1 text-[13px] leading-tight whitespace-pre-line break-words">{{ item?.label }}</span>

      <span
        v-if="item?.badge && !effectiveBadgeAsDot"
        class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none"
      >
        {{ item.badge }}
      </span>

      <div
        v-else-if="item?.badge && effectiveBadgeAsDot"
        class="w-2 h-2 bg-red-600 rounded-full shadow-sm animate-pulse"
      ></div>

      <div
        v-else-if="hasChildrenWithBadges"
        class="w-2 h-2 bg-red-600 rounded-full shadow-sm animate-pulse"
      ></div>

      <UIcon
        name="i-heroicons-chevron-down"
        :class="['w-3 h-3 transition-transform duration-200 text-gray-500 dark:text-gray-400', isOpen && 'rotate-180']"
      />
    </div>

    <NuxtLink v-else-if="item?.to" :to="item.to" :class="containerClasses" :title="item?.label">
      <UIcon v-if="item?.icon" :name="item.icon" :class="iconClasses" />
      <span class="flex-1 text-[13px] leading-tight whitespace-pre-line break-words">{{ item?.label }}</span>

      <span
        v-if="item?.badge"
        class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none"
      >
        {{ item.badge }}
      </span>
    </NuxtLink>

    <div v-if="hasChildren && isOpen" class="mt-0.5 mx-3 space-y-0.5">
      <template v-for="(child, i) in item.children" :key="i">
        <!-- Recursive: child punya sub-children → render nested SidebarItem -->
        <SidebarItem
          v-if="child && child.children && child.children.length > 0"
          :item="child"
          :collapsed="collapsed"
        />
        <!-- Leaf: child langsung ke route -->
        <NuxtLink
          v-else-if="child && child.to"
          :to="child.to"
          :title="child.label"
          class="flex items-start px-4 py-2.5 my-1 pl-12 rounded-full text-[13px] leading-tight whitespace-pre-line break-words transition-colors dark:text-gray-400 relative"
          :class="
            isActiveChild(child.to, child.activePaths, child.exact)
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
  collapsed: Boolean,
  // Tampilkan badge sebagai dot merah saja (tanpa angka).
  // Default: otomatis dot jika punya children (parent menu di sidebar utama),
  //          angka jika leaf (submenu di dropdown).
  badgeAsDot: { type: Boolean, default: null },
});

const route = useRoute();
const isOpen = ref(false);

// Effective badge style:
// - Kalau prop badgeAsDot di-set eksplisit (true/false) → pakai itu
// - Kalau null/undefined → otomatis: parent (hasChildren) = dot, leaf = angka
const effectiveBadgeAsDot = computed(() => {
  if (props.badgeAsDot === true || props.badgeAsDot === false) {
    return props.badgeAsDot;
  }
  return hasChildren.value;
});

// Check if has children
const hasChildren = computed(() => props.item?.children && props.item.children.length > 0);

// Check if any children (or sub-children) has badge
const hasChildrenWithBadges = computed(() => {
  if (!hasChildren.value) return false;
  const checkRecursive = (items) =>
    items.some((child) => {
      if (child?.badge && child.badge > 0) return true;
      if (child?.children && child.children.length > 0) return checkRecursive(child.children);
      return false;
    });
  return checkRecursive(props.item.children);
});

// Helper for exact or nested active state
const isActivePath = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// Helper khusus untuk child agar active state akurat.
// Pakai startsWith agar nested route (mis. /penggunaan/pemberian/123) juga
// menandai parent dropdown (Penggunaan) sebagai active.
// Juga support activePaths untuk route yang redirect ke path lain.
// Jika child.to dan activePaths mengandung path yang sama, gunakan exact match saja
// untuk child.to (mencegah double-highlight pada route redirect).
//
// `exact` (opsional): untuk child section-index yang to-nya sama dengan parent
// (mis. Daftar Naskah /naskah-lainnya). Tanpa exact, startsWith(path+'/') akan
// menandai child ini aktif pada route sibling (Persetujuan, Tulis) yang berada
// di bawah path yang sama — padahal user belum masuk ke menu tersebut.
// exact=true membatasi ke match persis (+ activePaths).
const isActiveChild = (path, activePaths, exact = false) => {
  if (route.path === path) return true;
  // Untuk nested child route (path dengan children), pakai startsWith.
  // Dilewati untuk child bertanda exact (section-index).
  if (!exact && path && route.path.startsWith(path + '/')) return true;
  if (activePaths && Array.isArray(activePaths)) {
    return activePaths.some((p) => {
      // Hanya match jika path yang active berbeda dari path utama
      // (menghindari double-highlight saat user di /usulan-akses-berkas)
      if (p === path) return false;
      return route.path === p || route.path.startsWith(p + '/');
    });
  }
  return false;
};

// Helper recursive: cek apakah item (atau keturunannya) aktif
const isItemActiveRecursive = (item) => {
  if (!item) return false;
  if (item.to && isActiveChild(item.to, item.activePaths)) return true;
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isItemActiveRecursive(child));
  }
  return false;
};

// Logic Active State
const isActive = computed(() => {
  if (!props.item) return false;

  if (props.item.to && !hasChildren.value) {
    return isActivePath(props.item.to);
  }

  if (hasChildren.value) {
    // Parent active jika salah satu child (atau sub-child) exact match dengan route
    return props.item.children.some((child) => isItemActiveRecursive(child));
  }
  return false;
});

// Logic Auto open hanya saat route aktif (bukan karena badge notifikasi).
// Dropdown default tertutup saat login / buka web, kecuali sedang di menu tsb.
const shouldAutoOpen = computed(() => {
  if (!hasChildren.value) return false;
  return isActive.value;
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

// Saat route berubah, sinkronkan isOpen dengan shouldAutoOpen:
// - buka jika sedang di menu tsb
// - tutup jika sudah pindah ke menu lain (agar dropdown tidak "kebuka terus")
watch(
  () => route.path,
  () => {
    isOpen.value = shouldAutoOpen.value;
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
