/**
 * HTTP Headers Fingerprinting
 * 
 * Captures and analyzes HTTP headers to identify unique patterns.
 * Different browsers, OS, and network configurations send different header combinations.
 * 
 * Key signals:
 * - Header order (browsers have specific order patterns)
 * - Accept headers (language, encoding, content types)
 * - User-Agent and related headers
 * - Custom headers from CDNs/proxies
 * - Connection characteristics
 */

export interface HTTPHeadersFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  accept: string;
  connection: string;
  upgradeInsecureRequests?: string;
  secFetchSite?: string;
  secFetchMode?: string;
  secFetchUser?: string;
  secFetchDest?: string;
  secChUa?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
  dnt?: string;
  cacheControl?: string;
  pragma?: string;
  referer?: string;
  origin?: string;
  headerOrder: string[];
  headerCount: number;
  hash: string;
}

export interface ProxyHeaders {
  xForwardedFor?: string;
  xRealIp?: string;
  cfConnectingIp?: string; // Cloudflare
  trueClientIp?: string; // Akamai
  xClientIp?: string;
  via?: string;
  forwarded?: string;
  xForwardedProto?: string;
  xForwardedHost?: string;
  xProxyId?: string;
}

export interface NetworkFingerprint {
  headers: HTTPHeadersFingerprint;
  proxy: ProxyHeaders;
  ip: string;
  ipVersion: 4 | 6;
  timestamp: number;
}

/**
 * Extract headers from Request object (client-side or server-side)
 */
export function extractHeadersFromRequest(request: Request): HTTPHeadersFingerprint {
  const headers: Record<string, string> = {};
  const headerOrder: string[] = [];

  // Iterate through all headers
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
    headerOrder.push(key.toLowerCase());
  });

  const fingerprint: HTTPHeadersFingerprint = {
    userAgent: headers['user-agent'] || '',
    acceptLanguage: headers['accept-language'] || '',
    acceptEncoding: headers['accept-encoding'] || '',
    accept: headers['accept'] || '',
    connection: headers['connection'] || '',
    upgradeInsecureRequests: headers['upgrade-insecure-requests'],
    secFetchSite: headers['sec-fetch-site'],
    secFetchMode: headers['sec-fetch-mode'],
    secFetchUser: headers['sec-fetch-user'],
    secFetchDest: headers['sec-fetch-dest'],
    secChUa: headers['sec-ch-ua'],
    secChUaMobile: headers['sec-ch-ua-mobile'],
    secChUaPlatform: headers['sec-ch-ua-platform'],
    dnt: headers['dnt'],
    cacheControl: headers['cache-control'],
    pragma: headers['pragma'],
    referer: headers['referer'],
    origin: headers['origin'],
    headerOrder,
    headerCount: headerOrder.length,
    hash: '', // Will be computed
  };

  return fingerprint;
}

/**
 * Extract headers from plain object (for Node.js HTTP server)
 */
