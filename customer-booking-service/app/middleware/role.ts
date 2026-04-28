export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  if (!user.value) return // auth middleware handles unauthenticated case

  const isOwner = user.value.role === 'business_owner'
  const isCustomerRoute = to.path.startsWith('/book') || to.path.startsWith('/account')
  const isBusinessRoute = to.path.startsWith('/business')

  if (isOwner && isCustomerRoute) return navigateTo('/business')
  if (!isOwner && isBusinessRoute) return navigateTo('/services')
})
