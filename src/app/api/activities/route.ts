import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const actor = searchParams.get('actor') // 'human', 'agent', or null for all
    const taskId = searchParams.get('taskId')
    
    const where: Record<string, unknown> = {}
    
    if (actor) {
      where.actor = actor
    }
    
    if (taskId) {
      where.taskId = taskId
    }
    
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        task: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
          }
        }
      }
    })
    
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
