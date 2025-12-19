export interface Node {
  id: number
  name: string
  parent_id: number | null
}

export interface TreeNode extends Omit<Node, 'parent_id'> {
  depth: number
  children: TreeNode[]
}

export interface MoveNodesPayload {
  node_ids: number[]
  target_parent_id: number | null
}

export interface MoveNodesResponse {
  success: boolean
  moved?: number[]
  error?: string
}
