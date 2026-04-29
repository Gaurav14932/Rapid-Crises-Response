'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { EmergencyCase, Assignment } from '@/lib/types'
import { STATUS_CONFIG, EMERGENCY_TYPE_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CaseTrackerProps {
  emergencyCase: EmergencyCase
  assignment?: Assignment | null
  onCancel?: () => void
}

export function CaseTracker({ emergencyCase, assignment, onCancel }: CaseTrackerProps) {
  const statusConfig = STATUS_CONFIG[emergencyCase.status]
  const typeConfig = EMERGENCY_TYPE_CONFIG[emergencyCase.type]
  
  const steps = [
    { key: 'reported', label: 'Reported', completed: true },
    { key: 'assigned', label: 'Assigned', completed: ['assigned', 'en_route', 'on_scene', 'resolved'].includes(emergencyCase.status) },
    { key: 'en_route', label: 'En Route', completed: ['en_route', 'on_scene', 'resolved'].includes(emergencyCase.status) },
    { key: 'on_scene', label: 'On Scene', completed: ['on_scene', 'resolved'].includes(emergencyCase.status) },
    { key: 'resolved', label: 'Resolved', completed: emergencyCase.status === 'resolved' },
  ]

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m ago`
  }

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Case #{emergencyCase.id.slice(0, 8)}
          </span>
        </div>
        <CardTitle className="text-lg">Emergency Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="relative flex justify-between">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted" />
          <div 
            className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500" 
            style={{ 
              width: `${(steps.filter(s => s.completed).length - 1) / (steps.length - 1) * 100}%` 
            }}
          />
          
          {steps.map((step, i) => (
            <div key={step.key} className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background text-xs font-bold transition-all',
                  step.completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted text-muted-foreground'
                )}
              >
                {step.completed ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                'mt-2 text-xs',
                step.completed ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Case Details */}
        <div className="space-y-3 rounded-lg bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-xs text-muted-foreground">
                {emergencyCase.address || `${emergencyCase.latitude.toFixed(4)}, ${emergencyCase.longitude.toFixed(4)}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Reported At</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(emergencyCase.created_at)} ({getTimeSince(emergencyCase.created_at)})
              </p>
            </div>
          </div>

          {emergencyCase.description && (
            <div className="text-sm">
              <p className="font-medium">Description</p>
              <p className="text-muted-foreground">{emergencyCase.description}</p>
            </div>
          )}
        </div>

        {/* Assigned Responder */}
        {assignment && assignment.responder && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Responder Assigned</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{assignment.responder.name}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {assignment.responder.unit_type}
                </Badge>
              </div>
              {assignment.responder.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{assignment.responder.phone}</span>
                </div>
              )}
              {assignment.eta_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ETA: {assignment.eta_minutes} minutes</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {emergencyCase.status === 'reported' && onCancel && (
          <Button
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={onCancel}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Emergency
          </Button>
        )}

        {emergencyCase.status === 'resolved' && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-success/20 p-3 text-success">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Emergency Resolved</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
