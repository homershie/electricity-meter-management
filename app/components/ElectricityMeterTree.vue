<template>
  <v-card flat>
    <v-card-title class="d-flex justify-space-between align-center bg-info">
      <p class="text-body-1 text-primary">
        已選取 {{ store.selectedIds.length }} 個電表
      </p>
      <div>
        <v-btn color="primary" :disabled="true" variant="text" :ripple="false">
          <v-icon start>mdi-pencil</v-icon>
          編輯電表
        </v-btn>
        <v-btn
          color="primary"
          :disabled="store.selectedIds.length === 0"
          @click="openMoveDialog"
          variant="text"
          :ripple="false"
        >
          <v-icon start>mdi-file-move</v-icon>
          移動階層
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- 同階層選取提示 -->
      <v-alert
        v-if="store.selectedIds.length > 0 && !store.isSelectionValid"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        選取的節點必須在同一階層
      </v-alert>

      <!-- 樹狀列表 -->
      <v-treeview
        v-model:opened="openedNodes"
        :items="store.treeNodes"
        item-value="id"
        item-title="name"
        item-children="children"
        open-on-click
        density="comfortable"
      >
        <!-- 自訂節點項目 slot -->
        <template #prepend="{ item }">
          <v-icon
            :icon="getNodeIcon(item)"
            :color="isNodeSelected(item.id) ? 'primary' : undefined"
          />
        </template>

        <template #title="{ item }">
          <div
            class="tree-node-label"
            :class="{ selected: isNodeSelected(item.id) }"
            @click.stop="handleNodeClick(item)"
          >
            {{ item.name }}
            <v-chip
              v-if="isNodeSelected(item.id)"
              size="x-small"
              color="primary"
              class="ml-2"
            >
              已選
            </v-chip>
          </div>
        </template>
      </v-treeview>
    </v-card-text>

    <!-- 移動對話框 -->
    <MoveDialog
      v-model="showMoveDialog"
      :selected-ids="store.selectedIds"
      :nodes="store.nodes"
      @move="handleMove"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useNodesStore } from "~/stores/nodesStore";
import type { TreeNode } from "~/types/node";

const store = useNodesStore();
const showMoveDialog = ref(false);

// v-treeview 開啟的節點
const openedNodes = computed({
  get: () => {
    // 將 expandedIds 轉換為節點物件
    return store.expandedIds;
  },
  set: (ids: number[]) => {
    store.setExpanded(ids);
  },
});

// 取得節點圖示
function getNodeIcon(item: TreeNode): string {
  if (item.children.length > 0) {
    return "mdi-electric-switch";
  }
  return "mdi-flash";
}

// 檢查節點是否被選取
function isNodeSelected(id: number): boolean {
  return store.selectedIds.includes(id);
}

// 處理節點點擊
function handleNodeClick(item: TreeNode) {
  store.toggleSelected(item.id);
}

// 開啟移動對話框
function openMoveDialog() {
  showMoveDialog.value = true;
}

// 處理移動操作
async function handleMove(targetParentId: number | null) {
  try {
    await store.moveNodes(store.selectedIds, targetParentId);
    showMoveDialog.value = false;
  } catch (error) {
    console.error("Move failed:", error);
  }
}
</script>

<style scoped>
.tree-node-label {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.tree-node-label:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.tree-node-label.selected {
  background-color: rgba(25, 118, 210, 0.12);
  font-weight: 500;
}
</style>
