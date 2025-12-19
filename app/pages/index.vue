<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          電表階層管理系統
        </h1>

        <!-- Loading 狀態 -->
        <v-progress-linear
          v-if="store.loading"
          indeterminate
          color="primary"
          class="mb-4"
        />

        <!-- 錯誤訊息 -->
        <v-alert
          v-if="store.error"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="store.error = null"
        >
          {{ store.error }}
        </v-alert>

        <!-- 主要內容 -->
        <ElectricityMeterTree v-if="!store.loading && store.nodes.length > 0" />

        <!-- 空狀態 -->
        <v-card v-else-if="!store.loading">
          <v-card-text class="text-center py-12">
            <v-icon size="64" color="grey">mdi-electric-switch-closed</v-icon>
            <p class="text-h6 mt-4">尚無電表資料</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useNodesStore } from "~/stores/nodesStore";

const store = useNodesStore();

onMounted(async () => {
  try {
    await store.loadNodes();
  } catch (error) {
    console.error("Failed to load nodes:", error);
  }
});
</script>
