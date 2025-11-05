/**
 * Velocity Tracking System
 * Tracks visitor activity over time intervals (5m, 1h, 24h)
 */

import type { VelocityData, VelocityIntervals } from '@kagevoult/types';

export interface VisitorEvent {
  visitorId: string;
  ip: string;
  linkedId?: string;
  country?: string;
  timestamp: number;
  url?: string;
  eventType?: string;
}

export interface VelocityStore {
  addEvent(event: VisitorEvent): Promise<void>;
  getVelocity(visitorId: string): Promise<VelocityData>;
  cleanup(): Promise<void>;
}

/**
 * In-memory velocity store (for development/testing)
 */
export class InMemoryVelocityStore implements VelocityStore {
  private events: VisitorEvent[] = [];
  private readonly maxEvents = 100000; // Limit memory usage

  async addEvent(event: VisitorEvent): Promise<void> {
    this.events.push(event);
    
    // Cleanup old events if limit exceeded
    if (this.events.length > this.maxEvents) {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24h ago
      this.events = this.events.filter(e => e.timestamp > cutoff);
    }
  }

  async getVelocity(visitorId: string): Promise<VelocityData> {
    const now = Date.now();
    const intervals = {
      '5m': now - (5 * 60 * 1000),
      '1h': now - (60 * 60 * 1000),
      '24h': now - (24 * 60 * 60 * 1000)
    };

    // Filter events for this visitor
    const visitorEvents = this.events.filter(e => e.visitorId === visitorId);

    return {
      distinctIp: {
        intervals: this.countDistinct(visitorEvents, intervals, e => e.ip)
      },
      distinctLinkedId: {
        intervals: this.countDistinct(visitorEvents, intervals, e => e.linkedId || '')
      },
      distinctCountry: {
        intervals: this.countDistinct(visitorEvents, intervals, e => e.country || '')
      },
      events: {
        intervals: this.countEvents(visitorEvents, intervals)
      },
      ipEvents: {
        intervals: this.countEventsByIp(visitorEvents, intervals)
      },
      distinctIpByLinkedId: {
        intervals: this.countDistinctIpByLinkedId(visitorEvents, intervals)
      },
      distinctVisitorIdByLinkedId: {
        intervals: this.countDistinctVisitorByLinkedId(visitorEvents, intervals)
      }
    };
  }

  async cleanup(): Promise<void> {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp > cutoff);
  }

  private countDistinct(
    events: VisitorEvent[],
    intervals: Record<string, number>,
    selector: (e: VisitorEvent) => string
  ): VelocityIntervals {
    return {
      '5m': new Set(
        events
          .filter(e => e.timestamp > intervals['5m']!)
          .map(selector)
          .filter(Boolean)
      ).size,
      '1h': new Set(
        events
          .filter(e => e.timestamp > intervals['1h']!)
          .map(selector)
          .filter(Boolean)
      ).size,
      '24h': new Set(
        events
          .filter(e => e.timestamp > intervals['24h']!)
          .map(selector)
          .filter(Boolean)
      ).size
    };
  }

  private countEvents(
    events: VisitorEvent[],
    intervals: Record<string, number>
  ): VelocityIntervals {
    return {
      '5m': events.filter(e => e.timestamp > intervals['5m']!).length,
      '1h': events.filter(e => e.timestamp > intervals['1h']!).length,
      '24h': events.filter(e => e.timestamp > intervals['24h']!).length
    };
  }

  private countEventsByIp(
    events: VisitorEvent[],
    intervals: Record<string, number>
  ): VelocityIntervals {
    // Count all events from IPs seen by this visitor
    const ips = new Set(events.map(e => e.ip));
    const ipEvents = this.events.filter(e => ips.has(e.ip));

    return {
      '5m': ipEvents.filter(e => e.timestamp > intervals['5m']!).length,
      '1h': ipEvents.filter(e => e.timestamp > intervals['1h']!).length,
      '24h': ipEvents.filter(e => e.timestamp > intervals['24h']!).length
    };
  }

  private countDistinctIpByLinkedId(
    events: VisitorEvent[],
    intervals: Record<string, number>
  ): VelocityIntervals {
    const linkedIds = new Set(
      events.map(e => e.linkedId).filter(Boolean)
    );

    if (linkedIds.size === 0) {
      return { '5m': 0, '1h': 0, '24h': 0 };
    }

    const linkedEvents = this.events.filter(e => 
      e.linkedId && linkedIds.has(e.linkedId)
    );

    return {
      '5m': new Set(
        linkedEvents
          .filter(e => e.timestamp > intervals['5m']!)
          .map(e => e.ip)
      ).size,
      '1h': new Set(
        linkedEvents
          .filter(e => e.timestamp > intervals['1h']!)
          .map(e => e.ip)
      ).size,
      '24h': new Set(
        linkedEvents
          .filter(e => e.timestamp > intervals['24h']!)
          .map(e => e.ip)
      ).size
    };
  }

  private countDistinctVisitorByLinkedId(
    events: VisitorEvent[],
    intervals: Record<string, number>
  ): VelocityIntervals {
    const linkedIds = new Set(
      events.map(e => e.linkedId).filter(Boolean)
    );

    if (linkedIds.size === 0) {
      return { '5m': 0, '1h': 0, '24h': 0 };
    }

    const linkedEvents = this.events.filter(e => 
      e.linkedId && linkedIds.has(e.linkedId)
    );

    return {
      '5m': new Set(
        linkedEvents
          .filter(e => e.timestamp > intervals['5m']!)
          .map(e => e.visitorId)
      ).size,
      '1h': new Set(
        linkedEvents
          .filter(e => e.timestamp > intervals['1h']!)
          .map(e => e.visitorId)
      ).size,
      '24h': new Set(
        linkedEvents
          .filter(e => e.timestamp > intervals['24h']!)
          .map(e => e.visitorId)
      ).size
    };
  }
}

