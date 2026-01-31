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
      'bg-muted/30 rounded-md border-t-2 flex flex-col',
      'min-h-[150px] sm:min-h-[250px] md:min-h-[300px]',
      columnStyles[id]
    )}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-2.5 py-2 border-b border-border/50 bg-background/30 rounded-t-md flex items-center justify-between hover:bg-background/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="md:hidden text-muted-foreground">
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
          <h2 className="font-medium text-sm">{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
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
              'flex-1 p-1.5 sm:p-2 transition-all duration-200 ease-out min-h-[80px]',
              snapshot.isDraggingOver && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
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
