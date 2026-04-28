export default defineNuxtPlugin(async () => {
  const { token, user, fetchUser, tryRefresh } = useAuth()

  if (token.value && !user.value) {
    await fetchUser()
    // If fetchUser cleared the token (expired JWT), try refreshing
    if (!token.value) {
      const refreshed = await tryRefresh()
      if (refreshed) await fetchUser()
    }
  }
})
