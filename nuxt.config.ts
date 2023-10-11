// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],
  devtools: {enabled: true},
  modules: [
    ['@nuxtjs/algolia', {
      apiKey: '6be0576ff61c053d5f9a3225e2a90f76',
      applicationId: 'latency',
      instantSearch: {
        theme: 'satellite'
      }
    }],
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    }
  },
  typescript: {
    shim: false,
  },
})
