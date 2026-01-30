'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Task, TaskStatus, Priority } from '@/types/task'
import { KanbanColumn } from './kanban-column'
import { TaskDialog } from './task-dialog'
import { ArchivePanel } from './archive-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Archive, Bot, Plus, WifiOff, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricsPanel } from './metrics-panel'

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' },
]

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [metricsRefresh, setMetricsRefresh] = useState(0)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [tagFilter, setTagFilter] = useState<string>('ALL')

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }

    ws.onmessage = (event) => {
      const { event: eventType, data } = JSON.parse(event.data)
      
      switch (eventType) {
        case 'task:created':
          if (!data.archived) {
            setTasks(prev => [...prev, data])
          }
          setMetricsRefresh(n => n + 1)
          break
        case 'task:updated':
          if (data.archived) {
            // Remove from board if archived
            setTasks(prev => prev.filter(t => t.id !== data.id))
          } else {
            setTasks(prev => prev.map(t => t.id === data.id ? data : t))
          }
          setMetricsRefresh(n => n + 1)
          break
        case 'task:deleted':
          setTasks(prev => prev.filter(t => t.id !== data.id))
          setMetricsRefresh(n => n + 1)
          break
        case 'tasks:reordered':
          setTasks(data.filter((t: Task) => !t.archived))
          setMetricsRefresh(n => n + 1)
          break
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [])

  // Get unique tags from all tasks
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    tasks.forEach(task => task.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDescription = task.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDescription) return false
      }
      
      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false
      }
      
      // Tag filter
      if (tagFilter !== 'ALL' && !task.tags.includes(tagFilter)) {
        return false
      }
      
      return true
    })
  }, [tasks, searchQuery, priorityFilter, tagFilter])

  const hasActiveFilters = searchQuery || priorityFilter !== 'ALL' || tagFilter !== 'ALL'

  const clearFilters = () => {
    setSearchQuery('')
    setPriorityFilter('ALL')
    setTagFilter('ALL')
  }

  const getColumnTasks = (status: TaskStatus) => {
    return filteredTasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    const newStatus = destination.droppableId as TaskStatus
    const newPosition = destination.index

    // Optimistic update
    const updatedTasks = tasks.map(t => {
      if (t.id === draggableId) {
        return { ...t, status: newStatus, position: newPosition }
      }
      return t
    })
    setTasks(updatedTasks)

    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, position: newPosition }),
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      fetchTasks() // Revert on error
    }
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (taskData.id) {
        await fetch(`/api/tasks/${taskData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })
      } else {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })
      }
      fetchTasks()
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      fetchTasks()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleNewTask = () => {
    setEditingTask(null)
    setIsDialogOpen(true)
  }

  const activeTask = tasks.find(t => t.isActive)
  const isWorking = !!activeTask

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Agent Icon */}
          <div className={cn(
            "relative p-2.5 rounded-xl transition-all",
            isWorking 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
              : "bg-primary/10 text-primary"
          )}>
            {isWorking && (
              <div className="absolute inset-0 rounded-xl bg-primary animate-ping opacity-30" />
            )}
            <Bot className={cn("h-7 w-7 relative", isWorking && "animate-pulse")} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">OpenClaw Board</h1>
            <p className="text-sm text-muted-foreground">
              {isWorking ? (
                <span className="text-primary font-medium">Working on a task...</span>
              ) : (
                'AI Assistant Task Tracker'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 text-sm px-3 py-1.5 rounded-full",
            isConnected ? "bg-primary/10" : "bg-muted"
          )}>
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-primary font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
          </div>
          <Button onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          <Button variant="outline" onClick={() => setIsArchiveOpen(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>
      </div>

      {/* Metrics Panel */}
      <MetricsPanel refreshTrigger={metricsRefresh} />

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | 'ALL')}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[130px]">
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
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
        
        {hasActiveFilters && (
          <span className="text-sm text-muted-foreground">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
        )}
      </div>

      {/* Active Task Banner */}
      {activeTask && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-50" />
            <div className="relative bg-primary text-primary-foreground rounded-full p-2">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-primary">
              Currently Working On
            </p>
            <p className="font-semibold">{activeTask.title}</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getColumnTasks(column.id)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Task Dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />

      {/* Archive Panel */}
      <ArchivePanel
        open={isArchiveOpen}
        onOpenChange={setIsArchiveOpen}
      />
    </div>
  )
}
