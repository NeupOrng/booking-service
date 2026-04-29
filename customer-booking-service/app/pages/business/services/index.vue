<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type { Meta } from '~/types'

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchMyServices, updateService } = useBusinessOwner()
const { formatCurrency } = useFormatters()

const services = ref<any[]>([])
const meta = ref<Meta>({ total: 0, page: 1, perPage: 20, lastPage: 1 })
const loading = ref(true)
const page = ref(1)
const q = ref('')
const togglingId = ref<string | null>(null)

const pageNumbers = computed(() => Array.from({ length: meta.value.lastPage }, (_, i) => i + 1))

async function load() {
  loading.value = true
  try {
    const res = await fetchMyServices({ q: q.value || undefined, page: page.value, perPage: 15 })
    services.value = res.data
    meta.value = res.meta
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to load services')
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
    await updateService(s.id, { isActive: !s.is_active })
    s.is_active = !s.is_active
    toast.success(s.is_active ? 'Service activated' : 'Service deactivated')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Failed to update')
  } finally {
    togglingId.value = null
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">My Services</h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ meta.total }} service{{ meta.total !== 1 ? 's' : '' }}</p>
      </div>
      <NuxtLink to="/business/services/new">
        <Button class="gap-2"><Plus class="w-4 h-4" /> Add service</Button>
      </NuxtLink>
    </div>

    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input v-model="q" placeholder="Search services…" class="pl-9" />
    </div>

    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-2xl" />
    </div>

    <div v-else-if="services.length === 0" class="py-20 text-center">
      <p class="text-muted-foreground mb-4">You haven't added any services yet.</p>
      <NuxtLink to="/business/services/new">
        <Button variant="outline">Add your first service</Button>
      </NuxtLink>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="s in services" :key="s.id"
        class="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-3 listeo-shadow"
      >
        <!-- Thumbnail -->
        <div class="w-11 h-11 rounded-xl bg-muted overflow-hidden shrink-0">
          <img v-if="s.cover_image_url" :src="s.cover_image_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center font-bold text-muted-foreground/40">
            {{ s.name?.charAt(0) }}
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium truncate">{{ s.name }}</p>
            <span v-if="s.category" class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{{ s.category.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground">{{ formatCurrency(s.price) }} · {{ s.duration_minutes }} min</p>
        </div>

        <!-- Status badge -->
        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full shrink-0', s.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground']">
          {{ s.is_active ? 'Active' : 'Inactive' }}
        </span>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <NuxtLink :to="`/business/services/${s.id}/availability`">
            <Button variant="outline" size="sm" class="text-xs">Manage availability</Button>
          </NuxtLink>
          <Button
            variant="ghost" size="sm"
            class="text-xs"
            @click="toggleActive(s)"
            :disabled="togglingId === s.id"
          >
            {{ s.is_active ? 'Deactivate' : 'Activate' }}
          </Button>
        </div>
      </div>
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
