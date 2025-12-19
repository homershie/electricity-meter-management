# Windows Path Bug Fix - 修復歷程

## 問題概述

在 Windows 環境下開發時遇到 Nuxt 的路徑處理 bug：

```
ERROR Pre-transform error: path should be a path.relative()d string,
but got "d:/git/electricity-meter-management/\x00plugin-vue:export-helper"
```

### 根本原因
- Windows 絕對路徑中的冒號（如 `d:/`）與 Vite 虛擬模塊標識符（如 `plugin-vue:export-helper`）中的冒號衝突
- 此 bug 從 Nuxt 3.10.3 開始出現，影響所有後續版本包括 Nuxt 4
- 相關 GitHub Issues: [#25941](https://github.com/nuxt/nuxt/issues/25941), [#29663](https://github.com/nuxt/nuxt/issues/29663)

## 解決方案

### 1. 版本選擇
- **最終版本**: Nuxt 3.13.0
- **測試過的版本**:
  - ❌ Nuxt 4.1.3 (最初版本，錯誤嚴重)
  - ❌ Nuxt 3.15.1 (錯誤仍存在)
  - ❌ Nuxt 3.10.2 (與 @pinia/nuxt@0.9.0 不兼容)
  - ✅ Nuxt 3.13.0 (錯誤減少，可用)

### 2. 開發環境變更
**關鍵發現**: 在 PowerShell 中運行而非 CMD 可解決大部分問題

```powershell
# 在 PowerShell 中運行
npm run dev
```

### 3. 配置調整

#### nuxt.config.ts
```typescript
export default defineNuxtConfig({
  devtools: { enabled: false },  // 禁用 DevTools 減少錯誤
  srcDir: 'app/',                // 指定源代碼目錄

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
})
```

### 4. 目錄結構重組

**移動前**:
```
/
├── app/
│   ├── pages/
│   ├── components/
│   └── stores/
├── plugins/
│   └── vuetify.ts
└── server/
    ├── api/
    └── db.json
```

**移動後**:
```
/
└── app/
    ├── pages/
    ├── components/
    ├── stores/
    ├── plugins/
    │   └── vuetify.ts
    └── server/
        ├── api/
        └── db.json
```

### 5. API 路徑修復

#### app/server/api/nodes.get.ts
```typescript
// 修改前
const dbPath = path.join(process.cwd(), 'server', 'db.json')

// 修改後
const dbPath = path.join(process.cwd(), 'app', 'server', 'db.json')
```

#### app/server/api/nodes/move.patch.ts
```typescript
// 修改前
const dbPath = path.join(process.cwd(), 'server', 'db.json')

// 修改後
const dbPath = path.join(process.cwd(), 'app', 'server', 'db.json')
```

### 6. API 調用方式變更

#### app/composables/useNodesAPI.ts
```typescript
// 修改前 - useFetch 在 SSR 時有問題
const { data, error } = await useFetch<Node[]>(url, {
  method: 'GET',
})

// 修改後 - 使用 $fetch 避免 SSR 複雜性
const data = await $fetch<Node[]>(url, {
  method: 'GET',
})
```

## 測試結果

### ✅ 成功項目
- 開發服務器啟動無致命錯誤
- API 端點正常運作 (`/api/nodes`, `/api/nodes/move`)
- Vuetify 組件正確渲染
- Pinia 狀態管理正常
- 數據載入和顯示正確

### ⚠️ 已知警告
PowerShell 環境下仍會出現以下警告（非阻塞）：
```
WARN [Vue warn]: Failed to resolve component: v-app
WARN [Vue warn]: Failed to resolve component: v-app-bar
```
這些警告不影響功能，組件實際上正常運作。

## 最佳實踐建議

### Windows 開發環境
1. **使用 PowerShell** 而非 CMD
2. **禁用 DevTools**: `devtools: { enabled: false }`
3. **使用 Nuxt 3.13.0** 而非 Nuxt 4
4. 考慮使用 **WSL** 以完全避免 Windows 路徑問題

### 專案結構
1. 統一使用 `srcDir: 'app/'` 管理源代碼
2. 將 plugins、server 目錄移至 srcDir 內
3. 使用 `$fetch` 而非 `useFetch` 簡化 API 調用

## 生產環境部署

### Vercel 部署
生產環境使用 Linux，不受此 Windows bug 影響：
```bash
git add .
git commit -m "fix: Resolve Windows path issues and configure for Nuxt 3.13"
git push

# 部署
vercel
```

## 相關資源
- [Nuxt Issue #25941](https://github.com/nuxt/nuxt/issues/25941)
- [Nuxt DevTools Issue #868](https://github.com/nuxt/devtools/issues/868)
- [Nuxt Issue #29663](https://github.com/nuxt/nuxt/issues/29663)

## 時間線
- 2025-12-19: 識別問題並嘗試 Nuxt 4 → 3 降級
- 2025-12-19: 發現 PowerShell 解決方案
- 2025-12-19: 完成目錄重組和 API 路徑修復
- 2025-12-19: 驗證所有功能正常運作
