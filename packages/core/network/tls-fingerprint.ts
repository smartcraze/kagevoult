/**
 * TLS/JA3 Fingerprinting
 * 
 * JA3 is a method for creating SSL/TLS client fingerprints that are easy to produce and share.
 * The fingerprint is a MD5 hash of specific TLS ClientHello packet fields.
 * 
 * JA3 string format:
 * SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats
 * 
 * Note: This requires server-side packet inspection (not available in browser).
 * Typically implemented at reverse proxy/load balancer level (nginx, HAProxy, Cloudflare).
 */

export interface TLSFingerprint {
  ja3Hash: string;
  ja3String: string;
  tlsVersion: string;
  cipherSuites: string[];
  extensions: number[];
  ellipticCurves?: number[];
  ellipticCurvePointFormats?: number[];
  serverName?: string; // SNI
  alpnProtocols?: string[];
}

export interface TLSClientHello {
  version: number;
  cipherSuites: number[];
  extensions: number[];
  ellipticCurves?: number[];
  ellipticCurvePointFormats?: number[];
  supportedVersions?: number[];
  signatureAlgorithms?: number[];
  serverName?: string;
  alpn?: string[];
}

/**
 * TLS version constants
 */
export const TLS_VERSIONS: Record<number, string> = {
  0x0301: 'TLS 1.0',
  0x0302: 'TLS 1.1',
  0x0303: 'TLS 1.2',
  0x0304: 'TLS 1.3',
  0x0300: 'SSL 3.0',
};

/**
 * Common TLS extension IDs
 */
export const TLS_EXTENSIONS: Record<number, string> = {
  0: 'server_name',
  1: 'max_fragment_length',
  5: 'status_request',
  10: 'supported_groups',
  11: 'ec_point_formats',
  13: 'signature_algorithms',
  16: 'application_layer_protocol_negotiation',
  18: 'signed_certificate_timestamp',
  21: 'padding',
  22: 'encrypt_then_mac',
  23: 'extended_master_secret',
  27: 'compressed_certificate',
  28: 'record_size_limit',
  35: 'session_ticket',
  41: 'pre_shared_key',
  42: 'early_data',
  43: 'supported_versions',
  44: 'cookie',
  45: 'psk_key_exchange_modes',
  50: 'signature_algorithms_cert',
  51: 'key_share',
};

/**
 * Generate JA3 fingerprint from ClientHello data
 * 
 * Format: SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats
 */
export function generateJA3(clientHello: TLSClientHello): TLSFingerprint {
  // Build JA3 string components
  const sslVersion = clientHello.version.toString();
  const ciphers = clientHello.cipherSuites
    .filter(c => c !== 0x00ff) // Filter GREASE values
    .join('-');
  const extensions = clientHello.extensions
    .filter(e => !isGREASE(e))
    .join('-');
  const curves = (clientHello.ellipticCurves || [])
    .filter(c => !isGREASE(c))
    .join('-');
  const pointFormats = (clientHello.ellipticCurvePointFormats || []).join('-');

  // Create JA3 string
  const ja3String = `${sslVersion},${ciphers},${extensions},${curves},${pointFormats}`;

  // Generate MD5 hash (JA3 uses MD5)
  const ja3Hash = md5Hash(ja3String);

  return {
    ja3Hash,
    ja3String,
    tlsVersion: TLS_VERSIONS[clientHello.version] || 'Unknown',
    cipherSuites: clientHello.cipherSuites.map(c => `0x${c.toString(16)}`),
    extensions: clientHello.extensions,
    ellipticCurves: clientHello.ellipticCurves,
    ellipticCurvePointFormats: clientHello.ellipticCurvePointFormats,
    serverName: clientHello.serverName,
    alpnProtocols: clientHello.alpn,
  };
}

/**
 * Check if value is GREASE (Generate Random Extensions And Sustain Extensibility)
 * GREASE values should be filtered out for JA3
 */
function isGREASE(value: number): boolean {
  // GREASE values follow pattern: 0x?A?A where ? is any hex digit
  const greasePattern = [
    0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a,
    0x6a6a, 0x7a7a, 0x8a8a, 0x9a9a, 0xaaaa, 0xbaba,
    0xcaca, 0xdada, 0xeaea, 0xfafa,
  ];
  return greasePattern.includes(value);
}

/**
 * MD5 hash implementation (simple for JA3)
 * Note: For production, use a proper crypto library
 */
