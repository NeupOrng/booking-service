<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { format, addDays } from 'date-fns'
import type { AvailabilityRule, AvailabilityBlock, AvailabilitySlot } from '~/types'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const route = useRoute()
const serviceId = route.params.id as string
const { fetchRules, fetchBlocks, deleteBlock } = useBusinessOwner()
const { fetchAvailability } = useBooking()

const activeTab = ref<'schedule' | 'overrides'>('schedule')

// ── Schedule tab ────────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const rules = ref<AvailabilityRule[]>([])
const rulesLoading = ref(true)
const editorPanel = ref<{ dayOfWeek?: string; rule?: AvailabilityRule } | null>(null)

// preview slots for today
const previewSlots = ref<AvailabilitySlot[]>([])
const todayIso = format(new Date(), 'yyyy-MM-dd')

async function loadRules() {
  rulesLoading.value = true
  rules.value = await fetchRules(serviceId).catch(() => [])
  previewSlots.value = (await fetchAvailability(serviceId, todayIso).catch(() => ({ slots: [] }))).slots
  rulesLoading.value = false
}

function rulesForDay(day: string) {
  return rules.value.filter(r => r.dayOfWeek === day)
}

function onRuleSaved(rule: AvailabilityRule) {
  const idx = rules.value.findIndex(r => r.id === rule.id)
  if (idx !== -1) rules.value[idx] = rule
  else rules.value.push(rule)
  editorPanel.value = null
  loadRules()
}

function onRuleDeleted(id: string) {
  rules.value = rules.value.filter(r => r.id !== id)
  editorPanel.value = null
}

// ── Overrides tab ────────────────────────────────────────────────────────────
const blocks = ref<AvailabilityBlock[]>([])
const blocksLoading = ref(true)
const blockEditor = ref<{ block?: AvailabilityBlock; date?: string } | null>(null)

// 2-month calendar
const today = new Date()
const calendarMonths = computed(() => [today, addDays(today, 32)])

function blockForDate(dateStr: string) {
  return blocks.value.find(b => b.blockDate === dateStr)
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const days: string[] = []
  const d = new Date(first)
  while (d.getMonth() === month) {
    days.push(format(d, 'yyyy-MM-dd'))
    d.setDate(d.getDate() + 1)
  }
  return days
}

async function loadBlocks() {
  blocksLoading.value = true
  blocks.value = await fetchBlocks(serviceId).catch(() => [])
  blocksLoading.value = false
}

async function removeBlock(id: string) {
  await deleteBlock(serviceId, id).catch(() => {})
  blocks.value = blocks.value.filter(b => b.id !== id)
}

function onBlockSaved(block: AvailabilityBlock) {
  const idx = blocks.value.findIndex(b => b.id === block.id)
  if (idx !== -1) blocks.value[idx] = block
  else blocks.value.push(block)
  blockEditor.value = null
}

function onBlockDeleted(id: string) {
  blocks.value = blocks.value.filter(b => b.id !== id)
  blockEditor.value = null
}

