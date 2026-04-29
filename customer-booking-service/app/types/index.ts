export interface User {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  role: 'customer' | 'business_owner' | 'admin'
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  colorHex: string | null
}

export interface Business {
  id: string
  name: string
  logo_url: string | null
  address?: string
  about?: string
  phone?: string
  slug?: string
  description?: string
  status?: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration_minutes: number
  category: ServiceCategory
  business: Business
  cover_image_url: string | null
  next_available_slot: string | null
  long_description?: string
  cancellation_policy?: string
  avg_rating?: number | null
  review_count?: number
  is_active?: boolean
  business_id?: string
}

export interface AvailabilitySlot {
  time: string
  available: boolean
  capacity: number
  bookedCount: number
  remainingCapacity: number
}

export interface AvailabilityRule {
  id: string
  serviceId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
  capacity: number
  isActive: boolean
}

export interface AvailabilityBlock {
  id: string
  serviceId: string
  blockDate: string
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export interface BusinessProfile {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  address: string | null
  logoUrl: string | null
  phone: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface Meta {
  total: number
  page: number
  perPage: number
  lastPage: number
}

export interface BookingStats {
  pending: number
  confirmed: number
  completed: number
  cancelled: number
}
