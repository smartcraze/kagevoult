/**
 * Complete Device Fingerprint Collector
 * 
 * Combines all fingerprinting techniques into a comprehensive device profile:
 * - Basic signals (browser, screen, hardware)
 * - Canvas rendering
 * - WebGL capabilities
 * - Audio processing
 * - Font detection
 * 
 * This module provides both sync and async collection methods.
 */

import type { BasicFingerprint } from './basic-collector';
import type { CanvasFingerprint } from './canvas-fingerprint';
import type { WebGLFingerprint } from './webgl-fingerprint';
import type { AudioFingerprint } from './audio-fingerprint';
import type { FontFingerprint } from './font-detector';

import { collectBasicFingerprint, collectBasicFingerprintAsync } from './basic-collector';
import { generateCanvasFingerprint, generateTextCanvasFingerprint } from './canvas-fingerprint';
import { generateWebGLFingerprint, getWebGLHash } from './webgl-fingerprint';
import { generateAudioFingerprint, getAudioHash } from './audio-fingerprint';
import { generateFontFingerprint, quickFontCheck, getFontHash } from './font-detector';

/**
 * Complete device fingerprint with all signals
 */
export interface CompleteFingerprint {
  basic: BasicFingerprint;
  canvas: CanvasFingerprint;
  webgl: WebGLFingerprint;
  audio: AudioFingerprint;
  fonts: FontFingerprint;
  timestamp: number;
  version: string;
}

/**
 * Lightweight fingerprint with just hashes (fast collection)
 */
export interface LightweightFingerprint {
  basic: BasicFingerprint;
  canvasHash: string;
  webglHash: string;
  audioHash: string;
  fontHash: string;
  timestamp: number;
  version: string;
}

/**
 * Collection options
 */
export interface CollectionOptions {
  includeCanvas?: boolean;
  includeWebGL?: boolean;
  includeAudio?: boolean;
  includeFonts?: boolean;
  quickMode?: boolean; // Use faster but less accurate methods
  timeout?: number; // Maximum time to wait for collection (ms)
}

/**
 * Default collection options
 */
const DEFAULT_OPTIONS: Required<CollectionOptions> = {
  includeCanvas: true,
  includeWebGL: true,
  includeAudio: true,
  includeFonts: true,
  quickMode: false,
  timeout: 5000,
};

/**
 * Current version of the fingerprint format
 */
const FINGERPRINT_VERSION = '1.0.0';

/**
 * Collect complete device fingerprint (async - most accurate)
 */
export async function collectCompleteFingerprint(
  options: CollectionOptions = {}
): Promise<CompleteFingerprint> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Fingerprint collection timeout')), opts.timeout);
  });

  try {
    const collectionPromise = async () => {
      const [basic, canvas, webgl, audio, fonts] = await Promise.all([
        collectBasicFingerprintAsync(),
        opts.includeCanvas
          ? generateCanvasFingerprint()
          : generateCanvasFingerprint().catch(() => ({
              hash: 'error',
              dataUrl: '',
              width: 0,
              height: 0,
              text: '',
            })),
        opts.includeWebGL
          ? generateWebGLFingerprint()
          : generateWebGLFingerprint().catch(() => ({
              vendor: 'error',
              renderer: 'error',
              version: 'error',
              shadingLanguageVersion: 'error',
              extensions: [],
              parameters: {} as any,
              unmaskedVendor: 'error',
              unmaskedRenderer: 'error',
              hash: 'error',
            })),
        opts.includeAudio
          ? generateAudioFingerprint()
          : generateAudioFingerprint().catch(() => ({
              hash: 'error',
              sampleRate: 0,
              maxChannelCount: 0,
              channelCount: 0,
              channelCountMode: 'error',
              channelInterpretation: 'error',
              state: 'error',
            })),
        opts.includeFonts
          ? opts.quickMode
            ? quickFontCheck()
            : generateFontFingerprint()
          : generateFontFingerprint().catch(() => ({
              installedFonts: [],
              fontCount: 0,
              hash: 'error',
            })),
      ]);

      return {
        basic,
        canvas,
        webgl,
        audio,
        fonts,
        timestamp: Date.now(),
        version: FINGERPRINT_VERSION,
      };
    };

    return await Promise.race([collectionPromise(), timeoutPromise]);
  } catch (error) {
    throw new Error(`Fingerprint collection failed: ${error}`);
  }
}

