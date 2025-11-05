/**
 * Font Detection Fingerprinting
 * 
 * Detects which fonts are installed on the user's system by testing
 * if specific fonts render differently from a baseline font.
 * 
 * This is a stable fingerprinting signal because:
 * - Font installations are relatively stable over time
 * - Different OS/software combinations have unique font sets
 * - Hard to spoof without blocking canvas entirely
 */

export interface FontFingerprint {
  installedFonts: string[];
  fontCount: number;
  hash: string;
}

/**
 * List of common fonts to test
 * Organized by platform and software
 */
const FONT_LIST = [
  // Windows fonts
  'Arial', 'Verdana', 'Courier New', 'Times New Roman', 'Comic Sans MS',
  'Impact', 'Georgia', 'Trebuchet MS', 'Webdings', 'Wingdings',
  'MS Sans Serif', 'MS Serif', 'Calibri', 'Cambria', 'Consolas',
  'Candara', 'Franklin Gothic Medium', 'Segoe UI', 'Tahoma',
  
  // macOS fonts
  'Monaco', 'Menlo', 'Helvetica Neue', 'Helvetica', 'Geneva',
  'Lucida Grande', 'Gill Sans', 'Baskerville', 'Hoefler Text',
  'Apple Chancery', 'American Typewriter', 'Andale Mono',
  'Courier', 'Arial Black', 'Herculanum', 'Apple Color Emoji',
  
  // Linux fonts
  'Ubuntu', 'Liberation Sans', 'Liberation Serif', 'DejaVu Sans',
  'DejaVu Serif', 'Nimbus Sans L', 'Nimbus Mono L', 'Droid Sans',
  'Noto Sans', 'Roboto', 'Cantarell', 'FreeSans', 'FreeMono',
  
  // Common web fonts
  'Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Oswald', 'Merriweather', 'Nunito',
  
  // Asian fonts
  'Microsoft YaHei', 'SimSun', 'SimHei', 'Hiragino Sans GB',
  'Hiragino Kaku Gothic Pro', 'MS Gothic', 'MS Mincho', 'Meiryo',
  'Malgun Gothic', 'Dotum', 'Gulim', 'AppleGothic',
  
  // Developer/Design fonts
  'Fira Code', 'Source Code Pro', 'JetBrains Mono', 'Inconsolata',
  'Ubuntu Mono', 'Consolas', 'SF Mono', 'Cascadia Code',
  
  // Emoji fonts
  'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji',
];

/**
 * Baseline fonts that should be present on all systems
 * Used for comparison
 */
const BASELINE_FONTS = ['monospace', 'sans-serif', 'serif'];

/**
 * Default text used for font detection
 */
const TEST_STRING = 'mmmmmmmmmmlli';
const TEST_SIZE = '72px';

/**
 * Check if a specific font is available by comparing rendering
 */
function isFontAvailable(fontName: string): boolean {
  // Create a canvas to measure text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    return false;
  }

  // Function to get text width with specific font
  const getTextWidth = (font: string): number => {
    context.font = font;
    const metrics = context.measureText(TEST_STRING);
    return metrics.width;
  };

  // Measure with baseline fonts
  const baselineWidths = BASELINE_FONTS.map(baseline => {
    return getTextWidth(`${TEST_SIZE} ${baseline}`);
  });

  // Measure with test font + baseline fallback
  const testWidths = BASELINE_FONTS.map(baseline => {
    return getTextWidth(`${TEST_SIZE} "${fontName}", ${baseline}`);
  });

  // If any width differs, the font is available
  return testWidths.some((width, index) => width !== baselineWidths[index]);
}

/**
 * Detect all installed fonts from the predefined list
 */
export function detectInstalledFonts(): string[] {
  if (typeof document === 'undefined') {
    return [];
  }

  const installedFonts: string[] = [];

  for (const font of FONT_LIST) {
    if (isFontAvailable(font)) {
      installedFonts.push(font);
    }
  }

  return installedFonts.sort();
}

/**
 * Generate hash from font list
 */
async function hashFontData(fonts: string[]): Promise<string> {
  const dataString = fonts.join(',');
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return simpleHash(dataString);
    }
  }
  
  return simpleHash(dataString);
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
 * Generate complete font fingerprint
 */
