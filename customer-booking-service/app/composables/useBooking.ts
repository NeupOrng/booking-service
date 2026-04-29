import type { Booking, BookingResponse } from '~/models'
import type { Service, ServiceCategory, AvailabilitySlot, Meta } from '~/types'

// ─── Backend shapes ─────────────────────────────────────────────────────────────

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
  longDescription?: string | null
  avgRating?: number | null
  reviewCount?: number
  isActive?: boolean
}



// ─── Api helper type ────────────────────────────────────────────────────────────

type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>

// ─── Mappers ────────────────────────────────────────────────────────────────────

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
      colorHex: raw.category?.colorHex ?? null,
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
    is_active: raw.isActive,
  }
}

function mapBooking(raw: BookingResponse): Booking {
  return {
    id: raw.id,
    reference: raw.reference,
    status: raw.status,
    serviceId: raw.service.id,
    service: raw.service,
    userId: raw.customer.id,
    date: raw.bookingDate,
    time: raw.bookingTime,
    durationMinutes: raw.service.durationMinutes,
    price: raw.priceCents,
    // capacitySnapshot: raw.capacitySnapshot ?? 1,
    cancelledBy: raw.cancelledBy ?? null,
    cancelledAt: raw.cancelledAt ?? null,
    // cancellationReason: raw.cancellationReason ?? null,
    // refundIssued: raw.refundIssued ?? false,
    refundAmount: raw.refundAmount ?? null,
    notesFromCustomer: raw.notesFromCustomer ?? null,
    // completedAt: raw.completedAt ?? null,
    // createdAt: raw.createdAt ?? '',
    canCancel: raw.canCancel,
    canReschedule: raw.canReschedule,
    business: raw.business
  } as Booking;
}

// ─── Composable ─────────────────────────────────────────────────────────────────

export function useBooking() {
  function getApi(): Api {
    const { $api } = useNuxtApp()
    return $api as unknown as Api
  }

  // ── Categories ────────────────────────────────────────────────────────────────

  async function fetchCategories(): Promise<ServiceCategory[]> {
    const api = getApi()
    const data = await api<CategoryResponseDto[]>('/categories')
    return data.map(c => ({ id: c.id, name: c.name, slug: c.slug, colorHex: c.colorHex ?? null }))
  }

  // ── Services ──────────────────────────────────────────────────────────────────

  async function fetchServices(params: {
    q?: string
    categoryId?: string
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

  // ── Availability ──────────────────────────────────────────────────────────────

  async function fetchAvailability(
    serviceId: string,
    date: string,
  ): Promise<{ date: string; slots: AvailabilitySlot[] }> {
    const api = getApi()
    return api<{ date: string; slots: AvailabilitySlot[] }>(
      `/services/${serviceId}/availability`,
      { query: { date } },
    )
  }

  // ── Bookings ──────────────────────────────────────────────────────────────────

  async function createBooking(params: {
    serviceId: string
    bookingDate: string
    bookingTime: string
    notesFromCustomer?: string
  }): Promise<Booking> {
    const api = getApi()
    const raw = await api<BookingResponse>('/bookings', {
      method: 'POST',
      body: params,
    })
    return mapBooking(raw)
  }

  async function fetchMyBookings(query?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    perPage?: number
  }): Promise<{ data: Booking[]; meta: Meta }> {
    const api = getApi()
    const result = await api<{ data: BookingResponse[]; meta: Meta }>('/bookings/my', {
      query: { ...query },
    })
    return { data: result.data.map(mapBooking), meta: result.meta }
  }

  async function fetchMyBookingById(id: string): Promise<Booking> {
    const api = getApi()
    const raw = await api<BookingResponse>(`/bookings/my/${id}`)
    return mapBooking(raw)
  }

  async function cancelMyBooking(id: string, reason?: string): Promise<Booking> {
    const api = getApi()
    const raw = await api<BookingResponse>(`/bookings/my/${id}/cancel`, {
      method: 'POST',
      body: { reason },
    })
    return mapBooking(raw)
  }

  async function fetchBookingStats(): Promise<{ upcoming: number; completed: number; totalSpent: number }> {
    const api = getApi()
    const [upcomingRes, completedRes] = await Promise.all([
      api<{ meta: Meta }>('/bookings/my', { query: { status: 'pending,confirmed', perPage: 1 } }),
      api<{ meta: Meta }>('/bookings/my', { query: { status: 'completed', perPage: 1 } }),
    ])
    return {
      upcoming: upcomingRes.meta.total,
      completed: completedRes.meta.total,
      totalSpent: 0,
    }
  }

  return {
    getApi,
    mapService,
    mapBooking,
    fetchCategories,
    fetchServices,
    fetchService,
    fetchAvailability,
    createBooking,
    fetchMyBookings,
    fetchMyBookingById,
    cancelMyBooking,
    fetchBookingStats,
  }
}
