<script setup lang="ts">
import { Wallet, CalendarCheck, CheckSquare, Loader2 } from 'lucide-vue-next'
import type { Booking } from '~/types'

definePageMeta({ middleware: 'auth' })

const { fetchMyBookings, fetchBookingStats, cancelMyBooking } = useBooking()
const { formatCurrency } = useFormatters()

const stats = ref<any>(null)
const tabs = ['upcoming', 'past', 'cancelled'] as const
type Tab = typeof tabs[number]
const activeTab = ref<Tab>('upcoming')

const cache = ref<Record<string, Booking[]>>({})
const loadingTab = ref(false)

onMounted(async () => {
  stats.value = await fetchBookingStats()
  await loadTab('upcoming')
})

watch(activeTab, async (newVal) => {
  await loadTab(newVal)
})

async function loadTab(tab: Tab) {
  if (cache.value[tab]) return // Use cache
  
  loadingTab.value = true
  try {
    const { data } = await fetchMyBookings(tab)
    cache.value[tab] = data
  } finally {
    loadingTab.value = false
  }
}

function handleCancelled(bookingId: string) {
  // move from upcoming to cancelled cache
  if (cache.value['upcoming']) {
    const idx = cache.value['upcoming'].findIndex(b => b.id === bookingId)
    if (idx !== -1) {
      const b = cache.value['upcoming'][idx]
      b.status = 'cancelled'
      cache.value['upcoming'].splice(idx, 1)
      if (cache.value['cancelled']) cache.value['cancelled'].unshift(b)
      if (stats.value) stats.value.upcoming--
    }
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-8">My Bookings</h1>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" v-if="stats">
      <Card class="p-4 flex items-center gap-4 bg-muted/10 border shadow-none">
        <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
          <CalendarCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm text-muted-foreground font-medium">Upcoming</p>
          <p class="text-2xl font-bold">{{ stats.upcoming }}</p>
        </div>
      </Card>
      
      <Card class="p-4 flex items-center gap-4 bg-muted/10 border shadow-none">
        <div class="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0">
          <CheckSquare class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm text-muted-foreground font-medium">Completed</p>
          <p class="text-2xl font-bold">{{ stats.completed }}</p>
        </div>
      </Card>

      <Card class="p-4 flex items-center gap-4 bg-muted/10 border shadow-none">
        <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
          <Wallet class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm text-muted-foreground font-medium">Total Spent</p>
          <p class="text-2xl font-bold">{{ formatCurrency(stats.totalSpent) }}</p>
        </div>
      </Card>
    </div>

    <!-- Tabs Container -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-6 w-full justify-start h-12 bg-muted/30 p-1">
        <TabsTrigger value="upcoming" class="px-6 data-[state=active]:bg-background">Upcoming</TabsTrigger>
        <TabsTrigger value="past" class="px-6 data-[state=active]:bg-background">Past</TabsTrigger>
        <TabsTrigger value="cancelled" class="px-6 data-[state=active]:bg-background">Cancelled</TabsTrigger>
      </TabsList>

      <TabsContent v-for="tab in tabs" :key="tab" :value="tab" class="m-0">
        
        <div v-if="loadingTab" class="flex flex-col gap-4">
          <Skeleton class="h-48 w-full rounded-xl" />
          <Skeleton class="h-48 w-full rounded-xl" />
        </div>

        <div v-else-if="!cache[tab] || cache[tab].length === 0" class="py-16 text-center border rounded-xl bg-muted/10">
          <h3 class="text-lg font-medium mb-2 capitalize">No {{ tab }} bookings</h3>
          <p class="text-muted-foreground mb-6 text-sm">You do not have any {{ tab }} appointments at the moment.</p>
          <NuxtLink to="/services" v-if="tab === 'upcoming'">
            <Button>Browse services</Button>
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col gap-6">
          <BookingCard 
            v-for="booking in cache[tab]" 
            :key="booking.id" 
            :booking="booking"
            @cancelled="handleCancelled"
          />
        </div>

      </TabsContent>
    </Tabs>

  </div>
</template>
