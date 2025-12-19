import { defineStore } from "pinia";
import type { Node, TreeNode } from "~/types/node";
import {
  flatToTree,
  areSameLevel,
  isDescendant,
  findNode,
} from "~/utils/treeHelpers";
import { saveState, loadState } from "~/utils/localStorage";

interface NodesState {
  nodes: Node[];
  selectedIds: number[];
  expandedIds: number[];
  loading: boolean;
  error: string | null;
}

export const useNodesStore = defineStore("nodes", {
  state: (): NodesState => ({
    nodes: [],
    selectedIds: [],
    expandedIds: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * 樹狀結構
     */
    treeNodes: (state): TreeNode[] => {
      return flatToTree(state.nodes);
    },

    /**
     * 已選節點是否為同階層
     */
    isSelectionValid: (state): boolean => {
      return areSameLevel(state.nodes, state.selectedIds);
    },

    /**
     * 取得選取節點的父節點 ID（同階層保證相同）
     */
    selectedParentId: (state): number | null => {
      if (state.selectedIds.length === 0) return null;
      const firstId = state.selectedIds[0];
      if (firstId === undefined) return null;
      const firstNode = findNode(state.nodes, firstId);
      // 確保 parent_id 是 number 或 null，不返回 undefined
      if (!firstNode) return null;
      return firstNode.parent_id !== undefined && firstNode.parent_id !== null
        ? firstNode.parent_id
        : null;
    },
  },

  actions: {
    /**
     * 載入節點資料
     */
    async loadNodes() {
      this.loading = true;
      this.error = null;

      try {
        const api = useNodesAPI();
        const data = (await api.fetchNodes(true)) as Node[];
        this.nodes = data;

        // 從 localStorage 恢復狀態
        this.selectedIds = loadState("selectedIds", []);
        this.expandedIds = loadState("expandedIds", []);
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Unknown error";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 設定選取的節點
     */
    setSelected(ids: number[]) {
      // 驗證是否同階層
      if (!areSameLevel(this.nodes, ids)) {
        console.warn("Cannot select nodes from different levels");
        return;
      }

      this.selectedIds = ids;
      saveState("selectedIds", ids);
    },

    /**
     * 切換選取狀態
     */
    toggleSelected(id: number) {
      const index = this.selectedIds.indexOf(id);

      if (index > -1) {
        // 取消選取
        this.selectedIds.splice(index, 1);
      } else {
        // 新增選取
        const newSelection = [...this.selectedIds, id];
        if (areSameLevel(this.nodes, newSelection)) {
          this.selectedIds = newSelection;
        } else {
          // 跨階層，清空重選
          this.selectedIds = [id];
        }
      }

      saveState("selectedIds", this.selectedIds);
    },

    /**
     * 清空選取
     */
    clearSelection() {
      this.selectedIds = [];
      saveState("selectedIds", []);
    },

    /**
     * 設定展開節點
     */
    setExpanded(ids: number[]) {
      this.expandedIds = ids;
      saveState("expandedIds", ids);
    },

    /**
     * 驗證是否可移動
     */
    canMove(
      nodeIds: number[],
      targetParentId: number | null
    ): { valid: boolean; error?: string } {
      // 驗證節點存在
      for (const id of nodeIds) {
        const node = findNode(this.nodes, id);
        if (!node) {
          return { valid: false, error: `節點 ${id} 不存在` };
        }
      }

      // 驗證目標父節點存在（null 代表移到根層級）
      if (targetParentId !== null) {
        const target = findNode(this.nodes, targetParentId);
        if (!target) {
          return { valid: false, error: "目標父電表不存在" };
        }
      }

      // 驗證不可移到自身
      for (const id of nodeIds) {
        if (targetParentId === id) {
          return { valid: false, error: "無法將設備移動到自身" };
        }
      }

      // 驗證不可移到子孫
      for (const id of nodeIds) {
        if (
          targetParentId !== null &&
          isDescendant(this.nodes, id, targetParentId)
        ) {
          return { valid: false, error: "無法將設備移動到其子孫電表下" };
        }
      }

      // 驗證不可移到原本的位置
      for (const id of nodeIds) {
        const node = findNode(this.nodes, id);
        if (node && node.parent_id === targetParentId) {
          return { valid: false, error: "設備已經在此位置" };
        }
      }

      return { valid: true };
    },

    /**
     * 移動節點
     */
    async moveNodes(nodeIds: number[], targetParentId: number | null) {
      // 前端驗證
      const validation = this.canMove(nodeIds, targetParentId);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      this.loading = true;
      this.error = null;

      try {
        const api = useNodesAPI();
        const result = await api.moveNodes(nodeIds, targetParentId);

        if (!result.success) {
          throw new Error(result.error || "Failed to move nodes");
        }

        // 重新載入資料
        await this.loadNodes();

        // 清空選取
        this.clearSelection();

        return result;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Unknown error";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
