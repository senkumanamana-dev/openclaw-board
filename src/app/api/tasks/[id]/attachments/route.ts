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
    const attachments = await prisma.attachment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, title, content, mimeType } = body

    const attachment = await prisma.attachment.create({
      data: {
        type,
        title,
        content,
        mimeType,
        taskId: id,
      },
    })

    // Broadcast task update
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        blockedBy: { select: { id: true, title: true, status: true } },
        blocking: { select: { id: true, title: true, status: true } },
      },
    })
    broadcast('task:updated', task)

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error creating attachment:', error)
    return NextResponse.json({ error: 'Failed to create attachment' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId required' }, { status: 400 })
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    // Broadcast task update
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        blockedBy: { select: { id: true, title: true, status: true } },
        blocking: { select: { id: true, title: true, status: true } },
      },
    })
    broadcast('task:updated', task)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }
}
