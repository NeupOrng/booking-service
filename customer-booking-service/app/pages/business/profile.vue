<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
definePageMeta({ middleware: ['auth', 'role'], layout: 'business' })

const { fetchMyBusiness, updateBusiness } = useBusinessOwner()
const { deactivateAccount } = useAuth()

const biz = ref<any>(null)
const fetching = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const showDeactivateDialog = ref(false)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  address: '',
  phone: '',
  logoUrl: '',
})
const errors = reactive<Record<string, string>>({})

onMounted(async () => {
  biz.value = await fetchMyBusiness().catch(() => null)
  if (biz.value) {
    form.name = biz.value.name ?? ''
    form.slug = biz.value.slug ?? ''
    form.description = biz.value.description ?? ''
    form.address = biz.value.address ?? ''
    form.phone = biz.value.phone ?? ''
    form.logoUrl = biz.value.logoUrl ?? ''
  }
  fetching.value = false
})

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name || form.name.length < 2) errors.name = 'Name must be at least 2 characters'
  if (!form.slug || !/^[a-z0-9-]+$/.test(form.slug)) errors.slug = 'Slug must be lowercase letters, numbers and hyphens only'
  if (form.phone && (form.phone.length < 10 || form.phone.length > 30)) errors.phone = 'Phone must be 10–30 characters'
  return Object.keys(errors).length === 0
}

async function save() {
  if (!validate() || !biz.value) return
  saving.value = true
  try {
    await updateBusiness(biz.value.id, {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      logoUrl: form.logoUrl || undefined,
    } as any)
    toast.success('Profile updated')
  } catch (e: any) {
    const msg = e?.data?.message
    if (e?.response?.status === 409) errors.slug = 'This slug is already taken'
    else toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to save'))
  } finally {
    saving.value = false
  }
}

async function confirmDeactivate() {
  deactivating.value = true
  try {
    await deactivateAccount()
  } catch {
    toast.error('Failed to deactivate account')
    deactivating.value = false
    showDeactivateDialog.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <h1 class="text-2xl font-bold">Business profile</h1>

    <div v-if="fetching" class="space-y-4">
      <Skeleton v-for="i in 6" :key="i" class="h-10 w-full rounded-xl" />
    </div>

    <div v-else class="bg-card border border-border rounded-2xl p-6 listeo-shadow space-y-5">
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Business name <span class="text-destructive">*</span></label>
        <Input v-model="form.name" placeholder="My Business" />
        <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Slug <span class="text-destructive">*</span></label>
        <Input v-model="form.slug" placeholder="my-business" />
        <p v-if="errors.slug" class="text-xs text-destructive">{{ errors.slug }}</p>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Description</label>
        <Textarea v-model="form.description" rows="3" placeholder="Tell customers about your business..." />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Address</label>
          <Input v-model="form.address" placeholder="123 Main St" />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Phone</label>
          <Input v-model="form.phone" placeholder="+1 555 000 0000" />
          <p v-if="errors.phone" class="text-xs text-destructive">{{ errors.phone }}</p>
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Logo URL</label>
        <Input v-model="form.logoUrl" type="url" placeholder="https://..." />
      </div>
      <Button class="w-full h-11" @click="save" :disabled="saving">
        <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
        Save changes
      </Button>
    </div>

    <!-- Danger zone -->
    <div class="border border-destructive/40 rounded-2xl p-6 space-y-3">
      <h2 class="font-semibold text-destructive">Danger zone</h2>
      <p class="text-sm text-muted-foreground">Permanently deactivate your account. This cannot be undone.</p>
      <Button variant="destructive" @click="showDeactivateDialog = true">Deactivate account</Button>
    </div>

    <!-- Deactivate confirmation dialog -->
    <AlertDialog :open="showDeactivateDialog" @update:open="showDeactivateDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently deactivate your account and all associated services. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showDeactivateDialog = false">Cancel</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="confirmDeactivate" :disabled="deactivating">
            <Loader2 v-if="deactivating" class="w-4 h-4 mr-2 animate-spin" />
            Yes, deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
