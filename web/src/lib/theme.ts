export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'cubr-theme'

/** The theme to actually render, given a preference and the OS setting. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

/** What the toggle should switch to from the currently resolved theme. */
export function toggledTheme(resolved: ResolvedTheme): ResolvedTheme {
  return resolved === 'dark' ? 'light' : 'dark'
}

export function parseThemePreference(raw: string | null): ThemePreference {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
}

export function loadThemePreference(
  storage: Pick<Storage, 'getItem'> | null,
): ThemePreference {
  try {
    return parseThemePreference(storage?.getItem(THEME_STORAGE_KEY) ?? null)
  } catch {
    return 'system'
  }
}

export function saveThemePreference(
  storage: Pick<Storage, 'setItem'> | null,
  preference: ThemePreference,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Private mode / storage disabled: theme still applies for the session.
  }
}
