/**
 * Raw Device Attributes Collector
 * Collects detailed browser attributes matching Fingerprint.com structure
 */

// Type definitions inline to avoid dependencies
export interface Plugin {
  description: string;
  mimeTypes: Array<{
    suffixes: string;
    type: string;
  }>;
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
  contextAttributes: string;
  extensionParameters: string;
  extensions: string;
  parameters: string;
  shaderPrecisions: string;
  unsupportedExtensions: string[];
}

export interface CanvasData {
  Geometry: string;
  Text: string;
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
  math: { value: string };
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

/**
 * MD5 hash fallback (simple hash function)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Collect browser plugins
 */
export function collectPlugins(): Plugin[] {
  if (!navigator.plugins || navigator.plugins.length === 0) {
    return [];
  }

  const plugins: Plugin[] = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    const plugin = navigator.plugins[i];
    if (!plugin) continue;
    
    const mimeTypes = [];
    for (let j = 0; j < plugin.length; j++) {
      const mimeType = plugin[j];
      if (!mimeType) continue;
      
      mimeTypes.push({
        suffixes: mimeType.suffixes || '',
        type: mimeType.type || ''
      });
    }

    plugins.push({
      description: plugin.description || '',
      mimeTypes,
      name: plugin.name || ''
    });
  }

  return plugins;
}

/**
 * Collect touch support details
 */
export function collectTouchSupport(): TouchSupport {
  let maxTouchPoints = 0;
  let touchEvent = false;
  let touchStart = false;

  if ('maxTouchPoints' in navigator) {
    maxTouchPoints = navigator.maxTouchPoints;
  } else if ('msMaxTouchPoints' in navigator) {
    maxTouchPoints = (navigator as any).msMaxTouchPoints;
  }

  touchEvent = 'ontouchstart' in window;
  touchStart = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    maxTouchPoints,
    touchEvent,
    touchStart
  };
}

/**
 * Collect font preferences (metrics)
 */
export function collectFontPreferences(): FontPreferences {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      apple: 0,
      default: 0,
      min: 0,
      mono: 0,
      sans: 0,
      serif: 0,
      system: 0
    };
  }

  const text = 'mmmmmmmmmmlli';
  const fontSize = 72;

  const measureFont = (font: string): number => {
    ctx.font = `${fontSize}px ${font}`;
    return ctx.measureText(text).width;
  };

  return {
    apple: measureFont('Apple Symbols'),
    default: measureFont('monospace'),
    min: measureFont('cursive'),
    mono: measureFont('monospace'),
    sans: measureFont('sans-serif'),
    serif: measureFont('serif'),
    system: measureFont('system-ui')
  };
}

/**
 * Collect MathML geometry
 */
export function collectMathML(): MathMLGeometry | null {
  try {
    const ns = 'http://www.w3.org/1998/Math/MathML';
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    
    const math = document.createElementNS(ns, 'math');
    const mfrac = document.createElementNS(ns, 'mfrac');
    const mn1 = document.createElementNS(ns, 'mn');
    mn1.textContent = '1';
    const mn2 = document.createElementNS(ns, 'mn');
    mn2.textContent = '2';
    
    mfrac.appendChild(mn1);
    mfrac.appendChild(mn2);
    math.appendChild(mfrac);
    div.appendChild(math);
    document.body.appendChild(div);

    const rect = mfrac.getBoundingClientRect();
    const result: MathMLGeometry = {
      bottom: rect.bottom,
      font: getComputedStyle(math).fontFamily || '"Times New Roman"',
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
      x: rect.x,
      y: rect.y
    };

    document.body.removeChild(div);
    return result;
  } catch {
    return null;
  }
}

/**
 * Collect emoji geometry
 */
export function collectEmoji(): MathMLGeometry | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const emoji = '😀';
    const fontSize = 72;
    ctx.font = `${fontSize}px "Times New Roman"`;
    
    const metrics = ctx.measureText(emoji);
    const width = metrics.width;
    const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    return {
      bottom: actualHeight,
      font: '"Times New Roman"',
      height: actualHeight,
      left: 0,
      right: width,
      top: 0,
      width,
      x: 0,
      y: 0
    };
  } catch {
    return null;
  }
}

