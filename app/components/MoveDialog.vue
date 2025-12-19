<template>
  <v-dialog v-model="show" max-width="500">
    <v-card>
      <v-card-title>移動電表節點</v-card-title>

      <v-card-text>
        <p class="mb-4">
          已選取 <strong>{{ selectedIds.length }}</strong> 個節點
        </p>

        <v-select
          v-model="targetParentId"
          :items="availableParents"
          item-title="label"
          item-value="value"
          label="選擇目標父節點"
          variant="outlined"
          density="comfortable"
        />

        <v-alert
          v-if="validationError"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ validationError }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancel"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!canMove"
          :loading="loading"
          @click="confirm"
        >
          確認移動
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Node } from '~/types/node'
import { useNodesStore } from '~/stores/nodesStore'
import { isDescendant } from '~/utils/treeHelpers'

const props = defineProps<{
  modelValue: boolean
  selectedIds: number[]
  nodes: Node[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'move', targetParentId: number | null): void
}>()

const store = useNodesStore()
const targetParentId = ref<number | null>(null)
const loading = ref(false)
const validationError = ref<string | null>(null)

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 可用的父節點選項
const availableParents = computed(() => {
  const options: Array<{ label: string; value: number | null }> = [
    { label: '（根層級）', value: null },
  ]

  // 排除已選節點及其子孫
  const excludeIds = new Set(props.selectedIds)

  // 為每個選中的節點，排除其所有子孫
  for (const selectedId of props.selectedIds) {
    for (const node of props.nodes) {
      if (isDescendant(props.nodes, selectedId, node.id)) {
        excludeIds.add(node.id)
      }
    }
  }

  for (const node of props.nodes) {
    if (!excludeIds.has(node.id)) {
      options.push({
        label: node.name,
        value: node.id,
      })
    }
  }

  return options
})

// 驗證是否可移動
const canMove = computed(() => {
  if (loading.value) return false

  const validation = store.canMove(props.selectedIds, targetParentId.value)
  validationError.value = validation.error || null

  return validation.valid
})

// 監聽對話框開啟，重置狀態
watch(show, (newValue) => {
  if (newValue) {
    targetParentId.value = null
    validationError.value = null
  }
})

function cancel() {
  show.value = false
}

async function confirm() {
  if (!canMove.value) return

  loading.value = true
  try {
    emit('move', targetParentId.value)
  } finally {
    loading.value = false
  }
}
</script>
