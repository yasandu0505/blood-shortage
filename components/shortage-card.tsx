'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, MapPin, Clock } from 'lucide-react'
import { Database } from '@/lib/supabase/types'

type Shortage = Database['public']['Tables']['shortages']['Row'] & {
  centers: Database['public']['Tables']['centers']['Row'] | null
}

interface ShortageCardProps {
  shortage: Shortage
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

export function ShortageCard({ shortage }: ShortageCardProps) {
  const center = shortage.centers
  const openingHours = center?.opening_hours as Record<string, string> | null

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{center?.name || 'Unknown Center'}</CardTitle>
          <Badge className={statusColors[shortage.status]}>
            {statusLabels[shortage.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary">{shortage.blood_type}</div>
          <div className="text-sm text-muted-foreground">Blood Type</div>
        </div>

        {shortage.notes && (
          <p className="text-sm text-muted-foreground">{shortage.notes}</p>
        )}

        <div className="space-y-2 pt-2 border-t">
          {center?.district && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{center.district}</span>
              {center.address && (
                <span className="text-muted-foreground">• {center.address}</span>
              )}
            </div>
          )}

          {center?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${center.phone}`}
                className="text-primary hover:underline"
              >
                {center.phone}
              </a>
            </div>
          )}

          {openingHours && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="capitalize">
                    {day}: {hours}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Updated {new Date(shortage.updated_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}

