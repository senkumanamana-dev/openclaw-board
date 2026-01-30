'use client'

import { useState, useEffect } from 'react'
import { Task, Priority } from '@/types/task'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Archive, Search, X, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArchivePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityColors = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-primary',
}

export function ArchivePanel({ open, onOpenChange }: ArchivePanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({ totalArchived: 0, totalPoints: 0 })
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<Priority | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string>('ALL')

  const fetchArchive = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (priority !== 'ALL') params.set('priority', priority)
      if (tagFilter !== 'ALL') params.set('tag', tagFilter)
      
      const res = await fetch(`/api/archive?${params}`)
      const data = await res.json()
      setTasks(data.tasks)
      setStats(data.stats)
      
      // Collect unique tags
      const tags = new Set<string>()
      data.tasks.forEach((t: Task) => t.tags.forEach((tag: string) => tags.add(tag)))
      setAllTags(Array.from(tags).sort())
    } catch (error) {
      console.error('Failed to fetch archive:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchArchive()
    }
  }, [open, search, priority, tagFilter])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const clearFilters = () => {
    setSearch('')
    setPriority('ALL')
    setTagFilter('ALL')
  }

  const hasFilters = search || priority !== 'ALL' || tagFilter !== 'ALL'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive
          </DialogTitle>
        </DialogHeader>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2 border-b">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {stats.totalArchived} archived tasks
          </span>
          <span className="flex items-center gap-1">
            {stats.totalPoints} total points
          </span>
        </div>
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 py-2">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archive..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority | 'ALL')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          
          {allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {hasFilters ? 'No archived tasks match your filters' : 'No archived tasks yet'}
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id}
                className="p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {task.storyPoints && (
                    <Badge variant="secondary" className="text-xs bg-blue-500 text-white shrink-0">
                      {task.storyPoints} pts
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs text-white', priorityColors[task.priority])}
                  >
                    {task.priority.toLowerCase()}
                  </Badge>
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Archived {formatDate(task.archivedAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
