/**
 * Auto-Agent Daemon - Queue Manager
 *
 * Priority-based task queue with concurrency control.
 */

import { TaskFile } from './task-watcher'

type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed'

export class QueueManager {
  private queue: TaskFile[] = []
  private processing: Map<string, TaskFile> = new Map()
  private maxConcurrent: number

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * Add task to queue (priority sorted)
   */
  enqueue(task: TaskFile): void {
    this.queue.push(task)
    this.queue.sort((a, b) => {
      const priorityOrder = { p0: 0, p1: 1, p2: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Get next task from queue
   */
  dequeue(): TaskFile | null {
    if (this.processing.size >= this.maxConcurrent) return null
    return this.queue.shift() || null
  }

  /**
   * Mark task as processing
   */
  startProcessing(task: TaskFile): void {
    this.processing.set(task.id, task)
    task.status = 'processing'
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, status: QueueStatus): TaskFile | null {
    const task = this.processing.get(taskId)
    if (task) {
      task.status = status
      this.processing.delete(taskId)
    }
    return task || null
  }

  /**
   * Get queue stats
   */
  getStats(): { pending: number; processing: number; available: number } {
    return {
      pending: this.queue.length,
      processing: this.processing.size,
      available: this.maxConcurrent - this.processing.size,
    }
  }

  /**
   * Get all pending tasks
   */
  getPendingTasks(): TaskFile[] {
    return [...this.queue]
  }
}
