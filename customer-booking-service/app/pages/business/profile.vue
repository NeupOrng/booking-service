<script setup lang="ts">
import { Loader2, Camera } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' });

const { fetchMyBusiness, updateBusiness } = useBusinessOwner();
const { deactivateAccount } = useAuth();

const { $api } = useNuxtApp();
type Api = <T>(url: string, opts?: Record<string, unknown>) => Promise<T>;
const api = $api as unknown as Api;

const biz = ref<any>(null);
const fetching = ref(true);
const saving = ref(false);
const deactivating = ref(false);
const showDeactivateDialog = ref(false);
const uploadingLogo = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

function triggerLogoUpload() {
    fileInputRef.value?.click();
}

async function handleLogoFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5 MB');
        return;
    }

    uploadingLogo.value = true;
    try {
        const fd = new FormData();
        fd.append('file', file);

        const uploaded = await api<{ id: string }>('/files/upload', {
            method: 'POST',
            query: { subfolder: 'logos' },
            body: fd,
        });

        const { url } = await api<{ url: string }>(`/files/${uploaded.id}/url`);
        form.logoUrl = url;
        delete (errors as any).logoUrl;
        toast.success('Logo uploaded');
    } catch (err: any) {
        toast.error(err?.data?.message ?? 'Upload failed');
    } finally {
        uploadingLogo.value = false;
    }
}

const form = reactive({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    logoUrl: '',
});

const errors = reactive<Record<string, string>>({});

// Track initial values to detect pristine state
const pristine = ref(true);
watch(
    form,
    () => {
        pristine.value = false;
    },
    { deep: true },
);

onMounted(async () => {
    try {
        biz.value = await fetchMyBusiness();
        form.name = biz.value.name ?? '';
        form.slug = biz.value.slug ?? '';
        form.description = biz.value.description ?? '';
        form.address = biz.value.address ?? '';
        form.phone = biz.value.phone ?? '';
        form.logoUrl = biz.value.logoUrl ?? '';
        // Reset pristine after pre-fill
        await nextTick();
        pristine.value = true;
    } catch {
        toast.error('Failed to load business profile');
    } finally {
        fetching.value = false;
    }
});

function validate(): boolean {
    Object.keys(errors).forEach((k) => delete (errors as any)[k]);

    if (!form.name || form.name.length < 2 || form.name.length > 200)
        errors.name = 'Name must be 2–200 characters';

    if (
        !form.slug ||
        !/^[a-z0-9-]+$/.test(form.slug) ||
        form.slug.length < 2 ||
        form.slug.length > 200
    )
        errors.slug =
            'Slug must be 2–200 lowercase letters, numbers or hyphens';

    if (form.phone && (form.phone.length < 10 || form.phone.length > 30))
        errors.phone = 'Phone must be 10–30 characters';

    return Object.keys(errors).length === 0;
}

async function save() {
    if (!validate() || !biz.value) return;
    saving.value = true;
    try {
        await updateBusiness(biz.value.id, {
            name: form.name,
            slug: form.slug,
            description: form.description || undefined,
            address: form.address || undefined,
            phone: form.phone || undefined,
            logoUrl: form.logoUrl || undefined,
        } as any);
        pristine.value = true;
        toast.success('Profile updated');
    } catch (e: any) {
        const status = e?.response?.status ?? e?.statusCode;
        const msg = e?.data?.message;
        if (status === 409) {
            errors.slug = 'This slug is already taken';
        } else {
            toast.error(
                Array.isArray(msg)
                    ? msg.join(', ')
                    : (msg ?? 'Failed to save profile'),
            );
        }
    } finally {
        saving.value = false;
    }
}

async function confirmDeactivate() {
    deactivating.value = true;
    try {
        await deactivateAccount();
        toast.success('Account deactivated');
        await navigateTo('/auth/login');
    } catch {
        toast.error('Failed to deactivate account');
        deactivating.value = false;
        showDeactivateDialog.value = false;
    }
}
</script>

