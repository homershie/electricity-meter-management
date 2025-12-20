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

    <v-card-text class="pa-0">
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
        ref="treeViewRef"
        v-model:opened="openedNodes"
        :items="store.treeNodes"
        item-value="id"
        item-title="name"
        item-children="children"
        open-on-click
        density="comfortable"
        class="draggable-treeview"
      >
        <!-- 自訂節點項目 slot -->
        <template #prepend="{ item }">
          <div class="d-flex align-center">
            <v-icon
              class="drag-handle mr-1"
              icon="mdi-drag"
              size="small"
              style="cursor: grab; opacity: 0.5"
              @mousedown.stop
              @click.stop
            />
            <v-icon
              :icon="getNodeIcon(item)"
              :color="isNodeSelected(item.id) ? 'primary' : undefined"
            />
          </div>
        </template>

        <template #title="{ item }">
          <div
            class="tree-node-label"
            :class="{ selected: isNodeSelected(item.id) }"
            :data-node-id="item.id"
            @click.stop="handleNodeClick(item, $event)"
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
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useSortable } from "@vueuse/integrations/useSortable";
import { useNodesStore } from "~/stores/nodesStore";
import type { TreeNode } from "~/types/node";
import { findNode, getParentId, isDescendant } from "~/utils/treeHelpers";

const store = useNodesStore();
const showMoveDialog = ref(false);
const treeViewRef = ref<any>(null);

// 拖曳狀態追蹤
const dragState = ref<{
  mode: "parent" | "root" | null;
  targetNodeId: number | null;
  targetElement: HTMLElement | null;
}>({
  mode: null,
  targetNodeId: null,
  targetElement: null,
});

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
function handleNodeClick(item: TreeNode, event: MouseEvent) {
  // 檢查是否有修飾鍵（Alt、Ctrl 或 Mac 的 Command）
  const isMultiSelect = event.altKey || event.ctrlKey || event.metaKey;

  if (isMultiSelect) {
    // 多選模式：切換選取狀態
    store.toggleSelected(item.id);
  } else {
    // 單選模式：清空之前選取，只選取當前項目
    store.setSelected([item.id]);
  }
}

// 開啟移動對話框
function openMoveDialog() {
  showMoveDialog.value = true;
}

// 處理移動操作
async function handleMove(targetParentId: number | null, deviceIds: number[]) {
  try {
    await store.moveNodes(deviceIds, targetParentId);
    showMoveDialog.value = false;
  } catch (error) {
    console.error("Move failed:", error);
  }
}

// 初始化拖曳功能
onMounted(async () => {
  await nextTick();
  initializeDragAndDrop();
});

// 當樹狀資料更新時重新初始化拖曳
watch(
  () => store.treeNodes,
  async () => {
    await nextTick();
    initializeDragAndDrop();
  },
  { deep: true }
);

function initializeDragAndDrop() {
  if (!treeViewRef.value) return;

  const treeContainer = treeViewRef.value.$el;
  if (!treeContainer) return;

  // 找到所有 .v-treeview-group（這是每個節點的容器）
  const treeGroups = treeContainer.querySelectorAll(
    ".v-treeview-group"
  ) as NodeListOf<HTMLElement>;

  if (treeGroups.length === 0) {
    console.log("找不到 .v-treeview-group");
    return;
  }

  // 追蹤已處理的容器
  const processedContainers = new Set<HTMLElement>();

  // 1. 先處理根層級節點（直接在 .v-treeview 下的節點）
  const rootGroups = Array.from(treeGroups).filter((group) => {
    // 檢查這個 group 的父容器是否直接是 .v-treeview
    const parent = group.parentElement;
    return parent?.classList.contains("v-treeview");
  });

  if (rootGroups.length > 0) {
    // 為根層級節點建立拖曳功能
    setupSortableForContainer(treeContainer, rootGroups);
    processedContainers.add(treeContainer);
  }

  // 2. 處理所有階層的子節點
  treeGroups.forEach((group) => {
    // 找到這個群組中的子節點容器
    const itemsContainer = group.querySelector(
      ".v-list-group__items"
    ) as HTMLElement | null;

    if (itemsContainer && !processedContainers.has(itemsContainer)) {
      const childGroups = Array.from(
        itemsContainer.querySelectorAll(":scope > .v-treeview-group")
      ) as HTMLElement[];

      if (childGroups.length > 0) {
        setupSortableForContainer(itemsContainer, childGroups);
        processedContainers.add(itemsContainer);
      }
    }
  });
}

