<template>
  <v-app>
    <img
      src="/logo.svg"
      alt="Blutech"
      class="logo cursor-pointer"
      @click="toggleTheme"
    />

    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useTheme } from "vuetify";
import { loadState, saveState } from "~/utils/localStorage";

// 全域設定
const theme = useTheme();

// 從 localStorage 讀取保存的主題設定
const savedTheme = loadState<string>("theme", "light");
if (savedTheme) {
  theme.global.name.value = savedTheme;
}

// 切換主題並保存到 localStorage
const toggleTheme = () => {
  const newTheme = theme.global.name.value === "light" ? "dark" : "light";
  theme.global.name.value = newTheme;
  saveState("theme", newTheme);
};
</script>

<style>
:root {
  font-family: "Helvetica Neue", "Verdana", "Microsoft YaHei", "PingFang SC",
    Arial, sans-serif;
}

.v-application {
  font-family: "Helvetica Neue", "Verdana", "Microsoft YaHei", "PingFang SC",
    Arial, sans-serif !important;
}

.logo {
  margin: 40px auto;
  height: 120px;
  width: auto;
  transition: filter 0.3s ease;
}

/* 深色模式下將 LOGO 改為白色 */
.v-theme--dark .logo {
  filter: brightness(0) invert(1);
}
</style>
