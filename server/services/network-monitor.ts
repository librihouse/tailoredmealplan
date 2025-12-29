/**
 * Network Monitor
 * Monitors connection health and provides network status information
 */

interface NetworkStatus {
  isHealthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  averageResponseTime: number | null;
}

class NetworkMonitor {
  private status: NetworkStatus = {
    isHealthy: true,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    averageResponseTime: null,
  };

  private responseTimes: number[] = [];
  private readonly maxResponseTimeHistory = 10;

  /**
   * Record a successful API call
   */
  recordSuccess(responseTime: number): void {
    this.status.isHealthy = true;
    this.status.consecutiveFailures = 0;
    this.status.lastCheck = new Date();

    // Track response times for average calculation
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // Calculate average response time
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.status.averageResponseTime = sum / this.responseTimes.length;
    }
  }

  /**
   * Record a failed API call
   */
  recordFailure(): void {
    this.status.consecutiveFailures++;
    this.status.lastCheck = new Date();

    // Mark as unhealthy after 3 consecutive failures
    if (this.status.consecutiveFailures >= 3) {
      this.status.isHealthy = false;
    }
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Check if network is healthy
   */
  isHealthy(): boolean {
    // Reset health status if enough time has passed since last failure
    const timeSinceLastCheck = Date.now() - this.status.lastCheck.getTime();
    if (timeSinceLastCheck > 60000 && this.status.consecutiveFailures > 0) {
      // If it's been more than a minute, reduce failure count
      this.status.consecutiveFailures = Math.max(0, this.status.consecutiveFailures - 1);
      if (this.status.consecutiveFailures === 0) {
        this.status.isHealthy = true;
      }
    }

    return this.status.isHealthy;
  }

  /**
   * Reset monitor state
   */
  reset(): void {
    this.status = {
      isHealthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      averageResponseTime: null,
    };
    this.responseTimes = [];
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();

