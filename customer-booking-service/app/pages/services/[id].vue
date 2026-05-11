<script setup lang="ts">
import { MapPin, Star, Info, ChevronLeft, ChevronDown, Loader2 } from 'lucide-vue-next'
import type { Service, Review, Meta } from '~/types'

const route = useRoute()
const serviceId = route.params.id as string

const { fetchService } = useBooking()
const { fetchReviews, createReview } = useReviews()
const { isAuthenticated } = useAuth()
const { notify } = useNotify()

const service = ref<Service | null>(null)
const loading = ref(true)

// ── Reviews state ─────────────────────────────────────────────────────────────
const reviews = ref<Review[]>([])
const reviewsMeta = ref<Meta>({ total: 0, page: 1, perPage: 6, lastPage: 1 })
const reviewsLoading = ref(false)
const reviewsPage = ref(1)

// ── Review form ───────────────────────────────────────────────────────────────
// ?review=<bookingId> auto-opens the form from BookingCard "Leave a review" link
const reviewFormOpen = ref(false)
const reviewBookingId = ref<string | undefined>(undefined)
const submittingReview = ref(false)

function getCategoryStyle(slug: string): string {
  const map: Record<string, string> = {
    wellness: 'bg-teal-50 text-teal-700 border-teal-200',
    beauty: 'bg-rose-50 text-rose-700 border-rose-200',
    fitness: 'bg-amber-50 text-amber-700 border-amber-200',
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

  // Auto-open review form if navigated from BookingCard "Leave a review"
  const reviewParam = route.query.review as string | undefined
  if (reviewParam && isAuthenticated.value) {
    reviewBookingId.value = reviewParam
    reviewFormOpen.value = true
  }
})
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
                  <span class="font-semibold text-foreground">
                    {{ service.avg_rating != null ? service.avg_rating.toFixed(1) : '—' }}
                  </span>
                  <span>({{ reviewsMeta.total }} review{{ reviewsMeta.total !== 1 ? 's' : '' }})</span>
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

            <!-- Reviews section -->
            <div id="reviews">
              <div class="flex items-center justify-between mb-5">
                <div>
                  <h2 class="text-xl font-bold">Reviews</h2>
                  <p v-if="reviewsMeta.total > 0" class="text-sm text-muted-foreground mt-0.5">
                    {{ reviewsMeta.total }} review{{ reviewsMeta.total !== 1 ? 's' : '' }}
                  </p>
                </div>
                <Button
                  v-if="isAuthenticated"
                  variant="outline"
                  size="sm"
                  @click="reviewFormOpen = true"
                >
                  Write a review
                </Button>
                <NuxtLink v-else to="/auth/login" class="text-sm text-primary hover:underline">
                  Sign in to review
                </NuxtLink>
              </div>

              <!-- Skeleton while loading -->
              <div v-if="reviewsLoading && reviews.length === 0" class="space-y-3">
                <Skeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-xl" />
              </div>

              <!-- Empty state -->
              <div
                v-else-if="reviews.length === 0"
                class="py-12 text-center bg-muted/20 rounded-xl border border-border"
              >
                <Star class="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p class="text-sm font-medium text-muted-foreground">No reviews yet</p>
                <p class="text-xs text-muted-foreground mt-1">Be the first to share your experience.</p>
              </div>

              <!-- Review list -->
              <div v-else class="space-y-3">
                <ReviewCard
                  v-for="review in reviews"
                  :key="review.id"
                  :review="review"
                />

                <!-- Load more -->
                <div v-if="reviewsPage < reviewsMeta.lastPage" class="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    :disabled="reviewsLoading"
                    @click="loadReviews(reviewsPage + 1)"
                  >
                    <Loader2 v-if="reviewsLoading" class="w-4 h-4 mr-2 animate-spin" />
                    <ChevronDown v-else class="w-4 h-4 mr-2" />
                    Load more reviews
                  </Button>
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
