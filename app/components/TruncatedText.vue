<template>
  <span
    ref="trigger"
    class="block min-w-0 truncate"
    :class="textClass"
    :aria-label="fullText"
    tabindex="0"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    {{ fullText }}
  </span>

  <Teleport to="body">
    <div
      v-if="tooltip.visible"
      role="tooltip"
      class="pointer-events-none fixed z-[9999] max-h-[40vh] overflow-y-auto rounded-lg bg-gray-900 px-3 py-2 text-sm font-normal text-white shadow-xl"
      :style="{
        top: `${tooltip.top}px`,
        left: `${tooltip.left}px`,
        maxWidth: 'min(26rem, calc(100vw - 24px))',
      }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

const props = defineProps<{
  text?: string | number | null;
  textClass?: string;
}>();

const trigger = ref<HTMLElement | null>(null);
const tooltip = reactive({ visible: false, text: '', top: 0, left: 0 });
const fullText = computed(() => {
  const value = String(props.text ?? '').trim();
  return value || '-';
});

const showTooltip = () => {
  const target = trigger.value;
  if (!target || target.scrollWidth <= target.clientWidth) return;

  const rect = target.getBoundingClientRect();
  const padding = 12;
  const width = Math.min(416, window.innerWidth - padding * 2);
  const height = Math.min(320, window.innerHeight * 0.4);
  const left = Math.min(Math.max(padding, rect.left), window.innerWidth - width - padding);
  const below = rect.bottom + 8;
  const top = below + height <= window.innerHeight - padding
    ? below
    : Math.max(padding, rect.top - height - 8);

  tooltip.text = fullText.value;
  tooltip.left = left;
  tooltip.top = top;
  tooltip.visible = true;
};

const hideTooltip = () => {
  tooltip.visible = false;
};
</script>
