<script setup lang="ts">
import { Loader2, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { AvailabilityRule } from '~/types'

const props = defineProps<{
  serviceId: string
  rule?: AvailabilityRule | null   // null = create mode
  dayOfWeek?: string               // pre-filled when opened from a day column
}>()
const emit = defineEmits<{
  (e: 'saved', rule: AvailabilityRule): void
  (e: 'deleted', ruleId: string): void
  (e: 'cancel'): void
}>()

const { createRule, updateRule, deleteRule } = useBusinessOwner()

const form = reactive({
  startTime: props.rule?.startTime ?? '09:00',
  endTime: props.rule?.endTime ?? '17:00',
  slotDurationMinutes: props.rule?.slotDurationMinutes ?? 60,
  capacity: props.rule?.capacity ?? 1,
})

const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)
const error = ref('')

const slotOptions = [15, 30, 45, 60, 90, 120]

function validate(): string | null {
  const [sh, sm] = form.startTime.split(':').map(Number)
  const [eh, em] = form.endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  if (startMins >= endMins) return 'Start time must be before end time'
  const windowMins = endMins - startMins
  if (windowMins % form.slotDurationMinutes !== 0)
    return `${form.slotDurationMinutes}-min slots don't divide evenly into a ${windowMins}-min window`
  return null
}

async function save() {
  error.value = validate() ?? ''
  if (error.value) return
  saving.value = true
  try {
    let saved: AvailabilityRule
    if (props.rule) {
      saved = await updateRule(props.serviceId, props.rule.id, {
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: form.slotDurationMinutes,
        capacity: form.capacity,
      })
    } else {
      saved = await createRule(props.serviceId, {
        dayOfWeek: props.dayOfWeek!,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: form.slotDurationMinutes,
        capacity: form.capacity,
        isActive: true,
      })
    }
    toast.success('Rule saved')
    emit('saved', saved)
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'Failed to save rule')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!props.rule) return
  deleting.value = true
  try {
    await deleteRule(props.serviceId, props.rule.id)
    toast.success('Rule deleted')
    emit('deleted', props.rule.id)
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'Failed to delete rule')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="bg-card border border-border rounded-xl p-5 space-y-4">
    <h3 class="font-semibold text-sm">{{ rule ? 'Edit rule' : `Add rule — ${dayOfWeek}` }}</h3>

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">Start time</label>
        <Input v-model="form.startTime" type="time" />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">End time</label>
        <Input v-model="form.endTime" type="time" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">Slot size</label>
        <Select v-model="form.slotDurationMinutes">
          <SelectTrigger class="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in slotOptions" :key="m" :value="m">{{ m }} min</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">Capacity</label>
        <Input v-model="form.capacity" type="number" min="1" />
      </div>
    </div>

    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>

    <div class="flex items-center gap-2 pt-1">
      <Button size="sm" @click="save" :disabled="saving" class="flex-1">
        <Loader2 v-if="saving" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
        Save rule
      </Button>
      <Button size="sm" variant="ghost" @click="emit('cancel')">Cancel</Button>
      <template v-if="rule">
        <template v-if="!confirmDelete">
          <Button size="sm" variant="outline" class="text-destructive border-destructive" @click="confirmDelete = true">
            <Trash2 class="w-3.5 h-3.5" />
          </Button>
        </template>
        <template v-else>
          <Button size="sm" variant="destructive" @click="remove" :disabled="deleting">
            <Loader2 v-if="deleting" class="w-3.5 h-3.5 mr-1 animate-spin" />
            Sure?
          </Button>
          <Button size="sm" variant="ghost" @click="confirmDelete = false">No</Button>
        </template>
      </template>
    </div>
  </div>
</template>
