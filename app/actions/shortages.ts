'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type ShortageInsert = Database['public']['Tables']['shortages']['Insert']
type ShortageUpdate = Database['public']['Tables']['shortages']['Update']

export async function getShortages(filters?: {
  bloodType?: string
  district?: string
  status?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('shortages')
    .select(`
      *,
      centers (
        id,
        name,
        district,
        address,
        phone,
        opening_hours
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.bloodType) {
    query = query.eq('blood_type', filters.bloodType)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.district) {
    query = query.eq('centers.district', filters.district)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getShortagesByCenter(centerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shortages')
    .select('*')
    .eq('center_id', centerId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getUserCenter() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data, error } = await supabase
    .from('user_centers')
    .select(`
      *,
      centers (
        id,
        name,
        district,
        address,
        phone,
        opening_hours
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return { error: error.message, data: null }
  }

  if (!data) {
    return { error: 'No center assigned to your account. Please contact an administrator.', data: null }
  }

  return { data, error: null }
}

export async function createShortage(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's center
  const { data: userCenter, error: centerError } = await getUserCenter()

  if (centerError || !userCenter) {
    return { error: 'No center assigned to your account' }
  }

  const shortageData: ShortageInsert = {
    center_id: userCenter.center_id,
    blood_type: formData.get('blood_type') as string,
    status: (formData.get('status') as 'critical' | 'low' | 'normal') || 'normal',
    notes: formData.get('notes') as string || null,
  }

  const { error } = await supabase.from('shortages').insert(shortageData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function updateShortage(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const updateData: ShortageUpdate = {
    blood_type: formData.get('blood_type') as string,
    status: formData.get('status') as 'critical' | 'low' | 'normal',
    notes: formData.get('notes') as string || null,
  }

  const { error } = await supabase
    .from('shortages')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteShortage(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userCenter } = await getUserCenter()

  if (!userCenter || userCenter.role !== 'admin') {
    return { error: 'Only admins can delete shortages' }
  }

  const { error } = await supabase.from('shortages').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function getCenters() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * Get all officials (users) for a specific center
 * Only admins can view this
 */
export async function getOfficialsForCenter(centerId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: null }
  }

  // Verify user is admin of this center
  const { data: userCenter } = await supabase
    .from('user_centers')
    .select('role')
    .eq('user_id', user.id)
    .eq('center_id', centerId)
    .single()

  if (!userCenter || userCenter.role !== 'admin') {
    return { error: 'Only admins can view officials', data: null }
  }

  const { data, error } = await supabase
    .from('user_centers')
    .select(`
      id,
      role,
      created_at,
      user_id,
      center_id,
      centers!inner (
        id,
        name
      )
    `)
    .eq('center_id', centerId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  // Get user emails from auth.users (we can only get user_id, not email directly)
  // For now, return the data we have
  return { data, error: null }
}

