# Vercel 部署指南

## 🔧 已完成的修改

### 1. 建立 Nuxt Server API Routes

為了在 Vercel 上運行，已將原本的獨立 Express server 轉換為 Nuxt Server Routes：

**新增檔案：**
- `server/api/nodes.get.ts` - 取得節點資料
- `server/api/nodes/move.patch.ts` - 移動節點

這些 API routes 會自動部署為 serverless functions。

### 2. 更新 API 配置

**修改 `nuxt.config.ts`：**
- API 基礎 URL 改為 `/api`（相對路徑）
- 添加 vite-plugin-vuetify 以正確載入 Vuetify 組件
- 移除 `vuetify/styles` 從 css 陣列（改用 autoImport）

### 3. API 路徑

**開發環境：**
- GET `/api/nodes?flat=true` - 取得扁平化節點
- GET `/api/nodes?flat=false` - 取得樹狀結構
- PATCH `/api/nodes/move` - 移動節點

**生產環境（Vercel）：**
- 相同路徑，會自動使用 serverless functions

## 🚀 部署步驟

### 方式一：使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 部署
vercel
```

### 方式二：透過 GitHub

1. 將專案推送到 GitHub
2. 在 Vercel 網站匯入 GitHub repository
3. Vercel 會自動偵測 Nuxt 專案並部署

## ⚙️ 環境變數（選填）

如需自訂 API URL（例如使用外部 API）：

```
API_BASE_URL=https://your-api-domain.com
```

## 🧪 本地測試新配置

### 測試 Nuxt Server API

```bash
# 啟動開發伺服器（會同時啟動 Nuxt 和 Server API）
npm run dev

# 瀏覽器開啟
http://localhost:3000
```

**API 端點測試：**
- http://localhost:3000/api/nodes?flat=true
- http://localhost:3000/api/nodes?flat=false

### 使用獨立 Server（舊方式）

如果想繼續使用獨立的 json-server：

```bash
# Terminal 1: Mock API
cd server
npm start

# Terminal 2: Nuxt（設定環境變數）
API_BASE_URL=http://localhost:3001 npm run dev
```

## 📝 重要注意事項

### 1. 資料持久化

⚠️ **Vercel serverless functions 不支援檔案寫入持久化**

目前的 `server/api/nodes/move.patch.ts` 使用 `fs.writeFileSync` 寫入 `db.json`，這在 Vercel 上**只會在該次請求中生效，重新載入後會重置**。

**解決方案（選擇一種）：**

#### A. 使用外部資料庫（推薦用於生產）
- PostgreSQL (Vercel Postgres)
- MongoDB (MongoDB Atlas)
- Supabase

#### B. 使用 Vercel KV（Key-Value Store）
```bash
npm install @vercel/kv
```

#### C. 保持現狀（僅供展示）
- 適合面試作業展示
- 資料會在每次部署時重置為初始狀態
- 移動操作在當前 session 有效

### 2. Vercel 限制

- Free tier 有函數執行時間限制（10秒）
- 檔案系統只讀（除了 `/tmp`）
- 冷啟動可能較慢

## 🐛 常見問題

### Q: 部署後 API 無法連接？

**A:** 檢查以下：
1. Vercel 部署日誌中是否有錯誤
2. API routes 是否正確建立在 `server/api/` 目錄
3. 瀏覽器 Console 中的請求 URL 是否正確

### Q: Vuetify 組件無法顯示？

**A:** 確認：
1. `vite-plugin-vuetify` 已安裝
2. `nuxt.config.ts` 中已添加 Vuetify module
3. `plugins/vuetify.ts` 存在並正確配置

### Q: 移動後資料重置？

**A:** 這是預期行為（見上方「資料持久化」說明）。如需真正的持久化，請使用外部資料庫。

## 📊 部署檢查清單

- [ ] 本地測試 `npm run dev` 正常運行
- [ ] 本地測試 API 端點可正常呼叫
- [ ] 建置測試 `npm run build` 無錯誤
- [ ] Vercel 部署成功
- [ ] 生產環境網站可正常載入
- [ ] 生產環境可選取節點
- [ ] 生產環境可移動節點（資料會重置）
- [ ] 瀏覽器 Console 無錯誤

## 🔗 相關連結

- [Nuxt Server API Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [Vercel Deployment Guide](https://vercel.com/docs/frameworks/nuxt)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)

---

**更新時間**: 2025-12-19
**適用版本**: Nuxt 4.2.2
