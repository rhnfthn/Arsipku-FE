<script setup lang="ts">
import { useToast } from "#imports";

const props = defineProps<{
  title?: string;
  message?: string;
  color?: "primary" | "neutral" | "secondary" | "warning" | "error" | "success";
  icon?: string;
}>();

const toast = useToast();

const show = () => {
  toast.add({
    title: props.title,
    description: props.message,
    color: props.color ?? "primary",
    icon: props.icon ?? "i-lucide-info",
  });
};
</script>

<template>
  <button @click="show">
    <slot />
  </button>
</template>
