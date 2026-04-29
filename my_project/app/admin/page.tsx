'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { CasePanel } from '@/components/case-panel'
import { StatsCards } from '@/components/stats-cards'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { 
  Shield, 
  Bell, 
  LogOut,
  RefreshCw,
  Volume2,
  VolumeX,
  Home
} from 'lucide-react'
import type { EmergencyCase, Responder, Profile, CaseStatus } from '@/lib/types'
import Link from 'next/link'

// Dynamically import map to avoid SSR issues with Leaflet
const IncidentMap = dynamic(
  () => import('@/components/incident-map').then((mod) => mod.IncidentMap),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
)

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cases, setCases] = useState<EmergencyCase[]>([])
  const [responders, setResponders] = useState<Responder[]>([])
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Stats
  const [stats, setStats] = useState({
    activeIncidents: 0,
    respondersOnDuty: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
  })

  // Check auth and admin role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.role !== 'admin') {
        router.push('/')
        return
      }

      setProfile(profileData)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  // Fetch data
  const fetchData = useCallback(async () => {
    // Fetch all non-cancelled cases
    const { data: casesData } = await supabase
      .from('emergency_cases')
      .select('*')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (casesData) {
      setCases(casesData)
      
      // Calculate stats
      const active = casesData.filter(c => !['resolved', 'cancelled'].includes(c.status))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const resolvedToday = casesData.filter(c => 
        c.status === 'resolved' && 
        new Date(c.resolved_at || c.updated_at) >= today
      )

      setStats(prev => ({
        ...prev,
        activeIncidents: active.length,
        resolvedToday: resolvedToday.length,
      }))
    }

    // Fetch responders
    const { data: respondersData } = await supabase
      .from('responders')
      .select('*')
      .order('name')

    if (respondersData) {
      setResponders(respondersData)
      const onDuty = respondersData.filter(r => r.availability !== 'offline')
      setStats(prev => ({
        ...prev,
        respondersOnDuty: onDuty.length,
      }))
    }

    setLastRefresh(new Date())
  }, [supabase])

  useEffect(() => {
    if (!isLoading) {
      fetchData()
    }
  }, [isLoading, fetchData])

  // Real-time subscriptions
  useEffect(() => {
    if (isLoading) return

    const casesChannel = supabase
      .channel('admin-cases')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_cases',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCases(prev => [payload.new as EmergencyCase, ...prev])
            // Play alert sound for new cases
            if (soundEnabled) {
              // Browser notification sound
              try {
                const audio = new Audio('/alert.mp3')
                audio.volume = 0.5
                audio.play().catch(() => {})
              } catch (e) {}
            }
          } else if (payload.eventType === 'UPDATE') {
            setCases(prev => prev.map(c => 
              c.id === payload.new.id ? payload.new as EmergencyCase : c
            ))
            if (selectedCase?.id === payload.new.id) {
              setSelectedCase(payload.new as EmergencyCase)
            }
          } else if (payload.eventType === 'DELETE') {
            setCases(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    const respondersChannel = supabase
      .channel('admin-responders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setResponders(prev => [...prev, payload.new as Responder])
          } else if (payload.eventType === 'UPDATE') {
            setResponders(prev => prev.map(r => 
              r.id === payload.new.id ? payload.new as Responder : r
            ))
          } else if (payload.eventType === 'DELETE') {
            setResponders(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(casesChannel)
      supabase.removeChannel(respondersChannel)
    }
  }, [isLoading, soundEnabled, selectedCase, supabase])

  const handleAssignResponder = async (caseId: string, responderId: string) => {
    // Create assignment
    await supabase
      .from('assignments')
      .insert({
        case_id: caseId,
        responder_id: responderId,
        eta_minutes: 10, // Default ETA
      })

    // Update case status
    await supabase
      .from('emergency_cases')
      .update({ status: 'assigned' })
      .eq('id', caseId)

    // Update responder availability
    await supabase
      .from('responders')
      .update({ availability: 'busy' })
      .eq('id', responderId)

    // Refresh data
    fetchData()
  }

  const handleUpdateStatus = async (caseId: string, status: CaseStatus) => {
    const updates: Partial<EmergencyCase> = { status }
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    await supabase
      .from('emergency_cases')
      .update(updates)
      .eq('id', caseId)

    // If resolved, free up the responder
    if (status === 'resolved') {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('responder_id')
        .eq('case_id', caseId)
        .single()

      if (assignment) {
        await supabase
          .from('responders')
          .update({ availability: 'available' })
          .eq('id', assignment.responder_id)

        await supabase
          .from('assignments')
          .update({ status: 'completed' })
          .eq('case_id', caseId)
      }
    }

    fetchData()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border/50 bg-card/50 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CrisisLink Command</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Badge>
          
          <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute alerts' : 'Enable alerts'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {stats.activeIncidents > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emergency text-xs font-bold text-emergency-foreground">
                {stats.activeIncidents}
              </span>
            )}
          </Button>

          <Link href="/">
            <Button variant="ghost" size="icon" title="Citizen View">
              <Home className="h-4 w-4" />
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-border/50 bg-card/30 p-4">
        <StatsCards stats={stats} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1">
          <IncidentMap
            cases={cases}
            responders={responders}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        </div>

        {/* Case Panel */}
        <div className="w-96 border-l border-border/50 bg-card/50">
          <CasePanel
            cases={cases}
            responders={responders}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
            onAssignResponder={handleAssignResponder}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </div>
    </div>
  )
}
