'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Task, TaskStatus } from '@/types/task'
import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

const columnStyles = {
  TODO: 'border-t-slate-500',
  IN_PROGRESS: 'border-t-blue-500',
  DONE: 'border-t-emerald-500',
}

export function KanbanColumn({ id, title, tasks, onEditTask, onDeleteTask }: KanbanColumnProps) {
  return (
    <div className={cn(
      'bg-muted/50 rounded-lg border-t-4 min-h-[500px] flex flex-col',
      columnStyles[id]
    )}>
      <div className="p-4 border-b bg-background/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{title}</h2>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-3 transition-colors min-h-[200px]',
              snapshot.isDraggingOver && 'bg-muted'
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
