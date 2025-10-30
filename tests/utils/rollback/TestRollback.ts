export class TestRollback {
  private snapshots: Map<string, unknown>;

  constructor() {
    this.snapshots = new Map();
  }

  /**
   * Create a snapshot of current state
   */
  createSnapshot(id: string, data: unknown): void {
    this.snapshots.set(id, JSON.parse(JSON.stringify(data)));
  }

  /**
   * Restore a snapshot
   */
  restoreSnapshot(id: string): unknown {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${id}`);
    }
    return JSON.parse(JSON.stringify(snapshot));
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }

  /**
   * List all snapshots
   */
  listSnapshots(): string[] {
    return Array.from(this.snapshots.keys());
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Check if snapshot exists
   */
  hasSnapshot(id: string): boolean {
    return this.snapshots.has(id);
  }

  /**
   * Get snapshot count
   */
  getSnapshotCount(): number {
    return this.snapshots.size;
  }
}
