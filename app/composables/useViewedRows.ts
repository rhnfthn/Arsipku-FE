import { computed, onMounted, ref, watch } from 'vue'
import { newRowClass } from '~/utils/newRow'

/** Persist row-read state per maintenance list and per user. */
export const useViewedRows = (scope: string) => {
  const { user } = useAuth()
  const { acknowledgeViewedRow } = useKelolaCounts()
  const viewedIds = ref<Set<string>>(new Set())
  const acknowledgedIds = ref<Set<string>>(new Set())
  const storageKey = computed(
    () => `maintenance-viewed:${scope}:${String(user.value?.persnum ?? user.value?.id ?? 'anonymous')}`,
  )
  const acknowledgedStorageKey = computed(
    () => `maintenance-viewed-acknowledged:${scope}:${String(user.value?.persnum ?? user.value?.id ?? 'anonymous')}`,
  )

  const load = () => {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(storageKey.value)
      const ids = stored ? JSON.parse(stored) : []
      viewedIds.value = new Set(Array.isArray(ids) ? ids.map(String) : [])
      const acknowledged = localStorage.getItem(acknowledgedStorageKey.value)
      const acknowledgedRows = acknowledged ? JSON.parse(acknowledged) : []
      acknowledgedIds.value = new Set(
        Array.isArray(acknowledgedRows) ? acknowledgedRows.map(String) : [],
      )
    } catch {
      viewedIds.value = new Set()
      acknowledgedIds.value = new Set()
    }
  }

  const isViewed = (item: { id?: string | number } | null | undefined) =>
    !!item?.id && viewedIds.value.has(String(item.id))

  const markViewed = (item: { id?: string | number } | null | undefined) => {
    if (!import.meta.client || !item?.id) return
    const id = String(item.id)
    const next = new Set(viewedIds.value)
    next.add(id)
    viewedIds.value = next
    try {
      localStorage.setItem(storageKey.value, JSON.stringify([...next]))
    } catch {
      // Keep the in-memory state even if browser storage is unavailable.
    }

    if (!acknowledgedIds.value.has(id)) {
      const nextAcknowledged = new Set(acknowledgedIds.value)
      nextAcknowledged.add(id)
      acknowledgedIds.value = nextAcknowledged
      try {
        localStorage.setItem(acknowledgedStorageKey.value, JSON.stringify([...nextAcknowledged]))
      } catch {
        // Keep the in-memory state even if browser storage is unavailable.
      }
      acknowledgeViewedRow(scope)
    }
  }

  const rowClass = (item: any) => isViewed(item) ? '' : newRowClass(item)

  watch([storageKey, acknowledgedStorageKey], load)
  onMounted(load)

  return { isViewed, markViewed, rowClass }
}
