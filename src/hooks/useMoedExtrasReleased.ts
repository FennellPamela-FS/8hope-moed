import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Whether Moed's Reflection + Deeper Word Study have been released to
 * everyone (app_settings.moed_extras_released). Until then only Moed
 * reviewers see them. null while loading.
 */
export function useMoedExtrasReleased(): boolean | null {
  const [released, setReleased] = useState<boolean | null>(null)
  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'moed_extras_released')
      .maybeSingle()
      .then(({ data }) => setReleased(data?.value === true))
  }, [])
  return released
}
