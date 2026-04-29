export default defineNuxtPlugin(() => {
  const { token, tryRefresh, logout } = useAuth()
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) || 'http://localhost:3001'

  // Single shared promise for any in-flight refresh.
  // All concurrent 401s await the same promise, so only one
  // POST /auth/refresh is sent regardless of how many requests
  // expire at the same time. Token rotation on the backend means
  // only the first call would succeed anyway.
  let _refreshPromise: Promise<boolean> | null = null

  function refreshOnce(): Promise<boolean> {
    if (!_refreshPromise) {
      _refreshPromise = tryRefresh().finally(() => {
        _refreshPromise = null
      })
    }
    return _refreshPromise
  }

  // Custom fetch wrapper instead of $fetch.create so we can
  // retry the original request after a successful token refresh.
  async function apiFetch<T = unknown>(
    url: string,
    opts: Record<string, unknown> = {},
  ): Promise<T> {
    // Build headers with current access token
    const headers: Record<string, string> = {
      ...((opts.headers as Record<string, string>) ?? {}),
    }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    try {
      return await $fetch<T>(url, { baseURL, ...opts, headers })
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status

      // 401 and not already a retry → refresh + retry once
      if (status === 401 && !(opts as any)._retry) {
        const refreshed = await refreshOnce()

        if (refreshed && token.value) {
          return apiFetch<T>(url, {
            ...opts,
            _retry: true,
            headers: {
              ...((opts.headers as Record<string, string>) ?? {}),
              Authorization: `Bearer ${token.value}`,
            },
          })
        }

        // Refresh failed — clear session and redirect to login
        await logout()
      }

      throw err
    }
  }

  return {
    provide: {
      api: apiFetch,
    },
  }
})
