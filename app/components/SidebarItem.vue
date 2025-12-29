<template>
  <div class="mb-0.5">

    <div v-if="hasChildren" @click="toggle" :class="containerClasses">
      <UIcon v-if="item.icon" :name="item.icon" :class="iconClasses" />
      <span class="flex-1 text-[14px] truncate leading-5">{{ item.label }}</span>

      <span v-if="item.badge"
        class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none">
        {{ item.badge }}
      </span>

      <UIcon name="i-heroicons-chevron-down"
        :class="['w-3 h-3 transition-transform duration-200 text-gray-500', isOpen && 'rotate-180']" />
    </div>

    <NuxtLink v-else :to="item.to" :class="containerClasses">
      <UIcon v-if="item.icon" :name="item.icon" :class="iconClasses" />
      <span class="flex-1 text-[14px] truncate leading-5">{{ item.label }}</span>

      <span v-if="item.badge"
        class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] h-5 flex items-center justify-center leading-none">
        {{ item.badge }}
      </span>
    </NuxtLink>

    <div v-if="hasChildren && isOpen" class="mt-0.5 mx-3 space-y-0.5">
      <NuxtLink v-for="(child, i) in item.children" :key="i" :to="child.to"
        class="whitespace-nowrap flex items-center px-4 py-2.5 my-1 pl-12 rounded-full text-[14px] transition-colors dark:text-gray-400"
        :class="route.path === child.to ? 'bg-[#D3E3FD] font-bold text-gray-900' : 'text-gray-600 hover:bg-gray-100'">
        {{ child.label }}
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  item: { type: Object, required: true },
  collapsed: Boolean,
})

const route = useRoute()
const isOpen = ref(false)

const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

// Logic Active State
const isActive = computed(() => {
  if (props.item.to && !hasChildren.value) {
    return route.path === props.item.to || route.path.startsWith(props.item.to + '/')
  }
  if (hasChildren.value) {
    return props.item.children.some(child => child.to && route.path.startsWith(child.to))
  }
  return false
})

if (isActive.value && hasChildren.value) isOpen.value = true
watch(() => route.path, () => {
  if (isActive.value && hasChildren.value) isOpen.value = true
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

// Style tetap sama untuk kedua kondisi
const containerClasses = computed(() => [
  'flex items-center gap-3 my-1.5 px-4 py-2.5 mx-0 rounded-full min-w-[200px] cursor-pointer transition-colors duration-200 select-none',
  isActive.value
    ? 'bg-[#D3E3FD] text-gray-900 font-bold'
    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  'mx-3'
])

const iconClasses = computed(() => [
  'w-5 h-5',
  isActive.value ? 'text-gray-900' : 'text-gray-600 dark:text-gray-400'
])
</script>
