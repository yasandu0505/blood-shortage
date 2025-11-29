'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

export async function getAuditLogs(filters?: {
  centerId?: string
  action?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  // Check if user is admin
  const { data: userCenter } = await supabase
    .from('user_centers')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userCenter || userCenter.role !== 'admin') {
    return { error: 'Only admins can view audit logs', data: null }
  }

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      centers (
        id,
        name,
        district
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(100)

  if (filters?.centerId) {
    query = query.eq('center_id', filters.centerId)
  }

  if (filters?.action) {
    query = query.eq('action', filters.action)
  }

  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('timestamp', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getCentersForAudit() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('centers')
    .select('id, name, district')
    .order('name', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

