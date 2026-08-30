export const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch { return fallback }
}

export const writeStorage = <T,>(key: string, value: T) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Private mode or a full quota should not break the tool. */ }
}
