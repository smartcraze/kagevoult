/**
 * Advanced Detection Modules
 * VPN, Proxy, Tampering, Incognito, Developer Tools, etc.
 */

// Re-export types that match the fingerprint.ts structure
export interface VPNDetectionResult {
  result: boolean;
  confidence: 'low' | 'medium' | 'high';
  originTimezone: string;
  originCountry: string;
  methods: {
    timezoneMismatch: boolean;
    publicVPN: boolean;
    auxiliaryMobile: boolean;
    osMismatch: boolean;
    relay: boolean;
  };
}

export interface ProxyDetectionResult {
  result: boolean;
  confidence: 'low' | 'medium' | 'high';
}

export interface TamperingResult {
  result: boolean;
  anomalyScore: number;
  antiDetectBrowser: boolean;
}

// ============================================================================
// VPN Detection
// ============================================================================

/**
 * Detect VPN usage through multiple methods
 */
export async function detectVPN(): Promise<VPNDetectionResult> {
  const methods = {
    timezoneMismatch: detectTimezoneMismatch(),
    publicVPN: false, // Requires IP database
    auxiliaryMobile: detectAuxiliaryMobile(),
    osMismatch: detectOSMismatch(),
    relay: false // Requires network analysis
  };

  const detectionCount = Object.values(methods).filter(Boolean).length;
  const result = detectionCount >= 2;
  
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (detectionCount >= 3) confidence = 'high';
  else if (detectionCount >= 2) confidence = 'medium';

  return {
    result,
    confidence,
    originTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    originCountry: 'unknown', // Requires IP geolocation
    methods
  };
}

function detectTimezoneMismatch(): boolean {
  try {
    const reportedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = new Date().getTimezoneOffset();
    const expectedOffset = getExpectedOffset(reportedTimezone);
    
    // Check if offset matches reported timezone
    return Math.abs(offsetMinutes - expectedOffset) > 30;
  } catch {
    return false;
  }
}

function getExpectedOffset(timezone: string): number {
  // Simplified - in production use proper timezone database
  const date = new Date();
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (utcDate.getTime() - tzDate.getTime()) / 60000;
  } catch {
    return 0;
  }
}

function detectAuxiliaryMobile(): boolean {
  // Check if mobile user agent but desktop characteristics
  const isMobileUA = /Mobile|Android|iPhone/i.test(navigator.userAgent);
  const hasTouch = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;
  const isDesktopScreen = window.screen.width > 768 && window.screen.height > 1024;
  
  return isMobileUA && !hasTouch && isDesktopScreen;
}

function detectOSMismatch(): boolean {
  // Check platform vs user agent consistency
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  
  const platformWindows = platform.includes('win');
  const platformMac = platform.includes('mac');
  const platformLinux = platform.includes('linux');
  
  const uaWindows = userAgent.includes('windows');
  const uaMac = userAgent.includes('mac');
  const uaLinux = userAgent.includes('linux');
  
  return (
    (platformWindows && !uaWindows) ||
    (platformMac && !uaMac) ||
    (platformLinux && !uaLinux)
  );
}

// ============================================================================
// Proxy Detection
// ============================================================================

export async function detectProxy(): Promise<ProxyDetectionResult> {
  // This requires server-side analysis of headers
  // Client-side detection is limited
  const signals: boolean[] = [];
  
  // Check for WebRTC leak
  const hasWebRTC = await detectWebRTCLeak();
  signals.push(hasWebRTC);
  
  // Check connection characteristics
  const hasSlowConnection = detectSlowConnection();
  signals.push(hasSlowConnection);
  
  const detections = signals.filter(Boolean).length;
  const result = detections >= 1;
  const confidence: 'low' | 'medium' | 'high' = detections >= 2 ? 'high' : detections >= 1 ? 'medium' : 'low';
  
  return { result, confidence };
}

async function detectWebRTCLeak(): Promise<boolean> {
  // WebRTC can leak real IP even through VPN/proxy
  try {
    if (!window.RTCPeerConnection) return false;
    
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    
    return await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);
      
      pc.onicecandidate = (ice) => {
        if (ice.candidate) {
          clearTimeout(timeout);
          pc.close();
          resolve(true);
        }
      };
      
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
    });
  } catch {
    return false;
  }
}

function detectSlowConnection(): boolean {
  if (!('connection' in navigator)) return false;
  const conn = (navigator as any).connection;
  
  // Proxies often add latency
  return conn.rtt > 300 || conn.downlink < 1;
}

// ============================================================================
// Incognito Detection
// ============================================================================

