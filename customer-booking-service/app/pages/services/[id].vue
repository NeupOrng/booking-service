<script setup lang="ts">
import { MapPin, Star, Info, ChevronLeft, ChevronDown, Loader2, Clock } from 'lucide-vue-next'
import type { Service, Review, Meta } from '~/types'

const route = useRoute()
const serviceId = route.params.id as string

const { fetchService } = useBooking()
const { fetchReviews, createReview } = useReviews()
const { isAuthenticated } = useAuth()
const { notify, } = useNotify()
const { formatCurrency, formatNextSlot } = useFormatters()

const service = ref<Service | null>(null)
const loading = ref(true)

// ?v=bold activates the immersive hero variant on desktop
const isBoldVariant = computed(() => route.query.v === 'bold')

// ── Reviews state ─────────────────────────────────────────────────────────────
const reviews = ref<Review[]>([])
const reviewsMeta = ref<Meta>({ total: 0, page: 1, perPage: 6, lastPage: 1 })
const reviewsLoading = ref(false)
const reviewsPage = ref(1)

// ── Review form ───────────────────────────────────────────────────────────────
const reviewFormOpen = ref(false)
const reviewBookingId = ref<string | undefined>(undefined)
const submittingReview = ref(false)

function getCategoryStyle(slug: string): string {
  const map: Record<string, string> = {
    wellness: 'bg-teal-50 text-teal-700 border-teal-200',
    beauty:   'bg-rose-50 text-rose-700 border-rose-200',
    fitness:  'bg-amber-50 text-amber-700 border-amber-200',
  }
  return map[slug] || 'bg-slate-50 text-slate-700 border-slate-200'
}

async function loadReviews(page = 1) {
  reviewsLoading.value = true
  try {
    const res = await fetchReviews(serviceId, { page, perPage: 6 })
    if (page === 1) {
      reviews.value = res.data
    } else {
      reviews.value.push(...res.data)
    }
    reviewsMeta.value = res.meta
    reviewsPage.value = page
  } catch {
    // non-critical — reviews section stays empty
  } finally {
    reviewsLoading.value = false
  }
}

async function handleReviewSubmit(data: { rating: number; comment: string; bookingId?: string }) {
  submittingReview.value = true
  try {
    const newReview = await createReview({
      serviceId,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment || undefined,
    })
    reviewFormOpen.value = false
    reviews.value.unshift(newReview)
    reviewsMeta.value.total++
    if (service.value) {
      service.value.review_count = (service.value.review_count ?? 0) + 1
      const total = reviews.value.reduce((s, r) => s + r.rating, 0)
      service.value.avg_rating = Math.round((total / reviews.value.length) * 10) / 10
    }
    notify.success('Review submitted', 'Thank you for your feedback!')
  } catch (e: any) {
    if (e?.status === 409 || e?.response?.status === 409) {
      notify.error('Already reviewed', 'You have already reviewed this service.')
    } else if (e?.status === 403 || e?.response?.status === 403) {
      notify.error('Not eligible', 'You need a completed booking to review this service.')
    } else {
      notify.error('Failed to submit', e?.data?.message ?? e?.message)
    }
  } finally {
    submittingReview.value = false
  }
}

onMounted(async () => {
  const [svc] = await Promise.all([
    fetchService(serviceId),
    loadReviews(1),
  ])
  service.value = svc
  loading.value = false

  const reviewParam = route.query.review as string | undefined
  if (reviewParam && isAuthenticated.value) {
    reviewBookingId.value = reviewParam
    reviewFormOpen.value = true
  }
})
</script>

