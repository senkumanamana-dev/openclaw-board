'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/task'
import { Draggable } from '@hello-pangea/dnd'
import { AlertCircle, Bot, Check, Clock, Link, ListChecks, MessageSquare, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onApprove?: (taskId: string) => void
  onReject?: (taskId: string) => void
}

const priorityColors = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-primary',
}

export function TaskCard({ task, index, onEdit, onDelete, onApprove, onReject }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Check if blocked by incomplete dependencies OR manual blocker
  const incompleteDeps = task.blockedBy?.filter(dep => dep.status !== 'DONE') || []
  const isBlocked = incompleteDeps.length > 0 || !!task.blockedReason
  const blockReason = task.blockedReason || (incompleteDeps.length > 0 
    ? `Blocked by: ${incompleteDeps.map(d => d.title).join(', ')}`
    : null)

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3 cursor-grab active:cursor-grabbing"
        >
          <Card
            className={cn(
              'relative transition-all duration-200 hover:shadow-lg',
              snapshot.isDragging && 'rotate-2 shadow-xl',
              task.isActive && 'ring-2 ring-primary animate-pulse-subtle',
              isBlocked && 'opacity-60 border-dashed border-amber-500'
            )}
          >
            {/* Blocked indicator */}
            {isBlocked && (
              <div className="absolute -top-2 -left-2 z-10">
                <div className="bg-amber-500 text-white rounded-full p-1.5" title={blockReason || 'Blocked'}>
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
            )}
            
            {/* Working indicator */}
            {task.isActive && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                  <div className="relative bg-primary text-primary-foreground rounded-full p-1.5">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}
            
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-mono text-muted-foreground mr-2">
                    OCB-{task.taskNumber}
                  </span>
                  <h3 className="font-semibold text-sm leading-tight inline">
                    {task.title}
                  </h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(task)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(task.id)
                    }}
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
                {task.storyPoints && (
                  <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                    {task.storyPoints} pts
                  </Badge>
                )}
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Dependencies indicator */}
              {(task.blockedBy?.length || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mb-2 flex-wrap">
                  <Link className="h-3 w-3 shrink-0" />
                  <span>Blocked by:</span>
                  {task.blockedBy?.map((dep, i) => (
                    <span key={dep.id} className="font-mono">
                      OCB-{dep.taskNumber}{i < (task.blockedBy?.length || 0) - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Manual blocker indicator */}
              {task.blockedReason && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                  <AlertCircle className="h-3 w-3" />
                  <span className="truncate">{task.blockedReason}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(task.updatedAt)}
                  </div>
                  {task.comments && task.comments.length > 0 && (
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {task.comments.length}
                    </div>
                  )}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="flex items-center">
                      <ListChecks className="h-3 w-3 mr-1" />
                      {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                    </div>
                  )}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center" title="Attachments">
                      📎 {task.attachments.length}
                    </div>
                  )}
                </div>
                {task.isActive && (
                  <span className="text-primary font-medium flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </span>
                    Working
                  </span>
                )}
              </div>

              {/* Approve/Reject buttons for NEEDS_REVIEW */}
              {task.status === 'NEEDS_REVIEW' && onApprove && onReject && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      onApprove(task.id)
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onReject(task.id)
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Revise
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
