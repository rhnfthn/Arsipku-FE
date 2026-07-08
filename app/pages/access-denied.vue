<template>
  <div class="min-h-screen pt-5 px-4 sm:px-6 lg:px-8">
    <AccessDenied :permission-key="permissionKey" @back="goBack" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: false });

const route = useRoute();
const router = useRouter();

const permissionKey = computed(() => {
  const key = route.query.permissionKey;
  return typeof key === 'string' ? key : '';
});

function goBack() {
  const from = route.query.from;
  if (typeof from === 'string' && from !== '') {
    router.push(from);
  } else if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/beranda');
  }
}
</script>
