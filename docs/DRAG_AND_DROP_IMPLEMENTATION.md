# 拖曳功能實作文檔

## 📋 概述

本文檔說明電表階層管理系統中拖曳功能的實作方式，包括技術選擇理由、實作細節和使用方法。

---

## 🎯 技術選擇歷程

### 技術方案演進

我們在實作過程中經歷了以下技術選擇：

#### 第一階段：vue-draggable-plus（已放棄）

最初選擇 `vue-draggable-plus` 的原因：

- ✅ 專為 Vue 3 設計，支援 Composition API
- ✅ 基於成熟的 SortableJS
- ✅ API 直觀，整合容易

**放棄原因**：

- ❌ 對 Vuetify v-treeview 的 DOM 結構操作過於複雜
- ❌ 需要大量手動處理 DOM 元素
- ❌ 與 v-treeview 的響應式更新衝突
- ❌ AI 輔助開發時難以調試和修復

#### 第二階段：@vueuse/integrations + SortableJS（當前方案）⭐

改用 `@vueuse/integrations` 的 `useSortable` composable：

- ✅ 已安裝在專案中，無需額外依賴
- ✅ 基於 SortableJS，功能完整
- ✅ 更底層的 API，可以更精確地控制拖曳行為
- ✅ 與 Vuetify 整合更靈活
- ✅ 支援自訂拖曳邏輯和視覺回饋

### 其他方案比較

| 方案                                     | 優點                       | 缺點                               | 適用場景                 |
| ---------------------------------------- | -------------------------- | ---------------------------------- | ------------------------ |
| **@vueuse/integrations + SortableJS** ⭐ | 已安裝，靈活度高，整合容易 | 需要手動處理拖曳邏輯               | **樹狀結構（我們選擇）** |
| **vue-draggable-plus**                   | Vue 3 專用，API 直觀       | 與 v-treeview 整合困難             | 簡單列表                 |
| **Vue DnD Kit**                          | 效能最佳，無障礙支援完整   | 學習曲線高，與 v-treeview 整合複雜 | 大型列表                 |
| **HTML5 Drag API**                       | 無需套件                   | 觸控支援差，實作複雜               | 不建議                   |

---

## 🏗️ 實作架構

### 檔案結構

```
app/
├── components/
│   └── ElectricityMeterTree.vue  # 主要樹狀組件（包含拖曳功能）
├── stores/
│   └── nodesStore.ts             # 狀態管理（包含移動邏輯）
└── utils/
    └── treeHelpers.ts             # 樹狀結構輔助函式
```

### 核心實作

#### 1. 拖曳手柄

在 `v-treeview` 的 `prepend` slot 中加入拖曳手柄：

```vue
<template #prepend="{ item }">
  <div class="d-flex align-center">
    <v-icon
      class="drag-handle mr-1"
      :icon="'mdi-drag'"
      size="small"
      style="cursor: grab; opacity: 0.5;"
    />
    <v-icon
      :icon="getNodeIcon(item)"
      :color="isNodeSelected(item.id) ? 'primary' : undefined"
    />
  </div>
</template>
```

#### 2. 節點 ID 標記

在 `title` slot 中加入 `data-node-id` 屬性，方便從 DOM 中提取節點 ID：

```vue
<template #title="{ item }">
  <div
    class="tree-node-label"
    :data-node-id="item.id"
    @click.stop="handleNodeClick(item, $event)"
  >
    {{ item.name }}
  </div>
</template>
```

#### 3. 拖曳初始化

使用 `useSortable` composable 初始化拖曳功能：

```typescript
import { useSortable } from "@vueuse/integrations/useSortable";

function initializeDragAndDrop(container: HTMLElement, nodeIds: number[]) {
  const nodeIdsRef = ref(nodeIds);

  // 使用 useSortable
  useSortable(container, nodeIdsRef, {
    handle: ".drag-handle",
    animation: 150,
    group: {
      name: "tree-nodes",
      pull: true,
      put: true,
    },
    onMove: (evt: any, originalEvent: Event) => {
      // 更新視覺回饋
      updateDragFeedback(evt, originalEvent);
      return true;
    },
    onEnd: async (event) => {
      // 處理拖曳結束
      await handleDragEnd(event);
    },
  });
}
```

---

## 🎨 拖曳模式與視覺回饋

### 功能設計演進

#### 初期設計：雙模式（排序 + 階層變更）

最初設計包含兩種模式：

1. **排序模式**：同階層內重新排序
2. **階層變更模式**：建立父子關係

