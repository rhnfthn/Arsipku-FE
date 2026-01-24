<template>
  <div class="mb-3">
    <!-- Node Container -->
    <div
      @mouseenter="$emit('setHovered', node.id)"
      @mouseleave="$emit('setHovered', null)"
      class="group relative"
    >
      <!-- Vertical Line -->
      <div
        v-if="!isLast"
        class="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gray-300"
      ></div>

      <!-- Main Node -->
      <div
        :class="[
          'flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors relative',
          getBorderColorClass(),
        ]"
      >
        <!-- Toggle Button -->
        <button
          v-if="hasChildren"
          @click="$emit('toggleNode', node.id)"
          class="p-1 hover:bg-gray-200 rounded transition-colors z-10"
        >
          <ChevronDown v-if="expandedNodes[node.id]" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <div v-else class="w-6"></div>

        <!-- Icon -->
        <component :is="getIcon()" :class="['w-4 h-4', getIconColorClass()]" />

        <!-- Content -->
        <div class="flex-1">
          <span :class="['text-sm', getTextColorClass()]">{{ node.name }}</span>
          <p v-if="node.pn" class="text-xs" :class="getSubTextColorClass()">
            {{ node.pn }}
          </p>
        </div>

        <!-- Action Buttons on Hover -->
        <div
          v-if="hoveredNode === node.id"
          class="absolute right-3 hidden group-hover:flex flex items-center gap-1 bg-white shadow-md rounded-lg p-1"
        >
          <button
            v-if="canAddPosition"
            @click="$emit('openAddPosition', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
          >
            <User class="w-3 h-3" />
            Tambah Posisi
          </button>
          <button
            v-if="canAddUnit"
            @click="$emit('openAddUnit', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Plus class="w-3 h-3" />
            Tambah Unit
          </button>
          <button
            v-if="canAddAnggota"
            @click="$emit('openAddAnggota', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
          >
            <UserPlus class="w-3 h-3" />
            Tambah Anggota
          </button>
          <button
            @click="$emit('openEdit', node, nodeType)"
            class="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Pencil class="w-3 h-3 text-gray-500" />
          </button>
          <button
            @click="$emit('openDelete', node)"
            class="p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 class="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Children -->
    <div
      v-if="expandedNodes[node.id] && hasChildren"
      :class="getChildrenMarginClass()"
    >
      <!-- Direktur -->
      <div v-if="node.direktur" class="relative">
        <!-- Horizontal Line -->
        <div class="absolute left-[-18px] top-5 w-4 h-0.5 bg-gray-300"></div>

        <OrganizationNode
          :node="node.direktur"
          :level="level + 1"
          :is-last="false"
          :parent-type="'direktur'"
          :expanded-nodes="expandedNodes"
          :hovered-node="hoveredNode"
          @toggle-node="$emit('toggleNode', $event)"
          @set-hovered="$emit('setHovered', $event)"
          @open-edit="$emit('openEdit', $event, 'direktur')"
          @open-delete="$emit('openDelete', $event)"
          @open-add-unit="$emit('openAddUnit', $event)"
          @open-add-position="$emit('openAddPosition', $event)"
          @open-add-anggota="$emit('openAddAnggota', $event)"
        />
      </div>

      <!-- Divisions -->
      <div
        v-if="node.divisions"
        :class="level > 0 ? 'ml-9 space-y-2 relative' : 'space-y-2'"
      >
        <div
          v-for="(division, idx) in node.divisions"
          :key="division.id"
          class="relative"
        >
          <!-- Horizontal Line -->
          <div
            v-if="level > 0"
            class="absolute left-[-18px] top-5 w-4 h-0.5 bg-gray-300"
          ></div>

          <OrganizationNode
            :node="division"
            :level="level + 1"
            :is-last="idx === node.divisions.length - 1"
            :parent-type="'division'"
            :expanded-nodes="expandedNodes"
            :hovered-node="hoveredNode"
            @toggle-node="$emit('toggleNode', $event)"
            @set-hovered="$emit('setHovered', $event)"
            @open-edit="$emit('openEdit', $event, 'division')"
            @open-delete="$emit('openDelete', $event)"
            @open-add-unit="$emit('openAddUnit', $event)"
            @open-add-position="$emit('openAddPosition', $event)"
            @open-add-anggota="$emit('openAddAnggota', $event)"
          />
        </div>
      </div>

      <!-- Anggota/Employees -->
      <div v-if="node.anggota" class="ml-9 space-y-2 relative">
        <div v-for="anggota in node.anggota" :key="anggota.id" class="relative">
          <div class="absolute left-[-18px] top-5 w-4 h-0.5 bg-gray-300"></div>

          <OrganizationNode
            :node="anggota"
            :level="level + 1"
            :is-last="false"
            :parent-type="'anggota'"
            :expanded-nodes="expandedNodes"
            :hovered-node="hoveredNode"
            @toggle-node="$emit('toggleNode', $event)"
            @set-hovered="$emit('setHovered', $event)"
            @open-edit="$emit('openEdit', $event, 'anggota')"
            @open-delete="$emit('openDelete', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Building,
  User,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
} from "lucide-vue-next";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
  parentType: {
    type: String,
    default: "",
  },
  expandedNodes: {
    type: Object,
    required: true,
  },
  hoveredNode: {
    type: [String, null],
    default: null,
  },
});

defineEmits([
  "toggleNode",
  "setHovered",
  "openEdit",
  "openDelete",
  "openAddUnit",
  "openAddPosition",
  "openAddAnggota",
]);

const nodeType = computed(() => {
  if (props.node.direktur || props.node.divisions) return "direktorat";
  if (props.node.pn && props.node.divisions) return "direktur";
  if (props.node.divisions) return "division";
  if (props.node.pn) return "anggota";
  return "unit";
});

const hasChildren = computed(() => {
  return !!(
    props.node.direktur ||
    props.node.divisions?.length ||
    props.node.anggota?.length
  );
});

const canAddPosition = computed(() => {
  return nodeType.value === "direktorat";
});

const canAddUnit = computed(() => {
  return ["direktorat", "direktur", "division"].includes(nodeType.value);
});

const canAddAnggota = computed(() => {
  return nodeType.value === "direktur";
});

const getIcon = () => {
  if (nodeType.value === "direktur" || nodeType.value === "anggota")
    return User;
  return Building;
};

const getBorderColorClass = () => {
  if (nodeType.value === "direktorat")
    return "bg-white border-l-4 border-primary";
  if (nodeType.value === "direktur")
    return "bg-orange-50 border-l-4 border-orange-500";
  if (nodeType.value === "division")
    return "bg-blue-50 border-l-4 border-blue-500";
  return "bg-gray-50 border-l-4 border-gray-400";
};

const getIconColorClass = () => {
  if (nodeType.value === "direktur") return "text-orange-700";
  if (nodeType.value === "division") return "text-blue-700";
  if (nodeType.value === "anggota") return "text-green-700";
  return "text-gray-700";
};

const getTextColorClass = () => {
  if (nodeType.value === "direktur") return "font-medium text-orange-900";
  if (nodeType.value === "division") return "font-medium text-blue-900";
  if (nodeType.value === "anggota") return "font-medium text-green-900";
  return "font-semibold text-gray-900";
};

const getSubTextColorClass = () => {
  if (nodeType.value === "direktur") return "text-orange-700";
  if (nodeType.value === "anggota") return "text-green-700";
  return "text-gray-600";
};

const getChildrenMarginClass = () => {
  return "ml-9 mt-2 space-y-2 relative";
};
</script>
