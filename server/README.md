# 電表階層管理 Mock API

此專案提供 `json-server` + 自訂路由，供前端作業串接。

## 安裝與啟動

```bash
npm i
npm run start
# 服務在 http://localhost:3001
```

## 端點

### 取得所有電表

`GET /nodes`

### 移動階層

`PATCH /nodes/move`

請求：

```json
{ "target_parent_id": 1, "node_ids": [5] }
```

- `target_parent_id`: 目標父電表 ID；為 `null` 代表移到 root。
- `node_ids`: 需要移動的節點 ID 陣列。

成功回應：

```json
{ "success": true, "moved": [5] }
```

失敗範例：

```json
{ "success": false, "error": "Cannot move node under its own descendant" }
```

## 驗證規則

- 目標父節點必須存在（或為 `null`）。
- 不能把節點移到其自身或其子孫底下。
- 成功後會直接寫回 `db.json`。

## `GET /nodes` 支援 `flat` 參數

- `GET /nodes?flat=true`（預設）：回傳 **扁平陣列**（目前的格式）。
- `GET /nodes?flat=false`：回傳 **樹狀結構**，包含 `depth` 與 `children`。

> 若 root 只有一個，回傳單一物件；若有多個 root，回傳 root 陣列。

樹狀回傳範例（單一 root）：

```json
{
  "id": 1,
  "name": "B2樓變電站_HT-01",
  "depth": 1,
  "children": [{ "id": 2, "name": "B2_冰水泵1", "depth": 2, "children": [] }]
}
```
