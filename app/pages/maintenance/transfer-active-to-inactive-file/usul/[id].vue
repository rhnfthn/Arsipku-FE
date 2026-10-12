<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'division-secretary-only'] });

const route = useRoute();
await navigateTo(
  { path: `/kelola/pemeliharaan/pemindahan-arsip/${route.params.id}`, query: route.query },
  { redirectCode: 301 },
);
</script>
