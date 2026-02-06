<template>
  <div class="relative">
    <!-- Vertical line for non-last items -->
    <div
      v-if="!isLast"
      class="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"
    ></div>

    <div
      @mouseenter="$emit('setHovered', node.id)"
      @mouseleave="$emit('setHovered', null)"
      class="group relative mb-3"
    >
      <!-- Horizontal connector line -->
      <div
        v-if="level > 0"
        class="absolute left-[-18px] top-6 w-[18px] h-0.5 bg-gray-300 dark:bg-gray-600"
      ></div>

      <!-- Node content -->
      <div
        :data-node-id="node.id"
        :class="[
          'flex items-center gap-3 p-3 rounded-lg transition-all relative',
          getNodeConfig().bgColor,
          getNodeConfig().borderColor,
          isSearchHighlighted
            ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg scale-[1.02]'
            : '',
          highlightNodeId === node.id
            ? 'ring-4 ring-blue-500 dark:ring-blue-400 shadow-2xl animate-pulse'
            : '',
        ]"
      >
        <!-- Expand/Collapse button -->
        <button
          v-if="hasChildren"
          @click="$emit('toggleNode', node)"
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors z-10 flex-shrink-0"
        >
          <ChevronDown
            v-if="expandedNodes[node.id]"
            class="w-4 h-4 dark:text-gray-300"
          />
          <ChevronRight v-else class="w-4 h-4 dark:text-gray-300" />
        </button>
        <div v-else class="w-6 flex-shrink-0"></div>

        <!-- Icon -->
        <component
          :is="getNodeConfig().icon"
          :class="['w-4 h-4 flex-shrink-0', getNodeConfig().iconColor]"
        />

        <!-- Content with search highlight -->
        <div class="flex-1 min-w-0">
          <span
            :class="['text-sm', getNodeConfig().textColor]"
            v-html="highlightText(node.name)"
          ></span>
          <p
            v-if="node.persnum"
            :class="['text-xs mt-0.5', getNodeConfig().iconColor]"
          >
            PN: {{ node.persnum }}
          </p>
          <div
            v-if="isSearchHighlighted"
            class="flex items-center gap-1 mt-1.5"
          >
            <div
              class="w-2 h-2 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-pulse"
            ></div>
            <span
              class="text-xs text-yellow-700 dark:text-yellow-400 font-medium"
            >
              {{ getSearchResultLabel() }}
            </span>
          </div>
        </div>

        <!-- Action buttons on hover -->
        <div
          v-if="hoveredNode === node.id"
          class="absolute right-3 hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-700 shadow-md rounded-lg p-1 z-20"
        >
          <button
            v-if="getNodeConfig().canAddPosition"
            @click="$emit('openAddPosition', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
          >
            <User class="w-3 h-3" />
            Tambah Posisi
          </button>
          <button
            v-if="getNodeConfig().canAddUnit"
            @click="$emit('openAddUnit', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
          >
            <Plus class="w-3 h-3" />
            Tambah Unit
          </button>
          <button
            v-if="getNodeConfig().canAddMember"
            @click="$emit('openAddMember', node)"
            class="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors dark:text-gray-300"
          >
            <UserPlus class="w-3 h-3" />
            Tambah Anggota
          </button>
          <button
            v-if="!getNodeConfig().hideEdit"
            @click="$emit('openEdit', node, node.type)"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <Pencil class="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            v-if="!getNodeConfig().hideDelete"
            @click="$emit('openDelete', node)"
            class="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 class="w-3 h-3 text-red-500 dark:text-red-400" />
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
        :search-query="searchQuery"
        :search-results="searchResults"
        :highlight-node-id="highlightNodeId"
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
  UserStar,
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
  searchQuery: {
    type: String,
    default: "",
  },
  searchResults: {
    type: Object,
    default: () => ({}),
  },
  highlightNodeId: {
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
  if (props.node.type === "unit" || props.node.type === "direktorat") {
    return true;
  }

  if (props.node.type === "position") {
    return true;
  }

  return !!props.node.children?.length;
});

const isSearchHighlighted = computed(() => {
  if (!props.searchQuery) return false;

  // Check if this node is in search results
  if (props.searchResults && props.searchResults[props.node.id]) {
    return true;
  }

  // Fallback: text matching
  const query = props.searchQuery.toLowerCase();
  const nodeName = (props.node.name || "").toLowerCase();
  const nodeShortText = (props.node.shortText || "").toLowerCase();
  const nodeLongText = (props.node.longText || "").toLowerCase();

  return (
    nodeName.includes(query) ||
    nodeShortText.includes(query) ||
    nodeLongText.includes(query)
  );
});

const getSearchResultLabel = () => {
  if (!props.searchResults || !props.searchResults[props.node.id]) {
    return "Hasil pencarian";
  }

  const resultType = props.searchResults[props.node.id];

  switch (resultType) {
    case "organization":
      return "📁 Unit ditemukan";
    case "position":
      return "👤 Posisi ditemukan";
    case "person":
      return "👥 Anggota ditemukan";
    default:
      return "Hasil pencarian";
  }
};

const highlightText = (text: string) => {
  if (!props.searchQuery || !text) return text;

  const query = props.searchQuery;
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");

  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded font-semibold">$1</mark>',
  );
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getNodeConfig = () => {
  switch (props.node.type) {
    case "direktorat":
      return {
        bgColor:
          "bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30",
        borderColor: "border-l-4 border-primary-600 dark:border-primary-500",
        textColor: "text-primary-900 dark:text-primary-100 font-semibold",
        iconColor: "text-primary-700 dark:text-primary-400",
        icon: Building2,
        canAddPosition: true,
        canAddUnit: true,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
    case "position":
      const isChief = !!props.node.bodTag;
      return {
        bgColor: isChief
          ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
          : "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30",
        borderColor: isChief
          ? "border-l-4 border-red-600 dark:border-red-500"
          : "border-l-4 border-orange-600 dark:border-orange-500",
        textColor:
          "font-semibold " +
          (isChief
            ? "text-red-900 dark:text-red-100"
            : "text-orange-900 dark:text-orange-100"),
        iconColor: isChief
          ? "text-red-700 dark:text-red-400"
          : "text-orange-700 dark:text-orange-400",
        icon: isChief ? UserStar : User,
        canAddPosition: false,
        canAddUnit: false,
        canAddMember: true,
        hideEdit: false,
        hideDelete: false,
      };

    case "unit":
      return {
        bgColor:
          "bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30",
        borderColor: "border-l-4 border-primary-500 dark:border-primary-400",
        textColor: "text-primary-900 dark:text-primary-100 font-medium",
        iconColor: "text-primary-700 dark:text-primary-400",
        icon: Building,
        canAddPosition: true,
        canAddUnit: true,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
    case "member":
      return {
        bgColor:
          "bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-700",
        borderColor: "border-l-4 border-gray-500 dark:border-gray-400",
        textColor: "text-black dark:text-white font-medium",
        iconColor: "text-gray-600 dark:text-gray-400",
        icon: User,
        canAddPosition: false,
        canAddUnit: false,
        canAddMember: false,
        hideEdit: false,
        hideDelete: false,
      };
    default:
      return {
        bgColor:
          "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600",
        borderColor: "border-l-4 border-gray-400 dark:border-gray-500",
        textColor: "text-gray-900 dark:text-gray-100 font-medium",
        iconColor: "text-gray-700 dark:text-gray-400",
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
