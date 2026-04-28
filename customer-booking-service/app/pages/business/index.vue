<script setup lang="ts">
import { Briefcase, CalendarCheck, Clock, CheckSquare, ChevronRight } from 'lucide-vue-next'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchMyBusiness, fetchMyServices, fetchBusinessBookings } = useBusinessOwner()
const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()

const business = ref<any>(null)
const recentServices = ref<any[]>([])
const pendingBookings = ref<any[]>([])
const stats = reactive({ services: 0, pending: 0, upcoming: 0, completed: 0 })
const loading = ref(true)

onMounted(async () => {
  try {
    const [biz, svcRes, pendRes, upRes] = await Promise.all([
      fetchMyBusiness(),
      fetchMyServices({ perPage: 5 }),
      fetchBusinessBookings({ status: 'pending', perPage: 5 }),
      fetchBusinessBookings({ status: 'confirmed', perPage: 1 }),
    ])
    business.value = biz
    recentServices.value = svcRes.data
    pendingBookings.value = pendRes.data
    stats.services = svcRes.meta.total
    stats.pending = pendRes.meta.total
    stats.upcoming = upRes.meta.total
  } catch {}
  loading.value = false
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground text-sm mt-1">Welcome back{{ business ? `, ${business.name}` : '' }}</p>
    </div>
    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="(s, i) in [
        { label: 'Active services', value: stats.services, icon: Briefcase, color: 'bg-primary/10 text-primary' },
        { label: 'Pending bookings', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
        { label: 'Upcoming', value: stats.upcoming, icon: CalendarCheck, color: 'bg-blue-100 text-blue-700' },
        { label: 'Completed', value: stats.completed, icon: CheckSquare, color: 'bg-green-100 text-green-700' },
      ]" :key="i" class="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 listeo-shadow">
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', s.color]">
          <component :is="s.icon" class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{{ s.label }}</p>
          <p class="text-2xl font-bold">{{ s.value }}</p>
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
        <Skeleton v-for="i in 3" :key="i" class="h-12 w-full rounded-xl" />
      </div>
      <div v-else-if="pendingBookings.length === 0" class="py-6 text-center text-sm text-muted-foreground">
        No pending bookings right now.
      </div>
      <div v-else class="space-y-2">
        <div v-for="b in pendingBookings" :key="b.id"
          class="flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm">
          <div>
            <p class="font-medium">{{ b.service.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatBookingDate(b.date) }} · {{ formatBookingTime(b.time) }}</p>
          </div>
          <span class="text-xs font-mono text-muted-foreground">{{ b.reference }}</span>
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
      <div v-else-if="recentServices.length === 0" class="py-6 text-center text-sm text-muted-foreground">
        No services yet. <NuxtLink to="/business/services/new" class="text-primary hover:underline">Add one</NuxtLink>
      </div>
      <div v-else class="space-y-2">
        <div v-for="s in recentServices" :key="s.id"
          class="flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
              <img v-if="s.cover_image_url" :src="s.cover_image_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground/40">
                {{ s.service.name.charAt(0) }}
              </div>
            </div>
            <div>
              <p class="font-medium">{{ s.service.name }}</p>
              <p class="text-xs text-muted-foreground">{{ s.service.durationMinutes }} min · {{ formatCurrency(s.service.price) }}</p>
            </div>
          </div>
          <NuxtLink :to="`/business/services/${s.service.id}/edit`" class="text-xs text-primary hover:underline">Edit</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
