'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Database } from '@/lib/supabase/types'
import { createShortage, updateShortage } from '@/app/actions/shortages'
import { useToast } from '@/components/ui/use-toast'

type Shortage = Database['public']['Tables']['shortages']['Row']

interface ShortageFormProps {
  shortage?: Shortage | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const statuses = [
  { value: 'critical', label: 'Critical' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
]

export function ShortageForm({
  shortage,
  open,
  onOpenChange,
  onSuccess,
}: ShortageFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    blood_type: '',
    status: 'normal' as 'critical' | 'low' | 'normal',
    notes: '',
  })

  useEffect(() => {
    if (shortage) {
      setFormData({
        blood_type: shortage.blood_type,
        status: shortage.status,
        notes: shortage.notes || '',
      })
    } else {
      setFormData({
        blood_type: '',
        status: 'normal',
        notes: '',
      })
    }
  }, [shortage, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData()
    form.append('blood_type', formData.blood_type)
    form.append('status', formData.status)
    form.append('notes', formData.notes)

    let result
    if (shortage) {
      result = await updateShortage(shortage.id, form)
    } else {
      result = await createShortage(form)
    }

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: shortage ? 'Updated' : 'Created',
        description: `Shortage ${shortage ? 'updated' : 'created'} successfully`,
      })
      onSuccess()
      onOpenChange(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {shortage ? 'Update Shortage' : 'Create New Shortage'}
            </DialogTitle>
            <DialogDescription>
              {shortage
                ? 'Update the blood shortage information for your center.'
                : 'Report a new blood shortage for your center.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blood_type">Blood Type *</Label>
              <Select
                value={formData.blood_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, blood_type: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'critical' | 'low' | 'normal') =>
                  setFormData({ ...formData, status: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional information..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.blood_type}>
              {loading
                ? 'Saving...'
                : shortage
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

