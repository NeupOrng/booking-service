<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { Review } from '~/types'

defineProps<{
  review: Review
  canDelete?: boolean
  deleting?: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

const { formatRelativeTime } = useFormatters()
</script>

<template>
  <div class="p-4 bg-card rounded-xl border border-border">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <Avatar class="w-9 h-9 shrink-0">
          <AvatarFallback class="text-xs font-semibold bg-primary/10 text-primary">
            {{ review.reviewerInitials }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-foreground truncate">{{ review.reviewerName }}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <StarRating :model-value="review.rating" readonly size="sm" />
            <span class="text-xs text-muted-foreground shrink-0">{{ formatRelativeTime(review.createdAt) }}</span>
          </div>
        </div>
      </div>
      <Button
        v-if="canDelete"
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
        :disabled="deleting"
        @click="emit('delete', review.id)"
      >
        <Trash2 class="w-4 h-4" />
      </Button>
    </div>
    <p v-if="review.comment" class="mt-3 text-sm text-muted-foreground leading-relaxed pl-12">
      "{{ review.comment }}"
    </p>
  </div>
</template>