export async function generateFontFingerprint(): Promise<FontFingerprint> {
  const installedFonts = detectInstalledFonts();
  const hash = await hashFontData(installedFonts);

  return {
    installedFonts,
    fontCount: installedFonts.length,
    hash,
  };
}

/**
 * Get just the font hash (lightweight)
 */
export async function getFontHash(): Promise<string> {
  try {
    const fingerprint = await generateFontFingerprint();
    return fingerprint.hash;
  } catch {
    return 'font-detection-failed';
  }
}

/**
 * Check if font detection is supported
 */
export function isFontDetectionSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    return !!context;
  } catch {
    return false;
  }
}

/**
 * Detect platform based on installed fonts
 */
export interface PlatformInfo {
  platform: 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS' | 'Unknown';
  confidence: number; // 0-1
  indicators: string[];
}

export function detectPlatformFromFonts(installedFonts: string[]): PlatformInfo {
  const indicators: string[] = [];
  const scores = {
    windows: 0,
    macos: 0,
    linux: 0,
    android: 0,
    ios: 0,
  };

  // Windows indicators
  const windowsFonts = ['Segoe UI', 'Calibri', 'Cambria', 'Consolas', 'Candara'];
  windowsFonts.forEach(font => {
    if (installedFonts.includes(font)) {
      scores.windows += 1;
      indicators.push(`Windows: ${font}`);
    }
  });

  // macOS indicators
  const macosFonts = ['Helvetica Neue', 'Menlo', 'Monaco', 'Lucida Grande', 'Gill Sans'];
  macosFonts.forEach(font => {
    if (installedFonts.includes(font)) {
      scores.macos += 1;
      indicators.push(`macOS: ${font}`);
    }
  });

  // Linux indicators
  const linuxFonts = ['Ubuntu', 'Liberation Sans', 'DejaVu Sans', 'Noto Sans', 'Cantarell'];
  linuxFonts.forEach(font => {
    if (installedFonts.includes(font)) {
      scores.linux += 1;
      indicators.push(`Linux: ${font}`);
    }
  });

  // Android indicators
  const androidFonts = ['Roboto', 'Droid Sans', 'Noto Sans'];
  androidFonts.forEach(font => {
    if (installedFonts.includes(font)) {
      scores.android += 0.5;
      indicators.push(`Android: ${font}`);
    }
  });

  // iOS indicators  
  const iosFonts = ['Helvetica Neue', 'Apple Color Emoji', 'SF Mono'];
  iosFonts.forEach(font => {
    if (installedFonts.includes(font)) {
      scores.ios += 0.5;
      indicators.push(`iOS: ${font}`);
    }
  });

  // Determine platform with highest score
  const maxScore = Math.max(...Object.values(scores));
  let detectedPlatform: PlatformInfo['platform'] = 'Unknown';
  
  if (maxScore > 0) {
    if (scores.windows === maxScore) detectedPlatform = 'Windows';
    else if (scores.macos === maxScore) detectedPlatform = 'macOS';
    else if (scores.linux === maxScore) detectedPlatform = 'Linux';
    else if (scores.android === maxScore) detectedPlatform = 'Android';
    else if (scores.ios === maxScore) detectedPlatform = 'iOS';
  }

  // Calculate confidence (0-1)
  const totalIndicators = windowsFonts.length + macosFonts.length + linuxFonts.length;
  const confidence = Math.min(maxScore / 3, 1); // Cap at 1.0

  return {
    platform: detectedPlatform,
    confidence,
    indicators,
  };
}

/**
 * Quick font check - test only a subset of fonts (faster)
 */
export async function quickFontCheck(): Promise<FontFingerprint> {
  const quickFontList = [
    'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New',
    'Georgia', 'Calibri', 'Segoe UI', 'Monaco', 'Menlo',
    'Ubuntu', 'Roboto', 'DejaVu Sans', 'Consolas',
  ];

  const installedFonts: string[] = [];

  for (const font of quickFontList) {
    if (isFontAvailable(font)) {
      installedFonts.push(font);
    }
  }

  const hash = await hashFontData(installedFonts);

  return {
    installedFonts: installedFonts.sort(),
    fontCount: installedFonts.length,
    hash,
  };
}
