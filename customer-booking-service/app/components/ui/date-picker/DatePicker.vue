<script setup lang="ts">
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
} from 'reka-ui'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  isBefore,
  isAfter,
} from 'date-fns'

const props = defineProps<{
  modelValue: string         // YYYY-MM-DD or ''
  placeholder?: string
  minDate?: string           // YYYY-MM-DD inclusive
  maxDate?: string           // YYYY-MM-DD inclusive
  clearable?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

// The month currently shown in the calendar
const viewDate = ref<Date>(
  props.modelValue ? parseISO(props.modelValue) : new Date(),
)

const selectedDate = computed<Date | null>(() =>
  props.modelValue ? parseISO(props.modelValue) : null,
)

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder ?? 'Pick a date'
  return format(parseISO(props.modelValue), 'MMM d, yyyy')
})

// Build calendar grid — null entries are leading-empty cells
const calendarCells = computed<Array<Date | null>>(() => {
  const start = startOfMonth(viewDate.value)
  const end   = endOfMonth(viewDate.value)
  const days  = eachDayOfInterval({ start, end })
  // Monday = 0 offset
  const leadingNulls = (getMonDay(start))
  return [...Array(leadingNulls).fill(null), ...days]
})

// getDay returns 0=Sun; remap to Mon=0
function getMonDay(date: Date): number {
  return (date.getDay() + 6) % 7
}

function isDisabled(date: Date): boolean {
  if (props.minDate && isBefore(date, parseISO(props.minDate))) return true
  if (props.maxDate && isAfter(date, parseISO(props.maxDate)))  return true
  return false
}

function select(date: Date) {
  if (isDisabled(date)) return
  emit('update:modelValue', format(date, 'yyyy-MM-dd'))
  open.value = false
}

function clear(e: MouseEvent) {
  e.stopPropagation()
  emit('update:modelValue', '')
}

// Keep viewDate in sync when prop changes externally
watch(() => props.modelValue, (val) => {
  if (val) viewDate.value = parseISO(val)
})

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        :class="[
          'flex items-center gap-2 h-9 px-3 rounded-xl border text-sm transition-colors bg-background',
          modelValue
            ? 'text-foreground border-border'
            : 'text-muted-foreground border-border',
          'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary',
        ]"
      >
        <CalendarIcon class="w-4 h-4 shrink-0 text-muted-foreground" />
        <span :class="modelValue ? 'text-foreground' : 'text-muted-foreground'">
          {{ displayValue }}
        </span>
        <button
          v-if="clearable && modelValue"
          @click="clear"
          class="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="6"
        class="z-50 w-72 rounded-2xl border border-border bg-card shadow-xl p-4 outline-none"
        style="background-color: white;"
      >
        <!-- Month navigation -->
        <div class="flex items-center justify-between mb-3">
          <button
            @click="viewDate = subMonths(viewDate, 1)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm font-semibold text-foreground">
            {{ format(viewDate, 'MMMM yyyy') }}
          </span>
          <button
            @click="viewDate = addMonths(viewDate, 1)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Day-of-week headers -->
        <div class="grid grid-cols-7 mb-1">
          <div
            v-for="d in DAY_LABELS" :key="d"
            class="text-center text-[11px] font-medium text-muted-foreground py-1"
          >
            {{ d }}
          </div>
        </div>

        <!-- Day cells -->
        <div class="grid grid-cols-7 gap-y-0.5">
          <div v-for="(cell, i) in calendarCells" :key="i">
            <!-- Empty leading cell -->
            <div v-if="!cell" />

            <!-- Day button -->
            <button
              v-else
              @click="select(cell)"
              :disabled="isDisabled(cell)"
              :class="[
                'w-full aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center',
                isDisabled(cell)
                  ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                  : selectedDate && isSameDay(cell, selectedDate)
                    ? 'bg-primary text-white font-semibold'
                    : isToday(cell)
                      ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/20'
                      : 'text-foreground hover:bg-accent',
              ]"
            >
              {{ cell.getDate() }}
            </button>
          </div>
        </div>

        <!-- Today shortcut -->
        <div class="mt-3 pt-3 border-t border-border flex justify-center">
          <button
            @click="select(new Date())"
            class="text-xs text-primary hover:underline font-medium"
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
