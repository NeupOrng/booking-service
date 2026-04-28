<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { setFromOAuth, fetchUser, user } = useAuth()

onMounted(async () => {
  const accessToken = route.query.accessToken as string | undefined
  const refreshToken = route.query.refreshToken as string | undefined

  if (accessToken && refreshToken) {
    setFromOAuth(accessToken, refreshToken)
    await fetchUser()
    const dest = user.value?.role === 'business_owner' ? '/business' : '/services'
    await navigateTo(dest)
  } else {
    await navigateTo('/auth/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-3 text-muted-foreground">
      <svg class="w-8 h-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p class="text-sm">Completing sign in…</p>
    </div>
  </div>
</template>
