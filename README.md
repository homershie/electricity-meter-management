# 電表階層管理系統

一個使用 Nuxt 4 + Vuetify 3 + Pinia + TypeScript 開發的電表階層管理系統。

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

# 安裝 Mock API 依賴
cd server
npm install
cd ..
```

2. **啟動開發伺服器**

需要同時啟動兩個伺服器：

```bash
# Terminal 1: 啟動 Mock API（端口 3001）
cd server
npm start

# Terminal 2: 啟動 Nuxt 應用（端口 3000 或 3002）
npm run dev
```

3. **訪問應用**

- 前端應用: http://localhost:3000 或 http://localhost:3002
- Mock API: http://localhost:3001

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
├── server/                  # Mock API 伺服器
│   ├── server.js            # Express + json-server
│   ├── db.json              # 初始電表資料
│   └── package.json         # API 依賴
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
- **API**: json-server (Mock API)

### API 端點

Mock API 提供兩個端點：

**GET /nodes?flat=true/false**

取得所有電表節點資料

**PATCH /nodes/move**

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

A: 確認 Mock API 伺服器正在運行（端口 3001）：

```bash
cd server
npm start
```

## 📄 授權

本專案僅供面試作業使用。

---

**開發時間**: 2025-12-19
**技術棧**: Nuxt 4 + Vuetify 3 + Pinia + TypeScript
