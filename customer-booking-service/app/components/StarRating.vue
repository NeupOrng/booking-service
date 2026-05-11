<script setup lang="ts">
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  readonly: false,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const hovered = ref(0)

const sizeClass = computed(() => ({
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}[props.size]))
</script>

<template>
  <div class="flex items-center gap-0.5">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      :class="[
        'transition-all duration-100',
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
      ]"
      @mouseenter="!readonly && (hovered = star)"
      @mouseleave="!readonly && (hovered = 0)"
      @click="!readonly && emit('update:modelValue', star)"
    >
      <Star
        :class="[
          sizeClass,
          (hovered || modelValue) >= star
            ? 'fill-amber-400 text-amber-400'
            : 'fill-none text-muted-foreground/30',
        ]"
      />
    </button>
  </div>
</template>