export async function detectIncognito(): Promise<boolean> {
  // Multiple detection methods
  try {
    // Method 1: FileSystem API
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota < 120000000) {
        return true; // Incognito has limited quota
      }
    }
    
    // Method 2: IndexedDB
    if ('indexedDB' in window) {
      try {
        const db = indexedDB.open('test');
        await new Promise((resolve, reject) => {
          db.onsuccess = resolve;
          db.onerror = reject;
          setTimeout(reject, 100);
        });
      } catch {
        return true; // IndexedDB blocked in some incognito modes
      }
    }
    
    // Method 3: Check storage persistence
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const persisted = await navigator.storage.persist();
      if (!persisted) return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// Tampering Detection
// ============================================================================

export function detectTampering(): TamperingResult {
  let anomalies = 0;
  let totalChecks = 0;
  
  // Check 1: Navigator properties
  totalChecks++;
  if (isNavigatorTampered()) anomalies++;
  
  // Check 2: WebDriver
  totalChecks++;
  if ((navigator as any).webdriver === true) anomalies++;
  
  // Check 3: Chrome object inconsistencies
  totalChecks++;
  if (isChromeInconsistent()) anomalies++;
  
  // Check 4: Plugin inconsistencies
  totalChecks++;
  if (arePluginsInconsistent()) anomalies++;
  
  // Check 5: Language inconsistencies
  totalChecks++;
  if (areLanguagesInconsistent()) anomalies++;
  
  // Check 6: Screen inconsistencies
  totalChecks++;
  if (isScreenInconsistent()) anomalies++;
  
  // Check 7: Anti-detect browser signatures
  totalChecks++;
  const antiDetect = detectAntiDetectBrowser();
  if (antiDetect) anomalies += 2; // Weight this more heavily
  
  const anomalyScore = anomalies / (totalChecks + 1); // +1 for anti-detect weight
  const result = anomalyScore > 0.3;
  
  return {
    result,
    anomalyScore,
    antiDetectBrowser: antiDetect
  };
}

function isNavigatorTampered(): boolean {
  // Check if navigator properties are overridden
  const props = ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency'];
  let tampered = 0;
  
  props.forEach(prop => {
    const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, prop);
    if (descriptor && (descriptor.get || descriptor.set)) {
      // Property has been redefined
      tampered++;
    }
  });
  
  return tampered >= 2;
}

function isChromeInconsistent(): boolean {
  const hasChrome = !!(window as any).chrome;
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  
  // Chrome object exists but not a Chrome browser
  return hasChrome !== isChrome;
}

function arePluginsInconsistent(): boolean {
  if (!navigator.plugins) return false;
  
  // Check if plugins length matches actual plugins
  const length = navigator.plugins.length;
  let actualCount = 0;
  for (let i = 0; i < length; i++) {
    if (navigator.plugins[i]) actualCount++;
  }
  
  return length !== actualCount;
}

function areLanguagesInconsistent(): boolean {
  const language = navigator.language;
  const languages = navigator.languages;
  
  // First language should match navigator.language
  if (languages.length > 0 && languages[0] !== language) {
    return true;
  }
  
  return false;
}

function isScreenInconsistent(): boolean {
  // Check for impossible screen values
  const { width, height, availWidth, availHeight, colorDepth } = window.screen;
  
  if (width < availWidth || height < availHeight) return true;
  if (colorDepth !== 24 && colorDepth !== 30 && colorDepth !== 48) return true;
  if (width === 0 || height === 0) return true;
  
  return false;
}

function detectAntiDetectBrowser(): boolean {
  const userAgent = navigator.userAgent;
  
  // Known anti-detect browser signatures
  const signatures = [
    'HeadlessChrome',
    'Multilogin',
    'GoLogin',
    'Kameleo',
    'Incogniton',
    'Dolphin',
    'Adspower',
    'VMLogin',
    'Linken Sphere',
    'Sphere'
  ];
  
  for (const sig of signatures) {
    if (userAgent.includes(sig)) return true;
  }
  
  // Check for automation indicators
  if ((window as any)._phantom || (window as any).phantom) return true;
  if ((window as any)._selenium || (window as any).selenium) return true;
  if ((window as any).callPhantom || (window as any).callSelenium) return true;
  
  // Check for unusual properties
  if (document.documentElement.getAttribute('webdriver')) return true;
  if ((navigator as any).webdriver === true) return true;
  
  return false;
}

// ============================================================================
// Developer Tools Detection
// ============================================================================

export function detectDevTools(): boolean {
  // Multiple detection methods
  let detected = false;
  
  // Method 1: Console detection
  const devtools = /./;
  devtools.toString = function() {
    detected = true;
    return 'devtools';
  };
  console.debug(devtools);
  
  // Method 2: Timing check
  const start = performance.now();
  debugger; // Will pause if devtools open
  const duration = performance.now() - start;
  if (duration > 100) detected = true;
  
  // Method 3: Window size check
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  if (widthThreshold || heightThreshold) detected = true;
  
  return detected;
}

