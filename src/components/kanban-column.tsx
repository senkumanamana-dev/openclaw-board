'use client'

import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Task, TaskStatus } from '@/types/task'
import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onApproveTask?: (taskId: string) => void
  onRejectTask?: (taskId: string) => void
}

const columnStyles: Record<TaskStatus, string> = {
  TODO: 'border-t-slate-500',
  IN_PROGRESS: 'border-t-primary',
  NEEDS_REVIEW: 'border-t-amber-500',
  DONE: 'border-t-emerald-500',
}

export function KanbanColumn({ id, title, tasks, onEditTask, onDeleteTask, onApproveTask, onRejectTask }: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      'bg-muted/50 rounded-lg border-t-4 flex flex-col',
      'min-h-[200px] sm:min-h-[400px] md:min-h-[500px]',
      columnStyles[id]
    )}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-3 sm:p-4 border-b bg-background/50 rounded-t-lg flex items-center justify-between hover:bg-background/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="md:hidden text-muted-foreground">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
          <h2 className="font-semibold text-base sm:text-lg">{title}</h2>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-0.5 sm:py-1 rounded-full">
          {tasks.length}
        </span>
      </button>
      
      {/* On mobile, allow collapse. On desktop (md+), always show */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 sm:p-3 transition-all duration-200 ease-out min-h-[100px]',
              snapshot.isDraggingOver && 'bg-primary/5 ring-2 ring-inset ring-primary/20',
              isCollapsed && 'hidden md:block'
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onApprove={onApproveTask}
                onReject={onRejectTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
