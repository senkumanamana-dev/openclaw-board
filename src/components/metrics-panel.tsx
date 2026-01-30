'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Clock, CheckCircle2, Zap, Target, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Metrics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  totalPoints: number
  completedPoints: number
  avgCycleTimeHours: number | null
  avgLeadTimeHours: number | null
  velocityLast7Days: number
  velocityLast30Days: number
}

interface MetricsPanelProps {
  refreshTrigger?: number // increment to trigger refresh
}

export function MetricsPanel({ refreshTrigger }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/metrics')
        const data = await res.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [refreshTrigger])

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-muted/50">
            <CardContent className="p-4 h-20" />
          </Card>
        ))}
      </div>
    )
  }

  const formatTime = (hours: number | null) => {
    if (hours === null) return '—'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours}h`
    return `${Math.round(hours / 24 * 10) / 10}d`
  }

  const items = [
    {
      label: 'Completed',
      value: `${metrics.completedTasks}/${metrics.totalTasks}`,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'In Progress',
      value: metrics.inProgressTasks.toString(),
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Points Done',
      value: `${metrics.completedPoints}/${metrics.totalPoints}`,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Cycle Time',
      value: formatTime(metrics.avgCycleTimeHours),
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      subtitle: 'avg',
    },
    {
      label: 'Lead Time',
      value: formatTime(metrics.avgLeadTimeHours),
      icon: Timer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      subtitle: 'avg',
    },
    {
      label: 'Velocity',
      value: `${metrics.velocityLast7Days} pts`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      subtitle: '7d',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {items.map((item) => (
        <Card key={item.label} className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', item.bgColor)}>
                <item.icon className={cn('h-4 w-4', item.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-semibold">{item.value}</p>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
