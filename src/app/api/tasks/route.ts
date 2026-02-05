import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import { sendWebhook, taskToWebhookPayload } from '@/lib/webhook'

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
    return NextResponse.json(tasks, { headers: { 'X-Version': 'debug-v4' } })
  } catch (error: any) {
    console.error('CRITICAL_TASK_FETCH_ERROR:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch tasks', 
      message: error.message, 
      code: error.code,
      meta: error.meta,
      v: 'debug-v4' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, priority, origin, tags } = body

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
        origin: origin || 'HUMAN',
        tags: tags || [],
        position: (maxPosition._max.position ?? -1) + 1,
      },
    })

    // Initialize status history with TODO
    await prisma.statusHistory.create({
      data: {
        taskId: task.id,
        status: 'TODO',
        enteredAt: task.createdAt
      }
    })

    // Log creation
    await logActivity(task.id, 'created', body.actor || 'human')

    broadcast('task:created', task)
    
    // Send webhook
    sendWebhook('task.created', taskToWebhookPayload(task))
    
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
