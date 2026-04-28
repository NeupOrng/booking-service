<script setup lang="ts">
const { user, isAuthenticated } = useAuth()
if (isAuthenticated.value && user.value?.role === 'business_owner') {
  navigateTo('/business')
} else {
  navigateTo('/services')
}
</script>
<template><div /></template>
