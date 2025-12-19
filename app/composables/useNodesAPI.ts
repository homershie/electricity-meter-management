import type { Node, TreeNode, MoveNodesPayload, MoveNodesResponse } from '~/types/node'

export function useNodesAPI() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  /**
   * 取得節點資料
   * @param flat 是否回傳扁平化資料（預設 true）
   */
  async function fetchNodes(flat = true): Promise<Node[] | TreeNode[]> {
    const url = `${apiBase}/nodes?flat=${flat}`

    try {
      const data = await $fetch<Node[] | TreeNode[]>(url, {
        method: 'GET',
      })

      if (!data) {
        throw new Error('No data returned from API')
      }

      return data
    } catch (error: any) {
      throw new Error(`Failed to fetch nodes: ${error.message || error}`)
    }
  }

  /**
   * 移動節點
   */
  async function moveNodes(
    nodeIds: number[],
    targetParentId: number | null
  ): Promise<MoveNodesResponse> {
    const url = `${apiBase}/nodes/move`
    const payload: MoveNodesPayload = {
      node_ids: nodeIds,
      target_parent_id: targetParentId,
    }

    try {
      const data = await $fetch<MoveNodesResponse>(url, {
        method: 'PATCH',
        body: payload,
      })

      return data || { success: false, error: 'Unknown error' }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to move nodes',
      }
    }
  }

  return {
    fetchNodes,
    moveNodes,
  }
}
