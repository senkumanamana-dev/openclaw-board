export interface Comment {
  id: string
  content: string
  taskId: string
  createdAt: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  position: number
  taskId: string
  createdAt: string
}

export interface Activity {
  id: string
  type: string
  actor: 'agent' | 'human'
  field: string | null
  oldValue: string | null
  newValue: string | null
  taskId: string
  createdAt: string
}

export interface Attachment {
  id: string
  type: 'link' | 'code' | 'note' | 'file'
  title: string | null
  content: string
  mimeType: string | null
  taskId: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  position: number
  isActive: boolean
  storyPoints: number | null
  archived: boolean
  archivedAt: string | null
  blockedReason: string | null
  startedAt: string | null
  reviewedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  comments?: Comment[]
  subtasks?: Subtask[]
  attachments?: Attachment[]
  activities?: Activity[]
  blockedBy?: Task[]
  blocking?: Task[]
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
