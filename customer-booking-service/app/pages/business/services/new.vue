<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { createService } = useBusinessOwner()
const { notify } = useNotify()
const loading = ref(false)

async function handleSubmit(data: any) {
  loading.value = true
  try {
    const created = await createService(data)
    notify.success('Service created', `Redirecting to availability setup…`)
    await navigateTo(`/business/services/${created.id}/availability`)
  } catch (e: any) {
    notify.error('Failed to create service', e?.data?.message)
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
