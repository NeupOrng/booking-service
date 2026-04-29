<script setup lang="ts">
import { toast } from 'vue-sonner'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const route = useRoute()
const serviceId = route.params.id as string
const { updateService } = useBusinessOwner()
const { fetchService } = useBooking()

const service = ref<any>(null)
const loading = ref(false)
const fetching = ref(true)

onMounted(async () => {
  service.value = await fetchService(serviceId)
  fetching.value = false
})

async function handleSubmit(data: any) {
  loading.value = true
  try {
    await updateService(serviceId, data)
    toast.success('Service updated')
    await navigateTo('/business/services')
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'Failed to update service')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto space-y-6">
    <div>
      <NuxtLink to="/business/services" class="text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Back to services
      </NuxtLink>
      <h1 class="text-2xl font-bold mt-3">Edit service</h1>
    </div>
    <div class="bg-card border border-border rounded-2xl p-6 listeo-shadow">
      <div v-if="fetching" class="space-y-4">
        <Skeleton v-for="i in 5" :key="i" class="h-10 w-full rounded-xl" />
      </div>
      <BusinessServiceForm v-else :service="service" :loading="loading" @submit="handleSubmit" />
    </div>
  </div>
</template>