/**
 * Collect lightweight fingerprint (hashes only - fast)
 */
export async function collectLightweightFingerprint(
  options: CollectionOptions = {}
): Promise<LightweightFingerprint> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Fingerprint collection timeout')), opts.timeout);
  });

  try {
    const collectionPromise = async () => {
      const [basic, canvasHash, webglHash, audioHash, fontHash] = await Promise.all([
        collectBasicFingerprintAsync(),
        opts.includeCanvas
          ? opts.quickMode
            ? generateTextCanvasFingerprint()
            : generateTextCanvasFingerprint()
          : Promise.resolve('canvas-disabled'),
        opts.includeWebGL ? getWebGLHash() : Promise.resolve('webgl-disabled'),
        opts.includeAudio ? getAudioHash() : Promise.resolve('audio-disabled'),
        opts.includeFonts ? getFontHash() : Promise.resolve('fonts-disabled'),
      ]);

      return {
        basic,
        canvasHash,
        webglHash,
        audioHash,
        fontHash,
        timestamp: Date.now(),
        version: FINGERPRINT_VERSION,
      };
    };

    return await Promise.race([collectionPromise(), timeoutPromise]);
  } catch (error) {
    throw new Error(`Lightweight fingerprint collection failed: ${error}`);
  }
}

/**
 * Collect synchronous fingerprint (basic + canvas only)
 * Use when you need immediate results
 */
export function collectSyncFingerprint(): {
  basic: BasicFingerprint;
  timestamp: number;
  version: string;
} {
  return {
    basic: collectBasicFingerprint(),
    timestamp: Date.now(),
    version: FINGERPRINT_VERSION,
  };
}

/**
 * Generate a combined hash from all fingerprint components
 */
export async function generateCombinedHash(
  fingerprint: CompleteFingerprint | LightweightFingerprint
): Promise<string> {
  let dataString: string;

  if ('canvas' in fingerprint) {
    // CompleteFingerprint
    dataString = JSON.stringify({
      basic: fingerprint.basic,
      canvas: fingerprint.canvas.hash,
      webgl: fingerprint.webgl.hash,
      audio: fingerprint.audio.hash,
      fonts: fingerprint.fonts.hash,
    });
  } else {
    // LightweightFingerprint
    dataString = JSON.stringify({
      basic: fingerprint.basic,
      canvas: fingerprint.canvasHash,
      webgl: fingerprint.webglHash,
      audio: fingerprint.audioHash,
      fonts: fingerprint.fontHash,
    });
  }

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
 * Calculate confidence score for fingerprint (0-100)
 * Based on how many signals were successfully collected
 */
export function calculateConfidenceScore(
  fingerprint: CompleteFingerprint | LightweightFingerprint
): number {
  let successCount = 0;
  let totalCount = 5; // basic, canvas, webgl, audio, fonts

  // Basic is always present
  if (fingerprint.basic) {
    successCount++;
  }

  if ('canvas' in fingerprint) {
    // CompleteFingerprint
    if (fingerprint.canvas.hash !== 'error') successCount++;
    if (fingerprint.webgl.hash !== 'error') successCount++;
    if (fingerprint.audio.hash !== 'error') successCount++;
    if (fingerprint.fonts.hash !== 'error') successCount++;
  } else {
    // LightweightFingerprint
    if (fingerprint.canvasHash !== 'canvas-disabled' && fingerprint.canvasHash !== 'error') {
      successCount++;
    }
    if (fingerprint.webglHash !== 'webgl-disabled' && fingerprint.webglHash !== 'error') {
      successCount++;
    }
    if (fingerprint.audioHash !== 'audio-disabled' && fingerprint.audioHash !== 'error') {
      successCount++;
    }
    if (fingerprint.fontHash !== 'fonts-disabled' && fingerprint.fontHash !== 'error') {
      successCount++;
    }
  }

  return Math.round((successCount / totalCount) * 100);
}

/**
 * Export fingerprint as JSON string
 */
export function exportFingerprint(
  fingerprint: CompleteFingerprint | LightweightFingerprint
): string {
  return JSON.stringify(fingerprint, null, 2);
}

/**
 * Import fingerprint from JSON string
 */
export function importFingerprint(json: string): CompleteFingerprint | LightweightFingerprint {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error(`Failed to import fingerprint: ${error}`);
  }
}
