export interface Comment {
  id: string
  content: string
  taskId: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  position: number
  isActive: boolean
  storyPoints: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  comments?: Comment[]
}

export type TaskStatus = Task['status']
export type Priority = Task['priority']

export interface Column {
  id: TaskStatus
  title: string
  tasks: Task[]
}

export interface BoardMetrics {
  totalTasks: number
  completedTasks: number
  totalPoints: number
  completedPoints: number
  avgCycleTimeHours: number | null
  velocityLast7Days: number
  velocityLast30Days: number
}