<template>
    <div class="max-w-2xl mx-auto space-y-8">
        <h1 class="text-2xl font-bold">Business profile</h1>

        <!-- Loading -->
        <div v-if="fetching" class="space-y-4">
            <Skeleton v-for="i in 6" :key="i" class="h-11 w-full rounded-xl" />
        </div>

        <!-- Form -->
        <div
            v-else
            class="bg-card border border-border rounded-2xl p-6 listeo-shadow space-y-5"
        >
            <!-- Logo upload -->
            <div
                class="flex flex-col items-center gap-4 pb-5 border-b border-border"
            >
                <button
                    type="button"
                    @click="triggerLogoUpload"
                    :disabled="uploadingLogo"
                    class="relative w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 group hover:ring-2 hover:ring-primary/40 transition-all disabled:cursor-not-allowed"
                >
                    <img
                        v-if="form.logoUrl"
                        :src="form.logoUrl"
                        class="w-full h-full object-cover"
                        alt="Business logo"
                        @error="form.logoUrl = ''"
                    />
                    <span
                        v-else
                        class="text-xl font-bold text-muted-foreground select-none"
                    >
                        {{ form.name?.charAt(0)?.toUpperCase() || '?' }}
                    </span>
                    <div
                        :class="[
                            'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
                            uploadingLogo
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100',
                        ]"
                    >
                        <Loader2
                            v-if="uploadingLogo"
                            class="w-5 h-5 text-white animate-spin"
                        />
                        <Camera v-else class="w-5 h-5 text-white" />
                    </div>
                </button>
                <div class="flex flex-col items-center">
                    <p class="text-sm font-medium">Business logo</p>
                    <p class="text-xs text-muted-foreground mt-0.5">
                        Click to upload · PNG, JPG, WebP · max 5 MB
                    </p>
                </div>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    class="hidden"
                    @change="handleLogoFile"
                />
            </div>

            <div class="space-y-1.5">
                <label class="text-sm font-medium"
                    >Business name
                    <span class="text-destructive">*</span></label
                >
                <Input
                    v-model="form.name"
                    placeholder="My Business"
                    maxlength="200"
                />
                <p v-if="errors.name" class="text-xs text-destructive">
                    {{ errors.name }}
                </p>
            </div>

            <div class="space-y-1.5">
                <label class="text-sm font-medium">
                    Slug <span class="text-destructive">*</span>
                    <span class="ml-1 text-xs font-normal text-muted-foreground"
                        >— URL-safe, lowercase</span
                    >
                </label>
                <Input
                    v-model="form.slug"
                    placeholder="my-business"
                    maxlength="200"
                />
                <p v-if="errors.slug" class="text-xs text-destructive">
                    {{ errors.slug }}
                </p>
            </div>

            <div class="space-y-1.5 flex flex-col">
                <label class="text-sm font-medium">Description</label>
                <Textarea
                    :value="form.description"
                    @input="form.description = $event.target.value"
                    class="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell customers about your business…"
                    rows="5"
                />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Address</label>
                    <Input v-model="form.address" placeholder="123 Main St" />
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-medium">Phone</label>
                    <Input v-model="form.phone" placeholder="+1 555 000 0000" />
                    <p v-if="errors.phone" class="text-xs text-destructive">
                        {{ errors.phone }}
                    </p>
                </div>
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
                Deactivating your account will make all your services
                unavailable to customers. This action cannot be undone.
            </p>
            <Button variant="destructive" @click="showDeactivateDialog = true">
                Deactivate account
            </Button>
        </div>

        <!-- Deactivate confirmation dialog -->
        <Dialog v-model:open="showDeactivateDialog">
            <DialogContent class="max-w-md">
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This will deactivate your account. All your services
                        will become unavailable to customers. This action cannot
                        be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        @click="showDeactivateDialog = false"
                        >Cancel</Button
                    >
                    <Button
                        variant="destructive"
                        @click="confirmDeactivate"
                        :disabled="deactivating"
                    >
                        <Loader2
                            v-if="deactivating"
                            class="w-4 h-4 mr-2 animate-spin"
                        />
                        Yes, deactivate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
