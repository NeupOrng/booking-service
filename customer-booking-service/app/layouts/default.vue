<template>
  <div class="min-h-screen flex flex-col bg-background font-sans antialiased">
    <Navbar />
    <main class="flex-1">
      <slot />
    </main>

    <!-- Listeo-style footer -->
    <footer class="mt-16" style="background: hsl(224, 38%, 14%);">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span class="font-bold text-white">Listeo<span class="text-primary">Book</span></span>
            </div>
            <p class="text-sm text-white/50 leading-relaxed max-w-xs">
              The easiest way to discover and book local wellness, beauty, and fitness services.
            </p>
          </div>

          <!-- Quick links -->
          <div>
            <h4 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul class="space-y-2">
              <li><NuxtLink to="/services" class="text-sm text-white/50 hover:text-white transition-colors">Browse Services</NuxtLink></li>
              <li><NuxtLink to="/account/bookings" class="text-sm text-white/50 hover:text-white transition-colors">My Bookings</NuxtLink></li>
              <li><NuxtLink to="/auth/login" class="text-sm text-white/50 hover:text-white transition-colors">Sign In</NuxtLink></li>
            </ul>
          </div>

          <!-- Categories -->
          <div>
            <h4 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Categories</h4>
            <ul class="space-y-2">
              <li><NuxtLink to="/services?category=wellness" class="text-sm text-white/50 hover:text-white transition-colors">Wellness</NuxtLink></li>
              <li><NuxtLink to="/services?category=beauty" class="text-sm text-white/50 hover:text-white transition-colors">Beauty</NuxtLink></li>
              <li><NuxtLink to="/services?category=fitness" class="text-sm text-white/50 hover:text-white transition-colors">Fitness</NuxtLink></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-white/10 pt-6 text-center text-xs text-white/30">
          &copy; {{ new Date().getFullYear() }} ListeoBook. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>
