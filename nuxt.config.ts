// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },  // 禁用以解決 Windows 路徑 bug

  srcDir: 'app/',  // 指定源代碼目錄

  devServer: {
    port: 3000,
  },

  modules: ["@pinia/nuxt"],

  css: [
    "vuetify/styles",
    "@mdi/font/css/materialdesignicons.css"
  ],

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    ssr: {
      noExternal: ["vuetify"],
    },
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
