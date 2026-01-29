'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/task'
import { Draggable } from '@hello-pangea/dnd'
import { Bot, Clock, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const priorityColors = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-red-500',
}

export function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-3"
        >
          <Card
            className={cn(
              'relative transition-all duration-200 hover:shadow-lg',
              snapshot.isDragging && 'rotate-2 shadow-xl',
              task.isActive && 'ring-2 ring-emerald-500 animate-pulse-subtle'
            )}
          >
            {task.isActive && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                  <div className="relative bg-emerald-500 text-white rounded-full p-1.5">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}
            
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-start justify-between gap-2">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm flex-1 leading-tight">
                  {task.title}
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onEdit(task)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 px-3 pb-3">
              {task.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-1.5 mb-2">
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
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(task.updatedAt)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
