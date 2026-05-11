<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster />
  <NotificationStack />
</template>

<script setup lang="ts">
import { Toaster } from '~/components/ui/sonner'
import NotificationStack from '~/components/ui/notification/NotificationStack.vue'
</script>
