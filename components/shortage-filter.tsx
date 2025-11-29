'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ShortageFilterProps {
  bloodType?: string
  district?: string
  status?: string
  onBloodTypeChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClear: () => void
  districts: string[]
}

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const statuses = ['critical', 'low', 'normal']

export function ShortageFilter({
  bloodType,
  district,
  status,
  onBloodTypeChange,
  onDistrictChange,
  onStatusChange,
  onClear,
  districts,
}: ShortageFilterProps) {
  const hasFilters = bloodType || district || status

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[150px]">
        <label className="text-sm font-medium mb-2 block">Blood Type</label>
        <Select value={bloodType || 'all'} onValueChange={onBloodTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All blood types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All blood types</SelectItem>
            {bloodTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="text-sm font-medium mb-2 block">District</label>
        <Select value={district || 'all'} onValueChange={onDistrictChange}>
          <SelectTrigger>
            <SelectValue placeholder="All districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Select value={status || 'all'} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="outline" onClick={onClear} className="mb-0">
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}

