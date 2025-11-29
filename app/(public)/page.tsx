'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getShortages, getCenters } from '@/app/actions/shortages'
import { ShortageCard } from '@/components/shortage-card'
import { ShortageFilter } from '@/components/shortage-filter'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Database } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'
import { LogIn, Droplet } from 'lucide-react'

type Shortage = Database['public']['Tables']['shortages']['Row'] & {
  centers: Database['public']['Tables']['centers']['Row'] | null
}

export default function PublicDashboard() {
  const router = useRouter()
  const [shortages, setShortages] = useState<Shortage[]>([])
  const [filteredShortages, setFilteredShortages] = useState<Shortage[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    bloodType: '',
    district: '',
    status: '',
  })

  useEffect(() => {
    loadData()
    setupRealtime()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [shortages, searchQuery, filters])

  const loadData = async () => {
    setLoading(true)
    const [shortagesResult, centersResult] = await Promise.all([
      getShortages(),
      getCenters(),
    ])

    if (shortagesResult.data) {
      setShortages(shortagesResult.data as Shortage[])
    }

    if (centersResult.data) {
      const uniqueDistricts = Array.from(
        new Set(centersResult.data.map((c) => c.district))
      )
      setDistricts(uniqueDistricts.sort())
    }

    setLoading(false)
  }

  const setupRealtime = () => {
    const supabase = createClient()

    const channel = supabase
      .channel('shortages-changes')
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

  const applyFilters = () => {
    let filtered = [...shortages]

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s) => {
        const center = s.centers
        return (
          center?.name.toLowerCase().includes(query) ||
          center?.district.toLowerCase().includes(query) ||
          center?.address?.toLowerCase().includes(query) ||
          s.blood_type.toLowerCase().includes(query)
        )
      })
    }

    // Apply blood type filter
    if (filters.bloodType && filters.bloodType !== 'all') {
      filtered = filtered.filter((s) => s.blood_type === filters.bloodType)
    }

    // Apply district filter
    if (filters.district && filters.district !== 'all') {
      filtered = filtered.filter(
        (s) => s.centers?.district === filters.district
      )
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((s) => s.status === filters.status)
    }

    setFilteredShortages(filtered)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }))
  }

  const clearFilters = () => {
    setFilters({ bloodType: '', district: '', status: '' })
    setSearchQuery('')
  }

  const criticalCount = filteredShortages.filter((s) => s.status === 'critical').length
  const lowCount = filteredShortages.filter((s) => s.status === 'low').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplet className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sri Lanka Blood Shortage Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time blood shortage information across the country
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/login')} variant="outline">
              <LogIn className="h-4 w-4 mr-2" />
              Blood Bank Login
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Banner */}
        {(criticalCount > 0 || lowCount > 0) && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-4">
              {criticalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-600 rounded-full"></div>
                  <span className="font-semibold">
                    {criticalCount} Critical {criticalCount === 1 ? 'Shortage' : 'Shortages'}
                  </span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold">
                    {lowCount} Low {lowCount === 1 ? 'Shortage' : 'Shortages'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ShortageFilter
            bloodType={filters.bloodType}
            district={filters.district}
            status={filters.status}
            onBloodTypeChange={(value) => handleFilterChange('bloodType', value)}
            onDistrictChange={(value) => handleFilterChange('district', value)}
            onStatusChange={(value) => handleFilterChange('status', value)}
            onClear={clearFilters}
            districts={districts}
          />
        </div>

        {/* Shortages List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading shortages...</p>
          </div>
        ) : filteredShortages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {shortages.length === 0
                ? 'No blood shortages reported at this time.'
                : 'No shortages match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShortages.map((shortage) => (
              <ShortageCard key={shortage.id} shortage={shortage} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 border-t bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Data provided by the National Blood Transfusion Service (NBTS) and
            authorized blood banks across Sri Lanka
          </p>
        </div>
      </footer>
    </div>
  )
}

