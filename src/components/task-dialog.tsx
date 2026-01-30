'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task, Priority, Comment, Subtask } from '@/types/task'
import { Link, MessageSquare, Send, ListChecks, Plus, X } from 'lucide-react'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave: (task: Partial<Task>) => void
  allTasks?: Task[]
}

export function TaskDialog({ open, onOpenChange, task, onSave, allTasks = [] }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [tags, setTags] = useState('')
  const [storyPoints, setStoryPoints] = useState<string>('')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false)
  const [blockedBy, setBlockedBy] = useState<string[]>([])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setTags(task.tags.join(', '))
      setStoryPoints(task.storyPoints?.toString() || '')
      setComments(task.comments || [])
      setSubtasks(task.subtasks || [])
      setBlockedBy(task.blockedBy?.map(t => t.id) || [])
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setTags('')
      setStoryPoints('')
      setComments([])
      setSubtasks([])
      setBlockedBy([])
    }
    setNewComment('')
    setNewSubtask('')
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...(task && { id: task.id }),
      title,
      description: description || null,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
      blockedBy: blockedBy as unknown as Task[], // Will be converted to IDs in API
    })
    onOpenChange(false)
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return
    
    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleAddSubtask = async () => {
    if (!task || !newSubtask.trim()) return
    
    setIsSubmittingSubtask(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim() }),
      })
      
      if (res.ok) {
        const subtask = await res.json()
        setSubtasks(prev => [...prev, subtask])
        setNewSubtask('')
      }
    } catch (error) {
      console.error('Failed to add subtask:', error)
    } finally {
      setIsSubmittingSubtask(false)
    }
  }

  const handleToggleSubtask = async (subtask: Subtask) => {
    if (!task) return
    
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtaskId: subtask.id, completed: !subtask.completed }),
      })
      
      if (res.ok) {
        setSubtasks(prev => 
          prev.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s)
        )
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return
    
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks?subtaskId=${subtaskId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const completedSubtasks = subtasks.filter(s => s.completed).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Story Points</label>
              <Select value={storyPoints || "none"} onValueChange={(v) => setStoryPoints(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="13">13</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Tags</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>

          {/* Dependencies Section */}
          {task && (
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Link className="h-4 w-4" />
                Dependencies ({blockedBy.length})
              </label>
              
              <div className="space-y-2">
                {allTasks
                  .filter(t => t.id !== task.id && !t.archived)
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dep-${t.id}`}
                        checked={blockedBy.includes(t.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBlockedBy(prev => [...prev, t.id])
                          } else {
                            setBlockedBy(prev => prev.filter(id => id !== t.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`dep-${t.id}`}
                        className={`flex-1 text-sm cursor-pointer ${
                          t.status === 'DONE' ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        {t.title}
                        {t.status === 'DONE' && ' ✓'}
                      </label>
                    </div>
                  ))}
                {allTasks.filter(t => t.id !== task.id && !t.archived).length === 0 && (
                  <p className="text-sm text-muted-foreground">No other tasks to depend on</p>
                )}
              </div>
            </div>
          )}

          {/* Subtasks Section - only show for existing tasks */}
          {task && (
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4" />
                Subtasks {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}
              </label>
              
              {subtasks.length > 0 && (
                <div className="space-y-2 mb-4">
                  {subtasks.map((subtask) => (
                    <div 
                      key={subtask.id} 
                      className="flex items-center gap-2 group"
                    >
                      <Checkbox
                        id={subtask.id}
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask)}
                      />
                      <label
                        htmlFor={subtask.id}
                        className={`flex-1 text-sm cursor-pointer ${
                          subtask.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {subtask.title}
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim() || isSubmittingSubtask}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Comments Section - only show for existing tasks */}
          {task && (
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </label>
              
              {comments.length > 0 && (
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
