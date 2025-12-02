<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  item: { type: Object, required: true },
  collapsed: Boolean,
})

const route = useRoute()
const isOpen = ref(false)   // State Accordion (Expand)
const isHovered = ref(false) // State Flyout (Hover)
const flyoutTop = ref(0)     // Posisi Flyout

// --- 1. DETEKSI ANAK ---
const hasChildren = computed(() => {
  return props.item.children && props.item.children.length > 0
})

// --- 2. LOGIC ACTIVE STATE ---
const isActive = computed(() => {
  if (props.item.to) {
    return route.path === props.item.to || route.path.startsWith(props.item.to + '/')
  }
  if (hasChildren.value) {
    return props.item.children.some(child => isChildActive(child))
  }
  return false
})

const isChildActive = (child) => {
  if (child.to && route.path.startsWith(child.to)) return true
  if (child.children && child.children.length > 0) return child.children.some(c => isChildActive(c))
  return false
}

// Auto open accordion jika aktif dan tidak collapsed
if (isActive.value && hasChildren.value && !props.collapsed) isOpen.value = true

watch(() => [route.path, props.collapsed], () => {
  if (isActive.value && hasChildren.value && !props.collapsed) {
    isOpen.value = true
  }
  // Tutup accordion jika sidebar di-collapse
  if (props.collapsed) {
    isOpen.value = false
  }
})

const toggle = () => {
  if (props.collapsed) return
  isOpen.value = !isOpen.value
}

// --- 3. LOGIC HOVER FLYOUT ---
const onMouseEnter = (e) => {
  // Hanya aktifkan flyout jika sidebar sedang collapsed
  if (props.collapsed) {
    const rect = e.currentTarget.getBoundingClientRect()
    flyoutTop.value = rect.top 
    isHovered.value = true
  }
}

const onMouseLeave = () => {
  isHovered.value = false
}

// --- STYLE CSS ---
const itemClasses = computed(() => [
  'group flex transition-all duration-200 font-medium relative w-full focus:outline-none select-none',
  // Kondisi Collapsed vs Expanded
  props.collapsed 
    ? 'flex-col justify-center items-center h-[4.5rem] px-1 py-1 mx-auto rounded-xl gap-1' // Kotak vertikal
    : 'flex-row items-center px-4 py-2.5 gap-3 rounded-full mb-1', // Baris horizontal
  
  // Warna Active vs Inactive
  isActive.value
    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
])
</script>

<template>
  <div 
    class="w-full relative"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <component 
      :is="hasChildren ? 'button' : 'NuxtLink'"
      :to="!hasChildren ? item.to : undefined"
      @click="hasChildren ? toggle() : null"
      :class="itemClasses"
    >
      
      <div class="relative flex items-center justify-center">
        <UIcon 
          v-if="item.icon" 
          :name="item.icon" 
          class="flex-shrink-0 transition-colors"
          :class="[
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700', 
            collapsed ? 'w-6 h-6' : 'w-5 h-5'
          ]" 
        />

        <span 
          v-if="collapsed && item.badge" 
          class="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[1rem] h-[1rem] flex items-center justify-center border-2 border-white dark:border-gray-900 z-10 shadow-sm"
        >
          {{ item.badge }}
        </span>
      </div>

      <span v-if="collapsed" class="text-[10px] leading-tight text-center w-full truncate px-0.5">
        {{ item.label }}
      </span>

      <template v-else>
        <span class="truncate flex-1 text-left text-sm">{{ item.label }}</span>
        
        <span v-if="item.badge" class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center ml-2">
          {{ item.badge }}
        </span>
        
        <UIcon 
          v-if="hasChildren"
          name="i-heroicons-chevron-down" 
          :class="['w-4 h-4 text-gray-400 transition-transform duration-300', isOpen && 'rotate-180']" 
        />
      </template>

    </component>


    <div 
      v-if="hasChildren && isOpen && !collapsed" 
      class="flex flex-col ml-[1.5rem] pl-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 transition-all duration-300 mt-1"
    >
      <SidebarItem v-for="(child, i) in item.children" :key="i" :item="child" :collapsed="collapsed" />
    </div>


    <div 
      v-if="collapsed && isHovered && hasChildren"
      class="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-2 animate-fade-in"
      :class="'w-56'"
      :style="{ top: `${flyoutTop}px`, left: '5.5rem' }"
    >
      <div class="absolute top-0 -left-6 w-6 h-full bg-transparent"></div>

      <div class="px-3 pb-2 mb-1 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
        {{ item.label }}
      </div>
      
      <div class="flex flex-col space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <NuxtLink 
          v-for="(child, i) in item.children" 
          :key="i"
          :to="child.to"
          class="flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          active-class="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
        >
          {{ child.label }}
        </NuxtLink>
      </div>
    </div>

    <div 
      v-if="collapsed && isHovered && !hasChildren"
      class="fixed z-[9999] bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in whitespace-nowrap"
      :style="{ top: `${flyoutTop + 10}px`, left: '5.5rem' }"
    >
      {{ item.label }}
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.15s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-5px); }
  to { opacity: 1; transform: translateX(0); }
}
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 10px; }
</style>