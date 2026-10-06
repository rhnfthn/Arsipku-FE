import { ref, watch, type Ref } from 'vue';

/** Hitungan otomatis mengikuti file sampai pengguna memberi keterangan sendiri. */
export function useEditableLampiranText(
  files: Ref<unknown[]>,
  label: () => string = () => 'Lampiran'
) {
  const text = ref('');
  watch(
    () => files.value.length,
    (count, previousCount) => {
      const previousDefault = `${previousCount ?? 0} ${label()}`;
      if (!text.value.trim() || text.value === previousDefault) {
        text.value = `${count} ${label()}`;
      }
    },
    { immediate: true }
  );
  return text;
}
