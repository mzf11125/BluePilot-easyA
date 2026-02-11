/**
 * Offline queue for storing actions when offline
 * Actions are executed when connection is restored
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const QUEUE_STORAGE_KEY = "bluepilot_offline_queue";

interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount?: number;
}

type QueueListener = (actions: QueuedAction[]) => void;

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private isOnline = true;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the offline queue
   */
  private async initialize(): Promise<void> {
    // Load persisted queue
    await this.loadQueue();

    // Setup network listener
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        this.notifyListeners();
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.queue]));
  }

  /**
   * Process all queued actions
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.isOnline) {
      return;
    }

    this.isProcessing = true;

    // Process actions in order
    while (this.queue.length > 0 && this.isOnline) {
      const action = this.queue[0];

      try {
        await this.executeAction(action);
        // Remove successful action
        this.queue.shift();
        await this.saveQueue();
      } catch (error) {
        // Increment retry count
        action.retryCount = (action.retryCount || 0) + 1;

        // Remove if max retries exceeded
        if (action.retryCount >= 3) {
          this.queue.shift();
        }

        await this.saveQueue();
        break; // Stop processing on error
      }
    }

    this.isProcessing = false;
    this.notifyListeners();
  }

  /**
   * Execute a single queued action
   * This is a placeholder - override with actual execution logic
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    // This would be implemented based on action type
    console.log("Executing queued action:", action);
    throw new Error("Not implemented");
  }

  /**
   * Add an action to the queue
   */
  async enqueue(type: string, payload: any): Promise<string> {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
      timestamp: Date.now(),
    };

    this.queue.push(action);
    await this.saveQueue();
    this.notifyListeners();

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return action.id;
  }

  /**
   * Remove an action from the queue
   */
  async dequeue(actionId: string): Promise<boolean> {
    const index = this.queue.findIndex((a) => a.id === actionId);

    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.saveQueue();
      this.notifyListeners();
      return true;
    }

    return false;
  }

  /**
   * Clear all actions from the queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Get all queued actions
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Get queue length
   */
  getLength(): number {
    return this.queue.length;
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener([...this.queue]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if currently online
   */
  async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();
