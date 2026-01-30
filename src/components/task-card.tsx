'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/task'
import { Draggable } from '@hello-pangea/dnd'
import { AlertCircle, Bot, Check, Link, ListChecks, MessageSquare, Pencil, RotateCcw, Trash2 } from 'lucide-react'
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
  // Check if blocked by incomplete dependencies OR manual blocker
  const incompleteDeps = task.blockedBy?.filter(dep => dep.status !== 'DONE') || []
  const isBlocked = incompleteDeps.length > 0 || !!task.blockedReason
  const blockReason = task.blockedReason || (incompleteDeps.length > 0 
    ? `Blocked by: ${incompleteDeps.map(d => `OCB-${d.taskNumber}`).join(', ')}`
    : null)

  // Count indicators
  const hasComments = (task.comments?.length || 0) > 0
  const hasSubtasks = (task.subtasks?.length || 0) > 0
  const hasAttachments = (task.attachments?.length || 0) > 0
  const hasDeps = (task.blockedBy?.length || 0) > 0

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2 cursor-grab active:cursor-grabbing"
        >
          <Card
            className={cn(
              'relative transition-all duration-200 hover:shadow-md p-2',
              snapshot.isDragging && 'rotate-2 shadow-xl',
              task.isActive && 'ring-2 ring-primary',
              isBlocked && 'opacity-60 border-dashed border-amber-500'
            )}
          >
            {/* Blocked indicator */}
            {isBlocked && (
              <div className="absolute -top-1.5 -left-1.5 z-10">
                <div className="bg-amber-500 text-white rounded-full p-1" title={blockReason || 'Blocked'}>
                  <AlertCircle className="h-3 w-3" />
                </div>
              </div>
            )}
            
            {/* Working indicator */}
            {task.isActive && (
              <div className="absolute -top-1.5 -right-1.5 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                  <div className="relative bg-primary text-primary-foreground rounded-full p-1">
                    <Bot className="h-3 w-3" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Task key + title */}
                <div className="flex items-start gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 pt-0.5">
                    OCB-{task.taskNumber}
                  </span>
                  {task.origin === 'AI' && (
                    <span className="text-primary shrink-0 pt-0.5" title="Suggested by AI">
                      <Bot className="h-3 w-3" />
                    </span>
                  )}
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">
                    {task.title}
                  </h3>
                </div>
                
                {/* Compact metadata row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Priority dot */}
                  <div 
                    className={cn('w-2.5 h-2.5 rounded-full', priorityColors[task.priority])}
                    title={`${task.priority} priority`}
                  />
                  
                  {/* Story points */}
                  {task.storyPoints && (
                    <span className="text-xs text-blue-500 font-medium">
                      {task.storyPoints}pt
                    </span>
                  )}
                  
                  {/* Tags (show first 2 max) */}
                  {task.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 h-5">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{task.tags.length - 2}</span>
                  )}
                  
                  {/* Indicators */}
                  <div className="flex items-center gap-2 ml-auto text-muted-foreground">
                    {hasDeps && (
                      <span className="text-amber-500" title={blockReason || 'Has dependencies'}>
                        <Link className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {hasSubtasks && (
                      <span className="flex items-center text-xs" title="Subtasks">
                        <ListChecks className="h-3.5 w-3.5 mr-0.5" />
                        {task.subtasks?.filter(s => s.completed).length}/{task.subtasks?.length}
                      </span>
                    )}
                    {hasComments && (
                      <span className="flex items-center text-xs" title="Comments">
                        <MessageSquare className="h-3.5 w-3.5 mr-0.5" />
                        {task.comments?.length}
                      </span>
                    )}
                    {hasAttachments && (
                      <span className="text-xs" title="Attachments">
                        📎{task.attachments?.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-0.5 shrink-0">
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

            {/* Approve/Reject buttons for NEEDS_REVIEW */}
            {task.status === 'NEEDS_REVIEW' && onApprove && onReject && (
              <div className="flex gap-2 mt-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
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
                  className="flex-1 h-7 text-xs"
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
          </Card>
        </div>
      )}
    </Draggable>
  )
}
