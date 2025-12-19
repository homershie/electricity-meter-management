interface Node {
  id: number
  name: string
  parent_id: number | null
}

interface TreeNode {
  id: number
  name: string
  depth: number
  children: TreeNode[]
}

// 初始數據 - 在 Vercel serverless 環境中無法讀取文件系統
const initialNodes: Node[] = [
  { id: 1, name: "B2樓變電站_HT-01", parent_id: null },
  { id: 2, name: "B2_冰水泵1", parent_id: 1 },
  { id: 3, name: "B2_冰水泵2", parent_id: 1 },
  { id: 4, name: "RF_冷卻水泵1", parent_id: 1 },
  { id: 5, name: "RF_冷卻水泵2", parent_id: 2 },
  { id: 6, name: "RF_冷卻水泵4", parent_id: 3 }
]

function readNodes(): Node[] {
  // TODO: 在生產環境中，應該連接到真實數據庫（如 PostgreSQL、MongoDB）
  // 目前使用內存數據用於演示
  return initialNodes
}

function buildTree(nodes: Node[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>()
  const roots: TreeNode[] = []

  // 建立節點映射
  nodes.forEach(node => {
    nodeMap.set(node.id, {
      id: node.id,
      name: node.name,
      depth: 0,
      children: [],
    })
  })

  // 建立父子關係
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.id)!
    if (node.parent_id === null) {
      roots.push(treeNode)
    } else {
      const parent = nodeMap.get(node.parent_id)
      if (parent) {
        parent.children.push(treeNode)
      } else {
        roots.push(treeNode)
      }
    }
  })

  // 計算深度
  const calculateDepth = (node: TreeNode, depth: number) => {
    node.depth = depth
    node.children.forEach(child => calculateDepth(child, depth + 1))
  }

  roots.forEach(root => calculateDepth(root, 1))

  return roots
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const flat = query.flat !== 'false' && query.flat !== '0'

  const nodes = readNodes()

  if (flat) {
    return nodes
  } else {
    const forest = buildTree(nodes)
    return forest.length === 1 ? forest[0] : forest
  }
})
