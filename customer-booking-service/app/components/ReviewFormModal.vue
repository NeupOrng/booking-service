<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  serviceId: string
  bookingId?: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'submit', data: { rating: number; comment: string; bookingId?: string }): void
}>()

const rating = ref(0)
const comment = ref('')
const ratingError = ref('')

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
}

function handleSubmit() {
  if (rating.value === 0) {
    ratingError.value = 'Please select a rating'
    return
  }
  ratingError.value = ''
  emit('submit', {
    rating: rating.value,
    comment: comment.value.trim(),
    bookingId: props.bookingId,
  })
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      rating.value = 0
      comment.value = ''
      ratingError.value = ''
    }
  },
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Leave a review</DialogTitle>
        <DialogDescription>
          Share your experience to help others make a decision.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <!-- Star rating -->
        <div>
          <p class="text-sm font-medium mb-2">Your rating</p>
          <div class="flex items-center gap-3">
            <StarRating v-model="rating" size="lg" />
            <span v-if="rating > 0" class="text-sm text-muted-foreground">
              {{ ratingLabels[rating] }}
            </span>
          </div>
          <p v-if="ratingError" class="text-xs text-destructive mt-1">{{ ratingError }}</p>
        </div>

        <!-- Comment -->
        <div>
          <label class="text-sm font-medium mb-2 block" for="review-comment">
            Comment <span class="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            id="review-comment"
            v-model="comment"
            placeholder="Tell us about your experience…"
            rows="4"
            maxlength="1000"
            class="resize-none"
          />
          <p class="text-xs text-muted-foreground mt-1 text-right">{{ comment.length }}/1000</p>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button
          variant="outline"
          :disabled="submitting"
          @click="emit('update:open', false)"
        >
          Cancel
        </Button>
        <Button :disabled="submitting" @click="handleSubmit">
          <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
          Submit review
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
