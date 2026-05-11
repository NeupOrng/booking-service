<script setup lang="ts">
import { Star, Trash2, Search, MessageSquare, Loader2 } from 'lucide-vue-next'
import type { Review, Meta } from '~/types'

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchMyServices } = useBusinessOwner()
const { fetchReviews, fetchReviewStats, deleteReview } = useReviews()
const { notify } = useNotify()
const { formatRelativeTime } = useFormatters()

// ── Services list ─────────────────────────────────────────────────────────────
const services = ref<any[]>([])
const selectedServiceId = ref<string | null>(null)

// ── Reviews state ─────────────────────────────────────────────────────────────
const reviews = ref<Review[]>([])
const meta = ref<Meta>({ total: 0, page: 1, perPage: 10, lastPage: 1 })
const stats = ref<{ avgRating: number; reviewCount: number } | null>(null)
const loading = ref(false)
const page = ref(1)

const deletingId = ref<string | null>(null)
const confirmDeleteId = ref<string | null>(null)

// ── Derived ───────────────────────────────────────────────────────────────────
const selectedService = computed(() =>
  services.value.find((s) => s.id === selectedServiceId.value),
)

const ratingBars = computed(() => {
  if (!reviews.value.length) return []
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.value.filter((r) => r.rating === star).length
    return { star, count, pct: (count / reviews.value.length) * 100 }
  })
})

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadReviews(pg = 1) {
  if (!selectedServiceId.value) return
  loading.value = true
  try {
    const [reviewsRes, statsRes] = await Promise.all([
      fetchReviews(selectedServiceId.value, { page: pg, perPage: 10 }),
      fetchReviewStats(selectedServiceId.value),
    ])
    reviews.value = reviewsRes.data
    meta.value = reviewsRes.meta
    stats.value = statsRes
    page.value = pg
  } catch (e: any) {
    notify.error('Failed to load reviews', e?.data?.message)
  } finally {
    loading.value = false
  }
}

