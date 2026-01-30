import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

// Helper to safely broadcast
function broadcast(event: string, data: unknown) {
  if (typeof global.wsBroadcast === 'function') {
    global.wsBroadcast(event, data)
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({ 
      where: { id },
      include: { 
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        blockedBy: { select: { id: true, title: true, status: true } },
        blocking: { select: { id: true, title: true, status: true } },
      },
    })
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Get current task to check status changes
    const currentTask = await prisma.task.findUnique({ where: { id } })
    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Auto-set timestamps based on status transitions
    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() }
    
    // Handle blockedBy separately (it's a relation)
    const blockedByIds = updateData.blockedBy
    delete updateData.blockedBy
    delete updateData.blocking // Don't allow direct update of reverse relation
    
    if (body.status && body.status !== currentTask.status) {
      // Moving to IN_PROGRESS: set startedAt if not already set
      if (body.status === 'IN_PROGRESS' && !currentTask.startedAt) {
        updateData.startedAt = new Date()
      }
      // Moving to NEEDS_REVIEW: set reviewedAt
      if (body.status === 'NEEDS_REVIEW') {
        updateData.reviewedAt = new Date()
        updateData.isActive = false // Agent done working
      }
      // Moving to DONE: set completedAt
      if (body.status === 'DONE') {
        updateData.completedAt = new Date()
      }
      // Moving back from DONE: clear completedAt
      if (currentTask.status === 'DONE' && body.status !== 'DONE') {
        updateData.completedAt = null
      }
      // Moving back from NEEDS_REVIEW: clear reviewedAt
      if (currentTask.status === 'NEEDS_REVIEW' && body.status !== 'NEEDS_REVIEW') {
        updateData.reviewedAt = null
      }
    }
    
    // Build the update with blockedBy relation if provided
    const prismaData: Record<string, unknown> = { ...updateData }
    if (blockedByIds !== undefined) {
      prismaData.blockedBy = {
        set: Array.isArray(blockedByIds) 
          ? blockedByIds.map((tid: string) => ({ id: tid }))
          : []
      }
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: prismaData,
      include: { 
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        blockedBy: { select: { id: true, title: true, status: true } },
        blocking: { select: { id: true, title: true, status: true } },
      },
    })
    
    // Log activity for significant changes
    const actor = body.actor || 'human'
    if (body.status && body.status !== currentTask.status) {
      await logActivity(id, 'status_change', actor, 'status', currentTask.status, body.status)
    }
    if (body.isActive !== undefined && body.isActive !== currentTask.isActive) {
      await logActivity(id, body.isActive ? 'started_work' : 'stopped_work', actor)
    }
    if (body.blockedReason !== undefined && body.blockedReason !== currentTask.blockedReason) {
      await logActivity(id, body.blockedReason ? 'blocked' : 'unblocked', actor, 'blockedReason', currentTask.blockedReason, body.blockedReason)
    }
    if (body.title && body.title !== currentTask.title) {
      await logActivity(id, 'field_update', actor, 'title', currentTask.title, body.title)
    }
    if (body.priority && body.priority !== currentTask.priority) {
      await logActivity(id, 'field_update', actor, 'priority', currentTask.priority, body.priority)
    }
    
    broadcast('task:updated', task)
    
    // Auto-archive: if moving to DONE and there are 5+ completed non-archived tasks
    if (body.status === 'DONE') {
      const completedTasks = await prisma.task.findMany({
        where: { status: 'DONE', archived: false },
        orderBy: { completedAt: 'asc' },
      })
      
      if (completedTasks.length > 5) {
        // Archive oldest completed tasks, keeping only 5 in Done column
        const toArchive = completedTasks.slice(0, completedTasks.length - 5)
        for (const t of toArchive) {
          const archived = await prisma.task.update({
            where: { id: t.id },
            data: { archived: true, archivedAt: new Date() },
            include: { 
              comments: { orderBy: { createdAt: 'asc' } },
              subtasks: { orderBy: { position: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
            },
          })
          broadcast('task:updated', archived)
        }
      }
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    broadcast('task:deleted', { id })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
