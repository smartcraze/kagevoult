/**
 * Canvas Fingerprinting
 * 
 * Generates a unique fingerprint based on how the browser renders canvas elements.
 * Different GPUs, drivers, and OS render text/shapes slightly differently.
 * This creates a stable identifier that's hard to spoof.
 */

export interface CanvasFingerprint {
  hash: string;
  dataUrl: string;
  width: number;
  height: number;
  text: string;
}

/**
 * Generates a canvas fingerprint by rendering text with various styles
 * and extracting the pixel data as a hash.
 */
export async function generateCanvasFingerprint(): Promise<CanvasFingerprint> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }

    // Set canvas dimensions
    canvas.width = 300;
    canvas.height = 150;

    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f39c12');
    gradient.addColorStop(0.5, '#e74c3c');
    gradient.addColorStop(1, '#9b59b6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text with multiple fonts and styles
    const textString = 'Cwm fjordbank glyphs vext quiz 🎨🔐';
    
    // Text style 1
    ctx.font = '18px "Arial"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(textString, 10, 30);

    // Text style 2
    ctx.font = 'bold 16px "Times New Roman"';
    ctx.fillStyle = '#000000';
    ctx.fillText(textString, 10, 55);

    // Text style 3
    ctx.font = 'italic 14px "Courier New"';
    ctx.fillStyle = '#00ff00';
    ctx.fillText(textString, 10, 80);

    // Draw geometric shapes
    ctx.beginPath();
    ctx.arc(50, 110, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(100, 95, 40, 30);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fill();

    // Add some transforms
    ctx.save();
    ctx.translate(200, 110);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillRect(-15, -15, 30, 30);
    ctx.restore();

    // Get canvas data
    const dataUrl = canvas.toDataURL();
    
    // Generate hash from canvas data
    const hash = await hashString(dataUrl);

    return {
      hash,
      dataUrl: dataUrl.substring(0, 100) + '...', // Truncate for storage
      width: canvas.width,
      height: canvas.height,
      text: textString,
    };
  } catch (error) {
    throw new Error(`Canvas fingerprint generation failed: ${error}`);
  }
}

/**
 * Alternative: Generate canvas fingerprint from text rendering only
 * (lighter weight version)
 */
export async function generateTextCanvasFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  canvas.width = 280;
  canvas.height = 60;

  // Simple text rendering test
  const testString = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  
  ctx.fillStyle = '#069';
  ctx.fillText(testString, 2, 15);
  
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText(testString, 4, 17);

  const dataUrl = canvas.toDataURL();
  return await hashString(dataUrl);
}

/**
 * Hash a string using SubtleCrypto (SHA-256)
 * Falls back to simple hash if SubtleCrypto is not available
 */
async function hashString(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fall back to simple hash
      return simpleHash(str);
    }
  }
  
  return simpleHash(str);
}

/**
 * Simple hash function (fallback for environments without SubtleCrypto)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Check if canvas fingerprinting is supported
 */
export function isCanvasFingerprintingSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!ctx;
  } catch {
    return false;
  }
}

/**
 * Detect if canvas is being blocked or spoofed
 * (some privacy tools randomize canvas output)
 */
export async function detectCanvasSpoofing(): Promise<boolean> {
  try {
    // Generate fingerprint twice
    const fp1 = await generateTextCanvasFingerprint();
    const fp2 = await generateTextCanvasFingerprint();
    
    // If they're different, canvas is being randomized
    return fp1 !== fp2;
  } catch {
    return true; // Assume spoofed if error occurs
  }
}