**判定方式演進**：

- 上下判定（拖曳到節點上半部/下半部）→ 操作體驗不佳
- 左右判定（拖曳到節點左半邊/右半邊）→ 排序功能實作困難

#### 最終設計：單一模式（階層變更）⭐

經過實測後，簡化為單一模式：

- **只支援階層變更**（建立父子關係）
- **移除排序功能**（因後端缺少排序欄位 API）

### 當前實作

#### 視覺回饋

**拖曳到節點時**：

- 目標節點顯示**綠色背景**（success 主題色，透明度 20%）
- 判定區域：整個節點區域（`.v-treeview-group`），包括圖標、標題、子節點容器
- 表示拖曳的節點將成為該節點的子節點

```css
:deep(.drag-parent-indicator) {
  background-color: rgba(var(--v-theme-success), 0.2) !important;
  transition: background-color 0.2s;
}
```

**拖曳到根層級時**：

- `.v-treeview` 容器顯示**綠色背景 + 邊框 + 陰影效果**
- 當 `elementFromPoint` 檢測到在樹狀容器內但不在任何節點上時，視覺回饋會應用到整個 `.v-treeview` 容器
- 表示拖曳的節點將移動到根層級（`parent_id = null`）

```css
:deep(.drag-root-indicator) {
  background-color: rgba(var(--v-theme-success), 0.25) !important;
  transition: background-color 0.2s;
  border: 1px solid rgba(var(--v-theme-success), 0.8) !important;
  border-radius: 8px;
  box-shadow: 0 0 0 6px rgba(var(--v-theme-success), 0.15);
}
```

#### 拖曳判定邏輯

使用精確的滑鼠位置判定：

```typescript
// 更新拖曳視覺回饋
function updateDragFeedback(evt: any, originalEvent: Event) {
  // 1. 獲取精確的滑鼠座標（支援滑鼠和觸控事件）
  let mouseX = 0;
  let mouseY = 0;
  if (originalEvent instanceof MouseEvent) {
    mouseX = originalEvent.clientX;
    mouseY = originalEvent.clientY;
  } else if (
    originalEvent instanceof TouchEvent &&
    originalEvent.touches.length > 0
  ) {
    mouseX = originalEvent.touches[0].clientX;
    mouseY = originalEvent.touches[0].clientY;
  }

  // 2. 暫時隱藏拖曳元素，避免遮擋目標
  const draggedElement = evt.item as HTMLElement | undefined;
  let originalPointerEvents = "";
  if (draggedElement) {
    originalPointerEvents = draggedElement.style.pointerEvents;
    draggedElement.style.pointerEvents = "none";
  }

  // 3. 使用 elementFromPoint 獲取滑鼠下方的元素
  const elementUnderMouse = document.elementFromPoint(
    mouseX,
    mouseY
  ) as HTMLElement;

  // 4. 恢復拖曳元素
  if (draggedElement) {
    draggedElement.style.pointerEvents = originalPointerEvents;
  }

  if (!elementUnderMouse) return;

  // 5. 找到目標節點群組（整個節點區域都可接受）
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

  // 6. 如果在 tree 容器內但不在任何節點上（拖曳到 root 層）
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

// 拖曳結束處理
onEnd: async (event) => {
  const savedTargetNodeId = dragState.value.targetNodeId;
  const savedMode = dragState.value.mode;
  clearDragFeedback();

  const draggedNodeId = nodeIds[event.oldIndex];

  // 根據模式執行移動
  let targetParentId;
  if (savedMode === "root") {
    targetParentId = null; // 移動到根層級
  } else if (savedMode === "parent") {
    targetParentId = savedTargetNodeId; // 移動到目標節點下
  }

  if (targetParentId !== undefined) {
    await performMove(draggedNodeId, targetParentId);
  }
};
```

#### 防閃爍機制

為了提供流暢的視覺體驗，實作了防閃爍機制：

1. **狀態比較**：在更新視覺回饋前，先檢查目標是否改變
2. **條件更新**：只有當 mode、targetNodeId 或 targetElement 改變時才更新
3. **智能清理**：只清理與新目標不同的舊元素樣式

