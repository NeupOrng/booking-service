<script setup lang="ts">
import { Plus, Search, Loader2 } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchMyServices, updateService } = useBusinessOwner()
const { formatCurrency } = useFormatters()

const services = ref<any[]>([])
const loading = ref(true)
const total = ref(0)
const lastPage = ref(1)
const page = ref(1)
const q = ref('')
const togglingId = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await fetchMyServices({ q: q.value, page: page.value, perPage: 15 })
    services.value = res.data
    total.value = res.meta.total
    lastPage.value = res.meta.lastPage
  } finally {
    loading.value = false
  }
}

watchDebounced(q, () => { page.value = 1; load() }, { debounce: 400 })
watch(page, load)
onMounted(load)

async function toggleActive(s: any) {
  togglingId.value = s.id
  try {
    const updated = await updateService(s.id, { isActive: !s.is_active })
    const idx = services.value.findIndex(x => x.id === s.id)
    if (idx !== -1) services.value[idx] = updated
  } catch {}
  togglingId.value = null
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">My Services</h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ total }} service{{ total !== 1 ? 's' : '' }}</p>
      </div>
      <NuxtLink to="/business/services/new">
        <Button class="gap-2"><Plus class="w-4 h-4" /> Add service</Button>
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input v-model="q" placeholder="Search services..." class="pl-9" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="services.length === 0" class="py-20 text-center">
      <p class="text-muted-foreground mb-4">No services found.</p>
      <NuxtLink to="/business/services/new">
        <Button variant="outline">Add your first service</Button>
      </NuxtLink>
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <div v-for="s in services" :key="s.id"
        class="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-3 listeo-shadow">
        <div class="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
          <img v-if="s.cover_image_url" :src="s.cover_image_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center font-bold text-muted-foreground/40 text-lg">
            {{ s.service.name.charAt(0) }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium truncate">{{ s.service.name }}</p>
            <span v-if="s.category" class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{{ s.category.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground">{{ formatCurrency(s.service.priceCents) }} · {{ s.service.durationMinutes }} min</p>
        </div>
        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', s.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground']">
          {{ s.service.isActive ? 'Active' : 'Inactive' }}
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink :to="`/business/services/${s.service.id}/availability`">
            <Button variant="outline" size="sm">Availability</Button>
          </NuxtLink>
          <NuxtLink :to="`/business/services/${s.service.id}/edit`">
            <Button variant="outline" size="sm">Edit</Button>
          </NuxtLink>
          <Button variant="ghost" size="sm" @click="toggleActive(s)" :disabled="togglingId === s.id">
            <Loader2 v-if="togglingId === s.id" class="w-3.5 h-3.5 animate-spin" />
            <span v-else>{{ s.service.isActive ? 'Deactivate' : 'Activate' }}</span>
          </Button>
        </div>
      </div>
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