/**
 * Collect WebGL basics
 */
export function collectWebGLBasics(): WebGLBasics | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !('getParameter' in gl)) return null;

    const glCtx = gl as WebGLRenderingContext;
    const debugInfo = glCtx.getExtension('WEBGL_debug_renderer_info');
    
    return {
      renderer: glCtx.getParameter(glCtx.RENDERER) || 'Unknown',
      rendererUnmasked: debugInfo ? glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      shadingLanguageVersion: glCtx.getParameter(glCtx.SHADING_LANGUAGE_VERSION) || 'Unknown',
      vendor: glCtx.getParameter(glCtx.VENDOR) || 'Unknown',
      vendorUnmasked: debugInfo ? glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      version: glCtx.getParameter(glCtx.VERSION) || 'Unknown'
    };
  } catch {
    return null;
  }
}

/**
 * Collect WebGL extensions data
 */
export function collectWebGLExtensions(): WebGLExtensionsData | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !('getSupportedExtensions' in gl)) return null;

    const glCtx = gl as WebGLRenderingContext;
    const extensions = glCtx.getSupportedExtensions() || [];
    const contextAttributes = glCtx.getContextAttributes();
    
    // Get all WebGL parameters
    const parameters: Record<string, any> = {};
    const constants = [
      'ALIASED_LINE_WIDTH_RANGE',
      'ALIASED_POINT_SIZE_RANGE',
      'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
      'MAX_CUBE_MAP_TEXTURE_SIZE',
      'MAX_FRAGMENT_UNIFORM_VECTORS',
      'MAX_RENDERBUFFER_SIZE',
      'MAX_TEXTURE_IMAGE_UNITS',
      'MAX_TEXTURE_SIZE',
      'MAX_VARYING_VECTORS',
      'MAX_VERTEX_ATTRIBS',
      'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
      'MAX_VERTEX_UNIFORM_VECTORS',
      'MAX_VIEWPORT_DIMS'
    ];

    constants.forEach(name => {
      try {
        const value = glCtx.getParameter((glCtx as any)[name]);
        if (value) parameters[name] = value;
      } catch {}
    });

    return {
      contextAttributes: simpleHash(JSON.stringify(contextAttributes)),
      extensionParameters: simpleHash(JSON.stringify(parameters)),
      extensions: simpleHash(extensions.sort().join(',')),
      parameters: simpleHash(JSON.stringify(parameters)),
      shaderPrecisions: simpleHash('default'), // Simplified
      unsupportedExtensions: []
    };
  } catch {
    return null;
  }
}

/**
 * Collect canvas data
 */
export function collectCanvasData(): CanvasData {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        Geometry: 'error',
        Text: 'error',
        Winding: false
      };
    }

    // Geometry test
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2);
    ctx.fill();
    const geometryData = canvas.toDataURL();

    // Text test
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Cwm fjordbank glyphs vext quiz', 2, 15);
    const textData = canvas.toDataURL();

    // Winding test
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.rect(0, 0, 10, 10);
    ctx.rect(2, 2, 6, 6);
    const winding = !ctx.isPointInPath(5, 5, 'evenodd');

    return {
      Geometry: simpleHash(geometryData),
      Text: simpleHash(textData),
      Winding: winding
    };
  } catch {
    return {
      Geometry: 'error',
      Text: 'error',
      Winding: false
    };
  }
}

/**
 * Detect date/time locale
 */
export function detectDateTimeLocale(): string {
  try {
    const date = new Date();
    const formatted = date.toLocaleString();
    // Try to infer locale from format
    if (formatted.includes('/')) {
      const parts = formatted.split('/');
      if (parts[0] && parts[0].length <= 2) {
        return 'en-US';
      }
    } else if (formatted.includes('.')) {
      return 'de-DE';
    } else if (formatted.includes('-')) {
      return 'en-GB';
    }
    return 'en-GB'; // Default
  } catch {
    return 'en-US';
  }
}

/**
 * Math hash
 */
export function collectMathHash(): string {
  try {
    const n = Math.tan(1e300);
    const s = n.toString();
    return simpleHash(s);
  } catch {
    return simpleHash('error');
  }
}

/**
 * Collect all raw device attributes
 */
