import { defineStore } from 'pinia'
import type { Service } from '~/types'

export interface BookingState {
  serviceId: string | null
  service: Service | null
  selectedDate: string | null       // YYYY-MM-DD
  selectedTime: string | null       // HH:mm
  step: 1 | 2 | 3 | 4
  bookingReference: string | null
}

export const useBookingStore = defineStore('booking', {
  state: (): BookingState => ({
    serviceId: null,
    service: null,
    selectedDate: null,
    selectedTime: null,
    step: 1,
    bookingReference: null
  }),
  actions: {
    setService(id: string, srv: Service) {
      this.serviceId = id
      this.service = srv
    },
    setDateTime(date: string, time: string) {
      this.selectedDate = date
      this.selectedTime = time
    },
    nextStep() {
      if (this.step < 4) this.step++
    },
    prevStep() {
      if (this.step > 1) this.step--
    },
    setStep(step: 1 | 2 | 3 | 4) {
      this.step = step
    },
    setConfirmation(ref: string) {
      this.bookingReference = ref
    },
    reset() {
      this.serviceId = null
      this.service = null
      this.selectedDate = null
      this.selectedTime = null
      this.step = 1
      this.bookingReference = null
    }
  }
})
