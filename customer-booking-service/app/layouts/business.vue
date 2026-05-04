<script setup lang="ts">
import {
    LayoutDashboard,
    Calendar,
    ListChecks,
    User,
    UserCircle,
    Menu,
    X,
    LogOut,
} from 'lucide-vue-next';

const { user, logout } = useAuth();
const route = useRoute();
const sidebarOpen = ref(false);

const navLinks = [
    { label: 'Dashboard', path: '/business', icon: LayoutDashboard },
    { label: 'Bookings', path: '/business/bookings', icon: Calendar },
    { label: 'My Services', path: '/business/services', icon: ListChecks },
    { label: 'Profile', path: '/business/profile', icon: User },
    { label: 'Account', path: '/business/account',  icon: UserCircle },
];

function isActive(path: string) {
    if (path === '/business') return route.path === '/business';
    return route.path.startsWith(path);
}

watch(
    () => route.path,
    () => {
        sidebarOpen.value = false;
    },
);

async function handleLogout() {
    await logout();
    navigateTo('/auth/login');
}
</script>

<template>
    <div
        class="h-screen flex overflow-hidden bg-background font-sans antialiased"
    >
        <!-- Mobile overlay -->
        <Transition name="fade">
            <div
                v-if="sidebarOpen"
                class="fixed inset-0 z-30 bg-black/50 md:hidden"
                @click="sidebarOpen = false"
            />
        </Transition>

        <!-- Sidebar -->
        <aside
            :class="[
                'fixed inset-y-0 left-0 z-40 w-56 flex flex-col transition-transform duration-300 flex-shrink-0',
                'md:relative md:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            ]"
            style="background: hsl(224, 38%, 14%)"
        >
            <!-- Logo -->
            <div
                class="h-14 flex items-center gap-2.5 px-5 border-b border-white/10 shrink-0"
            >
                <div
                    class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"
                >
                    <Calendar class="w-4 h-4 text-white" />
                </div>
                <span class="font-bold text-white text-sm tracking-wide"
                    >Listeo<span class="text-primary">Book</span></span
                >
            </div>

            <!-- Nav -->
            <nav class="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
                <NuxtLink
                    v-for="link in navLinks"
                    :key="link.path"
                    :to="link.path"
                    :class="[
                        'flex items-center gap-2.5 py-2.5 px-5 text-sm font-medium transition-colors rounded-none border-l-2',
                        isActive(link.path)
                            ? 'text-white bg-primary/20 border-primary'
                            : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent',
                    ]"
                >
                    <component :is="link.icon" class="w-4 h-4 shrink-0" />
                    {{ link.label }}
                </NuxtLink>
            </nav>

            <!-- Footer -->
            <div class="px-4 py-4 border-t border-white/10 shrink-0 space-y-3">
                <div class="flex items-center gap-2.5">
                    <div
                        class="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center shrink-0"
                    >
                        <img
                            v-if="user?.avatarUrl"
                            :src="user?.avatarUrl"
                            class="w-full h-full object-cover"
                            alt="Business logo"
                            @error="user.avatarUrl = ''"
                        />
                        <span
                            v-else
                            class="text-xl font-bold text-muted-foreground select-none"
                        >
                            {{ user?.fullName?.charAt(0)?.toUpperCase() }}
                        </span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-medium text-white truncate">
                            {{ user?.fullName }}
                        </p>
                        <p class="text-[10px] text-white/40 truncate">
                            {{ user?.email }}
                        </p>
                    </div>
                </div>
                <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
                >
                    <LogOut class="w-3.5 h-3.5" />
                    Sign out
                </button>
            </div>
        </aside>

        <!-- Main -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <!-- Top bar -->
            <header
                class="h-14 flex items-center justify-between px-6 border-b border-border bg-card shrink-0"
            >
                <button
                    class="md:hidden text-muted-foreground hover:text-foreground"
                    @click="sidebarOpen = !sidebarOpen"
                >
                    <X v-if="sidebarOpen" class="w-5 h-5" />
                    <Menu v-else class="w-5 h-5" />
                </button>
                <div class="hidden md:block" />
                <div class="flex items-center gap-3">
                    <span
                        class="hidden sm:block text-sm text-muted-foreground"
                        >{{ user?.fullName }}</span
                    >
                    <div
                        class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold"
                    >
                        {{ user?.fullName?.charAt(0)?.toUpperCase() }}
                    </div>
                </div>
            </header>

            <!-- Page content -->
            <main class="flex-1 overflow-y-auto p-6">
                <slot />
            </main>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
.hover\:bg-white\/8:hover {
    background-color: rgba(255, 255, 255, 0.08);
}
</style>