export function extractHeadersFromObject(headers: Record<string, string | string[] | undefined>): HTTPHeadersFingerprint {
  const normalizedHeaders: Record<string, string> = {};
  const headerOrder: string[] = Object.keys(headers).map(k => k.toLowerCase());

  // Normalize headers
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (value) {
      normalizedHeaders[lowerKey] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  const fingerprint: HTTPHeadersFingerprint = {
    userAgent: normalizedHeaders['user-agent'] || '',
    acceptLanguage: normalizedHeaders['accept-language'] || '',
    acceptEncoding: normalizedHeaders['accept-encoding'] || '',
    accept: normalizedHeaders['accept'] || '',
    connection: normalizedHeaders['connection'] || '',
    upgradeInsecureRequests: normalizedHeaders['upgrade-insecure-requests'],
    secFetchSite: normalizedHeaders['sec-fetch-site'],
    secFetchMode: normalizedHeaders['sec-fetch-mode'],
    secFetchUser: normalizedHeaders['sec-fetch-user'],
    secFetchDest: normalizedHeaders['sec-fetch-dest'],
    secChUa: normalizedHeaders['sec-ch-ua'],
    secChUaMobile: normalizedHeaders['sec-ch-ua-mobile'],
    secChUaPlatform: normalizedHeaders['sec-ch-ua-platform'],
    dnt: normalizedHeaders['dnt'],
    cacheControl: normalizedHeaders['cache-control'],
    pragma: normalizedHeaders['pragma'],
    referer: normalizedHeaders['referer'],
    origin: normalizedHeaders['origin'],
    headerOrder,
    headerCount: headerOrder.length,
    hash: '', // Will be computed
  };

  return fingerprint;
}

/**
 * Extract proxy-related headers
 */
export function extractProxyHeaders(headers: Record<string, string | undefined>): ProxyHeaders {
  return {
    xForwardedFor: headers['x-forwarded-for'],
    xRealIp: headers['x-real-ip'],
    cfConnectingIp: headers['cf-connecting-ip'],
    trueClientIp: headers['true-client-ip'],
    xClientIp: headers['x-client-ip'],
    via: headers['via'],
    forwarded: headers['forwarded'],
    xForwardedProto: headers['x-forwarded-proto'],
    xForwardedHost: headers['x-forwarded-host'],
    xProxyId: headers['x-proxy-id'],
  };
}

/**
 * Generate hash from headers fingerprint
 */
export async function hashHeadersFingerprint(fingerprint: HTTPHeadersFingerprint): Promise<string> {
  // Create canonical string from important headers and their order
  const canonicalString = JSON.stringify({
    userAgent: fingerprint.userAgent,
    accept: fingerprint.accept,
    acceptLanguage: fingerprint.acceptLanguage,
    acceptEncoding: fingerprint.acceptEncoding,
    secHeaders: [
      fingerprint.secChUa,
      fingerprint.secChUaMobile,
      fingerprint.secChUaPlatform,
      fingerprint.secFetchSite,
      fingerprint.secFetchMode,
    ],
    headerOrder: fingerprint.headerOrder,
  });

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(canonicalString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return simpleHash(canonicalString);
    }
  }

  return simpleHash(canonicalString);
}

/**
 * Simple hash fallback
 */
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
 * Detect browser type from headers (more reliable than just UA)
 */
export function detectBrowserFromHeaders(fingerprint: HTTPHeadersFingerprint): {
  browser: string;
  version: string;
  confidence: number;
} {
  const ua = fingerprint.userAgent.toLowerCase();
  let browser = 'Unknown';
  let version = '';
  let confidence = 0.5;

  // Chrome detection
  if (fingerprint.secChUa && /chrome/i.test(fingerprint.secChUa)) {
    browser = 'Chrome';
    const match = fingerprint.secChUa.match(/Chrome[\/\s]+([\d.]+)/i);
    version = match?.[1] || '';
    confidence = 0.95;
  }
  // Edge detection
  else if (fingerprint.secChUa && /edge/i.test(fingerprint.secChUa)) {
    browser = 'Edge';
    const match = fingerprint.secChUa.match(/Edge[\/\s]+([\d.]+)/i);
    version = match?.[1] || '';
    confidence = 0.95;
  }
  // Firefox detection
  else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/firefox[\/\s]+([\d.]+)/i);
    version = match?.[1] || '';
    confidence = 0.9;
  }
  // Safari detection
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/version[\/\s]+([\d.]+)/i);
    version = match?.[1] || '';
    confidence = 0.85;
  }

  return { browser, version, confidence };
}

/**
 * Detect if request is coming from a proxy/VPN
 */
export function detectProxy(headers: ProxyHeaders, headerOrder: string[]): {
  isProxy: boolean;
  proxyType: 'transparent' | 'anonymous' | 'elite' | 'none';
  indicators: string[];
} {
  const indicators: string[] = [];
  let isProxy = false;

  // Check for proxy headers
  if (headers.xForwardedFor) {
    indicators.push('X-Forwarded-For present');
    isProxy = true;
  }
  if (headers.via) {
    indicators.push('Via header present');
    isProxy = true;
  }
  if (headers.forwarded) {
    indicators.push('Forwarded header present');
    isProxy = true;
  }
  if (headers.xRealIp) {
    indicators.push('X-Real-IP present');
    isProxy = true;
  }

  // Determine proxy type
  let proxyType: 'transparent' | 'anonymous' | 'elite' | 'none' = 'none';

  if (isProxy) {
    // Transparent: reveals client IP and proxy existence
    if (headers.via || headers.xForwardedFor) {
      proxyType = 'transparent';
    }
    // Anonymous: reveals proxy but hides client IP
    else if (headers.xProxyId) {
      proxyType = 'anonymous';
    }
    // Elite: hides both
    else {
      proxyType = 'elite';
    }
  }

  return { isProxy, proxyType, indicators };
}

