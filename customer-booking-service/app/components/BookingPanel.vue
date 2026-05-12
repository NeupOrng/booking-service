<script setup lang="ts">
import { addDays, format, parse, isToday, parseISO } from 'date-fns'
import { Clock, ArrowRight, CalendarCheck } from 'lucide-vue-next'
import type { AvailabilitySlot, Service } from '~/types'

type PeriodId = 'morning' | 'afternoon' | 'evening'

export interface DayInfo {
  date: Date
  isoDate: string
  dayLabel: string
  dateLabel: string
  isToday: boolean
  isSoldOut: boolean
}

const props = defineProps<{
  serviceId: string
  service?: Service | null
}>()

const { fetchAvailability } = useBooking()
const { isAuthenticated } = useAuth()
const { formatCurrency, formatNextSlot } = useFormatters()
const router = useRouter()

// ── Week navigation ───────────────────────────────────────────────────────────
const weekOffset = ref(0)
const soldOutDates = ref(new Set<string>())

const days = computed<DayInfo[]>(() => {
  const base = addDays(new Date(), weekOffset.value * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(base, i)
    const iso = format(d, 'yyyy-MM-dd')
    return {
      date: d,
      isoDate: iso,
      dayLabel: format(d, 'EEE'),
      dateLabel: format(d, 'd'),
      isToday: isToday(d),
      isSoldOut: soldOutDates.value.has(iso),
    }
  })
})

const monthStripLabel = computed(() => format(days.value[3]?.date ?? new Date(), 'MMMM yyyy'))

// ── Slot state ────────────────────────────────────────────────────────────────
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))
const selectedTime = ref<string | null>(null)
const slots = ref<AvailabilitySlot[]>([])
const loadingSlots = ref(false)
const activePeriod = ref<PeriodId>('morning')
const sheetOpen = ref(false)

const groupedSlots = computed(() => ({
  morning: slots.value.filter(s => s.time < '12:00'),
  afternoon: slots.value.filter(s => s.time >= '12:00' && s.time < '17:00'),
  evening: slots.value.filter(s => s.time >= '17:00'),
}))

const periodCounts = computed(() => ({
  morning: groupedSlots.value.morning.filter(s => s.available).length,
  afternoon: groupedSlots.value.afternoon.filter(s => s.available).length,
  evening: groupedSlots.value.evening.filter(s => s.available).length,
}))

function fmtTime(t: string) {
  return format(parse(t, 'HH:mm', new Date()), 'h:mm a')
}

const summaryText = computed(() => {
  if (!selectedTime.value) return null
  const day = days.value.find(d => d.isoDate === selectedDate.value)
  const label = day?.isToday ? 'Today' : format(parseISO(selectedDate.value), 'EEE, MMM d')
  return `${label} · ${fmtTime(selectedTime.value)}`
})

const nextAvailableLabel = computed(() => {
  if (!props.service?.next_available_slot) return null
  return formatNextSlot(props.service.next_available_slot).label
})

const hasAvailableToday = computed(() => {
  if (!props.service?.next_available_slot) return false
  try { return isToday(parseISO(props.service.next_available_slot)) } catch { return false }
})

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(
  selectedDate,
  async () => {
    const prevTime = selectedTime.value
    loadingSlots.value = true
    try {
      const res = await fetchAvailability(props.serviceId, selectedDate.value)
      slots.value = res.slots
      if (!res.slots.some(s => s.available)) {
        soldOutDates.value.add(selectedDate.value)
      } else {
        soldOutDates.value.delete(selectedDate.value)
      }
      // Keep selected time only if that slot is still available on the new date
      if (prevTime && !res.slots.find(s => s.time === prevTime && s.available)) {
        selectedTime.value = null
      }
      // Auto-select the period containing the first available slot
      const first = res.slots.find(s => s.available)
      if (first) {
        activePeriod.value = first.time < '12:00' ? 'morning' : first.time < '17:00' ? 'afternoon' : 'evening'
      }
    } finally {
      loadingSlots.value = false
    }
  },
  { immediate: true },
)

