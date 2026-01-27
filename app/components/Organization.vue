<template>
  <div class="relative">
    <!-- Vertical line for non-last items -->
    <div
      v-if="!isLast"
      class="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gray-300"
    ></div>

    <div
      @mouseenter="$emit('setHovered', node.id)"
      @mouseleave="$emit('setHovered', null)"
      class="group relative mb-3"
    >
      <!-- Horizontal connector line -->
      <div
        v-if="level > 0"
        class="absolute left-[-18px] top-6 w-[18px] h-0.5 bg-gray-300"
      ></div>

      <!-- Node content -->
      <div
        :class="[
          'flex items-center gap-3 p-3 rounded-lg transition-colors relative',
          getNodeConfig().bgColor,
          getNodeConfig().borderColor,
        ]"
      >
        <!-- Expand/Collapse button -->
        <button
          v-if="hasChildren"
          @click="$emit('toggleNode', node.id)"
          class="p-1 hover:bg-gray-200 rounded transition-colors z-10 flex-shrink-0"
        >
          <ChevronDown v-if="expandedNodes[node.id]" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>
        <div v-else class="w-6 flex-shrink-0"></div>

        <!-- Icon -->
        <component
          :is="getNodeConfig().icon"
          :class="['w-4 h-4 flex-shrink-0', getNodeConfig().iconColor]"
        />

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <span :class="['text-sm', getNodeConfig().textColor]">{{
            node.name
          }}</span>
          <p v-if="node.pn" :class="['text-xs', getNodeConfig().iconColor]">
            {{ node.pn }}
          </p>
        </div>

        <!-- Action buttons on hover -->
        <div
          v-if="hoveredNode === node.id"
          class="absolute right-3 hidden group-hover:flex items-center gap-1 bg-white shadow-md rounded-lg p-1 z-20"
        >
          <button
            v-if="getNodeConfig().canAddPosition"
            @click="$emit('openAddPosition', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
          >
            <User class="w-3 h-3" />
            Tambah Posisi
          </button>
          <button
            v-if="getNodeConfig().canAddUnit"
            @click="$emit('openAddUnit', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
          >
            <Plus class="w-3 h-3" />
            Tambah Unit
          </button>
          <button
            v-if="getNodeConfig().canAddMember"
            @click="$emit('openAddMember', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-50 rounded transition-colors"
          >
            <UserPlus class="w-3 h-3" />
            Tambah Anggota
          </button>
          <button
            v-if="!getNodeConfig().hideEdit"
            @click="$emit('openEdit', node, node.type)"
            class="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Pencil class="w-3 h-3 text-gray-500" />
          </button>
          <button
            v-if="!getNodeConfig().hideDelete"
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
      class="ml-9 space-y-2 relative"
    >
      <Organization
        v-for="(child, idx) in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :is-last="idx === node.children.length - 1"
        :expanded-nodes="expandedNodes"
        :hovered-node="hoveredNode"
        @toggle-node="$emit('toggleNode', $event)"
        @set-hovered="$emit('setHovered', $event)"
        @open-add-unit="$emit('openAddUnit', $event)"
        @open-add-position="$emit('openAddPosition', $event)"
        @open-add-member="$emit('openAddMember', $event)"
        @open-edit="$emit('openEdit', $event)"
        @open-delete="$emit('openDelete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  ChevronDown,
  ChevronRight,
  User,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Building,
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
  "openAddMember",
]);

const hasChildren = computed(() => {
  return !!props.node.children?.length;
});

const getNodeConfig = () => {
  switch (props.node.type) {
    case "direktorat":
      return {
        bgColor: "bg-primary-50 hover:bg-primary-100",
        borderColor: "border-l-4 border-primary-600",
        textColor: "text-primary-900 font-semibold",
        iconColor: "text-primary-700",
        icon: Building2,
        canAddPosition: true,
        canAddUnit: false,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
    case "position":
      return {
        bgColor: "bg-orange-50 hover:bg-orange-100",
        borderColor: "border-l-4 border-orange-600",
        textColor: "text-orange-900 font-semibold",
        iconColor: "text-orange-700",
        icon: User,
        canAddPosition: false,
        canAddUnit: true,
        canAddMember: true,
        hideEdit: false,
        hideDelete: false,
      };
    case "unit":
      return {
        bgColor: "bg-primary-50 hover:bg-primary-100",
        borderColor: "border-l-4 border-primary-500",
        textColor: "text-primary-900 font-medium",
        iconColor: "text-primary-700",
        icon: Building,
        canAddPosition: true,
        canAddUnit: false,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
    case "member":
      return {
        bgColor: "bg-gray-50 hover:bg-gray-100",
        borderColor: "border-l-4 border-gray-500",
        textColor: "text-black font-medium",
        // iconColor: "text-green-700",
        icon: User,
        canAddPosition: false,
        canAddUnit: false,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
    default:
      return {
        bgColor: "bg-gray-50 hover:bg-gray-100",
        borderColor: "border-l-4 border-gray-400",
        textColor: "text-gray-900 font-medium",
        iconColor: "text-gray-700",
        icon: Building,
        canAddPosition: false,
        canAddUnit: false,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
  }
};
</script>
