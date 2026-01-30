import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

// Helper to safely broadcast
function broadcast(event: string, data: unknown) {
  if (typeof global.wsBroadcast === 'function') {
    global.wsBroadcast(event, data)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    const tasks = await prisma.task.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      include: { 
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        blockedBy: { select: { id: true, taskNumber: true, title: true, status: true } },
        blocking: { select: { id: true, taskNumber: true, title: true, status: true } },
      },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, priority, tags } = body

    // Get max position for TODO column
    const maxPosition = await prisma.task.aggregate({
      where: { status: 'TODO' },
      _max: { position: true },
    })

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        tags: tags || [],
        position: (maxPosition._max.position ?? -1) + 1,
      },
    })

    // Log creation
    await logActivity(task.id, 'created', body.actor || 'human')

    broadcast('task:created', task)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
