import type { Booking } from '~/models';
import type {
    Service,
    BusinessProfile,
    AvailabilityRule,
    AvailabilityBlock,
    Meta,
} from '~/types';

type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>;

export function useBusinessOwner() {
    // useState uses a key so all callers share the same reactive state — safe to
    // call inside the composable function rather than at module level.
    const _cachedBusiness = useState<BusinessProfile | null>(
        'ownerBusiness',
        () => null,
    );

    function getApi(): Api {
        const { $api } = useNuxtApp();
        return $api as unknown as Api;
    }

    // ── Business profile ──────────────────────────────────────────────────────────

    async function fetchMyBusiness(): Promise<BusinessProfile> {
        if (_cachedBusiness.value) return _cachedBusiness.value;
        const api = getApi();
        const biz = await api<BusinessProfile>('/businesses/me');
        _cachedBusiness.value = biz;
        return biz;
    }

    async function updateBusiness(
        id: string,
        data: Partial<BusinessProfile>,
    ): Promise<BusinessProfile> {
        const api = getApi();
        const updated = await api<BusinessProfile>(`/businesses/${id}`, {
            method: 'PATCH',
            body: data,
        });
        _cachedBusiness.value = updated;
        return updated;
    }

    // ── Services ──────────────────────────────────────────────────────────────────

    async function fetchMyServices(query?: {
        q?: string;
        page?: number;
        perPage?: number;
    }): Promise<{ data: Service[]; meta: Meta }> {
        const api = getApi();
        return api('/services', {
            query: {
                ...(query?.q ? { q: query.q } : {}),
                page: query?.page ?? 1,
                perPage: query?.perPage ?? 20,
            },
        });
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
        let biz = _cachedBusiness.value
        if(biz === null) {
            biz = await fetchMyBusiness();
        }
        const req = { ...data, businessId: biz.id };
        return api<Service>('/services', { method: 'POST', body: req });
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
        return api<Service>(`/services/${id}`, { method: 'PATCH', body: data });
    }

    // ── Bookings ──────────────────────────────────────────────────────────────────

    async function fetchBusinessBookings(query?: {
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        perPage?: number;
    }): Promise<{ data: Booking[]; meta: Meta }> {
        const api = getApi();
        const { mapBooking } = useBooking();
        const raw = await api<{ data: any[]; meta: Meta }>(
            '/bookings/business',
            {
                query: {
                    ...(query?.status ? { status: query.status } : {}),
                    ...(query?.dateFrom ? { dateFrom: query.dateFrom } : {}),
                    ...(query?.dateTo ? { dateTo: query.dateTo } : {}),
                    page: query?.page ?? 1,
                    perPage: query?.perPage ?? 20,
                },
            },
        );
        return { data: raw.data.map(mapBooking), meta: raw.meta };
    }

    async function fetchBusinessBookingById(id: string): Promise<Booking> {
        const api = getApi();
        const { mapBooking } = useBooking();
        const raw = await api<any>(`/bookings/business/${id}`);
        return mapBooking(raw);
    }

    async function confirmBooking(id: string): Promise<Booking> {
        const api = getApi();
        const { mapBooking } = useBooking();
        const raw = await api<any>(`/bookings/business/${id}/status`, {
            method: 'PATCH',
            body: { status: 'confirmed' },
        });
        return mapBooking(raw);
    }

    async function completeBooking(id: string): Promise<Booking> {
        const api = getApi();
        const { mapBooking } = useBooking();
        const raw = await api<any>(`/bookings/business/${id}/status`, {
            method: 'PATCH',
            body: { status: 'completed' },
        });
        return mapBooking(raw);
    }

    async function cancelBusinessBooking(
        id: string,
        reason?: string,
    ): Promise<Booking> {
        const api = getApi();
        const { mapBooking } = useBooking();
        const raw = await api<any>(`/bookings/business/${id}/cancel`, {
            method: 'POST',
            body: { reason },
        });
        return mapBooking(raw);
    }

    // ── Availability rules ────────────────────────────────────────────────────────

    async function fetchRules(serviceId: string): Promise<AvailabilityRule[]> {
        const api = getApi();
        return api<AvailabilityRule[]>(
            `/services/${serviceId}/availability-rules`,
        );
    }

    async function createRule(
        serviceId: string,
        data: Omit<AvailabilityRule, 'id' | 'serviceId'>,
    ): Promise<AvailabilityRule> {
        const api = getApi();
        return api<AvailabilityRule>(
            `/services/${serviceId}/availability-rules`,
            {
                method: 'POST',
                body: data,
            },
        );
    }

    async function updateRule(
        serviceId: string,
        ruleId: string,
        data: Partial<AvailabilityRule>,
    ): Promise<AvailabilityRule> {
        const api = getApi();
        return api<AvailabilityRule>(
            `/services/${serviceId}/availability-rules/${ruleId}`,
            {
                method: 'PATCH',
                body: data,
            },
        );
    }

    async function deleteRule(
        serviceId: string,
        ruleId: string,
    ): Promise<void> {
        const api = getApi();
        await api(`/services/${serviceId}/availability-rules/${ruleId}`, {
            method: 'DELETE',
        });
    }

    // ── Availability blocks ───────────────────────────────────────────────────────

    async function fetchBlocks(
        serviceId: string,
    ): Promise<AvailabilityBlock[]> {
        const api = getApi();
        return api<AvailabilityBlock[]>(
            `/services/${serviceId}/availability-blocks`,
        );
    }

    async function createBlock(
        serviceId: string,
        data: Omit<AvailabilityBlock, 'id' | 'serviceId'>,
    ): Promise<AvailabilityBlock> {
        const api = getApi();
        return api<AvailabilityBlock>(
            `/services/${serviceId}/availability-blocks`,
            {
                method: 'POST',
                body: data,
            },
        );
    }

    async function deleteBlock(
        serviceId: string,
        blockId: string,
    ): Promise<void> {
        const api = getApi();
        await api(`/services/${serviceId}/availability-blocks/${blockId}`, {
            method: 'DELETE',
        });
    }

    return {
        fetchMyBusiness,
        updateBusiness,
        fetchMyServices,
        createService,
        updateService,
        fetchBusinessBookings,
        fetchBusinessBookingById,
        confirmBooking,
        completeBooking,
        cancelBusinessBooking,
        fetchRules,
        createRule,
        updateRule,
        deleteRule,
        fetchBlocks,
        createBlock,
        deleteBlock,
    };
}
