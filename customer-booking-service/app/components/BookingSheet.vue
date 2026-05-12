<script setup lang="ts">
import { format, parse, isToday, parseISO } from 'date-fns'
import { X, ChevronLeft, ChevronRight, ArrowRight, Sunrise, Sun, Moon } from 'lucide-vue-next'
import type { AvailabilitySlot, Service } from '~/types'

type PeriodId = 'morning' | 'afternoon' | 'evening'
type GroupedSlots = Record<PeriodId, AvailabilitySlot[]>

interface DayInfo {
  date: Date
  isoDate: string
  dayLabel: string
  dateLabel: string
  isToday: boolean
  isSoldOut: boolean
}

const props = defineProps<{
  open: boolean
  service?: Service | null
  days: DayInfo[]
  weekOffset: number
  selectedDate: string
  selectedTime: string | null
  groupedSlots: GroupedSlots
  loadingSlots: boolean
  monthStripLabel: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'update:selectedDate', val: string): void
  (e: 'update:selectedTime', val: string | null): void
  (e: 'update:weekOffset', val: number): void
  (e: 'proceed'): void
}>()

const { formatCurrency } = useFormatters()

const periods = [
  { id: 'morning'   as PeriodId, label: 'Morning',   icon: Sunrise },
  { id: 'afternoon' as PeriodId, label: 'Afternoon', icon: Sun     },
  { id: 'evening'   as PeriodId, label: 'Evening',   icon: Moon    },
]

function fmtTime(t: string) {
  return format(parse(t, 'HH:mm', new Date()), 'h:mm a')
}

const selectedDayLabel = computed(() => {
  const day = props.days.find(d => d.isoDate === props.selectedDate)
  if (!day) return ''
  return day.isToday ? 'Today' : format(parseISO(props.selectedDate), 'EEE, MMM d')
})

const hasAnyAvailable = computed(() =>
  Object.values(props.groupedSlots).flat().some(s => s.available),
)

