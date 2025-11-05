/**
 * WebGL Fingerprinting
 * 
 * Extracts GPU and graphics driver information through WebGL.
 * This is one of the most stable fingerprinting signals as it captures:
 * - GPU vendor and renderer
 * - Supported WebGL extensions
 * - Shader precision formats
 * - WebGL parameters and capabilities
 * 
 * Different GPUs and drivers produce unique signatures that are hard to spoof.
 */

export interface WebGLFingerprint {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
  parameters: WebGLParameters;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  hash: string;
}

export interface WebGLParameters {
  maxTextureSize: number;
  maxVertexTextureImageUnits: number;
  maxTextureImageUnits: number;
  maxCombinedTextureImageUnits: number;
  maxVertexAttribs: number;
  maxVaryingVectors: number;
  maxFragmentUniformVectors: number;
  maxVertexUniformVectors: number;
  aliasedLineWidthRange: [number, number];
  aliasedPointSizeRange: [number, number];
  maxViewportDims: [number, number];
  maxRenderbufferSize: number;
  maxAnisotropy?: number;
}

/**
 * Check if WebGL is supported in the browser
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Get WebGL context with all available options
 */
function getWebGLContext(): WebGLRenderingContext | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl as WebGLRenderingContext | null;
  } catch {
    return null;
  }
}

/**
 * Get unmasked GPU vendor and renderer using WEBGL_debug_renderer_info extension
 */
function getUnmaskedInfo(gl: WebGLRenderingContext): { vendor: string; renderer: string } {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  if (debugInfo) {
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown',
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown',
    };
  }
  
  return {
    vendor: 'Unknown',
    renderer: 'Unknown',
  };
}

/**
 * Get all supported WebGL extensions
 */
function getSupportedExtensions(gl: WebGLRenderingContext): string[] {
  const extensions = gl.getSupportedExtensions();
  return extensions ? extensions.sort() : [];
}

/**
 * Get WebGL parameters and capabilities
 */
function getWebGLParameters(gl: WebGLRenderingContext): WebGLParameters {
  const params: WebGLParameters = {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) as [number, number],
    aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as [number, number],
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS) as [number, number],
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
  };

  // Try to get max anisotropy (common extension)
  const anisotropyExt = gl.getExtension('EXT_texture_filter_anisotropic') ||
                        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                        gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  
  if (anisotropyExt) {
    params.maxAnisotropy = gl.getParameter(anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
  }

  return params;
}

/**
 * Generate a hash from WebGL data
 */
async function hashWebGLData(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return simpleHash(data);
    }
  }
  return simpleHash(data);
}

/**
 * Fallback simple hash function
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
 * Generate complete WebGL fingerprint
 */
export async function generateWebGLFingerprint(): Promise<WebGLFingerprint> {
  const gl = getWebGLContext();
  
  if (!gl) {
    throw new Error('WebGL not supported');
  }

  const unmaskedInfo = getUnmaskedInfo(gl);
  const extensions = getSupportedExtensions(gl);
  const parameters = getWebGLParameters(gl);

  const fingerprint: WebGLFingerprint = {
    vendor: gl.getParameter(gl.VENDOR) || 'Unknown',
    renderer: gl.getParameter(gl.RENDERER) || 'Unknown',
    version: gl.getParameter(gl.VERSION) || 'Unknown',
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown',
    extensions,
    parameters,
    unmaskedVendor: unmaskedInfo.vendor,
    unmaskedRenderer: unmaskedInfo.renderer,
    hash: '', // Will be set below
  };

  // Generate hash from all collected data
  const dataString = JSON.stringify({
    vendor: fingerprint.vendor,
    renderer: fingerprint.renderer,
    unmaskedVendor: fingerprint.unmaskedVendor,
    unmaskedRenderer: fingerprint.unmaskedRenderer,
    extensions: fingerprint.extensions,
    parameters: fingerprint.parameters,
  });

  fingerprint.hash = await hashWebGLData(dataString);

  return fingerprint;
}

/**
 * Get a lightweight WebGL fingerprint (just hash)
 * Useful when you don't need all the details
 */
export async function getWebGLHash(): Promise<string> {
  try {
    const fingerprint = await generateWebGLFingerprint();
    return fingerprint.hash;
  } catch {
    return 'webgl-not-supported';
  }
}

/**
 * Check if WebGL is being spoofed or blocked
 * Some privacy tools mask WebGL renderer info
 */
export function detectWebGLSpoofing(): boolean {
  const gl = getWebGLContext();
  
  if (!gl) {
    return true; // Assume spoofed if not available
  }

  const vendor = gl.getParameter(gl.VENDOR);
  const renderer = gl.getParameter(gl.RENDERER);

  // Check for generic renderer strings (often used by privacy tools)
  const genericPatterns = [
    /^Google Inc\.$/i,
    /^Mozilla$/i,
    /^WebKit$/i,
    /^ANGLE/i,
  ];

  const hasGenericVendor = genericPatterns.some(pattern => pattern.test(vendor || ''));
  const hasGenericRenderer = /^SwiftShader/i.test(renderer || '');

  return hasGenericVendor || hasGenericRenderer;
}

/**
 * Get detailed GPU information for debugging/analysis
 */
export interface GPUInfo {
  isSupported: boolean;
  vendor: string;
  renderer: string;
  gpuVendor: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'ARM' | 'Qualcomm' | 'Unknown';
  isSpoofed: boolean;
}

export function getGPUInfo(): GPUInfo {
  if (!isWebGLSupported()) {
    return {
      isSupported: false,
      vendor: 'Unknown',
      renderer: 'Unknown',
      gpuVendor: 'Unknown',
      isSpoofed: false,
    };
  }

  const gl = getWebGLContext();
  if (!gl) {
    return {
      isSupported: false,
      vendor: 'Unknown',
      renderer: 'Unknown',
      gpuVendor: 'Unknown',
      isSpoofed: false,
    };
  }

  const unmaskedInfo = getUnmaskedInfo(gl);
  const renderer = unmaskedInfo.renderer || gl.getParameter(gl.RENDERER) || 'Unknown';

  // Detect GPU vendor from renderer string
  let gpuVendor: GPUInfo['gpuVendor'] = 'Unknown';
  if (/NVIDIA/i.test(renderer)) gpuVendor = 'NVIDIA';
  else if (/AMD|ATI|Radeon/i.test(renderer)) gpuVendor = 'AMD';
  else if (/Intel/i.test(renderer)) gpuVendor = 'Intel';
  else if (/Apple/i.test(renderer)) gpuVendor = 'Apple';
  else if (/Mali|Adreno|PowerVR/i.test(renderer)) gpuVendor = 'ARM';
  else if (/Qualcomm/i.test(renderer)) gpuVendor = 'Qualcomm';

  return {
    isSupported: true,
    vendor: gl.getParameter(gl.VENDOR) || 'Unknown',
    renderer,
    gpuVendor,
    isSpoofed: detectWebGLSpoofing(),
  };
}
