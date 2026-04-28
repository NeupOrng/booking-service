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
}

export interface Review {
  id: string
  reviewer_initials: string
  rating: number
  comment: string
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number          // cents
  duration_minutes: number
  category: ServiceCategory
  business: Business
  cover_image_url: string | null
  next_available_slot: string | null
  is_active?: boolean

  // Detail fields
  long_description?: string
  images?: string[]
  cancellation_policy?: string
  reviews?: Review[]
  avg_rating?: number | null
  review_count?: number
}

export interface AvailabilitySlot {
  time: string
  available: boolean
  capacity: number
  bookedCount: number
  remainingCapacity: number
}

export interface Booking {
  id: string
  reference: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service: { id: string; name: string; cover_image_url: string | null; duration_minutes: number; category: { slug: string } }
  business: { id: string; name: string }
  date: string           // YYYY-MM-DD
  time: string           // HH:mm
  price: number          // cents
  cancelled_by: 'customer' | 'business' | 'admin' | null
  cancelled_at: string | null
  refund_status: 'refunded' | 'partial' | 'none' | null
  refund_amount: number | null   // cents
  can_cancel: boolean
  can_reschedule: boolean
  notes_from_customer?: string | null
}

export interface User {
  id: string
  fullName: string
  email: string
  avatarUrl?: string | null
  role: 'customer' | 'business_owner' | 'admin'
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
}

export interface Meta {
  total: number
  page: number
  perPage: number
  lastPage: number
}
