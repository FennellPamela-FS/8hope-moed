import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Records one AI call in ai_usage for the Costs & Pricing page: feature,
 * model and token counts only — never prompts or anyone's words. Uses the
 * service role (ai_usage has no user write policy). Never throws; a failed
 * log must not break the feature.
 */
export async function logAiUsage(opts: {
  feature: string
  model: string
  userId?: string | null
  // Gemini's usageMetadata
  usage?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number }
  ok: boolean
}): Promise<void> {
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { error } = await admin.from('ai_usage').insert({
      feature: opts.feature,
      model: opts.model,
      user_id: opts.userId ?? null,
      input_tokens: opts.usage?.promptTokenCount ?? 0,
      output_tokens: opts.usage?.candidatesTokenCount ?? 0,
      thinking_tokens: opts.usage?.thoughtsTokenCount ?? 0,
      ok: opts.ok,
    })
    if (error) console.error('ai usage log failed', error)
  } catch (err) {
    console.error('ai usage log failed', err)
  }
}
