<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { format, addMonths, startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { toast } from 'vue-sonner'
import type { AvailabilityRule, AvailabilityBlock, AvailabilitySlot } from '~/types'

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const route = useRoute()
const serviceId = route.params.id as string

const { fetchRules, createRule, updateRule, deleteRule, fetchBlocks, createBlock, deleteBlock } = useBusinessOwner()
const { fetchAvailability } = useBooking()

const activeTab = ref<'schedule' | 'overrides'>('schedule')

// ── Schedule tab ────────────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const rules = ref<AvailabilityRule[]>([])
const rulesLoading = ref(true)
const previewSlots = ref<AvailabilitySlot[]>([])
const todayIso = format(new Date(), 'yyyy-MM-dd')

interface RuleForm {
  id?: string
  dayOfWeek: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
  capacity: number
}
const editingRule = ref<RuleForm | null>(null)
const ruleError = ref('')
const savingRule = ref(false)
const confirmDeleteRuleId = ref<string | null>(null)

const SLOT_SIZES = [15, 30, 45, 60, 90, 120]

function rulesForDay(day: string) {
  return rules.value.filter(r => r.dayOfWeek === day)
}

function openNewRule(day: string) {
  editingRule.value = { dayOfWeek: day, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 60, capacity: 1 }
  ruleError.value = ''
}

function openEditRule(rule: AvailabilityRule) {
  editingRule.value = { id: rule.id, dayOfWeek: rule.dayOfWeek, startTime: rule.startTime, endTime: rule.endTime, slotDurationMinutes: rule.slotDurationMinutes, capacity: rule.capacity }
  ruleError.value = ''
}

function validateRule(): boolean {
  const [sh, sm] = (editingRule.value!.startTime).split(':').map(Number)
  const [eh, em] = (editingRule.value!.endTime).split(':').map(Number)
  const start = sh * 60 + sm
  const end = eh * 60 + em
  if (start >= end) { ruleError.value = 'Start time must be before end time'; return false }
  const window = end - start
  if (window % editingRule.value!.slotDurationMinutes !== 0) {
    ruleError.value = `${editingRule.value!.slotDurationMinutes}-min slots don't divide evenly into a ${window}-min window`
    return false
  }
  return true
}

async function saveRule() {
  if (!editingRule.value || !validateRule()) return
  savingRule.value = true
  try {
    if (editingRule.value.id) {
      const updated = await updateRule(serviceId, editingRule.value.id, {
        startTime: editingRule.value.startTime,
        endTime: editingRule.value.endTime,
        slotDurationMinutes: editingRule.value.slotDurationMinutes,
        capacity: editingRule.value.capacity,
      })
      const idx = rules.value.findIndex(r => r.id === editingRule.value!.id)
      if (idx !== -1) rules.value.splice(idx, 1, updated)
    } else {
      const created = await createRule(serviceId, {
        dayOfWeek: editingRule.value.dayOfWeek,
        startTime: editingRule.value.startTime,
        endTime: editingRule.value.endTime,
        slotDurationMinutes: editingRule.value.slotDurationMinutes,
        capacity: editingRule.value.capacity,
        isActive: true,
      })
      rules.value.push(created)
    }
    editingRule.value = null
    toast.success('Rule saved')
    refreshPreview()
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to save rule')
  } finally { savingRule.value = false }
}

async function removeRule(ruleId: string) {
  try {
    await deleteRule(serviceId, ruleId)
    rules.value = rules.value.filter(r => r.id !== ruleId)
    confirmDeleteRuleId.value = null
    if (editingRule.value?.id === ruleId) editingRule.value = null
    toast.success('Rule deleted')
    refreshPreview()
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to delete rule')
  }
}

async function refreshPreview() {
  previewSlots.value = (await fetchAvailability(serviceId, todayIso).catch(() => ({ slots: [] }))).slots
}

async function loadSchedule() {
  rulesLoading.value = true
  try {
    const [r] = await Promise.all([fetchRules(serviceId), refreshPreview()])
    rules.value = r
  } catch { toast.error('Failed to load schedule') }
  finally { rulesLoading.value = false }
}

// ── Overrides tab ───────────────────────────────────────────────────────────────
const blocks = ref<AvailabilityBlock[]>([])
const blocksLoading = ref(true)

interface BlockForm {
  id?: string
  blockDate: string
  blockType: 'day' | 'range'
  startTime: string
  endTime: string
  reason: string
}
const editingBlock = ref<BlockForm | null>(null)
const savingBlock = ref(false)

const calMonths = computed(() => [new Date(), addMonths(new Date(), 1)])

function getDayCells(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDow = (getDay(startOfMonth(date)) + 6) % 7 // Monday = 0
  const days = getDaysInMonth(date)
  const cells: Array<string | null> = Array(firstDow).fill(null)
  for (let d = 1; d <= days; d++) {
    cells.push(format(new Date(year, month, d), 'yyyy-MM-dd'))
  }
  return cells
}

function blockForDate(dateStr: string) {
  return blocks.value.find(b => b.blockDate === dateStr)
}

function openBlockEditor(dateStr: string) {
  const existing = blockForDate(dateStr)
  editingBlock.value = existing
    ? { id: existing.id, blockDate: existing.blockDate, blockType: existing.startTime ? 'range' : 'day', startTime: existing.startTime ?? '09:00', endTime: existing.endTime ?? '17:00', reason: existing.reason ?? '' }
    : { blockDate: dateStr, blockType: 'day', startTime: '09:00', endTime: '17:00', reason: '' }
}

async function saveBlock() {
  if (!editingBlock.value) return
  savingBlock.value = true
  try {
    const data = {
      blockDate: editingBlock.value.blockDate,
      startTime: editingBlock.value.blockType === 'range' ? editingBlock.value.startTime : null,
      endTime: editingBlock.value.blockType === 'range' ? editingBlock.value.endTime : null,
      reason: editingBlock.value.reason || null,
    }
    const saved = await createBlock(serviceId, data)
    const idx = blocks.value.findIndex(b => b.id === editingBlock.value?.id)
    if (idx !== -1) blocks.value.splice(idx, 1, saved)
    else blocks.value.push(saved)
    editingBlock.value = null
    toast.success('Block saved')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to save block')
  } finally { savingBlock.value = false }
}

async function removeBlock(blockId: string) {
  try {
    await deleteBlock(serviceId, blockId)
    blocks.value = blocks.value.filter(b => b.id !== blockId)
    toast.success('Block removed')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to remove block')
  }
}

async function loadBlocks() {
  blocksLoading.value = true
  blocks.value = await fetchBlocks(serviceId).catch(() => [])
  blocksLoading.value = false
}

onMounted(() => { loadSchedule(); loadBlocks() })
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div>
      <NuxtLink :to="`/business/services`" class="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to services</NuxtLink>
      <h1 class="text-2xl font-bold mt-3">Availability</h1>
    </div>

    <!-- Tab switcher -->
    <div class="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
      <button v-for="[key, label] in [['schedule','Weekly schedule'],['overrides','Date overrides']]" :key="key"
        @click="activeTab = key as any"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground']">
        {{ label }}
      </button>
    </div>

    <!-- Schedule tab -->
    <div v-if="activeTab === 'schedule'">
      <div v-if="rulesLoading" class="grid grid-cols-7 gap-2">
        <Skeleton v-for="i in 7" :key="i" class="h-40 rounded-xl" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <div v-for="day in DAYS" :key="day" class="bg-card border border-border rounded-xl p-3 space-y-2">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{{ day.slice(0,3) }}</p>
          <div
            v-for="rule in rulesForDay(day)" :key="rule.id"
            @click="openEditRule(rule)"
            class="cursor-pointer px-2 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            {{ rule.startTime }}–{{ rule.endTime }}<br />
            <span class="text-[10px] opacity-70">{{ rule.slotDurationMinutes }}min · ×{{ rule.capacity }}</span>
          </div>
          <button @click="openNewRule(day)"
            class="w-full border border-dashed border-border rounded-lg py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1">
            <Plus class="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      <!-- Rule editor -->
      <div v-if="editingRule" class="mt-4 bg-card border border-border rounded-2xl p-5 space-y-4 max-w-lg">
        <h3 class="font-semibold text-sm">{{ editingRule.id ? 'Edit rule' : `Add rule — ${editingRule.dayOfWeek}` }}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">Start time</label>
            <Input v-model="editingRule.startTime" type="time" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">End time</label>
            <Input v-model="editingRule.endTime" type="time" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">Slot size</label>
            <Select v-model="editingRule.slotDurationMinutes">
              <SelectTrigger class="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in SLOT_SIZES" :key="m" :value="m">{{ m }} min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">Capacity</label>
            <Input v-model="editingRule.capacity" type="number" min="1" />
          </div>
        </div>
        <p v-if="ruleError" class="text-xs text-destructive">{{ ruleError }}</p>
        <div class="flex items-center gap-2">
          <Button size="sm" @click="saveRule" :disabled="savingRule" class="flex-1">Save rule</Button>
          <Button size="sm" variant="ghost" @click="editingRule = null">Cancel</Button>
          <template v-if="editingRule.id">
            <template v-if="confirmDeleteRuleId !== editingRule.id">
              <Button size="sm" variant="outline" class="text-destructive border-destructive" @click="confirmDeleteRuleId = editingRule.id">Delete</Button>
            </template>
            <template v-else>
              <Button size="sm" variant="destructive" @click="removeRule(editingRule.id!)">Sure?</Button>
              <Button size="sm" variant="ghost" @click="confirmDeleteRuleId = null">No</Button>
            </template>
          </template>
        </div>
      </div>

      <!-- Preview -->
      <div class="mt-6">
        <p class="text-sm font-medium text-muted-foreground mb-2">Preview — today's slots</p>
        <p v-if="previewSlots.length === 0" class="text-sm text-muted-foreground">No slots generated for today.</p>
        <div v-else class="flex flex-wrap gap-2">
          <span v-for="slot in previewSlots" :key="slot.time"
            :class="['px-3 py-1 rounded-full text-xs font-medium', slot.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground line-through']">
            {{ slot.time }}
          </span>
        </div>
      </div>
    </div>

    <!-- Overrides tab -->
    <div v-if="activeTab === 'overrides'" class="space-y-6">
      <!-- Calendar -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="month in calMonths" :key="month.getTime()" class="bg-card border border-border rounded-2xl p-4">
          <p class="font-semibold text-sm mb-3">{{ format(month, 'MMMM yyyy') }}</p>
          <div class="grid grid-cols-7 gap-1 text-xs">
            <div v-for="d in ['Mo','Tu','We','Th','Fr','Sa','Su']" :key="d" class="text-center text-muted-foreground py-1 font-medium">{{ d }}</div>
            <template v-for="cell in getDayCells(month)" :key="cell ?? `empty-${Math.random()}`">
              <div v-if="!cell" />
              <button v-else
                @click="openBlockEditor(cell)"
                :class="[
                  'h-8 w-full rounded-lg text-xs font-medium transition-colors',
                  blockForDate(cell)
                    ? (blockForDate(cell)!.startTime ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                    : 'hover:bg-accent text-foreground',
                ]"
              >
                {{ cell.split('-')[2] }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Block editor -->
      <div v-if="editingBlock" class="bg-card border border-border rounded-2xl p-5 space-y-4 max-w-lg">
        <h3 class="font-semibold text-sm">{{ editingBlock.id ? 'Edit block' : 'Add block' }}</h3>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Date</label>
          <Input v-model="editingBlock.blockDate" type="date" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-medium text-muted-foreground">Block type</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="editingBlock.blockType" type="radio" value="day" class="accent-primary" /> Whole day
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="editingBlock.blockType" type="radio" value="range" class="accent-primary" /> Time range
            </label>
          </div>
        </div>
        <div v-if="editingBlock.blockType === 'range'" class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">Start</label>
            <Input v-model="editingBlock.startTime" type="time" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">End</label>
            <Input v-model="editingBlock.endTime" type="time" />
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Reason (optional)</label>
          <Input v-model="editingBlock.reason" placeholder="e.g. Holiday, maintenance…" />
        </div>
        <div class="flex items-center gap-2">
          <Button size="sm" @click="saveBlock" :disabled="savingBlock" class="flex-1">Save block</Button>
          <Button size="sm" variant="ghost" @click="editingBlock = null">Cancel</Button>
          <Button v-if="editingBlock.id" size="sm" variant="outline" class="text-destructive border-destructive" @click="removeBlock(editingBlock.id!); editingBlock = null">Delete</Button>
        </div>
      </div>

      <!-- Active blocks list -->
      <div>
        <p class="text-sm font-semibold mb-3">Active blocks ({{ blocks.length }})</p>
        <div v-if="blocksLoading"><Skeleton class="h-24 w-full rounded-xl" /></div>
        <p v-else-if="blocks.length === 0" class="text-sm text-muted-foreground">No date overrides set.</p>
        <div v-else class="space-y-2">
          <div v-for="b in blocks" :key="b.id" class="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl text-sm">
            <div>
              <span class="font-medium">{{ b.blockDate }}</span>
              <span class="text-muted-foreground ml-2">{{ b.startTime ? `${b.startTime}–${b.endTime}` : 'Whole day' }}</span>
              <span v-if="b.reason" class="text-muted-foreground ml-2">· {{ b.reason }}</span>
            </div>
            <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="removeBlock(b.id)">Remove</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
