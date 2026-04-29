export interface BookingResponse {
    completedAt: null
    "id": string,
    "reference": string,
    "status": 'pending' | 'confirmed' | 'completed' | 'cancelled',
    "service": {
        "id": string,
        "name": string,
        "coverImageUrl": string,
        "durationMinutes": number,
        "category": {
            "slug": string
        }
    },
    "business": {
        "id": string,
        "name": string,
        "logo": string
    },
    "customer": {
        "id": string,
        "fullName": string,
        "email": string
    },
    "bookingDate": string,
    "bookingTime": string,
    "priceCents": number,
    "cancelledBy": 'customer' | 'business' | 'admin' | null,
    "cancelledAt": string | null,
    "refundStatus": string | null,
    "refundAmount": number | null,
    "notesFromCustomer": string | null,
    "canCancel": boolean,
    "canReschedule": boolean
}

