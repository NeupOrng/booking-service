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

  function formatRelativeTime(isoDatetime: string): string {
    const now = new Date()
    const date = parseISO(isoDatetime)
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffWeeks === 1) return 'last week'
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`
    return format(date, 'MMM d, yyyy')
  }

  return { formatCurrency, formatBookingDate, formatBookingTime, formatNextSlot, formatDuration, formatRelativeTime }
}