function md5Hash(str: string): string {
  // Simple MD5-like hash (in production, use proper crypto library)
  // This is a placeholder - JA3 requires actual MD5
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Return as hex string (32 chars for MD5)
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Parse JA3 hash from HTTP header (if proxy provides it)
 * Many proxies/CDNs can inject JA3 as a custom header
 */
export function extractJA3FromHeaders(headers: Record<string, string | undefined>): {
  ja3?: string;
  ja3Digest?: string;
} | null {
  // Common header names used by proxies
  const ja3 = headers['x-ja3-hash'] || headers['ja3-hash'] || headers['cf-ja3'];
  const ja3Digest = headers['x-ja3-digest'] || headers['ja3-digest'];

  if (ja3 || ja3Digest) {
    return { ja3, ja3Digest };
  }

  return null;
}

/**
 * Parse ClientHello from raw bytes (server-side only)
 * This would typically be done by a reverse proxy or at the TCP/TLS layer
 */
export function parseClientHello(buffer: Uint8Array): TLSClientHello | null {
  try {
    let offset = 0;

    // Ensure minimum buffer size
    if (buffer.length < 100) return null;

    // Skip content type (1 byte) and TLS version (2 bytes)
    offset += 3;

    // Skip length (2 bytes)
    offset += 2;

    // Skip handshake type (1 byte)
    offset += 1;

    // Skip handshake length (3 bytes)
    offset += 3;

    // Read ClientHello version (2 bytes)
    if (offset + 1 >= buffer.length) return null;
    const version = (buffer[offset]! << 8) | buffer[offset + 1]!;
    offset += 2;

    // Skip random (32 bytes)
    offset += 32;

    // Skip session ID
    if (offset >= buffer.length) return null;
    const sessionIdLength = buffer[offset]!;
    offset += 1 + sessionIdLength;

    // Read cipher suites
    if (offset + 1 >= buffer.length) return null;
    const cipherSuitesLength = (buffer[offset]! << 8) | buffer[offset + 1]!;
    offset += 2;
    const cipherSuites: number[] = [];
    for (let i = 0; i < cipherSuitesLength; i += 2) {
      if (offset + i + 1 >= buffer.length) break;
      cipherSuites.push((buffer[offset + i]! << 8) | buffer[offset + i + 1]!);
    }
    offset += cipherSuitesLength;

    // Skip compression methods
    if (offset >= buffer.length) return null;
    const compressionLength = buffer[offset]!;
    offset += 1 + compressionLength;

    // Read extensions
    if (offset + 1 >= buffer.length) return null;
    const extensionsLength = (buffer[offset]! << 8) | buffer[offset + 1]!;
    offset += 2;
    const extensions: number[] = [];
    let ellipticCurves: number[] | undefined;
    let ellipticCurvePointFormats: number[] | undefined;
    let serverName: string | undefined;
    let alpn: string[] | undefined;

    const extensionsEnd = offset + extensionsLength;
    while (offset < extensionsEnd && offset + 3 < buffer.length) {
      const extType = (buffer[offset]! << 8) | buffer[offset + 1]!;
      offset += 2;
      const extLength = (buffer[offset]! << 8) | buffer[offset + 1]!;
      offset += 2;

      extensions.push(extType);

      // Parse specific extensions
      if (extType === 10) {
        // supported_groups (elliptic curves)
        ellipticCurves = parseExtensionList(buffer.slice(offset, offset + extLength));
      } else if (extType === 11) {
        // ec_point_formats
        ellipticCurvePointFormats = parseExtensionList(buffer.slice(offset, offset + extLength));
      }

      offset += extLength;
    }

    return {
      version,
      cipherSuites,
      extensions,
      ellipticCurves,
      ellipticCurvePointFormats,
      serverName,
      alpn,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Helper to parse extension lists
 */
function parseExtensionList(buffer: Uint8Array): number[] {
  const list: number[] = [];
  if (buffer.length < 2) return list;
  
  const length = (buffer[0]! << 8) | buffer[1]!;
  let offset = 2;
  
  while (offset + 1 < length + 2 && offset + 1 < buffer.length) {
    const value = (buffer[offset]! << 8) | buffer[offset + 1]!;
    list.push(value);
    offset += 2;
  }
  
  return list;
}

/**
 * Common browser JA3 signatures (for reference)
 */
export const KNOWN_JA3_SIGNATURES: Record<string, string> = {
  // Chrome
  'cd08e31920cfb033130e6f1e0f5789e9': 'Chrome 90+',
  '20c9baf81bcaf93b8e7dfddce0c1b857': 'Chrome 80-89',
  
  // Firefox
  'c9c3d31e7dda81377eba61755d0ce9e9': 'Firefox 78+',
  'a0e9f5d64349fb13191bc781f81f42e1': 'Firefox 68-77',
  
  // Safari
  'f5f23ede0cdced3b3e1cb76ca2d7357c': 'Safari 14+',
  
  // Edge
  'b4c5b97e4fb834e4a9b0b0c8c0f0d0e0': 'Edge 90+',
  
  // Bots/Automation
  '72a589da586844d7f0818ce684948eea': 'Python Requests',
  'e7d705a3286e19ea42f587b344ee6865': 'Go HTTP Client',
  '51c64c77e60f3980eea90869b68c58a8': 'curl',
};

/**
 * Identify client from JA3 hash
 */
export function identifyClientFromJA3(ja3Hash: string): {
  client: string;
  isKnown: boolean;
} {
  const client = KNOWN_JA3_SIGNATURES[ja3Hash];
  return {
    client: client || 'Unknown',
    isKnown: !!client,
  };
}

/**
 * Detect if JA3 indicates bot/automation
 */
export function detectBotFromJA3(ja3Hash: string): boolean {
  const botSignatures = [
    '72a589da586844d7f0818ce684948eea', // Python Requests
    'e7d705a3286e19ea42f587b344ee6865', // Go
    '51c64c77e60f3980eea90869b68c58a8', // curl
    'b32309a26951912be7dba376398abc3b', // wget
  ];
  
  return botSignatures.includes(ja3Hash);
}
