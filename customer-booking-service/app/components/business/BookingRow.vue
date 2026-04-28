<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import type { Booking } from '~/types'
import { toast } from 'vue-sonner'

const props = defineProps<{
  booking: Booking
  expandedCancelId: string | null
}>()
const emit = defineEmits<{
  (e: 'updated', booking: Booking): void
  (e: 'expand-cancel', id: string | null): void
}>()

const { confirmBooking, completeBooking, cancelBusinessBooking } = useBusinessOwner()
const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()

const actionLoading = ref<string | null>(null)
const cancelReason = ref('')

async function runAction(label: string, fn: () => Promise<Booking>) {
  actionLoading.value = label
  try {
    const updated = await fn()
    toast.success(`Booking ${label}`)
    emit('updated', updated)
  } catch (e: any) {
    toast.error(e?.data?.message ?? `Failed to ${label} booking`)
  } finally {
    actionLoading.value = null
  }
}

async function onConfirm() {
  await runAction('confirmed', () => confirmBooking(props.booking.id))
}

async function onComplete() {
  await runAction('completed', () => completeBooking(props.booking.id))
}

async function onCancel() {
  await runAction('cancelled', () => cancelBusinessBooking(props.booking.id, cancelReason.value || undefined))
  emit('expand-cancel', null)
}

const statusClass: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  confirmed: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-muted text-muted-foreground',
}
</script>

<template>
  <div>
    <div class="grid grid-cols-[1fr_1fr_1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-3 bg-card border border-border rounded-xl text-sm">
      <!-- Reference -->
      <span class="font-mono text-xs text-muted-foreground">{{ booking.reference }}</span>
      <!-- Service -->
      <span class="font-medium truncate">{{ booking.service.name }}</span>
      <!-- Business -->
      <span class="text-muted-foreground truncate">{{ booking.business.name }}</span>
      <!-- Date & time -->
      <span class="text-muted-foreground whitespace-nowrap">
        {{ formatBookingDate(booking.date) }}<br/>
        <span class="text-xs">{{ formatBookingTime(booking.time) }}</span>
      </span>
      <!-- Duration -->
      <span class="text-muted-foreground">{{ booking.service.duration_minutes }} min</span>
      <!-- Amount -->
      <span class="font-medium">{{ formatCurrency(booking.price) }}</span>
      <!-- Status badge -->
      <span :class="['px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap', statusClass[booking.status] ?? '']">
        {{ booking.status }}
      </span>
      <!-- Actions -->
      <div class="flex items-center gap-1.5 shrink-0">
        <template v-if="booking.status === 'pending'">
          <Button size="sm" @click="onConfirm" :disabled="!!actionLoading">
            <Loader2 v-if="actionLoading === 'confirmed'" class="w-3 h-3 mr-1 animate-spin" />
            Confirm
          </Button>
          <Button size="sm" variant="outline" class="text-destructive border-destructive"
            @click="emit('expand-cancel', expandedCancelId === booking.id ? null : booking.id)"
            :disabled="!!actionLoading">
            Decline
          </Button>
        </template>
        <template v-else-if="booking.status === 'confirmed'">
          <Button size="sm" variant="outline" @click="onComplete" :disabled="!!actionLoading">
            <Loader2 v-if="actionLoading === 'completed'" class="w-3 h-3 mr-1 animate-spin" />
            Mark done
          </Button>
          <Button size="sm" variant="outline" class="text-destructive border-destructive"
            @click="emit('expand-cancel', expandedCancelId === booking.id ? null : booking.id)"
            :disabled="!!actionLoading">
            Cancel
          </Button>
        </template>
      </div>
    </div>

    <!-- Inline cancel panel -->
    <div v-if="expandedCancelId === booking.id"
      class="mt-1 border border-destructive/20 bg-destructive/5 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <Input v-model="cancelReason" placeholder="Reason (optional)" class="flex-1 h-9" />
      <div class="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" @click="emit('expand-cancel', null)">Back</Button>
        <Button variant="destructive" size="sm" @click="onCancel" :disabled="actionLoading === 'cancelled'">
          <Loader2 v-if="actionLoading === 'cancelled'" class="w-3 h-3 mr-1 animate-spin" />
          Confirm cancellation
        </Button>
      </div>
    </div>
  </div>
</template>
