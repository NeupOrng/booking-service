export function toBookingResponse(row: any, includeCustomer = false) {
    const { booking, service, category, business, customer } = row;
    return {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        service: {
            id: service.id,
            name: service.name,
            coverImageUrl: service.coverImageUrl,
            durationMinutes: service.durationMinutes,
            category: category ? { slug: category.slug } : { slug: '' },
        },
        business: business,
        customer: customer,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        priceCents: booking.priceCents,
        cancelledBy: booking.cancelledBy ?? null,
        cancelledAt: booking.cancelledAt ?? null,
        refundStatus: booking.refundStatus ?? null,
        refundAmount: booking.refundAmount ?? null,
        notesFromCustomer: booking.notesFromCustomer ?? null,
        canCancel: ['pending', 'confirmed'].includes(booking.status),
        canReschedule: ['pending', 'confirmed'].includes(booking.status),
        ...(includeCustomer
            ? {
                  customer: {
                      id: customer.id,
                      fullName: customer.fullName,
                      email: customer.email,
                      avatarUrl: customer.avatarUrl,
                  },
              }
            : {}),
    };
}

