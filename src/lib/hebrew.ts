import { HDate } from '@hebcal/core'
import type { HebrewDate } from '@/types'

/**
 * Returns the current Hebrew date.
 */
export function getHebrewDate(): HebrewDate {
  const hdate = new HDate()
  return buildHebrewDate(hdate)
}

/**
 * Returns the Hebrew date for a given Gregorian date.
 */
export function getHebrewDateFor(date: Date): HebrewDate {
  const hdate = new HDate(date)
  return buildHebrewDate(hdate)
}

function buildHebrewDate(hdate: HDate): HebrewDate {
  const year = hdate.getFullYear()
  const day = hdate.getDate()
  const monthName = hdate.getMonthName()

  return {
    year,
    monthName,
    day,
    formatted: `${day} ${monthName} ${year}`,
  }
}
