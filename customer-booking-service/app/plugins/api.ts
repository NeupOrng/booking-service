export default defineNuxtPlugin(() => {
  const { token, tryRefresh, logout } = useAuth()
  const config = useRuntimeConfig()

  const apiFetch = $fetch.create({
    baseURL: (config.public.apiBase as string) || 'http://localhost:3001',

    onRequest({ options }) {
      const headers = options.headers

      if (token.value) {
        headers.append('Authorization', `Bearer ${token.value}`);
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        const refreshed = await tryRefresh()
        if (!refreshed) {
          await logout()
        }
      }
    },
  })

  return {
    provide: {
      api: apiFetch,
    },
  }
})
