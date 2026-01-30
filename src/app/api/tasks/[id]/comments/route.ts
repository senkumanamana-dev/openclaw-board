import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to safely broadcast
function broadcast(event: string, data: unknown) {
  if (typeof global.wsBroadcast === 'function') {
    global.wsBroadcast(event, data)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const comments = await prisma.comment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: 'asc' },
  })
  
  return NextResponse.json(comments)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  const comment = await prisma.comment.create({
    data: {
      content: body.content,
      taskId: id,
    },
  })
  
  // Fetch updated task with comments for broadcast
  const task = await prisma.task.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  })
  
  broadcast('task:updated', task)
  
  return NextResponse.json(comment, { status: 201 })
}
