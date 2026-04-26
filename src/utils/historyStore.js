import { supabase } from '../lib/supabase'

/**
 * Save a batch history entry to Supabase.
 * Called after a successful PDF export in CalculatorPage.
 */
export async function saveHistoryEntry({ userId, productName, quantity, unit, results }) {
  const entry = {
    user_id: userId,
    product_name: productName,
    quantity,
    unit,
    results: results.map(r => ({
      rawMaterialName: r.rawMaterial?.name ?? r.rawMaterialName ?? '—',
      requiredQty: r.requiredQty,
      unit: r.unit,
    })),
  }
  const { data, error } = await supabase
    .from('batch_history')
    .insert(entry)
    .select()
    .single()
  if (error) console.error('History save error:', error)
  return data
}

/** Fetch all history entries for a user, newest first. */
export async function fetchHistory(userId) {
  const { data, error } = await supabase
    .from('batch_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('History fetch error:', error); return [] }
  return data ?? []
}

/** Delete a single history entry by id. */
export async function deleteHistoryEntry(id) {
  const { error } = await supabase.from('batch_history').delete().eq('id', id)
  if (error) console.error('History delete error:', error)
}

/** Delete all history entries for a user. */
export async function clearHistory(userId) {
  const { error } = await supabase.from('batch_history').delete().eq('user_id', userId)
  if (error) console.error('History clear error:', error)
}
