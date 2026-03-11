/**
 * Auto-Agent Daemon - Task Watcher
 *
 * Watches tasks/ directory for new mission files and dispatches to workers.
 *
 * Features:
 * - File-based queue (drop file = auto execute)
 * - Priority scheduling (P0 > P1 > P2)
 * - Duplicate detection
 * - Archive completed missions
 */

import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { createLogger } from '@/utils/logger'

const logger = createLogger('TaskWatcher')

export interface TaskFile {
  id: string
  filename: string
  path: string
  content: string
  priority: 'p0' | 'p1' | 'p2'
  createdAt: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface DaemonConfig {
  tasksDir: string
  processedDir: string
  pollIntervalMs: number
  maxConcurrent: number
}

const DEFAULT_CONFIG: DaemonConfig = {
  tasksDir: './tasks',
  processedDir: './tasks/processed',
  pollIntervalMs: 2000,
  maxConcurrent: 3,
}

export class TaskWatcher extends EventEmitter {
  private config: DaemonConfig
  private polling: boolean = false
  private pollTimer: NodeJS.Timeout | null = null
  private processedFiles: Set<string> = new Set()

  constructor(config: Partial<DaemonConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start watching for task files
   */
  start(): void {
    if (this.polling) return

    this.ensureDirectories()
    this.polling = true
    this.poll()

    logger.info('Started', { tasksDir: this.config.tasksDir })
  }

  /**
   * Stop watching
   */
  stop(): void {
    this.polling = false
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
    logger.info('Stopped')
  }

  /**
   * Poll for new task files
   */
  private poll(): void {
    if (!this.polling) return

    try {
      const files = fs.readdirSync(this.config.tasksDir)

      for (const file of files) {
        if (!file.endsWith('.txt') || this.processedFiles.has(file)) continue

        const filePath = path.join(this.config.tasksDir, file)
        const stat = fs.statSync(filePath)

        // Skip files modified in last 2s (still being written)
        if (Date.now() - stat.mtimeMs < 2000) continue

        const task = this.parseTaskFile(filePath, file)

        if (task) {
          this.processedFiles.add(file)
          this.emit('task:found', task)
        }
      }
    } catch (error) {
      logger.error('Poll error', { error })
    }

    this.pollTimer = setTimeout(() => this.poll(), this.config.pollIntervalMs)
  }

  /**
   * Parse task file and extract metadata
   */
  private parseTaskFile(filePath: string, filename: string): TaskFile | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim()

      if (!content) return null

      // Extract priority from filename
      const priorityMatch = filename.match(/^(p[0-2])[_-]/i)
      const priority: TaskFile['priority'] = priorityMatch
        ? (priorityMatch[1].toLowerCase() as TaskFile['priority'])
        : 'p1'

      // Extract ID from filename
      const idMatch = filename.match(/(?:p[0-2][_-])?([a-z0-9_-]+)/i)
      const id = idMatch ? idMatch[1] : `task_${Date.now()}`

      return {
        id,
        filename,
        path: filePath,
        content,
        priority,
        createdAt: Date.now(),
        status: 'pending',
      }
    } catch (error) {
      logger.error('Parse error', { error })
      return null
    }
  }

  /**
   * Archive completed task
   */
  archiveTask(task: TaskFile, _status: 'completed' | 'failed'): void {
    const archiveName = `${new Date().toISOString().slice(0, 10)}_${task.filename}`
    const archivePath = path.join(this.config.processedDir, archiveName)

    fs.mkdirSync(this.config.processedDir, { recursive: true })
    fs.copyFileSync(task.path, archivePath)
    fs.unlinkSync(task.path)

    logger.info('Task archived', { original: task.filename, archive: archiveName })
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    fs.mkdirSync(this.config.tasksDir, { recursive: true })
    fs.mkdirSync(this.config.processedDir, { recursive: true })
  }
}
