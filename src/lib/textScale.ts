// ─── Text Size ───────────────────────────────────────────────────────────────
// A per-user percentage applied to all app text via the --text-scale CSS
// variable (see tailwind.config.js). Built on rem, so it stacks on top of
// any larger text size the person already set in their browser or phone.
// 200% is the WCAG 1.4.4 "resize text" level.

export type TextScale = 90 | 100 | 115 | 130 | 150 | 200

export const TEXT_SCALES: Array<{ value: TextScale; label: string }> = [
  { value: 90,  label: 'Small' },
  { value: 100, label: 'Default' },
  { value: 115, label: 'Large' },
  { value: 130, label: 'Extra Large' },
  { value: 150, label: 'Largest' },
  { value: 200, label: 'Maximum (200%)' },
]

const STORAGE_KEY = '8hope-text-scale'

export function isTextScale(value: unknown): value is TextScale {
  return TEXT_SCALES.some((s) => s.value === value)
}

/** Applies the scale to the page and remembers it on this device. */
export function applyTextScale(scale: TextScale): void {
  document.documentElement.style.setProperty('--text-scale', String(scale / 100))
  try {
    localStorage.setItem(STORAGE_KEY, String(scale))
  } catch {
    // Private mode / blocked storage — the account setting still applies after sign-in.
  }
}

/**
 * Restores this device's last text size before first render, so the
 * sign-in screen and the moment before the profile loads aren't jarring.
 */
export function restoreTextScale(): void {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    if (isTextScale(stored)) document.documentElement.style.setProperty('--text-scale', String(stored / 100))
  } catch {
    // Default size.
  }
}
