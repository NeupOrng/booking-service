<script setup lang="ts">
import { addDays, format } from 'date-fns'
import type { AvailabilitySlot } from '~/types'

const props = defineProps<{
  serviceId: string
}>()

const { fetchAvailability } = useBooking()
const { isAuthenticated } = useAuth()
const router = useRouter()

// State
const days = computed(() => {
  const arr = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i)
    arr.push({
      date: d,
      isoDate: format(d, 'yyyy-MM-dd'),
      dayLabel: format(d, 'EEE'),
      dateLabel: format(d, 'd')
    })
  }
  return arr
})

const selectedDate = ref<string>(days.value[0]?.isoDate ?? '')
const selectedTime = ref<string | null>(null)
const slots = ref<AvailabilitySlot[]>([])
const loadingSlots = ref(false)

// Fetch slots when date changes
watch(selectedDate, async (newVal) => {
  selectedTime.value = null
  loadingSlots.value = true
  try {
    const res = await fetchAvailability(props.serviceId, newVal)
    slots.value = res.slots
  } finally {
    loadingSlots.value = false
  }
}, { immediate: true })

async function checkIntentAndContinue() {
  if (!selectedDate.value || !selectedTime.value) return
  
  if (!isAuthenticated.value) {
    // Optionally save intent to a store (or just use redirect params)
    router.push({
      path: '/auth/login',
      query: { redirect: `/book/${props.serviceId}?date=${selectedDate.value}&time=${selectedTime.value}` }
    })
  } else {
    router.push({
      path: `/book/${props.serviceId}`,
      query: { date: selectedDate.value, time: selectedTime.value }
    })
  }
}
</script>

<template>
  <Card class="p-6 sticky top-20 flex flex-col gap-6">
    <div>
      <h3 class="text-xl font-semibold mb-2">Select Date & Time</h3>
      <p class="text-sm text-muted-foreground">Choose an available slot for your appointment.</p>
    </div>

    <!-- 7-Day Strip -->
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        v-for="day in days"
        :key="day.isoDate"
        @click="selectedDate = day.isoDate"
        :class="[
          'flex flex-col items-center justify-center rounded-lg min-w-[64px] py-2 transition-colors border',
          selectedDate === day.isoDate
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background hover:bg-accent border-border text-foreground'
        ]"
      >
        <span class="text-xs uppercase font-medium opacity-80">{{ day.dayLabel }}</span>
        <span class="text-xl font-bold">{{ day.dateLabel }}</span>
      </button>
    </div>

    <!-- Time slots -->
    <div class="flex-1">
      <div v-if="loadingSlots" class="grid grid-cols-3 gap-2">
        <Skeleton v-for="i in 9" :key="i" class="h-10 w-full" />
      </div>
      
      <div v-else-if="slots.length === 0" class="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-muted/30">
        <p class="font-medium text-foreground">No availability on this date.</p>
        <p class="text-sm text-muted-foreground">Please select another day.</p>
      </div>

      <div v-else class="grid grid-cols-3 gap-2">
        <button
          v-for="slot in slots"
          :key="slot.time"
          :disabled="!slot.available"
          @click="selectedTime = slot.time"
          :class="[
            'py-2 px-3 text-sm font-medium rounded-md border transition-colors relative',
            !slot.available
              ? 'opacity-40 cursor-not-allowed bg-muted border-border'
              : selectedTime === slot.time
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background border-input hover:border-primary hover:text-primary text-foreground'
          ]"
        >
          <span class="block">{{ format(new Date(`2000-01-01T${slot.time}`), 'h:mm a') }}</span>
          <span
            v-if="slot.available && slot.capacity > 1 && slot.remainingCapacity <= 3"
            class="block text-[10px] leading-tight font-medium"
            :class="selectedTime === slot.time ? 'text-white/80' : 'text-amber-600'"
          >
            {{ slot.remainingCapacity }} left
          </span>
        </button>
      </div>
    </div>

    <!-- Continue -->
    <Button
      class="w-full mt-auto h-12 text-lg"
      :disabled="!selectedDate || !selectedTime"
      @click="checkIntentAndContinue"
    >
      Continue to booking
    </Button>
  </Card>
</template>
