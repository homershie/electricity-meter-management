export function saveState<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}

export function loadState<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error('Failed to load state:', error)
    return defaultValue
  }
}

export function removeState(key: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove state:', error)
  }
}
