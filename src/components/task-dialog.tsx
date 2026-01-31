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
import { Task, Priority, TaskOrigin, Comment, Subtask, Attachment, Activity } from '@/types/task'
import { Code, ExternalLink, FileText, History, MessageSquare, Paperclip, Send, ListChecks, Plus, X } from 'lucide-react'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave: (task: Partial<Task>) => void
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [origin, setOrigin] = useState<TaskOrigin>('HUMAN')
  const [tags, setTags] = useState('')
  const [storyPoints, setStoryPoints] = useState<string>('')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newAttachment, setNewAttachment] = useState({ type: 'link' as Attachment['type'], title: '', content: '' })
  const [isSubmittingAttachment, setIsSubmittingAttachment] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setOrigin(task.origin || 'HUMAN')
      setTags(task.tags.join(', '))
      setStoryPoints(task.storyPoints?.toString() || '')
      setComments(task.comments || [])
      setSubtasks(task.subtasks || [])
      setAttachments(task.attachments || [])
      setActivities(task.activities || [])
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setOrigin('HUMAN')
      setTags('')
      setStoryPoints('')
      setComments([])
      setSubtasks([])
      setAttachments([])
      setActivities([])
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
      origin,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
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

  const handleAddAttachment = async () => {
    if (!task || !newAttachment.content.trim()) return
    
    setIsSubmittingAttachment(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newAttachment.type,
          title: newAttachment.title.trim() || null,
          content: newAttachment.content.trim(),
        }),
      })
      
      if (res.ok) {
        const attachment = await res.json()
        setAttachments(prev => [attachment, ...prev])
        setNewAttachment({ type: 'link', title: '', content: '' })
      }
    } catch (error) {
      console.error('Failed to add attachment:', error)
    } finally {
      setIsSubmittingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return
    
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error)
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
          <DialogTitle>
            {task ? (
              <>
                <span className="font-mono text-muted-foreground mr-2">OCB-{task.taskNumber}</span>
                Edit Task
              </>
            ) : 'New Task'}
          </DialogTitle>
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
          
          <div className="grid grid-cols-3 gap-4">
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
            
            <div>
              <label className="text-sm font-medium">Origin</label>
              <Select value={origin} onValueChange={(v) => setOrigin(v as TaskOrigin)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HUMAN">Human</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
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

          {/* Attachments Section - only show for existing tasks */}
          {task && (
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4" />
                Attachments ({attachments.length})
              </label>
              
              {attachments.length > 0 && (
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2 group">
                      <div className="mt-0.5">
                        {attachment.type === 'link' && <ExternalLink className="h-4 w-4 text-blue-500" />}
                        {attachment.type === 'code' && <Code className="h-4 w-4 text-green-500" />}
                        {attachment.type === 'note' && <FileText className="h-4 w-4 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {attachment.title && (
                          <p className="text-sm font-medium truncate">{attachment.title}</p>
                        )}
                        {attachment.type === 'link' ? (
                          <a 
                            href={attachment.content} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline truncate block"
                          >
                            {attachment.content}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                            {attachment.content}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new attachment */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select 
                    value={newAttachment.type} 
                    onValueChange={(v) => setNewAttachment(prev => ({ ...prev, type: v as Attachment['type'] }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={newAttachment.title}
                    onChange={(e) => setNewAttachment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Title (optional)"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  {newAttachment.type === 'link' ? (
                    <Input
                      value={newAttachment.content}
                      onChange={(e) => setNewAttachment(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1"
                    />
                  ) : (
                    <Textarea
                      value={newAttachment.content}
                      onChange={(e) => setNewAttachment(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={newAttachment.type === 'code' ? 'Paste code...' : 'Add a note...'}
                      rows={2}
                      className="flex-1"
                    />
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={handleAddAttachment}
                    disabled={!newAttachment.content.trim() || isSubmittingAttachment}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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

          {/* Activity Log - only show for existing tasks */}
          {task && activities.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <History className="h-4 w-4" />
                Activity Log
              </label>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      activity.actor === 'agent' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {activity.actor === 'agent' ? '🤖' : '👤'}
                    </span>
                    <div className="flex-1">
                      <span className="text-foreground">
                        {activity.type === 'created' && 'Created task'}
                        {activity.type === 'status_change' && `Changed status: ${activity.oldValue} → ${activity.newValue}`}
                        {activity.type === 'started_work' && 'Started working'}
                        {activity.type === 'stopped_work' && 'Stopped working'}
                        {activity.type === 'blocked' && `Blocked: ${activity.newValue}`}
                        {activity.type === 'unblocked' && 'Unblocked'}
                        {activity.type === 'field_update' && `Updated ${activity.field}: ${activity.oldValue} → ${activity.newValue}`}
                        {activity.type === 'comment_added' && 'Added a comment'}
                        {activity.type === 'attachment_added' && 'Added an attachment'}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
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