```typescript
// 避免重複設定相同的狀態（防止閃爍）
if (
  dragState.value.mode !== "parent" ||
  dragState.value.targetNodeId !== targetNodeId ||
  dragState.value.targetElement !== targetGroup
) {
  // 清理舊的視覺回饋（只在目標改變時）
  if (
    dragState.value.targetElement &&
    dragState.value.targetElement !== targetGroup
  ) {
    dragState.value.targetElement.classList.remove(
      "drag-parent-indicator",
      "drag-root-indicator"
    );
  }
  // 更新狀態和視覺回饋
  dragState.value = {
    mode: "parent",
    targetNodeId,
    targetElement: targetGroup,
  };
  targetGroup.classList.add("drag-parent-indicator");
}
```

---

## 🔒 移動規則與驗證

### 驗證邏輯

在執行移動操作前，會進行以下驗證：

```typescript
async function performMove(
  draggedNodeId: number,
  targetParentId: number | null
) {
  const draggedNode = findNode(store.nodes, draggedNodeId);

  // 1. 驗證：不能移到自身
  if (targetParentId === draggedNodeId) {
    console.warn("無法將節點移動到自身");
    return;
  }

  // 2. 驗證：不能移到子孫節點
  if (
    targetParentId &&
    isDescendant(store.nodes, draggedNodeId, targetParentId)
  ) {
    console.warn("無法將節點移動到其子孫節點");
    return;
  }

  // 3. 執行移動
  await store.moveNodes([draggedNodeId], targetParentId);
}
```

### 限制規則

- ✅ 可以移動到任何其他節點下（建立父子關係）
- ✅ 可以移動到根層級（`targetParentId = null`）
- ❌ 不能移動到自身
- ❌ 不能移動到自身的子孫節點
- ❌ 不支援排序功能（因後端 API 限制）

---

## 🔄 與現有系統整合

### 與 Store 整合

拖曳結束後，呼叫現有的 `moveNodes` action：

```typescript
await store.moveNodes([draggedNodeId], targetParentId);
```

### 與 API 整合

`store.moveNodes` 會自動：

1. 驗證移動規則
2. 呼叫 API (`PATCH /api/nodes/move`)
3. 重新載入資料
4. 更新 UI

### API 格式

```typescript
// 請求
PATCH /api/nodes/move
{
  "node_ids": [5],
  "parent_id": 3
}

// 回應
{
  "success": true,
  "message": "節點已成功移動"
}
```

---

## 📝 使用方式

### 基本操作

1. **開始拖曳**：點擊並按住節點左側的拖曳圖示（`mdi-drag`）
2. **拖曳過程**：
   - 拖曳到任何節點上會顯示綠色背景（`.drag-parent-indicator`）
   - 拖曳到樹狀容器的空白區域（不在任何節點上）會顯示綠色背景、邊框和陰影（`.drag-root-indicator`）
   - 綠色背景表示該節點將成為新的父節點，或移動到根層級
3. **放開滑鼠**：拖曳的節點會移動到目標位置

### 操作範例

#### 範例 1：建立父子關係

```
拖曳前：
根層級
├── A
└── B
    └── B1

操作：將 A 拖曳到 B 上
（B 會顯示綠色背景）

拖曳後：
根層級
└── B
    ├── B1
    └── A    ← 成為 B 的子節點
```

#### 範例 2：移動到根層級

```
拖曳前：
根層級
└── A
    └── A1

操作：將 A1 拖曳到樹狀容器的空白區域（不在任何節點上）
（整個 `.v-treeview` 容器會顯示綠色背景、邊框和陰影效果）

拖曳後：
根層級
├── A
└── A1    ← 移動到根層級
```

### 與現有功能共存

拖曳功能與現有的功能完全相容：

- ✅ 多選功能（修飾鍵 + 點擊）
- ✅ 移動對話框（「移動階層」按鈕）
- ✅ 展開/收合節點
- ✅ 選取狀態視覺回饋

---

## 🛠️ 技術細節

### 依賴套件

```json
{
  "dependencies": {
    "@vueuse/integrations": "^11.4.0",
    "sortablejs": "^1.15.6"
  }
}
```

### 主要 API

#### `useSortable(container, items, options)`

- **container**: 拖曳容器的 DOM 元素或 ref
- **items**: 可拖曳的項目 ID 陣列的 ref
- **options**: 配置選項
  - `handle`: 拖曳手柄選擇器（`.drag-handle`）
  - `animation`: 動畫時長（150ms）
  - `group`: 群組配置（允許跨層級拖曳）
  - `onMove`: 拖曳過程中的回調（更新視覺回饋，返回 `false` 禁止 SortableJS 自動移動 DOM）
  - `onEnd`: 拖曳結束回調（執行移動操作）

