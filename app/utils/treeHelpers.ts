import type { Node, TreeNode } from '~/types/node'

/**
 * 將扁平化節點轉換為樹狀結構
 */
export function flatToTree(nodes: Node[]): TreeNode[] {
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
        // 找不到父節點，視為根節點
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

/**
 * 尋找節點
 */
export function findNode(nodes: Node[], id: number): Node | undefined {
  return nodes.find(n => n.id === id)
}

/**
 * 檢查 maybeDescendantId 是否為 ancestorId 的子孫
 */
export function isDescendant(
  nodes: Node[],
  ancestorId: number,
  maybeDescendantId: number | null
): boolean {
  if (maybeDescendantId === null) return false

  let current = findNode(nodes, maybeDescendantId)
  const visited = new Set<number>()

  while (current) {
    if (current.id === ancestorId) return true
    if (current.parent_id === null) return false
    if (visited.has(current.id)) return false // 防止循環

    visited.add(current.id)
    current = findNode(nodes, current.parent_id)
  }

  return false
}

/**
 * 檢查多個節點是否在同一階層
 */
export function areSameLevel(nodes: Node[], ids: number[]): boolean {
  if (ids.length === 0) return true

  const firstNode = findNode(nodes, ids[0])
  if (!firstNode) return false

  const parentId = firstNode.parent_id

  return ids.every(id => {
    const node = findNode(nodes, id)
    return node && node.parent_id === parentId
  })
}

/**
 * 取得節點的父節點 ID
 */
export function getParentId(nodes: Node[], id: number): number | null {
  const node = findNode(nodes, id)
  return node ? node.parent_id : null
}
