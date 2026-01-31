import { KanbanBoard } from '@/components/kanban-board'
import { ActivityFeed } from '@/components/activity-feed'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <KanbanBoard />
      <ActivityFeed />
    </main>
  )
}
