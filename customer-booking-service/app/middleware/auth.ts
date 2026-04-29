export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
