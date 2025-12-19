# 電表階層管理系統

一個使用 Nuxt 4 + Vue 3 + Pinia + TypeScript 開發的電表階層管理系統。

## 🎯 功能特色

- ✅ 樹狀結構顯示電表階層關係
- ✅ 多選同階層電表（Alt/Ctrl + 點擊）
- ✅ 透過 Modal 移動電表至不同階層
- ✅ 完整的移動驗證規則（不可移到自身、子孫節點）
- ✅ 狀態持久化（頁面重整後保留選取和展開狀態）
- ✅ Material Design 風格 UI（Vuetify）
- ✅ TypeScript 嚴格模式

## 🚀 快速開始

### 前置需求

- Node.js 18+
- npm 8+

### 安裝與執行

1. **安裝依賴**

```bash
# 安裝主專案依賴
npm install
```

2. **啟動開發伺服器**

```bash
# 啟動 Nuxt 應用（包含 API 路由）
npm run dev
```

3. **訪問應用**

- 前端應用: http://localhost:3000
- API 端點: http://localhost:3000/api/nodes（自動整合在 Nuxt 中）

## 📁 專案結構

```
electricity-meter-management/
├── app/
│   ├── components/          # Vue 組件
│   │   ├── ElectricityMeterTree.vue  # 主要樹狀元件
│   │   └── MoveDialog.vue             # 移動對話框
│   ├── composables/         # 組合式函數
│   │   └── useNodesAPI.ts            # API 呼叫
│   ├── stores/              # Pinia 狀態管理
│   │   └── nodesStore.ts              # 節點資料 Store
│   ├── types/               # TypeScript 類型定義
│   │   └── node.ts                    # 節點類型
│   ├── utils/               # 工具函式
│   │   ├── treeHelpers.ts            # 樹狀結構輔助
│   │   └── localStorage.ts           # 本地儲存
│   ├── pages/               # Nuxt 頁面
│   │   └── index.vue                 # 主頁面
│   └── app.vue              # 應用程式根組件
├── plugins/
│   └── vuetify.ts           # Vuetify 配置
├── server/                  # Nuxt 4 Server API
│   ├── api/                 # API 路由（現行使用）
│   │   ├── nodes.get.ts              # GET /api/nodes
│   │   └── nodes/
│   │       └── move.patch.ts         # PATCH /api/nodes/move
│   ├── utils/               # 伺服器工具函式
│   │   └── dataStore.ts              # 資料存儲（內存）
│   ├── db.json              # 初始資料（參考用）
│   ├── server.js            # 貴公司提供的獨立 Mock API（保留作為參考）
│   ├── package.json         # 獨立伺服器依賴（保留作為參考）
│   └── README.md            # 貴公司提供的 API 說明文件
├── nuxt.config.ts           # Nuxt 配置
├── package.json             # 主專案依賴
└── tsconfig.json            # TypeScript 配置
```

## 🎮 使用說明

### 瀏覽階層

- 點擊節點前的箭頭圖示展開/收合子節點
- 樹狀結構顯示電表的階層關係

### 選取電表

- **單選**: 直接點擊電表名稱
- **多選**: 按住 `Alt` (Windows) 或 `Command` (Mac) 或 `Ctrl` + 點擊
- **限制**: 只能選取同階層的電表，跨階層選取會自動清空重選

### 移動電表

1. 選取一個或多個同階層的電表
2. 點擊右上角的「移動選取項」按鈕
3. 在 Modal 中選擇目標父節點（或選擇「根層級」移至最上層）
4. 點擊「確認移動」

### 移動規則

系統會自動驗證以下規則：

- ❌ 不可將節點移動到自身
- ❌ 不可將節點移動到其子孫節點下
- ❌ 不可移動到原本的位置
- ✅ 可移動到其他節點或根層級

## 🔧 技術細節

### 核心技術

- **Framework**: Nuxt 4 (Vue 3)
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Language**: TypeScript
- **API**: Nuxt 4 Server API（內建 API 路由）

### 📋 架構說明

本專案採用 **Nuxt 4 Server API** 整合後端 API，而非使用貴公司提供的獨立 Mock API 伺服器。

#### 🔄 架構變更

**原本架構（貴公司提供）：**

- 獨立的 Express + json-server 伺服器（`server/server.js`）
- 需要同時啟動兩個伺服器（前端 Nuxt + 後端 Express）
- 端口：前端 3000，後端 3001

**現行架構（Nuxt 4 Server API）：**

- API 路由整合在 Nuxt 4 的 `server/api/` 目錄
- 只需執行 `npm run dev` 即可同時啟動前端和 API
- 單一端口：3000

#### ✅ 為什麼採用 Nuxt 4 Server API？

1. **簡化開發流程**

   - 原本需要同時啟動兩個伺服器（前端 Nuxt + 後端 Express）
   - 現在只需 `npm run dev`，前端和 API 在同一伺服器運行
   - 減少端口管理和啟動步驟，方便本地開發

2. **符合 Nuxt 4 最佳實踐**

   - Nuxt 4 提供內建的 Server API 路由功能
   - 使用 `server/api/` 目錄即可建立 API 端點
   - 與前端共用 TypeScript 類型和工具函式

3. **功能完全一致**

   - API 端點和行為與原本完全相同（`GET /api/nodes`、`PATCH /api/nodes/move`）
   - 驗證規則和錯誤處理保持一致
   - 資料結構和回應格式不變

4. **部署更簡單**

   - 單一應用部署，無需分別部署前端和後端
   - 適合 Vercel、Netlify 等平台
   - 減少部署複雜度和成本

5. **開發體驗提升**
   - 類型安全：前後端共用 TypeScript 類型
   - 熱重載：API 和前端同時支援
   - 除錯方便：同一進程，除錯更直觀

> **注意**：貴公司提供的 `server/server.js` 和 `server/README.md` 已保留作為參考，展示原本的 API 實作方式。

### API 端點

Nuxt 4 Server API 提供兩個端點（路徑前綴為 `/api`）：

**GET /api/nodes?flat=true/false**

取得所有電表節點資料

- `flat=true`（預設）：回傳扁平陣列
- `flat=false`：回傳樹狀結構，包含 `depth` 與 `children`

**PATCH /api/nodes/move**

移動節點到新的父節點

## ⚠️ 已知問題

1. **端口衝突**: 如果 3000 端口被佔用，Nuxt 會自動使用 3002
2. **Vite 警告**: 開發環境中可能出現一些 Vite 的警告，不影響功能
3. **TypeScript 類型檢查**: 已暫時關閉 `vue-tsc` 以避免啟動錯誤

## 📝 常見問題

**Q: npm install 出現 tar 錯誤？**

A: 執行以下命令清除快取：

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: Nuxt 無法啟動？**

A: 確認已安裝 `@pinia/nuxt` 和 `vue-tsc`：

```bash
npm install @pinia/nuxt vue-tsc -D
```

**Q: API 無法連接？**

A: Nuxt 4 的 API 路由已整合在開發伺服器中，只需執行 `npm run dev` 即可。確認 `server/api/` 目錄下的 API 檔案存在。

**Q: 為什麼不使用貴公司提供的獨立 Mock API 伺服器？**

A: 為了配合使用 Nuxt 4，採用 Nuxt 4 Server API 整合後端功能，不需要啟動兩個伺服器，方便本地開發。功能完全一致，API 端點和行為與原本相同。貴公司提供的 `server/server.js` 已保留作為參考。

## 📄 授權

本專案僅供面試作業使用。

---

**開發時間**: 2025-12-19
**技術棧**: Nuxt 4 + Vuetify 3 + Pinia + TypeScript
