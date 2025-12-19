// 共享的內存數據存儲
// 注意：在 Vercel serverless 環境中，這個數據會在冷啟動後重置

interface Node {
  id: number
  name: string
  parent_id: number | null
}

// 使用 let 允許數據被修改
let nodes: Node[] = [
  { id: 1, name: "B2樓變電站_HT-01", parent_id: null },
  { id: 2, name: "B2_冰水泵1", parent_id: 1 },
  { id: 3, name: "B2_冰水泵2", parent_id: 1 },
  { id: 4, name: "RF_冷卻水泵1", parent_id: 1 },
  { id: 5, name: "RF_冷卻水泵2", parent_id: 2 },
  { id: 6, name: "RF_冷卻水泵4", parent_id: 3 }
]

/**
 * 讀取所有節點
 */
export function getNodes(): Node[] {
  return nodes
}

/**
 * 更新所有節點
 */
export function setNodes(newNodes: Node[]): void {
  nodes = newNodes
}
