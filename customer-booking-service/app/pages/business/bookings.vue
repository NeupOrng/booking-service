<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { Booking } from '~/models'
import type { Meta } from '~/types'

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchBusinessBookings, confirmBooking, completeBooking, cancelBusinessBooking } = useBusinessOwner()

const bookings = ref<Booking[]>([])
const meta = ref<Meta>({ total: 0, page: 1, perPage: 20, lastPage: 1 })
const loading = ref(true)
const loadingRowId = ref<string | null>(null)
const expandedCancelId = ref<string | null>(null)

const filterStatus = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)

const statusCounts = reactive({ pending: 0, confirmed: 0, completed: 0, cancelled: 0 })

const pageNumbers = computed(() => Array.from({ length: meta.value.lastPage }, (_, i) => i + 1))

async function load() {
  loading.value = true
  try {
    let reqStatus = '';
    if(filterStatus.value !== 'all') {
      reqStatus = filterStatus.value;
    }
    const res = await fetchBusinessBookings({
      status: reqStatus || undefined,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      page: page.value,
      perPage: 20,
    })
    bookings.value = res.data
    meta.value = res.meta
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to load bookings')
  } finally {
    loading.value = false
  }
}

async function loadCounts() {
  try {
    const [p, c, co, ca] = await Promise.all([
      fetchBusinessBookings({ status: 'pending', perPage: 1 }),
      fetchBusinessBookings({ status: 'confirmed', perPage: 1 }),
      fetchBusinessBookings({ status: 'completed', perPage: 1 }),
      fetchBusinessBookings({ status: 'cancelled', perPage: 1 }),
    ])
    statusCounts.pending = p.meta.total
    statusCounts.confirmed = c.meta.total
    statusCounts.completed = co.meta.total
    statusCounts.cancelled = ca.meta.total
  } catch {}
}

watch([filterStatus, dateFrom, dateTo], () => { page.value = 1; load() })
watch(page, load)
onMounted(() => { load(); loadCounts() })

function updateRow(updated: Booking) {
  const idx = bookings.value.findIndex(b => b.id === updated.id)
  if (idx !== -1) bookings.value.splice(idx, 1, updated)
}

async function handleConfirm(id: string) {
  loadingRowId.value = id
  try {
    updateRow(await confirmBooking(id))
    statusCounts.pending = Math.max(0, statusCounts.pending - 1)
    statusCounts.confirmed++
    toast.success('Booking confirmed')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to confirm')
  } finally { loadingRowId.value = null }
}

async function handleComplete(id: string) {
  loadingRowId.value = id
  try {
    updateRow(await completeBooking(id))
    statusCounts.confirmed = Math.max(0, statusCounts.confirmed - 1)
    statusCounts.completed++
    toast.success('Booking marked completed')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to update')
  } finally { loadingRowId.value = null }
}

async function handleCancel(id: string, reason: string) {
  loadingRowId.value = id
  try {
    updateRow(await cancelBusinessBooking(id, reason || undefined))
    statusCounts.cancelled++
    expandedCancelId.value = null
    toast.success('Booking cancelled')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to cancel')
  } finally { loadingRowId.value = null }
}

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Booking inbox</h1>
      <p class="text-sm text-muted-foreground mt-1">{{ meta.total }} booking{{ meta.total !== 1 ? 's' : '' }}</p>
    </div>

    <!-- Stats strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="(s, i) in [
        { label: 'Pending', count: statusCounts.pending, cls: 'bg-amber-100 text-amber-800' },
        { label: 'Confirmed', count: statusCounts.confirmed, cls: 'bg-primary/10 text-primary' },
        { label: 'Completed', count: statusCounts.completed, cls: 'bg-green-100 text-green-800' },
        { label: 'Cancelled', count: statusCounts.cancelled, cls: 'bg-muted text-muted-foreground' },
      ]" :key="i" class="bg-card border border-border rounded-2xl p-4 text-center listeo-shadow">
        <p :class="['text-2xl font-bold', s.cls.split(' ')[1]]">{{ s.count }}</p>
        <p class="text-xs text-muted-foreground mt-1">{{ s.label }}</p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap gap-3 items-center bg-card border border-border rounded-2xl px-4 py-3">
      <Select v-model="filterStatus">
        <SelectTrigger class="w-40 h-9 text-sm bg-background rounded-xl">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent class="rounded-xl bg-card border border-border shadow-lg">
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
        </SelectContent>
      </Select>
      <div class="flex items-center gap-2">
        <Input v-model="dateFrom" type="date" class="h-9 text-sm w-36" />
        <span class="text-muted-foreground text-sm">→</span>
        <Input v-model="dateTo" type="date" class="h-9 text-sm w-36" />
      </div>
      <button
        v-if="filterStatus || dateFrom || dateTo"
        @click="filterStatus = ''; dateFrom = ''; dateTo = ''"
        class="text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        Clear
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="bookings.length === 0" class="py-20 text-center text-muted-foreground">
      No bookings match your filters.
    </div>

    <!-- Rows -->
    <div v-else class="space-y-2">
      <BusinessBookingRow
        v-for="b in bookings"
        :key="b.id"
        :booking="b"
        :isLoading="loadingRowId === b.id"
        :expandedCancelId="expandedCancelId"
        @confirm="handleConfirm"
        @complete="handleComplete"
        @cancel="handleCancel"
        @toggleCancel="expandedCancelId = $event === expandedCancelId ? null : $event"
      />
    </div>

    <!-- Pagination -->
    <div v-if="meta.lastPage > 1 && !loading" class="flex justify-center gap-1 pt-2">
      <button :disabled="page === 1" @click="page--" class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent">‹</button>
      <button
        v-for="pg in pageNumbers" :key="pg" @click="page = pg"
        :class="['w-9 h-9 rounded-xl border text-sm transition-colors', pg === page ? 'bg-primary text-white border-primary' : 'border-border hover:bg-accent']"
      >{{ pg }}</button>
      <button :disabled="page === meta.lastPage" @click="page++" class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent">›</button>
    </div>
  </div>
</template>
