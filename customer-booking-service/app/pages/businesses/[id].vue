<script setup lang="ts">
import { MapPin, Phone, Star, ChevronLeft, Search, X } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'
import type { Service, Meta } from '~/types'

const route = useRoute()
const businessId = route.params.id as string

const { fetchServices, fetchCategories } = useBooking()
const { fetchReviewStats } = useReviews()

// ── Business info (derived from first service result) ─────────────────────────
const business = ref<Service['business'] | null>(null)
const businessStats = ref<{ avgRating: number; reviewCount: number } | null>(null)

// ── Services list ─────────────────────────────────────────────────────────────
const services = ref<Service[]>([])
const meta = ref<Meta>({ total: 0, page: 1, perPage: 9, lastPage: 1 })
const loading = ref(true)
const notFound = ref(false)

const q = ref('')
const selectedCategoryId = ref<string | null>(null)
const sortBy = ref('soonest')
const page = ref(1)
const categories = ref<any[]>([])

const hasActiveFilters = computed(() => !!q.value || !!selectedCategoryId.value || sortBy.value !== 'soonest')
const pageNumbers = computed(() => Array.from({ length: meta.value.lastPage }, (_, i) => i + 1))

async function load(pg = 1) {
  loading.value = true
  try {
    const res = await fetchServices({
      businessId,
      q: q.value || undefined,
      categoryId: selectedCategoryId.value || undefined,
      sort: sortBy.value,
      page: pg,
      perPage: 9,
    })
    services.value = res.data
    meta.value = res.meta
    page.value = pg

    // Populate business info from first result on first load
    if (pg === 1 && res.data.length > 0 && !business.value) {
      business.value = res.data[0].business
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  q.value = ''
  selectedCategoryId.value = null
  sortBy.value = 'soonest'
}

watchDebounced(q, () => { page.value = 1; load(1) }, { debounce: 350 })
watch([selectedCategoryId, sortBy], () => { page.value = 1; load(1) })

onMounted(async () => {
  await Promise.all([
    load(1),
    fetchCategories().then((cats) => { categories.value = cats }),
  ])
})
</script>

<template>
  <div>
    <!-- Back link -->
    <div class="border-b border-border bg-card">
      <div class="container mx-auto px-4 py-3 max-w-6xl">
        <NuxtLink to="/services" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft class="w-4 h-4" />
          Back to Services
        </NuxtLink>
      </div>
    </div>

    <!-- Business hero -->
    <div
      class="py-12 px-4"
      style="background: linear-gradient(135deg, hsl(224, 45%, 18%) 0%, hsl(189, 68%, 28%) 100%);"
    >
      <div class="container mx-auto max-w-6xl">
        <!-- Loading skeleton -->
        <div v-if="loading && !business" class="flex items-center gap-5">
          <Skeleton class="w-20 h-20 rounded-2xl shrink-0 bg-white/10" />
          <div class="space-y-2">
            <Skeleton class="h-7 w-48 bg-white/10" />
            <Skeleton class="h-4 w-64 bg-white/10" />
          </div>
        </div>

        <!-- Business info -->
        <div v-else-if="business" class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar class="w-20 h-20 rounded-2xl border-2 border-white/20 shrink-0">
            <AvatarImage v-if="business.logo_url" :src="business.logo_url" />
            <AvatarFallback class="rounded-2xl text-2xl font-bold bg-primary/30 text-white">
              {{ business.name.substring(0, 2) }}
            </AvatarFallback>
          </Avatar>

          <div class="flex-1 min-w-0">
            <h1 class="text-3xl font-bold text-white mb-2">{{ business.name }}</h1>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/70">
              <div v-if="business.address" class="flex items-center gap-1.5">
                <MapPin class="w-4 h-4 shrink-0" />
                <span>{{ business.address }}</span>
              </div>
              <div v-if="business.phone" class="flex items-center gap-1.5">
                <Phone class="w-4 h-4 shrink-0" />
                <span>{{ business.phone }}</span>
              </div>
              <div v-if="business.about" class="w-full text-white/60 text-sm mt-1">
                {{ business.about }}
              </div>
            </div>
          </div>

          <div class="shrink-0 bg-white/10 rounded-xl px-5 py-3 text-center">
            <p class="text-2xl font-bold text-white">{{ meta.total }}</p>
            <p class="text-xs text-white/60 mt-0.5">service{{ meta.total !== 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- No business found fallback -->
        <div v-else-if="!loading" class="text-center py-8">
          <p class="text-white/60">Business information will appear once services are loaded.</p>
        </div>
      </div>
    </div>

    <!-- Services section -->
    <div class="container mx-auto px-4 py-8 max-w-6xl">

      <!-- Filter bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6 bg-card rounded-2xl px-4 py-3 border border-border shadow-sm">
        <!-- Search -->
        <div class="relative flex-1 max-w-xs">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            v-model="q"
            type="text"
            placeholder="Search services…"
            class="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button v-if="q" class="absolute right-2.5 top-1/2 -translate-y-1/2" @click="q = ''">
            <X class="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <!-- Category filter -->
          <Select v-model="selectedCategoryId">
            <SelectTrigger class="w-[160px] h-9 text-sm bg-background rounded-xl">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent class="rounded-xl bg-card border border-border">
              <SelectItem :value="null">All categories</SelectItem>
              <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Sort -->
          <Select v-model="sortBy">
            <SelectTrigger class="w-[160px] h-9 text-sm bg-background rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent class="rounded-xl bg-card border border-border">
              <SelectItem value="soonest">Soonest available</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
              <SelectItem value="duration_asc">Duration</SelectItem>
            </SelectContent>
          </Select>

          <button
            v-if="hasActiveFilters"
            class="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            @click="clearFilters"
          >
            <X class="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      <!-- Loading skeletons -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton v-for="i in 6" :key="i" class="h-72 rounded-2xl" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="services.length === 0"
        class="py-24 text-center"
      >
        <Star class="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <h2 class="text-lg font-semibold mb-2">
          {{ hasActiveFilters ? 'No matching services' : 'No services available' }}
        </h2>
        <p class="text-sm text-muted-foreground mb-5">
          {{ hasActiveFilters
            ? 'Try adjusting your search or filters.'
            : 'This business has no active services right now.' }}
        </p>
        <Button v-if="hasActiveFilters" variant="outline" size="sm" @click="clearFilters">
          Clear filters
        </Button>
      </div>

      <!-- Services grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServiceCard v-for="service in services" :key="service.id" :service="service" />
      </div>

      <!-- Pagination -->
      <div v-if="meta.lastPage > 1 && !loading" class="mt-10 flex justify-center gap-1">
        <button
          :disabled="page === 1"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
          @click="load(1); window.scrollTo({ top: 0, behavior: 'smooth' })"
        >«</button>
        <button
          :disabled="page === 1"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
          @click="load(page - 1)"
        >‹</button>
        <button
          v-for="pg in pageNumbers"
          :key="pg"
          :class="[
            'w-9 h-9 rounded-xl border text-sm font-medium transition-colors',
            pg === page ? 'bg-primary text-white border-primary' : 'border-border hover:bg-accent',
          ]"
          @click="load(pg)"
        >{{ pg }}</button>
        <button
          :disabled="page === meta.lastPage"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
          @click="load(page + 1)"
        >›</button>
        <button
          :disabled="page === meta.lastPage"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
          @click="load(meta.lastPage)"
        >»</button>
      </div>
    </div>
  </div>
</template>
