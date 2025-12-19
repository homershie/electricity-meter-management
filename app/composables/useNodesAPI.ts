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

    const { data, error } = await useFetch<Node[] | TreeNode[]>(url, {
      method: 'GET',
    })

    if (error.value) {
      throw new Error(`Failed to fetch nodes: ${error.value.message}`)
    }

    if (!data.value) {
      throw new Error('No data returned from API')
    }

    return data.value
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

    const { data, error } = await useFetch<MoveNodesResponse>(url, {
      method: 'PATCH',
      body: payload,
    })

    if (error.value) {
      return {
        success: false,
        error: error.value.message,
      }
    }

    return data.value || { success: false, error: 'Unknown error' }
  }

  return {
    fetchNodes,
    moveNodes,
  }
}
