<script setup lang="ts">
import { Loader2, Camera, BadgeCheck } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

const { user, updateProfile, deactivateAccount } = useAuth()

const { $api } = useNuxtApp()
type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>
const api = $api as unknown as Api

const saving = ref(false)
const deactivating = ref(false)
const showDeactivateDialog = ref(false)
const uploadingAvatar = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  fullName: '',
  email: '',
  avatarUrl: '',
})

const errors = reactive<Record<string, string>>({})
const pristine = ref(true)
watch(form, () => { pristine.value = false }, { deep: true })

onMounted(async () => {
  form.fullName  = user.value?.fullName  ?? ''
  form.email     = user.value?.email     ?? ''
  form.avatarUrl = user.value?.avatarUrl ?? ''
  await nextTick()
  pristine.value = true
})

const roleLabel = computed(() => {
  switch (user.value?.role) {
    case 'business_owner': return 'Business owner'
    case 'admin':          return 'Admin'
    default:               return 'Customer'
  }
})

const initials = computed(() =>
  (form.fullName || form.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

// ── Avatar upload ──────────────────────────────────────────────────────────────
function triggerAvatarUpload() {
  fileInputRef.value?.click()
}

async function handleAvatarFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be under 5 MB')
    return
  }

  uploadingAvatar.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)

    const uploaded = await api<{ id: string }>('/files/upload', {
      method: 'POST',
      query: { subfolder: 'avatars' },
      body: fd,
    })

    const { url } = await api<{ url: string }>(`/files/${uploaded.id}/url`)
    form.avatarUrl = url
    delete (errors as any).avatarUrl
    toast.success('Photo uploaded')
  } catch (err: any) {
    toast.error(err?.data?.message ?? 'Upload failed')
  } finally {
    uploadingAvatar.value = false
  }
}

// ── Form validation ────────────────────────────────────────────────────────────
function validate(): boolean {
  Object.keys(errors).forEach(k => delete (errors as any)[k])

  if (!form.fullName || form.fullName.trim().length < 2)
    errors.fullName = 'Name must be at least 2 characters'

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Must be a valid email address'

  return Object.keys(errors).length === 0
}

// ── Save ───────────────────────────────────────────────────────────────────────
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    await updateProfile({
      fullName:  form.fullName.trim(),
      avatarUrl: form.avatarUrl || undefined,
    })
    pristine.value = true
    toast.success('Profile updated')
  } catch (err: any) {
    const msg = err?.data?.message
    toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to save profile'))
  } finally {
    saving.value = false
  }
}

// ── Deactivate ─────────────────────────────────────────────────────────────────
async function confirmDeactivate() {
  deactivating.value = true
  try {
    await deactivateAccount()
    toast.success('Account deactivated')
  } catch {
    toast.error('Failed to deactivate account')
    deactivating.value = false
    showDeactivateDialog.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-10 space-y-8">
    <div>
      <h1 class="text-2xl font-bold">My profile</h1>
      <p class="text-sm text-muted-foreground mt-1">Manage your personal information and account settings.</p>
    </div>

    <!-- Form card -->
    <div class="bg-card border border-border rounded-2xl p-6 listeo-shadow space-y-5">

      <!-- Avatar upload -->
      <div class="flex items-center gap-4 pb-5 border-b border-border">
        <button
          type="button"
          @click="triggerAvatarUpload"
          :disabled="uploadingAvatar"
          class="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 group hover:ring-2 hover:ring-primary/40 transition-all disabled:cursor-not-allowed"
        >
          <img
            v-if="form.avatarUrl"
            :src="form.avatarUrl"
            class="w-full h-full object-cover"
            alt="Profile photo"
            @error="form.avatarUrl = ''"
          />
          <span v-else class="text-lg font-bold text-muted-foreground select-none">{{ initials }}</span>
          <div :class="[
            'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
            uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ]">
            <Loader2 v-if="uploadingAvatar" class="w-5 h-5 text-white animate-spin" />
            <Camera v-else class="w-5 h-5 text-white" />
          </div>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden"
          @change="handleAvatarFile"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold truncate">{{ user?.fullName }}</p>
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <BadgeCheck class="w-3 h-3" />{{ roleLabel }}
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">{{ user?.email }}</p>
          <p class="text-xs text-muted-foreground mt-1">Click photo to upload · PNG, JPG, WebP · max 5 MB</p>
        </div>
      </div>

      <!-- Full name -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Full name <span class="text-destructive">*</span></label>
        <Input v-model="form.fullName" placeholder="Your full name" maxlength="200" />
        <p v-if="errors.fullName" class="text-xs text-destructive">{{ errors.fullName }}</p>
      </div>

      <!-- Email (read-only — shown for reference) -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium">
          Email
          <span class="ml-1 text-xs font-normal text-muted-foreground">— read only</span>
        </label>
        <Input :value="form.email" disabled class="opacity-60 cursor-not-allowed" />
      </div>

      <Button
        class="w-full h-11 font-semibold"
        @click="save"
        :disabled="saving || pristine"
      >
        <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
        Save changes
      </Button>
    </div>

    <!-- Danger zone -->
    <div class="border border-destructive/30 rounded-2xl p-6 space-y-3">
      <h2 class="font-semibold text-destructive">Danger zone</h2>
      <p class="text-sm text-muted-foreground">
        Deactivating your account will permanently remove your access.
        All your bookings and data will become unavailable.
        This action cannot be undone.
      </p>
      <Button variant="destructive" @click="showDeactivateDialog = true">
        Deactivate account
      </Button>
    </div>

    <!-- Deactivate confirmation dialog -->
    <Dialog v-model:open="showDeactivateDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate your account?</DialogTitle>
          <DialogDescription>
            This will permanently deactivate your account. You will lose access to all your bookings and data.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="ghost" @click="showDeactivateDialog = false">Cancel</Button>
          <Button
            variant="destructive"
            @click="confirmDeactivate"
            :disabled="deactivating"
          >
            <Loader2 v-if="deactivating" class="w-4 h-4 mr-2 animate-spin" />
            Yes, deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
