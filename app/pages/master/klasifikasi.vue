<template>
  <div class="space-y-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <!-- Left Section - Title & Breadcrumb -->
      <PageHeader title="Klasifikasi" :items="items" />
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    label: "Home",
    to: "/dashboard",
  },
  {
    label: "Klasifikasi",
    to: "/master/klasifikasi",
  },
] satisfies BreadcrumbItem[];
</script>
