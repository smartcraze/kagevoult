/**
 * TypeScript interfaces for fingerprint data
 */
export interface ClientFingerprint {
  userAgent: string;
  browserName: string;
  language: string;
  languages: readonly string[];
  platform: string;
  timezone: string;
  timezoneOffset: number;
}

export interface ScreenFingerprint {
  colorDepth?: number;
  pixelDepth?: number;
  height?: number;
  width?: number;
  availHeight?: number;
  availWidth?: number;
  devicePixelRatio?: number;
}

export interface HardwareFingerprint {
  maxTouchPoints?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

export interface BrowserCapabilities {
  cookieEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
  indexedDBEnabled: boolean;
  doNotTrackEnabled: boolean;
}

export interface BasicFingerprint {
  client: ClientFingerprint;
  screen: ScreenFingerprint;
  hardware: HardwareFingerprint;
  capabilities: BrowserCapabilities;
  timestamp: number;
}

/**
 * Detect browser type from user agent and vendor
 */
function getBrowserAgentType(ua: string, vendor: string): string {
  if (/Edg/i.test(ua)) return "Edge";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Chrome/i.test(ua) && /Google Inc/i.test(vendor)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && /Apple/i.test(vendor)) return "Safari";
  return "Unknown";
}

/**
 * Collect client/browser information
 */
export function getClientFingerprint(): ClientFingerprint {
  const vendor = (navigator as Navigator & { vendor?: string }).vendor || "";
  const ua = navigator.userAgent;

  return {
    userAgent: ua,
    browserName: getBrowserAgentType(ua, vendor),
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
  };
}

/**
 * Collect screen/display information
 */
export function getScreenFingerprint(): ScreenFingerprint {
  return {
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    height: screen.height,
    width: screen.width,
    availHeight: screen.availHeight,
    availWidth: screen.availWidth,
    devicePixelRatio: window.devicePixelRatio,
  };
}

/**
 * Collect hardware information
 */
export function getHardwareFingerprint(): HardwareFingerprint {
  const nav = navigator as Navigator & { 
    deviceMemory?: number;
  };

  return {
    maxTouchPoints: nav.maxTouchPoints,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory, // Chrome/Edge only
  };
}

/**
 * Test if localStorage is available and writable
 */
function testLocalStorage(): boolean {
  try {
    const testKey = "__kagevoult_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Test if sessionStorage is available and writable
 */
function testSessionStorage(): boolean {
  try {
    const testKey = "__kagevoult_test__";
    sessionStorage.setItem(testKey, "test");
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Test if IndexedDB is available (async check)
 */
async function testIndexedDB(): Promise<boolean> {
  const dbName = "__kagevoult_test__";
  
  if (!indexedDB || typeof indexedDB.open !== "function") {
    return false;
  }
  
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => {
        if (typeof indexedDB.deleteDatabase === "function") {
          indexedDB.deleteDatabase(dbName);
        }
        resolve(true);
      };
      request.onerror = () => {
        resolve(false);
      };
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Collect browser capabilities (sync version - no IndexedDB)
 */
export function getBrowserCapabilities(): BrowserCapabilities {
  return {
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: testLocalStorage(),
    sessionStorageEnabled: testSessionStorage(),
    indexedDBEnabled: false, // Placeholder - use async version for true value
    doNotTrackEnabled: navigator.doNotTrack === "1",
  };
}

/**
 * Collect browser capabilities with async IndexedDB check
 */
export async function getBrowserCapabilitiesAsync(): Promise<BrowserCapabilities> {
  const indexedDBEnabled = await testIndexedDB();
  
  return {
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: testLocalStorage(),
    sessionStorageEnabled: testSessionStorage(),
    indexedDBEnabled,
    doNotTrackEnabled: navigator.doNotTrack === "1",
  };
}

/**
 * Collect all basic fingerprint data (sync - without IndexedDB check)
 * Use this for fast synchronous collection
 */
export function collectBasicFingerprint(): BasicFingerprint {
  return {
    client: getClientFingerprint(),
    screen: getScreenFingerprint(),
    hardware: getHardwareFingerprint(),
    capabilities: getBrowserCapabilities(),
    timestamp: Date.now(),
  };
}

/**
 * Collect all basic fingerprint data (async - with IndexedDB check)
 * Use this for complete data collection
 */
export async function collectBasicFingerprintAsync(): Promise<BasicFingerprint> {
  const capabilities = await getBrowserCapabilitiesAsync();
  
  return {
    client: getClientFingerprint(),
    screen: getScreenFingerprint(),
    hardware: getHardwareFingerprint(),
    capabilities,
    timestamp: Date.now(),
  };
}

