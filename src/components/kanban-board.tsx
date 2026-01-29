'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Task, TaskStatus, Column } from '@/types/task'
import { KanbanColumn } from './kanban-column'
import { TaskDialog } from './task-dialog'
import { Button } from '@/components/ui/button'
import { Bot, Plus, Wifi, WifiOff } from 'lucide-react'

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
          setTasks(prev => [...prev, data])
          break
        case 'task:updated':
          setTasks(prev => prev.map(t => t.id === data.id ? data : t))
          break
        case 'task:deleted':
          setTasks(prev => prev.filter(t => t.id !== data.id))
          break
        case 'tasks:reordered':
          setTasks(data)
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

  const getColumnTasks = (status: TaskStatus) => {
    return tasks
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
          <div className="bg-primary/10 p-2 rounded-lg">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Moltbot Board</h1>
            <p className="text-sm text-muted-foreground">
              AI Assistant Task Tracker
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
          </div>
          <Button onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Active Task Banner */}
      {activeTask && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
            <div className="relative bg-emerald-500 text-white rounded-full p-2">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
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
    </div>
  )
}
