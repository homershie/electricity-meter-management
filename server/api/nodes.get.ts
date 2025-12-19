import fs from 'fs'
import path from 'path'

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

function readNodes(): Node[] {
  const dbPath = path.join(process.cwd(), 'server', 'db.json')
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
  return data.nodes
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
