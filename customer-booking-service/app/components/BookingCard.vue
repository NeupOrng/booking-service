<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle2, Loader2 } from 'lucide-vue-next'
import type { Booking } from '~/types'
import { toast } from 'vue-sonner'

const props = defineProps<{ booking: Booking }>()
const emit = defineEmits<{ (e: 'cancelled', id: string): void }>()

const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()
const { cancelBooking } = useBooking()

const isCancelExpanded = ref(false)
const cancelLoading = ref(false)

const badgeVariant = computed(() => {
  switch (props.booking.status) {
    case 'confirmed': return 'default'
    case 'pending': return 'secondary' // 'warning' ideally but using secondary for fallback
    case 'completed': return 'outline' // 'success' ideally
    case 'cancelled': return 'secondary'
    default: return 'outline'
  }
})

const badgeColor = computed(() => {
  if (props.booking.status === 'pending') return 'bg-amber-100 text-amber-800 hover:bg-amber-200'
  if (props.booking.status === 'completed') return 'bg-green-100 text-green-800 hover:bg-green-200'
  return ''
})

async function onCancelConfirm() {
  cancelLoading.value = true
  try {
    const success = await cancelBooking(props.booking.id)
    if (success) {
      toast.success('Booking cancelled successfully')
      emit('cancelled', props.booking.id)
      isCancelExpanded.value = false
    }
  } catch (err) {
    toast.error('Failed to cancel booking')
  } finally {
    cancelLoading.value = false
  }
}
</script>

<template>
  <Card class="overflow-hidden flex flex-col">
    <div class="p-6 pb-4">
      <div class="flex justify-between items-start mb-4">
        <div class="flex gap-4">
          <div class="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="booking.service.cover_image_url" :src="booking.service.cover_image_url" class="w-full h-full object-cover"/>
            <span v-else class="text-xl font-bold opacity-30">{{ booking.service.name.charAt(0) }}</span>
          </div>
          <div>
            <h3 class="font-medium text-lg">{{ booking.service.name }}</h3>
            <p class="text-sm text-muted-foreground">{{ booking.business.name }}</p>
          </div>
        </div>
        <Badge :variant="badgeVariant" :class="[badgeColor, 'capitalize']">{{ booking.status }}</Badge>
      </div>

      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-6 p-4 bg-muted/20 rounded-xl">
        <div class="flex flex-col">
          <dt class="text-muted-foreground">Date</dt>
          <dd class="font-medium">{{ formatBookingDate(booking.date) }}</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-muted-foreground">Time</dt>
          <dd class="font-medium">{{ formatBookingTime(booking.time) }}</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-muted-foreground">Duration</dt>
          <dd class="font-medium">{{ booking.service.duration_minutes }} min</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-muted-foreground">Amount</dt>
          <dd class="font-medium">{{ formatCurrency(booking.price) }}</dd>
        </div>
      </dl>
      <div class="mt-4 text-xs font-mono text-muted-foreground tracking-wide">
        Ref: {{ booking.reference }}
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="border-t bg-muted/10 p-4 flex flex-wrap gap-3 items-center" v-if="booking.status === 'confirmed' || booking.status === 'pending'">
      <NuxtLink :to="`/services/${booking.service.id}?reschedule=true`" v-if="booking.can_reschedule">
         <Button variant="outline" size="sm">Reschedule</Button>
      </NuxtLink>
      <Button variant="outline" size="sm" class="text-destructive border-destructive" v-if="booking.can_cancel && !isCancelExpanded" @click="isCancelExpanded = true">
        Cancel Booking
      </Button>
      <NuxtLink :to="`/services/${booking.service.id}`" class="ml-auto">
        <Button variant="ghost" size="sm">View service</Button>
      </NuxtLink>
    </div>

    <div class="border-t bg-muted/10 p-4 flex flex-wrap gap-3 items-center" v-if="booking.status === 'completed'">
      <NuxtLink :to="`/services/${booking.service.id}?review=true`">
         <Button variant="outline" size="sm">Leave a review</Button>
      </NuxtLink>
      <NuxtLink :to="`/services/${booking.service.id}`" class="ml-auto">
        <Button variant="ghost" size="sm">Book again</Button>
      </NuxtLink>
    </div>

    <div class="border-t bg-muted/10 p-4 flex flex-wrap gap-3 items-center" v-if="booking.status === 'cancelled'">
      <div v-if="booking.refund_status === 'refunded'" class="flex items-center gap-2 text-sm text-green-600 font-medium">
        <CheckCircle2 class="w-4 h-4" />
        {{ formatCurrency(booking.refund_amount || 0) }} refunded
      </div>
      <NuxtLink :to="`/services/${booking.service.id}`" class="ml-auto">
        <Button variant="ghost" size="sm">Book again</Button>
      </NuxtLink>
    </div>

    <!-- Inline Cancellation Panel -->
    <div v-if="isCancelExpanded" class="border-t border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
       <div>
         <p class="font-medium text-destructive mb-1">Are you sure you want to cancel?</p>
         <p class="text-sm text-muted-foreground">You will receive a full refund of {{ formatCurrency(booking.price) }}.</p>
       </div>
       <div class="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" @click="isCancelExpanded = false">Keep booking</Button>
          <Button variant="destructive" size="sm" @click="onCancelConfirm" :disabled="cancelLoading">
            <Loader2 v-if="cancelLoading" class="w-4 h-4 mr-2 animate-spin" />
            Yes, cancel booking
          </Button>
       </div>
    </div>
  </Card>
</template>