function selectService(id: string) {
  selectedServiceId.value = id
  page.value = 1
  loadReviews(1)
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function handleDelete(reviewId: string) {
  deletingId.value = reviewId
  try {
    await deleteReview(reviewId)
    reviews.value = reviews.value.filter((r) => r.id !== reviewId)
    meta.value.total = Math.max(0, meta.value.total - 1)
    if (stats.value) stats.value.reviewCount = Math.max(0, stats.value.reviewCount - 1)
    confirmDeleteId.value = null
    notify.success('Review removed')
  } catch (e: any) {
    if (e?.status === 403 || e?.response?.status === 403) {
      notify.error('Permission denied', 'You can only remove reviews on your own services.')
    } else {
      notify.error('Failed to remove review', e?.data?.message)
    }
  } finally {
    deletingId.value = null
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await fetchMyServices({ perPage: 50 })
    services.value = res.data
    if (res.data.length > 0) {
      selectService(res.data[0].id)
    }
  } catch (e: any) {
    notify.error('Failed to load services', e?.data?.message)
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">Customer Feedback</h1>
      <p class="text-sm text-muted-foreground mt-0.5">
        Review ratings and comments left by your customers.
      </p>
    </div>

    <!-- Service selector tabs -->
    <div v-if="services.length > 0" class="flex flex-wrap gap-2">
      <button
        v-for="s in services"
        :key="s.id"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
          selectedServiceId === s.id
            ? 'bg-primary text-white border-primary'
            : 'bg-card border-border text-foreground hover:bg-accent',
        ]"
        @click="selectService(s.id)"
      >
        {{ s.name }}
      </button>
    </div>

    <!-- Empty services state -->
    <div v-else-if="!loading" class="py-20 text-center">
      <MessageSquare class="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p class="text-muted-foreground">You don't have any services yet.</p>
      <NuxtLink to="/business/services/new" class="text-primary text-sm hover:underline mt-1 inline-block">
        Add a service →
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-if="selectedServiceId">
      <!-- Stats strip -->
      <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Avg rating -->
        <div class="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-1 listeo-shadow">
          <p class="text-4xl font-bold text-foreground">
            {{ stats.reviewCount > 0 ? stats.avgRating.toFixed(1) : '—' }}
          </p>
          <StarRating
            :model-value="Math.round(stats.avgRating)"
            readonly
            size="sm"
          />
          <p class="text-xs text-muted-foreground mt-1">
            {{ stats.reviewCount }} review{{ stats.reviewCount !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Rating breakdown -->
        <div class="sm:col-span-2 bg-card border border-border rounded-2xl p-5 listeo-shadow">
          <p class="text-sm font-medium mb-3 text-muted-foreground">Rating breakdown</p>
          <div class="space-y-1.5">
            <div v-for="bar in ratingBars" :key="bar.star" class="flex items-center gap-2 text-xs">
              <span class="w-3 text-right text-muted-foreground shrink-0">{{ bar.star }}</span>
              <Star class="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <div class="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  class="h-full bg-amber-400 rounded-full transition-all duration-500"
                  :style="{ width: `${bar.pct}%` }"
                />
              </div>
              <span class="w-4 text-muted-foreground shrink-0">{{ bar.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <Skeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-xl" />
      </div>

      <!-- Empty reviews -->
      <div
        v-else-if="reviews.length === 0"
        class="py-16 text-center bg-muted/20 rounded-xl border border-border"
      >
        <Star class="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p class="text-sm font-medium text-muted-foreground">No reviews yet for this service</p>
        <p class="text-xs text-muted-foreground mt-1">Reviews will appear here after customers complete a booking.</p>
      </div>

      <!-- Review list -->
      <div v-else class="space-y-3">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="bg-card border border-border rounded-xl p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <Avatar class="w-9 h-9 shrink-0">
                <AvatarFallback class="text-xs font-semibold bg-primary/10 text-primary">
                  {{ review.reviewerInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-foreground truncate">{{ review.reviewerName }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <StarRating :model-value="review.rating" readonly size="sm" />
                  <span class="text-xs text-muted-foreground shrink-0">
                    {{ formatRelativeTime(review.createdAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Delete action -->
            <div class="shrink-0 flex items-center gap-2">
              <template v-if="confirmDeleteId === review.id">
                <span class="text-xs text-muted-foreground hidden sm:inline">Remove this review?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  class="h-7 px-3 text-xs"
                  :disabled="deletingId === review.id"
                  @click="handleDelete(review.id)"
                >
                  <Loader2 v-if="deletingId === review.id" class="w-3.5 h-3.5 animate-spin" />
                  <span v-else>Confirm</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-7 px-3 text-xs"
                  @click="confirmDeleteId = null"
                >
                  Cancel
                </Button>
              </template>
              <Button
                v-else
                variant="ghost"
                size="icon"
                class="text-muted-foreground hover:text-destructive h-8 w-8"
                title="Remove review"
                @click="confirmDeleteId = review.id"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p v-if="review.comment" class="mt-3 text-sm text-muted-foreground leading-relaxed pl-12">
            "{{ review.comment }}"
          </p>
        </div>

        <!-- Pagination -->
        <div v-if="meta.lastPage > 1" class="flex justify-center gap-1 pt-2">
          <button
            :disabled="page === 1"
            class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent"
            @click="loadReviews(page - 1)"
          >
            ‹
          </button>
          <button
            v-for="pg in Array.from({ length: meta.lastPage }, (_, i) => i + 1)"
            :key="pg"
            :class="[
              'w-9 h-9 rounded-xl border text-sm transition-colors',
              pg === page ? 'bg-primary text-white border-primary' : 'border-border hover:bg-accent',
            ]"
            @click="loadReviews(pg)"
          >
            {{ pg }}
          </button>
          <button
            :disabled="page === meta.lastPage"
            class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent"
            @click="loadReviews(page + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
