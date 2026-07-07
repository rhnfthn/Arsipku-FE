<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
    <div
      class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5"
    >
      <UIcon
        name="i-lucide-lock-keyhole"
        class="w-10 h-10 text-gray-400 dark:text-gray-500"
      />
    </div>
    <Heading variant="heading7b" as="h2" class="text-gray-900 dark:text-white mb-2"
      >{{ $t('access_denied_title') }}</Heading
    >
    <Paragraph variant="body2m" class="text-gray-500 dark:text-gray-400 max-w-md mb-6"
      >{{ $t('access_denied_description') }}</Paragraph
    >
    <div class="flex flex-wrap items-center justify-center gap-3 mb-2">
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              @click="goBack"
            >
              {{ $t('access_denied_back') }}
            </UButton>
      <UButton
        variant="solid"
        color="primary"
        size="sm"
        to="/beranda"
        @click="emit('home')"
      >
        {{ $t('access_denied_home') }}
      </UButton>
    </div>
    <Paragraph
      v-if="permissionKey"
      variant="caption1"
      class="text-gray-400 dark:text-gray-600 mt-4"
    >
      {{ permissionKey }}
    </Paragraph>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  permissionKey?: string;
}>(), {
  permissionKey: '',
});

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'home'): void;
}>();

const { currentRoutePermission } = useFeatureAccess();
const router = useRouter();

const displayKey = computed(() => {
  if (props.permissionKey) return props.permissionKey;
  const perm = currentRoutePermission();
  return perm ? `${perm.resource}:${perm.action}` : '';
});

function goBack() {
  emit('back');
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/beranda');
  }
}
</script>
