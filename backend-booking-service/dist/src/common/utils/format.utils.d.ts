export declare function toBookingResponse(row: any, includeCustomer?: boolean): {
    customer: any;
    id: any;
    reference: any;
    status: any;
    service: {
        id: any;
        name: any;
        coverImageUrl: any;
        durationMinutes: any;
        category: {
            slug: any;
        };
    };
    business: any;
    bookingDate: any;
    bookingTime: any;
    priceCents: any;
    cancelledBy: any;
    cancelledAt: any;
    refundStatus: any;
    refundAmount: any;
    notesFromCustomer: any;
    canCancel: boolean;
    canReschedule: boolean;
};