// When the week changes, ensure selectedDate is still in view
watch(weekOffset, () => {
  if (!days.value.find(d => d.isoDate === selectedDate.value)) {
    selectedDate.value = days.value[0].isoDate
  }
})

// ── Proceed ───────────────────────────────────────────────────────────────────
function proceed() {
  if (!selectedDate.value || !selectedTime.value) return
  const path = `/book/${props.serviceId}`
  const query = { date: selectedDate.value, time: selectedTime.value }
  if (!isAuthenticated.value) {
    router.push({ path: '/auth/login', query: { redirect: `${path}?date=${query.date}&time=${query.time}` } })
  } else {
    router.push({ path, query })
  }
}
</script>

<template>
  <!-- ═══════════════════════════════════════════════════════════════════════════
       DESKTOP PANEL  (≥ md)
       ═══════════════════════════════════════════════════════════════════════════ -->
  <div class="hidden md:block">
    <div
      class="sticky top-5 bg-white border border-border rounded-2xl p-5 flex flex-col gap-4"
      style="box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);"
    >
      <!-- Header: price + "Available today" -->
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="flex items-baseline gap-1 leading-none">
            <span class="text-[22px] font-extrabold tracking-tight text-foreground" style="letter-spacing:-0.01em;">
              {{ service ? formatCurrency(service.price) : '—' }}
            </span>
            <span class="text-[11px] font-medium text-muted-foreground ml-1">per session</span>
          </div>
          <div class="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-muted-foreground">
            <Clock class="w-3 h-3 shrink-0" />
            {{ service?.duration_minutes ?? '—' }} min
          </div>
        </div>
        <span v-if="hasAvailableToday" class="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 shrink-0">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Available today
        </span>
      </div>

      <!-- Pick a date -->
      <div>
        <p class="text-[13px] font-semibold mb-2">Pick a date</p>
        <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            v-for="day in days"
            :key="day.isoDate"
            :disabled="day.isSoldOut"
            :style="day.isSoldOut ? 'background:repeating-linear-gradient(135deg,#fff 0 5px,#f3f4f6 5px 10px)' : ''"
            :class="[
              'flex flex-col items-center rounded-[10px] min-w-[56px] py-2 border transition-all duration-100 flex-shrink-0',
              selectedDate === day.isoDate
                ? 'bg-primary border-primary text-white'
                : day.isSoldOut
                  ? 'border-border text-muted-foreground cursor-not-allowed'
                  : 'bg-white border-border hover:border-primary text-foreground',
            ]"
            @click="!day.isSoldOut && (selectedDate = day.isoDate)"
          >
            <span class="text-[9px] uppercase tracking-[.08em] font-medium opacity-70 leading-none">{{ day.dayLabel }}</span>
            <span class="text-[16px] font-bold leading-tight mt-1">{{ day.dateLabel }}</span>
          </button>
        </div>
      </div>

      <!-- Available times -->
      <div>
        <p class="text-[13px] font-semibold mb-2">Available times</p>

        <!-- Period tabs -->
        <div class="flex bg-muted rounded-[9px] p-[3px] mb-3">
          <button
            v-for="p in (['morning', 'afternoon', 'evening'] as PeriodId[])"
            :key="p"
            :class="[
              'flex-1 text-[11px] font-medium py-[7px] px-1 rounded-[6px] transition-all duration-150 capitalize',
              activePeriod === p
                ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.07)]'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="activePeriod = p"
          >
            {{ p.charAt(0).toUpperCase() + p.slice(1) }}
            <span class="font-normal opacity-70 ml-0.5">{{ periodCounts[p] }}</span>
          </button>
        </div>

        <!-- Slot grid -->
        <div v-if="loadingSlots" class="grid grid-cols-3 gap-1.5">
          <Skeleton v-for="i in 6" :key="i" class="h-9 rounded-lg" />
        </div>
        <div v-else-if="groupedSlots[activePeriod].length === 0" class="py-5 text-center border border-border rounded-xl bg-muted/30">
          <p class="text-xs text-muted-foreground">No {{ activePeriod }} slots on this date</p>
        </div>
        <div v-else class="grid grid-cols-3 gap-1.5">
          <button
            v-for="slot in groupedSlots[activePeriod]"
            :key="slot.time"
            :disabled="!slot.available"
            :class="[
              'py-2 px-1 text-[12px] font-semibold rounded-lg border transition-all duration-100',
              !slot.available
                ? 'opacity-35 cursor-not-allowed bg-muted border-border'
                : selectedTime === slot.time
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border hover:border-primary hover:text-primary',
            ]"
            @click="slot.available && (selectedTime = slot.time)"
          >
            {{ fmtTime(slot.time) }}
            <span
              v-if="slot.available && slot.remainingCapacity <= 3 && slot.capacity > 1"
              :class="['block text-[9px] font-medium mt-0.5', selectedTime === slot.time ? 'text-white/85' : 'text-amber-700']"
            >
              {{ slot.remainingCapacity }} left
            </span>
          </button>
        </div>
      </div>

      <!-- Summary chip -->
      <Transition name="fade">
        <div
          v-if="summaryText"
          class="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[12px] font-medium text-foreground"
          style="background:rgba(31,168,190,.06);border:1px dashed rgba(31,168,190,.3);"
        >
          <CalendarCheck class="w-3.5 h-3.5 text-primary shrink-0" />
          Booking for
          <span class="text-primary font-semibold ml-0.5">{{ summaryText }}</span>
        </div>
      </Transition>

      <!-- CTA button -->
      <button
        :disabled="!selectedTime"
        class="w-full h-11 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style="background:#1fa8be;"
        @mouseenter="($event.target as HTMLElement).style.background='#1a8fa3'"
        @mouseleave="($event.target as HTMLElement).style.background=selectedTime ? '#1fa8be' : ''"
        @click="proceed"
      >
        Continue to booking
        <ArrowRight class="w-3.5 h-3.5" />
      </button>

      <!-- Trust line -->
      <p class="text-[11px] text-muted-foreground text-center leading-snug">
        <span class="font-semibold text-foreground">Free cancellation</span> up to 24 hours before
      </p>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       MOBILE DOCK  (< md) — fixed bottom bar, always visible
       ═══════════════════════════════════════════════════════════════════════════ -->
  <div class="md:hidden">
    <div
      class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex items-center gap-3 px-4 pt-3"
      style="padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));box-shadow:0 -6px 20px rgba(20,30,60,0.08);"
    >
      <div class="flex-1 min-w-0">
        <p class="text-[18px] font-extrabold leading-none text-foreground" style="letter-spacing:-0.01em;">
          {{ service ? formatCurrency(service.price) : '—' }}
          <span class="text-[11px] font-medium text-muted-foreground ml-1">/ session</span>
        </p>
        <p v-if="nextAvailableLabel" class="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mt-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Next: {{ nextAvailableLabel }}
        </p>
      </div>
      <button
        class="h-11 rounded-[10px] px-[18px] text-[13px] font-semibold text-white flex items-center gap-1.5 shrink-0"
        style="background:#1fa8be;"
        @click="sheetOpen = true"
      >
        Pick a time
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Bottom sheet (teleported to body by Radix) -->
    <BookingSheet
      v-model:open="sheetOpen"
      :service="service"
      :days="days"
      :week-offset="weekOffset"
      :selected-date="selectedDate"
      :selected-time="selectedTime"
      :grouped-slots="groupedSlots"
      :loading-slots="loadingSlots"
      :month-strip-label="monthStripLabel"
      @update:selected-date="selectedDate = $event"
      @update:selected-time="selectedTime = $event"
      @update:week-offset="weekOffset = $event"
      @proceed="proceed"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity .15s, transform .15s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>
