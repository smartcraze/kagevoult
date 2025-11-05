 /**
 * IP Geolocation and ASN Lookup
 * Supports multiple providers: ipapi.co, ip-api.com, ipinfo.io
 */

import type { IPInfoData, IPInfoV4, IPGeolocation, ASNInfo, DatacenterInfo } from '@kagevoult/types';

export interface GeolocationProvider {
  name: string;
  lookup(ip: string): Promise<IPInfoV4 | null>;
}

/**
 * ipapi.co provider (free tier: 1000 requests/day)
 * https://ipapi.co/
 */
export class IpapiCoProvider implements GeolocationProvider {
  name = 'ipapi.co';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async lookup(ip: string): Promise<IPInfoV4 | null> {
    try {
      const url = this.apiKey 
        ? `https://ipapi.co/${ip}/json/?key=${this.apiKey}`
        : `https://ipapi.co/${ip}/json/`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        address: ip,
        geolocation: {
          accuracyRadius: 50, // Approximate
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          postalCode: data.postal || '',
          timezone: data.timezone || 'UTC',
          city: {
            name: data.city || 'Unknown'
          },
          country: {
            code: data.country_code || 'XX',
            name: data.country_name || 'Unknown'
          },
          continent: {
            code: data.continent_code || 'XX',
            name: data.continent_code || 'Unknown'
          },
          subdivisions: data.region ? [{
            isoCode: data.region_code || '',
            name: data.region || ''
          }] : []
        },
        asn: {
          asn: data.asn || 'Unknown',
          name: data.org || 'Unknown',
          network: data.network || ''
        },
        datacenter: {
          result: false,
          name: ''
        }
      };
    } catch (error) {
      console.error('ipapi.co lookup failed:', error);
      return null;
    }
  }
}

/**
 * ip-api.com provider (free tier: 45 requests/minute)
 * http://ip-api.com/
 */
export class IpApiComProvider implements GeolocationProvider {
  name = 'ip-api.com';

  async lookup(ip: string): Promise<IPInfoV4 | null> {
    try {
      const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.status !== 'success') return null;
      
      return {
        address: ip,
        geolocation: {
          accuracyRadius: 100,
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          postalCode: data.zip || '',
          timezone: data.timezone || 'UTC',
          city: {
            name: data.city || 'Unknown'
          },
          country: {
            code: data.countryCode || 'XX',
            name: data.country || 'Unknown'
          },
          continent: {
            code: 'XX',
            name: 'Unknown'
          },
          subdivisions: data.regionName ? [{
            isoCode: data.region || '',
            name: data.regionName || ''
          }] : []
        },
        asn: {
          asn: data.as ? data.as.split(' ')[0].replace('AS', '') : 'Unknown',
          name: data.asname || data.org || 'Unknown',
          network: ''
        },
        datacenter: {
          result: data.hosting || false,
          name: data.hosting ? data.org : ''
        }
      };
    } catch (error) {
      console.error('ip-api.com lookup failed:', error);
      return null;
    }
  }
}

/**
 * ipinfo.io provider (free tier: 50,000 requests/month)
 * https://ipinfo.io/
 */
export class IpinfoIoProvider implements GeolocationProvider {
  name = 'ipinfo.io';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async lookup(ip: string): Promise<IPInfoV4 | null> {
    try {
      const url = this.apiKey
        ? `https://ipinfo.io/${ip}?token=${this.apiKey}`
        : `https://ipinfo.io/${ip}/json`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = await response.json();
      const [lat, lon] = (data.loc || '0,0').split(',').map(Number);
      const [city, region] = (data.region || ',').split(',');
      
      return {
        address: ip,
        geolocation: {
          accuracyRadius: 100,
          latitude: lat || 0,
          longitude: lon || 0,
          postalCode: data.postal || '',
          timezone: data.timezone || 'UTC',
          city: {
            name: data.city || 'Unknown'
          },
          country: {
            code: data.country || 'XX',
            name: data.country || 'Unknown'
          },
          continent: {
            code: 'XX',
            name: 'Unknown'
          },
          subdivisions: data.region ? [{
            isoCode: '',
            name: data.region || ''
          }] : []
        },
        asn: {
          asn: data.org ? data.org.split(' ')[0].replace('AS', '') : 'Unknown',
          name: data.org || 'Unknown',
          network: ''
        },
        datacenter: {
          result: false,
          name: ''
        }
      };
    } catch (error) {
      console.error('ipinfo.io lookup failed:', error);
      return null;
    }
  }
}

/**
 * Fallback chain for IP geolocation with multiple providers
 */
export class GeolocationService {
  private providers: GeolocationProvider[];
  private cache: Map<string, IPInfoV4> = new Map();
  private cacheTTL = 1000 * 60 * 60; // 1 hour

  constructor(providers?: GeolocationProvider[]) {
    this.providers = providers || [
      new IpApiComProvider(), // Free, 45 req/min
      new IpapiCoProvider(), // Free, 1000 req/day
      new IpinfoIoProvider() // Free, 50k req/month
    ];
  }

  /**
   * Lookup IP with fallback across providers
   */
  async lookup(ip: string): Promise<IPInfoV4 | null> {
    // Check cache first
    const cached = this.cache.get(ip);
    if (cached) return cached;

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        const result = await provider.lookup(ip);
        if (result) {
          // Cache the result
          this.cache.set(ip, result);
          setTimeout(() => this.cache.delete(ip), this.cacheTTL);
          return result;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Batch lookup multiple IPs
   */
  async lookupBatch(ips: string[]): Promise<Map<string, IPInfoV4 | null>> {
    const results = new Map<string, IPInfoV4 | null>();
    
    await Promise.all(
      ips.map(async (ip) => {
        const result = await this.lookup(ip);
        results.set(ip, result);
      })
    );

    return results;
  }

  /**
   * Get full IP info data structure
   */
  async getIPInfo(ip: string): Promise<IPInfoData> {
    const v4 = await this.lookup(ip);
    return { v4: v4 || undefined };
  }
}

/**
 * Detect if IP is from a datacenter
 */
export function isDatacenter(asn: ASNInfo): boolean {
  const datacenterProviders = [
    'amazon',
    'aws',
    'google',
    'microsoft',
    'azure',
    'digitalocean',
    'linode',
    'vultr',
    'ovh',
    'hetzner',
    'cloudflare',
    'akamai',
    'fastly'
  ];

  const name = asn.name.toLowerCase();
  return datacenterProviders.some(provider => name.includes(provider));
}

/**
 * Detect if IP is residential
 */
export function isResidential(asn: ASNInfo): boolean {
  const residentialIndicators = [
    'comcast',
    'verizon',
    'att',
    'spectrum',
    'cox',
    'charter',
    'optimum',
    'frontier',
    'centurylink',
    'windstream',
    'bt group',
    'virgin media',
    'sky broadband',
    'vodafone',
    'orange',
    'telefonica',
    'deutsche telekom',
    'swisscom',
    'kpn',
    'telstra',
    'optus',
    'rogers',
    'bell canada',
    'telus'
  ];

  const name = asn.name.toLowerCase();
  return residentialIndicators.some(provider => name.includes(provider));
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detect impossible travel (user moved too fast between locations)
 */
export function detectImpossibleTravel(
  location1: IPGeolocation,
  location2: IPGeolocation,
  timeDiffMs: number
): boolean {
  const distance = calculateDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude
  );

  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
  const speedKmh = distance / timeDiffHours;

  // Max commercial flight speed is ~900 km/h
  // Add some margin for timezone differences
  return speedKmh > 1000;
}

// Export default instance
export const geoService = new GeolocationService();
