'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  AlertTriangle, 
  Truck, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    activeIncidents: number
    respondersOnDuty: number
    resolvedToday: number
    avgResponseTime: number
    activeDelta?: number
    resolvedDelta?: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Active Incidents',
      value: stats.activeIncidents,
      icon: AlertTriangle,
      color: 'text-emergency',
      bgColor: 'bg-emergency/10',
      delta: stats.activeDelta,
      deltaLabel: 'from yesterday',
      invertDelta: true,
    },
    {
      title: 'Responders On Duty',
      value: stats.respondersOnDuty,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Resolved Today',
      value: stats.resolvedToday,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      delta: stats.resolvedDelta,
      deltaLabel: 'from yesterday',
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime}m`,
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
                {card.delta !== undefined && (
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {(card.invertDelta ? card.delta > 0 : card.delta > 0) ? (
                      <>
                        <TrendingUp className={cn('h-3 w-3', card.invertDelta ? 'text-destructive' : 'text-success')} />
                        <span className={card.invertDelta ? 'text-destructive' : 'text-success'}>+{card.delta}</span>
                      </>
                    ) : card.delta < 0 ? (
                      <>
                        <TrendingDown className={cn('h-3 w-3', card.invertDelta ? 'text-success' : 'text-destructive')} />
                        <span className={card.invertDelta ? 'text-success' : 'text-destructive'}>{card.delta}</span>
                      </>
                    ) : null}
                    {card.deltaLabel && (
                      <span className="text-muted-foreground">{card.deltaLabel}</span>
                    )}
                  </div>
                )}
              </div>
              <div className={cn('rounded-lg p-2', card.bgColor)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
