// Decode the exp claim from a JWT without verifying the signature.
// Used only to decide whether to skip a network call, not for security.
function isJwtExpired(jwt: string, bufferSeconds = 30): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')))
    // Treat as expired `bufferSeconds` before actual expiry so we
    // proactively refresh rather than getting a 401 mid-request.
    return Date.now() >= (payload.exp - bufferSeconds) * 1000
  } catch {
    return true
  }
}

export default defineNuxtPlugin(async () => {
  const { token, user, fetchUser, tryRefresh } = useAuth()

  if (!token.value) return

  if (isJwtExpired(token.value)) {
    // Access token is expired (or about to expire) — refresh before
    // fetching the user so we don't waste a network round-trip on a 401.
    const refreshed = await tryRefresh()
    if (refreshed) await fetchUser()
    // If tryRefresh failed it already cleared the cookies; nothing to do.
  } else if (!user.value) {
    // Token looks valid — hydrate the user state
    await fetchUser()

    // fetchUser clears token.value on 401 — if that happened, try refresh
    if (!token.value) {
      const refreshed = await tryRefresh()
      if (refreshed) await fetchUser()
    }
  }
})
