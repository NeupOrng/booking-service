<script setup lang="ts">
import { MapPin, Star, Info, ChevronLeft } from 'lucide-vue-next'
import type { Service } from '~/types'

const route = useRoute()
const serviceId = route.params.id as string
const { fetchService } = useBooking()

const service = ref<Service | null>(null)
const loading = ref(true)

onMounted(async () => {
  service.value = await fetchService(serviceId)
  loading.value = false
})

function getCategoryStyle(slug: string): string {
  const map: Record<string, string> = {
    wellness: 'bg-teal-50 text-teal-700 border-teal-200',
    beauty: 'bg-rose-50 text-rose-700 border-rose-200',
    fitness: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return map[slug] || 'bg-slate-50 text-slate-700 border-slate-200'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="container mx-auto px-4 py-10 max-w-6xl">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <Skeleton class="h-72 w-full rounded-2xl" />
          <Skeleton class="h-8 w-3/4" />
          <Skeleton class="h-5 w-1/2" />
          <Skeleton class="h-40 w-full" />
        </div>
        <div class="lg:col-span-5 xl:col-span-4">
          <Skeleton class="h-[450px] w-full rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!service" class="container mx-auto px-4 py-24 text-center">
      <h2 class="text-2xl font-bold mb-2">Service not found</h2>
      <p class="text-muted-foreground mb-6">The service you're looking for doesn't exist or was removed.</p>
      <Button @click="useRouter().push('/services')">Browse services</Button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Breadcrumb strip -->
      <div class="border-b border-border bg-card">
        <div class="container mx-auto px-4 py-3 max-w-6xl">
          <NuxtLink to="/services" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft class="w-4 h-4" />
            Back to Services
          </NuxtLink>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8 max-w-6xl">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

          <!-- Left Column -->
          <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">

            <!-- Cover Image -->
            <div class="rounded-2xl overflow-hidden bg-muted aspect-video w-full relative">
              <img
                v-if="service.cover_image_url"
                :src="service.cover_image_url"
                :alt="service.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-6xl font-bold text-foreground/10">
                {{ service.name.charAt(0) }}
              </div>
              <!-- Category overlay badge -->
              <span
                :class="['absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full border', getCategoryStyle(service.category.slug)]"
              >
                {{ service.category.name }}
              </span>
            </div>

            <!-- Title block -->
            <div>
              <h1 class="text-3xl font-bold mb-3 text-foreground">{{ service.name }}</h1>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <div class="flex items-center gap-1.5">
                  <Star class="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span class="font-semibold text-foreground">{{ service.avg_rating ?? '5.0' }}</span>
                  <span>({{ service.review_count ?? 0 }} reviews)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <MapPin class="w-4 h-4" />
                  <span>{{ service.business.address || 'Location provided upon booking' }}</span>
                </div>
              </div>
            </div>

            <!-- Business info card -->
            <div class="flex items-center gap-4 p-4 bg-card border border-border rounded-xl listeo-shadow">
              <Avatar class="w-14 h-14 border-2 border-border shrink-0">
                <AvatarImage v-if="service.business.logo_url" :src="service.business.logo_url" />
                <AvatarFallback class="text-lg font-bold">{{ service.business.name.substring(0, 2) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Provided by</p>
                <h3 class="font-semibold text-base text-foreground">{{ service.business.name }}</h3>
                <p v-if="service.business.about" class="text-sm text-muted-foreground mt-0.5 truncate">{{ service.business.about }}</p>
              </div>
            </div>

            <!-- Description -->
            <div>
              <h2 class="text-xl font-bold mb-3">About this service</h2>
              <div
                class="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
                v-html="service.long_description || `<p>${service.description}</p>`"
              />
            </div>

            <!-- Cancellation Policy -->
            <Alert class="border-primary/30 bg-accent">
              <Info class="w-4 h-4 text-primary" />
              <AlertTitle class="text-primary font-semibold">Cancellation Policy</AlertTitle>
              <AlertDescription class="text-foreground/75">
                {{ service.cancellation_policy || 'No specific cancellation policy. Contact the business for details.' }}
              </AlertDescription>
            </Alert>

            <!-- Reviews -->
            <div>
              <h2 class="text-xl font-bold mb-5">Recent Reviews</h2>
              <div class="space-y-5">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="p-4 bg-card rounded-xl border border-border"
                >
                  <div class="flex items-center gap-3 mb-3">
                    <Avatar class="w-9 h-9">
                      <AvatarFallback class="text-xs font-semibold bg-primary/10 text-primary">CX</AvatarFallback>
                    </Avatar>
                    <div>
                      <div class="flex items-center gap-0.5 mb-0.5">
                        <Star v-for="s in 5" :key="s" class="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                      <p class="text-xs text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    "Absolutely amazing experience. The facility was clean and the staff was very professional. Highly recommended!"
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Booking Panel -->
          <div class="lg:col-span-5 xl:col-span-4 relative">
            <BookingPanel :serviceId="service.id" />
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
