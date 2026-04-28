<script setup lang="ts">
import type { Booking } from '~/types'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchBusinessBookings } = useBusinessOwner()

const bookings = ref<Booking[]>([])
const loading = ref(true)
const total = ref(0)
const lastPage = ref(1)
const page = ref(1)
const filterStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const expandedCancelId = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await fetchBusinessBookings({
      status: filterStatus.value || undefined,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      page: page.value,
      perPage: 20,
    })
    bookings.value = res.data
    total.value = res.meta.total
    lastPage.value = res.meta.lastPage
  } finally {
    loading.value = false
  }
}

watch([filterStatus, dateFrom, dateTo], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

function onBookingUpdated(updated: Booking) {
  const idx = bookings.value.findIndex(b => b.id === updated.id)
  if (idx !== -1) bookings.value[idx] = updated
  expandedCancelId.value = null
}

const statusOptions = [
  { label: 'All', value: '' },
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
      <p class="text-sm text-muted-foreground mt-0.5">{{ total }} booking{{ total !== 1 ? 's' : '' }}</p>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap gap-3 items-center bg-card border border-border rounded-2xl px-4 py-3">
      <Select v-model="filterStatus">
        <SelectTrigger class="w-40 rounded-xl h-9 text-sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
        </SelectContent>
      </Select>
      <div class="flex items-center gap-2">
        <Input v-model="dateFrom" type="date" class="h-9 text-sm w-36" />
        <span class="text-muted-foreground text-sm">→</span>
        <Input v-model="dateTo" type="date" class="h-9 text-sm w-36" />
      </div>
      <button v-if="filterStatus || dateFrom || dateTo"
        @click="filterStatus = ''; dateFrom = ''; dateTo = ''"
        class="text-xs text-muted-foreground hover:text-destructive transition-colors">
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
        :expandedCancelId="expandedCancelId"
        @updated="onBookingUpdated"
        @expand-cancel="expandedCancelId = $event"
      />
    </div>

    <!-- Pagination -->
    <div v-if="lastPage > 1 && !loading" class="flex justify-center gap-1 pt-2">
      <button :disabled="page === 1" @click="page--"
        class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent">‹</button>
      <button v-for="pg in lastPage" :key="pg" @click="page = pg"
        :class="['w-9 h-9 rounded-xl border text-sm transition-colors', pg === page ? 'bg-primary text-white border-primary' : 'border-border hover:bg-accent']">
        {{ pg }}
      </button>
      <button :disabled="page === lastPage" @click="page++"
        class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent">›</button>
    </div>
  </div>
</template>