function setupSortableForContainer(
  container: HTMLElement,
  items: HTMLElement[]
) {
  // 建立節點 ID 陣列
  // 在 v-treeview 中，節點 ID 在 .v-list-item-title 或包含 data-node-id 的元素中
  const nodeIds = items
    .map((item) => {
      // 先嘗試找 data-node-id
      const titleEl = item.querySelector("[data-node-id]") as HTMLElement;
      if (titleEl) {
        const id = parseInt(titleEl.getAttribute("data-node-id") || "", 10);
        if (!isNaN(id)) return id;
      }

      // 如果找不到，嘗試從 v-list-item-title 中找
      const listItemTitle = item.querySelector(
        ".v-list-item-title"
      ) as HTMLElement;
      if (listItemTitle) {
        const titleEl = listItemTitle.querySelector("[data-node-id]");
        if (titleEl) {
          const id = parseInt(titleEl.getAttribute("data-node-id") || "", 10);
          if (!isNaN(id)) return id;
        }
      }

      return null;
    })
    .filter((id): id is number => id !== null);

  if (nodeIds.length === 0) {
    return;
  }

  // 建立 ref 包裝的陣列
  const nodeIdsRef = ref(nodeIds);

  // 使用 useSortable
  useSortable(container, nodeIdsRef, {
    handle: ".drag-handle",
    animation: 150,
    // 移除 sort: false 以允許同層級節點之間的拖曳互動
    // 透過 onMove 返回 false 來防止實際的 DOM 排序
    group: {
      name: "tree-nodes",
      pull: true,
      put: true,
    },
    onMove: (evt: any, originalEvent: Event) => {
      // 計算滑鼠位置並更新視覺回饋
      updateDragFeedback(evt, originalEvent);
      return false; // 禁止 SortableJS 自動移動 DOM（包括排序和移動）
    },
    onEnd: async (event) => {
      // 保存目標節點 ID（在清理前）
      const savedTargetNodeId = dragState.value.targetNodeId;
      const savedMode = dragState.value.mode;

      // 清理視覺回饋
      clearDragFeedback();

      const oldIndex = event.oldIndex;
      if (oldIndex === undefined) return;

      const draggedNodeId = nodeIds[oldIndex];
      if (draggedNodeId === undefined) return;

      // 只有在有明確的拖曳模式時才執行移動
      if (savedMode !== "parent" && savedMode !== "root") {
        return;
      }

      // 計算目標父節點 ID
      let targetParentId: number | null | undefined;

      if (savedMode === "root") {
        // 移動到 root 層
        targetParentId = null;
      } else {
        // 移動到其他節點下（建立父子關係）
        targetParentId = savedTargetNodeId;
      }

      if (targetParentId !== undefined) {
        await performMove(draggedNodeId, targetParentId);
      }
    },
  });
}

