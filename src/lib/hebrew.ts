import { HDate, months } from '@hebcal/core'
import type { HebrewDate } from '@/types'

/**
 * Returns the current Hebrew date.
 */
export function getHebrewDate(): HebrewDate {
  const hdate = new HDate()

  const monthName = months[hdate.getMonth() - 1] ?? hdate.getMonthName()
  const year = hdate.getFullYear()
  const day = hdate.getDate()

  return {
    year,
    monthName,
    day,
    formatted: `${day} ${monthName} ${year}`,
  }
}

/**
 * Returns the Hebrew month name for a given Gregorian date.
 */
export function getHebrewDateFor(date: Date): HebrewDate {
  const hdate = new HDate(date)

  const monthName = months[hdate.getMonth() - 1] ?? hdate.getMonthName()
  const year = hdate.getFullYear()
  const day = hdate.getDate()

  return {
    year,
    monthName,
    day,
    formatted: `${day} ${monthName} ${year}`,
  }
}
