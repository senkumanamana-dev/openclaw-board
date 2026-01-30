import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const priority = searchParams.get('priority')
    const tag = searchParams.get('tag')
    
    const where: Record<string, unknown> = { archived: true }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (priority && priority !== 'ALL') {
      where.priority = priority
    }
    
    if (tag && tag !== 'ALL') {
      where.tags = { has: tag }
    }
    
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      include: { 
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
      },
    })
    
    // Get archive stats
    const stats = await prisma.task.aggregate({
      where: { archived: true },
      _count: true,
      _sum: { storyPoints: true },
    })
    
    return NextResponse.json({
      tasks,
      stats: {
        totalArchived: stats._count,
        totalPoints: stats._sum.storyPoints || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching archive:', error)
    return NextResponse.json({ error: 'Failed to fetch archive' }, { status: 500 })
  }
}
