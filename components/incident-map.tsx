'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EmergencyCase, Responder } from '@/lib/types'
import { EMERGENCY_TYPE_CONFIG, UNIT_TYPE_CONFIG } from '@/lib/types'

interface IncidentMapProps {
  cases: EmergencyCase[]
  responders: Responder[]
  selectedCase?: EmergencyCase | null
  onSelectCase?: (c: EmergencyCase) => void
  center?: [number, number]
  zoom?: number
}

// Custom marker icons
const createIcon = (color: string, isResponder = false) => {
  const svg = isResponder
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text></svg>`

  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [isResponder ? 32 : 36, isResponder ? 32 : 36],
    iconAnchor: [isResponder ? 16 : 18, isResponder ? 32 : 36],
    popupAnchor: [0, isResponder ? -32 : -36],
  })
}

const emergencyColors: Record<string, string> = {
  fire: '#f97316',
  medical: '#ef4444',
  accident: '#eab308',
  crime: '#3b82f6',
  flood: '#06b6d4',
  women_safety: '#ec4899',
  other: '#6b7280',
}

const responderColors: Record<string, string> = {
  police: '#3b82f6',
  ambulance: '#ef4444',
  fire: '#f97316',
  volunteer: '#22c55e',
}

export function IncidentMap({
  cases,
  responders,
  selectedCase,
  onSelectCase,
  center = [28.6139, 77.2090],
  zoom = 12,
}: IncidentMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    })

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(mapRef.current)

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)

    // Create markers layer group
    markersRef.current = L.layerGroup().addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [center, zoom])

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return

    // Clear existing markers
    markersRef.current.clearLayers()

    // Add case markers
    cases.forEach((c) => {
      if (c.latitude && c.longitude) {
        const config = EMERGENCY_TYPE_CONFIG[c.type]
        const color = emergencyColors[c.type] || '#ef4444'
        const icon = createIcon(color, false)

        const marker = L.marker([c.latitude, c.longitude], { icon })
          .bindPopup(`
            <div style="min-width: 180px;">
              <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">${config.label} Emergency</div>
              <div style="font-size: 12px; color: #888;">Severity: ${c.severity}/5</div>
              <div style="font-size: 12px; color: #888;">Status: ${c.status}</div>
              ${c.address ? `<div style="font-size: 12px; color: #888; margin-top: 4px;">${c.address}</div>` : ''}
            </div>
          `)

        if (onSelectCase) {
          marker.on('click', () => onSelectCase(c))
        }

        markersRef.current?.addLayer(marker)

        // Highlight selected case
        if (selectedCase?.id === c.id) {
          marker.openPopup()
        }
      }
    })

    // Add responder markers
    responders.forEach((r) => {
      if (r.latitude && r.longitude && r.availability !== 'offline') {
        const config = UNIT_TYPE_CONFIG[r.unit_type]
        const color = responderColors[r.unit_type] || '#22c55e'
        const icon = createIcon(color, true)

        const marker = L.marker([r.latitude, r.longitude], { icon })
          .bindPopup(`
            <div style="min-width: 160px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${r.name}</div>
              <div style="font-size: 12px; color: ${color};">${config.label}</div>
              <div style="font-size: 12px; color: #888;">${r.availability === 'available' ? 'Available' : 'Busy'}</div>
            </div>
          `)

        markersRef.current?.addLayer(marker)
      }
    })
  }, [cases, responders, selectedCase, onSelectCase])

  // Pan to selected case
  useEffect(() => {
    if (selectedCase && mapRef.current) {
      mapRef.current.flyTo([selectedCase.latitude, selectedCase.longitude], 14, {
        duration: 0.5,
      })
    }
  }, [selectedCase])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-16 left-4 rounded-lg bg-card/90 p-3 text-xs backdrop-blur">
        <p className="mb-2 font-semibold">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Medical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span>Fire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Crime/Police</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Responder</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1a2e;
          color: #fff;
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: #1a1a2e;
        }
        .leaflet-popup-close-button {
          color: #888 !important;
        }
      `}</style>
    </div>
  )
}
