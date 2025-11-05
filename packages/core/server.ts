/**
 * Server-only exports
 * These modules use Node.js APIs and should only be imported on the server
 */

// IP address detection (uses Node.js 'os' module)
export { getIpv4Address } from './network/ip';

// IP Geolocation (makes external HTTP requests)
export * from './network/ip-geolocation';

// Velocity tracking (requires persistent storage)
export * from './velocity/tracker';
