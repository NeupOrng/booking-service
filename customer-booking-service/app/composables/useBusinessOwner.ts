import type {
  Service,
  BusinessProfile,
  AvailabilityRule,
  AvailabilityBlock,
  Booking,
  Meta,
} from "~/types";

type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>;

function getApi(): Api {
  const { $api } = useNuxtApp();
  return $api as unknown as Api;
}

export function useBusinessOwner() {
  // ── Business profile ────────────────────────────────────────────────────────

  async function fetchMyBusiness(): Promise<BusinessProfile> {
    const api = getApi();
    return api<BusinessProfile>("/businesses/me");
  }

  async function updateBusiness(
    id: string,
    data: Partial<BusinessProfile>,
  ): Promise<BusinessProfile> {
    const api = getApi();
    return api<BusinessProfile>(`/businesses/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  // ── Services ────────────────────────────────────────────────────────────────

  async function fetchMyServices(params?: {
    q?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ data: Service[]; meta: Meta }> {
    const api = getApi();
    const { $api: rawApi } = useNuxtApp();
    // get businessId from current user's business
    const biz = await fetchMyBusiness();
    return (rawApi as unknown as Api)<{ data: Service[]; meta: Meta }>(
      "/services/by-business",
      {
        query: {
          ...(params?.q ? { q: params.q } : {}),
          page: params?.page ?? 1,
          perPage: params?.perPage ?? 20,
        },
      },
    );
  }

  async function createService(data: {
    name: string;
    categoryId?: string;
    description?: string;
    priceCents: number;
    durationMinutes: number;
    coverImageUrl?: string;
    cancellationPolicy?: string;
    isActive?: boolean;
  }): Promise<Service> {
    const api = getApi();
    return api<Service>("/services", { method: "POST", body: data });
  }

  async function updateService(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      description?: string;
      priceCents?: number;
      durationMinutes?: number;
      coverImageUrl?: string;
      cancellationPolicy?: string;
      isActive?: boolean;
    },
  ): Promise<Service> {
    const api = getApi();
    return api<Service>(`/services/${id}`, { method: "PATCH", body: data });
  }

  // ── Availability rules ──────────────────────────────────────────────────────

  async function fetchRules(serviceId: string): Promise<AvailabilityRule[]> {
    const api = getApi();
    return api<AvailabilityRule[]>(`/services/${serviceId}/availability-rules`);
  }

  async function createRule(
    serviceId: string,
    data: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
      capacity: number;
    },
  ): Promise<AvailabilityRule> {
    const api = getApi();
    return api<AvailabilityRule>(`/services/${serviceId}/availability-rules`, {
      method: "POST",
      body: data,
    });
  }

  async function updateRule(
    serviceId: string,
    ruleId: string,
    data: Partial<{
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
      capacity: number;
      isActive: boolean;
    }>,
  ): Promise<AvailabilityRule> {
    const api = getApi();
    return api<AvailabilityRule>(
      `/services/${serviceId}/availability-rules/${ruleId}`,
      { method: "PATCH", body: data },
    );
  }

  async function deleteRule(serviceId: string, ruleId: string): Promise<void> {
    const api = getApi();
    await api(`/services/${serviceId}/availability-rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  // ── Availability blocks ─────────────────────────────────────────────────────

  async function fetchBlocks(serviceId: string): Promise<AvailabilityBlock[]> {
    const api = getApi();
    return api<AvailabilityBlock[]>(
      `/services/${serviceId}/availability-blocks`,
    );
  }

  async function createBlock(
    serviceId: string,
    data: {
      blockDate: string;
      startTime?: string;
      endTime?: string;
      reason?: string;
    },
  ): Promise<AvailabilityBlock> {
    const api = getApi();
    return api<AvailabilityBlock>(
      `/services/${serviceId}/availability-blocks`,
      { method: "POST", body: data },
    );
  }

  async function updateBlock(
    serviceId: string,
    blockId: string,
    data: Partial<{
      blockDate: string;
      startTime: string | null;
      endTime: string | null;
      reason: string | null;
    }>,
  ): Promise<AvailabilityBlock> {
    const api = getApi();
    return api<AvailabilityBlock>(
      `/services/${serviceId}/availability-blocks/${blockId}`,
      { method: "PATCH", body: data },
    );
  }

  async function deleteBlock(
    serviceId: string,
    blockId: string,
  ): Promise<void> {
    const api = getApi();
    await api(`/services/${serviceId}/availability-blocks/${blockId}`, {
      method: "DELETE",
    });
  }

  // ── Business bookings ───────────────────────────────────────────────────────

  async function fetchBusinessBookings(params: {
    status?: string;
    page?: number;
    perPage?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: Booking[]; meta: Meta }> {
    const api = getApi();
    const raw = await api<{ data: any[]; meta: Meta }>("/bookings/business", {
      query: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
        ...(params.dateTo ? { dateTo: params.dateTo } : {}),
        page: params.page ?? 1,
        perPage: params.perPage ?? 20,
      },
    });
    const { mapBooking } = useBooking();
    return { data: raw.data.map(mapBooking), meta: raw.meta };
  }

  async function confirmBooking(bookingId: string): Promise<Booking> {
    const api = getApi();
    const raw = await api<any>(`/bookings/business/${bookingId}/status`, {
      method: "PATCH",
      body: { status: "confirmed" },
    });
    const { mapBooking } = useBooking();
    return mapBooking(raw);
  }

  async function completeBooking(bookingId: string): Promise<Booking> {
    const api = getApi();
    const raw = await api<any>(`/bookings/business/${bookingId}/status`, {
      method: "PATCH",
      body: { status: "completed" },
    });
    const { mapBooking } = useBooking();
    return mapBooking(raw);
  }

  async function cancelBusinessBooking(
    bookingId: string,
    reason?: string,
  ): Promise<Booking> {
    const api = getApi();
    const raw = await api<any>(`/bookings/business/${bookingId}/cancel`, {
      method: "POST",
      body: { reason },
    });
    const { mapBooking } = useBooking();
    return mapBooking(raw);
  }

  return {
    fetchMyBusiness,
    updateBusiness,
    fetchMyServices,
    createService,
    updateService,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    fetchBusinessBookings,
    confirmBooking,
    completeBooking,
    cancelBusinessBooking,
  };
}