### 狀態管理

```typescript
// 拖曳狀態
const dragState = ref<{
  mode: "parent" | "root" | null;
  targetNodeId: number | null;
  targetElement: HTMLElement | null;
}>({
  mode: null,
  targetNodeId: null,
  targetElement: null,
});
```

### 生命週期

1. **組件掛載**：`onMounted` → `nextTick` → `initializeDragAndDrop()`
2. **資料更新**：`watch(treeNodes)` → 重新初始化拖曳
3. **拖曳開始**：使用者點擊拖曳手柄
4. **拖曳中**：`onMove` → 更新視覺回饋（綠色背景）
5. **拖曳結束**：`onEnd` → 清理視覺回饋 → 驗證 → 呼叫 API → 更新資料

---

## 🐛 已知限制與注意事項

### 限制

1. **無排序功能**：不支援同階層內的重新排序（因後端缺少 `order` 欄位）
2. **DOM 依賴**：需要等待 DOM 渲染完成後才能初始化拖曳功能
3. **v-treeview 結構**：需要手動從 DOM 中提取節點資訊

### 注意事項

1. **初始化時機**：必須在 `onMounted` 和 `nextTick` 後初始化
2. **重複初始化**：使用 `Set` 追蹤已處理的容器，避免重複初始化
3. **節點 ID 提取**：使用 `data-node-id` 屬性標記節點
4. **視覺回饋清理**：拖曳結束後必須清理 CSS class，避免殘留

---

## 🔮 未來改進

### 可能的改進方向

1. **排序功能**：

   - 需要後端新增 `order` 或 `position` 欄位
   - 需要 API 支援同階層排序

2. **鍵盤操作**：

   - 支援方向鍵移動節點
   - 支援 Enter 確認、Esc 取消

3. **觸控優化**：

   - 針對觸控裝置優化拖曳體驗
   - 長按開始拖曳

4. **批次移動**：
   - 支援多選後批次拖曳移動
   - 與現有多選功能整合

---

## 📚 參考資源

- [VueUse useSortable 文檔](https://vueuse.org/integrations/useSortable/)
- [SortableJS 官方文檔](https://sortablejs.github.io/Sortable/)
- [Vuetify v-treeview 文檔](https://vuetifyjs.com/en/components/treeviews/)

---

## 📊 實作決策記錄

### 為何放棄 vue-draggable-plus？

1. **DOM 操作複雜度**：需要精確控制 v-treeview 的 DOM 結構
2. **響應式衝突**：與 Vuetify 的響應式更新機制衝突
3. **調試困難**：錯誤訊息不夠明確，AI 輔助開發困難
4. **靈活度不足**：無法實作自訂的拖曳判定邏輯

### 為何選擇 useSortable？

1. **已有依賴**：專案已安裝 `@vueuse/integrations`
2. **更底層 API**：可以更精確控制拖曳行為
3. **靈活性高**：可以自訂視覺回饋和拖曳邏輯
4. **整合容易**：與 Vue 3 Composition API 完美整合

### 為何移除排序功能？

1. **後端限制**：缺少 `order` 或 `position` 欄位
2. **API 限制**：沒有專門的排序 API
3. **使用者體驗**：單一功能（階層變更）更直覺
4. **實作複雜度**：排序需要額外的狀態管理和 API 支援

---

---

## 🔧 技術修正記錄

### 根層級拖曳視覺回饋修正（2025-12-20）

**問題**：

- 當拖曳到底部區域時，`elementFromPoint` 檢測到的是 `.v-treeview` 元素（樹狀列表容器），而不是底部的 `.root-drop-zone`
- 導致 `drag-root-indicator` 類別被錯誤地添加到 `.v-treeview` 上，但樣式未正確定義

**解決方案**：

- 移除了 `root-drop-zone` 相關代碼
- 直接將 `drag-root-indicator` 應用到 `.v-treeview` 容器上
- 更新樣式為明顯的綠色視覺效果（背景、邊框、陰影）
- 當檢測到在樹狀容器內但不在任何節點上時，視覺回饋會應用到整個 `.v-treeview` 容器

**實作細節**：

- 在 `updateDragFeedback` 函數中，當找不到目標節點群組時，檢查是否在 `.v-treeview` 容器內
- 如果是，則將 `drag-root-indicator` 類別添加到容器上，表示移動到根層級

---

**最後更新**: 2025-12-20
**實作版本**: 2.1.0
**技術方案**: @vueuse/integrations + SortableJS
