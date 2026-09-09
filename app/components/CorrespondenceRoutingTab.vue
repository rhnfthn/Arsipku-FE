<template>
  <section class="space-y-6 p-4 sm:p-6" :aria-busy="loading">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <Heading variant="heading9b" as="h2">{{ t('title') }}</Heading>
        <Paragraph variant="body2" class="text-muted">{{ t('intro') }}</Paragraph>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        :loading="loading"
        :disabled="!!busy"
        @click="load"
        >{{ t('refresh') }}</UButton
      >
    </div>
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="t('error')"
      :description="error"
    />
    <div v-if="loading" class="grid gap-4 sm:grid-cols-3">
      <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
    </div>
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-3">
        <div
          class="relative overflow-hidden rounded-xl border border-default bg-default p-5"
        >
          <div class="flex items-center gap-2">
            <span
              class="flex size-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-zap" class="size-4 text-primary-600 dark:text-primary-400" />
            </span>
            <Paragraph variant="body3" class="text-muted">{{ t('runtime') }}</Paragraph>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <UBadge
              :color="health?.feature_flag_enabled ? 'success' : 'neutral'"
              variant="soft"
              size="lg"
              >{{
                health ? t(health.feature_flag_enabled ? 'enabled' : 'disabled') : t('unknown')
              }}</UBadge
            >
          </div>
        </div>
        <div class="relative overflow-hidden rounded-xl border border-default bg-default p-5">
          <div class="flex items-center gap-2">
            <span
              class="flex size-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-users" class="size-4 text-primary-600 dark:text-primary-400" />
            </span>
            <Paragraph variant="body3" class="text-muted">{{ t('roles') }}</Paragraph>
          </div>
          <div class="mt-3 flex items-baseline gap-1.5">
            <Heading variant="heading7b" class="text-2xl">{{
              roles.filter((r) => r.is_active).length
            }}</Heading>
            <Paragraph variant="body3" class="text-muted">/ {{ roles.length }}</Paragraph>
          </div>
          <Paragraph variant="caption1" class="mt-1 text-muted">{{ t('activeTotal') }}</Paragraph>
        </div>
        <div class="relative overflow-hidden rounded-xl border border-default bg-default p-5">
          <div class="flex items-center gap-2">
            <span
              class="flex size-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon
                name="i-lucide-git-branch"
                class="size-4 text-primary-600 dark:text-primary-400"
              />
            </span>
            <Paragraph variant="body3" class="text-muted">{{ t('rules') }}</Paragraph>
          </div>
          <div class="mt-3 flex items-baseline gap-1.5">
            <Heading variant="heading7b" class="text-2xl">{{
              rules.filter((r) => r.is_active).length
            }}</Heading>
            <Paragraph variant="body3" class="text-muted">/ {{ rules.length }}</Paragraph>
          </div>
          <Paragraph variant="caption1" class="mt-1 text-muted">{{ t('activeTotal') }}</Paragraph>
        </div>
      </div>
    </template>

    <UCard v-if="managerSdiAccessRule">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <Heading variant="heading10sb">{{ t('managerSdiAccess') }}</Heading>
            <UBadge :color="managerSdiAccessEnabled ? 'success' : 'neutral'" variant="soft">{{
              t(managerSdiAccessEnabled ? 'enabled' : 'disabled')
            }}</UBadge>
          </div>
          <Paragraph variant="body3" class="text-muted">{{ t('managerSdiAccessHint') }}</Paragraph>
          <Paragraph v-if="!health?.feature_flag_enabled" variant="caption1" class="text-warning">
            {{ t('managerSdiRuntimeOff') }}
          </Paragraph>
        </div>
        <UButton
          v-if="can('activate-rule')"
          :icon="isActive(managerSdiAccessRule.is_active) ? 'i-lucide-power-off' : 'i-lucide-power'"
          :color="isActive(managerSdiAccessRule.is_active) ? 'warning' : 'success'"
          variant="outline"
          :loading="busy === managerSdiAccessRule.id"
          :disabled="!!busy"
          @click="toggleRule(managerSdiAccessRule)"
          >{{
            t(isActive(managerSdiAccessRule.is_active) ? 'disableManagerSdi' : 'enableManagerSdi')
          }}</UButton
        >
      </div>
    </UCard>
    <UAlert
      v-else-if="!loading"
      color="warning"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="t('managerSdiAccess')"
      :description="t('managerSdiRuleMissing')"
    />

    <UTabs
      v-model="tab"
      color="primary"
      :items="tabs"
      :content="false"
      class="w-full"
    />

    <UCard v-if="tab === 'roles'">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span
              class="flex size-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-users" class="size-4.5 text-primary-600 dark:text-primary-400" />
            </span>
            <div>
              <Heading variant="heading10sb">{{ t('roles') }}</Heading>
              <Paragraph variant="caption1" class="mt-0.5 text-muted">{{
                filteredRoles.length
              }}/{{ roles.length }} {{ t('roles').toLowerCase() }}</Paragraph>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="can('manage-members')"
              variant="outline"
              icon="i-lucide-user-plus"
              :disabled="!roles.length"
              @click="dialog = 'member'"
              >{{ t('addMembers') }}</UButton
            >
            <UButton
              v-if="can('create-role')"
              color="primary"
              icon="i-lucide-plus"
              @click="dialog = 'role'"
              >{{ t('addRole') }}</UButton
            >
          </div>
        </div>
      </template>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        :placeholder="t('search')"
        :aria-label="t('search')"
        class="mb-4 w-full sm:max-w-sm"
      />
      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
      </div>
      <EmptyState
        v-else-if="!filteredRoles.length"
        icon="i-lucide-users"
        :title="t('empty')"
        :description="t('emptyHint')"
      />
      <div v-else class="grid gap-3 md:grid-cols-2">
        <div
          v-for="role in visibleRoles"
          :key="role.id"
          class="group flex items-start justify-between gap-3 rounded-xl border border-default p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/40 dark:hover:bg-primary-900/10"
        >
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-primary-100 group-hover:text-primary-600 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-primary-900/50 dark:group-hover:text-primary-300"
            >
              <UIcon name="i-lucide-id-card" class="size-4.5" />
            </span>
            <div class="min-w-0 flex-1">
              <Paragraph variant="body2sb" class="break-words">{{ role.name }}</Paragraph>
              <Paragraph variant="caption1" class="mt-1 text-muted break-all">{{
                role.code
              }}</Paragraph>
            </div>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <UBadge :color="role.is_active ? 'success' : 'neutral'" variant="soft">{{
              t(role.is_active ? 'active' : 'inactive')
            }}</UBadge>
            <UButton
              icon="i-lucide-users-round"
              variant="ghost"
              size="xs"
              @click="showMembers(role)"
              >{{ t('viewMembers') }}</UButton
            >
          </div>
        </div>
      </div>
      <Pagination
        v-if="filteredRoles.length"
        :current-page="page"
        :total-pages="Math.ceil(filteredRoles.length / 10)"
        :total-items="filteredRoles.length"
        :rows-per-page="10"
        :rows-options="[10]"
        @update:page="page = $event"
      />
    </UCard>

    <UCard v-if="tab === 'rules'">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span
              class="flex size-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon
                name="i-lucide-git-branch"
                class="size-4.5 text-primary-600 dark:text-primary-400"
              />
            </span>
            <div>
              <Heading variant="heading10sb">{{ t('rules') }}</Heading>
              <Paragraph variant="caption1" class="mt-0.5 text-muted">{{
                filteredRules.length
              }}/{{ rules.length }} {{ t('rules').toLowerCase() }}</Paragraph>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="can('activate-rule') && rules.some((rule) => !isActive(rule.is_active))"
              icon="i-lucide-power"
              color="success"
              variant="outline"
              :loading="busy === 'bulk-activate'"
              :disabled="!!busy"
              @click="toggleAllRules(true)"
              >{{ t('activateAll') }}</UButton
            >
            <UButton
              v-if="can('activate-rule') && rules.some((rule) => isActive(rule.is_active))"
              icon="i-lucide-power-off"
              color="warning"
              variant="outline"
              :loading="busy === 'bulk-deactivate'"
              :disabled="!!busy"
              @click="toggleAllRules(false)"
              >{{ t('deactivateAll') }}</UButton
            >
            <UButton
              v-if="can('create-rule')"
              icon="i-lucide-plus"
              color="primary"
              :disabled="!roles.length || !!busy"
              @click="dialog = 'rule'"
              >{{ t('addRule') }}</UButton
            >
          </div>
        </div>
      </template>
      <div class="mb-4 flex flex-wrap gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          :placeholder="t('search')"
          :aria-label="t('search')"
          class="w-full sm:max-w-sm"
        />
        <USelect
          v-model="status"
          :items="statusOptions"
          :aria-label="t('status')"
          class="w-full sm:w-44"
        />
      </div>
      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-28 w-full" />
      </div>
      <EmptyState
        v-else-if="!filteredRules.length"
        icon="i-lucide-git-branch"
        :title="t('empty')"
        :description="t('emptyHint')"
      />
      <div v-else class="space-y-3">
        <article
          v-for="rule in visibleRules"
          :key="rule.id"
          class="group rounded-xl border border-default p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-700"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 space-y-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <Paragraph variant="body2sb" class="break-words">{{ rule.name }}</Paragraph>
                <UBadge :color="rule.is_active ? 'success' : 'neutral'" variant="soft">{{
                  t(rule.is_active ? 'active' : 'inactive')
                }}</UBadge>
              </div>
              <!-- Visual alur routing: source → target -->
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  <UIcon name="i-lucide-corner-down-right" class="size-3.5 shrink-0" />
                  <span class="truncate">{{ roleName(rule.source_role_id) }}</span>
                </span>
                <UIcon
                  name="i-lucide-move-right"
                  class="size-4 shrink-0 text-primary-500"
                />
                <span
                  class="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                >
                  <UIcon
                    :name="
                      rule.delivery_type === 'TEMBUSAN'
                        ? 'i-lucide-copy-plus'
                        : 'i-lucide-user-round'
                    "
                    class="size-3.5 shrink-0"
                  />
                  <span class="truncate">{{ roleName(rule.target_role_id) }}</span>
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <UBadge color="neutral" variant="subtle">{{ rule.document_type }}</UBadge>
                <UBadge
                  :color="rule.delivery_type === 'TEMBUSAN' ? 'warning' : 'primary'"
                  variant="soft"
                  >{{ t(rule.delivery_type === 'TEMBUSAN' ? 'cc' : 'recipient') }}</UBadge
                >
                <UBadge color="neutral" variant="subtle">{{ scopeName(rule.scope_type) }}</UBadge>
              </div>
              <div class="flex flex-wrap items-center gap-1 text-xs text-muted">
                <UIcon name="i-lucide-calendar" class="size-3.5" />
                <span
                  >{{ t('validFrom') }}: {{ rule.valid_from }} · {{ t('validTo') }}:
                  {{ rule.valid_to || t('noEnd') }}</span
                >
              </div>
            </div>
            <UButton
              v-if="can('activate-rule')"
              variant="outline"
              :color="rule.is_active ? 'neutral' : 'primary'"
              :loading="busy === rule.id"
              :disabled="!!busy"
              @click="toggleRule(rule)"
              >{{ t(rule.is_active ? 'deactivate' : 'activate') }}</UButton
            >
          </div>
        </article>
      </div>
      <Pagination
        v-if="filteredRules.length"
        :current-page="page"
        :total-pages="Math.ceil(filteredRules.length / 10)"
        :total-items="filteredRules.length"
        :rows-per-page="10"
        :rows-options="[10]"
        @update:page="page = $event"
      />
    </UCard>

    <UCard v-if="tab === 'preview' && can('preview')">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span
              class="flex size-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-flask-conical" class="size-4.5 text-primary-600 dark:text-primary-400" />
            </span>
            <div>
              <Heading variant="heading10sb">{{ t('preview') }}</Heading>
              <Paragraph variant="caption1" class="mt-0.5 text-muted">{{
                t('previewHintShort')
              }}</Paragraph>
            </div>
          </div>
        </div>
      </template>
      <UAlert color="neutral" variant="soft" :description="t('previewHint')" class="mb-4" />
      <form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="preview">
        <UFormField :label="t('position')" required
          ><UInput
            v-model.number="previewForm.senderPositionId"
            required
            type="number"
            min="1"
            class="w-full"
        /></UFormField>
        <UFormField :label="t('document')"
          ><USelect v-model="previewForm.documentType" :items="['DI', 'SDI']" class="w-full"
        /></UFormField>
        <UFormField :label="t('date')" required
          ><UInput v-model="previewForm.effectiveDate" required type="date" class="w-full"
        /></UFormField>
        <UFormField :label="t('action')"
          ><USelect
            v-model="previewForm.actionType"
            :items="previewForm.documentType === 'DI' ? ['CREATE', 'FORWARD'] : ['CREATE']"
            class="w-full"
        /></UFormField>
        <UFormField :label="t('inactiveRule')" class="sm:col-span-2"
          ><USelect v-model="previewRuleId" :items="previewRules" class="w-full"
        /></UFormField>
        <div class="flex items-end">
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-play"
            :loading="busy === 'preview'"
            :disabled="!!busy"
            >{{ t('run') }}</UButton
          >
        </div>
      </form>
      <div v-if="previewResult" class="mt-6 space-y-4" aria-live="polite">
        <UAlert
          v-for="warning in previewResult.warnings"
          :key="warning.code"
          color="warning"
          variant="soft"
          :description="warning.message"
        />
        <div class="grid gap-4 md:grid-cols-2">
          <div
            v-for="group in previewGroups"
            :key="group.title"
            class="rounded-xl border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="flex size-7 items-center justify-center rounded-lg"
                  :class="
                    group.title === t('recipient')
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                  "
                >
                  <UIcon
                    :name="group.title === t('recipient') ? 'i-lucide-user-round' : 'i-lucide-copy'"
                    class="size-3.5"
                  />
                </span>
                <Heading variant="heading11sb">{{ group.title }}</Heading>
              </div>
              <UBadge
                :color="group.title === t('recipient') ? 'primary' : 'warning'"
                variant="soft"
                >{{ group.items.length }}</UBadge
              >
            </div>
            <Paragraph v-if="!group.items.length" variant="body3" class="mt-3 text-muted">{{
              t('noTargets')
            }}</Paragraph>
            <ul v-else class="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
              <li
                v-for="item in group.items"
                :key="item.position"
                class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50"
              >
                <Paragraph variant="body3">{{ item.position_text || item.position }}</Paragraph>
                <Paragraph variant="caption1" class="text-muted"
                  >{{ item.area_text }} · {{ item.position }}</Paragraph
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </UCard>

    <Modal
      v-model="memberDetailOpen"
      size="full"
      hide-default-footer
      @update:model-value="closeMemberDetail"
    >
      <template #title>
        <div class="flex items-center gap-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/40"
          >
            <UIcon
              name="i-lucide-users-round"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
          </span>
          <div class="min-w-0">
            <Heading variant="heading9b">{{ t('roleMembers') }}</Heading>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <Paragraph variant="body3" class="text-muted">{{
                selectedRole?.name
              }}</Paragraph>
              <UBadge color="primary" variant="subtle">{{ selectedRole?.code }}</UBadge>
            </div>
          </div>
        </div>
      </template>
      <div class="space-y-4">
        <UAlert
          v-if="memberError"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="memberError"
        />
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="flex items-center gap-3 rounded-xl border border-default p-4">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40"
            >
              <UIcon name="i-lucide-users" class="size-4 text-primary-600 dark:text-primary-400" />
            </span>
            <div class="min-w-0">
              <Paragraph variant="caption1" class="text-muted">{{ t('totalMembers') }}</Paragraph>
              <Heading variant="heading9b" class="mt-0.5">{{ roleMembers.length }}</Heading>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-default p-4">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-50 dark:bg-success-900/30"
            >
              <UIcon
                name="i-lucide-user-check"
                class="size-4 text-success-600 dark:text-success-400"
              />
            </span>
            <div class="min-w-0">
              <Paragraph variant="caption1" class="text-muted">{{ t('activeMembers') }}</Paragraph>
              <Heading variant="heading9b" class="mt-0.5 text-success">{{
                activeMemberCount
              }}</Heading>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-default p-4">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-50 dark:bg-warning-900/30"
            >
              <UIcon
                name="i-lucide-user-x"
                class="size-4 text-warning-600 dark:text-warning-400"
              />
            </span>
            <div class="min-w-0">
              <Paragraph variant="caption1" class="text-muted">{{ t('vacantMembers') }}</Paragraph>
              <Heading variant="heading9b" class="mt-0.5 text-warning">{{
                vacantMemberCount
              }}</Heading>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <UInput
            v-model="memberSearch"
            icon="i-lucide-search"
            :placeholder="t('searchMembers')"
            :aria-label="t('searchMembers')"
            class="w-full sm:max-w-md"
          />
          <USelect
            v-model="memberStatus"
            :items="memberStatusOptions"
            :aria-label="t('memberStatus')"
            class="w-full sm:w-48"
          />
        </div>
        <div v-if="memberLoading" class="space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-20 w-full" />
        </div>
        <EmptyState
          v-else-if="!filteredMembers.length"
          icon="i-lucide-user-search"
          :title="t('noMembers')"
          :description="t('noMembersHint')"
        />
        <div v-else class="overflow-hidden rounded-xl border border-default">
          <DataTable
            :columns="memberColumns"
            :rows="visibleMembers"
            :skeleton-rows="5"
            :empty-message="t('noMembers')"
          >
            <template #cell-position_id="{ row }">
              <Paragraph variant="body3sb" class="text-primary-600 dark:text-primary-400">{{
                row.position_id
              }}</Paragraph>
            </template>
            <template #cell-position_name="{ row }">
              <Paragraph variant="body3sb" class="break-words">{{
                row.position?.position_text || t('positionMissing')
              }}</Paragraph>
              <Paragraph
                v-if="row.position?.organization_text"
                variant="caption1"
                class="mt-1 text-muted"
                >{{ row.position.organization_text }}</Paragraph
              >
            </template>
            <template #cell-officer_area="{ row }">
              <div class="flex items-center gap-2.5">
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  :class="
                    row.position?.persnum_person_text
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  "
                >
                  {{
                    row.position?.persnum_person_text
                      ?.split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || '—'
                  }}
                </span>
                <div class="min-w-0">
                  <Paragraph variant="body3">{{
                    row.position?.persnum_person_text || t('vacant')
                  }}</Paragraph>
                  <Paragraph variant="caption1" class="text-muted">{{
                    row.position?.area_text || '-'
                  }}</Paragraph>
                </div>
              </div>
            </template>
            <template #cell-period="{ row }">
              <Paragraph variant="caption1">{{ row.valid_from }}</Paragraph>
              <Paragraph variant="caption1" class="text-muted">{{
                row.valid_to || t('noEnd')
              }}</Paragraph>
            </template>
            <template #cell-status="{ row }">
              <div class="flex flex-wrap gap-1">
                <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="soft">{{
                  t(row.is_active ? 'active' : 'inactive')
                }}</UBadge>
                <UBadge v-if="row.vacant" color="warning" variant="soft">{{ t('vacant') }}</UBadge>
                <UBadge v-if="!row.found" color="error" variant="soft">{{ t('notFound') }}</UBadge>
              </div>
            </template>
          </DataTable>
        </div>
        <Pagination
          v-if="filteredMembers.length"
          :current-page="memberPage"
          :total-pages="Math.ceil(filteredMembers.length / 10)"
          :total-items="filteredMembers.length"
          :rows-per-page="10"
          :rows-options="[10]"
          @update:page="memberPage = $event"
        />
      </div>
    </Modal>

    <Modal
      :model-value="!!dialog"
      size="xl"
      :saving="!!busy"
      @save="submit"
      @update:model-value="closeDialog"
    >
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">
          {{ t(dialog === 'role' ? 'addRole' : dialog === 'member' ? 'addMembers' : 'addRule') }}
        </Heading>
      </template>

      <form class="flex flex-col gap-4 p-1 pb-4" @submit.prevent="submit">
        <UAlert v-if="formError" color="error" variant="soft" :description="formError" />
        <template v-if="dialog === 'role' || dialog === 'rule'">
          <div class="flex flex-col">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ t('code') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="form.code"
              type="text"
              required
              pattern="[A-Z][A-Z0-9_]*"
              :maxlength="dialog === 'role' ? 64 : 100"
              class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div class="flex flex-col">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ t('name') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="form.name"
              type="text"
              required
              :maxlength="dialog === 'role' ? 150 : 200"
              class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
          </div>
        </template>
        <template v-if="dialog === 'member'">
          <div class="flex flex-col">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ t('role') }} <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="memberForm.role_id"
              required
              class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            >
              <option value="" disabled>{{ t('choose') }}</option>
              <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="flex flex-col">
            <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
              {{ t('positions') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="memberForm.position_ids"
              required
              rows="4"
              class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 resize-none"
            ></textarea>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('positionsHint') }}</p>
          </div>
        </template>
        <template v-if="dialog === 'rule'">
          <UAlert color="primary" variant="soft" :description="t('newRuleHint')" />
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ t('source') }} <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="ruleForm.source_role_id"
                required
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="" disabled>{{ t('choose') }}</option>
                <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ t('target') }} <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="ruleForm.target_role_id"
                required
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="" disabled>{{ t('choose') }}</option>
                <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ t('document') }}
              </Heading>
              <select
                v-model="ruleForm.document_type"
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option value="DI">DI</option>
                <option value="SDI">SDI</option>
              </select>
            </div>
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ t('action') }}
              </Heading>
              <select
                v-model="ruleForm.action_type"
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option v-for="a in ruleForm.document_type === 'DI' ? ['CREATE', 'FORWARD', 'BOTH'] : ['CREATE']" :key="a" :value="a">
                  {{ a }}
                </option>
              </select>
            </div>
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ t('delivery') }}
              </Heading>
              <select
                v-model="ruleForm.delivery_type"
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option v-for="opt in deliveryOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex flex-col">
              <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                {{ t('scope') }}
              </Heading>
              <select
                v-model="ruleForm.scope_type"
                class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
          <div v-if="ruleForm.scope_type === 'EXPLICIT'" class="space-y-3">
            <div
              v-for="(scope, index) in scopes"
              :key="index"
              class="grid grid-cols-2 gap-3 rounded-lg border border-gray-300 dark:border-gray-600 p-4"
            >
              <div class="flex flex-col">
                <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                  {{ t('side') }}
                </Heading>
                <select
                  v-model="scope.side"
                  class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                >
                  <option value="SOURCE">SOURCE</option>
                  <option value="TARGET">TARGET</option>
                </select>
              </div>
              <div class="flex flex-col">
                <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                  {{ t('entity') }}
                </Heading>
                <select
                  v-model="scope.entity_type"
                  class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                >
                  <option v-for="e in ['AREA', 'SUB_AREA', 'ORGANIZATION', 'POSITION']" :key="e" :value="e">
                    {{ e }}
                  </option>
                </select>
              </div>
              <div class="flex flex-col">
                <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
                  {{ t('entityId') }} <span class="text-red-500">*</span>
                </Heading>
                <input
                  v-model="scope.entity_id"
                  type="text"
                  required
                  maxlength="100"
                  class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div class="flex items-end justify-between gap-2">
                <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    v-model="scope.include_flag"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-xs font-medium">{{ t('include') }}</span>
                </label>
                <button
                  type="button"
                  class="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-500 transition-colors"
                  :aria-label="t('remove')"
                  @click="scopes.splice(index, 1)"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <UButton
              icon="i-lucide-plus"
              variant="outline"
              :disabled="scopes.length >= 200"
              @click="
                scopes.push({
                  side: 'TARGET',
                  entity_type: 'POSITION',
                  entity_id: '',
                  include_flag: true,
                })
              "
              >{{ t('addScope') }}</UButton
            >
          </div>
        </template>
        <div v-if="dialog !== 'role'" class="flex flex-col">
          <Heading variant="heading11m" class="text-xs font-medium dark:text-gray-200">
            {{ t('validFrom') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="validFrom"
            type="date"
            required
            class="mt-1 w-full text-left border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
          />
        </div>
      </form>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import type {
  RoutingRole,
  RoutingRule,
  RoutingHealth,
  RoutingPreview,
  RoutingMember,
} from '~/composables/useCorrespondenceRouting';
import { Alert } from '~/composables/useAlert';
import { routingMessages } from '~/utils/routing-messages';

const { t } = useI18n({ useScope: 'local', messages: routingMessages });
const api = useCorrespondenceRouting();
const { correspondenceRoutingUpdate } = useRealtimeSocket();
const { hasPermission, isSuperadmin } = useAuth();
const can = (action: string) =>
  isSuperadmin.value || hasPermission('correspondence-routing', action);
const toast = useToast();
const roles = ref<RoutingRole[]>([]);
const rules = ref<RoutingRule[]>([]);
const health = ref<RoutingHealth | null>(null);
const loading = ref(false);
const busy = ref('');
const error = ref('');
const formError = ref('');
const tab = ref('rules');
const search = ref('');
const status = ref('all');
const page = ref(1);
const dialog = ref('');
const memberDetailOpen = ref(false);
const selectedRole = ref<RoutingRole | null>(null);
const roleMembers = ref<RoutingMember[]>([]);
const memberLoading = ref(false);
const memberError = ref('');
const memberSearch = ref('');
const memberStatus = ref('all');
const memberPage = ref(1);
const form = reactive({ code: '', name: '' });
const validFrom = ref(new Date().toISOString().slice(0, 10));
const memberForm = reactive({ role_id: '', position_ids: '' });
const ruleForm = reactive({
  source_role_id: '',
  target_role_id: '',
  document_type: 'DI',
  action_type: 'CREATE',
  delivery_type: 'PENERIMA',
  scope_type: 'ALL',
});
const scopes = ref<
  { side: string; entity_type: string; entity_id: string; include_flag: boolean }[]
>([]);
const previewForm = reactive({
  company: 10000,
  senderPositionId: undefined as number | undefined,
  documentType: 'DI',
  actionType: 'CREATE',
  effectiveDate: new Date().toISOString().slice(0, 10),
});
const previewRuleId = ref('none');
const previewResult = ref<RoutingPreview | null>(null);
const tabs = computed(() => [
  { label: t('rules'), value: 'rules', icon: 'i-lucide-git-branch' },
  { label: t('roles'), value: 'roles', icon: 'i-lucide-users' },
]);
const statusOptions = computed(() =>
  ['all', 'active', 'inactive'].map((value) => ({ value, label: t(value) }))
);
const memberStatusOptions = computed(() =>
  ['all', 'active', 'inactive', 'vacant'].map((value) => ({ value, label: t(value) }))
);
// Kolom tabel anggota role — pakai DataTable shared (header primary seperti menu Delegasi).
const memberColumns = computed(() => [
  { key: 'position_id', label: t('positionId'), class: 'whitespace-nowrap' },
  { key: 'position_name', label: t('positionName') },
  { key: 'officer_area', label: t('officerArea') },
  { key: 'period', label: t('period'), class: 'whitespace-nowrap' },
  { key: 'status', label: t('status') },
]);
const roleOptions = computed(() => roles.value.map((r) => ({ value: r.id, label: r.name })));
const roleName = (id: string) => roles.value.find((r) => r.id === id)?.name || id;
const scopeOptions = computed(() =>
  ['ALL', 'SAME_AREA', 'SAME_SUB_AREA', 'EXPLICIT'].map((value) => ({ value, label: t(value) }))
);
const scopeName = (value: string) =>
  scopeOptions.value.find((o) => o.value === value)?.label || value;
const deliveryOptions = computed(() => [
  { value: 'PENERIMA', label: t('recipient') },
  ...(ruleForm.document_type === 'SDI' ? [{ value: 'TEMBUSAN', label: t('cc') }] : []),
]);
const matches = (r: RoutingRole) =>
  (r.name + ' ' + r.code).toLowerCase().includes(search.value.trim().toLowerCase());
const filteredRoles = computed(() => roles.value.filter(matches));
const filteredRules = computed(() =>
  rules.value.filter(
    (r) =>
      matches(r) && (status.value === 'all' || Boolean(r.is_active) === (status.value === 'active'))
  )
);
const visibleRoles = computed(() =>
  filteredRoles.value.slice((page.value - 1) * 10, page.value * 10)
);
const visibleRules = computed(() =>
  filteredRules.value.slice((page.value - 1) * 10, page.value * 10)
);
const filteredMembers = computed(() => {
  const query = memberSearch.value.trim().toLowerCase();
  return roleMembers.value.filter((member) => {
    const position = member.position;
    const searchable = [
      member.position_id,
      position?.position_text,
      position?.position_abbreviation,
      position?.persnum_person_text,
      position?.area_text,
      position?.organization_text,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const statusMatches =
      memberStatus.value === 'all' ||
      (memberStatus.value === 'active' && Boolean(member.is_active)) ||
      (memberStatus.value === 'inactive' && !member.is_active) ||
      (memberStatus.value === 'vacant' && member.vacant);
    return statusMatches && searchable.includes(query);
  });
});
const visibleMembers = computed(() =>
  filteredMembers.value.slice((memberPage.value - 1) * 10, memberPage.value * 10)
);
const activeMemberCount = computed(
  () => roleMembers.value.filter((member) => member.is_active).length
);
const vacantMemberCount = computed(
  () => roleMembers.value.filter((member) => member.vacant).length
);
const previewRules = computed(() => [
  { value: 'none', label: t('activeOnly') },
  ...rules.value
    .filter(
      (r) =>
        !r.is_active &&
        r.document_type === previewForm.documentType &&
        [previewForm.actionType, 'BOTH'].includes(r.action_type)
    )
    .map((r) => ({ value: r.id, label: r.name })),
]);
const previewGroups = computed(() => [
  { title: t('recipient'), items: previewResult.value?.effectiveRecipients || [] },
  { title: t('cc'), items: previewResult.value?.mandatoryCc || [] },
]);
watch([search, status, tab], () => {
  page.value = 1;
});
watch([memberSearch, memberStatus], () => {
  memberPage.value = 1;
});
watch(
  () => ruleForm.document_type,
  () => {
    ruleForm.action_type = 'CREATE';
    ruleForm.delivery_type = 'PENERIMA';
  }
);
watch(
  () => previewForm.documentType,
  () => {
    previewForm.actionType = 'CREATE';
    previewRuleId.value = 'none';
  }
);
watch(
  () => previewForm.actionType,
  () => {
    previewRuleId.value = 'none';
  }
);
watch([() => JSON.stringify(previewForm), previewRuleId], () => {
  previewResult.value = null;
});
watch(dialog, () => {
  formError.value = '';
});
watch(correspondenceRoutingUpdate, () => {
  if (!loading.value && !busy.value) load();
});
const isActive = (value: number | boolean | string) =>
  value === true || value === 1 || value === '1';
const managerSdiAccessRule = computed(() =>
  rules.value.find((rule) => rule.code === 'SDI_MANAGER_TO_VP_INMC')
);
const managerSdiAccessEnabled = computed(
  () =>
    health.value?.feature_flag_enabled === true &&
    !!managerSdiAccessRule.value &&
    isActive(managerSdiAccessRule.value.is_active)
);
const message = (e: unknown) => {
  const responseMessage = (e as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (typeof responseMessage === 'string') return responseMessage;
  if (Array.isArray(responseMessage)) return responseMessage.join(', ');
  return e instanceof Error ? e.message : t('error');
};
async function load() {
  loading.value = true;
  error.value = '';
  const results = await Promise.allSettled([
    api.listRoles(),
    api.listRules(),
    can('read-health') ? api.health() : Promise.resolve(null),
  ]);
  const [roleResult, ruleResult, healthResult] = results;
  if (roleResult.status === 'fulfilled') roles.value = roleResult.value;
  if (ruleResult.status === 'fulfilled') rules.value = ruleResult.value;
  health.value = healthResult.status === 'fulfilled' ? healthResult.value : null;
  const failed = results.find((r) => r.status === 'rejected');
  if (failed?.status === 'rejected') error.value = message(failed.reason);
  loading.value = false;
}
function closeDialog(open: boolean) {
  if (!open && !busy.value) dialog.value = '';
}
function closeMemberDetail(open: boolean) {
  if (!open && !memberLoading.value) memberDetailOpen.value = false;
}
async function showMembers(role: RoutingRole) {
  selectedRole.value = role;
  roleMembers.value = [];
  memberError.value = '';
  memberSearch.value = '';
  memberStatus.value = 'all';
  memberPage.value = 1;
  memberDetailOpen.value = true;
  memberLoading.value = true;
  try {
    roleMembers.value = await api.listMembers(role.id);
  } catch (e) {
    memberError.value = message(e);
  } finally {
    memberLoading.value = false;
  }
}
async function submit() {
  if (busy.value) return;
  formError.value = '';
  busy.value = 'save';
  try {
    if (dialog.value === 'role') await api.createRole({ ...form, company: 10000 });
    else if (dialog.value === 'member') {
      const ids = [
        ...new Set(
          memberForm.position_ids
            .trim()
            .split(/[\s,]+/)
            .map(Number)
        ),
      ];
      if (
        !memberForm.role_id ||
        !ids.length ||
        ids.length > 200 ||
        ids.some((id) => !Number.isSafeInteger(id) || id <= 0)
      )
        throw new Error(t('invalidPositions'));
      await api.addMembers(memberForm.role_id, {
        members: ids.map((position_id) => ({ position_id, valid_from: validFrom.value })),
      });
    } else {
      if (!ruleForm.source_role_id || !ruleForm.target_role_id) throw new Error(t('chooseRoles'));
      if (
        ruleForm.scope_type === 'EXPLICIT' &&
        !scopes.value.some((s) => s.include_flag && s.entity_id.trim())
      )
        throw new Error(t('invalidScope'));
      const cc = ruleForm.delivery_type === 'TEMBUSAN';
      await api.createRule({
        ...form,
        ...ruleForm,
        company: 10000,
        behavior: 'ADD',
        effect: cc ? 'AUTO_INCLUDE' : 'ALLOW_SELECT',
        mandatory: cc,
        valid_from: validFrom.value,
        scopes: ruleForm.scope_type === 'EXPLICIT' ? scopes.value : [],
      });
    }
    dialog.value = '';
    form.code = '';
    form.name = '';
    memberForm.position_ids = '';
    toast.add({ title: t('saved'), color: 'success' });
    await load();
  } catch (e) {
    formError.value = message(e);
  } finally {
    busy.value = '';
  }
}
async function toggleRule(rule: RoutingRule) {
  if (busy.value) return;
  busy.value = rule.id;
  try {
    const accepted = await Alert.confirm(
      t(rule.is_active ? 'deactivate' : 'activate'),
      rule.name + '. ' + t('toggleHint'),
      t('confirm'),
      t('cancel')
    );
    if (!accepted) return;
    await api.toggleRule(rule.id, !isActive(rule.is_active));
    toast.add({ title: t('saved'), color: 'success' });
    await load();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = '';
  }
}
async function toggleAllRules(active: boolean) {
  if (busy.value) return;
  const pending = rules.value.filter((rule) => isActive(rule.is_active) !== active);
  if (!pending.length) return;
  const accepted = await Alert.confirm(
    t(active ? 'bulkActivateTitle' : 'bulkDeactivateTitle'),
    t(active ? 'bulkActivateHint' : 'bulkDeactivateHint'),
    t('confirm'),
    t('cancel')
  );
  if (!accepted) return;
  busy.value = active ? 'bulk-activate' : 'bulk-deactivate';
  error.value = '';
  try {
    const result = await api.toggleAllRules(active);
    toast.add({
      title: t('saved'),
      description: `${result.changed_count} ${t('bulkDone')}`,
      color: 'success',
    });
    await load();
  } catch (e) {
    error.value = message(e);
    await load();
  } finally {
    busy.value = '';
  }
}
async function preview() {
  if (busy.value) return;
  busy.value = 'preview';
  error.value = '';
  previewResult.value = null;
  try {
    previewResult.value = await api.preview({
      ...previewForm,
      ...(previewRuleId.value === 'none' ? {} : { includeInactiveRuleId: previewRuleId.value }),
    });
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = '';
  }
}
onMounted(load);
</script>
