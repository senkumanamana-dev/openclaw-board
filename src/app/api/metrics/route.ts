import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    const days = parseInt(searchParams.get('days') || '30', 10)
    
    const since = new Date()
    since.setDate(since.getDate() - days)
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Get all non-archived tasks for basic counts
    const allTasks = await prisma.task.findMany({
      where: { archived: false },
      include: detailed ? {
        statusHistory: { orderBy: { enteredAt: 'asc' } }
      } : undefined
    })
    
    // Get completed tasks for velocity (include archived - they still count!)
    const completedLast30Days = await prisma.task.findMany({
      where: {
        status: 'DONE',
        completedAt: { gte: since }
      },
      include: {
        statusHistory: { orderBy: { enteredAt: 'asc' } }
      }
    })
    
    const completedLast7Days = completedLast30Days.filter(
      (t: any) => t.completedAt && t.completedAt >= sevenDaysAgo
    )
    
    // Basic counts
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter((t: any) => t.status === 'DONE').length
    const inProgressTasks = allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length
    const todoTasks = allTasks.filter((t: any) => t.status === 'TODO').length
    const totalPoints = allTasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0)
    const completedPoints = allTasks
      .filter((t: any) => t.status === 'DONE')
      .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0)
    
    // Calculate cycle times (time from creation to completion)
    const cycleTimes = completedLast30Days
      .filter((t: any) => t.completedAt && t.createdAt)
      .map((t: any) => (t.completedAt!.getTime() - t.createdAt.getTime()) / 1000 / 3600) // hours
    
    const avgCycleTimeHours = cycleTimes.length > 0
      ? Math.round((cycleTimes.reduce((a: number, b: number) => a + b, 0) / cycleTimes.length) * 10) / 10
      : null
    
    // Calculate lead times (time from IN_PROGRESS to completion)
    const leadTimes = completedLast30Days
      .filter((t: any) => t.completedAt && t.startedAt)
      .map((t: any) => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 1000 / 3600) // hours
    
    const avgLeadTimeHours = leadTimes.length > 0
      ? Math.round((leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length) * 10) / 10
      : null
    
    // Velocity (points completed)
    const velocityLast7Days = completedLast7Days.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0)
    const velocityLast30Days = completedLast30Days.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0)
    
    // Basic response for the metrics panel
    const basicMetrics = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalPoints,
      completedPoints,
      avgCycleTimeHours,
      avgLeadTimeHours,
      velocityLast7Days,
      velocityLast30Days
    }
    
    if (!detailed) {
      return NextResponse.json(basicMetrics)
    }
    
    // Detailed response with per-task breakdown
    const taskMetrics = completedLast30Days.slice(0, 20).map((task: any) => {
      const history = task.statusHistory
      
      let timeInTodo = 0
      let timeInProgress = 0
      let timeInReview = 0
      
      for (const entry of history as any[]) {
        const duration = entry.duration || 0
        switch (entry.status) {
          case 'TODO':
            timeInTodo += duration
            break
          case 'IN_PROGRESS':
            timeInProgress += duration
            break
          case 'NEEDS_REVIEW':
            timeInReview += duration
            break
        }
      }
      
      const totalCycleTime = task.completedAt && task.createdAt
        ? Math.floor((task.completedAt.getTime() - task.createdAt.getTime()) / 1000)
        : null
      
      return {
        taskId: task.id,
        taskNumber: task.taskNumber,
        title: task.title,
        storyPoints: task.storyPoints,
        totalCycleTime,
        timeInTodo,
        timeInProgress,
        timeInReview,
        completedAt: task.completedAt
      }
    })
    
    // Daily velocity breakdown
    const velocityByDay: Record<string, { tasks: number; points: number }> = {}
    
    for (const task of completedLast30Days as any[]) {
      if (!task.completedAt) continue
      const dayKey = task.completedAt.toISOString().split('T')[0]
      
      if (!velocityByDay[dayKey]) {
        velocityByDay[dayKey] = { tasks: 0, points: 0 }
      }
      
      velocityByDay[dayKey].tasks++
      velocityByDay[dayKey].points += task.storyPoints || 0
    }
    
    const velocity = Object.entries(velocityByDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([period, data]) => ({
        period,
        tasksCompleted: data.tasks,
        pointsCompleted: data.points
      }))
    
    return NextResponse.json({
      ...basicMetrics,
      taskMetrics,
      velocity,
      periodDays: days
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
