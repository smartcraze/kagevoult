/**
 * Master Fingerprint Response Builder
 * Combines all detection modules into a complete Fingerprint.com-style response
 */

import type {
  FingerprintResponse,
  FingerprintProducts,
  IdentificationData,
  BotDetectionData,
  VPNData,
  ProxyData,
  IncognitoData,
  TamperingData,
  RawDeviceAttributes,
  DeveloperToolsData,
  VirtualMachineData,
  LocationSpoofingData,
  HighActivityData,
  MITMAttackData,
  BrowserDetails,
} from '@kagevoult/types';

import {
  collectCompleteFingerprint,
  generateCombinedHash,
  calculateConfidenceScore,
} from './fingerprint-collector';

import {
  detectVPN,
  detectProxy,
  detectIncognito,
  detectTampering,
  detectDevTools,
  detectVirtualMachine,
  detectLocationSpoofing,
  detectHighActivity,
  detectMITM,
  type VPNDetectionResult,
  type ProxyDetectionResult,
  type TamperingResult,
} from './advanced-detection';

import { collectRawDeviceAttributes } from './raw-attributes';

/**
 * Generate a unique visitor ID based on fingerprint hash
 */
export function generateVisitorId(fingerprintHash: string): string {
  // Use first 20 characters of hash for visitor ID
  return fingerprintHash.substring(0, 20);
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}.${random}`;
}

/**
 * Parse user agent to extract browser details
 */
export function parseBrowserDetails(userAgent: string): BrowserDetails {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browserName = 'Unknown';
  let browserFullVersion = '0.0.0';
  let browserMajorVersion = '0';
  
  if (ua.includes('chrome') && !ua.includes('edge')) {
    browserName = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    if (match && match[1]) browserFullVersion = match[1];
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    if (match && match[1]) browserFullVersion = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserName = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    if (match && match[1]) browserFullVersion = match[1];
  } else if (ua.includes('edge')) {
    browserName = 'Edge';
    const match = ua.match(/edge?\/([\d.]+)/);
    if (match && match[1]) browserFullVersion = match[1];
  }
  
  browserMajorVersion = browserFullVersion.split('.')[0] || '0';
  
  // OS detection
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('windows nt 10.0')) {
    os = 'Windows';
    osVersion = '10';
  } else if (ua.includes('windows nt 11.0')) {
    os = 'Windows';
    osVersion = '11';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x ([\d_]+)/);
    if (match && match[1]) osVersion = match[1].replace(/_/g, '.');
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android ([\d.]+)/);
    if (match && match[1]) osVersion = match[1];
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os ([\d_]+)/);
    if (match && match[1]) osVersion = match[1].replace(/_/g, '.');
  }
  
  // Device detection
  let device = 'Other';
  if (ua.includes('mobile') || ua.includes('android')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet';
  }
  
  return {
    browserName,
    browserMajorVersion,
    browserFullVersion,
    os,
    osVersion,
    device,
    userAgent
  };
}

/**
 * Build complete fingerprint response matching Fingerprint.com structure
 */
export async function buildFingerprintResponse(options: {
  url: string;
  linkedId?: string;
  ip?: string;
  environmentId?: string;
}): Promise<FingerprintResponse> {
  const requestId = generateRequestId();
  const timestamp = Date.now();
  const time = new Date(timestamp).toISOString();
  
  // Collect all fingerprints
  const fingerprint = await collectCompleteFingerprint({ timeout: 10000 });
  const combinedHash = await generateCombinedHash(fingerprint);
  const visitorId = generateVisitorId(combinedHash);
  const confidence = calculateConfidenceScore(fingerprint);
  
  // Run all detection modules
  const [
    vpnDetection,
    proxyDetection,
    incognitoDetection,
    tamperingDetection,
    locationSpoofing,
    rawAttributes
  ] = await Promise.all([
    detectVPN(),
    detectProxy(),
    detectIncognito(),
    Promise.resolve(detectTampering()),
    detectLocationSpoofing(),
    collectRawDeviceAttributes()
  ]);
  
  const devToolsDetection = detectDevTools();
  const vmDetection = detectVirtualMachine();
  const highActivityDetection = detectHighActivity();
  const mitmDetection = detectMITM();
  
  // Parse browser details
  const browserDetails = parseBrowserDetails(navigator.userAgent);
  
  // Build identification data
  const identification: IdentificationData = {
    visitorId,
    requestId,
    browserDetails,
    incognito: incognitoDetection,
    ip: options.ip || 'unknown',
    ipLocation: null, // Requires server-side geolocation
    linkedId: options.linkedId,
    timestamp,
    time,
    url: options.url,
    tag: {},
    confidence: {
      score: confidence / 100,
      revision: 'v1.0'
    },
    visitorFound: true, // Would check database
    firstSeenAt: {
      global: time,
      subscription: time
    },
    lastSeenAt: {
      global: time,
      subscription: time
    },
    replayed: false,
    environmentId: options.environmentId
  };
  
  // Build bot detection data
  const botd: BotDetectionData = {
    bot: {
      result: 'notDetected' // Would use more sophisticated detection
    },
    linkedId: options.linkedId,
    url: options.url,
    ip: options.ip || 'unknown',
    time,
    userAgent: navigator.userAgent,
    requestId
  };
  
  // Build products response
  const products: FingerprintProducts = {
    identification: {
      data: identification
    },
    botd: {
      data: botd
    },
    rootApps: {
      data: { result: false }
    },
    emulator: {
      data: { result: false }
    },
    ipInfo: {
      data: {} // Requires server-side IP lookup
    },
    ipBlocklist: {
      data: {
        result: false,
        details: {
          emailSpam: false,
          attackSource: false
        }
      }
    },
    tor: {
      data: { result: false }
    },
    vpn: {
      data: vpnDetection as VPNData
    },
    proxy: {
      data: proxyDetection as ProxyData
    },
    incognito: {
      data: { result: incognitoDetection }
    },
    tampering: {
      data: tamperingDetection as TamperingData
    },
    clonedApp: {
      data: { result: false }
    },
    factoryReset: {
      data: {
        time: '1970-01-01T00:00:00Z',
        timestamp: 0
      }
    },
    jailbroken: {
      data: { result: false }
    },
    frida: {
      data: { result: false }
    },
    privacySettings: {
      data: { result: false }
    },
    virtualMachine: {
      data: { result: vmDetection }
    },
    rawDeviceAttributes: {
      data: rawAttributes
    },
    highActivity: {
      data: {
        result: highActivityDetection.result
      }
    },
    locationSpoofing: {
      data: { result: locationSpoofing }
    },
    suspectScore: {
      data: {
        result: calculateSuspectScore(tamperingDetection, vpnDetection, proxyDetection)
      }
    },
    velocity: {
      data: {
        // Requires database tracking
        distinctIp: { intervals: { '5m': 1, '1h': 1, '24h': 1 } },
        distinctLinkedId: { intervals: { '5m': 1, '1h': 1, '24h': 1 } },
        distinctCountry: { intervals: { '5m': 1, '1h': 1, '24h': 1 } },
        events: { intervals: { '5m': 1, '1h': 1, '24h': 1 } },
        ipEvents: { intervals: { '5m': 1, '1h': 1, '24h': 1 } },
        distinctIpByLinkedId: { intervals: { '5m': 1, '1h': 1, '24h': 1 } },
        distinctVisitorIdByLinkedId: { intervals: { '5m': 1, '1h': 1, '24h': 1 } }
      }
    },
    developerTools: {
      data: { result: devToolsDetection }
    },
    mitmAttack: {
      data: { result: mitmDetection }
    },
    proximity: {}
  };
  
  return {
    products
  };
}

/**
 * Calculate overall suspect score (0-1)
 */
function calculateSuspectScore(
  tampering: TamperingResult,
  vpn: VPNDetectionResult,
  proxy: ProxyDetectionResult
): number {
  let score = 0;
  
  // Tampering adds heavily to score
  score += tampering.anomalyScore * 0.5;
  if (tampering.antiDetectBrowser) score += 0.3;
  
  // VPN adds based on confidence
  if (vpn.result) {
    if (vpn.confidence === 'high') score += 0.3;
    else if (vpn.confidence === 'medium') score += 0.2;
    else score += 0.1;
  }
  
  // Proxy adds based on confidence
  if (proxy.result) {
    if (proxy.confidence === 'high') score += 0.2;
    else if (proxy.confidence === 'medium') score += 0.15;
    else score += 0.05;
  }
  
  return Math.min(score, 1);
}

/**
 * Export convenience function
 */
export async function getFingerprint(linkedId?: string): Promise<FingerprintResponse> {
  return buildFingerprintResponse({
    url: window.location.href,
    linkedId,
    environmentId: 'kagevoult_env_001'
  });
}