onMounted(() => { loadRules(); loadBlocks() })
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div>
      <NuxtLink :to="`/business/services/${serviceId}/edit`" class="text-sm text-muted-foreground hover:text-primary">
        ← Back to service
      </NuxtLink>
      <h1 class="text-2xl font-bold mt-3">Availability</h1>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
      <button v-for="t in [['schedule','Weekly schedule'],['overrides','Date overrides']]" :key="t[0]"
        @click="activeTab = t[0] as any"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === t[0] ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground']">
        {{ t[1] }}
      </button>
    </div>

    <!-- Schedule tab -->
    <div v-if="activeTab === 'schedule'">
      <div v-if="rulesLoading" class="grid grid-cols-7 gap-2">
        <Skeleton v-for="i in 7" :key="i" class="h-40 rounded-xl" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <div v-for="day in DAYS" :key="day" class="bg-card border border-border rounded-xl p-3 space-y-2">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{{ day.slice(0, 3) }}</p>
          <div v-for="rule in rulesForDay(day)" :key="rule.id"
            @click="editorPanel = { dayOfWeek: day, rule }"
            class="cursor-pointer px-2 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
            {{ rule.startTime }}–{{ rule.endTime }}<br/>
            <span class="text-[10px] opacity-70">{{ rule.slotDurationMinutes }}min · ×{{ rule.capacity }}</span>
          </div>
          <button @click="editorPanel = { dayOfWeek: day }"
            class="w-full border border-dashed border-border rounded-lg py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            + Add
          </button>
        </div>
      </div>

      <!-- Rule editor panel -->
      <div v-if="editorPanel" class="mt-4">
        <BusinessRuleEditorPanel
          :serviceId="serviceId"
          :dayOfWeek="editorPanel.dayOfWeek"
          :rule="editorPanel.rule"
          @saved="onRuleSaved"
          @deleted="onRuleDeleted"
          @cancel="editorPanel = null"
        />
      </div>

      <!-- Slot preview -->
      <div class="mt-6">
        <p class="text-sm font-medium mb-3 text-muted-foreground">Today's generated slots (preview)</p>
        <div v-if="previewSlots.length === 0" class="text-sm text-muted-foreground">No slots generated for today.</div>
        <div v-else class="flex flex-wrap gap-2">
          <span v-for="slot in previewSlots" :key="slot.time"
            :class="['px-3 py-1 rounded-full text-xs font-medium', slot.available ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground line-through']">
            {{ slot.time }}
          </span>
        </div>
      </div>
    </div>

    <!-- Overrides tab -->
    <div v-if="activeTab === 'overrides'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="month in calendarMonths" :key="month.getTime()" class="bg-card border border-border rounded-2xl p-4">
          <p class="font-semibold mb-3 text-sm">{{ format(month, 'MMMM yyyy') }}</p>
          <div class="grid grid-cols-7 gap-1 text-xs">
            <div v-for="d in ['Mo','Tu','We','Th','Fr','Sa','Su']" :key="d" class="text-center text-muted-foreground py-1 font-medium">{{ d }}</div>
            <button
              v-for="dateStr in getDaysInMonth(month.getFullYear(), month.getMonth())"
              :key="dateStr"
              @click="blockEditor = { date: dateStr, block: blockForDate(dateStr) }"
              :class="[
                'h-8 w-full rounded-lg text-xs font-medium transition-colors',
                blockForDate(dateStr)
                  ? (blockForDate(dateStr)!.startTime ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800')
                  : 'hover:bg-accent text-foreground',
              ]"
            >
              {{ dateStr.split('-')[2] }}
            </button>
          </div>
        </div>
      </div>

      <!-- Block editor -->
      <div v-if="blockEditor">
        <BusinessBlockEditorPanel
          :serviceId="serviceId"
          :block="blockEditor.block"
          :prefilledDate="blockEditor.date"
          @saved="onBlockSaved"
          @deleted="onBlockDeleted"
          @cancel="blockEditor = null"
        />
      </div>

      <!-- Active blocks list -->
      <div>
        <p class="text-sm font-semibold mb-3">Active blocks ({{ blocks.length }})</p>
        <div v-if="blocksLoading"><Skeleton class="h-32 w-full rounded-xl" /></div>
        <div v-else-if="blocks.length === 0" class="text-sm text-muted-foreground">No date overrides set.</div>
        <div v-else class="space-y-2">
          <div v-for="b in blocks" :key="b.id"
            class="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl text-sm">
            <div>
              <span class="font-medium">{{ b.blockDate }}</span>
              <span class="text-muted-foreground ml-2">{{ b.startTime ? `${b.startTime}–${b.endTime}` : 'Whole day' }}</span>
              <span v-if="b.reason" class="text-muted-foreground ml-2">· {{ b.reason }}</span>
            </div>
            <Button variant="ghost" size="sm" class="text-destructive" @click="removeBlock(b.id)">Remove</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
