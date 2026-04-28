import type { Service, ServiceCategory, AvailabilitySlot, Booking, Meta } from '~/types'
import { addDays } from 'date-fns'

// ─── Backend shapes ────────────────────────────────────────────────────────────

interface CategoryResponseDto {
  id: string
  name: string
  slug: string
  colorHex: string | null
  sortOrder: number
}

interface BackendBusiness {
  id: string
  name: string
  logoUrl: string | null
  address?: string | null
  phone?: string | null
}

interface BackendServiceSummary {
  id: string
  name: string
  description?: string | null
  priceCents: number
  durationMinutes: number
  coverImageUrl: string | null
  cancellationPolicy: string | null
  nextAvailableSlot: string | null
  business: BackendBusiness
  category: { id: string; name: string; slug: string; colorHex: string | null } | null
  // detail-only
  longDescription?: string | null
  avgRating?: number | null
  reviewCount?: number
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

function mapService(raw: BackendServiceSummary): Service {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    price: raw.priceCents,
    duration_minutes: raw.durationMinutes,
    category: {
      id: raw.category?.id ?? '',
      name: raw.category?.name ?? '',
      slug: raw.category?.slug ?? '',
    },
    business: {
      id: raw.business.id,
      name: raw.business.name,
      logo_url: raw.business.logoUrl ?? null,
      address: raw.business.address ?? undefined,
    },
    cover_image_url: raw.coverImageUrl ?? null,
    next_available_slot: raw.nextAvailableSlot ?? null,
    cancellation_policy: raw.cancellationPolicy ?? undefined,
    long_description: raw.longDescription ?? undefined,
    avg_rating: raw.avgRating ?? null,
    review_count: raw.reviewCount ?? 0,
  }
}

// ─── Mock booking data (bookings module not yet implemented in backend) ─────────

const MOCK_SERVICES_FOR_BOOKING: Service[] = [
  {
    id: 'srv_1',
    name: 'Deep Tissue Massage',
    description: 'A therapeutic massage focused on realigning deeper layers of muscles.',
    price: 8500,
    duration_minutes: 60,
    category: { id: 'cat_1', name: 'Wellness', slug: 'wellness' },
    business: { id: 'biz_1', name: 'Zen Spa', logo_url: null, address: '123 Calm St.' },
    cover_image_url: null,
    next_available_slot: new Date().toISOString(),
    cancellation_policy: 'Free cancellation up to 24 hours before the appointment.',
    long_description: '<p>Experience true relaxation with our deep tissue massage.</p>',
    avg_rating: 4.8,
    review_count: 124,
  },
]

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk_upcoming_1',
    reference: '#BK-99120',
    status: 'confirmed',
    service: { id: 'srv_1', name: 'Deep Tissue Massage', cover_image_url: null, duration_minutes: 60, category: { slug: 'wellness' } },
    business: { id: 'biz_1', name: 'Zen Spa' },
    date: addDays(new Date(), 3).toISOString().split('T')[0]!,
    time: '14:00',
    price: 8500,
    cancelled_by: null, cancelled_at: null, refund_status: null, refund_amount: null,
    can_cancel: true, can_reschedule: true,
  },
  {
    id: 'bk_past_1',
    reference: '#BK-88219',
    status: 'completed',
    service: { id: 'srv_2', name: 'Luxury Facial', cover_image_url: null, duration_minutes: 90, category: { slug: 'beauty' } },
    business: { id: 'biz_2', name: 'Glow Beauty' },
    date: addDays(new Date(), -10).toISOString().split('T')[0]!,
    time: '10:00',
    price: 12000,
    cancelled_by: null, cancelled_at: null, refund_status: null, refund_amount: null,
    can_cancel: false, can_reschedule: false,
  },
  {
    id: 'bk_cancelled_1',
    reference: '#BK-77318',
    status: 'cancelled',
    service: { id: 'srv_1', name: 'Deep Tissue Massage', cover_image_url: null, duration_minutes: 60, category: { slug: 'wellness' } },
    business: { id: 'biz_1', name: 'Zen Spa' },
    date: addDays(new Date(), -2).toISOString().split('T')[0]!,
    time: '16:00',
    price: 8500,
    cancelled_by: 'customer', cancelled_at: addDays(new Date(), -5).toISOString(),
    refund_status: 'refunded', refund_amount: 8500,
    can_cancel: false, can_reschedule: false,
  },
]

// ─── Composable ────────────────────────────────────────────────────────────────