// 更新拖曳視覺回饋
function updateDragFeedback(evt: any, originalEvent: Event) {
  // 使用滑鼠位置精確判定目標元素
  let mouseX = 0;
  let mouseY = 0;

  if (originalEvent instanceof MouseEvent) {
    mouseX = originalEvent.clientX;
    mouseY = originalEvent.clientY;
  } else if (
    originalEvent instanceof TouchEvent &&
    originalEvent.touches.length > 0
  ) {
    const touch = originalEvent.touches[0];
    if (touch) {
      mouseX = touch.clientX;
      mouseY = touch.clientY;
    }
  } else {
    // 備用方案：使用 evt.related
    const relatedElement = evt.related as HTMLElement;
    if (!relatedElement) return;
    const rect = relatedElement.getBoundingClientRect();
    mouseX = rect.left + rect.width / 2;
    mouseY = rect.top + rect.height / 2;
  }

  // 暫時隱藏正在拖曳的元素，以便 elementFromPoint 能正確獲取下方元素
  const draggedElement = evt.item as HTMLElement | undefined;
  let originalPointerEvents = "";

  if (draggedElement) {
    originalPointerEvents = draggedElement.style.pointerEvents;
    draggedElement.style.pointerEvents = "none";
  }

  // 使用 elementFromPoint 獲取精確的目標元素
  const elementUnderMouse = document.elementFromPoint(
    mouseX,
    mouseY
  ) as HTMLElement;

  // 恢復拖曳元素的 pointer-events
  if (draggedElement) {
    draggedElement.style.pointerEvents = originalPointerEvents;
  }

  if (!elementUnderMouse) return;

  // 找到目標節點群組（.v-treeview-group）- 整個節點區域都可接受拖曳
  const targetGroup = elementUnderMouse.closest(
    ".v-treeview-group"
  ) as HTMLElement;

  if (targetGroup) {
    // 從節點群組中找到 data-node-id
    const targetTitleEl = targetGroup.querySelector(
      "[data-node-id]"
    ) as HTMLElement;

    if (targetTitleEl) {
      const targetNodeId = parseInt(
        targetTitleEl.getAttribute("data-node-id") || "",
        10
      );

      if (!isNaN(targetNodeId)) {
        // 避免重複設定相同的狀態（防止閃爍）
        if (
          dragState.value.mode !== "parent" ||
          dragState.value.targetNodeId !== targetNodeId ||
          dragState.value.targetElement !== targetGroup
        ) {
          // 清理舊的視覺回饋
          if (
            dragState.value.targetElement &&
            dragState.value.targetElement !== targetGroup
          ) {
            dragState.value.targetElement.classList.remove(
              "drag-parent-indicator",
              "drag-root-indicator"
            );
          }
          dragState.value = {
            mode: "parent",
            targetNodeId,
            targetElement: targetGroup,
          };
          targetGroup.classList.add("drag-parent-indicator");
        }
        return;
      }
    }
  }

  // 如果在 tree 容器內但不在任何節點上（拖曳到 root 層）
  const treeContainer = elementUnderMouse.closest(".v-treeview") as HTMLElement;
  if (treeContainer) {
    // 避免重複設定相同的狀態（防止閃爍）
    if (
      dragState.value.mode !== "root" ||
      dragState.value.targetElement !== treeContainer
    ) {
      // 清理舊的視覺回饋
      if (
        dragState.value.targetElement &&
        dragState.value.targetElement !== treeContainer
      ) {
        dragState.value.targetElement.classList.remove(
          "drag-parent-indicator",
          "drag-root-indicator"
        );
      }
      dragState.value = {
        mode: "root",
        targetNodeId: null,
        targetElement: treeContainer,
      };
      treeContainer.classList.add("drag-root-indicator");
    }
  }
}

// 清理拖曳視覺回饋
function clearDragFeedback() {
  if (dragState.value.targetElement) {
    dragState.value.targetElement.classList.remove(
      "drag-parent-indicator",
      "drag-root-indicator"
    );
  }
  dragState.value = {
    mode: null,
    targetNodeId: null,
    targetElement: null,
  };
}

// 計算目標父節點 ID（建立父子關係）
function calculateTargetParentIdWithMode(
  draggedItem: HTMLElement,
  targetContainer: HTMLElement,
  mode: "parent" | "root" | null,
  targetNodeId?: number | null
): number | null | undefined {
  // 使用傳入的 targetNodeId（因為 dragState 可能已被清理）
  const nodeId =
    targetNodeId !== undefined ? targetNodeId : dragState.value.targetNodeId;

  // 如果有目標節點 ID，將拖曳節點移動到目標節點下
  if (nodeId !== null && nodeId !== undefined) {
    return nodeId;
  }

  // 回退到原來的邏輯
  return calculateTargetParentId(draggedItem, targetContainer);
}

