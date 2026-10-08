<script setup lang="ts">
import type { StructureChartNode, StructureChartAction } from '~/types/structure-chart';
import { formatDateSlash, getInitials } from '~/utils/mail-helpers';

defineProps<{ person: StructureChartNode; highlighted: boolean }>();
const emit = defineEmits<{ action: [action: StructureChartAction, node: StructureChartNode] }>();
</script>

<template>
  <div
    :data-node-id="person.id"
    :class="['rounded-[var(--radius-input)]', highlighted ? 'ring-2 ring-primary-500' : '']"
  >
    <UPopover>
      <UButton
        color="neutral"
        variant="ghost"
        class="w-full justify-start gap-2 p-1 text-left"
        :aria-label="$t('stu_chart_person_detail', { name: person.name })"
      >
        <ProfileAvatar
          size="sm"
          :persnum="person.persnum"
          :alt="person.name"
          avatar-class="shrink-0 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        >
          {{ getInitials(person.name.trim()) }}
        </ProfileAvatar>
        <div class="min-w-0 flex-1">
          <Paragraph
            variant="body3sb"
            class="line-clamp-2 break-words text-gray-900 dark:text-white"
            >{{ person.name }}</Paragraph
          >
          <Paragraph variant="caption2" class="truncate text-gray-500 dark:text-gray-400">{{
            person.persnum
          }}</Paragraph>
        </div>
      </UButton>
      <template #content>
        <div class="flex w-64 flex-col items-center gap-2 p-4 text-center">
          <ProfileAvatar
            size="3xl"
            :persnum="person.persnum"
            :alt="person.name"
            avatar-class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
          >
            {{ getInitials(person.name.trim()) }}
          </ProfileAvatar>
          <Heading
            variant="heading11sb"
            as="h4"
            class="break-words text-gray-900 dark:text-white"
            >{{ person.name }}</Heading
          >
          <Paragraph variant="caption1" class="text-gray-500 dark:text-gray-400"
            >{{ $t('stu_chart_employee_number') }}: {{ person.persnum || '–' }}</Paragraph
          >
          <Paragraph variant="caption2" class="text-gray-500 dark:text-gray-400"
            >{{ formatDateSlash(person.startDate) }} –
            {{ formatDateSlash(person.endDate) }}</Paragraph
          >
          <div class="mt-1 flex gap-2">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="emit('action', 'edit', person)"
              >{{ $t('stu_chart_edit') }}</UButton
            >
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              @click="emit('action', 'delete', person)"
              >{{ $t('stu_chart_delete') }}</UButton
            >
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
