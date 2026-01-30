import { prisma } from './prisma'

export async function logActivity(
  taskId: string,
  type: string,
  actor: 'agent' | 'human',
  field?: string,
  oldValue?: string | null,
  newValue?: string | null
) {
  return prisma.activity.create({
    data: {
      taskId,
      type,
      actor,
      field,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    },
  })
}

// Determine actor based on context (could be enhanced with auth)
export function determineActor(): 'agent' | 'human' {
  // For now, assume API calls from the board UI are human
  // Agent calls would need to pass an actor header
  return 'human'
}
