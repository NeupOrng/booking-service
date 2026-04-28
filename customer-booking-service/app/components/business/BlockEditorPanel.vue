<script setup lang="ts">
import { Loader2, Trash2 } from 'lucide-vue-next'
import type { AvailabilityBlock } from '~/types'

const props = defineProps<{
  serviceId: string
  block?: AvailabilityBlock | null
  prefilledDate?: string
}>()
const emit = defineEmits<{
  (e: 'saved', block: AvailabilityBlock): void
  (e: 'deleted', blockId: string): void
  (e: 'cancel'): void
}>()

const { createBlock, deleteBlock } = useBusinessOwner()
const { toast } = await import('vue-sonner')

const form = reactive({
  blockDate: props.block?.blockDate ?? props.prefilledDate ?? '',
  blockType: (props.block?.startTime ? 'range' : 'day') as 'day' | 'range',
  startTime: props.block?.startTime ?? '09:00',
  endTime: props.block?.endTime ?? '17:00',
  reason: props.block?.reason ?? '',
})

const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)

async function save() {
  saving.value = true
  try {
    const payload = {
      blockDate: form.blockDate,
      reason: form.reason || undefined,
      ...(form.blockType === 'range' ? { startTime: form.startTime, endTime: form.endTime } : {}),
    }
    const saved = await createBlock(props.serviceId, payload)
    toast.success('Block saved')
    emit('saved', saved)
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'Failed to save block')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!props.block) return
  deleting.value = true
  try {
    await deleteBlock(props.serviceId, props.block.id)
    toast.success('Block removed')
    emit('deleted', props.block.id)
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'Failed to delete block')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="bg-card border border-border rounded-xl p-5 space-y-4">
    <h3 class="font-semibold text-sm">{{ block ? 'Edit block' : 'Add date block' }}</h3>

    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted-foreground">Date</label>
      <Input v-model="form.blockDate" type="date" />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-medium text-muted-foreground">Block type</label>
      <div class="flex gap-3">
        <label class="flex items-center gap-2 cursor-pointer text-sm">
          <input v-model="form.blockType" type="radio" value="day" class="accent-primary" />
          Whole day
        </label>
        <label class="flex items-center gap-2 cursor-pointer text-sm">
          <input v-model="form.blockType" type="radio" value="range" class="accent-primary" />
          Time range
        </label>
      </div>
    </div>

    <div v-if="form.blockType === 'range'" class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">Start time</label>
        <Input v-model="form.startTime" type="time" />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">End time</label>
        <Input v-model="form.endTime" type="time" />
      </div>
    </div>

    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted-foreground">Reason (optional)</label>
      <Input v-model="form.reason" placeholder="e.g. Holiday, maintenance..." />
    </div>

    <div class="flex items-center gap-2 pt-1">
      <Button size="sm" @click="save" :disabled="saving" class="flex-1">
        <Loader2 v-if="saving" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
        Save block
      </Button>
      <Button size="sm" variant="ghost" @click="emit('cancel')">Cancel</Button>
      <template v-if="block">
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
