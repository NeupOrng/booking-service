export interface Booking {
    id: string;
    reference: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    serviceId: string;
    userId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    durationMinutes: number;
    price: number; // cents
    capacitySnapshot: number;
    cancelledBy: 'customer' | 'business' | 'admin' | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
    refundIssued: boolean;
    refundAmount: number | null; // cents
    notesFromCustomer: string | null;
    completedAt: string | null;
    createdAt: string;
    canCancel: boolean;
    canReschedule: boolean;
    service: {
        id: string;
        name: string;
        coverImageUrl: string;
        durationMinutes: number;
        category: { slug: string };
    };
    business: {
        id: string;
        name: string;
        logo: string;
    };
    customer: {
        id: string;
        fullName: string;
        email: string;
        avatarUrl: string;
    };
}
