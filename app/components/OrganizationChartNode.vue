<script setup lang="ts">
import type { StructureChartNode, StructureChartAction } from '~/types/structure-chart';
import { formatDateSlash } from '~/utils/mail-helpers';

const props = defineProps<{
  node: StructureChartNode;
  expandedNodes: Record<string, boolean>;
  loadingNodes: Record<string, boolean>;
  searchResults: Record<string, string>;
  highlightNodeId: string | null;
}>();
const emit = defineEmits<{
  action: [action: StructureChartAction, node: StructureChartNode];
}>();
const { t } = useI18n();
const isUnit = computed(() => ['unit', 'direktorat'].includes(props.node.type));
const members = computed(() =>
  props.node.type === 'position'
    ? props.node.children.filter((child) => child.type === 'member')
    : []
);
const branches = computed(() => props.node.children.filter((child) => child.type !== 'member'));
const canExpand = computed(
  () => isUnit.value && (!!branches.value.length || !props.node._positionsLoaded)
);
const isHighlighted = computed(
  () =>
    !!props.searchResults[props.node.id] ||
    props.highlightNodeId === props.node.id ||
    members.value.some(
      (person) => !!props.searchResults[person.id] || props.highlightNodeId === person.id
    )
);
watch(
  () => [props.node.id, props.node._personsLoaded],
  () => {
    if (props.node.type === 'position' && !props.node._personsLoaded)
      emit('action', 'load-members', props.node);
  },
  { immediate: true }
);
const icon = computed(() =>
  isUnit.value
    ? 'i-lucide-building-2'
    : props.node.type === 'position'
      ? 'i-lucide-user-round'
      : 'i-lucide-users'
);
const actions = computed(() => [
  ...(isUnit.value
    ? [
        {
          label: t('stu_tambah_unit'),
          icon: 'i-lucide-plus',
          onSelect: () => emit('action', 'add-unit', props.node),
        },
        {
          label: t('stu_modal_add_posisi'),
          icon: 'i-lucide-user-round-plus',
          onSelect: () => emit('action', 'add-position', props.node),
        },
      ]
    : props.node.type === 'position'
      ? [
          {
            label: t('stu_modal_add_anggota'),
            icon: 'i-lucide-user-plus',
            onSelect: () => emit('action', 'add-member', props.node),
          },
        ]
      : []),
  {
    label: t('stu_chart_edit'),
    icon: 'i-lucide-pencil',
    onSelect: () => emit('action', 'edit', props.node),
  },
  {
    label: t('stu_chart_delete'),
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => emit('action', 'delete', props.node),
  },
]);
</script>

<template>
  <li class="structure-branch">
    <UCard
      :data-node-id="node.id"
      :data-chart-node-type="node.type"
      :ui="{ body: 'p-2' }"
      :class="[
        'relative w-40 shrink-0 rounded-[var(--radius-card)] border shadow-sm text-left',
        isUnit
          ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/30'
          : node.type === 'position'
            ? 'border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20'
            : 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20',
        isHighlighted ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' : '',
      ]"
    >
      <div class="mb-1 flex items-center justify-between gap-1">
        <UBadge
          :color="isUnit ? 'primary' : node.type === 'position' ? 'warning' : 'success'"
          variant="subtle"
          size="xs"
          :icon="icon"
        >
          {{
            $t(
              isUnit
                ? 'stu_label_unit'
                : node.type === 'position'
                  ? 'stu_label_posisi'
                  : 'stu_label_anggota'
            )
          }}
        </UBadge>
        <div class="flex items-center gap-0.5">
          <UButton
            v-if="canExpand"
            color="neutral"
            variant="ghost"
            size="xs"
            class="p-0.5"
            :ui="{ leadingIcon: 'size-3.5' }"
            :loading="loadingNodes[node.id]"
            :aria-expanded="!!expandedNodes[node.id]"
            :aria-label="`${$t(expandedNodes[node.id] ? 'stu_chart_collapse' : 'stu_chart_expand')}: ${node.name}`"
            :icon="expandedNodes[node.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            @click="emit('action', 'toggle', node)"
          />
          <UDropdownMenu :items="actions">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-ellipsis"
              size="xs"
              class="p-0.5"
              :ui="{ leadingIcon: 'size-3.5' }"
              :aria-label="$t('stu_chart_actions', { name: node.name })"
            />
          </UDropdownMenu>
        </div>
      </div>
      <UTooltip :text="node.name">
        <Heading
          variant="heading11sb"
          as="h3"
          class="h-9 line-clamp-2 break-words leading-[18px] text-gray-900 dark:text-white"
          >{{ node.name }}</Heading
        >
      </UTooltip>
      <div class="mt-1 flex h-4 items-center justify-between gap-1">
        <UTooltip :text="`${formatDateSlash(node.startDate)} – ${formatDateSlash(node.endDate)}`">
          <Paragraph variant="caption2" class="truncate text-gray-500 dark:text-gray-400">
            {{ node.type === 'member' ? node.persnum : node.positionCode || node.organizationCode }}
          </Paragraph>
        </UTooltip>
        <UBadge v-if="node.bodTag" color="warning" variant="subtle" size="xs">{{
          node.bodTag
        }}</UBadge>
      </div>
      <div
        v-if="node.type === 'position'"
        class="mt-2 space-y-1 border-t border-warning-200 pt-2 dark:border-warning-800"
      >
        <USkeleton v-if="loadingNodes[node.id]" class="h-10 w-full" />
        <template v-else-if="node._personsLoaded">
          <OrganizationChartPerson
            v-for="person in members"
            :key="person.id"
            :person="person"
            :highlighted="!!searchResults[person.id] || highlightNodeId === person.id"
            @action="(action, target) => emit('action', action, target)"
          />
          <Paragraph
            v-if="!members.length"
            variant="caption2"
            class="text-gray-500 dark:text-gray-400"
            >{{ $t('stu_chart_no_members') }}</Paragraph
          >
        </template>
        <UButton
          v-else
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="xs"
          class="w-full justify-center"
          @click="emit('action', 'load-members', node)"
          >{{ $t('stu_chart_retry_members') }}</UButton
        >
      </div>
    </UCard>
    <ul v-if="expandedNodes[node.id] && branches.length" class="structure-children">
      <OrganizationChartNode
        v-for="child in branches"
        :key="`${child.type}:${child.id}`"
        :node="child"
        :expanded-nodes="expandedNodes"
        :loading-nodes="loadingNodes"
        :search-results="searchResults"
        :highlight-node-id="highlightNodeId"
        @action="(action, target) => emit('action', action, target)"
      />
    </ul>
  </li>
</template>
