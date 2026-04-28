<script setup lang="ts">
import { toast } from 'vue-sonner'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { createService } = useBusinessOwner()
const loading = ref(false)

async function handleSubmit(data: any) {
  loading.value = true
  try {
    const created = await createService(data)
    toast.success('Service created')
    await navigateTo(`/business/services/${created.id}/availability`)
  } catch (e: any) {
    toast.error(e?.data?.message ?? 'Failed to create service')
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
      <h1 class="text-2xl font-bold mt-3">New service</h1>
    </div>
    <div class="bg-card border border-border rounded-2xl p-6 listeo-shadow">
      <BusinessServiceForm :loading="loading" @submit="handleSubmit" />
    </div>
  </div>
</template>
