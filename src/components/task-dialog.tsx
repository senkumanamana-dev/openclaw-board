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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task, Priority } from '@/types/task'

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
  const [tags, setTags] = useState('')
  const [storyPoints, setStoryPoints] = useState<string>('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setTags(task.tags.join(', '))
      setStoryPoints(task.storyPoints?.toString() || '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setTags('')
      setStoryPoints('')
    }
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
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
              <Select value={storyPoints} onValueChange={setStoryPoints}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
          
          <div className="flex justify-end gap-2">
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