// 計算目標父節點 ID（原來的邏輯，作為備用）
function calculateTargetParentId(
  draggedItem: HTMLElement,
  targetContainer: HTMLElement
): number | null | undefined {
  // 在 v-treeview 中，目標容器是 .v-list-group__items
  const targetItemsContainer = targetContainer.closest(
    ".v-list-group__items"
  ) as HTMLElement;

  if (!targetItemsContainer) return undefined;

  // 檢查目標容器是否為某個節點的子節點容器
  const parentGroup = targetItemsContainer.closest(
    ".v-treeview-group"
  ) as HTMLElement;

  if (parentGroup) {
    // 如果目標容器是某個節點的子節點容器，則移動到該節點下
    const parentTitleEl = parentGroup.querySelector(
      "[data-node-id]"
    ) as HTMLElement;
    if (parentTitleEl) {
      const parentNodeId = parseInt(
        parentTitleEl.getAttribute("data-node-id") || "",
        10
      );
      if (!isNaN(parentNodeId)) {
        return parentNodeId;
      }
    }
  }

  // 如果不是子節點容器，則為根層級或同階層
  // 找到目標容器中的參考節點
  const targetItems = Array.from(
    targetItemsContainer.querySelectorAll(".v-treeview-group")
  ) as HTMLElement[];

  const draggedIndex = targetItems.indexOf(draggedItem);
  if (draggedIndex === -1) return undefined;

  // 找到參考節點（前一個或後一個）
  let referenceNode: HTMLElement | null = null;

  if (draggedIndex > 0) {
    const prevNode = targetItems[draggedIndex - 1];
    if (prevNode) referenceNode = prevNode;
  } else if (draggedIndex < targetItems.length - 1) {
    const nextNode = targetItems[draggedIndex + 1];
    if (nextNode) referenceNode = nextNode;
  }

  if (referenceNode) {
    const refTitleEl = referenceNode.querySelector(
      "[data-node-id]"
    ) as HTMLElement;
    if (refTitleEl) {
      const refNodeId = parseInt(
        refTitleEl.getAttribute("data-node-id") || "",
        10
      );
      if (!isNaN(refNodeId)) {
        const refNode = findNode(store.nodes, refNodeId);
        if (refNode) {
          // 移動到參考節點的父節點下（同階層）
          return refNode.parent_id;
        }
      }
    }
  }

  // 如果無法找到參考節點，檢查是否為根層級
  const isRootLevel = !targetItemsContainer.closest(".v-treeview-group");
  if (isRootLevel) {
    return null; // 根層級
  }

  return undefined;
}

// 執行移動操作
async function performMove(
  draggedNodeId: number,
  targetParentId: number | null
) {
  // 驗證移動規則
  const draggedNode = findNode(store.nodes, draggedNodeId);
  if (!draggedNode) return;

  // 驗證：不能移到自身
  if (targetParentId === draggedNodeId) {
    console.warn("無法將節點移動到自身");
    return;
  }

  // 驗證：不能移到子孫節點
  if (
    targetParentId !== null &&
    isDescendant(store.nodes, draggedNodeId, targetParentId)
  ) {
    console.warn("無法將節點移動到其子孫節點下");
    return;
  }

  // 驗證：不能移到原本的位置
  if (draggedNode.parent_id === targetParentId) {
    // 同階層拖曳，位置沒有實際改變，不需要呼叫 API
    return;
  }

  // 執行移動
  try {
    await store.moveNodes([draggedNodeId], targetParentId);
  } catch (error) {
    console.error("拖曳移動失敗:", error);
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

/* 拖曳視覺回饋樣式 */
:deep(.drag-parent-indicator) {
  background-color: rgba(var(--v-theme-success), 0.2) !important;
  transition: background-color 0.2s;
}

/* 拖曳到 root 層的視覺回饋 - 應用到 v-treeview 容器 */
:deep(.drag-root-indicator) {
  background-color: rgba(var(--v-theme-success), 0.25) !important;
  transition: background-color 0.2s;
  border: 1px solid rgba(var(--v-theme-success), 0.8) !important;
  border-radius: 8px;
  box-shadow: 0 0 0 6px rgba(var(--v-theme-success), 0.15);
}
</style>
