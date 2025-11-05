# 📚 Kagevoult Documentation

Complete API reference and guide for the Kagevoult device fingerprinting library.

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Examples](#examples)
5. [Best Practices](#best-practices)
6. [Privacy & Compliance](#privacy--compliance)

## Installation

### Prerequisites

- Node.js 18+ or Bun 1.0+
- TypeScript 5.0+

### Package Installation

```bash
# Using Bun (recommended)
bun add @kagevoult/core @kagevoult/types

# Using npm
npm install @kagevoult/core @kagevoult/types
```

## Core Concepts

### Visitor ID
A stable identifier generated from the device fingerprint. Remains consistent across sessions unless the device configuration changes significantly.

### Confidence Score
A 0-1 score indicating how reliable the fingerprint is. Higher scores mean more unique signals were collected.

### Suspect Score
A 0-1 risk score based on detected anomalies (VPN, tampering, etc.). Higher scores indicate higher risk.

### Velocity Tracking
Tracks visitor activity patterns over time to detect suspicious behavior (rapid IP changes, high activity, etc.).

## API Reference

### Browser Functions

#### `getFingerprint(linkedId?: string)`

Collects complete device fingerprint with all detection modules.

```typescript
import { getFingerprint } from '@kagevoult/core';

const response = await getFingerprint('optional_session_id');

// Access data
const { products } = response;
const visitorId = products.identification.data.visitorId;
const isVPN = products.vpn.data.result;
```

**Returns**: `Promise<FingerprintResponse>`

**Response Structure**:
```typescript
{
  products: {
    identification: { data: IdentificationData },
    botd: { data: BotDetectionData },
    vpn: { data: VPNData },
    proxy: { data: ProxyData },
    tampering: { data: TamperingData },
    incognito: { data: IncognitoData },
    rawDeviceAttributes: { data: RawDeviceAttributes },
    velocity: { data: VelocityData },
    // ... 20+ more products
  }
}
```

#### `buildFingerprintResponse(options)`

Build custom fingerprint with specific options.

```typescript
import { buildFingerprintResponse } from '@kagevoult/core';

const response = await buildFingerprintResponse({
  url: window.location.href,
  linkedId: 'session_123',
  ip: '192.168.1.1', // Optional
  environmentId: 'prod_env' // Optional
});
```

**Options**:
- `url` (required): Current page URL
- `linkedId` (optional): Session/user identifier
- `ip` (optional): Visitor IP address
- `environmentId` (optional): Environment identifier

#### Detection Functions

##### `detectVPN()`

Detects VPN usage through multiple methods.

```typescript
import { detectVPN } from '@kagevoult/core';

const vpn = await detectVPN();

console.log('VPN Detected:', vpn.result);
console.log('Confidence:', vpn.confidence); // 'low' | 'medium' | 'high'
console.log('Methods:', vpn.methods);
// {
//   timezoneMismatch: boolean,
//   publicVPN: boolean,
//   auxiliaryMobile: boolean,
//   osMismatch: boolean,
//   relay: boolean
// }
```

##### `detectProxy()`

Detects proxy usage.

```typescript
import { detectProxy } from '@kagevoult/core';

const proxy = await detectProxy();

console.log('Proxy Detected:', proxy.result);
console.log('Confidence:', proxy.confidence);
```

##### `detectTampering()`

Detects browser tampering and anti-detect tools.

```typescript
import { detectTampering } from '@kagevoult/core';

const tampering = detectTampering();

console.log('Tampering:', tampering.result);
console.log('Anomaly Score:', tampering.anomalyScore); // 0-1
console.log('Anti-Detect Browser:', tampering.antiDetectBrowser);
```

Detects tools like:
- Multilogin
- GoLogin
- Kameleo
- Incogniton
- Dolphin
- Adspower
- VMLogin

##### `detectIncognito()`

Detects incognito/private browsing mode.

```typescript
import { detectIncognito } from '@kagevoult/core';

const isIncognito = await detectIncognito();
console.log('Incognito Mode:', isIncognito);
```

##### `detectDevTools()`

Detects if developer tools are open.

```typescript
import { detectDevTools } from '@kagevoult/core';

const devToolsOpen = detectDevTools();
console.log('Dev Tools Open:', devToolsOpen);
```

##### `detectVirtualMachine()`

Detects if running in a virtual machine.

```typescript
import { detectVirtualMachine } from '@kagevoult/core';

const isVM = detectVirtualMachine();
console.log('Virtual Machine:', isVM);
```

##### `runAllDetections()`

Run all detection modules at once.

```typescript
import { runAllDetections } from '@kagevoult/core';

const detections = await runAllDetections();

console.log('VPN:', detections.vpn);
console.log('Proxy:', detections.proxy);
console.log('Incognito:', detections.incognito);
console.log('Tampering:', detections.tampering);
// ... all detection results
```

#### Raw Attributes Collection

##### `collectRawDeviceAttributes()`

Collects 40+ raw device attributes.

```typescript
import { collectRawDeviceAttributes } from '@kagevoult/core';

const attributes = await collectRawDeviceAttributes();

console.log('Screen:', attributes.screenResolution.value);
console.log('CPU Cores:', attributes.hardwareConcurrency.value);
console.log('Memory:', attributes.deviceMemory.value, 'GB');
console.log('Touch:', attributes.touchSupport.value);
console.log('Canvas:', attributes.canvas.value);
// ... 40+ more attributes
```

### Server Functions

Import from `@kagevoult/core/server` for Node.js/Bun server-side code.

#### IP Geolocation

##### `geoService.lookup(ip)`

Lookup IP address geolocation.

```typescript
import { geoService } from '@kagevoult/core/server';

const ipInfo = await geoService.lookup('8.8.8.8');

console.log('City:', ipInfo?.geolocation.city.name);
console.log('Country:', ipInfo?.geolocation.country.name);
console.log('Timezone:', ipInfo?.geolocation.timezone);
console.log('ASN:', ipInfo?.asn.name);
console.log('Datacenter:', ipInfo?.datacenter.result);
```

##### `geoService.lookupBatch(ips)`

Batch lookup multiple IPs.

```typescript
import { geoService } from '@kagevoult/core/server';

const results = await geoService.lookupBatch([
  '8.8.8.8',
  '1.1.1.1',
  '208.67.222.222'
]);

for (const [ip, info] of results) {
  console.log(`${ip}:`, info?.geolocation.country.name);
}
```

##### Custom Providers

Use specific geolocation providers or add your API keys.

```typescript
import { 
  GeolocationService,
  IpapiCoProvider,
  IpApiComProvider,
  IpinfoIoProvider
} from '@kagevoult/core/server';

const service = new GeolocationService([
  new IpapiCoProvider('your_api_key'),
  new IpApiComProvider(),
  new IpinfoIoProvider('your_api_key')
]);

const result = await service.lookup('8.8.8.8');
```

**Available Providers**:
- `IpapiCoProvider`: 1,000 req/day free, then paid
- `IpApiComProvider`: 45 req/min free
- `IpinfoIoProvider`: 50,000 req/month free

#### Velocity Tracking

##### `velocityTracker.track(event)`

Track a visitor event.

```typescript
import { velocityTracker } from '@kagevoult/core/server';

await velocityTracker.track({
  visitorId: 'visitor_123',
  ip: '192.168.1.1',
  linkedId: 'session_abc',
  country: 'US',
  timestamp: Date.now(),
  url: '/checkout',
  eventType: 'page_view'
});
```

##### `velocityTracker.getVelocity(visitorId)`

Get velocity data for a visitor.

```typescript
import { velocityTracker } from '@kagevoult/core/server';

const velocity = await velocityTracker.getVelocity('visitor_123');

console.log('Distinct IPs (5m):', velocity.distinctIp.intervals['5m']);
console.log('Distinct IPs (1h):', velocity.distinctIp.intervals['1h']);
console.log('Distinct IPs (24h):', velocity.distinctIp.intervals['24h']);

console.log('Events (5m):', velocity.events.intervals['5m']);
console.log('Events (1h):', velocity.events.intervals['1h']);
console.log('Events (24h):', velocity.events.intervals['24h']);
```

##### `velocityTracker.analyzeVelocity(visitorId)`

Analyze velocity for risk signals.

```typescript
import { velocityTracker } from '@kagevoult/core/server';

const analysis = await velocityTracker.analyzeVelocity('visitor_123');

console.log('Risk Score:', analysis.riskScore); // 0-1
console.log('Signals:', analysis.signals);
// ['rapid_ip_changes', 'high_activity', 'distributed_activity']
```

**Risk Signals**:
- `rapid_ip_changes`: >3 IPs in 5 minutes
- `high_activity`: >50 events in 5 minutes
- `distributed_activity`: >10 IPs in 1 hour
- `account_sharing`: >5 visitors per linkedId in 1 hour
- `ip_sharing`: High events per IP ratio

##### Custom Velocity Store

Implement custom storage backend.

```typescript
import { VelocityTracker, VelocityStore } from '@kagevoult/core/server';

class CustomVelocityStore implements VelocityStore {
  async addEvent(event) {
    // Store in your database
    await db.events.insert(event);
  }
  
  async getVelocity(visitorId) {
    // Query from your database
    return computeVelocity(visitorId);
  }
  
  async cleanup() {
    // Delete old events
    await db.events.deleteOlderThan(Date.now() - 24 * 60 * 60 * 1000);
  }
}

const tracker = new VelocityTracker(new CustomVelocityStore());
```

## Examples

### E-commerce Fraud Detection

```typescript
import { getFingerprint } from '@kagevoult/core';
import { velocityTracker } from '@kagevoult/core/server';

async function checkoutRiskScore(userId: string, amount: number) {
  const fp = await getFingerprint(userId);
  const { products } = fp;
  
  let riskScore = 0;
  const risks = [];
  
  // Check fingerprint risk factors
  if (products.vpn.data.result && products.vpn.data.confidence === 'high') {
    riskScore += 0.3;
    risks.push('High confidence VPN detected');
  }
  
  if (products.tampering.data.antiDetectBrowser) {
    riskScore += 0.4;
    risks.push('Anti-detect browser detected');
  }
  
  if (products.suspectScore.data.result > 0.5) {
    riskScore += 0.3;
    risks.push('High suspect score');
  }
  
  // Check velocity
  const velocity = await velocityTracker.getVelocity(
    products.identification.data.visitorId
  );
  
  if (velocity.distinctIp.intervals['1h'] > 5) {
    riskScore += 0.2;
    risks.push('Multiple IPs in short time');
  }
  
  // High-value orders need stricter checks
  if (amount > 1000 && riskScore > 0.3) {
    return {
      approved: false,
      riskScore,
      reason: risks.join('; '),
      action: 'manual_review'
    };
  }
  
  if (riskScore > 0.7) {
    return {
      approved: false,
      riskScore,
      reason: risks.join('; '),
      action: 'block'
    };
  }
  
  return {
    approved: true,
    riskScore,
    action: 'approve'
  };
}
```

### Account Sharing Detection

```typescript
import { velocityTracker } from '@kagevoult/core/server';

async function detectAccountSharing(accountId: string) {
  const velocity = await velocityTracker.getVelocity(accountId);
  
  const distinctIPs24h = velocity.distinctIp.intervals['24h'];
  const distinctCountries24h = velocity.distinctCountry.intervals['24h'];
  const events24h = velocity.events.intervals['24h'];
  
  // Suspicious patterns
  const manyIPs = distinctIPs24h > 10;
  const manyCountries = distinctCountries24h > 3;
  const highActivity = events24h > 100;
  
  if (manyIPs && manyCountries) {
    return {
      sharing: true,
      confidence: 'high',
      reason: `${distinctIPs24h} IPs across ${distinctCountries24h} countries`,
      recommendation: 'Force re-authentication'
    };
  }
  
  if (manyIPs || (manyCountries && highActivity)) {
    return {
      sharing: true,
      confidence: 'medium',
      reason: 'Unusual access patterns detected',
      recommendation: 'Send security alert'
    };
  }
  
  return { sharing: false };
}
```

### Payment Processing Integration

```typescript
import { buildFingerprintResponse } from '@kagevoult/core';

async function processPayment(paymentData: any) {
  // Collect fingerprint
  const fp = await buildFingerprintResponse({
    url: window.location.href,
    linkedId: paymentData.transactionId
  });
  
  // Extract key risk indicators
  const riskData = {
    visitorId: fp.products.identification.data.visitorId,
    confidence: fp.products.identification.data.confidence.score,
    suspectScore: fp.products.suspectScore.data.result,
    vpn: fp.products.vpn.data.result,
    proxy: fp.products.proxy.data.result,
    tampering: fp.products.tampering.data.result,
    incognito: fp.products.incognito.data.result
  };
  
  // Send to payment processor
  const result = await fetch('/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...paymentData,
      deviceFingerprint: riskData
    })
  });
  
  return result.json();
}
```

## Best Practices

### 1. Always Get User Consent

```typescript
async function collectFingerprintWithConsent() {
  // Check if user has consented to fingerprinting
  if (!hasUserConsented()) {
    await requestConsent();
  }
  
  if (hasUserConsented()) {
    return await getFingerprint();
  }
  
  return null;
}
```

### 2. Handle Errors Gracefully

```typescript
async function safeGetFingerprint(sessionId: string) {
  try {
    return await getFingerprint(sessionId);
  } catch (error) {
    console.error('Fingerprinting failed:', error);
    // Return minimal data or proceed without fingerprint
    return null;
  }
}
```

### 3. Cache Fingerprints Appropriately

```typescript
const fpCache = new Map<string, FingerprintResponse>();

async function getCachedFingerprint(visitorId: string) {
  if (fpCache.has(visitorId)) {
    return fpCache.get(visitorId);
  }
  
  const fp = await getFingerprint(visitorId);
  fpCache.set(visitorId, fp);
  
  // Clear cache after 1 hour
  setTimeout(() => fpCache.delete(visitorId), 60 * 60 * 1000);
  
  return fp;
}
```

### 4. Implement Rate Limiting

```typescript
const rateLimiter = new Map<string, number>();

async function rateLimitedTracking(visitorId: string, event: any) {
  const lastTrack = rateLimiter.get(visitorId) || 0;
  const now = Date.now();
  
  // Limit to 1 track per 5 seconds
  if (now - lastTrack < 5000) {
    return;
  }
  
  await velocityTracker.track(event);
  rateLimiter.set(visitorId, now);
}
```

### 5. Set Data Retention Policies

```typescript
// Clean up old velocity data daily
setInterval(async () => {
  await velocityTracker.store.cleanup();
}, 24 * 60 * 60 * 1000);
```

## Privacy & Compliance

### GDPR Compliance

1. **Obtain Consent**: Get explicit consent before fingerprinting
2. **Right to Access**: Provide API for users to access their data
3. **Right to Delete**: Implement deletion of stored fingerprints
4. **Data Minimization**: Only collect necessary signals
5. **Purpose Limitation**: Use only for stated purposes

### CCPA Compliance

1. **Disclosure**: Inform users about fingerprinting
2. **Opt-Out**: Provide opt-out mechanism
3. **Data Deletion**: Honor deletion requests

### Privacy Policy Template

```
Device Fingerprinting

We use device fingerprinting technology to:
- Detect and prevent fraud
- Protect user accounts from unauthorized access
- Ensure platform security

This technology analyzes browser and device characteristics to create
a unique identifier. No personally identifiable information is collected
as part of this process.

You can opt out of device fingerprinting by [opt-out mechanism].
For more information or to request deletion of your fingerprint data,
contact us at privacy@yourcompany.com.
```

## TypeScript Types

All types are available from `@kagevoult/types`:

```typescript
import type {
  FingerprintResponse,
  FingerprintProducts,
  IdentificationData,
  BrowserDetails,
  VPNData,
  ProxyData,
  TamperingData,
  VelocityData,
  RawDeviceAttributes,
  // ... 20+ more types
} from '@kagevoult/types';
```

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@kagevoult/types'`

**Solution**: Make sure both packages are installed:
```bash
bun add @kagevoult/core @kagevoult/types
```

**Issue**: Fingerprint confidence score is too low

**Solution**: Check that:
- Browser APIs are not blocked
- Canvas/WebGL are available
- Storage APIs are accessible
- Use `collectCompleteFingerprint()` with adequate timeout

**Issue**: Velocity tracking not working

**Solution**: Ensure you're calling from server-side code:
```typescript
import { velocityTracker } from '@kagevoult/core/server'; // Not from '@kagevoult/core'
```

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/smartcraze/kagevoult/issues
- Discussions: https://github.com/smartcraze/kagevoult/discussions

---

Last updated: November 5, 2025
