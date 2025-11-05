/**
 * Comprehensive device fingerprinting types
 * Modeled after Fingerprint.com API structure
 */

// ============================================================================
// Identification Product
// ============================================================================

export interface BrowserDetails {
  browserName: string;
  browserMajorVersion: string;
  browserFullVersion: string;
  os: string;
  osVersion: string;
  device: string;
  userAgent: string;
}

export interface IPLocation {
  accuracyRadius: number;
  latitude: number;
  longitude: number;
  postalCode: string;
  timezone: string;
  city: {
    name: string;
  };
  country: {
    code: string;
    name: string;
  };
  continent: {
    code: string;
    name: string;
  };
  subdivisions: Array<{
    isoCode: string;
    name: string;
  }>;
}

export interface ConfidenceScore {
  score: number; // 0-1
  revision: string;
}

export interface SeenAt {
  global: string; // ISO timestamp
  subscription: string; // ISO timestamp
}

export interface SDKIntegration {
  name: string;
  version: string;
}

export interface SDK {
  platform: string;
  version: string;
  integrations: SDKIntegration[];
}

export interface IdentificationData {
  visitorId: string;
  requestId: string;
  browserDetails: BrowserDetails;
  incognito: boolean;
  ip: string;
  ipLocation: IPLocation | null;
  linkedId?: string;
  timestamp: number;
  time: string; // ISO timestamp
  url: string;
  tag: Record<string, any>;
  confidence: ConfidenceScore;
  visitorFound: boolean;
  firstSeenAt: SeenAt;
  lastSeenAt: SeenAt;
  replayed: boolean;
  sdk?: SDK;
  environmentId?: string;
}

// ============================================================================
// Bot Detection Product
// ============================================================================

export interface BotDetectionData {
  bot: {
    result: 'notDetected' | 'good' | 'bad';
    type?: string;
  };
  linkedId?: string;
  url: string;
  ip: string;
  time: string;
  userAgent: string;
  requestId: string;
}

// ============================================================================
// Root Apps (Mobile)
// ============================================================================

export interface RootAppsData {
  result: boolean;
}

// ============================================================================
// Emulator Detection (Mobile)
// ============================================================================

export interface EmulatorData {
  result: boolean;
}

// ============================================================================
// IP Info Product
// ============================================================================

export interface ASNInfo {
  asn: string;
  name: string;
  network: string;
}

export interface DatacenterInfo {
  result: boolean;
  name: string;
}

export interface IPGeolocation {
  accuracyRadius: number;
  latitude: number;
  longitude: number;
  postalCode: string;
  timezone: string;
  city: {
    name: string;
  };
  country: {
    code: string;
    name: string;
  };
  continent: {
    code: string;
    name: string;
  };
  subdivisions: Array<{
    isoCode: string;
    name: string;
  }>;
}

export interface IPInfoV4 {
  address: string;
  geolocation: IPGeolocation;
  asn: ASNInfo;
  datacenter: DatacenterInfo;
}

export interface IPInfoData {
  v4?: IPInfoV4;
  v6?: {
    address: string;
    geolocation: IPGeolocation;
    asn: ASNInfo;
    datacenter: DatacenterInfo;
  };
}

// ============================================================================
// IP Blocklist
// ============================================================================

export interface IPBlocklistData {
  result: boolean;
  details: {
    emailSpam: boolean;
    attackSource: boolean;
  };
}

// ============================================================================
// Tor Detection
// ============================================================================

export interface TorData {
  result: boolean;
}

// ============================================================================
// VPN Detection
// ============================================================================

export interface VPNMethods {
  timezoneMismatch: boolean;
  publicVPN: boolean;
  auxiliaryMobile: boolean;
  osMismatch: boolean;
  relay: boolean;
}

export interface VPNData {
  result: boolean;
  confidence: 'low' | 'medium' | 'high';
  originTimezone: string;
  originCountry: string;
  methods: VPNMethods;
}

// ============================================================================
// Proxy Detection
// ============================================================================

export interface ProxyData {
  result: boolean;
  confidence: 'low' | 'medium' | 'high';
}

// ============================================================================
// Incognito Detection
// ============================================================================

export interface IncognitoData {
  result: boolean;
}

// ============================================================================
// Tampering Detection
// ============================================================================

export interface TamperingData {
  result: boolean;
  anomalyScore: number; // 0-1
  antiDetectBrowser: boolean;
}

// ============================================================================
// Cloned App (Mobile)
// ============================================================================

export interface ClonedAppData {
  result: boolean;
}

// ============================================================================
// Factory Reset (Mobile)
// ============================================================================

export interface FactoryResetData {
  time: string;
  timestamp: number;
}

// ============================================================================
// Jailbroken (Mobile)
// ============================================================================

export interface JailbrokenData {
  result: boolean;
}

// ============================================================================
// Frida Detection (Mobile)
// ============================================================================

export interface FridaData {
  result: boolean;
}

// ============================================================================
// Privacy Settings
// ============================================================================

export interface PrivacySettingsData {
  result: boolean;
}

// ============================================================================
// Virtual Machine Detection
// ============================================================================

export interface VirtualMachineData {
  result: boolean;
}

// ============================================================================
// Raw Device Attributes
// ============================================================================

export interface PluginMimeType {
  suffixes: string;
  type: string;
}

export interface Plugin {
  description: string;
  mimeTypes: PluginMimeType[];
  name: string;
}

export interface TouchSupport {
  maxTouchPoints: number;
  touchEvent: boolean;
  touchStart: boolean;
}

