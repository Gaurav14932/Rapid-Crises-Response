'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SOSButton } from '@/components/sos-button'
import { EmergencyForm, type EmergencyFormData } from '@/components/emergency-form'
import { CaseTracker } from '@/components/case-tracker'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  User, 
  LogOut, 
  LogIn,
  Phone,
  History,
  Bell,
  X
} from 'lucide-react'
import type { EmergencyCase, Assignment, Profile } from '@/lib/types'
import Link from 'next/link'

type ViewState = 'idle' | 'form' | 'tracking' | 'history'

export default function CitizenPage() {
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [viewState, setViewState] = useState<ViewState>('idle')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeCase, setActiveCase] = useState<EmergencyCase | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [caseHistory, setCaseHistory] = useState<EmergencyCase[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifications, setNotifications] = useState<number>(0)

  // Fetch user and profile
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)

        // Fetch active case
        const { data: cases } = await supabase
          .from('emergency_cases')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['reported', 'assigned', 'en_route', 'on_scene'])
          .order('created_at', { ascending: false })
          .limit(1)

        if (cases && cases.length > 0) {
          setActiveCase(cases[0])
          setViewState('tracking')

          // Fetch assignment
          const { data: assignmentData } = await supabase
            .from('assignments')
            .select('*, responder:responders(*)')
            .eq('case_id', cases[0].id)
            .single()
          setAssignment(assignmentData)
        }

        // Fetch unread notifications count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false)
        setNotifications(count || 0)
      }
    }
    getUser()
  }, [supabase])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Location error:', error)
          // Default to a central location if geolocation fails
          setLocation({ lat: 28.6139, lng: 77.2090 }) // New Delhi
        }
      )
    }
  }, [])

  // Subscribe to case updates
  useEffect(() => {
    if (!activeCase) return

    const channel = supabase
      .channel(`case-${activeCase.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_cases',
          filter: `id=eq.${activeCase.id}`,
        },
        (payload) => {
          setActiveCase(payload.new as EmergencyCase)
          if (payload.new.status === 'resolved' || payload.new.status === 'cancelled') {
            setTimeout(() => {
              setViewState('idle')
              setActiveCase(null)
              setAssignment(null)
            }, 3000)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `case_id=eq.${activeCase.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('assignments')
            .select('*, responder:responders(*)')
            .eq('case_id', activeCase.id)
            .single()
          setAssignment(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeCase, supabase])

  const handleSOSActivate = () => {
    setViewState('form')
  }

  const handleSubmitEmergency = async (data: EmergencyFormData) => {
    if (!user) {
      // For non-logged-in users, we still allow emergency reports
    }
    
    setIsSubmitting(true)
    try {
      const { data: newCase, error } = await supabase
        .from('emergency_cases')
        .insert({
          user_id: user?.id || null,
          type: data.type,
          description: data.description,
          severity: data.severity,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          reporter_name: data.reporter_name,
          reporter_phone: data.reporter_phone,
          status: 'reported',
        })
        .select()
        .single()

      if (error) throw error

      setActiveCase(newCase)
      setViewState('tracking')
    } catch (error) {
      console.error('Error submitting emergency:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEmergency = async () => {
    if (!activeCase) return

    try {
      await supabase
        .from('emergency_cases')
        .update({ status: 'cancelled' })
        .eq('id', activeCase.id)

      setActiveCase(null)
      setViewState('idle')
    } catch (error) {
      console.error('Error cancelling emergency:', error)
    }
  }

  const fetchHistory = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('emergency_cases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setCaseHistory(data || [])
    setViewState('history')
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setActiveCase(null)
    setViewState('idle')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">CrisisLink</h1>
              <p className="text-xs text-muted-foreground">Emergency Response</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emergency text-xs font-bold text-emergency-foreground">
                      {notifications}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={fetchHistory}>
                  <History className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {user ? (
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="icon">
                  <LogIn className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg p-4">
        {/* User Status */}
        {user && profile && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-muted/30 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{profile.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">Account verified</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {profile.role}
            </Badge>
          </div>
        )}

        {/* Idle State - SOS Button */}
        {viewState === 'idle' && (
          <div className="flex flex-col items-center py-8">
            <SOSButton onActivate={handleSOSActivate} />
            
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Press and hold the SOS button for 1 second to report an emergency
            </p>

            {/* Emergency Hotlines */}
            <div className="mt-8 w-full space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Emergency Hotlines</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Police', number: '100' },
                  { name: 'Ambulance', number: '102' },
                  { name: 'Fire', number: '101' },
                  { name: 'Women Helpline', number: '1091' },
                ].map((hotline) => (
                  <a
                    key={hotline.number}
                    href={`tel:${hotline.number}`}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{hotline.name}</p>
                      <p className="text-xs text-muted-foreground">{hotline.number}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Form */}
        {viewState === 'form' && (
          <EmergencyForm
            onSubmit={handleSubmitEmergency}
            onCancel={() => setViewState('idle')}
            location={location}
            isLoading={isSubmitting}
          />
        )}

        {/* Case Tracking */}
        {viewState === 'tracking' && activeCase && (
          <CaseTracker
            emergencyCase={activeCase}
            assignment={assignment}
            onCancel={handleCancelEmergency}
          />
        )}

        {/* Case History */}
        {viewState === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Case History</h2>
              <Button variant="ghost" size="icon" onClick={() => setViewState('idle')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {caseHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 p-8 text-center">
                <p className="text-muted-foreground">No previous emergencies reported</p>
              </div>
            ) : (
              <div className="space-y-3">
                {caseHistory.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border/50 bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {c.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={
                        c.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        c.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm">{c.description || 'No description'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/80 p-4 backdrop-blur">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-xs text-muted-foreground">
            In case of emergency, always call your local emergency services
          </p>
        </div>
      </footer>
    </div>
  )
}