<template>
  <div>
    <!-- ── Loading ── -->
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

    <!-- ── Not found ── -->
    <div v-else-if="!service" class="container mx-auto px-4 py-24 text-center">
      <h2 class="text-2xl font-bold mb-2">Service not found</h2>
      <p class="text-muted-foreground mb-6">The service you're looking for doesn't exist or was removed.</p>
      <Button @click="useRouter().push('/services')">Browse services</Button>
    </div>

    <!-- ── Content ── -->
    <div v-else class="pb-24 md:pb-0">

      <!-- ═══════════════════════════════════════════════════════════
           BOLD VARIANT  (?v=bold)
           ═══════════════════════════════════════════════════════════ -->
      <template v-if="isBoldVariant">
        <!-- Immersive hero -->
        <div
          class="relative overflow-hidden"
          style="min-height:240px;background:linear-gradient(135deg,hsl(224,45%,18%) 0%,hsl(189,68%,28%) 100%);"
        >
          <!-- Dotted texture -->
          <div
            class="absolute inset-0 pointer-events-none"
            style="opacity:.12;background-image:radial-gradient(circle at 18% 30%,white 1.5px,transparent 1.5px);background-size:50px 50px;"
          />
          <!-- Back link (top-left inside hero) -->
          <div class="absolute top-4 left-4 z-10">
            <NuxtLink
              to="/services"
              class="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/85 hover:text-white transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
              Back to Services
            </NuxtLink>
          </div>
          <!-- Category pill (top-left, below back link on mobile) -->
          <div class="absolute top-10 left-4 md:top-4 md:left-36 z-10">
            <span
              class="text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style="background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(6px);"
            >
              {{ service.category.name }}
            </span>
          </div>
          <!-- Content anchored to bottom -->
          <div class="relative px-5 md:px-8 pt-20 pb-7 md:pt-16 md:pb-8">
            <h1
              class="text-[28px] md:text-[32px] font-extrabold text-white mb-3 leading-tight"
              style="letter-spacing:-.02em;"
            >
              {{ service.name }}
            </h1>
            <div class="flex flex-wrap items-center gap-2 md:gap-3">
              <span
                class="flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium px-2.5 py-1.5 rounded-full"
                style="background:rgba(255,255,255,.16);color:rgba(255,255,255,.9);backdrop-filter:blur(6px);"
              >
                <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
                {{ service.avg_rating != null ? service.avg_rating.toFixed(1) : '—' }}
                · {{ reviewsMeta.total }} reviews
              </span>
              <span
                class="flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium px-2.5 py-1.5 rounded-full"
                style="background:rgba(255,255,255,.16);color:rgba(255,255,255,.9);backdrop-filter:blur(6px);"
              >
                <MapPin class="w-3 h-3" />
                {{ service.business.name }}
              </span>
              <span
                class="flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium px-2.5 py-1.5 rounded-full"
                style="background:rgba(255,255,255,.16);color:rgba(255,255,255,.9);backdrop-filter:blur(6px);"
              >
                <Clock class="w-3 h-3" />
                {{ service.duration_minutes }} min
              </span>
            </div>
          </div>
        </div>

        <!-- Body grid -->
        <div class="container mx-auto px-4 pt-6 pb-10 max-w-6xl">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

              <!-- 3-up stat strip (below hero on all screen sizes) -->
              <div class="grid grid-cols-3 border border-border rounded-2xl overflow-hidden bg-white" style="box-shadow:0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.06);">
                <div class="p-3 md:p-4 border-r border-border">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-[.08em]">Next available</p>
                  <p class="text-[14px] md:text-[16px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    {{ service.next_available_slot ? formatNextSlot(service.next_available_slot).label : '—' }}
                  </p>
                </div>
                <div class="p-3 md:p-4 border-r border-border">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-[.08em]">Starting at</p>
                  <p class="text-[14px] md:text-[16px] font-bold text-foreground mt-1.5">{{ formatCurrency(service.price) }}</p>
                </div>
                <div class="p-3 md:p-4">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-[.08em]">Rating</p>
                  <p class="text-[14px] md:text-[16px] font-bold text-foreground mt-1.5 flex items-center gap-1">
                    <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {{ service.avg_rating != null ? service.avg_rating.toFixed(1) : '—' }}
                    <span class="text-[11px] font-medium text-muted-foreground ml-0.5">· {{ reviewsMeta.total }}</span>
                  </p>
                </div>
              </div>

              <!-- Shared body sections -->
              <template v-if="true">
                <!-- About -->
                <div>
                  <h2 class="text-[16px] font-bold mb-2.5">About this service</h2>
                  <div
                    class="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-[13px]"
                    v-html="service.long_description || `<p>${service.description}</p>`"
                  />
                </div>

                <!-- Business card -->
                <NuxtLink
                  :to="`/businesses/${service.business.id}`"
                  class="flex items-center gap-3.5 p-4 bg-white border border-border rounded-[14px] hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
                  style="box-shadow:0 1px 2px rgba(0,0,0,0.04);"
                >
                  <Avatar class="w-12 h-12 shrink-0">
                    <AvatarImage v-if="service.business.logo_url" :src="service.business.logo_url" />
                    <AvatarFallback class="text-base font-bold">{{ service.business.name.substring(0, 2) }}</AvatarFallback>
                  </Avatar>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-[.08em] mb-0.5">Provided by</p>
                    <p class="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{{ service.business.name }}</p>
                    <p v-if="service.business.about" class="text-[12px] text-muted-foreground mt-0.5 truncate">{{ service.business.about }}</p>
                  </div>
                  <span class="text-[12px] font-medium text-primary/70 group-hover:text-primary shrink-0 transition-colors">View all →</span>
                </NuxtLink>

                <!-- Cancellation policy -->
                <div
                  class="flex gap-2.5 p-3.5 rounded-xl"
                  style="border:1px solid rgba(31,168,190,.3);background:rgba(31,168,190,.04);"
                >
                  <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p class="text-[12px] font-semibold text-primary mb-1">Cancellation Policy</p>
                    <p class="text-[12px] text-foreground/75 leading-relaxed">
                      {{ service.cancellation_policy || 'No specific cancellation policy. Contact the business for details.' }}
                    </p>
                  </div>
                </div>

                <!-- Reviews -->
                <div id="reviews">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h2 class="text-[16px] font-bold">Reviews</h2>
                      <p v-if="reviewsMeta.total > 0" class="text-[12px] text-muted-foreground mt-0.5">
                        {{ reviewsMeta.total }} review{{ reviewsMeta.total !== 1 ? 's' : '' }}
                      </p>
                    </div>
                    <Button v-if="isAuthenticated" variant="outline" size="sm" @click="reviewFormOpen = true">
                      Write a review
                    </Button>
                    <NuxtLink v-else to="/auth/login" class="text-sm text-primary hover:underline">
                      Sign in to review
                    </NuxtLink>
                  </div>
                  <div v-if="reviewsLoading && reviews.length === 0" class="space-y-3">
                    <Skeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-xl" />
                  </div>
                  <div
                    v-else-if="reviews.length === 0"
                    class="py-10 text-center bg-muted/20 rounded-xl border border-border"
                  >
                    <Star class="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p class="text-sm font-medium text-muted-foreground">No reviews yet</p>
                    <p class="text-xs text-muted-foreground mt-1">Be the first to share your experience.</p>
                  </div>
                  <div v-else class="space-y-3">
                    <ReviewCard v-for="review in reviews" :key="review.id" :review="review" />
                    <div v-if="reviewsPage < reviewsMeta.lastPage" class="pt-2 text-center">
                      <Button variant="ghost" size="sm" :disabled="reviewsLoading" @click="loadReviews(reviewsPage + 1)">
                        <Loader2 v-if="reviewsLoading" class="w-4 h-4 mr-2 animate-spin" />
                        <ChevronDown v-else class="w-4 h-4 mr-2" />
                        Load more reviews
                      </Button>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Right col: BookingPanel -->
            <div class="lg:col-span-5 xl:col-span-4 relative">
              <BookingPanel :service-id="service.id" :service="service" />
            </div>
          </div>
        </div>
      </template>

      <!-- ═══════════════════════════════════════════════════════════
           CONSERVATIVE VARIANT  (default)
           ═══════════════════════════════════════════════════════════ -->
      <template v-else>
        <!-- Breadcrumb strip -->
        <div class="border-b border-border bg-card">
          <div class="container mx-auto px-4 py-3 max-w-6xl">
            <NuxtLink
              to="/services"
              class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
              Back to Services
            </NuxtLink>
          </div>
        </div>

        <div class="container mx-auto px-4 pt-8 pb-28 md:pb-8 max-w-6xl">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

            <!-- Left column -->
            <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-7">

              <!-- Cover image with category pill + glassy price pill -->
              <div class="rounded-2xl overflow-hidden bg-muted aspect-video w-full relative">
                <img
                  v-if="service.cover_image_url"
                  :src="service.cover_image_url"
                  :alt="service.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-6xl font-bold text-foreground/10"
                  :style="`background:linear-gradient(135deg,hsl(189,68%,68%),hsl(224,45%,58%))`"
                >
                  {{ service.name.charAt(0) }}
                </div>
                <!-- Category pill (top-left) -->
                <span
                  :class="['absolute top-4 left-4 text-[11px] font-semibold px-3 py-1.5 rounded-full border', getCategoryStyle(service.category.slug)]"
                >
                  {{ service.category.name }}
                </span>
                <!-- Price pill (bottom-right, glassy) -->
                <div
                  class="absolute bottom-4 right-4 flex items-center gap-2 px-3.5 py-2 rounded-xl text-white"
                  style="background:rgba(0,0,0,.55);backdrop-filter:blur(8px);"
                >
                  <span class="text-[14px] font-bold">{{ formatCurrency(service.price) }}</span>
                  <span class="text-[11px] font-medium opacity-70">/ session</span>
                </div>
              </div>

              <!-- Title block -->
              <div>
                <h1
                  class="text-[24px] font-bold mb-2 text-foreground leading-tight"
                  style="letter-spacing:-.02em;"
                >
                  {{ service.name }}
                </h1>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-muted-foreground">
                  <span class="flex items-center gap-1.5">
                    <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span class="font-semibold text-foreground">
                      {{ service.avg_rating != null ? service.avg_rating.toFixed(1) : '—' }}
                    </span>
                    ({{ reviewsMeta.total }} review{{ reviewsMeta.total !== 1 ? 's' : '' }})
                  </span>
                  <span class="flex items-center gap-1.5">
                    <MapPin class="w-3.5 h-3.5 shrink-0" />
                    {{ service.business.address || 'Location provided upon booking' }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5 shrink-0" />
                    {{ service.duration_minutes }} min
                  </span>
                </div>
              </div>

              <!-- Business info card — links to business profile page -->
              <NuxtLink
                :to="`/businesses/${service.business.id}`"
                class="flex items-center gap-3.5 p-[14px] bg-white border border-border rounded-[14px] hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
                style="box-shadow:0 1px 2px rgba(0,0,0,0.04);"
              >
                <Avatar class="w-12 h-12 border-2 border-border shrink-0">
                  <AvatarImage v-if="service.business.logo_url" :src="service.business.logo_url" />
                  <AvatarFallback class="text-base font-bold">{{ service.business.name.substring(0, 2) }}</AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-[.08em] mb-0.5">Provided by</p>
                  <p class="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">{{ service.business.name }}</p>
                  <p v-if="service.business.about" class="text-[12px] text-muted-foreground mt-0.5 truncate">{{ service.business.about }}</p>
                </div>
                <span class="text-[12px] font-medium text-primary/70 group-hover:text-primary shrink-0 transition-colors">View all →</span>
              </NuxtLink>

              <!-- About -->
              <div>
                <h2 class="text-[16px] font-bold mb-2.5">About this service</h2>
                <div
                  class="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-[13px]"
                  v-html="service.long_description || `<p>${service.description}</p>`"
                />
              </div>

              <!-- Cancellation Policy -->
              <div
                class="flex gap-2.5 p-3.5 rounded-xl"
                style="border:1px solid rgba(31,168,190,.3);background:rgba(31,168,190,.04);"
              >
                <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p class="text-[12px] font-semibold text-primary mb-1">Cancellation Policy</p>
                  <p class="text-[12px] text-foreground/75 leading-relaxed">
                    {{ service.cancellation_policy || 'No specific cancellation policy. Contact the business for details.' }}
                  </p>
                </div>
              </div>

              <!-- Reviews section -->
              <div id="reviews">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="text-[16px] font-bold">Reviews</h2>
                    <p v-if="reviewsMeta.total > 0" class="text-[12px] text-muted-foreground mt-0.5">
                      {{ reviewsMeta.total }} review{{ reviewsMeta.total !== 1 ? 's' : '' }}
                    </p>
                  </div>
                  <Button v-if="isAuthenticated" variant="outline" size="sm" @click="reviewFormOpen = true">
                    Write a review
                  </Button>
                  <NuxtLink v-else to="/auth/login" class="text-sm text-primary hover:underline">
                    Sign in to review
                  </NuxtLink>
                </div>

                <div v-if="reviewsLoading && reviews.length === 0" class="space-y-3">
                  <Skeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-xl" />
                </div>
                <div
                  v-else-if="reviews.length === 0"
                  class="py-10 text-center bg-muted/20 rounded-xl border border-border"
                >
                  <Star class="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                  <p class="text-sm font-medium text-muted-foreground">No reviews yet</p>
                  <p class="text-xs text-muted-foreground mt-1">Be the first to share your experience.</p>
                </div>
                <div v-else class="space-y-3">
                  <ReviewCard v-for="review in reviews" :key="review.id" :review="review" />
                  <div v-if="reviewsPage < reviewsMeta.lastPage" class="pt-2 text-center">
                    <Button variant="ghost" size="sm" :disabled="reviewsLoading" @click="loadReviews(reviewsPage + 1)">
                      <Loader2 v-if="reviewsLoading" class="w-4 h-4 mr-2 animate-spin" />
                      <ChevronDown v-else class="w-4 h-4 mr-2" />
                      Load more reviews
                    </Button>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right column: BookingPanel (desktop sticky) -->
            <div class="lg:col-span-5 xl:col-span-4 relative">
              <BookingPanel :service-id="service.id" :service="service" />
            </div>

          </div>
        </div>
      </template>
    </div>

    <!-- Review form modal -->
    <ReviewFormModal
      v-model:open="reviewFormOpen"
      :service-id="serviceId"
      :booking-id="reviewBookingId"
      :submitting="submittingReview"
      @submit="handleReviewSubmit"
    />
  </div>
</template>
