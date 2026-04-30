<script setup lang="ts">
import { Loader2, Mail, Phone, Clock, CalendarDays } from 'lucide-vue-next'
import type { Booking } from '~/models'

const props = defineProps<{
  booking: Booking
  isLoading?: boolean
  expandedCancelId: string | null
}>()

const emit = defineEmits<{
  confirm: [id: string]
  complete: [id: string]
  cancel: [id: string, reason: string]
  toggleCancel: [id: string]
}>()

const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()

const cancelReason = ref('')
const isCancelOpen = computed(() => props.expandedCancelId === props.booking.id)

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-muted text-muted-foreground border-border' },
}

// ── Dummy customer info — replace with real data when backend provides it ────
const customerInitials = computed(() => {
  const id = props.booking.userId ?? ''
  return id.slice(0, 2).toUpperCase()
})
const customerPhone = '+1 (555) 000-0000'
</script>

<template>
  <div>
    <!-- Card -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden listeo-shadow">
      <!-- Top section: customer + status + actions -->
      <div class="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start gap-4">

        <!-- Customer info -->
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {{ customerInitials }}
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-sm text-foreground">{{ booking.customer.fullName }}</p>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span class="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail class="w-3 h-3 shrink-0" />
                {{ booking.customer.email }}
              </span>
              <span class="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone class="w-3 h-3 shrink-0" />
                {{ customerPhone }}
              </span>
            </div>
          </div>
        </div>

        <!-- Status + actions -->
        <div class="flex items-center gap-2 shrink-0">
          <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full border capitalize', statusConfig[booking.status]?.cls ?? '']">
            {{ statusConfig[booking.status]?.label ?? booking.status }}
          </span>

          <template v-if="isLoading">
            <Loader2 class="w-4 h-4 animate-spin text-muted-foreground ml-1" />
          </template>
          <template v-else-if="booking.status === 'pending'">
            <Button size="sm" class="h-8 px-3 text-xs" @click="emit('confirm', booking.id)">Confirm</Button>
            <Button size="sm" variant="outline" class="h-8 px-3 text-xs text-destructive border-destructive" @click="emit('toggleCancel', booking.id)">Decline</Button>
          </template>
          <template v-else-if="booking.status === 'confirmed'">
            <Button size="sm" variant="outline" class="h-8 px-3 text-xs text-green-700 border-green-300" @click="emit('complete', booking.id)">Mark done</Button>
            <Button size="sm" variant="outline" class="h-8 px-3 text-xs text-destructive border-destructive" @click="emit('toggleCancel', booking.id)">Cancel</Button>
          </template>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-px bg-border mx-5" />

      <!-- Booking details -->
      <div class="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <CalendarDays class="w-3 h-3" /> Date &amp; time
          </p>
          <p class="font-medium text-xs">{{ formatBookingDate(booking.date) }}</p>
          <p class="text-muted-foreground text-xs">{{ formatBookingTime(booking.time) }}</p>
        </div>

        <div>
          <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Clock class="w-3 h-3" /> Duration
          </p>
          <p class="font-medium">{{ booking.durationMinutes }} min</p>
        </div>

        <div>
          <p class="text-xs text-muted-foreground mb-1">Service</p>
          <p class="font-medium truncate">{{ booking.service?.name ?? booking.serviceId?.slice(0, 8) }}</p>
          <p class="text-xs text-muted-foreground">{{ formatCurrency(booking.price) }}</p>
        </div>

        <div>
          <p class="text-xs text-muted-foreground mb-1">Reference</p>
          <p class="font-mono text-xs font-semibold text-foreground">{{ booking.reference }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">ID: {{ booking.userId?.slice(0, 8) }}</p>
        </div>
      </div>
    </div>

    <!-- Inline cancel panel -->
    <div
      v-if="isCancelOpen"
      class="mt-1 border border-destructive/20 bg-destructive/5 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div class="flex-1">
        <p class="text-sm font-medium text-destructive mb-2">Cancel this booking?</p>
        <Input v-model="cancelReason" placeholder="Reason for cancellation (optional)" class="text-sm h-9" />
      </div>
      <div class="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" @click="emit('toggleCancel', '')">Keep</Button>
        <Button variant="destructive" size="sm" @click="emit('cancel', booking.id, cancelReason)">
          Confirm cancellation
        </Button>
      </div>
    </div>
  </div>
</template>
