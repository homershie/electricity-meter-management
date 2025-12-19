interface Node {
  id: number
  name: string
  parent_id: number | null
}

interface MovePayload {
  node_ids: number[]
  target_parent_id: number | null
}

// 在 Vercel serverless 環境中無法持久化文件，這裡使用內存存儲
// 注意：每次部署或冷啟動後數據會重置
let cachedNodes: Node[] = [
  { id: 1, name: "B2樓變電站_HT-01", parent_id: null },
  { id: 2, name: "B2_冰水泵1", parent_id: 1 },
  { id: 3, name: "B2_冰水泵2", parent_id: 1 },
  { id: 4, name: "RF_冷卻水泵1", parent_id: 1 },
  { id: 5, name: "RF_冷卻水泵2", parent_id: 2 },
  { id: 6, name: "RF_冷卻水泵4", parent_id: 3 }
]

function readNodes(): Node[] {
  // TODO: 在生產環境中，應該從數據庫讀取
  return cachedNodes
}

function writeNodes(nodes: Node[]): void {
  // TODO: 在生產環境中，應該寫入數據庫
  // 目前更新內存中的數據（僅在同一個 serverless instance 中有效）
  cachedNodes = nodes
}

function findNode(nodes: Node[], id: number): Node | undefined {
  return nodes.find(n => n.id === id)
}

function isDescendant(nodes: Node[], ancestorId: number, maybeDescendantId: number | null): boolean {
  if (maybeDescendantId == null) return false

  let current = findNode(nodes, maybeDescendantId)
  const visited = new Set<number>()

  while (current) {
    if (current.id === ancestorId) return true
    if (current.parent_id === null) return false
    if (visited.has(current.id)) return false

    visited.add(current.id)
    current = findNode(nodes, current.parent_id)
  }

  return false
}

export default defineEventHandler(async (event) => {
  const body = await readBody<MovePayload>(event)
  const { target_parent_id, node_ids } = body || {}

  if (!Array.isArray(node_ids) || node_ids.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'node_ids must be a non-empty array',
    })
  }

  const nodes = readNodes()

  // 驗證目標父節點存在
  if (target_parent_id !== null) {
    const target = findNode(nodes, Number(target_parent_id))
    if (!target) {
      throw createError({
        statusCode: 400,
        message: 'target_parent_id does not exist',
      })
    }
  }

  // 驗證所有節點
  for (const id of node_ids) {
    const node = findNode(nodes, Number(id))
    if (!node) {
      throw createError({
        statusCode: 400,
        message: `node ${id} not found`,
      })
    }
    if (target_parent_id === node.id) {
      throw createError({
        statusCode: 400,
        message: 'Cannot move node under itself',
      })
    }
    if (isDescendant(nodes, node.id, target_parent_id)) {
      throw createError({
        statusCode: 400,
        message: 'Cannot move node under its own descendant',
      })
    }
  }

  // 執行移動
  const moved: number[] = []
  const idSet = new Set(node_ids.map(Number))
  const newNodes = nodes.map(n => {
    if (idSet.has(n.id)) {
      moved.push(n.id)
      return { ...n, parent_id: target_parent_id }
    }
    return n
  })

  writeNodes(newNodes)

  return { success: true, moved }
})
