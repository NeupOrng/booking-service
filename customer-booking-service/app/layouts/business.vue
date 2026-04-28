<script setup lang="ts">
import {
  LayoutDashboard, Briefcase, CalendarDays, Clock, User, Menu, X, LogOut,
} from 'lucide-vue-next'

const { user, logout } = useAuth()
const route = useRoute()
const sidebarOpen = ref(false)

const navLinks = [
  { label: 'Dashboard',    path: '/business',              icon: LayoutDashboard },
  { label: 'My Services',  path: '/business/services',     icon: Briefcase },
  { label: 'Bookings',     path: '/business/bookings',     icon: CalendarDays },
  { label: 'Availability', path: '/business/services',     icon: Clock },
  { label: 'Profile',      path: '/business/profile',      icon: User },
]

function isActive(path: string) {
  if (path === '/business') return route.path === '/business'
  return route.path.startsWith(path)
}

watch(() => route.path, () => { sidebarOpen.value = false })
</script>

<template>
  <div class="min-h-screen flex bg-background font-sans antialiased">

    <!-- Sidebar overlay (mobile) -->
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
        'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300',
        'md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
      style="background: hsl(224, 38%, 14%);"
    >
      <!-- Logo -->
      <div class="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 shrink-0">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <CalendarDays class="w-4 h-4 text-white" />
        </div>
        <span class="font-bold text-white tracking-wide">Listeo<span class="text-primary">Book</span></span>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(link.path)
              ? 'bg-primary/20 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/8'
          ]"
        >
          <component :is="link.icon" class="w-4 h-4 shrink-0" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- User footer -->
      <div class="px-4 py-4 border-t border-white/10 shrink-0">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
            <span class="text-xs font-bold text-white">{{ user?.fullName?.charAt(0)?.toUpperCase() }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ user?.fullName }}</p>
            <p class="text-xs text-white/40 truncate">{{ user?.email }}</p>
          </div>
        </div>
        <button
          @click="logout"
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut class="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-16 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
        <button
          class="md:hidden text-muted-foreground hover:text-foreground"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Menu v-if="!sidebarOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
        <div class="hidden md:block" />
        <div class="flex items-center gap-3 text-sm text-muted-foreground">
          <span class="hidden sm:inline">{{ user?.fullName }}</span>
          <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.hover\:bg-white\/8:hover { background-color: rgba(255,255,255,0.08); }
</style>
