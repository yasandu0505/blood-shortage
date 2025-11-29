'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Login function - works for both Blood Bank and Official accounts
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to sign in' }
  }

  // Verify user has a center assigned
  const { data: userCenter, error: centerError } = await supabase
    .from('user_centers')
    .select('id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (centerError) {
    console.error('Error checking center assignment:', centerError)
  }

  if (!userCenter) {
    await supabase.auth.signOut()
    return {
      error: 'No center assigned to your account. Please contact an administrator.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

import { createAdminClient } from '@/lib/supabase/admin'
import { UserRole } from '@/lib/supabase/types'

/**
 * Signup function - handles both Blood Bank and Official account creation
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()
  // Create admin client for privileged operations (center creation, linking)
  const adminSupabase = createAdminClient()

  const role = formData.get('role') as 'blood_bank' | 'official'
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate inputs
  if (!role || (role !== 'blood_bank' && role !== 'official')) {
    return { error: 'Please select a valid account type' }
  }

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  let centerId: string
  let centerName: string = ''

  // Step 1: Handle center creation/selection based on role
  if (role === 'blood_bank') {
    // Blood Bank: Create new center
    const centerNameInput = formData.get('center_name') as string
    const district = formData.get('district') as string

    if (!centerNameInput || !district) {
      return { error: 'Center name and district are required' }
    }

    centerName = centerNameInput

    // Create center using admin client to bypass RLS
    const { data: centerData, error: centerError } = await adminSupabase
      .from('centers')
      .insert({
        name: centerNameInput,
        district: district,
        address: (formData.get('address') as string) || null,
        phone: (formData.get('phone') as string) || null,
      } as any)
      .select()
      .single()

    if (centerError || !centerData) {
      console.error('Failed to create center:', centerError)
      return {
        error: centerError?.message || 'Failed to create blood bank center',
      }
    }

    centerId = (centerData as any).id
  } else {
    // Official: Select existing center
    centerId = formData.get('center_id') as string

    if (!centerId) {
      return { error: 'Please select a blood bank center' }
    }

    // Verify center exists
    const { data: center, error: centerError } = await supabase
      .from('centers')
      .select('id, name')
      .eq('id', centerId)
      .single()

    if (centerError || !center) {
      return { error: 'Selected blood bank center does not exist' }
    }

    centerName = center.name
  }

  // Step 2: Create user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account' }
  }

  // Step 3: Link user to center using admin client
  const userRole = role === 'blood_bank' ? 'admin' : 'editor'

  // Check if this is the first user for the center (if official joining existing center)
  // If blood bank, we just created the center so they are definitely the first/admin

  // We can use the RPC or direct insert. Direct insert is safer with admin client.
  const { error: linkError } = await adminSupabase
    .from('user_centers')
    .insert({
      user_id: authData.user.id,
      center_id: centerId,
      role: userRole,
    } as any)

  if (linkError) {
    console.error('Failed to link user to center:', {
      error: linkError,
      userId: authData.user.id,
      centerId,
      role: userRole,
    })
    // Try to rollback user creation if possible, or just report error
    // Deleting user requires admin client
    await adminSupabase.auth.admin.deleteUser(authData.user.id)

    return {
      error: `Failed to link account to center: ${linkError.message}`,
    }
  }

  // Success
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'layout')

  const requiresEmailConfirmation = authData.user.identities && authData.user.identities.length > 0 && !authData.user.email_confirmed_at

  if (!requiresEmailConfirmation) {
    // If no email confirmation required, we can redirect to dashboard
    redirect('/dashboard')
  }

  return {
    success: true,
    message: 'Account created! Please check your email to verify your account before signing in.',
    requiresEmailConfirmation: true,
    centerName,
  }
}

/**
 * Sign out function
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Send OTP for passwordless login
 */
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

/**
 * Verify OTP for passwordless login
 */
export async function verifyOTP(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email: formData.get('email') as string,
    token: formData.get('token') as string,
    type: 'email',
  })

  if (error) {
    return { error: error.message }
  }

  // Verify user has center assigned
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userCenter } = await supabase
      .from('user_centers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!userCenter) {
      await supabase.auth.signOut()
      return {
        error: 'No center assigned to your account. Please contact an administrator.',
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