/**
 * Analyze header order pattern (different browsers have distinct patterns)
 */
export function analyzeHeaderOrder(headerOrder: string[]): {
  pattern: string;
  matchesBrowser: string | null;
} {
  const pattern = headerOrder.slice(0, 5).join('->'); // First 5 headers

  // Common browser patterns
  const patterns: Record<string, string> = {
    'Chrome': 'host->connection->cache-control->sec-ch-ua->sec-ch-ua-mobile',
    'Firefox': 'host->user-agent->accept->accept-language->accept-encoding',
    'Safari': 'host->connection->upgrade-insecure-requests->user-agent->accept',
  };

  let matchesBrowser: string | null = null;
  for (const [browser, browserPattern] of Object.entries(patterns)) {
    const firstHeader = browserPattern.split('->')[0];
    if (firstHeader && pattern.includes(firstHeader)) {
      matchesBrowser = browser;
      break;
    }
  }

  return { pattern, matchesBrowser };
}

/**
 * Detect if request is from a bot/crawler
 */
export function detectBot(fingerprint: HTTPHeadersFingerprint): {
  isBot: boolean;
  botType: string | null;
  confidence: number;
} {
  const ua = fingerprint.userAgent.toLowerCase();
  
  // Known bot patterns
  const botPatterns = [
    { pattern: /googlebot/i, name: 'Googlebot' },
    { pattern: /bingbot/i, name: 'Bingbot' },
    { pattern: /baiduspider/i, name: 'Baiduspider' },
    { pattern: /yandexbot/i, name: 'YandexBot' },
    { pattern: /slurp/i, name: 'Yahoo Slurp' },
    { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
    { pattern: /facebookexternalhit/i, name: 'Facebook' },
    { pattern: /twitterbot/i, name: 'TwitterBot' },
    { pattern: /linkedinbot/i, name: 'LinkedInBot' },
    { pattern: /whatsapp/i, name: 'WhatsApp' },
    { pattern: /telegrambot/i, name: 'Telegram' },
    { pattern: /curl/i, name: 'cURL' },
    { pattern: /wget/i, name: 'wget' },
    { pattern: /python-requests/i, name: 'Python Requests' },
    { pattern: /axios/i, name: 'Axios' },
    { pattern: /node-fetch/i, name: 'node-fetch' },
    { pattern: /go-http-client/i, name: 'Go HTTP Client' },
    { pattern: /selenium/i, name: 'Selenium' },
    { pattern: /puppeteer/i, name: 'Puppeteer' },
    { pattern: /playwright/i, name: 'Playwright' },
    { pattern: /phantomjs/i, name: 'PhantomJS' },
    { pattern: /headlesschrome/i, name: 'Headless Chrome' },
  ];

  for (const { pattern, name } of botPatterns) {
    if (pattern.test(ua)) {
      return {
        isBot: true,
        botType: name,
        confidence: 0.95,
      };
    }
  }

  // Heuristic checks
  const suspiciousIndicators = [];

  // Missing common headers
  if (!fingerprint.accept) suspiciousIndicators.push('no-accept');
  if (!fingerprint.acceptLanguage) suspiciousIndicators.push('no-accept-language');
  if (!fingerprint.acceptEncoding) suspiciousIndicators.push('no-accept-encoding');

  // Unusual header combinations
  if (fingerprint.headerCount < 5) suspiciousIndicators.push('few-headers');
  
  const confidence = suspiciousIndicators.length > 2 ? 0.7 : 0.3;
  const isBot = suspiciousIndicators.length > 2;

  return {
    isBot,
    botType: isBot ? 'Unknown Bot' : null,
    confidence,
  };
}

/**
 * Generate complete network fingerprint from request
 */
export async function generateNetworkFingerprint(
  request: Request,
  clientIp: string
): Promise<NetworkFingerprint> {
  const headers = extractHeadersFromRequest(request);
  
  // Convert Headers to plain object
  const headersObj: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });
  
  const proxy = extractProxyHeaders(headersObj);

  headers.hash = await hashHeadersFingerprint(headers);

  return {
    headers,
    proxy,
    ip: clientIp,
    ipVersion: clientIp.includes(':') ? 6 : 4,
    timestamp: Date.now(),
  };
}
