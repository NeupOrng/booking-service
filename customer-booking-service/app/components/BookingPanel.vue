<script setup lang="ts">
import { addDays, format } from 'date-fns'
import { useBreakpoints } from '@vueuse/core'
import type { AvailabilitySlot, Service } from '~/types'

const props = defineProps<{
  serviceId: string
  service?: Service | null
}>()

const { fetchAvailability } = useBooking()
const { isAuthenticated } = useAuth()
const { formatCurrency } = useFormatters()
const router = useRouter()

const breakpoints = useBreakpoints({ md: 768 })
const isMobile = breakpoints.smallerOrEqual('md')

const days = computed(() => {
  const arr = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i)
    arr.push({
      date: d,
      isoDate: format(d, 'yyyy-MM-dd'),
      dayLabel: format(d, 'EEE'),
      dateLabel: format(d, 'd'),
    })
  }
  return arr
})

const selectedDate = ref<string>(days.value[0]?.isoDate ?? '')
const selectedTime = ref<string | null>(null)
const slots = ref<AvailabilitySlot[]>([])
const loadingSlots = ref(false)

watch(
  selectedDate,
  async (newVal) => {
    selectedTime.value = null
    loadingSlots.value = true
    try {
      const res = await fetchAvailability(props.serviceId, newVal)
      slots.value = res.slots
    } finally {
      loadingSlots.value = false
    }
  },
  { immediate: true },
)

async function proceed() {
  if (!selectedDate.value || !selectedTime.value) return
  if (!isAuthenticated.value) {
    router.push({
      path: '/auth/login',
      query: { redirect: `/book/${props.serviceId}?date=${selectedDate.value}&time=${selectedTime.value}` },
    })
  } else {
    router.push({
      path: `/book/${props.serviceId}`,
      query: { date: selectedDate.value, time: selectedTime.value },
    })
  }
}
</script>

<template>
  <!-- Desktop: sticky card -->
  <Card v-if="!isMobile" class="p-6 sticky top-20 flex flex-col gap-5">
    <div>
      <h3 class="text-lg font-semibold mb-1">Select Date &amp; Time</h3>
      <p class="text-sm text-muted-foreground">Choose an available slot.</p>
    </div>

    <!-- 7-day strip -->
    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        v-for="day in days"
        :key="day.isoDate"
        @click="selectedDate = day.isoDate"
        :class="[
          'flex flex-col items-center justify-center rounded-xl min-w-[60px] py-2.5 border transition-colors',
          selectedDate === day.isoDate
            ? 'bg-primary text-white border-primary'
            : 'bg-background hover:bg-accent border-border',
        ]"
      >
        <span class="text-[10px] uppercase font-medium opacity-70">{{ day.dayLabel }}</span>
        <span class="text-lg font-bold leading-tight">{{ day.dateLabel }}</span>
      </button>
    </div>

    <!-- Slots -->
    <div>
      <div v-if="loadingSlots" class="grid grid-cols-3 gap-2">
        <Skeleton v-for="i in 9" :key="i" class="h-10 w-full rounded-lg" />
      </div>
      <div v-else-if="slots.length === 0" class="text-center p-6 border rounded-xl bg-muted/30">
        <p class="text-sm font-medium">No availability on this date.</p>
        <p class="text-xs text-muted-foreground mt-1">Try another day.</p>
      </div>
      <div v-else class="grid grid-cols-3 gap-2">
        <button
          v-for="slot in slots"
          :key="slot.time"
          :disabled="!slot.available"
          @click="selectedTime = slot.time"
          :class="[
            'py-2 px-2 text-xs font-medium rounded-lg border transition-colors relative',
            !slot.available
              ? 'opacity-40 cursor-not-allowed bg-muted border-border'
              : selectedTime === slot.time
                ? 'bg-primary border-primary text-white'
                : 'bg-background border-input hover:border-primary hover:text-primary',
          ]"
        >
          <span class="block">{{ format(new Date(`2000-01-01T${slot.time}`), 'h:mm a') }}</span>
          <span
            v-if="slot.available && slot.capacity > 1 && slot.remainingCapacity <= 3"
            :class="['block text-[9px] font-medium', selectedTime === slot.time ? 'text-white/80' : 'text-amber-600']"
          >
            {{ slot.remainingCapacity }} left
          </span>
        </button>
      </div>
    </div>

    <Button class="w-full h-11" :disabled="!selectedDate || !selectedTime" @click="proceed">
      Continue to booking
    </Button>
  </Card>

  <!-- Mobile: fixed bottom bar + Sheet -->
  <div v-else class="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-4 py-3 flex items-center justify-between">
    <div v-if="service">
      <p class="font-semibold text-sm">{{ formatCurrency(service.price) }}</p>
      <p class="text-xs text-muted-foreground">{{ service.duration_minutes }} min</p>
    </div>
    <div v-else class="flex-1" />

    <Sheet>
      <SheetTrigger as-child>
        <Button class="bg-primary text-white px-6">Book now</Button>
      </SheetTrigger>
      <SheetContent side="bottom" class="h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader class="mb-4">
          <SheetTitle>Select a time</SheetTitle>
        </SheetHeader>

        <!-- 7-day strip (sheet) -->
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          <button
            v-for="day in days"
            :key="day.isoDate"
            @click="selectedDate = day.isoDate"
            :class="[
              'flex flex-col items-center justify-center rounded-xl min-w-[60px] py-2.5 border transition-colors',
              selectedDate === day.isoDate
                ? 'bg-primary text-white border-primary'
                : 'bg-background hover:bg-accent border-border',
            ]"
          >
            <span class="text-[10px] uppercase font-medium opacity-70">{{ day.dayLabel }}</span>
            <span class="text-lg font-bold leading-tight">{{ day.dateLabel }}</span>
          </button>
        </div>

        <!-- Slots (sheet) -->
        <div class="mb-6">
          <div v-if="loadingSlots" class="grid grid-cols-3 gap-2">
            <Skeleton v-for="i in 9" :key="i" class="h-10 w-full rounded-lg" />
          </div>
          <div v-else-if="slots.length === 0" class="text-center p-6 border rounded-xl bg-muted/30">
            <p class="text-sm">No availability on this date.</p>
          </div>
          <div v-else class="grid grid-cols-3 gap-2">
            <button
              v-for="slot in slots"
              :key="slot.time"
              :disabled="!slot.available"
              @click="selectedTime = slot.time"
              :class="[
                'py-2 px-2 text-xs font-medium rounded-lg border transition-colors',
                !slot.available
                  ? 'opacity-40 cursor-not-allowed bg-muted border-border'
                  : selectedTime === slot.time
                    ? 'bg-primary border-primary text-white'
                    : 'bg-background border-input hover:border-primary hover:text-primary',
              ]"
            >
              <span class="block">{{ format(new Date(`2000-01-01T${slot.time}`), 'h:mm a') }}</span>
              <span
                v-if="slot.available && slot.capacity > 1 && slot.remainingCapacity <= 3"
                :class="['block text-[9px] font-medium', selectedTime === slot.time ? 'text-white/80' : 'text-amber-600']"
              >
                {{ slot.remainingCapacity }} left
              </span>
            </button>
          </div>
        </div>

        <Button class="w-full h-12 text-base" :disabled="!selectedDate || !selectedTime" @click="proceed">
          Continue to booking
        </Button>
      </SheetContent>
    </Sheet>
  </div>
</template>
