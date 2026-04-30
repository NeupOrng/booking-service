"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBookingResponse = void 0;
function toBookingResponse(row, includeCustomer = false) {
    var _a, _b, _c, _d, _e;
    const { booking, service, category, business, customer } = row;
    return Object.assign({ id: booking.id, reference: booking.reference, status: booking.status, service: {
            id: service.id,
            name: service.name,
            coverImageUrl: service.coverImageUrl,
            durationMinutes: service.durationMinutes,
            category: category ? { slug: category.slug } : { slug: '' },
        }, business: business, customer: customer, bookingDate: booking.bookingDate, bookingTime: booking.bookingTime, priceCents: booking.priceCents, cancelledBy: (_a = booking.cancelledBy) !== null && _a !== void 0 ? _a : null, cancelledAt: (_b = booking.cancelledAt) !== null && _b !== void 0 ? _b : null, refundStatus: (_c = booking.refundStatus) !== null && _c !== void 0 ? _c : null, refundAmount: (_d = booking.refundAmount) !== null && _d !== void 0 ? _d : null, notesFromCustomer: (_e = booking.notesFromCustomer) !== null && _e !== void 0 ? _e : null, canCancel: ['pending', 'confirmed'].includes(booking.status), canReschedule: ['pending', 'confirmed'].includes(booking.status) }, (includeCustomer
        ? {
            customer: {
                id: customer.id,
                fullName: customer.fullName,
                email: customer.email,
                avatarUrl: customer.avatarUrl,
            },
        }
        : {}));
}
exports.toBookingResponse = toBookingResponse;
//# sourceMappingURL=format.utils.js.map