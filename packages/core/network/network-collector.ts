/**
 * Complete Network Fingerprint Collector
 * 
 * Combines all network-level fingerprinting:
 * - HTTP headers analysis
 * - Proxy/VPN detection
 * - Network timing and connection type
 * - TLS/JA3 fingerprinting (when available)
 * - IP address information
 */

import type { HTTPHeadersFingerprint, ProxyHeaders, NetworkFingerprint } from './headers';
import type { TLSFingerprint } from './tls-fingerprint';
import type { NetworkTimingFingerprint } from './timing';

import {
  extractHeadersFromRequest,
  extractHeadersFromObject,
  extractProxyHeaders,
  hashHeadersFingerprint,
  detectBrowserFromHeaders,
  detectProxyHeaders,
  detectBot,
  analyzeHeaderOrder,
} from './headers';

import {
  extractJA3FromHeaders,
  identifyClientFromJA3,
  detectBotFromJA3,
} from './tls-fingerprint';

import {
  getNetworkInformation,
  getNetworkTimingFingerprint,
  isMobileNetwork,
  hasDataSaver,
  getNetworkQualityScore,
} from './timing';

/**
 * Complete network fingerprint with all signals
 */
export interface CompleteNetworkFingerprint {
  ip: string;
  ipVersion: 4 | 6;
  headers: HTTPHeadersFingerprint;
  proxy: ProxyHeaders & {
    isProxy: boolean;
    proxyType: 'transparent' | 'anonymous' | 'elite' | 'none';
    indicators: string[];
  };
  timing?: NetworkTimingFingerprint;
  tls?: {
    ja3Hash?: string;
    clientIdentified?: string;
  };
  analysis: {
    browser: {
      name: string;
      version: string;
      confidence: number;
    };
    isBot: boolean;
    botType: string | null;
    botConfidence: number;
    headerPattern: string;
    isMobile: boolean;
    hasDataSaver: boolean;
    networkQuality: number;
  };
  hash: string;
  timestamp: number;
}

/**
 * Simplified network fingerprint (server-side, no timing)
 */
export interface ServerNetworkFingerprint {
  ip: string;
  ipVersion: 4 | 6;
  headers: HTTPHeadersFingerprint;
  proxy: ProxyHeaders;
  tls?: {
    ja3Hash?: string;
  };
  hash: string;
  timestamp: number;
}

/**
 * Collect complete network fingerprint from Request (client or server)
 */
export async function collectNetworkFingerprint(
  request: Request,
  clientIp: string,
  options: {
    includeTiming?: boolean;
    includeTLS?: boolean;
  } = {}
): Promise<CompleteNetworkFingerprint> {
  const { includeTiming = true, includeTLS = true } = options;

  // Extract headers
  const headers = extractHeadersFromRequest(request);
  headers.hash = await hashHeadersFingerprint(headers);

  // Extract proxy headers
  const headersObj: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });
  const proxyHeaders = extractProxyHeaders(headersObj);
  const proxyInfo = detectProxyHeaders(proxyHeaders, headers.headerOrder);

  // Analyze browser
  const browserInfo = detectBrowserFromHeaders(headers);

  // Detect bot
  const botInfo = detectBot(headers);

  // Analyze header order
  const headerPattern = analyzeHeaderOrder(headers.headerOrder);

  // Network timing (client-side only)
  let timing: NetworkTimingFingerprint | undefined;
  let isMobile = false;
  let dataSaver = false;
  let networkQuality = 0;

  if (includeTiming && typeof navigator !== 'undefined') {
    timing = getNetworkInformation();
    isMobile = isMobileNetwork();
    dataSaver = hasDataSaver();
    networkQuality = getNetworkQualityScore();
  }

  // TLS fingerprint (if available from proxy/CDN)
  let tls: { ja3Hash?: string; clientIdentified?: string } | undefined;
  if (includeTLS) {
    const ja3Info = extractJA3FromHeaders(headersObj);
    if (ja3Info?.ja3 || ja3Info?.ja3Digest) {
      const ja3Hash = ja3Info.ja3 || ja3Info.ja3Digest || '';
      const clientInfo = identifyClientFromJA3(ja3Hash);
      tls = {
        ja3Hash,
        clientIdentified: clientInfo.isKnown ? clientInfo.client : undefined,
      };

      // Check if JA3 indicates bot
      if (detectBotFromJA3(ja3Hash) && !botInfo.isBot) {
        botInfo.isBot = true;
        botInfo.botType = 'Bot (detected via JA3)';
        botInfo.confidence = 0.9;
      }
    }
  }

  // Combine everything
  const fingerprint: CompleteNetworkFingerprint = {
    ip: clientIp,
    ipVersion: clientIp.includes(':') ? 6 : 4,
    headers,
    proxy: {
      ...proxyHeaders,
      ...proxyInfo,
    },
    timing,
    tls,
    analysis: {
      browser: {
        name: browserInfo.browser,
        version: browserInfo.version,
        confidence: browserInfo.confidence,
      },
      isBot: botInfo.isBot,
      botType: botInfo.botType,
      botConfidence: botInfo.confidence,
      headerPattern: headerPattern.pattern,
      isMobile,
      hasDataSaver: dataSaver,
      networkQuality,
    },
    hash: '', // Will be set below
    timestamp: Date.now(),
  };

  // Generate combined hash
  fingerprint.hash = await generateNetworkHash(fingerprint);

  return fingerprint;
}

