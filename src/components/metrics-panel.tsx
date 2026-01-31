'use client'

import { useEffect, useState } from 'react'
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
  refreshTrigger?: number
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
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4 px-1 h-5">
        <span className="animate-pulse">Loading metrics...</span>
      </div>
    )
  }

  const formatTime = (hours: number | null) => {
    if (hours === null) return '—'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${(hours / 24).toFixed(1)}d`
  }

  const items = [
    {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      label: 'Done',
      value: `${metrics.completedTasks}/${metrics.totalTasks}`,
    },
    {
      icon: Zap,
      color: 'text-primary',
      label: 'Active',
      value: metrics.inProgressTasks.toString(),
    },
    {
      icon: Target,
      color: 'text-blue-500',
      label: 'Points',
      value: `${metrics.completedPoints}/${metrics.totalPoints}`,
    },
    {
      icon: Clock,
      color: 'text-amber-500',
      label: 'Cycle',
      value: formatTime(metrics.avgCycleTimeHours),
    },
    {
      icon: Timer,
      color: 'text-purple-500',
      label: 'Lead',
      value: formatTime(metrics.avgLeadTimeHours),
    },
    {
      icon: TrendingUp,
      color: 'text-cyan-500',
      label: '7d Velocity',
      value: `${metrics.velocityLast7Days} pts`,
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 sm:mb-3 px-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <item.icon className={cn('h-3 w-3', item.color)} />
          <span className="hidden sm:inline">{item.label}:</span>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
