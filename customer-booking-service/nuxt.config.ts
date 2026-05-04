// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'ListeoBook',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vueuse/core',
        '@radix-icons/vue',
        'vue-sonner',
      ]
    }
  },
  css: ['~/assets/css/tailwind.css','~/assets/css/listeo.css'],
  components: {
    dirs: [
      // Register all UI components without path prefix so <DatePicker>, <Button>
      // etc. resolve correctly even for manually-added component directories.
      { path: '~/components/ui', pathPrefix: false },
      '~/components',
    ],
  },
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@pinia/nuxt'
  ],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  }
})
