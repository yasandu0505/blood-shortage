'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getShortagesByCenter,
  getUserCenter,
  getOfficialsForCenter,
} from '@/app/actions/shortages'
import { signOut } from '@/app/actions/auth'
import { ShortageList } from '@/components/shortage-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/lib/supabase/types'
import { LogOut, Building2, User, FileText, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Shortage = Database['public']['Tables']['shortages']['Row']
type UserCenter = Database['public']['Tables']['user_centers']['Row'] & {
  centers: Database['public']['Tables']['centers']['Row'] | null
}
type Official = Database['public']['Tables']['user_centers']['Row']

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [shortages, setShortages] = useState<Shortage[]>([])
  const [officials, setOfficials] = useState<Official[]>([])
  const [userCenter, setUserCenter] = useState<UserCenter | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'shortages' | 'officials'>('shortages')

  useEffect(() => {
    loadData()
    setupRealtime()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const centerResult = await getUserCenter()

    if (centerResult.error || !centerResult.data) {
      if (
        centerResult.error &&
        !centerResult.error.includes('No center assigned')
      ) {
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

    // Load shortages
    const shortagesResult = await getShortagesByCenter(
      centerResult.data.center_id
    )

    if (shortagesResult.error) {
      toast({
        title: 'Error',
        description: shortagesResult.error,
        variant: 'destructive',
      })
    } else if (shortagesResult.data) {
      setShortages(shortagesResult.data)
    }

    // Load officials if user is admin
    if (centerResult.data.role === 'admin') {
      const officialsResult = await getOfficialsForCenter(
        centerResult.data.center_id
      )

      if (officialsResult.error) {
        // Don't show error for non-admins trying to view officials
        if (!officialsResult.error.includes('Only admins')) {
          console.error('Error loading officials:', officialsResult.error)
        }
      } else if (officialsResult.data) {
        setOfficials(officialsResult.data)
      }
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
  }

  const center = userCenter?.centers
  const isAdmin = userCenter?.role === 'admin'

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
              {isAdmin && (
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
        {/* Center Information */}
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

        {/* Tabs for Admin */}
        {isAdmin && (
          <div className="mb-6 flex gap-2 border-b">
            <Button
              variant={activeTab === 'shortages' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('shortages')}
              className="rounded-b-none"
            >
              Blood Shortages
            </Button>
            <Button
              variant={activeTab === 'officials' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('officials')}
              className="rounded-b-none"
            >
              <Users className="h-4 w-4 mr-2" />
              Officials ({officials.length})
            </Button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'shortages' || !isAdmin ? (
          <ShortageList
            shortages={shortages}
            onRefresh={loadData}
            canDelete={isAdmin}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Officials</CardTitle>
            </CardHeader>
            <CardContent>
              {officials.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No officials registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {officials.map((official) => (
                    <div
                      key={official.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            User ID: {official.user_id.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Role: {official.role} • Joined:{' '}
                            {new Date(official.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          official.role === 'admin' ? 'default' : 'secondary'
                        }
                      >
                        {official.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
