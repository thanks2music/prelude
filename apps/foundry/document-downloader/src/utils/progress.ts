/**
 * Progress tracking with ETA calculation
 */

import { logger } from './logger.js'

export class ProgressTracker {
  private completed = 0
  private startTime = Date.now()
  private lastDisplayTime = 0
  private displayInterval = 1000 // Display update every 1 second minimum

  constructor(private total: number) {}

  /**
   * Increment completed count and display progress
   */
  increment(): void {
    this.completed++
    this.displayIfNeeded()
  }

  /**
   * Display progress only if enough time has passed or if completed
   */
  private displayIfNeeded(): void {
    const now = Date.now()
    const timeSinceLastDisplay = now - this.lastDisplayTime

    // Always display on completion or if interval has passed
    if (this.completed === this.total || timeSinceLastDisplay >= this.displayInterval) {
      this.display()
      this.lastDisplayTime = now
    }
  }

  /**
   * Force display progress
   */
  display(): void {
    const percent = Math.round((this.completed / this.total) * 100)
    const elapsed = Date.now() - this.startTime
    const elapsedSeconds = elapsed / 1000

    if (this.completed === 0) {
      logger.log(`Starting download of ${this.total} files...`)
      return
    }

    const rate = this.completed / elapsedSeconds
    const remaining = this.total - this.completed
    const etaSeconds = remaining / rate

    const formatTime = (seconds: number): string => {
      if (seconds < 60) {
        return `${Math.ceil(seconds)}s`
      }
      const minutes = Math.floor(seconds / 60)
      const secs = Math.ceil(seconds % 60)
      return `${minutes}m ${secs}s`
    }

    if (this.completed === this.total) {
      logger.log(
        `✅ Complete! Downloaded ${this.completed} files in ${formatTime(elapsedSeconds)}`
      )
    } else {
      logger.log(
        `Progress: ${this.completed}/${this.total} (${percent}%) | Rate: ${rate.toFixed(1)} files/s | ETA: ${formatTime(etaSeconds)}`
      )
    }
  }

  /**
   * Get current progress percentage
   */
  getPercent(): number {
    return Math.round((this.completed / this.total) * 100)
  }

  /**
   * Get completed count
   */
  getCompleted(): number {
    return this.completed
  }

  /**
   * Get total count
   */
  getTotal(): number {
    return this.total
  }
}
