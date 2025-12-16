<template>
  <div class="space-y-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Log Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Log Digsig", to: "/admin/digsig/log-digsig" },
];
</script>
