// CrisisLink AI Types

export type UserRole = 'citizen' | 'responder' | 'admin'

export type EmergencyType = 'fire' | 'medical' | 'accident' | 'crime' | 'flood' | 'women_safety' | 'other'

export type CaseStatus = 'reported' | 'assigned' | 'en_route' | 'on_scene' | 'resolved' | 'cancelled'

export type UnitType = 'police' | 'ambulance' | 'fire' | 'volunteer'

export type ResponderAvailability = 'available' | 'busy' | 'offline'

export type AssignmentStatus = 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled'

export type NotificationType = 'info' | 'warning' | 'alert' | 'success'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Responder {
  id: string
  user_id: string | null
  name: string
  unit_type: UnitType
  phone: string | null
  latitude: number | null
  longitude: number | null
  availability: ResponderAvailability
  created_at: string
  updated_at: string
}

export interface EmergencyCase {
  id: string
  user_id: string | null
  type: EmergencyType
  description: string | null
  severity: number
  latitude: number
  longitude: number
  address: string | null
  status: CaseStatus
  media_url: string | null
  reporter_name: string | null
  reporter_phone: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface Assignment {
  id: string
  case_id: string
  responder_id: string
  assigned_at: string
  eta_minutes: number | null
  status: AssignmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  responder?: Responder
  emergency_case?: EmergencyCase
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  case_id: string | null
  created_at: string
}

export const EMERGENCY_TYPE_CONFIG: Record<EmergencyType, { label: string; icon: string; color: string }> = {
  fire: { label: 'Fire', icon: 'Flame', color: 'text-orange-500' },
  medical: { label: 'Medical', icon: 'Heart', color: 'text-red-500' },
  accident: { label: 'Accident', icon: 'Car', color: 'text-yellow-500' },
  crime: { label: 'Crime', icon: 'Shield', color: 'text-blue-500' },
  flood: { label: 'Flood', icon: 'Waves', color: 'text-cyan-500' },
  women_safety: { label: 'Women Safety', icon: 'User', color: 'text-pink-500' },
  other: { label: 'Other', icon: 'AlertCircle', color: 'text-gray-500' },
}

export const UNIT_TYPE_CONFIG: Record<UnitType, { label: string; icon: string; color: string }> = {
  police: { label: 'Police', icon: 'Shield', color: 'text-blue-500' },
  ambulance: { label: 'Ambulance', icon: 'Ambulance', color: 'text-red-500' },
  fire: { label: 'Fire Brigade', icon: 'Flame', color: 'text-orange-500' },
  volunteer: { label: 'Volunteer', icon: 'Users', color: 'text-green-500' },
}

export const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string }> = {
  reported: { label: 'Reported', color: 'bg-yellow-500/20 text-yellow-400' },
  assigned: { label: 'Assigned', color: 'bg-blue-500/20 text-blue-400' },
  en_route: { label: 'En Route', color: 'bg-purple-500/20 text-purple-400' },
  on_scene: { label: 'On Scene', color: 'bg-cyan-500/20 text-cyan-400' },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
}
