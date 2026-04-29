<script setup lang="ts">
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-vue-next'
import type { Booking } from '~/models';

const props = defineProps<{
  booking: Booking
  expandedCancelId?: string | null
}>()

const emit = defineEmits<{
  (e: 'cancel', payload: { id: string; reason: string }): void
  (e: 'close-cancel'): void
}>()

const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()

const cancelReason = ref('')
const isCancelExpanded = computed(() =>
  props.expandedCancelId ? props.expandedCancelId === props.booking.id : false,
)

const badgeClass = computed(() => {
  switch (props.booking.status) {
    case 'confirmed': return 'bg-primary/10 text-primary'
    case 'pending':   return 'bg-amber-100 text-amber-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-muted text-muted-foreground'
    default:          return 'bg-muted text-muted-foreground'
  }
})
</script>

<template>
  <Card class="overflow-hidden">
    <div class="p-5">
      <!-- Header row -->
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <!-- Service icon placeholder -->
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Avatar class="w-14 h-14 border-2 border-border shrink-0">
                <AvatarImage v-if="booking.business.logo" :src="booking.business.logo" />
                <AvatarFallback class="text-lg font-bold">{{ booking.business.name.substring(0, 2) }}</AvatarFallback>
              </Avatar>
          </div>
          <div>
            <p class="font-semibold text-foreground">{{ booking.business.name }}</p>
            <p class="text-xs text-muted-foreground font-mono">ID: {{ booking.serviceId.slice(0, 8) }}…</p>
          </div>
        </div>
        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full capitalize', badgeClass]">
          {{ booking.status }}
        </span>
      </div>

      <!-- Cancelled by business notice -->
      <div
        v-if="booking.cancelledBy === 'business'"
        class="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs mb-4"
      >
        <AlertCircle class="w-3.5 h-3.5 shrink-0" />
        Cancelled by the business{{ booking.cancellationReason ? ` — ${booking.cancellationReason}` : '' }}
      </div>

      <!-- Detail grid -->
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm p-3 bg-muted/20 rounded-xl">
        <div>
          <dt class="text-xs text-muted-foreground mb-0.5">Date</dt>
          <dd class="font-medium text-sm">{{ formatBookingDate(booking.date) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground mb-0.5">Time</dt>
          <dd class="font-medium">{{ formatBookingTime(booking.time) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground mb-0.5">Duration</dt>
          <dd class="font-medium">{{ booking.durationMinutes }} min</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground mb-0.5">Amount</dt>
          <dd class="font-medium">{{ formatCurrency(booking.price) }}</dd>
        </div>
      </dl>

      <!-- Notes from customer -->
      <p
        v-if="booking.notesFromCustomer"
        class="mt-3 text-sm italic text-muted-foreground border-l-2 border-border pl-3"
      >
        "{{ booking.notesFromCustomer }}"
      </p>

      <!-- Reference -->
      <p class="mt-3 text-xs font-mono text-muted-foreground">Ref: {{ booking.reference }}</p>
    </div>

    <!-- Actions — active bookings -->
    <div
      v-if="booking.status === 'confirmed' || booking.status === 'pending'"
      class="border-t bg-muted/10 px-5 py-3 flex flex-wrap gap-2 items-center"
    >
      <Button
        v-if="booking.canCancel && !isCancelExpanded"
        variant="outline"
        size="sm"
        class="text-destructive border-destructive"
        @click="emit('cancel', { id: booking.id, reason: '' })"
      >
        Cancel booking
      </Button>
      <NuxtLink :to="`/services/${booking.serviceId}`" class="ml-auto">
        <Button variant="ghost" size="sm">View service</Button>
      </NuxtLink>
    </div>

    <!-- Actions — completed -->
    <div
      v-if="booking.status === 'completed'"
      class="border-t bg-muted/10 px-5 py-3 flex flex-wrap gap-2 items-center"
    >
      <NuxtLink :to="`/services/${booking.serviceId}?review=${booking.id}#reviews`">
        <Button variant="outline" size="sm">Leave a review</Button>
      </NuxtLink>
      <NuxtLink :to="`/services/${booking.serviceId}`" class="ml-auto">
        <Button variant="ghost" size="sm">Book again</Button>
      </NuxtLink>
    </div>

    <!-- Actions — cancelled -->
    <div
      v-if="booking.status === 'cancelled'"
      class="border-t bg-muted/10 px-5 py-3 flex flex-wrap gap-2 items-center"
    >
      <div v-if="booking.refundIssued" class="flex items-center gap-1.5 text-sm text-green-600 font-medium">
        <CheckCircle2 class="w-4 h-4" />
        {{ formatCurrency(booking.refundAmount ?? 0) }} refunded
      </div>
      <NuxtLink :to="`/services/${booking.serviceId}`" class="ml-auto">
        <Button variant="ghost" size="sm">Book again</Button>
      </NuxtLink>
    </div>

    <!-- Inline cancel panel -->
    <div
      v-if="isCancelExpanded"
      class="border-t border-destructive/20 bg-destructive/5 px-5 py-4"
    >
      <p class="text-sm text-muted-foreground mb-3">
        Are you sure? This appointment will be cancelled.
      </p>
      <Input
        v-model="cancelReason"
        placeholder="Reason (optional)"
        class="mb-3 text-sm"
      />
      <div class="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          @click="emit('cancel', { id: booking.id, reason: cancelReason })"
        >
          Yes, cancel
        </Button>
        <Button variant="outline" size="sm" @click="emit('close-cancel')">
          Keep booking
        </Button>
      </div>
    </div>
  </Card>
</template>
