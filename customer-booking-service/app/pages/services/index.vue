<script setup lang="ts">
import { Search, SearchX, X, Loader2 } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'

const { fetchCategories, fetchServices } = useBooking()

const categories = ref<any[]>([])
const services = ref<any[]>([])
const loading = ref(true)
const total = ref(0)
const lastPage = ref(1)

const query = ref('')
// stores the category UUID (not slug) — backend expects categoryId
const selectedCategoryId = ref<string | null>(null)
const sortBy = ref('soonest')
const page = ref(1)

async function loadCategories() {
  categories.value = await fetchCategories()
}

async function loadServices() {
  loading.value = true
  try {
    const { data, meta } = await fetchServices({
      q: query.value,
      categoryId: selectedCategoryId.value || undefined,
      sort: sortBy.value,
      page: page.value,
      perPage: 6,
    })
    services.value = data
    total.value = meta.total
    lastPage.value = meta.lastPage
  } finally {
    loading.value = false
  }
}

watchDebounced(query, () => {
  page.value = 1
  loadServices()
}, { debounce: 400 })

watch([selectedCategoryId, sortBy], () => {
  page.value = 1
  loadServices()
})

watch(page, () => {
  loadServices()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

function toggleCategory(id: string | null) {
  selectedCategoryId.value = id
}

function clearFilters() {
  query.value = ''
  selectedCategoryId.value = null
  sortBy.value = 'soonest'
}

const hasActiveFilters = computed(() => !!query.value || !!selectedCategoryId.value || sortBy.value !== 'soonest')

// Page numbers to render in pagination
const pageNumbers = computed(() => Array.from({ length: lastPage.value }, (_, i) => i + 1))

onMounted(() => {
  loadCategories()
  loadServices()
})
</script>

<template>
  <div>
    <!-- Hero Banner -->
    <div
      class="relative py-16 px-4 text-white overflow-hidden"
      style="background: linear-gradient(135deg, hsl(224, 45%, 18%) 0%, hsl(189, 68%, 28%) 100%);"
    >
      <!-- background decoration -->
      <div class="absolute inset-0 opacity-10 pointer-events-none"
        style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px); background-size: 60px 60px;">
      </div>
      <div class="container mx-auto max-w-3xl text-center relative z-10">
        <h1 class="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          Find &amp; Book Local Services
        </h1>
        <p class="text-white/75 text-lg mb-8">
          Wellness, beauty, fitness and more — book your next appointment in seconds.
        </p>
        <!-- Hero Search -->
        <div class="relative max-w-xl mx-auto">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            v-model="query"
            type="text"
            placeholder="Search services or businesses..."
            class="w-full h-14 pl-12 pr-12 rounded-2xl text-foreground bg-white/95 shadow-lg text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            v-if="query"
            @click="query = ''"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">

      <!-- Control Bar -->
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8 bg-card rounded-2xl px-4 py-3 shadow-sm border border-border">
        <!-- Category Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-1">
          <button
            :disabled="!selectedCategoryId"
            @click="toggleCategory(null)"
            :class="[
              !selectedCategoryId
                ? 'bg-primary text-white border-primary cursor-default'
                : 'bg-background hover:bg-accent border-border text-foreground',
              'border px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-80'
            ]"
          >
            All
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            :disabled="selectedCategoryId === cat.id"
            @click="toggleCategory(cat.id)"
            :class="[
              selectedCategoryId === cat.id
                ? 'bg-primary text-white border-primary cursor-default'
                : 'bg-background hover:bg-accent border-border text-foreground',
              'border px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-80'
            ]"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Sort + Count -->
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-sm text-muted-foreground hidden sm:block">{{ total }} found</span>
          <Select v-model="sortBy">
            <SelectTrigger class="w-[170px] h-9 text-sm bg-background rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent class="rounded-xl bg-card border border-border shadow-lg">
              <SelectItem value="soonest">Soonest available</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
              <SelectItem value="duration_asc">Duration</SelectItem>
            </SelectContent>
          </Select>
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <X class="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 class="w-10 h-10 animate-spin text-primary" />
        <p class="text-sm text-muted-foreground animate-pulse">Loading services...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="services.length === 0" class="py-24 flex flex-col items-center justify-center text-center">
        <SearchX class="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 class="text-xl font-semibold mb-2">No services found</h2>
        <p class="text-muted-foreground mb-6 max-w-md text-sm">
          We couldn't find any services matching your filters. Try adjusting your search.
        </p>
        <Button variant="outline" @click="clearFilters">Clear all filters</Button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ServiceCard v-for="service in services" :key="service.id" :service="service" />
      </div>

      <!-- Pagination — fixed: iterate page numbers, not total items -->
      <div v-if="lastPage > 1 && !loading" class="mt-12 flex justify-center gap-1">
        <button
          :disabled="page === 1"
          @click="page = 1"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
        >
          «
        </button>
        <button
          :disabled="page === 1"
          @click="page--"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
        >
          ‹
        </button>
        <button
          v-for="pg in pageNumbers"
          :key="pg"
          @click="page = pg"
          :class="[
            'w-9 h-9 rounded-xl border text-sm font-medium transition-colors',
            pg === page
              ? 'bg-primary text-white border-primary'
              : 'border-border hover:bg-accent'
          ]"
        >
          {{ pg }}
        </button>
        <button
          :disabled="page === lastPage"
          @click="page++"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
        >
          ›
        </button>
        <button
          :disabled="page === lastPage"
          @click="page = lastPage"
          class="w-9 h-9 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
        >
          »
        </button>
      </div>

    </div>
  </div>
</template>
