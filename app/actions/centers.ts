'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type CenterInsert = Database['public']['Tables']['centers']['Insert']
type CenterUpdate = Database['public']['Tables']['centers']['Update']

export async function createCenter(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin (for admin-only center creation)
  // Or allow if no centers exist (for initial setup)
  const { data: existingCenters } = await supabase
    .from('centers')
    .select('id')
    .limit(1)

  const isFirstCenter = !existingCenters || existingCenters.length === 0

  // If not first center, require admin
  if (!isFirstCenter) {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: userCenter } = await supabase
      .from('user_centers')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userCenter || userCenter.role !== 'admin') {
      return { error: 'Only admins can create centers' }
    }
  }

  const centerData: CenterInsert = {
    name: formData.get('name') as string,
    district: formData.get('district') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    opening_hours: formData.get('opening_hours')
      ? JSON.parse(formData.get('opening_hours') as string)
      : null,
  }

  const { data, error } = await supabase
    .from('centers')
    .insert(centerData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/signup')

  // Note: User linking will happen during signup, not here
  // This allows creating centers before user account exists

  return { data, error: null }
}

export async function updateCenter(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: userCenter } = await supabase
    .from('user_centers')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userCenter || userCenter.role !== 'admin') {
    return { error: 'Only admins can update centers' }
  }

  const updateData: CenterUpdate = {
    name: formData.get('name') as string,
    district: formData.get('district') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    opening_hours: formData.get('opening_hours')
      ? JSON.parse(formData.get('opening_hours') as string)
      : null,
  }

  const { error } = await supabase
    .from('centers')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteCenter(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: userCenter } = await supabase
    .from('user_centers')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!userCenter || userCenter.role !== 'admin') {
    return { error: 'Only admins can delete centers' }
  }

  const { error } = await supabase.from('centers').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { error: null }
}

