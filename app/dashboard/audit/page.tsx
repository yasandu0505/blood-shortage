'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuditLogs, getCentersForAudit } from '@/app/actions/audit'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Database } from '@/lib/supabase/types'
import { ArrowLeft, Calendar, User, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type AuditLog = Database['public']['Tables']['audit_logs']['Row'] & {
  centers: Database['public']['Tables']['centers']['Row'] | null
}

export default function AuditLogPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [centers, setCenters] = useState<Array<{ id: string; name: string; district: string }>>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    centerId: '',
    action: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadCenters()
    loadLogs()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [filters])

  const loadCenters = async () => {
    const result = await getCentersForAudit()
    if (result.data) {
      setCenters(result.data as Array<{ id: string; name: string; district: string }>)
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    const result = await getAuditLogs({
      centerId: filters.centerId || undefined,
      action: filters.action || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    })

    if (result.error) {
      console.error(result.error)
      if (result.error.includes('Only admins')) {
        router.push('/dashboard')
      }
    } else if (result.data) {
      setLogs(result.data as AuditLog[])
    }

    setLoading(false)
  }

  const actionColors = {
    create: 'bg-green-500',
    update: 'bg-blue-500',
    delete: 'bg-red-500',
  }

  const actionLabels = {
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Center</Label>
                <Select
                  value={filters.centerId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, centerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All centers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All centers</SelectItem>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} - {center.district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) =>
                    setFilters({ ...filters, action: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No audit logs found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={actionColors[log.action]}>
                        {actionLabels[log.action]}
                      </Badge>
                      <span className="text-sm font-medium">{log.table_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    {log.centers && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {log.centers.name} - {log.centers.district}
                        </span>
                      </div>
                    )}

                    {log.user_id && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{log.user_id.slice(0, 8)}...</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {(log.old_data || log.new_data) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.old_data && (
                        <div className="bg-muted p-3 rounded text-xs">
                          <div className="font-semibold mb-2">Before:</div>
                          <pre className="whitespace-pre-wrap overflow-auto">
                            {JSON.stringify(log.old_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div className="bg-muted p-3 rounded text-xs">
                          <div className="font-semibold mb-2">After:</div>
                          <pre className="whitespace-pre-wrap overflow-auto">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

