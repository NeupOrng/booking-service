import type { User } from '~/types'

interface BackendUser {
  id: string
  fullName: string
  email: string | null
  avatarUrl: string | null
  role: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: BackendUser
}

function mapUser(data: BackendUser): User {
  return {
    id: data.id,
    fullName: data.fullName,
    email: data.email ?? '',
    avatarUrl: data.avatarUrl,
    role: data.role as User['role'],
  }
}

export function useAuth() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  const accessToken = useCookie<string | null>('access_token', {
    maxAge: 60 * 20,
    sameSite: 'lax',
  })
  const refreshToken = useCookie<string | null>('refresh_token', {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
  const user = useState<User | null>('user', () => null)
  const isAuthenticated = computed(() => !!accessToken.value)

  async function fetchUser() {
    if (!accessToken.value) return
    try {
      const data = await $fetch<BackendUser>('/users/me', {
        baseURL,
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })
      user.value = mapUser(data)
    } catch {
      accessToken.value = null
      refreshToken.value = null
      user.value = null
    }
  }

  async function login(email: string, password: string) {
    const data = await $fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      baseURL,
      body: { email, password },
    })
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = mapUser(data.user)
  }

  async function register(fullName: string, email: string, password: string) {
    const data = await $fetch<AuthResponse>('/auth/register', {
      method: 'POST',
      baseURL,
      body: { fullName, email, password },
    })
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = mapUser(data.user)
  }

  async function logout() {
    if (accessToken.value) {
      await $fetch('/auth/logout', {
        method: 'POST',
        baseURL,
        headers: { Authorization: `Bearer ${accessToken.value}` },
      }).catch(() => {})
    }
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    await navigateTo('/')
  }

  // Module-level singleton so concurrent callers from different composable
  // instances (e.g. useBusinessOwner + useBooking both 401-ing on boot)
  // share the same promise and only one POST /auth/refresh is sent.
  const _tryRefreshPromise = useState<Promise<boolean> | null>('_tryRefreshPromise', () => null)

  async function tryRefresh(): Promise<boolean> {
    if (!refreshToken.value) return false

    if (_tryRefreshPromise.value) return _tryRefreshPromise.value

    const promise = $fetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      baseURL,
      body: { refreshToken: refreshToken.value },
    })
      .then((data) => {
        accessToken.value = data.accessToken
        refreshToken.value = data.refreshToken
        return true
      })
      .catch(() => {
        accessToken.value = null
        refreshToken.value = null
        user.value = null
        return false
      })
      .finally(() => {
        _tryRefreshPromise.value = null
      })

    _tryRefreshPromise.value = promise
    return promise
  }

  function setFromOAuth(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
  }

  async function updateProfile(data: { fullName?: string; email?: string; avatarUrl?: string }) {
    const updated = await $fetch<BackendUser>('/users/me', {
      method: 'PATCH',
      baseURL,
      headers: { Authorization: `Bearer ${accessToken.value}` },
      body: data,
    })
    user.value = mapUser(updated)
  }

  async function deactivateAccount() {
    await $fetch('/users/me', {
      method: 'DELETE',
      baseURL,
      headers: { Authorization: `Bearer ${accessToken.value}` },
    })
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    await navigateTo('/')
  }

  return {
    token: accessToken,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    tryRefresh,
    setFromOAuth,
    updateProfile,
    deactivateAccount,
  }
}
