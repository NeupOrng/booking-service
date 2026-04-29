<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import type { Booking } from '~/types'

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

const statusClass: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  confirmed: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-muted text-muted-foreground',
}

const initials = computed(() => {
  const id = props.booking.user_id ?? ''
  return id.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div>
    <!-- Row -->
    <div class="hidden md:grid grid-cols-[100px_80px_1fr_160px_70px_90px_100px_140px] gap-3 items-center bg-card border border-border rounded-xl px-4 py-3 text-sm">
      <!-- Reference -->
      <span class="font-mono text-xs text-muted-foreground truncate">{{ booking.reference }}</span>

      <!-- Customer initials -->
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {{ initials }}
        </div>
        <span class="text-xs text-muted-foreground truncate">{{ booking.user_id.slice(0, 6) }}…</span>
      </div>

      <!-- Service ID -->
      <span class="text-xs text-muted-foreground truncate font-mono">{{ booking.service_id.slice(0, 8) }}…</span>

      <!-- Date & time -->
      <div>
        <p class="text-xs font-medium">{{ formatBookingDate(booking.date) }}</p>
        <p class="text-xs text-muted-foreground">{{ formatBookingTime(booking.time) }}</p>
      </div>

      <!-- Duration -->
      <span class="text-xs text-muted-foreground">{{ booking.duration_minutes }}m</span>

      <!-- Amount -->
      <span class="text-sm font-medium">{{ formatCurrency(booking.price) }}</span>

      <!-- Status -->
      <span :class="['text-xs font-semibold px-2 py-1 rounded-full capitalize text-center', statusClass[booking.status] ?? '']">
        {{ booking.status }}
      </span>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 justify-end">
        <template v-if="isLoading">
          <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
        </template>
        <template v-else-if="booking.status === 'pending'">
          <Button size="sm" class="h-7 px-2 text-xs" @click="emit('confirm', booking.id)">Confirm</Button>
          <Button size="sm" variant="outline" class="h-7 px-2 text-xs text-destructive border-destructive" @click="emit('toggleCancel', booking.id)">Decline</Button>
        </template>
        <template v-else-if="booking.status === 'confirmed'">
          <Button size="sm" variant="outline" class="h-7 px-2 text-xs text-green-700 border-green-300" @click="emit('complete', booking.id)">Done</Button>
          <Button size="sm" variant="outline" class="h-7 px-2 text-xs text-destructive border-destructive" @click="emit('toggleCancel', booking.id)">Cancel</Button>
        </template>
      </div>
    </div>

    <!-- Mobile card -->
    <div class="md:hidden bg-card border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-muted-foreground">{{ booking.reference }}</span>
        <span :class="['text-xs font-semibold px-2 py-1 rounded-full capitalize', statusClass[booking.status] ?? '']">
          {{ booking.status }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div><p class="text-xs text-muted-foreground">Date</p><p class="font-medium text-xs">{{ formatBookingDate(booking.date) }}</p></div>
        <div><p class="text-xs text-muted-foreground">Time</p><p class="font-medium">{{ formatBookingTime(booking.time) }}</p></div>
        <div><p class="text-xs text-muted-foreground">Duration</p><p class="font-medium">{{ booking.duration_minutes }} min</p></div>
        <div><p class="text-xs text-muted-foreground">Amount</p><p class="font-medium">{{ formatCurrency(booking.price) }}</p></div>
      </div>
      <div class="flex gap-2 pt-1" v-if="!isLoading">
        <template v-if="booking.status === 'pending'">
          <Button size="sm" class="flex-1 h-8 text-xs" @click="emit('confirm', booking.id)">Confirm</Button>
          <Button size="sm" variant="outline" class="flex-1 h-8 text-xs text-destructive border-destructive" @click="emit('toggleCancel', booking.id)">Decline</Button>
        </template>
        <template v-else-if="booking.status === 'confirmed'">
          <Button size="sm" variant="outline" class="flex-1 h-8 text-xs text-green-700 border-green-300" @click="emit('complete', booking.id)">Mark done</Button>
          <Button size="sm" variant="outline" class="flex-1 h-8 text-xs text-destructive border-destructive" @click="emit('toggleCancel', booking.id)">Cancel</Button>
        </template>
      </div>
      <div v-else class="flex justify-center py-1"><Loader2 class="w-4 h-4 animate-spin text-muted-foreground" /></div>
    </div>

    <!-- Inline cancel input -->
    <div v-if="isCancelOpen" class="mt-1 border border-destructive/20 bg-destructive/5 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <Input v-model="cancelReason" placeholder="Reason (optional)" class="flex-1 h-9 text-sm" />
      <div class="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" @click="emit('toggleCancel', '')">Back</Button>
        <Button variant="destructive" size="sm" @click="emit('cancel', booking.id, cancelReason)">
          Confirm cancellation
        </Button>
      </div>
    </div>
  </div>
</template>
