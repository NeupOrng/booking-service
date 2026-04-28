import { defineStore } from 'pinia'

interface BookingIntent {
  serviceId: string | null
  date: string | null   // YYYY-MM-DD
  time: string | null   // HH:mm
}

export const useBookingIntentStore = defineStore('bookingIntent', {
  state: (): BookingIntent => ({
    serviceId: null,
    date: null,
    time: null,
  }),
  actions: {
    set(serviceId: string, date: string, time: string) {
      this.serviceId = serviceId
      this.date = date
      this.time = time
    },
    clear() {
      this.serviceId = null
      this.date = null
      this.time = null
    },
  },
})
