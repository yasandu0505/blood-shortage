'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function sendOTP(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'OTP sent to your email' }
}

export async function verifyOTP(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    token: formData.get('token') as string,
  }

  const { error } = await supabase.auth.verifyOtp({
    email: data.email,
    token: data.token,
    type: 'email',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const role = formData.get('role') as 'blood_bank' | 'official'
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate password
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  let centerId: string

  // Handle Blood Bank flow: Create center first
  if (role === 'blood_bank') {
    const centerFormData = new FormData()
    centerFormData.append('name', formData.get('center_name') as string)
    centerFormData.append('district', formData.get('district') as string)
    centerFormData.append('address', formData.get('address') as string || '')
    centerFormData.append('phone', formData.get('phone') as string || '')

    // Import createCenter dynamically to avoid circular dependency
    const { createCenter } = await import('@/app/actions/centers')
    const centerResult = await createCenter(centerFormData)

    if (centerResult.error || !centerResult.data) {
      return { error: centerResult.error || 'Failed to create blood bank center' }
    }

    centerId = centerResult.data.id
  } else if (role === 'official') {
    // Official flow: Validate center exists
    centerId = formData.get('center_id') as string

    if (!centerId) {
      return { error: 'Please select a blood bank center' }
    }

    // Verify center exists
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .select('id')
      .eq('id', centerId)
      .single()

    if (centerError || !center) {
      return { error: 'Selected blood bank center does not exist' }
    }
  } else {
    return { error: 'Invalid account type. Please select Blood Bank or Official.' }
  }

  // Create user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account' }
  }

  // Link user to center using database function
  // Blood Bank: explicitly set as admin
  // Official: explicitly set as editor
  const userRole = role === 'blood_bank' ? 'admin' : 'editor'

  const { data: linkResult, error: linkError } = await supabase.rpc(
    'link_user_to_center',
    {
      p_user_id: authData.user.id,
      p_center_id: centerId,
      p_role: userRole,
    }
  )

  if (linkError) {
    console.error('Failed to link user to center:', linkError)
    console.error('User ID:', authData.user.id)
    console.error('Center ID:', centerId)
    console.error('Role:', userRole)
    return {
      error: `Failed to link account to center: ${linkError.message}. Please contact an administrator.`,
    }
  }

  // Verify the link was created by checking the database
  const { data: verifyLink, error: verifyError } = await supabase
    .from('user_centers')
    .select('id, role')
    .eq('user_id', authData.user.id)
    .eq('center_id', centerId)
    .single()

  if (verifyError || !verifyLink) {
    console.error('Failed to verify center link:', verifyError)
    return {
      error: 'Account created but center linking verification failed. Please contact an administrator.',
    }
  }

  console.log('Center link verified:', verifyLink)

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')

  // Check if email confirmation is required
  if (authData.user.email_confirmed_at === null) {
    return {
      success: true,
      message: 'Account created! Please check your email to verify your account before signing in.',
      requiresEmailConfirmation: true,
    }
  }

  return {
    success: true,
    message: 'Account created successfully! You can now sign in.',
    requiresEmailConfirmation: false,
  }
}

