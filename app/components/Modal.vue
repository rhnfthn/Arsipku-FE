  <script setup lang="ts">
  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: "" },
    variant: { type: String, default: "" },
    descriptions: { type: Array, default: () => [] },
    inputs: { type: Array, default: () => [] },
    primaryButton: { type: String, default: "" },
    secondaryButton: { type: String, default: "" },
    open: { type: String, default: "" },
    primaryColor: { type: String, default: "primary" },
    secondaryColor: { type: String, default: "gray" },
    openColor: { type: String, default: "primary" },
    icon: { type: String, default: "" }
  });

  const computedIcon = computed(() =>
    props.icon ? `i-lucide-${props.icon}` : undefined
  )

  const emit = defineEmits(["update:modelValue", "primary", "secondary"]);

  const handlePrimary = () => {
    emit("primary");
    emit("update:modelValue", false);
  };

  const handleSecondary = () => {
    emit("secondary");
    emit("update:modelValue", false);
  };
  </script>

  <template>
  <UModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('update:modelValue', false)" 
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
      <template #header>
        <div class="ml-26 mb-2" >
          <Heading variant="heading5b" class="text-center mb-5">
            {{ title }}
          </Heading>

          <div v-for="(desc, i) in descriptions" :key="i" class="mt-3" :class="variant === 'modal2' ? 'text-start' : 'text-center'">
            <Paragraph>{{ desc }}</Paragraph>

            <UInput
              v-if="variant === 'modal2'"
              :placeholder="inputs[i]?.placeholder"
              class="w-full mt-2"
            />
          </div>

          <div class="flex justify-center gap-3 mt-5">
            <UButton
              :color="primaryColor"
              @click="handlePrimary"
              class="px-10 py-3"
            >
              {{ primaryButton }}
            </UButton>

            <UButton
              :color="secondaryColor"
              variant="outline"
              @click="handleSecondary"
              class="px-10 py-3"
            >
              {{ secondaryButton }}
            </UButton>
          </div>
        </div>
      </template>
      <UButton :color="openColor" :trailing-icon="computedIcon" @click="emit('update:modelValue', true)">
        {{ open }}
      </UButton>
    </UModal>
  </template>
