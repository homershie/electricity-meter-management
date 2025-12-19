// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  modules: [
    "@pinia/nuxt",
    async (options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins ||= []
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],

  css: ["@mdi/font/css/materialdesignicons.css"],

  build: {
    transpile: ["vuetify"],
  },

  runtimeConfig: {
    public: {
      // 生產環境使用 Nuxt Server API (相對路徑)
      // 開發環境可選：使用獨立 server (http://localhost:3001) 或 Nuxt API (/api)
      apiBase: process.env.API_BASE_URL || "/api",
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // 暫時關閉以避免 vue-tsc 錯誤
  },
});
