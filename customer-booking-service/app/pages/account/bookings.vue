<script setup lang="ts">
import { Wallet, CalendarCheck, CheckSquare } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Booking } from '~/types'

definePageMeta({ middleware: ['auth', 'role'] })

const { fetchMyBookings, fetchBookingStats, cancelMyBooking } = useBooking()
const { formatCurrency } = useFormatters()

const stats = ref<{ upcoming: number; completed: number; totalSpent: number } | null>(null)

const tabs = ['upcoming', 'past', 'cancelled'] as const
type Tab = typeof tabs[number]
const activeTab = ref<Tab>('upcoming')

const tabCache = ref<Map<string, Booking[]>>(new Map())
const loadingTab = ref(false)
const expandedCancelId = ref<string | null>(null)

const STATUS_MAP: Record<Tab, string> = {
  upcoming:  'upcoming',
  past:      'past',
  cancelled: 'cancelled',
}

async function fetchStats() {
  try {
    stats.value = await fetchBookingStats()
  } catch {}
}

async function loadTab(tab: Tab) {
  if (tabCache.value.has(tab)) return
  loadingTab.value = true
  try {
    const { data } = await fetchMyBookings({ status: STATUS_MAP[tab] })
    tabCache.value.set(tab, data)
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to load bookings')
  } finally {
    loadingTab.value = false
  }
}

watch(activeTab, (val) => loadTab(val))

onMounted(async () => {
  await Promise.all([fetchStats(), loadTab('upcoming')])
})

async function handleCancel(payload: { id: string; reason: string }) {
  try {
    await cancelMyBooking(payload.id, payload.reason || undefined)

    // Remove from current tab list
    const current = tabCache.value.get('upcoming') ?? []
    const idx = current.findIndex(b => b.id === payload.id)
    if (idx !== -1) {
      const [removed] = current.splice(idx, 1)
      removed.status = 'cancelled'
      // Push to cancelled cache if already loaded
      if (tabCache.value.has('cancelled')) {
        tabCache.value.get('cancelled')!.unshift(removed)
      }
    }

    expandedCancelId.value = null
    toast.success('Booking cancelled')
    fetchStats()
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to cancel booking')
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-8">My Bookings</h1>

    <!-- Stats -->
    <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <Card class="p-4 flex items-center gap-4 bg-muted/10 border shadow-none">
        <div class="w-11 h-11 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
          <CalendarCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm text-muted-foreground font-medium">Upcoming</p>
          <p class="text-2xl font-bold">{{ stats.upcoming }}</p>
        </div>
      </Card>
      <Card class="p-4 flex items-center gap-4 bg-muted/10 border shadow-none">
        <div class="w-11 h-11 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0">
          <CheckSquare class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm text-muted-foreground font-medium">Completed</p>
          <p class="text-2xl font-bold">{{ stats.completed }}</p>
        </div>
      </Card>
      <Card class="p-4 flex items-center gap-4 bg-muted/10 border shadow-none">
        <div class="w-11 h-11 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
          <Wallet class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm text-muted-foreground font-medium">Total Spent</p>
          <p class="text-2xl font-bold">{{ formatCurrency(stats.totalSpent) }}</p>
        </div>
      </Card>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-6 w-full justify-start h-11 bg-muted/30 p-1">
        <TabsTrigger value="upcoming" class="px-6 data-[state=active]:bg-background">Upcoming</TabsTrigger>
        <TabsTrigger value="past" class="px-6 data-[state=active]:bg-background">Past</TabsTrigger>
        <TabsTrigger value="cancelled" class="px-6 data-[state=active]:bg-background">Cancelled</TabsTrigger>
      </TabsList>

      <TabsContent v-for="tab in tabs" :key="tab" :value="tab" class="m-0">
        <!-- Loading -->
        <div v-if="loadingTab && activeTab === tab" class="flex flex-col gap-4">
          <Skeleton class="h-40 w-full rounded-2xl" />
          <Skeleton class="h-40 w-full rounded-2xl" />
          <Skeleton class="h-40 w-full rounded-2xl" />
        </div>

        <!-- Empty -->
        <div
          v-else-if="!tabCache.has(tab) || (tabCache.get(tab)?.length ?? 0) === 0"
          class="py-16 text-center border rounded-2xl bg-muted/10"
        >
          <h3 class="text-lg font-medium mb-2 capitalize">No {{ tab }} bookings</h3>
          <p class="text-sm text-muted-foreground mb-6">You don't have any {{ tab }} appointments.</p>
          <NuxtLink v-if="tab === 'upcoming'" to="/services">
            <Button>Browse services</Button>
          </NuxtLink>
        </div>

        <!-- Cards -->
        <div v-else class="flex flex-col gap-4">
          <BookingCard
            v-for="booking in tabCache.get(tab)"
            :key="booking.id"
            :booking="booking"
            :expandedCancelId="expandedCancelId"
            @cancel="handleCancel"
            @close-cancel="expandedCancelId = null"
          />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
