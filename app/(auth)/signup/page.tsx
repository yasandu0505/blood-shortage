'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { signup } from '@/app/actions/auth'
import { getCenters } from '@/app/actions/shortages'
import { useToast } from '@/components/ui/use-toast'
import { Database } from '@/lib/supabase/types'

type Center = Database['public']['Tables']['centers']['Row']

type Role = 'blood_bank' | 'official' | ''

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [centers, setCenters] = useState<Center[]>([])
  const [loadingCenters, setLoadingCenters] = useState(true)
  const [role, setRole] = useState<Role>('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    // For blood bank (center creation)
    centerName: '',
    district: '',
    address: '',
    phone: '',
    // For official (center selection)
    center_id: '',
  })

  useEffect(() => {
    // Only load centers if role is official
    if (role === 'official') {
      loadCenters()
    }
  }, [role])

  const loadCenters = async () => {
    setLoadingCenters(true)
    const result = await getCenters()
    if (result.data) {
      setCenters(result.data)
    } else if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to load centers. Please refresh the page.',
        variant: 'destructive',
      })
    }
    setLoadingCenters(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    // Validate role selected
    if (!role) {
      toast({
        title: 'Error',
        description: 'Please select an account type',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // Validate based on role
    if (role === 'blood_bank') {
      if (!formData.centerName || !formData.district) {
        toast({
          title: 'Error',
          description: 'Please fill in center name and district',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
    } else if (role === 'official') {
      if (!formData.center_id) {
        toast({
          title: 'Error',
          description: 'Please select a blood center',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
    }

    const submitFormData = new FormData()
    submitFormData.append('email', formData.email)
    submitFormData.append('password', formData.password)
    submitFormData.append('role', role)

    if (role === 'blood_bank') {
      submitFormData.append('center_name', formData.centerName)
      submitFormData.append('district', formData.district)
      submitFormData.append('address', formData.address)
      submitFormData.append('phone', formData.phone)
    } else if (role === 'official') {
      submitFormData.append('center_id', formData.center_id)
    }

    const result = await signup(submitFormData)

    if (result?.error) {
      toast({
        title: 'Signup failed',
        description: result.error,
        variant: 'destructive',
      })
      setLoading(false)
    } else {
      toast({
        title: 'Success',
        description: result?.message || 'Account created successfully!',
      })

      // Show message about email confirmation if needed
      if (result?.requiresEmailConfirmation) {
        toast({
          title: 'Email verification required',
          description: 'Please check your email and click the verification link before signing in.',
        })
      }

      // Reset loading state
      setLoading(false)
      
      // Redirect to login immediately
      router.push('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up as a Blood Bank or Official
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as Role)}
                required
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blood_bank">Blood Bank</SelectItem>
                  <SelectItem value="official">Official</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'blood_bank'
                  ? 'Create a new blood bank center'
                  : role === 'official'
                  ? 'Join an existing blood bank center'
                  : 'Select your account type'}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={loading}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* Blood Bank: Center Creation Fields */}
            {role === 'blood_bank' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold text-sm">Blood Bank Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="centerName">Center Name *</Label>
                  <Input
                    id="centerName"
                    type="text"
                    placeholder="e.g., National Blood Transfusion Service"
                    required
                    disabled={loading}
                    value={formData.centerName}
                    onChange={(e) =>
                      setFormData({ ...formData, centerName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    type="text"
                    placeholder="e.g., Colombo"
                    required
                    disabled={loading}
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Full address"
                    disabled={loading}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+94 XX XXX XXXX"
                    disabled={loading}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Official: Center Selection */}
            {role === 'official' && (
              <div className="space-y-2">
                <Label htmlFor="center_id">Blood Center *</Label>
                <Select
                  value={formData.center_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, center_id: value })
                  }
                  required
                  disabled={loading || loadingCenters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood center" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCenters ? (
                      <SelectItem value="loading" disabled>
                        Loading centers...
                      </SelectItem>
                    ) : centers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No centers available
                      </SelectItem>
                    ) : (
                      centers.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name} - {center.district}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {centers.length === 0
                    ? 'No blood bank centers available. Please ask a blood bank to create an account first.'
                    : 'Select the blood bank center you work for'}
                </p>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                disabled={loading}
                minLength={6}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                disabled={loading}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !role}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-center text-muted-foreground">
            {role === 'blood_bank'
              ? 'You will become the administrator of your blood bank center.'
              : role === 'official'
              ? 'You will be able to post and manage shortages for your center.'
              : 'By creating an account, you confirm that you are authorized.'}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
