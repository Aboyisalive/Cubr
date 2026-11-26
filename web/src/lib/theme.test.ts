import { describe, expect, it } from 'vitest'
import {
  loadThemePreference,
  parseThemePreference,
  resolveTheme,
  saveThemePreference,
  toggledTheme,
  THEME_STORAGE_KEY,
} from './theme'

describe('resolveTheme', () => {
  it('follows the system preference when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('explicit preference wins over the system', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
})

describe('toggledTheme', () => {
  it('flips the resolved theme', () => {
    expect(toggledTheme('dark')).toBe('light')
    expect(toggledTheme('light')).toBe('dark')
  })
})

describe('parseThemePreference', () => {
  it('accepts the three preferences and defaults anything else to system', () => {
    expect(parseThemePreference('light')).toBe('light')
    expect(parseThemePreference('dark')).toBe('dark')
    expect(parseThemePreference('system')).toBe('system')
    expect(parseThemePreference(null)).toBe('system')
    expect(parseThemePreference('sepia')).toBe('system')
  })
})

describe('storage round-trip', () => {
  function memoryStorage() {
    const map = new Map<string, string>()
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      map,
    }
  }

  it('saves and loads a preference', () => {
    const storage = memoryStorage()
    expect(loadThemePreference(storage)).toBe('system')
    saveThemePreference(storage, 'dark')
    expect(storage.map.get(THEME_STORAGE_KEY)).toBe('dark')
    expect(loadThemePreference(storage)).toBe('dark')
  })

  it('survives broken storage', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadThemePreference(broken)).toBe('system')
    expect(() => saveThemePreference(broken, 'dark')).not.toThrow()
    expect(loadThemePreference(null)).toBe('system')
  })
})
