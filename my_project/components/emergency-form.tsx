'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { 
  Flame, 
  Heart, 
  Car, 
  Shield, 
  Waves, 
  User, 
  AlertCircle,
  MapPin,
  Phone,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EmergencyType } from '@/lib/types'

interface EmergencyFormProps {
  onSubmit: (data: EmergencyFormData) => Promise<void>
  onCancel: () => void
  location: { lat: number; lng: number } | null
  isLoading?: boolean
}

export interface EmergencyFormData {
  type: EmergencyType
  description: string
  severity: number
  reporter_name: string
  reporter_phone: string
  latitude: number
  longitude: number
  address: string
}

const emergencyTypes: { type: EmergencyType; icon: typeof Flame; label: string; color: string }[] = [
  { type: 'fire', icon: Flame, label: 'Fire', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30' },
  { type: 'medical', icon: Heart, label: 'Medical', color: 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' },
  { type: 'accident', icon: Car, label: 'Accident', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30' },
  { type: 'crime', icon: Shield, label: 'Crime', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30' },
  { type: 'flood', icon: Waves, label: 'Flood', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30' },
  { type: 'women_safety', icon: User, label: 'Women Safety', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50 hover:bg-pink-500/30' },
  { type: 'other', icon: AlertCircle, label: 'Other', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50 hover:bg-gray-500/30' },
]

export function EmergencyForm({ onSubmit, onCancel, location, isLoading }: EmergencyFormProps) {
  const [formData, setFormData] = useState<Partial<EmergencyFormData>>({
    type: undefined,
    description: '',
    severity: 3,
    reporter_name: '',
    reporter_phone: '',
    address: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type || !location) return

    await onSubmit({
      type: formData.type,
      description: formData.description || '',
      severity: formData.severity || 3,
      reporter_name: formData.reporter_name || '',
      reporter_phone: formData.reporter_phone || '',
      latitude: location.lat,
      longitude: location.lng,
      address: formData.address || '',
    })
  }

  return (
    <Card className="border-emergency/30 bg-card/95 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl text-emergency">Report Emergency</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emergency Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Emergency Type *</Label>
            <div className="grid grid-cols-4 gap-2">
              {emergencyTypes.map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3 transition-all',
                    formData.type === type
                      ? color.replace('hover:', '') + ' ring-2 ring-offset-2 ring-offset-background'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Severity Level: {formData.severity}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: level })}
                  className={cn(
                    'h-10 flex-1 rounded-md border font-bold transition-all',
                    formData.severity === level
                      ? level <= 2 ? 'bg-green-500/30 border-green-500 text-green-400'
                        : level === 3 ? 'bg-yellow-500/30 border-yellow-500 text-yellow-400'
                        : 'bg-red-500/30 border-red-500 text-red-400'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">1 = Low, 5 = Critical</p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Location Detected</p>
              {location ? (
                <p className="text-xs text-muted-foreground">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-yellow-500">Detecting location...</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">Address / Landmark</Label>
            <Input
              id="address"
              placeholder="Enter nearby landmark or address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-muted/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the emergency situation..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[80px] bg-muted/50"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
              <Input
                id="name"
                placeholder="Name"
                value={formData.reporter_name}
                onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone number"
                  value={formData.reporter_phone}
                  onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                  className="bg-muted/50 pl-9"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!formData.type || !location || isLoading}
            className="w-full bg-emergency text-emergency-foreground hover:bg-emergency/90"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Sending Alert...
              </>
            ) : (
              'Send Emergency Alert'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
