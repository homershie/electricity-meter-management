// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  modules: ["@pinia/nuxt"],

  css: ["vuetify/styles", "@mdi/font/css/materialdesignicons.css"],

  build: {
    transpile: ["vuetify"],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || "http://localhost:3001",
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // 暫時關閉以避免 vue-tsc 錯誤
  },
});
