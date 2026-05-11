import type { Review, ReviewStats, Meta } from '~/types'

type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>

export function useReviews() {
  function getApi(): Api {
    const { $api } = useNuxtApp()
    return $api as unknown as Api
  }

  async function fetchReviews(
    serviceId: string,
    params?: { page?: number; perPage?: number },
  ): Promise<{ data: Review[]; meta: Meta }> {
    const api = getApi()
    return api('/reviews', { query: { serviceId, ...params } })
  }

  async function fetchReviewStats(serviceId: string): Promise<ReviewStats> {
    const api = getApi()
    return api('/reviews/stats', { query: { serviceId } })
  }

  async function createReview(data: {
    serviceId: string
    bookingId?: string
    rating: number
    comment?: string
  }): Promise<Review> {
    const api = getApi()
    return api('/reviews', { method: 'POST', body: data })
  }

  async function deleteReview(id: string): Promise<void> {
    const api = getApi()
    await api(`/reviews/${id}`, { method: 'DELETE' })
  }

  return { fetchReviews, fetchReviewStats, createReview, deleteReview }
}
