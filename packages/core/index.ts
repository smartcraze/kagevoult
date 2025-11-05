/**
 * Kagevoult Core
 * Device fingerprinting library for fraud detection, payment verification,
 * and customer tracking.
 */

// Browser fingerprinting modules
export * from './browser/basic-collector';
export * from './browser/canvas-fingerprint';
export * from './browser/webgl-fingerprint';
export * from './browser/audio-fingerprint';
export * from './browser/font-detector';
export * from './browser/fingerprint-collector';
export * from './browser/raw-attributes';
export * from './browser/advanced-detection';
export * from './browser/response-builder';

// Network modules (server-side only)
// Note: getIpv4Address is Node.js only - don't use in browser
export * from './network/headers';
export * from './network/tls-fingerprint';
export * from './network/timing';
export * from './network/network-collector';