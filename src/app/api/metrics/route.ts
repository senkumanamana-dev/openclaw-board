import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany()
    
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const completedTasks = tasks.filter(t => t.status === 'DONE')
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    
    // Calculate average cycle time (startedAt to completedAt) for completed tasks
    const tasksWithCycleTime = completedTasks.filter(t => t.startedAt && t.completedAt)
    let avgCycleTimeHours: number | null = null
    if (tasksWithCycleTime.length > 0) {
      const totalCycleMs = tasksWithCycleTime.reduce((sum, t) => {
        const start = new Date(t.startedAt!).getTime()
        const end = new Date(t.completedAt!).getTime()
        return sum + (end - start)
      }, 0)
      avgCycleTimeHours = Math.round((totalCycleMs / tasksWithCycleTime.length) / (1000 * 60 * 60) * 10) / 10
    }
    
    // Velocity: story points completed in time period
    const velocityLast7Days = completedTasks
      .filter(t => t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    
    const velocityLast30Days = completedTasks
      .filter(t => t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    
    // Tasks in progress
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS')
    
    // Lead time (createdAt to completedAt)
    const tasksWithLeadTime = completedTasks.filter(t => t.completedAt)
    let avgLeadTimeHours: number | null = null
    if (tasksWithLeadTime.length > 0) {
      const totalLeadMs = tasksWithLeadTime.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime()
        const completed = new Date(t.completedAt!).getTime()
        return sum + (completed - created)
      }, 0)
      avgLeadTimeHours = Math.round((totalLeadMs / tasksWithLeadTime.length) / (1000 * 60 * 60) * 10) / 10
    }
    
    return NextResponse.json({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      todoTasks: tasks.filter(t => t.status === 'TODO').length,
      totalPoints,
      completedPoints,
      avgCycleTimeHours,
      avgLeadTimeHours,
      velocityLast7Days,
      velocityLast30Days,
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
