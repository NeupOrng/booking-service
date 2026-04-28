import { format, parseISO, parse, isToday, isTomorrow } from 'date-fns'

export function useFormatters() {
  function formatCurrency(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  function formatBookingDate(dateStr: string): string {
    return format(parseISO(dateStr), 'EEEE, d MMMM yyyy')
  }

  function formatBookingTime(timeStr: string): string {
    return format(parse(timeStr, 'HH:mm', new Date()), 'h:mm a')
  }

  function formatNextSlot(isoDatetime: string | null): { label: string; urgent: boolean } {
    if (!isoDatetime) return { label: 'Fully booked', urgent: true }
    const date = parseISO(isoDatetime)
    if (isToday(date)) return { label: `Today ${format(date, 'h:mm a')}`, urgent: false }
    if (isTomorrow(date)) return { label: `Tomorrow ${format(date, 'h:mm a')}`, urgent: false }
    return { label: format(date, 'MMM d, h:mm a'), urgent: false }
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`
  }

  return { formatCurrency, formatBookingDate, formatBookingTime, formatNextSlot, formatDuration }
}
