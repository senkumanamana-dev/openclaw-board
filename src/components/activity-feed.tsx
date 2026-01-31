'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Bot, 
  User,
  ArrowRight,
  Clock,
  Play,
  Square,
  AlertCircle,
  CheckCircle,
  Pencil,
  Plus
} from 'lucide-react'

interface ActivityItem {
  id: string
  taskId: string
  type: string
  actor: string
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
  task: {
    id: string
    taskNumber: number
    title: string
    status: string
  }
}

interface ActivityFeedProps {
  onTaskClick?: (taskId: string) => void
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-3 w-3 text-emerald-500" />,
  status_change: <ArrowRight className="h-3 w-3 text-blue-500" />,
  started_work: <Play className="h-3 w-3 text-primary" />,
  stopped_work: <Square className="h-3 w-3 text-muted-foreground" />,
  blocked: <AlertCircle className="h-3 w-3 text-amber-500" />,
  unblocked: <CheckCircle className="h-3 w-3 text-emerald-500" />,
  field_update: <Pencil className="h-3 w-3 text-blue-500" />,
}

function formatAction(activity: ActivityItem): string {
  switch (activity.type) {
    case 'created':
      return 'created task'
    case 'status_change':
      return `moved to ${activity.newValue}`
    case 'started_work':
      return 'started working'
    case 'stopped_work':
      return 'stopped working'
    case 'blocked':
      return 'blocked'
    case 'unblocked':
      return 'unblocked'
    case 'field_update':
      return `updated ${activity.field}`
    default:
      return activity.type
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function ActivityFeed({ onTaskClick }: ActivityFeedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'human' | 'agent'>('all')
  
  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filter !== 'all') {
        params.set('actor', filter)
      }
      const res = await fetch(`/api/activities?${params}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
    setIsLoading(false)
  }
  
  useEffect(() => {
    if (isOpen) {
      fetchActivities()
      // Refresh every 30 seconds when open
      const interval = setInterval(fetchActivities, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen, filter])
  
  return (
    <>
      {/* Toggle button - fixed to right edge */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-40',
          'h-24 w-8 rounded-l-lg rounded-r-none border-r-0',
          'flex flex-col items-center justify-center gap-1',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          isOpen && 'right-80'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        <Activity className="h-4 w-4" />
      </Button>
      
      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 z-30',
          'bg-background border-l shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Feed
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchActivities} disabled={isLoading}>
                <Clock className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
            
            {/* Filter */}
            <div className="flex gap-1">
              {(['all', 'human', 'agent'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' && 'All'}
                  {f === 'human' && <><User className="h-3 w-3 mr-1" /> Human</>}
                  {f === 'agent' && <><Bot className="h-3 w-3 mr-1" /> Agent</>}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Activity list */}
          <div className="flex-1 overflow-y-auto p-2">
            {activities.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground text-sm py-8">
                No activity yet
              </div>
            )}
            
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'p-2 rounded-lg mb-2 hover:bg-muted/50 cursor-pointer',
                  'border border-transparent hover:border-border',
                  'transition-colors'
                )}
                onClick={() => onTaskClick?.(activity.taskId)}
              >
                <div className="flex items-start gap-2">
                  {/* Actor icon */}
                  <div className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                    activity.actor === 'agent' ? 'bg-primary/20' : 'bg-muted'
                  )}>
                    {activity.actor === 'agent' ? (
                      <Bot className="h-3 w-3 text-primary" />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Task reference */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        OCB-{activity.task.taskNumber}
                      </span>
                      {actionIcons[activity.type] || <Activity className="h-3 w-3" />}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.createdAt)}
                      </span>
                    </div>
                    
                    {/* Action description */}
                    <p className="text-sm truncate">
                      <span className="text-muted-foreground">{formatAction(activity)}</span>
                    </p>
                    
                    {/* Task title */}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {activity.task.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
