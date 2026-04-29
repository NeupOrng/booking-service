<script setup lang="ts">
import { Briefcase, Calendar, CheckCircle2, Clock, ChevronRight, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Booking } from '~/models'


definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchMyBusiness, fetchBusinessBookings, fetchMyServices, confirmBooking, cancelBusinessBooking } = useBusinessOwner()
const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()

const business = ref<any>(null)
const pendingBookings = ref<Booking[]>([])
const recentServices = ref<any[]>([])
const stats = reactive({ pending: 0, confirmed: 0, services: 0 })
const loading = ref(true)
const loadingRowId = ref<string | null>(null)
const expandedDeclineId = ref<string | null>(null)
const declineReason = ref('')

const fetchData = () => {
  loading.value = true
  Promise.all([
    fetchMyBusiness(),
    fetchBusinessBookings({ status: 'pending', perPage: 5 }),
    fetchBusinessBookings({ status: 'confirmed', perPage: 1 }),
    fetchMyServices({ perPage: 5 }),
  ])
    .then(([biz, pendRes, confRes, svcRes]) => {
      business.value = biz
      pendingBookings.value = pendRes.data
      stats.pending = pendRes.meta.total
      stats.confirmed = confRes.meta.total
      stats.services = svcRes.meta.total
      recentServices.value = svcRes.data
    })
    .catch(() => toast.error('Failed to load dashboard'))
    .finally(() => { loading.value = false })
}

onMounted(() => {
  fetchData();
})

async function handleConfirm(id: string) {
  loadingRowId.value = id
  try {
    const updated = await confirmBooking(id)
    const idx = pendingBookings.value.findIndex(b => b.id === id)
    if (idx !== -1) pendingBookings.value.splice(idx, 1, updated)
    stats.pending = Math.max(0, stats.pending - 1)
    stats.confirmed++
    toast.success('Booking confirmed')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to confirm')
  } finally {
    loadingRowId.value = null
    fetchData()
  }
}

async function handleDecline(id: string) {
  loadingRowId.value = id
  try {
    const updated = await cancelBusinessBooking(id, declineReason.value || undefined)
    const idx = pendingBookings.value.findIndex(b => b.id === id)
    if (idx !== -1) pendingBookings.value.splice(idx, 1, updated)
    stats.pending = Math.max(0, stats.pending - 1)
    expandedDeclineId.value = null
    declineReason.value = ''
    toast.success('Booking declined')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to decline')
  } finally {
    loadingRowId.value = null
    fetchData();
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-sm text-muted-foreground mt-1">
        Welcome back{{ business ? `, ${business.name}` : '' }}
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(s, i) in [
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
          { label: 'Confirmed upcoming', value: stats.confirmed, icon: Calendar, color: 'bg-primary/10 text-primary' },
          { label: 'My services', value: stats.services, icon: Briefcase, color: 'bg-muted text-muted-foreground' },
          { label: 'Status', value: business?.status ?? '—', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
        ]"
        :key="i"
        class="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 listeo-shadow"
      >
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', s.color]">
          <component :is="s.icon" class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{{ s.label }}</p>
          <p class="text-xl font-bold capitalize">{{ s.value }}</p>
        </div>
      </div>
    </div>

    <!-- Pending bookings -->
    <div class="bg-card border border-border rounded-2xl p-5 listeo-shadow">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold">Pending bookings</h2>
        <NuxtLink to="/business/bookings" class="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ChevronRight class="w-3 h-3" />
        </NuxtLink>
      </div>

      <div v-if="loading" class="space-y-2">
        <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-xl" />
      </div>
      <p v-else-if="pendingBookings.length === 0" class="text-sm text-muted-foreground py-4 text-center">
        No pending bookings right now.
      </p>
      <div v-else class="space-y-2">
        <div v-for="b in pendingBookings" :key="b.id">
          <div class="flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm">
            <div>
              <p class="font-medium font-mono text-xs">{{ b.reference }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ formatBookingDate(b.date) }} · {{ formatBookingTime(b.time) }} · {{ formatCurrency(b.price) }}
              </p>
            </div>
            <div class="flex items-center gap-1.5">
              <template v-if="loadingRowId === b.id">
                <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
              </template>
              <template v-else>
                <Button size="sm" class="h-7 px-3 text-xs" @click="handleConfirm(b.id)">Confirm</Button>
                <Button size="sm" variant="outline" class="h-7 px-3 text-xs text-destructive border-destructive" @click="expandedDeclineId = expandedDeclineId === b.id ? null : b.id">
                  Decline
                </Button>
              </template>
            </div>
          </div>
          <div v-if="expandedDeclineId === b.id" class="mt-1 border border-destructive/20 bg-destructive/5 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <Input v-model="declineReason" placeholder="Reason (optional)" class="flex-1 h-9 text-sm" />
            <div class="flex gap-2 shrink-0">
              <Button variant="ghost" size="sm" @click="expandedDeclineId = null">Back</Button>
              <Button variant="destructive" size="sm" @click="handleDecline(b.id)">Confirm decline</Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent services -->
    <div class="bg-card border border-border rounded-2xl p-5 listeo-shadow">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold">My services</h2>
        <NuxtLink to="/business/services" class="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ChevronRight class="w-3 h-3" />
        </NuxtLink>
      </div>
      <div v-if="loading" class="space-y-2">
        <Skeleton v-for="i in 3" :key="i" class="h-12 w-full rounded-xl" />
      </div>
      <p v-else-if="recentServices.length === 0" class="text-sm text-muted-foreground py-4 text-center">
        No services yet.
        <NuxtLink to="/business/services/new" class="text-primary hover:underline">Add one →</NuxtLink>
      </p>
      <div v-else class="space-y-2">
        <div v-for="s in recentServices" :key="s.id" class="flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm">
          <div>
            <p class="font-medium">{{ s.name }}</p>
            <p class="text-xs text-muted-foreground">{{ s.durationMinutes }} min · {{ formatCurrency(s.priceCents) }}</p>
          </div>
          <NuxtLink :to="`/business/services/${s.id}/availability`" class="text-xs text-primary hover:underline">
            Manage
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
