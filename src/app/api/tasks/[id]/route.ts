import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const task = await prisma.task.findUnique({ where: { id } })
    
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
    
    if (body.status && body.status !== currentTask.status) {
      // Moving to IN_PROGRESS: set startedAt if not already set
      if (body.status === 'IN_PROGRESS' && !currentTask.startedAt) {
        updateData.startedAt = new Date()
      }
      // Moving to DONE: set completedAt
      if (body.status === 'DONE') {
        updateData.completedAt = new Date()
      }
      // Moving back from DONE: clear completedAt
      if (currentTask.status === 'DONE' && body.status !== 'DONE') {
        updateData.completedAt = null
      }
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    })
    
    broadcast('task:updated', task)
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
