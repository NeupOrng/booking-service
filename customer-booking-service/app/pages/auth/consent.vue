 <script setup lang="ts">
import { Loader2, ShieldCheck, ExternalLink } from 'lucide-vue-next';

definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig();
const baseURL = config.public.apiBase as string;

const consentChallenge = route.query.consent_challenge as string;

if (!consentChallenge) {
    await navigateTo('/');
}

const SCOPE_LABELS: Record<string, { label: string; description: string }> = {
    openid:         { label: 'Identity',       description: 'Verify who you are' },
    profile:        { label: 'Profile',        description: 'Access your name and avatar' },
    email:          { label: 'Email address',  description: 'Read your email address' },
    offline_access: { label: 'Offline access', description: 'Stay signed in when you close the browser' },
};

interface ConsentInfo {
    consent_challenge: string;
    requested_scope: string[];
    client: {
        client_id: string;
        client_name: string | null;
        logo_uri: string | null;
        policy_uri: string | null;
        tos_uri: string | null;
    };
}

const info = ref<ConsentInfo | null>(null);
const loading = ref(false);
const submitting = ref(false);
const error = ref('');

info.value = await $fetch<ConsentInfo>(`/oauth/consent/info?consent_challenge=${consentChallenge}`, {
    baseURL,
}).catch(() => null);

if (!info.value) {
    error.value = 'This consent request is invalid or has expired.';
}

async function allow() {
    submitting.value = true;
    error.value = '';
    try {
        const { redirect_to } = await $fetch<{ redirect_to: string }>('/oauth/consent', {
            method: 'POST',
            baseURL,
            credentials: 'include',
            body: {
                consent_challenge: consentChallenge,
                grant_scopes: info.value!.requested_scope,
                remember: true,
                remember_for: 3600,
            },
        });
        window.location.href = redirect_to;
    } catch (e: any) {
        error.value = e?.data?.message || 'Something went wrong. Please try again.';
        submitting.value = false;
    }
}

async function deny() {
    await navigateTo('/');
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: hsl(210, 20%, 97%)">
        <div class="w-full max-w-md">
            <div class="bg-card rounded-2xl border border-border p-8 listeo-shadow">

                <!-- Error state -->
                <div v-if="error && !info" class="text-center py-6">
                    <p class="text-destructive text-sm">{{ error }}</p>
                    <NuxtLink to="/" class="text-primary text-sm underline mt-4 block">Go home</NuxtLink>
                </div>

                <template v-else-if="info">
                    <!-- Client header -->
                    <div class="flex flex-col items-center mb-6">
                        <img
                            v-if="info.client.logo_uri"
                            :src="info.client.logo_uri"
                            :alt="info.client.client_name ?? 'App'"
                            class="w-14 h-14 rounded-xl object-contain mb-3 border border-border p-1"
                        />
                        <div v-else class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                            <ShieldCheck class="w-7 h-7 text-primary" />
                        </div>
                        <h1 class="text-xl font-bold text-foreground text-center">
                            {{ info.client.client_name ?? info.client.client_id }} wants access
                        </h1>
                        <p class="text-sm text-muted-foreground text-center mt-1">
                            Review the permissions this app is requesting
                        </p>
                    </div>

                    <!-- Requested scopes -->
                    <div class="rounded-xl border border-border bg-muted/30 divide-y divide-border mb-6">
                        <div
                            v-for="scope in info.requested_scope"
                            :key="scope"
                            class="flex items-start gap-3 px-4 py-3"
                        >
                            <ShieldCheck class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                                <p class="text-sm font-medium text-foreground">
                                    {{ SCOPE_LABELS[scope]?.label ?? scope }}
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    {{ SCOPE_LABELS[scope]?.description ?? `Grant access to ${scope}` }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Error -->
                    <Alert v-if="error" variant="destructive" class="mb-4 py-2">
                        <AlertDescription>{{ error }}</AlertDescription>
                    </Alert>

                    <!-- Actions -->
                    <div class="flex flex-col gap-2">
                        <Button class="w-full h-11 font-semibold" :disabled="submitting" @click="allow">
                            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                            Allow access
                        </Button>
                        <Button variant="outline" class="w-full h-11" :disabled="submitting" @click="deny">
                            Deny
                        </Button>
                    </div>

                    <!-- Legal links -->
                    <div class="flex justify-center gap-4 mt-5">
                        <a
                            v-if="info.client.policy_uri"
                            :href="info.client.policy_uri"
                            target="_blank"
                            class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            Privacy Policy <ExternalLink class="w-3 h-3" />
                        </a>
                        <a
                            v-if="info.client.tos_uri"
                            :href="info.client.tos_uri"
                            target="_blank"
                            class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            Terms of Service <ExternalLink class="w-3 h-3" />
                        </a>
                    </div>
                </template>

                <!-- Loading -->
                <div v-else class="flex justify-center py-12">
                    <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
                </div>

            </div>
        </div>
    </div>
</template>
