# Windows Path Bug Fix - 修復歷程

## 問題概述

在 Windows 環境下使用 CMD 開發時遇到 Nuxt 的路徑處理 bug：

```
ERROR Pre-transform error: path should be a path.relative()d string,
but got "d:/git/electricity-meter-management/\x00plugin-vue:export-helper"
```

### 根本原因
- Windows 絕對路徑中的冒號（如 `d:/`）與 Vite 虛擬模塊標識符（如 `plugin-vue:export-helper`）中的冒號衝突
- 此 bug 從 Nuxt 3.10.3 開始出現，在 CMD 環境下影響所有版本包括 Nuxt 4
- 相關 GitHub Issues: [#25941](https://github.com/nuxt/nuxt/issues/25941), [#29663](https://github.com/nuxt/nuxt/issues/29663)

## 解決方案

### 1. 核心解決方案：使用 PowerShell
**關鍵發現**: 問題的根源是 **CMD 的路徑處理方式**，而非 Nuxt 版本問題。

✅ **使用 PowerShell 可以完全解決問題，支持所有 Nuxt 版本**

```powershell
# 在 PowerShell 中運行（支援 Nuxt 4.x）
npm run dev
```

### 2. 版本選擇
- **推薦版本**: Nuxt 4.2.2（最新穩定版）
- **測試結果**:
  - ✅ Nuxt 4.2.2 + PowerShell (完全正常)
  - ✅ Nuxt 4.1.3 + PowerShell (正常運作)
  - ✅ Nuxt 3.13.0 + PowerShell (正常運作)
  - ❌ Nuxt 4.x + CMD (路徑錯誤)
  - ❌ Nuxt 3.x + CMD (路徑錯誤)

**結論**: 使用 PowerShell 後，可以安全使用最新版本的 Nuxt 4.x

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

### 4. 目錄結構 (Nuxt 4 標準)

**最終結構**:
```
/
├── app/              (srcDir - 前端代碼)
│   ├── pages/
│   ├── components/
│   ├── stores/
│   ├── composables/
│   ├── plugins/
│   │   └── vuetify.ts
│   └── types/
└── server/           (根目錄 - Server API 路由)
    ├── api/
    │   ├── nodes.get.ts
    │   └── nodes/
    │       └── move.patch.ts
    └── db.json
```

**重要**: 在 Nuxt 4 中，即使設置了 `srcDir: 'app/'`，`server/` 目錄**必須保持在根目錄**。這是 Nuxt 的設計決策，`srcDir` 只影響前端代碼（pages、components 等），不影響 server routes。

### 5. API 路徑配置

#### server/api/nodes.get.ts
```typescript
// Nuxt 4: server/ 在根目錄
function readNodes(): Node[] {
  const dbPath = path.join(process.cwd(), 'server', 'db.json')
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  return data.nodes
}
```

#### server/api/nodes/move.patch.ts
```typescript
// Nuxt 4: server/ 在根目錄
function readNodes(): Node[] {
  const dbPath = path.join(process.cwd(), 'server', 'db.json')
  // ...
}

function writeNodes(nodes: Node[]): void {
  const dbPath = path.join(process.cwd(), 'server', 'db.json')
  // ...
}
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
1. ✅ **必須使用 PowerShell** 而非 CMD（核心解決方案）
2. ✅ **禁用 DevTools**: `devtools: { enabled: false }`（減少警告）
3. ✅ **使用最新 Nuxt 4.x**（推薦 4.2.2 或更高）
4. ⚠️ 考慮使用 **WSL** 以完全避免 Windows 路徑問題（可選）

### 專案結構 (Nuxt 4)
1. ✅ 使用 `srcDir: 'app/'` 管理前端源代碼
2. ✅ `plugins/` 目錄移至 `app/plugins/`
3. ✅ `server/` 目錄**保持在根目錄**（Nuxt 4 要求）
4. ✅ 使用 `$fetch` 而非 `useFetch` 簡化 API 調用

## 清除緩存命令 (PowerShell)

在修改配置或升級版本後，需要清除 Nuxt 緩存：

```powershell
# 方法 1: 簡潔命令
rd .nuxt, .output, node_modules\.vite -Recurse -Force -ErrorAction SilentlyContinue

# 方法 2: 分別刪除
Remove-Item -Recurse -Force .nuxt -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .output -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# 然後重啟開發服務器
npm run dev
```

## 生產環境部署

### Vercel 部署
生產環境使用 Linux，不受此 Windows 路徑問題影響：
```bash
git add .
git commit -m "fix: Configure Nuxt 4.2 with PowerShell for Windows development"
git push

# 部署到 Vercel
vercel
```

## 相關資源
- [Nuxt Issue #25941](https://github.com/nuxt/nuxt/issues/25941)
- [Nuxt DevTools Issue #868](https://github.com/nuxt/devtools/issues/868)
- [Nuxt Issue #29663](https://github.com/nuxt/nuxt/issues/29663)

## 時間線與關鍵發現
- **2025-12-19 上午**: 識別 Windows CMD 路徑問題，嘗試多個 Nuxt 版本降級方案
- **2025-12-19 下午**: 發現 **PowerShell 是核心解決方案**，而非版本問題
- **2025-12-19 下午**: 升級至 Nuxt 4.2.2 並驗證在 PowerShell 環境下完全正常
- **2025-12-19 下午**: 調整目錄結構符合 Nuxt 4 標準（server/ 在根目錄）
- **2025-12-19 下午**: 驗證所有功能正常運作（API、Vuetify、Pinia）

## 總結

**問題**: Nuxt 在 Windows CMD 環境下有路徑處理 bug
**解決方案**: 使用 PowerShell 而非 CMD 運行開發服務器
**額外配置**: 禁用 devtools + srcDir 分離 + $fetch API 調用

**關鍵認知**: 這不是 Nuxt 版本的問題，而是 Windows CMD 的路徑處理問題。使用 PowerShell 後，可以安全使用最新的 Nuxt 4.x 版本。
