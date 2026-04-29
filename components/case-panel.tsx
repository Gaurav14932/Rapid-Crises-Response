'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  MapPin, 
  Clock, 
  User, 
  Phone,
  AlertTriangle,
  CheckCircle,
  Truck,
  X
} from 'lucide-react'
import type { EmergencyCase, Responder, Assignment, CaseStatus } from '@/lib/types'
import { STATUS_CONFIG, EMERGENCY_TYPE_CONFIG, UNIT_TYPE_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CasePanelProps {
  cases: EmergencyCase[]
  responders: Responder[]
  selectedCase: EmergencyCase | null
  onSelectCase: (c: EmergencyCase | null) => void
  onAssignResponder: (caseId: string, responderId: string) => Promise<void>
  onUpdateStatus: (caseId: string, status: CaseStatus) => Promise<void>
}

export function CasePanel({
  cases,
  responders,
  selectedCase,
  onSelectCase,
  onAssignResponder,
  onUpdateStatus,
}: CasePanelProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedResponder, setSelectedResponder] = useState<string>('')
  
  const activeCases = cases.filter(c => !['resolved', 'cancelled'].includes(c.status))
  const availableResponders = responders.filter(r => r.availability === 'available')

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const handleAssign = async () => {
    if (!selectedCase || !selectedResponder) return
    setIsAssigning(true)
    try {
      await onAssignResponder(selectedCase.id, selectedResponder)
      setShowAssignDialog(false)
      setSelectedResponder('')
    } finally {
      setIsAssigning(false)
    }
  }

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-500/20 text-green-400 border-green-500/50'
    if (severity === 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    return 'bg-red-500/20 text-red-400 border-red-500/50'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Case List Header */}
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Incidents</h2>
          <Badge variant="outline" className="bg-emergency/20 text-emergency">
            {activeCases.length} Active
          </Badge>
        </div>
      </div>

      {/* Case List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {activeCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="mb-2 h-12 w-12 text-success/50" />
              <p className="text-muted-foreground">No active incidents</p>
            </div>
          ) : (
            activeCases.map((c) => {
              const typeConfig = EMERGENCY_TYPE_CONFIG[c.type]
              const statusConfig = STATUS_CONFIG[c.status]
              const isSelected = selectedCase?.id === c.id

              return (
                <Card
                  key={c.id}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary/50',
                    isSelected && 'border-primary ring-1 ring-primary'
                  )}
                  onClick={() => onSelectCase(isSelected ? null : c)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
                          {typeConfig.label}
                        </Badge>
                        <Badge className={cn('text-xs', statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeSince(c.created_at)}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-xs', getSeverityColor(c.severity))}>
                        Sev {c.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{c.id.slice(0, 8)}
                      </span>
                    </div>

                    {c.address && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{c.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Selected Case Details */}
      {selectedCase && (
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Case Details</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onSelectCase(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCase.address || `${selectedCase.latitude.toFixed(4)}, ${selectedCase.longitude.toFixed(4)}`}
                </p>
              </div>
            </div>

            {/* Reporter Info */}
            {(selectedCase.reporter_name || selectedCase.reporter_phone) && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Reporter</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCase.reporter_name}
                    {selectedCase.reporter_phone && ` - ${selectedCase.reporter_phone}`}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {selectedCase.description && (
              <div className="rounded-lg bg-muted/30 p-2">
                <p className="text-xs text-muted-foreground">{selectedCase.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {selectedCase.status === 'reported' && (
                <Button
                  size="sm"
                  className="flex-1 bg-primary"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Assign
                </Button>
              )}
              
              {selectedCase.status === 'assigned' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onUpdateStatus(selectedCase.id, 'en_route')}
                >
                  Mark En Route
                </Button>
              )}

              {selectedCase.status === 'en_route' && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onUpdateStatus(selectedCase.id, 'on_scene')}
                >
                  Mark On Scene
                </Button>
              )}

              {selectedCase.status === 'on_scene' && (
                <Button
                  size="sm"
                  className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => onUpdateStatus(selectedCase.id, 'resolved')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Responder</DialogTitle>
            <DialogDescription>
              Select an available responder to dispatch to this emergency.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={selectedResponder} onValueChange={setSelectedResponder}>
              <SelectTrigger>
                <SelectValue placeholder="Select a responder" />
              </SelectTrigger>
              <SelectContent>
                {availableResponders.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No responders available
                  </div>
                ) : (
                  availableResponders.map((r) => {
                    const config = UNIT_TYPE_CONFIG[r.unit_type]
                    return (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-xs', config.color)}>
                            {config.label}
                          </Badge>
                          <span>{r.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedResponder || isAssigning}
            >
              {isAssigning ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Assigning...
                </>
              ) : (
                'Assign Responder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