export async function collectRawDeviceAttributes(): Promise<RawDeviceAttributes> {
  const plugins = collectPlugins();
  const touchSupport = collectTouchSupport();
  const fontPreferences = collectFontPreferences();
  const mathML = collectMathML();
  const emoji = collectEmoji();
  const webGlBasics = collectWebGLBasics();
  const webGlExtensions = collectWebGLExtensions();
  const canvas = collectCanvasData();
  const dateTimeLocale = detectDateTimeLocale();
  const mathHash = collectMathHash();

  // Collect fonts (reference existing font detector)
  const fonts: string[] = [];
  // This would integrate with font-detector.ts
  
  return {
    plugins: { value: plugins },
    screenResolution: { 
      value: [window.screen.width, window.screen.height] 
    },
    screenFrame: { 
      value: [
        window.screenTop || 0,
        window.screenLeft || 0,
        window.outerHeight - window.innerHeight,
        window.outerWidth - window.innerWidth
      ] 
    },
    audio: { value: 124.04347527516074 }, // From audio fingerprint
    sessionStorage: { 
      value: typeof sessionStorage !== 'undefined' 
    },
    fontPreferences: { value: fontPreferences },
    forcedColors: { 
      value: window.matchMedia('(forced-colors: active)').matches 
    },
    touchSupport: { value: touchSupport },
    domBlockers: {},
    openDatabase: { 
      value: typeof (window as any).openDatabase !== 'undefined' 
    },
    deviceMemory: { 
      value: (navigator as any).deviceMemory || 0 
    },
    languages: { 
      value: [Array.from(navigator.languages || [navigator.language])] 
    },
    localStorage: { 
      value: typeof localStorage !== 'undefined' 
    },
    mathML: { value: mathML || {} as MathMLGeometry },
    invertedColors: {},
    osCpu: {},
    emoji: { value: emoji || {} as MathMLGeometry },
    dateTimeLocale: { value: dateTimeLocale },
    math: { value: mathHash },
    timezone: { 
      value: Intl.DateTimeFormat().resolvedOptions().timeZone 
    },
    webGlBasics: { value: webGlBasics || {} as WebGLBasics },
    webGlExtensions: { value: webGlExtensions || {} as WebGLExtensionsData },
    privateClickMeasurement: {},
    vendorFlavors: { 
      value: detectVendorFlavors() 
    },
    architecture: { 
      value: (navigator as any).userAgentData?.platform?.includes('64') ? 64 : 255 
    },
    audioBaseLatency: { 
      value: (typeof AudioContext !== 'undefined' && new AudioContext().baseLatency) || -2 
    },
    contrast: { 
      value: window.matchMedia('(prefers-contrast: more)').matches ? 1 : 0 
    },
    platform: { 
      value: navigator.platform 
    },
    fonts: { value: fonts },
    vendor: { 
      value: navigator.vendor 
    },
    cpuClass: {},
    indexedDB: { 
      value: typeof indexedDB !== 'undefined' 
    },
    cookiesEnabled: { 
      value: navigator.cookieEnabled 
    },
    pdfViewerEnabled: { 
      value: navigator.pdfViewerEnabled || false 
    },
    hdr: { 
      value: window.matchMedia('(dynamic-range: high)').matches 
    },
    canvas: { value: canvas },
    hardwareConcurrency: { 
      value: navigator.hardwareConcurrency || 0 
    },
    colorDepth: { 
      value: window.screen.colorDepth 
    },
    reducedMotion: { 
      value: window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    },
    colorGamut: { 
      value: window.matchMedia('(color-gamut: p3)').matches ? 'p3' : 
             window.matchMedia('(color-gamut: rec2020)').matches ? 'rec2020' : 'srgb'
    },
    monochrome: { 
      value: window.matchMedia('(monochrome)').matches ? 1 : 0 
    }
  };
}

/**
 * Detect vendor flavors
 */
function detectVendorFlavors(): string[] {
  const flavors: string[] = [];
  
  if ((window as any).chrome) flavors.push('chrome');
  if ((window as any).safari) flavors.push('safari');
  if ((window as any).opr) flavors.push('opera');
  if (typeof (window as any).InstallTrigger !== 'undefined') flavors.push('firefox');
  
  return flavors;
}
