<script setup lang="ts">
import { Loader2, CalendarDays } from 'lucide-vue-next';

definePageMeta({ layout: false });

const { login, isAuthenticated, user } = useAuth();
const route = useRoute();

if (isAuthenticated.value)
    navigateTo(
        user.value?.role === 'business_owner' ? '/business' : '/services',
    );

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
    error.value = '';
    loading.value = true;
    try {
        await login(email.value, password.value);
        const redirect =
            (route.query.redirect as string) ||
            (user.value?.role === 'business_owner' ? '/business' : '/services');
        await navigateTo(redirect);
    } catch (e: any) {
        error.value = e?.data?.message || 'Invalid email or password.';
    } finally {
        loading.value = false;
    }
}

const config = useRuntimeConfig();
const googleAuthUrl = `${config.public.apiBase}/auth/google`;
</script>

<template>
    <div class="min-h-screen flex" style="background: hsl(210, 20%, 97%)">
        <!-- Left decorative panel (hidden on mobile) -->
        <div
            class="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden"
            style="
                background: linear-gradient(
                    145deg,
                    hsl(224, 45%, 18%) 0%,
                    hsl(189, 68%, 28%) 100%
                );
            "
        >
            <div
                class="absolute inset-0 opacity-10"
                style="
                    background-image: radial-gradient(
                        circle at 30% 60%,
                        white 1px,
                        transparent 1px
                    );
                    background-size: 50px 50px;
                "
            ></div>
            <div class="relative z-10 max-w-sm text-center">
                <div
                    class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6"
                >
                    <CalendarDays class="w-8 h-8 text-white" />
                </div>
                <h2 class="text-3xl font-bold mb-3 text-white">Welcome back</h2>
                <p class="text-white/65 text-base leading-relaxed">
                    Sign in to manage your bookings, view upcoming appointments,
                    and discover new services.
                </p>
            </div>
        </div>

        <!-- Right form panel -->
        <div class="flex-1 flex items-center justify-center px-4 py-12">
            <div class="w-full max-w-sm">
                <!-- Mobile logo -->
                <NuxtLink
                    to="/"
                    class="flex items-center justify-center gap-2 mb-8 lg:hidden"
                >
                    <div
                        class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center"
                    >
                        <CalendarDays class="w-5 h-5 text-white" />
                    </div>
                    <span class="font-bold text-lg text-foreground"
                        >Listeo<span class="text-primary">Book</span></span
                    >
                </NuxtLink>

                <div
                    class="bg-card rounded-2xl border border-border p-8 listeo-shadow"
                >
                    <div class="mb-6">
                        <h1 class="text-2xl font-bold text-foreground">
                            Sign in
                        </h1>
                        <p class="text-sm text-muted-foreground mt-1">
                            Enter your credentials to continue
                        </p>
                    </div>

                    <form @submit.prevent="handleSubmit" class="space-y-4">
                        <Alert v-if="error" variant="destructive" class="py-2">
                            <AlertDescription>{{ error }}</AlertDescription>
                        </Alert>

                        <div class="space-y-1.5">
                            <label
                                class="text-sm font-medium text-foreground"
                                for="email"
                                >Email address</label
                            >
                            <Input
                                id="email"
                                v-model="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                autocomplete="email"
                                class="h-11"
                            />
                        </div>

                        <div class="space-y-1.5">
                            <label
                                class="text-sm font-medium text-foreground"
                                for="password"
                                >Password</label
                            >
                            <Input
                                id="password"
                                v-model="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                autocomplete="current-password"
                                class="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            class="w-full h-11 font-semibold"
                            :disabled="loading"
                        >
                            <Loader2
                                v-if="loading"
                                class="w-4 h-4 mr-2 animate-spin"
                            />
                            Sign In
                        </Button>
                    </form>

                    <div class="flex justify-center my-5">
                        <span class="text-xs text-muted-foreground"
                            >or continue with</span
                        >
                    </div>

                    <a :href="googleAuthUrl" class="w-full block">
                        <Button
                            variant="outline"
                            class="w-full h-11 gap-2 font-medium"
                            type="button"
                        >
                            <svg
                                class="w-4 h-4"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </a>

                    <p class="text-center text-sm text-muted-foreground mt-5">
                        Don't have an account?
                        <NuxtLink
                            to="/auth/register"
                            class="text-primary font-semibold hover:underline"
                            >Sign up</NuxtLink
                        >
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