// Auto-scroll the selected day chip into view whenever the sheet opens
const dayStripRef = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  async (val) => {
    if (!val) return
    await nextTick()
    const idx = props.days.findIndex(d => d.isoDate === props.selectedDate)
    if (idx >= 0 && dayStripRef.value) {
      const chips = dayStripRef.value.querySelectorAll<HTMLElement>('[data-chip]')
      chips[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  },
)
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent
      side="bottom"
      class="rounded-t-[24px] p-0 max-h-[85vh] flex flex-col outline-none focus:outline-none"
    >
      <!-- Grabber handle -->
      <div class="flex justify-center pt-2.5 pb-0.5 shrink-0" aria-hidden="true">
        <div class="w-9 h-1 rounded-full bg-muted-foreground/20" />
      </div>

      <!-- Header -->
      <div class="flex items-start justify-between gap-3 px-5 pt-2 pb-3 shrink-0">
        <div>
          <h3 class="text-[18px] font-bold leading-tight text-foreground">Pick a time</h3>
          <p v-if="service" class="text-[12px] font-medium text-muted-foreground mt-1">
            {{ service.name }} · {{ service.duration_minutes }} min
          </p>
        </div>
        <button
          class="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5"
          aria-label="Close"
          @click="emit('update:open', false)"
        >
          <X class="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <!-- Month strip + day chips -->
      <div class="px-5 shrink-0">
        <!-- Month navigation -->
        <div class="flex items-center justify-between mb-2">
          <button
            :disabled="weekOffset <= 0"
            class="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-accent transition-colors"
            aria-label="Previous week"
            @click="emit('update:weekOffset', weekOffset - 1)"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-[.04em]">
            {{ monthStripLabel }}
          </span>
          <button
            class="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
            aria-label="Next week"
            @click="emit('update:weekOffset', weekOffset + 1)"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Horizontally scrollable day chips -->
        <div ref="dayStripRef" class="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          <button
            v-for="day in days"
            :key="day.isoDate"
            data-chip
            :disabled="day.isSoldOut"
            :style="day.isSoldOut ? 'background:repeating-linear-gradient(135deg,#fff 0 5px,#f3f4f6 5px 10px)' : ''"
            :class="[
              'flex flex-col items-center flex-shrink-0 min-w-[52px] rounded-[10px] py-2 border transition-all duration-100',
              selectedDate === day.isoDate
                ? 'bg-primary border-primary text-white'
                : day.isSoldOut
                  ? 'border-border text-muted-foreground cursor-not-allowed'
                  : 'bg-white border-border text-foreground',
            ]"
            @click="!day.isSoldOut && emit('update:selectedDate', day.isoDate)"
          >
            <span class="text-[9px] uppercase tracking-[.08em] font-medium opacity-70 leading-none">{{ day.dayLabel }}</span>
            <span class="text-[16px] font-bold leading-tight mt-1">{{ day.dateLabel }}</span>
          </button>
        </div>
      </div>

      <div class="h-px bg-border shrink-0" />

      <!-- Scrollable grouped slots -->
      <div class="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 min-h-0">
        <!-- Loading -->
        <div v-if="loadingSlots" class="grid grid-cols-3 gap-2">
          <Skeleton v-for="i in 9" :key="i" class="h-12 rounded-xl" />
        </div>

        <!-- No availability -->
        <div v-else-if="!hasAnyAvailable" class="py-12 text-center">
          <p class="text-sm text-muted-foreground">No slots available on this date.</p>
          <p class="text-xs text-muted-foreground mt-1">Try selecting another day.</p>
        </div>

        <!-- Period groups -->
        <template v-else>
          <div
            v-for="period in periods"
            :key="period.id"
            v-show="groupedSlots[period.id].length > 0"
          >
            <!-- Period heading -->
            <div class="flex items-center gap-2 mb-2">
              <component :is="period.icon" class="w-3 h-3 text-primary shrink-0" />
              <h4 class="text-[11px] font-semibold text-muted-foreground uppercase tracking-[.08em]">
                {{ period.label }}
              </h4>
              <span class="ml-auto text-[10px] font-medium text-muted-foreground">
                {{ groupedSlots[period.id].filter(s => s.available).length }} slots
              </span>
            </div>

            <!-- 3-column pill grid -->
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="slot in groupedSlots[period.id]"
                :key="slot.time"
                :disabled="!slot.available"
                :class="[
                  'py-2.5 px-2 text-[13px] font-semibold rounded-xl border text-center transition-all duration-100 min-h-[44px]',
                  !slot.available
                    ? 'bg-muted text-muted-foreground opacity-55 line-through cursor-not-allowed border-border'
                    : selectedTime === slot.time
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-border text-foreground',
                ]"
                @click="slot.available && emit('update:selectedTime', slot.time)"
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
        </template>
      </div>

      <!-- Sticky footer: summary + CTA -->
      <div
        class="shrink-0 border-t border-border px-5 pt-3 flex items-center gap-3"
        style="padding-bottom:calc(16px + env(safe-area-inset-bottom,0px));"
      >
        <!-- Summary (shown only after slot is selected) -->
        <Transition name="slide-up">
          <div v-if="selectedTime && service" class="flex flex-col min-w-0 flex-1">
            <span class="text-[14px] font-bold text-foreground leading-tight">
              {{ formatCurrency(service.price) }} · {{ fmtTime(selectedTime) }}
            </span>
            <span class="text-[11px] text-muted-foreground mt-0.5">
              {{ selectedDayLabel }} · Free cancellation
            </span>
          </div>
          <div v-else class="flex-1" />
        </Transition>

        <button
          :disabled="!selectedDate || !selectedTime"
          class="h-12 rounded-xl px-5 text-[15px] font-bold text-white flex items-center gap-2 disabled:opacity-35 shrink-0 ml-auto transition-colors"
          style="background:#1fa8be;"
          @click="emit('proceed')"
        >
          Continue
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active { transition: opacity .15s, transform .15s; }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(6px); }
</style>