/**
 * Collect server-side network fingerprint (no timing data)
 */
export async function collectServerNetworkFingerprint(
  headers: Record<string, string | string[] | undefined>,
  clientIp: string
): Promise<ServerNetworkFingerprint> {
  const headersFp = extractHeadersFromObject(headers);
  headersFp.hash = await hashHeadersFingerprint(headersFp);

  const normalizedHeaders: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      normalizedHeaders[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  const proxyHeaders = extractProxyHeaders(normalizedHeaders);

  // Check for JA3
  const ja3Info = extractJA3FromHeaders(normalizedHeaders);
  const tls = ja3Info?.ja3 || ja3Info?.ja3Digest
    ? { ja3Hash: ja3Info.ja3 || ja3Info.ja3Digest }
    : undefined;

  const fingerprint: ServerNetworkFingerprint = {
    ip: clientIp,
    ipVersion: clientIp.includes(':') ? 6 : 4,
    headers: headersFp,
    proxy: proxyHeaders,
    tls,
    hash: '',
    timestamp: Date.now(),
  };

  // Generate hash
  const hashData = JSON.stringify({
    headers: headersFp.hash,
    proxy: proxyHeaders,
    tls: tls?.ja3Hash,
  });
  fingerprint.hash = await hashString(hashData);

  return fingerprint;
}

/**
 * Generate combined network hash
 */
async function generateNetworkHash(fingerprint: CompleteNetworkFingerprint): Promise<string> {
  const data = JSON.stringify({
    headers: fingerprint.headers.hash,
    proxy: fingerprint.proxy,
    tls: fingerprint.tls?.ja3Hash,
    timing: fingerprint.timing?.effectiveType,
  });

  return await hashString(data);
}

/**
 * Hash helper
 */
async function hashString(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return simpleHash(str);
    }
  }
  return simpleHash(str);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get client IP from request (handles proxies)
 */
export function getClientIP(request: Request): string {
  const headersObj: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headersObj[key.toLowerCase()] = value;
  });

  // Check proxy headers in order of trust
  const ip =
    headersObj['cf-connecting-ip'] || // Cloudflare
    headersObj['true-client-ip'] || // Akamai
    headersObj['x-real-ip'] || // Nginx
    headersObj['x-forwarded-for']?.split(',')[0]?.trim() || // Standard proxy
    headersObj['x-client-ip'] ||
    'unknown';

  return ip;
}

/**
 * Get client IP from Node.js request object
 */
export function getClientIPFromNode(
  req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }
): string {
  const headers = req.headers;
  
  // Check proxy headers
  const cfIp = headers['cf-connecting-ip'];
  const trueIp = headers['true-client-ip'];
  const realIp = headers['x-real-ip'];
  const forwardedFor = headers['x-forwarded-for'];

  if (cfIp && typeof cfIp === 'string') return cfIp;
  if (trueIp && typeof trueIp === 'string') return trueIp;
  if (realIp && typeof realIp === 'string') return realIp;
  if (forwardedFor) {
    const forwardedStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    if (forwardedStr) {
      const ips = forwardedStr.split(',');
      const firstIp = ips[0]?.trim();
      if (firstIp) return firstIp;
    }
  }

  // Fall back to socket IP
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Calculate confidence score for network fingerprint (0-100)
 */
export function calculateNetworkConfidence(fingerprint: CompleteNetworkFingerprint): number {
  let score = 0;
  let maxScore = 0;

  // Headers present (30 points)
  maxScore += 30;
  if (fingerprint.headers.hash) score += 30;

  // Browser detected (20 points)
  maxScore += 20;
  score += fingerprint.analysis.browser.confidence * 20;

  // TLS fingerprint (25 points)
  maxScore += 25;
  if (fingerprint.tls?.ja3Hash) score += 25;

  // Timing data (15 points)
  maxScore += 15;
  if (fingerprint.timing?.rtt !== undefined) score += 15;

  // Not detected as bot (10 points)
  maxScore += 10;
  if (!fingerprint.analysis.isBot) score += 10;

  return Math.round((score / maxScore) * 100);
}
