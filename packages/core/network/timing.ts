/**
 * Network Timing and Connection Fingerprinting
 * 
 * Analyzes network characteristics to create a unique profile:
 * - Connection latency patterns
 * - DNS resolution time
 * - TCP handshake characteristics
 * - Download/upload speed patterns
 * - Connection type (via Network Information API)
 */

export interface NetworkTimingFingerprint {
  rtt?: number; // Round-trip time
  downlink?: number; // Effective bandwidth estimate (Mbps)
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  connectionType?: ConnectionType;
  dnsTime?: number;
  tcpTime?: number;
  tlsTime?: number;
  timestamp: number;
}

export type ConnectionType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

/**
 * Network Information API interface
 */
interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: ConnectionType;
  onchange: ((this: NetworkInformation, ev: Event) => any) | null;
}

/**
 * Get network information from Network Information API
 */
export function getNetworkInformation(): NetworkTimingFingerprint {
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };

  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection) {
    return {
      rtt: connection.rtt,
      downlink: connection.downlink,
      effectiveType: connection.effectiveType,
      saveData: connection.saveData,
      connectionType: connection.type || 'unknown',
      timestamp: Date.now(),
    };
  }

  return {
    connectionType: 'unknown',
    timestamp: Date.now(),
  };
}

/**
 * Measure DNS resolution time by checking Resource Timing API
 */
export function measureDNSTime(url: string): number | undefined {
  if (!performance || !performance.getEntriesByName) {
    return undefined;
  }

  const entries = performance.getEntriesByName(url);
  if (entries.length > 0) {
    const entry = entries[0] as PerformanceResourceTiming;
    return entry.domainLookupEnd - entry.domainLookupStart;
  }

  return undefined;
}

/**
 * Measure TCP connection time
 */
export function measureTCPTime(url: string): number | undefined {
  if (!performance || !performance.getEntriesByName) {
    return undefined;
  }

  const entries = performance.getEntriesByName(url);
  if (entries.length > 0) {
    const entry = entries[0] as PerformanceResourceTiming;
    return entry.connectEnd - entry.connectStart;
  }

  return undefined;
}

/**
 * Measure TLS negotiation time
 */
export function measureTLSTime(url: string): number | undefined {
  if (!performance || !performance.getEntriesByName) {
    return undefined;
  }

  const entries = performance.getEntriesByName(url);
  if (entries.length > 0) {
    const entry = entries[0] as PerformanceResourceTiming;
    if (entry.secureConnectionStart > 0) {
      return entry.connectEnd - entry.secureConnectionStart;
    }
  }

  return undefined;
}

/**
 * Measure round-trip time to a server
 */
export async function measureRTT(url: string): Promise<number> {
  const start = performance.now();
  
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    
    const end = performance.now();
    return end - start;
  } catch (error) {
    return -1;
  }
}

/**
 * Estimate download speed by downloading a known-size resource
 */
export async function measureDownloadSpeed(url: string, sizeBytes: number): Promise<number> {
  const start = performance.now();
  
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    await response.blob();
    
    const end = performance.now();
    const durationSeconds = (end - start) / 1000;
    const speedMbps = (sizeBytes * 8) / (durationSeconds * 1000000);
    
    return speedMbps;
  } catch (error) {
    return -1;
  }
}

/**
 * Get comprehensive network timing fingerprint
 */
export async function getNetworkTimingFingerprint(
  testUrl?: string
): Promise<NetworkTimingFingerprint> {
  const baseInfo = getNetworkInformation();

  if (testUrl) {
    const rttMeasured = await measureRTT(testUrl);
    const dnsTime = measureDNSTime(testUrl);
    const tcpTime = measureTCPTime(testUrl);
    const tlsTime = measureTLSTime(testUrl);

    return {
      ...baseInfo,
      rtt: rttMeasured > 0 ? rttMeasured : baseInfo.rtt,
      dnsTime,
      tcpTime,
      tlsTime,
    };
  }

  return baseInfo;
}

/**
 * Detect if user is on mobile network
 */
export function isMobileNetwork(): boolean {
  const info = getNetworkInformation();
  return info.connectionType === 'cellular' ||
         info.effectiveType === '2g' ||
         info.effectiveType === '3g' ||
         info.effectiveType === '4g';
}

/**
 * Detect if user has data saver enabled
 */
export function hasDataSaver(): boolean {
  const info = getNetworkInformation();
  return info.saveData === true;
}

/**
 * Get network quality score (0-100)
 */
export function getNetworkQualityScore(): number {
  const info = getNetworkInformation();
  
  let score = 50; // Base score

  // RTT scoring
  if (info.rtt !== undefined) {
    if (info.rtt < 50) score += 25;
    else if (info.rtt < 100) score += 15;
    else if (info.rtt < 200) score += 5;
    else score -= 10;
  }

  // Downlink scoring
  if (info.downlink !== undefined) {
    if (info.downlink > 10) score += 25;
    else if (info.downlink > 5) score += 15;
    else if (info.downlink > 1) score += 5;
    else score -= 10;
  }

  // Effective type scoring
  if (info.effectiveType === '4g') score += 10;
  else if (info.effectiveType === '3g') score += 0;
  else if (info.effectiveType === '2g') score -= 10;
  else if (info.effectiveType === 'slow-2g') score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Monitor network changes (returns cleanup function)
 */
export function monitorNetworkChanges(
  callback: (info: NetworkTimingFingerprint) => void
): () => void {
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };

  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection && connection.addEventListener) {
    const handler = () => {
      callback(getNetworkInformation());
    };

    connection.addEventListener('change', handler);

    return () => {
      connection.removeEventListener('change', handler);
    };
  }

  // No-op cleanup if not supported
  return () => {};
}
