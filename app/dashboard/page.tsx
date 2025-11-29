'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getShortagesByCenter, getUserCenter } from '@/app/actions/shortages'
import { signOut } from '@/app/actions/auth'
import { ShortageList } from '@/components/shortage-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/lib/supabase/types'
import { LogOut, Building2, User, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

type Shortage = Database['public']['Tables']['shortages']['Row']
type UserCenter = Database['public']['Tables']['user_centers']['Row'] & {
  centers: Database['public']['Tables']['centers']['Row'] | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [shortages, setShortages] = useState<Shortage[]>([])
  const [userCenter, setUserCenter] = useState<UserCenter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    setupRealtime()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const centerResult = await getUserCenter()

    if (centerResult.error || !centerResult.data) {
      // Don't show toast for "No center assigned" - it's already shown in the UI
      if (centerResult.error && !centerResult.error.includes('No center assigned')) {
        toast({
          title: 'Error',
          description: centerResult.error,
          variant: 'destructive',
        })
      }
      setLoading(false)
      return
    }

    setUserCenter(centerResult.data as UserCenter)

    const shortagesResult = await getShortagesByCenter(centerResult.data.center_id)

    if (shortagesResult.error) {
      toast({
        title: 'Error',
        description: shortagesResult.error,
        variant: 'destructive',
      })
    } else if (shortagesResult.data) {
      setShortages(shortagesResult.data)
    }

    setLoading(false)
  }

  const setupRealtime = () => {
    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-shortages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shortages',
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const center = userCenter?.centers
  const canDelete = userCenter?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!userCenter || !center) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Center Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your account is not linked to any blood center. Please contact
              your administrator.
            </p>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{center.name}</h1>
                <p className="text-sm text-muted-foreground">{center.district}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="capitalize">{userCenter.role}</span>
              </div>
              {canDelete && (
                <Link href="/dashboard/audit">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Button>
                </Link>
              )}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Center Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {center.address && (
                <p className="text-sm">
                  <span className="font-medium">Address:</span> {center.address}
                </p>
              )}
              {center.phone && (
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {center.phone}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <ShortageList
          shortages={shortages}
          onRefresh={loadData}
          canDelete={canDelete}
        />
      </main>
    </div>
  )
}

