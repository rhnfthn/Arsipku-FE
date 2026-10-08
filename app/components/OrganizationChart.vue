<script setup lang="ts">
import type { StructureChartNode, StructureChartAction } from '~/types/structure-chart';

const props = defineProps<{
  companyName: string;
  nodes: StructureChartNode[];
  expandedNodes: Record<string, boolean>;
  loadingNodes: Record<string, boolean>;
  searchResults: Record<string, string>;
  highlightNodeId: string | null;
}>();
const emit = defineEmits<{ action: [action: StructureChartAction, node: StructureChartNode] }>();
const zoom = ref(100);
const viewport = ref<HTMLElement | null>(null);
const chart = ref<HTMLElement | null>(null);
const { map, refresh, syncViewport, navigate, navigateByKeyboard } = useOrganizationMinimap(
  chart,
  viewport
);
const draggingMap = ref(false);
const startMapDrag = (event: PointerEvent) => {
  if (event.button !== 0) return;
  draggingMap.value = true;
  (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
  navigate(event);
};
const moveMapDrag = (event: PointerEvent) => {
  if (draggingMap.value) navigate(event);
};
const stopMapDrag = () => {
  draggingMap.value = false;
};
watch(
  () => [props.nodes, props.expandedNodes, zoom.value],
  async () => {
    await nextTick();
    refresh();
  },
  { deep: true }
);
const centerChart = async () => {
  await nextTick();
  if (viewport.value)
    viewport.value.scrollLeft = (viewport.value.scrollWidth - viewport.value.clientWidth) / 2;
};
const resetView = () => {
  zoom.value = 100;
  centerChart();
};
onMounted(centerChart);
watch(zoom, centerChart);
</script>

<template>
  <div>
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700"
    >
      <Paragraph variant="caption1" class="text-gray-500 dark:text-gray-400">{{
        $t('stu_chart_hint')
      }}</Paragraph>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="ghost"
          :disabled="zoom <= 50"
          :aria-label="$t('stu_chart_zoom_out')"
          @click="zoom -= 10"
        />
        <Paragraph
          variant="caption1m"
          class="w-12 text-center text-gray-600 dark:text-gray-300"
          aria-live="polite"
          >{{ zoom }}%</Paragraph
        >
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          :disabled="zoom >= 150"
          :aria-label="$t('stu_chart_zoom_in')"
          @click="zoom += 10"
        />
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          :aria-label="$t('stu_chart_reset')"
          @click="resetView"
        />
      </div>
    </div>
    <div class="relative">
      <div
        ref="viewport"
        @scroll.passive="syncViewport"
        class="min-h-64 max-h-[70vh] overflow-auto bg-gray-50/60 p-4 pb-32 dark:bg-gray-900/40"
        tabindex="0"
        role="region"
        :aria-label="$t('stu_chart_view')"
      >
        <div
          ref="chart"
          class="structure-chart flex min-w-full w-max flex-col items-center py-2"
          :style="{ zoom: zoom / 100 }"
        >
          <UCard
            data-chart-node-type="company"
            :ui="{ body: 'p-3' }"
            class="w-48 rounded-[var(--radius-card)] border border-primary-200 bg-primary-50 text-center shadow-sm dark:border-primary-800 dark:bg-primary-900/30"
          >
            <UIcon
              name="i-lucide-building-2"
              class="mb-1 h-4 w-4 text-primary-500 dark:text-primary-300"
            />
            <Heading variant="heading11sb" as="h3" class="text-gray-900 dark:text-white">{{
              companyName
            }}</Heading>
          </UCard>
          <ul class="structure-children">
            <OrganizationChartNode
              v-for="node in nodes"
              :key="`${node.type}:${node.id}`"
              :node="node"
              :expanded-nodes="expandedNodes"
              :loading-nodes="loadingNodes"
              :search-results="searchResults"
              :highlight-node-id="highlightNodeId"
              @action="(action, target) => emit('action', action, target)"
            />
          </ul>
        </div>
      </div>
      <div
        class="absolute bottom-3 right-3 z-[var(--z-sticky)] w-48 max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[var(--radius-input)] border border-gray-200 bg-white/95 p-2 shadow-md sm:w-56 dark:border-gray-700 dark:bg-gray-900/95"
      >
        <svg
          class="h-20 w-full sm:h-24 touch-none cursor-crosshair rounded focus-visible:outline-2 focus-visible:outline-primary-500"
          :viewBox="`0 0 ${map.width} ${map.height}`"
          tabindex="0"
          role="group"
          :aria-label="$t('stu_chart_minimap_hint')"
          @pointerdown.prevent="startMapDrag"
          @pointermove="moveMapDrag"
          @pointerup="stopMapDrag"
          @pointercancel="stopMapDrag"
          @lostpointercapture="stopMapDrag"
          @keydown="navigateByKeyboard"
        >
          <path
            v-for="(edge, index) in map.edges"
            :key="`edge-${index}`"
            :d="edge"
            fill="none"
            class="stroke-gray-400 dark:stroke-gray-500"
            vector-effect="non-scaling-stroke"
            stroke-width="0.5"
          />
          <rect
            v-for="(node, index) in map.nodes"
            :key="`node-${index}`"
            :x="node.x"
            :y="node.y"
            :width="node.width"
            :height="node.height"
            rx="4"
            :class="
              node.type === 'position'
                ? 'fill-warning-200 dark:fill-warning-700'
                : node.type === 'member'
                  ? 'fill-success-200 dark:fill-success-700'
                  : 'fill-primary-200 dark:fill-primary-700'
            "
          />
          <rect
            :x="map.view.x"
            :y="map.view.y"
            :width="map.view.width"
            :height="map.view.height"
            class="fill-primary-500/10 stroke-primary-500 dark:stroke-primary-300"
            vector-effect="non-scaling-stroke"
            stroke-width="1.5"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style>
.structure-chart {
  --structure-line: var(--color-gray-300);
}
.dark .structure-chart {
  --structure-line: var(--color-gray-600);
}
.structure-chart .structure-children {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin: 0;
  padding: 1rem 0 0;
  list-style: none;
}
.structure-chart .structure-children::before {
  position: absolute;
  top: 0;
  left: 50%;
  height: 0.5rem;
  border-left: 1px solid var(--structure-line);
  content: '';
}
.structure-chart .structure-branch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0.25rem;
}
.structure-chart .structure-branch::before {
  position: absolute;
  top: -0.5rem;
  left: 0;
  right: 0;
  height: 0.5rem;
  border-top: 1px solid var(--structure-line);
  content: '';
}
.structure-chart .structure-branch::after {
  position: absolute;
  top: -0.5rem;
  left: 50%;
  height: 0.5rem;
  border-left: 1px solid var(--structure-line);
  content: '';
}
.structure-chart .structure-branch:first-child::before {
  left: 50%;
}
.structure-chart .structure-branch:last-child::before {
  right: 50%;
}
.structure-chart .structure-branch:only-child::before {
  border: 0;
}
</style>
