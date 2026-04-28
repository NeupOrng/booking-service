<script setup lang="ts">
import { Menu, X, CalendarDays } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated, user, logout } = useAuth()
const mobileOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-50 w-full shadow-md" style="background: hsl(224, 38%, 14%);">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
        <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <CalendarDays class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold text-lg text-white tracking-wide">Listeo<span class="text-primary">Book</span></span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
        <NuxtLink
          to="/services"
          class="text-white/70 hover:text-white transition-colors"
          active-class="text-white"
        >
          Browse Services
        </NuxtLink>
      </nav>

      <!-- Desktop Auth -->
      <div class="hidden md:flex items-center gap-3">
        <template v-if="isAuthenticated">
          <NuxtLink
            to="/account/bookings"
            class="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            My Bookings
          </NuxtLink>
          <div class="flex items-center gap-3 pl-3 border-l border-white/20">
            <div class="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <span class="text-xs font-bold text-white">
                {{ user?.fullName?.charAt(0)?.toUpperCase() }}
              </span>
            </div>
            <span class="text-sm font-medium text-white">{{ user?.fullName }}</span>
            <button
              @click="logout"
              class="text-xs px-3 py-1.5 rounded-md border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            >
              Logout
            </button>
          </div>
        </template>
        <template v-else>
          <NuxtLink to="/auth/login">
            <button class="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </button>
          </NuxtLink>
          <NuxtLink to="/auth/register">
            <button class="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Get Started
            </button>
          </NuxtLink>
        </template>
      </div>

      <!-- Mobile toggle -->
      <button class="md:hidden text-white/80 hover:text-white" @click="mobileOpen = !mobileOpen">
        <X v-if="mobileOpen" class="w-6 h-6" />
        <Menu v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <div v-if="mobileOpen" class="md:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-3" style="background: hsl(224, 38%, 12%);">
      <NuxtLink to="/services" class="text-sm font-medium text-white/80 hover:text-white py-1" @click="mobileOpen = false">
        Browse Services
      </NuxtLink>
      <template v-if="isAuthenticated">
        <NuxtLink to="/account/bookings" class="text-sm font-medium text-white/80 hover:text-white py-1" @click="mobileOpen = false">
          My Bookings
        </NuxtLink>
        <button @click="logout; mobileOpen = false" class="text-sm text-left text-white/60 hover:text-white py-1">
          Logout ({{ user?.fullName }})
        </button>
      </template>
      <template v-else>
        <NuxtLink to="/auth/login" class="text-sm font-medium text-white/80 hover:text-white py-1" @click="mobileOpen = false">
          Sign In
        </NuxtLink>
        <NuxtLink to="/auth/register" @click="mobileOpen = false">
          <button class="w-full text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg mt-1">
            Get Started
          </button>
        </NuxtLink>
      </template>
    </div>
  </header>
</template>