// ============================================================================
// Virtual Machine Detection
// ============================================================================

export function detectVirtualMachine(): boolean {
  const checks: boolean[] = [];
  
  // Check 1: Hardware characteristics
  const cores = navigator.hardwareConcurrency || 0;
  if (cores === 1 || cores === 2) checks.push(true);
  
  // Check 2: Screen resolution (VMs often use common resolutions)
  const { width, height } = window.screen;
  const commonVMResolutions = [
    [800, 600], [1024, 768], [1280, 720], [1280, 800], [1920, 1080]
  ];
  if (commonVMResolutions.some(([w, h]) => w === width && h === height)) {
    checks.push(true);
  }
  
  // Check 3: Battery API (VMs don't have batteries)
  if ('getBattery' in navigator) {
    // This is async, so we can't check here
    // In production, this would be checked separately
  }
  
  // Check 4: GPU detection
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vmGPUs = ['VMware', 'VirtualBox', 'QEMU', 'Virtual', 'Software'];
      if (vmGPUs.some(gpu => renderer.includes(gpu))) {
        checks.push(true);
      }
    }
  }
  
  return checks.filter(Boolean).length >= 2;
}

// ============================================================================
// Location Spoofing Detection
// ============================================================================

export async function detectLocationSpoofing(): Promise<boolean> {
  if (!('geolocation' in navigator)) return false;
  
  try {
    return await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          
          // Check for impossible/suspicious coordinates
          const { latitude, longitude, accuracy } = position.coords;
          
          // Check for default/null island (0, 0)
          if (latitude === 0 && longitude === 0) {
            resolve(true);
            return;
          }
          
          // Check for suspiciously high accuracy (spoofed often has perfect accuracy)
          if (accuracy < 10) {
            resolve(true);
            return;
          }
          
          resolve(false);
        },
        () => {
          clearTimeout(timeout);
          resolve(false);
        }
      );
    });
  } catch {
    return false;
  }
}

// ============================================================================
// High Activity Detection
// ============================================================================

export interface HighActivityResult {
  result: boolean;
  eventsPerSecond: number;
  suspiciousPatterns: string[];
}

let eventCounts = {
  mouse: 0,
  keyboard: 0,
  touch: 0,
  scroll: 0
};
let startTime = Date.now();

export function initHighActivityDetection(): void {
  // Track user interactions
  document.addEventListener('mousemove', () => eventCounts.mouse++);
  document.addEventListener('keydown', () => eventCounts.keyboard++);
  document.addEventListener('touchstart', () => eventCounts.touch++);
  document.addEventListener('scroll', () => eventCounts.scroll++);
}

export function detectHighActivity(): HighActivityResult {
  const duration = (Date.now() - startTime) / 1000;
  const totalEvents = Object.values(eventCounts).reduce((a, b) => a + b, 0);
  const eventsPerSecond = totalEvents / duration;
  
  const suspiciousPatterns: string[] = [];
  
  // Bots often have very high or very low activity
  if (eventsPerSecond > 100) suspiciousPatterns.push('excessive_events');
  if (eventsPerSecond < 0.1 && duration > 10) suspiciousPatterns.push('no_activity');
  
  // Check for unnatural patterns
  if (eventCounts.keyboard > 0 && eventCounts.mouse === 0) {
    suspiciousPatterns.push('keyboard_only');
  }
  
  return {
    result: suspiciousPatterns.length > 0,
    eventsPerSecond,
    suspiciousPatterns
  };
}

// ============================================================================
// MITM Attack Detection
// ============================================================================

export function detectMITM(): boolean {
  const checks: boolean[] = [];
  
  // Check 1: Mixed content
  if (location.protocol === 'https:' && document.querySelectorAll('[src^="http:"]').length > 0) {
    checks.push(true);
  }
  
  // Check 2: Certificate issues (limited client-side)
  // This requires server-side validation
  
  // Check 3: Unexpected proxy
  if ((navigator as any).connection?.effectiveType === '2g' && 
      (navigator as any).connection?.downlink > 10) {
    checks.push(true); // Inconsistent connection data
  }
  
  return checks.filter(Boolean).length >= 1;
}

// ============================================================================
// Export all detection functions
// ============================================================================

export async function runAllDetections() {
  return {
    vpn: await detectVPN(),
    proxy: await detectProxy(),
    incognito: await detectIncognito(),
    tampering: detectTampering(),
    devTools: detectDevTools(),
    virtualMachine: detectVirtualMachine(),
    locationSpoofing: await detectLocationSpoofing(),
    highActivity: detectHighActivity(),
    mitm: detectMITM()
  };
}
