<script setup lang="ts">
import { Clock, Star } from 'lucide-vue-next'
import type { Service } from '~/types'
import { useFormatters } from '~/composables/useFormatters'

const props = defineProps<{ service: Service }>()

const { formatCurrency, formatNextSlot } = useFormatters()

const nextSlot = computed(() => formatNextSlot(props.service.next_available_slot))

function getCategoryStyle(slug: string): string {
  const map: Record<string, string> = {
    wellness: 'bg-teal-50 text-teal-700 border-teal-200',
    beauty: 'bg-rose-50 text-rose-700 border-rose-200',
    fitness: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return map[slug] || 'bg-slate-50 text-slate-700 border-slate-200'
}

function getCategoryPlaceholder(slug: string): string {
  const map: Record<string, string> = {
    wellness: 'bg-teal-100',
    beauty: 'bg-rose-100',
    fitness: 'bg-amber-100',
  }
  return map[slug] || 'bg-slate-100'
}
</script>

<template>
  <NuxtLink :to="`/services/${service.id}`" class="block h-full group">
    <div class="h-full bg-card rounded-2xl overflow-hidden border border-border flex flex-col transition-all duration-200 shadow-sm group-hover:-translate-y-1.5 group-hover:shadow-xl">
      <!-- Cover Image -->
      <div class="relative w-full h-44 shrink-0 overflow-hidden">
        <img
          v-if="service.cover_image_url"
          :src="service.cover_image_url"
          :alt="service.name"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-5xl font-bold text-white/60"
          :class="getCategoryPlaceholder(service.category.slug)"
        >
          {{ service.category.name.charAt(0) }}
        </div>
        <!-- Category badge overlaid on image -->
        <span
          :class="['absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border', getCategoryStyle(service.category.slug)]"
        >
          {{ service.category.name }}
        </span>
      </div>

      <!-- Card Body -->
      <div class="p-4 flex flex-col gap-1 flex-1">
        <h3 class="font-semibold text-base leading-snug text-foreground line-clamp-2">{{ service.name }}</h3>
        <p class="text-sm text-muted-foreground">{{ service.business.name }}</p>

        <!-- Rating row -->
        <div class="flex items-center gap-1 mt-1">
          <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span class="text-xs font-medium text-foreground">{{ service.avg_rating ?? '5.0' }}</span>
          <span class="text-xs text-muted-foreground">({{ service.review_count ?? 0 }})</span>
        </div>

        <!-- Footer row -->
        <div class="mt-auto pt-3 border-t border-border flex items-center justify-between text-sm">
          <div class="flex items-center gap-1.5 text-muted-foreground">
            <Clock class="w-3.5 h-3.5" />
            <span>{{ service.duration_minutes }} min</span>
          </div>
          <div class="flex items-center gap-3">
            <span :class="['text-xs font-medium', nextSlot.urgent ? 'text-destructive' : 'text-emerald-600']">
              {{ nextSlot.label }}
            </span>
            <span class="font-bold text-primary text-base">{{ formatCurrency(service.price) }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
