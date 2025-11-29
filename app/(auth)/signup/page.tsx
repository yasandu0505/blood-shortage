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

type AccountType = 'blood_bank' | 'official' | ''

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('')
  const [centers, setCenters] = useState<Center[]>([])
  const [loadingCenters, setLoadingCenters] = useState(false)

  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [centerName, setCenterName] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCenterId, setSelectedCenterId] = useState('')

  // Load centers when official account type is selected
  useEffect(() => {
    if (accountType === 'official') {
      loadCenters()
    }
  }, [accountType])

  const loadCenters = async () => {
    setLoadingCenters(true)
    const result = await getCenters()
    if (result.data) {
      setCenters(result.data)
    } else if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to load blood bank centers',
        variant: 'destructive',
      })
    }
    setLoadingCenters(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!accountType) {
      toast({
        title: 'Error',
        description: 'Please select an account type',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (accountType === 'blood_bank') {
      if (!centerName || !district) {
        toast({
          title: 'Error',
          description: 'Center name and district are required',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
    } else {
      if (!selectedCenterId) {
        toast({
          title: 'Error',
          description: 'Please select a blood bank center',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }
    }

    // Submit
    const formData = new FormData()
    formData.append('role', accountType)
    formData.append('email', email)
    formData.append('password', password)

    if (accountType === 'blood_bank') {
      formData.append('center_name', centerName)
      formData.append('district', district)
      formData.append('address', address)
      formData.append('phone', phone)
    } else {
      formData.append('center_id', selectedCenterId)
    }

    const result = await signup(formData)

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

      if (result?.requiresEmailConfirmation) {
        toast({
          title: 'Email verification required',
          description: 'Please check your email and verify your account before signing in.',
        })
      }

      setLoading(false)
      router.push('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up as a Blood Bank or Official
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={accountType}
                onValueChange={(value) => setAccountType(value as AccountType)}
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
                {accountType === 'blood_bank'
                  ? 'Create a new blood bank center'
                  : accountType === 'official'
                  ? 'Join an existing blood bank center'
                  : 'Select your account type'}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Blood Bank: Center Creation Fields */}
            {accountType === 'blood_bank' && (
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
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
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
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Full address"
                    disabled={loading}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+94 XX XXX XXXX"
                    disabled={loading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Official: Center Selection */}
            {accountType === 'official' && (
              <div className="space-y-2">
                <Label htmlFor="center_id">Blood Bank Center *</Label>
                <Select
                  value={selectedCenterId}
                  onValueChange={setSelectedCenterId}
                  required
                  disabled={loading || loadingCenters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood bank center" />
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
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                required
                disabled={loading}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !accountType}>
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
            {accountType === 'blood_bank'
              ? 'You will become the administrator of your blood bank center.'
              : accountType === 'official'
              ? 'You will be able to post and manage shortages for your center.'
              : 'By creating an account, you confirm that you are authorized.'}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