/**
 * Velocity tracking service
 */
export class VelocityTracker {
  private store: VelocityStore;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(store?: VelocityStore) {
    this.store = store || new InMemoryVelocityStore();
    this.startCleanup();
  }

  /**
   * Track a visitor event
   */
  async track(event: VisitorEvent): Promise<void> {
    await this.store.addEvent(event);
  }

  /**
   * Get velocity data for a visitor
   */
  async getVelocity(visitorId: string): Promise<VelocityData> {
    return this.store.getVelocity(visitorId);
  }

  /**
   * Analyze velocity for risk signals
   */
  async analyzeVelocity(visitorId: string): Promise<VelocityAnalysis> {
    const velocity = await this.getVelocity(visitorId);
    
    const signals: string[] = [];
    let riskScore = 0;

    // Check for rapid IP changes
    if (velocity.distinctIp.intervals['5m'] > 3) {
      signals.push('rapid_ip_changes');
      riskScore += 0.3;
    }

    // Check for high activity
    if (velocity.events.intervals['5m'] > 50) {
      signals.push('high_activity');
      riskScore += 0.2;
    }

    // Check for distributed activity (many IPs)
    if (velocity.distinctIp.intervals['1h'] > 10) {
      signals.push('distributed_activity');
      riskScore += 0.4;
    }

    // Check for account sharing (many visitors per linkedId)
    if (velocity.distinctVisitorIdByLinkedId.intervals['1h'] > 5) {
      signals.push('account_sharing');
      riskScore += 0.3;
    }

    // Check for IP sharing (many events from same IP)
    const avgEventsPerIp = velocity.ipEvents.intervals['1h'] / 
      Math.max(1, velocity.distinctIp.intervals['1h']);
    if (avgEventsPerIp > 20) {
      signals.push('ip_sharing');
      riskScore += 0.2;
    }

    return {
      velocity,
      signals,
      riskScore: Math.min(riskScore, 1)
    };
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    // Cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.store.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop the tracker and cleanup
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export interface VelocityAnalysis {
  velocity: VelocityData;
  signals: string[];
  riskScore: number; // 0-1
}

/**
 * Database-backed velocity store (for production)
 * Implement with your database of choice (PostgreSQL, MongoDB, Redis, etc.)
 */
export class DatabaseVelocityStore implements VelocityStore {
  // Placeholder for database implementation
  async addEvent(event: VisitorEvent): Promise<void> {
    // INSERT INTO events (visitor_id, ip, linked_id, country, timestamp, url, event_type)
    // VALUES ($1, $2, $3, $4, $5, $6, $7)
    throw new Error('Database store not implemented');
  }

  async getVelocity(visitorId: string): Promise<VelocityData> {
    // SELECT COUNT(DISTINCT ip) FROM events 
    // WHERE visitor_id = $1 AND timestamp > $2
    throw new Error('Database store not implemented');
  }

  async cleanup(): Promise<void> {
    // DELETE FROM events WHERE timestamp < $1
    throw new Error('Database store not implemented');
  }
}

// Export default instance
export const velocityTracker = new VelocityTracker();
