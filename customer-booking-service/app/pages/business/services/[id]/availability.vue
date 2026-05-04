<script setup lang="ts">
import {
  Plus, Copy, CalendarX, Sparkles, ChevronLeft,
  Sun, Moon, Calendar, Briefcase, Info, Loader2,
} from 'lucide-vue-next'
import { format, addMonths, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { toast } from 'vue-sonner'
import type { AvailabilityRule, AvailabilityBlock, AvailabilitySlot } from '~/types'

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const route = useRoute()
const serviceId = route.params.id as string

const {
  fetchRules, createRule, updateRule, deleteRule,
  fetchBlocks, createBlock, deleteBlock,
} = useBusinessOwner()
const { fetchAvailability, fetchService } = useBooking()

// ─── service ──────────────────────────────────────────────────────────────────
const serviceName = ref('Service')

// ─── week helpers ─────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 || 12
  return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2, '0')}${ap}`
}

function normaliseDay(d: string) {
  return (d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()) as typeof DAYS[number]
}

const monday = computed(() => {
  const d = new Date()
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  d.setHours(0, 0, 0, 0)
  return d
})

const weekDates = computed(() => {
  const out: Record<string, number> = {}
  DAYS.forEach((day, i) => {
    const d = new Date(monday.value)
    d.setDate(monday.value.getDate() + i)
    out[day] = d.getDate()
  })
  return out
})

const weekIso = computed(() => {
  const out: Record<string, string> = {}
  DAYS.forEach((day, i) => {
    const d = new Date(monday.value)
    d.setDate(monday.value.getDate() + i)
    out[day] = format(d, 'yyyy-MM-dd')
  })
  return out
})

const todayDayName = computed<string | null>(() => {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.value)
    d.setDate(monday.value.getDate() + i)
    if (d.getTime() === now.getTime()) return DAYS[i]
  }
  return null
})

// ─── selected day ─────────────────────────────────────────────────────────────
const selectedDay = ref(todayDayName.value ?? 'Monday')
const selectedDayIso = computed(() => weekIso.value[selectedDay.value] ?? '')

// ─── rules ────────────────────────────────────────────────────────────────────
const rules = ref<AvailabilityRule[]>([])
const rulesLoading = ref(true)

const rulesByDay = computed(() => {
  const map: Record<string, AvailabilityRule[]> = {}
  DAYS.forEach(d => { map[d] = [] })
  rules.value.forEach(r => {
    const key = normaliseDay(r.dayOfWeek)
    if (map[key]) map[key].push(r)
  })
  return map
})

function ribbonFor(day: string): { left: string; width: string } | null {
  const rs = rulesByDay.value[day] ?? []
  if (!rs.length) return null
  const start = Math.min(...rs.map(r => toMin(r.startTime)))
  const end = Math.max(...rs.map(r => toMin(r.endTime)))
  return {
    left: `${(start / 1440) * 100}%`,
    width: `${((end - start) / 1440) * 100}%`,
  }
}

function dayBg(day: string): string {
  if (!rulesByDay.value[day]?.length)
    return 'background: repeating-linear-gradient(135deg, white 0 6px, #fafbfc 6px 12px);'
  if (day === 'Saturday' || day === 'Sunday')
    return 'background: linear-gradient(180deg, #fafbfc 0%, white 60%);'
  return ''
}

// ─── preview ──────────────────────────────────────────────────────────────────
const previewSlots = ref<AvailabilitySlot[]>([])
const previewLoading = ref(false)

const selectedRules = computed(() => rulesByDay.value[selectedDay.value] ?? [])

const totalHours = computed(() =>
  selectedRules.value.reduce((s, r) => s + (toMin(r.endTime) - toMin(r.startTime)) / 60, 0),
)
const totalSlots = computed(() =>
  selectedRules.value.reduce(
    (s, r) => s + Math.floor((toMin(r.endTime) - toMin(r.startTime)) / r.slotDurationMinutes),
    0,
  ),
)
const nextAvailable = computed(() => previewSlots.value.find(s => s.available))

async function refreshPreview() {
  if (!selectedDayIso.value) return
  previewLoading.value = true
  try {
    const res = await fetchAvailability(serviceId, selectedDayIso.value)
    previewSlots.value = res.slots
  } catch {
    previewSlots.value = []
  } finally {
    previewLoading.value = false
  }
}

watch(selectedDay, refreshPreview)

// ─── rule dialog ──────────────────────────────────────────────────────────────
const ruleDialogOpen = ref(false)
const editingRule = ref<AvailabilityRule | null>(null)
const editingRuleDay = ref('')

function openNewRule(day: string) {
  editingRule.value = null
  editingRuleDay.value = day
  ruleDialogOpen.value = true
}

function openEditRule(rule: AvailabilityRule) {
  editingRule.value = rule
  editingRuleDay.value = normaliseDay(rule.dayOfWeek)
  ruleDialogOpen.value = true
}

function onRuleSaved(saved: AvailabilityRule) {
  const idx = rules.value.findIndex(r => r.id === saved.id)
  if (idx !== -1) rules.value.splice(idx, 1, saved)
  else rules.value.push(saved)
  ruleDialogOpen.value = false
  refreshPreview()
}

function onRuleDeleted(id: string) {
  rules.value = rules.value.filter(r => r.id !== id)
  ruleDialogOpen.value = false
  refreshPreview()
}

// ─── templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'standard', icon: Sun, label: 'Standard 9–5',
    specs: [{ days: WEEKDAYS, start: '09:00', end: '17:00', slot: 60, cap: 1 }],
  },
  {
    id: 'evenings', icon: Moon, label: 'Evenings only',
    specs: [{ days: WEEKDAYS, start: '18:00', end: '21:00', slot: 60, cap: 1 }],
  },
  {
    id: 'weekdays', icon: Calendar, label: 'Weekdays only',
    specs: [{ days: WEEKDAYS, start: '09:00', end: '17:00', slot: 60, cap: 1 }],
  },
  {
    id: 'split', icon: Briefcase, label: 'Split shift',
    specs: [
      { days: WEEKDAYS, start: '09:00', end: '12:00', slot: 60, cap: 1 },
      { days: WEEKDAYS, start: '14:00', end: '18:00', slot: 60, cap: 1 },
    ],
  },
] as const

const applyingTemplate = ref(false)

async function applyTemplate(t: typeof TEMPLATES[number]) {
  if (applyingTemplate.value) return
  applyingTemplate.value = true
  try {
    for (const spec of t.specs) {
      for (const day of spec.days) {
        const created = await createRule(serviceId, {
          dayOfWeek: day,
          startTime: spec.start,
          endTime: spec.end,
          slotDurationMinutes: spec.slot,
          capacity: spec.cap,
          isActive: true,
        })
        rules.value.push(created)
      }
    }
    toast.success(`${t.label} template applied`)
    refreshPreview()
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to apply template')
  } finally {
    applyingTemplate.value = false
  }
}

// ─── overrides ────────────────────────────────────────────────────────────────
const blocks = ref<AvailabilityBlock[]>([])
const overridesOpen = ref(false)

// when set, show the block editor view inside the overrides dialog
const editingBlockDate = ref('')
const editingBlock = ref<AvailabilityBlock | null>(null)

const calMonths = computed(() => [new Date(), addMonths(new Date(), 1)])

function getDayCells(date: Date): Array<string | null> {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDow = (getDay(startOfMonth(date)) + 6) % 7
  const days = getDaysInMonth(date)
  const cells: Array<string | null> = Array(firstDow).fill(null)
  for (let d = 1; d <= days; d++) {
    cells.push(format(new Date(year, month, d), 'yyyy-MM-dd'))
  }
  return cells
}

function blockForDate(d: string) {
  return blocks.value.find(b => b.blockDate === d) ?? null
}

function openBlockForDate(dateStr: string) {
  editingBlock.value = blockForDate(dateStr)
  editingBlockDate.value = dateStr
}

function onBlockSaved(saved: AvailabilityBlock) {
  const idx = blocks.value.findIndex(b => b.id === saved.id)
  if (idx !== -1) blocks.value.splice(idx, 1, saved)
  else blocks.value.push(saved)
  editingBlockDate.value = ''
  editingBlock.value = null
}

function onBlockDeleted(id: string) {
  blocks.value = blocks.value.filter(b => b.id !== id)
  editingBlockDate.value = ''
  editingBlock.value = null
}

// reset block editor state when dialog closes
watch(overridesOpen, open => {
  if (!open) {
    editingBlockDate.value = ''
    editingBlock.value = null
  }
})

// ─── load ─────────────────────────────────────────────────────────────────────
async function loadAll() {
  rulesLoading.value = true
  try {
    const [svc, r, b] = await Promise.all([
      fetchService(serviceId).catch(() => null),
      fetchRules(serviceId).catch(() => [] as AvailabilityRule[]),
      fetchBlocks(serviceId).catch(() => [] as AvailabilityBlock[]),
    ])
    if (svc) serviceName.value = svc.name
    rules.value = r
    blocks.value = b
  } catch {
    toast.error('Failed to load availability')
  } finally {
    rulesLoading.value = false
    refreshPreview()
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="space-y-5">

    <!-- Service chip -->
    <div class="inline-flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1.5">
      <Sparkles class="w-3 h-3 text-primary" />
      Editing for <strong class="text-foreground font-semibold">{{ serviceName }}</strong>
    </div>

    <!-- Header -->
    <div class="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <NuxtLink :to="`/business/services`"
          class="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary transition-colors">
          <ChevronLeft class="w-3 h-3" /> Back to services
        </NuxtLink>
        <h1 class="text-2xl font-bold tracking-tight mt-1.5 mb-1">Shop hours</h1>
        <p class="text-sm text-muted-foreground max-w-xl">
          When customers can book this service. Set recurring weekly hours; one-off changes happen on individual days.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="toast.info('All rules already recur weekly.')"
          class="text-xs font-medium px-3 py-1.5 rounded-lg bg-card border border-border text-foreground inline-flex items-center gap-1.5 hover:bg-accent hover:border-primary/30 transition-colors"
        >
          <Copy class="w-3 h-3" /> Copy week
        </button>
        <button
          @click="overridesOpen = true"
          class="text-xs font-medium px-3 py-1.5 rounded-lg bg-card border border-border text-foreground inline-flex items-center gap-1.5 hover:bg-accent hover:border-primary/30 transition-colors"
        >
          <CalendarX class="w-3 h-3" /> Date overrides
          <span v-if="blocks.length" class="ml-0.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {{ blocks.length }}
          </span>
        </button>
        <Button size="sm" @click="openNewRule(selectedDay)">
          <Plus class="w-3.5 h-3.5 mr-1" /> Add hours
        </Button>
      </div>
    </div>

    <!-- 2-col grid -->
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">

      <!-- ── Left: week calendar + templates ── -->
      <div>
        <!-- Loading skeleton -->
        <div v-if="rulesLoading" class="grid grid-cols-7 gap-2.5">
          <Skeleton v-for="i in 7" :key="i" class="h-52 rounded-2xl" />
        </div>

        <!-- Week grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div
            v-for="day in DAYS" :key="day"
            @click="selectedDay = day"
            :style="dayBg(day)"
            :class="[
              'group relative flex flex-col min-h-[220px] rounded-2xl overflow-hidden border transition-all cursor-pointer',
              day === todayDayName
                ? 'border-primary shadow-[0_0_0_3px_rgba(31,168,190,0.10)]'
                : day === selectedDay
                  ? 'border-primary/40 shadow-[inset_0_0_0_2px_rgba(31,168,190,0.28)]'
                  : 'border-border hover:border-border/80',
            ]"
          >
            <!-- Copy-day button — visible on hover -->
            <button
              class="absolute top-2 right-2 w-5 h-5 rounded-md text-muted-foreground hidden group-hover:flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors z-10"
              title="Copy day"
              @click.stop="toast.info('Copy day coming soon.')"
            >
              <Copy class="w-3 h-3" />
            </button>

            <!-- Day head -->
            <div class="px-3 pt-3 pb-1 flex items-start justify-between">
              <div>
                <div class="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                  {{ day.slice(0, 3) }}
                </div>
                <div class="text-[22px] font-bold leading-none text-foreground mt-1 tracking-tight">
                  {{ weekDates[day] }}
                </div>
              </div>
              <span v-if="day === todayDayName"
                class="bg-primary text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                Today
              </span>
            </div>

            <!-- Open-hours ribbon (proportional bar across 24 h) -->
            <div class="relative h-1 mx-3 my-2 bg-muted rounded-full overflow-hidden">
              <div
                v-if="ribbonFor(day)"
                class="absolute inset-y-0 rounded-full"
                :style="{ background: 'linear-gradient(90deg, #1fa8be, #56cdde)', ...ribbonFor(day)! }"
              />
            </div>

            <!-- Day body -->
            <div class="px-2.5 pb-2.5 flex flex-col gap-1.5 flex-1">
              <!-- Rule chips -->
              <div
                v-for="rule in rulesByDay[day]" :key="rule.id"
                @click.stop="openEditRule(rule)"
                class="bg-primary/10 border border-primary/20 text-primary rounded-xl px-2.5 py-2 cursor-pointer hover:bg-primary/[0.15] hover:border-primary/30 transition-all flex flex-col gap-0.5"
              >
                <span class="text-[12px] font-semibold">{{ fmtTime(rule.startTime) }} – {{ fmtTime(rule.endTime) }}</span>
                <span class="text-[10px] font-medium text-muted-foreground">
                  {{ rule.slotDurationMinutes }}m · ×{{ rule.capacity }} cap
                </span>
              </div>

              <!-- Empty state -->
              <div v-if="!rulesByDay[day]?.length" class="text-[11px] text-muted-foreground text-center px-2 py-4 italic">
                Closed
              </div>

              <!-- Add hours button -->
              <button
                @click.stop="openNewRule(day)"
                class="w-full border border-dashed border-border rounded-lg py-1.5 text-[11px] text-muted-foreground flex items-center justify-center gap-1 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all mt-auto"
              >
                <Plus class="w-3 h-3" /> Add hours
              </button>
            </div>
          </div>
        </div>

        <!-- Templates -->
        <template v-if="!rulesLoading">
          <div class="flex items-center gap-3 mt-7 mb-3.5 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Templates
            <span class="flex-1 h-px bg-border" />
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in TEMPLATES" :key="t.id"
              @click="applyTemplate(t)"
              :disabled="applyingTemplate"
              class="text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border text-foreground inline-flex items-center gap-1.5 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="applyingTemplate" class="w-3 h-3 animate-spin" />
              <component v-else :is="t.icon" class="w-3 h-3" />
              {{ t.label }}
            </button>
          </div>
        </template>
      </div>

      <!-- ── Right: preview rail ── -->
      <aside class="bg-card border border-border rounded-2xl p-4 lg:sticky lg:top-5">
        <h3 class="text-sm font-semibold mb-1">Preview</h3>
        <p class="text-xs text-muted-foreground mb-3.5">Live slots a customer would see for the selected day.</p>

        <!-- Mini 7-day picker -->
        <div class="flex gap-1 mb-3.5">
          <button
            v-for="d in DAYS" :key="d"
            @click="selectedDay = d"
            :class="[
              'flex-1 px-0.5 py-2 border rounded-lg text-center cursor-pointer transition-all',
              d === selectedDay
                ? 'bg-primary text-white border-primary'
                : 'bg-card border-border hover:border-primary',
            ]"
          >
            <span class="block text-[10px] font-medium uppercase tracking-wide leading-none"
              :class="d === selectedDay ? 'opacity-80' : 'opacity-60'">
              {{ d.slice(0, 2) }}
            </span>
            <strong class="block text-sm font-bold mt-1 leading-none">{{ weekDates[d] }}</strong>
          </button>
        </div>

        <!-- Stats row -->
        <div class="flex justify-between items-baseline text-xs font-medium text-muted-foreground mb-3">
          <span>
            Total hours
            <strong class="text-[16px] font-bold text-foreground ml-1">{{ totalHours.toFixed(1) }}h</strong>
          </span>
          <span>
            Slots
            <strong class="text-[16px] font-bold text-foreground ml-1">{{ totalSlots }}</strong>
          </span>
        </div>

        <!-- Slot grid -->
        <div v-if="previewLoading" class="grid grid-cols-3 gap-1.5">
          <Skeleton v-for="i in 6" :key="i" class="h-8 rounded-md" />
        </div>
        <p v-else-if="previewSlots.length === 0" class="text-xs text-muted-foreground italic">
          No availability on this day.
        </p>
        <div v-else class="grid grid-cols-3 gap-1.5">
          <div
            v-for="slot in previewSlots" :key="slot.time"
            :class="[
              'px-1 py-1.5 border rounded-md text-xs font-medium text-center',
              slot.time === nextAvailable?.time
                ? 'bg-primary text-white border-primary'
                : !slot.available
                  ? 'bg-muted text-muted-foreground line-through opacity-70 border-transparent'
                  : 'bg-card border-border',
            ]"
          >
            {{ fmtTime(slot.time) }}
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-3.5 pt-3 border-t border-border flex gap-1.5 items-center text-[11px] text-muted-foreground">
          <Info class="w-3 h-3 shrink-0" />
          <span>Next bookable:
            <strong class="text-foreground">{{ nextAvailable ? fmtTime(nextAvailable.time) : '—' }}</strong>
          </span>
        </div>
      </aside>
    </div>

    <!-- ── Rule editor dialog ── -->
    <Dialog v-model:open="ruleDialogOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ editingRule ? 'Edit rule' : `Add hours — ${editingRuleDay}` }}</DialogTitle>
        </DialogHeader>
        <BusinessRuleEditorPanel
          :serviceId="serviceId"
          :rule="editingRule"
          :dayOfWeek="editingRuleDay"
          @saved="onRuleSaved"
          @deleted="onRuleDeleted"
          @cancel="ruleDialogOpen = false"
        />
      </DialogContent>
    </Dialog>

    <!-- ── Date overrides dialog ── -->
    <Dialog v-model:open="overridesOpen">
      <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Date overrides</DialogTitle>
          <DialogDescription>Block specific dates or time ranges to prevent bookings.</DialogDescription>
        </DialogHeader>

        <!-- Calendar view -->
        <template v-if="!editingBlockDate">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-1">
            <div v-for="month in calMonths" :key="month.getTime()">
              <p class="text-xs font-semibold text-muted-foreground mb-2">{{ format(month, 'MMMM yyyy') }}</p>
              <div class="grid grid-cols-7 gap-0.5 text-xs">
                <div v-for="d in ['Mo','Tu','We','Th','Fr','Sa','Su']" :key="d"
                  class="text-center text-[10px] font-medium text-muted-foreground py-1">
                  {{ d }}
                </div>
                <template v-for="cell in getDayCells(month)" :key="cell ?? Math.random()">
                  <div v-if="!cell" />
                  <button v-else
                    @click="openBlockForDate(cell)"
                    :class="[
                      'h-8 w-full rounded-lg text-xs font-medium transition-colors',
                      blockForDate(cell)
                        ? blockForDate(cell)!.startTime
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        : 'hover:bg-accent text-foreground',
                    ]"
                  >
                    {{ cell.split('-')[2] }}
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Active blocks list -->
          <div class="mt-5 space-y-2">
            <p class="text-xs font-semibold text-muted-foreground">
              Active blocks ({{ blocks.length }})
            </p>
            <p v-if="blocks.length === 0" class="text-xs text-muted-foreground italic">
              No date overrides set. Click a calendar date to add one.
            </p>
            <div v-else class="space-y-1.5">
              <div v-for="b in blocks" :key="b.id"
                class="flex items-center justify-between px-3 py-2.5 bg-muted/40 border border-border rounded-xl">
                <div class="text-sm">
                  <span class="font-medium">{{ b.blockDate }}</span>
                  <span class="text-muted-foreground ml-2 text-xs">
                    {{ b.startTime ? `${b.startTime}–${b.endTime}` : 'Whole day' }}
                  </span>
                  <span v-if="b.reason" class="text-muted-foreground text-xs ml-2">· {{ b.reason }}</span>
                </div>
                <Button variant="ghost" size="sm" class="h-7 px-2 text-xs text-muted-foreground"
                  @click="openBlockForDate(b.blockDate)">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </template>

        <!-- Block editor view (shown when a date is selected) -->
        <template v-else>
          <button
            @click="editingBlockDate = ''; editingBlock = null"
            class="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary transition-colors mt-1 mb-3"
          >
            <ChevronLeft class="w-3 h-3" /> Back to calendar
          </button>
          <BusinessBlockEditorPanel
            :serviceId="serviceId"
            :block="editingBlock"
            :prefilledDate="editingBlockDate"
            @saved="onBlockSaved"
            @deleted="onBlockDeleted"
            @cancel="editingBlockDate = ''; editingBlock = null"
          />
        </template>
      </DialogContent>
    </Dialog>

  </div>
</template>
