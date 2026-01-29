export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TaskStatus = Task['status']
export type Priority = Task['priority']

export interface Column {
  id: TaskStatus
  title: string
  tasks: Task[]
}