export function useBooking() {
  // ── Categories ──────────────────────────────────────────────────────────────

  type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>

  function getApi(): Api {
    const { $api } = useNuxtApp()
    return $api as unknown as Api
  }

  // ── Booking mapper ───────────────────────────────────────────────────────────

  function mapBooking(raw: any): Booking {
    return {
      id: raw.id,
      reference: raw.reference,
      status: raw.status,
      service: {
        id: raw.serviceId ?? raw.service?.id ?? '',
        name: raw.serviceName ?? raw.service?.name ?? '',
        cover_image_url: raw.service?.coverImageUrl ?? raw.service?.cover_image_url ?? null,
        duration_minutes: raw.service?.durationMinutes ?? raw.service?.duration_minutes ?? 0,
        category: { slug: raw.service?.category?.slug ?? '' },
      },
      business: {
        id: raw.businessId ?? raw.business?.id ?? '',
        name: raw.businessName ?? raw.business?.name ?? '',
      },
      date: raw.bookingDate ?? raw.date,
      time: raw.bookingTime ?? raw.time,
      price: raw.priceCents ?? raw.price,
      cancelled_by: raw.cancelledBy ?? null,
      cancelled_at: raw.cancelledAt ?? null,
      refund_status: raw.refundStatus ?? null,
      refund_amount: raw.refundAmount ?? null,
      can_cancel: raw.canCancel ?? false,
      can_reschedule: raw.canReschedule ?? false,
      notes_from_customer: raw.notesFromCustomer ?? null,
    }
  }

  async function fetchCategories(): Promise<ServiceCategory[]> {
    const api = getApi()
    const data = await api<CategoryResponseDto[]>('/categories')
    return data.map(c => ({ id: c.id, name: c.name, slug: c.slug, colorHex: c.colorHex ?? null }))
  }

  // ── Services list ────────────────────────────────────────────────────────────

  async function fetchServices(params: {
    q?: string
    categoryId?: string   // UUID from /categories
    sort?: string
    page?: number
    perPage?: number
  }): Promise<{ data: Service[]; meta: { total: number; page: number; perPage: number; lastPage: number } }> {
    const api = getApi()
    const raw = await api<{ data: BackendServiceSummary[]; meta: any }>('/services', {
      query: {
        ...(params.q ? { q: params.q } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        page: params.page ?? 1,
        perPage: params.perPage ?? 12,
      },
    })
    return {
      data: raw.data.map(mapService),
      meta: {
        total: raw.meta.total,
        page: raw.meta.page,
        perPage: raw.meta.perPage,
        lastPage: raw.meta.lastPage,
      },
    }
  }

  // ── Service detail ───────────────────────────────────────────────────────────

  async function fetchService(id: string): Promise<Service | null> {
    const api = getApi()
    try {
      const raw = await api<BackendServiceSummary>(`/services/${id}`)
      return mapService(raw)
    } catch (e: any) {
      if (e?.response?.status === 404) return null
      throw e
    }
  }

  // ── Availability ─────────────────────────────────────────────────────────────

  async function fetchAvailability(
    serviceId: string,
    date: string,
  ): Promise<{ date: string; slots: AvailabilitySlot[] }> {
    const api = getApi()
    return api<{ date: string; slots: AvailabilitySlot[] }>(`/services/${serviceId}/availability`, { query: { date } })
  }

  // ── Bookings (mocked — BookingsModule not yet on backend) ───────────────────

  async function createBooking(params: {
    serviceId: string
    bookingDate: string
    bookingTime: string
    notesFromCustomer?: string
  }): Promise<Booking> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const service = MOCK_SERVICES_FOR_BOOKING.find(s => s.id === params.serviceId)
      ?? MOCK_SERVICES_FOR_BOOKING[0]!
    return mapBooking({
      id: `bk_${Math.random().toString(36).substring(7)}`,
      reference: `#BK-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'confirmed',
      serviceId: service.id,
      serviceName: service.name,
      businessId: service.business.id,
      businessName: service.business.name,
      service: { coverImageUrl: service.cover_image_url, durationMinutes: service.duration_minutes, category: { slug: service.category.slug } },
      bookingDate: params.bookingDate,
      bookingTime: params.bookingTime,
      priceCents: service.price,
      cancelledBy: null, cancelledAt: null,
      refundStatus: null, refundAmount: null,
      canCancel: true, canReschedule: true,
      notesFromCustomer: params.notesFromCustomer ?? null,
    })
  }

  async function fetchMyBookings(
    status: string,
    page = 1,
  ): Promise<{ data: Booking[]; meta: Meta }> {
    await new Promise(resolve => setTimeout(resolve, 600))
    let filtered: Booking[]
    if (status === 'upcoming') filtered = MOCK_BOOKINGS.filter(b => b.status === 'confirmed' || b.status === 'pending')
    else if (status === 'past') filtered = MOCK_BOOKINGS.filter(b => b.status === 'completed')
    else if (status === 'cancelled') filtered = MOCK_BOOKINGS.filter(b => b.status === 'cancelled')
    else filtered = []
    return { data: filtered, meta: { total: filtered.length, page, perPage: 20, lastPage: 1 } }
  }

  async function fetchBookingStats(): Promise<{ upcoming: number; completed: number; totalSpent: number }> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { upcoming: 1, completed: 1, totalSpent: 12000 }
  }

  async function cancelMyBooking(_bookingId: string, _reason?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  return {
    mapBooking,
    fetchCategories,
    fetchServices,
    fetchService,
    fetchAvailability,
    createBooking,
    fetchMyBookings,
    fetchBookingStats,
    cancelMyBooking,
  }
}
