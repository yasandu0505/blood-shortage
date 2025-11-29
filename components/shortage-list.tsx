'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database } from '@/lib/supabase/types'
import { deleteShortage } from '@/app/actions/shortages'
import { useToast } from '@/components/ui/use-toast'
import { Edit, Trash2, Plus } from 'lucide-react'
import { ShortageForm } from './shortage-form'

type Shortage = Database['public']['Tables']['shortages']['Row']

interface ShortageListProps {
  shortages: Shortage[]
  onRefresh: () => void
  canDelete: boolean
}

const statusColors = {
  critical: 'bg-red-500 hover:bg-red-600 text-white',
  low: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  normal: 'bg-green-500 hover:bg-green-600 text-white',
}

const statusLabels = {
  critical: 'Critical',
  low: 'Low',
  normal: 'Normal',
}

export function ShortageList({
  shortages,
  onRefresh,
  canDelete,
}: ShortageListProps) {
  const { toast } = useToast()
  const [editingShortage, setEditingShortage] = useState<Shortage | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shortage?')) {
      return
    }

    setDeletingId(id)
    const result = await deleteShortage(id)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Deleted',
        description: 'Shortage deleted successfully',
      })
      onRefresh()
    }

    setDeletingId(null)
  }

  const handleEdit = (shortage: Shortage) => {
    setEditingShortage(shortage)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingShortage(null)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    onRefresh()
    setIsFormOpen(false)
    setEditingShortage(null)
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blood Shortages</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Shortage
        </Button>
      </div>

      {shortages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No shortages reported yet. Create your first shortage entry.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortages.map((shortage) => (
            <Card key={shortage.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{shortage.blood_type}</CardTitle>
                  <Badge className={statusColors[shortage.status]}>
                    {statusLabels[shortage.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {shortage.notes && (
                  <p className="text-sm text-muted-foreground">{shortage.notes}</p>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(shortage.created_at).toLocaleString()}
                  <br />
                  Updated: {new Date(shortage.updated_at).toLocaleString()}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(shortage)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(shortage.id)}
                      disabled={deletingId === shortage.id}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShortageForm
        shortage={editingShortage}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />
    </>
  )
}