export interface FontPreferences {
  apple: number;
  default: number;
  min: number;
  mono: number;
  sans: number;
  serif: number;
  system: number;
}

export interface MathMLGeometry {
  bottom: number;
  font: string;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}

export interface WebGLBasics {
  renderer: string;
  rendererUnmasked: string;
  shadingLanguageVersion: string;
  vendor: string;
  vendorUnmasked: string;
  version: string;
}

export interface WebGLExtensionsData {
  contextAttributes: string; // MD5 hash
  extensionParameters: string; // MD5 hash
  extensions: string; // MD5 hash
  parameters: string; // MD5 hash
  shaderPrecisions: string; // MD5 hash
  unsupportedExtensions: string[];
}

export interface CanvasData {
  Geometry: string; // MD5 hash
  Text: string; // MD5 hash
  Winding: boolean;
}

export interface RawDeviceAttributes {
  plugins: { value: Plugin[] };
  screenResolution: { value: [number, number] };
  screenFrame: { value: [number, number, number, number] };
  audio: { value: number };
  sessionStorage: { value: boolean };
  fontPreferences: { value: FontPreferences };
  forcedColors: { value: boolean };
  touchSupport: { value: TouchSupport };
  domBlockers: Record<string, any>;
  openDatabase: { value: boolean };
  deviceMemory: { value: number };
  languages: { value: string[][] };
  localStorage: { value: boolean };
  mathML: { value: MathMLGeometry };
  invertedColors: Record<string, any>;
  osCpu: Record<string, any>;
  emoji: { value: MathMLGeometry };
  dateTimeLocale: { value: string };
  math: { value: string }; // MD5 hash
  timezone: { value: string };
  webGlBasics: { value: WebGLBasics };
  webGlExtensions: { value: WebGLExtensionsData };
  privateClickMeasurement: Record<string, any>;
  vendorFlavors: { value: string[] };
  architecture: { value: number };
  audioBaseLatency: { value: number };
  contrast: { value: number };
  platform: { value: string };
  fonts: { value: string[] };
  vendor: { value: string };
  cpuClass: Record<string, any>;
  indexedDB: { value: boolean };
  cookiesEnabled: { value: boolean };
  pdfViewerEnabled: { value: boolean };
  hdr: { value: boolean };
  canvas: { value: CanvasData };
  hardwareConcurrency: { value: number };
  colorDepth: { value: number };
  reducedMotion: { value: boolean };
  colorGamut: { value: string };
  monochrome: { value: number };
}

// ============================================================================
// High Activity Detection
// ============================================================================

export interface HighActivityData {
  result: boolean;
}

// ============================================================================
// Location Spoofing
// ============================================================================

export interface LocationSpoofingData {
  result: boolean;
}

// ============================================================================
// Suspect Score
// ============================================================================

export interface SuspectScoreData {
  result: number; // 0-1
}

// ============================================================================
// Velocity Tracking
// ============================================================================

export interface VelocityIntervals {
  '5m': number;
  '1h': number;
  '24h': number;
}

export interface VelocityData {
  distinctIp: {
    intervals: VelocityIntervals;
  };
  distinctLinkedId: {
    intervals: VelocityIntervals;
  };
  distinctCountry: {
    intervals: VelocityIntervals;
  };
  events: {
    intervals: VelocityIntervals;
  };
  ipEvents: {
    intervals: VelocityIntervals;
  };
  distinctIpByLinkedId: {
    intervals: VelocityIntervals;
  };
  distinctVisitorIdByLinkedId: {
    intervals: VelocityIntervals;
  };
}

// ============================================================================
// Developer Tools Detection
// ============================================================================

export interface DeveloperToolsData {
  result: boolean;
}

// ============================================================================
// MITM Attack Detection
// ============================================================================

export interface MITMAttackData {
  result: boolean;
}

// ============================================================================
// Proximity (not implemented in example)
// ============================================================================

export interface ProximityData {
  // Empty in example
}

// ============================================================================
// Main Products Response
// ============================================================================

export interface FingerprintProducts {
  identification: {
    data: IdentificationData;
  };
  botd: {
    data: BotDetectionData;
  };
  rootApps: {
    data: RootAppsData;
  };
  emulator: {
    data: EmulatorData;
  };
  ipInfo: {
    data: IPInfoData;
  };
  ipBlocklist: {
    data: IPBlocklistData;
  };
  tor: {
    data: TorData;
  };
  vpn: {
    data: VPNData;
  };
  proxy: {
    data: ProxyData;
  };
  incognito: {
    data: IncognitoData;
  };
  tampering: {
    data: TamperingData;
  };
  clonedApp: {
    data: ClonedAppData;
  };
  factoryReset: {
    data: FactoryResetData;
  };
  jailbroken: {
    data: JailbrokenData;
  };
  frida: {
    data: FridaData;
  };
  privacySettings: {
    data: PrivacySettingsData;
  };
  virtualMachine: {
    data: VirtualMachineData;
  };
  rawDeviceAttributes: {
    data: RawDeviceAttributes;
  };
  highActivity: {
    data: HighActivityData;
  };
  locationSpoofing: {
    data: LocationSpoofingData;
  };
  suspectScore: {
    data: SuspectScoreData;
  };
  velocity: {
    data: VelocityData;
  };
  developerTools: {
    data: DeveloperToolsData;
  };
  mitmAttack: {
    data: MITMAttackData;
  };
  proximity: ProximityData;
}

export interface FingerprintResponse {
  products: FingerprintProducts;
}
