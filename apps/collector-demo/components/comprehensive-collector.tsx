'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getFingerprint,
  buildFingerprintResponse,
  runAllDetections,
  collectRawDeviceAttributes,
  initHighActivityDetection,
} from 'core';
import type { FingerprintResponse } from '@kagevoult/types';

export default function ComprehensiveFingerprintCollector() {
  const [response, setResponse] = useState<FingerprintResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize high activity tracking on mount
  useEffect(() => {
    initHighActivityDetection();
  }, []);

  const collectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fingerprintResponse = await buildFingerprintResponse({
        url: window.location.href,
        linkedId: 'demo_session_' + Date.now(),
        environmentId: 'kagevoult_demo'
      });

      setResponse(fingerprintResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    collectData();
  }, [collectData]);

  if (loading && !response) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Collecting comprehensive fingerprint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="text-center text-red-300">
          <p className="text-xl mb-4">Error: {error}</p>
          <button
            onClick={collectData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!response) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'identification', label: 'Identification', icon: '🆔' },
    { id: 'detection', label: 'Detection', icon: '🔍' },
    { id: 'vpn-proxy', label: 'VPN/Proxy', icon: '🌐' },
    { id: 'tampering', label: 'Tampering', icon: '⚠️' },
    { id: 'raw-attributes', label: 'Raw Attributes', icon: '🔧' },
    { id: 'velocity', label: 'Velocity', icon: '⚡' },
    { id: 'raw-json', label: 'Raw JSON', icon: '📝' },
  ];

  const { products } = response;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔐 Kagevoult Fingerprinting Demo
          </h1>
          <p className="text-purple-300">
            Comprehensive Device & Behavior Analysis
          </p>
          <button
            onClick={collectData}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {loading ? 'Collecting...' : '🔄 Refresh Data'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
          {activeTab === 'overview' && <OverviewTab products={products} />}
          {activeTab === 'identification' && <IdentificationTab data={products.identification.data} />}
          {activeTab === 'detection' && <DetectionTab products={products} />}
          {activeTab === 'vpn-proxy' && <VpnProxyTab vpn={products.vpn.data} proxy={products.proxy.data} />}
          {activeTab === 'tampering' && <TamperingTab data={products.tampering.data} />}
          {activeTab === 'raw-attributes' && <RawAttributesTab data={products.rawDeviceAttributes.data} />}
          {activeTab === 'velocity' && <VelocityTab data={products.velocity.data} />}
          {activeTab === 'raw-json' && <RawJsonTab response={response} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ products }: any) {
  const identification = products.identification.data;
  const suspectScore = products.suspectScore.data.result;
  const confidence = identification.confidence.score;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Fingerprint Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Visitor ID"
          value={identification.visitorId}
          color="purple"
        />
        <MetricCard
          title="Confidence Score"
          value={`${(confidence * 100).toFixed(1)}%`}
          color={confidence > 0.8 ? 'green' : confidence > 0.5 ? 'yellow' : 'red'}
        />
        <MetricCard
          title="Suspect Score"
          value={`${(suspectScore * 100).toFixed(1)}%`}
          color={suspectScore > 0.5 ? 'red' : suspectScore > 0.3 ? 'yellow' : 'green'}
        />
      </div>

      {/* Detection Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DetectionBadge label="Bot" detected={products.botd.data.bot.result !== 'notDetected'} />
        <DetectionBadge label="VPN" detected={products.vpn.data.result} />
        <DetectionBadge label="Proxy" detected={products.proxy.data.result} />
        <DetectionBadge label="Incognito" detected={products.incognito.data.result} />
        <DetectionBadge label="Tampering" detected={products.tampering.data.result} />
        <DetectionBadge label="Dev Tools" detected={products.developerTools.data.result} />
        <DetectionBadge label="Virtual Machine" detected={products.virtualMachine.data.result} />
        <DetectionBadge label="High Activity" detected={products.highActivity.data.result} />
      </div>

      {/* Browser Details */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Browser Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoRow label="Browser" value={`${identification.browserDetails.browserName} ${identification.browserDetails.browserMajorVersion}`} />
          <InfoRow label="OS" value={`${identification.browserDetails.os} ${identification.browserDetails.osVersion}`} />
          <InfoRow label="Device" value={identification.browserDetails.device} />
          <InfoRow label="Timezone" value={new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' })} />
        </div>
      </div>
    </div>
  );
}

// Identification Tab
function IdentificationTab({ data }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Identification Data</h2>
      
      <DataSection title="Core Identity">
        <InfoRow label="Visitor ID" value={data.visitorId} />
        <InfoRow label="Request ID" value={data.requestId} />
        <InfoRow label="Linked ID" value={data.linkedId || 'None'} />
        <InfoRow label="Timestamp" value={new Date(data.timestamp).toLocaleString()} />
      </DataSection>

      <DataSection title="Confidence">
        <InfoRow label="Score" value={`${(data.confidence.score * 100).toFixed(1)}%`} />
        <InfoRow label="Revision" value={data.confidence.revision} />
        <InfoRow label="Visitor Found" value={data.visitorFound ? 'Yes' : 'No'} />
      </DataSection>

      <DataSection title="Browser Details">
        <InfoRow label="Browser" value={data.browserDetails.browserName} />
        <InfoRow label="Version" value={data.browserDetails.browserFullVersion} />
        <InfoRow label="OS" value={data.browserDetails.os} />
        <InfoRow label="OS Version" value={data.browserDetails.osVersion} />
        <InfoRow label="Device Type" value={data.browserDetails.device} />
        <InfoRow label="User Agent" value={data.browserDetails.userAgent} monospace />
      </DataSection>
    </div>
  );
}

// Detection Tab
function DetectionTab({ products }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Detection Results</h2>
      
      <DataSection title="Bot Detection">
        <InfoRow label="Result" value={products.botd.data.bot.result} />
        <InfoRow label="Type" value={products.botd.data.bot.type || 'N/A'} />
      </DataSection>

      <DataSection title="Privacy & Security">
        <InfoRow label="Incognito Mode" value={products.incognito.data.result ? 'Detected' : 'Not Detected'} />
        <InfoRow label="Developer Tools" value={products.developerTools.data.result ? 'Open' : 'Closed'} />
        <InfoRow label="Virtual Machine" value={products.virtualMachine.data.result ? 'Detected' : 'Not Detected'} />
      </DataSection>

      <DataSection title="Mobile-Specific (if applicable)">
        <InfoRow label="Rooted/Jailbroken" value={products.jailbroken.data.result ? 'Yes' : 'No'} />
        <InfoRow label="Emulator" value={products.emulator.data.result ? 'Detected' : 'Not Detected'} />
        <InfoRow label="Cloned App" value={products.clonedApp.data.result ? 'Detected' : 'Not Detected'} />
        <InfoRow label="Frida" value={products.frida.data.result ? 'Detected' : 'Not Detected'} />
      </DataSection>
    </div>
  );
}

// VPN/Proxy Tab
function VpnProxyTab({ vpn, proxy }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">VPN & Proxy Detection</h2>
      
      <DataSection title="VPN Detection">
        <InfoRow label="Detected" value={vpn.result ? 'Yes' : 'No'} />
        <InfoRow label="Confidence" value={vpn.confidence.toUpperCase()} />
        <InfoRow label="Origin Timezone" value={vpn.originTimezone} />
        <InfoRow label="Origin Country" value={vpn.originCountry} />
        
        <div className="col-span-2 mt-2">
          <p className="text-purple-300 font-semibold mb-2">Detection Methods:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoRow label="Timezone Mismatch" value={vpn.methods.timezoneMismatch ? '✓' : '✗'} />
            <InfoRow label="Public VPN" value={vpn.methods.publicVPN ? '✓' : '✗'} />
            <InfoRow label="Auxiliary Mobile" value={vpn.methods.auxiliaryMobile ? '✓' : '✗'} />
            <InfoRow label="OS Mismatch" value={vpn.methods.osMismatch ? '✓' : '✗'} />
            <InfoRow label="Relay Detection" value={vpn.methods.relay ? '✓' : '✗'} />
          </div>
        </div>
      </DataSection>

      <DataSection title="Proxy Detection">
        <InfoRow label="Detected" value={proxy.result ? 'Yes' : 'No'} />
        <InfoRow label="Confidence" value={proxy.confidence.toUpperCase()} />
      </DataSection>
    </div>
  );
}

// Tampering Tab
function TamperingTab({ data }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Tampering Detection</h2>
      
      <DataSection title="Analysis Results">
        <InfoRow label="Tampering Detected" value={data.result ? 'Yes' : 'No'} />
        <InfoRow 
          label="Anomaly Score" 
          value={`${(data.anomalyScore * 100).toFixed(1)}%`}
          color={data.anomalyScore > 0.5 ? 'red' : data.anomalyScore > 0.3 ? 'yellow' : 'green'}
        />
        <InfoRow label="Anti-Detect Browser" value={data.antiDetectBrowser ? 'Detected' : 'Not Detected'} />
      </DataSection>

      {data.antiDetectBrowser && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-300 font-semibold">⚠️ Anti-Detect Browser Detected</p>
          <p className="text-red-200 text-sm mt-1">
            This visitor may be using tools like Multilogin, GoLogin, Kameleo, or similar anti-detection software.
          </p>
        </div>
      )}
    </div>
  );
}

// Raw Attributes Tab
function RawAttributesTab({ data }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Raw Device Attributes</h2>
      
      <DataSection title="Screen & Display">
        <InfoRow label="Resolution" value={`${data.screenResolution.value[0]} x ${data.screenResolution.value[1]}`} />
        <InfoRow label="Color Depth" value={`${data.colorDepth.value} bits`} />
        <InfoRow label="Color Gamut" value={data.colorGamut.value} />
        <InfoRow label="HDR" value={data.hdr.value ? 'Supported' : 'Not Supported'} />
      </DataSection>

      <DataSection title="Hardware">
        <InfoRow label="CPU Cores" value={data.hardwareConcurrency.value} />
        <InfoRow label="Device Memory" value={`${data.deviceMemory.value} GB`} />
        <InfoRow label="Platform" value={data.platform.value} />
        <InfoRow label="Architecture" value={data.architecture.value === 64 ? '64-bit' : data.architecture.value === 32 ? '32-bit' : 'Unknown'} />
      </DataSection>

      <DataSection title="Touch & Input">
        <InfoRow label="Max Touch Points" value={data.touchSupport.value.maxTouchPoints} />
        <InfoRow label="Touch Event" value={data.touchSupport.value.touchEvent ? 'Yes' : 'No'} />
        <InfoRow label="Touch Start" value={data.touchSupport.value.touchStart ? 'Yes' : 'No'} />
      </DataSection>

      <DataSection title="Storage">
        <InfoRow label="Local Storage" value={data.localStorage.value ? 'Available' : 'Blocked'} />
        <InfoRow label="Session Storage" value={data.sessionStorage.value ? 'Available' : 'Blocked'} />
        <InfoRow label="IndexedDB" value={data.indexedDB.value ? 'Available' : 'Blocked'} />
        <InfoRow label="Cookies" value={data.cookiesEnabled.value ? 'Enabled' : 'Disabled'} />
      </DataSection>

      <DataSection title="Browser Capabilities">
        <InfoRow label="PDF Viewer" value={data.pdfViewerEnabled.value ? 'Enabled' : 'Disabled'} />
        <InfoRow label="Reduced Motion" value={data.reducedMotion.value ? 'Preferred' : 'No Preference'} />
        <InfoRow label="Forced Colors" value={data.forcedColors.value ? 'Active' : 'Inactive'} />
        <InfoRow label="Vendor" value={data.vendor.value} />
      </DataSection>

      <DataSection title="Canvas Fingerprint">
        <InfoRow label="Geometry Hash" value={data.canvas.value.Geometry} monospace />
        <InfoRow label="Text Hash" value={data.canvas.value.Text} monospace />
        <InfoRow label="Winding" value={data.canvas.value.Winding ? 'True' : 'False'} />
      </DataSection>
    </div>
  );
}

// Velocity Tab
function VelocityTab({ data }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Velocity Tracking</h2>
      
      <DataSection title="Distinct IPs">
        <InfoRow label="Last 5 minutes" value={data.distinctIp.intervals['5m']} />
        <InfoRow label="Last hour" value={data.distinctIp.intervals['1h']} />
        <InfoRow label="Last 24 hours" value={data.distinctIp.intervals['24h']} />
      </DataSection>

      <DataSection title="Events">
        <InfoRow label="Last 5 minutes" value={data.events.intervals['5m']} />
        <InfoRow label="Last hour" value={data.events.intervals['1h']} />
        <InfoRow label="Last 24 hours" value={data.events.intervals['24h']} />
      </DataSection>

      <DataSection title="Distinct Countries">
        <InfoRow label="Last 5 minutes" value={data.distinctCountry.intervals['5m']} />
        <InfoRow label="Last hour" value={data.distinctCountry.intervals['1h']} />
        <InfoRow label="Last 24 hours" value={data.distinctCountry.intervals['24h']} />
      </DataSection>
    </div>
  );
}

// Raw JSON Tab
function RawJsonTab({ response }: { response: FingerprintResponse }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Raw JSON Response</h2>
      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[600px] text-xs">
        {JSON.stringify(response, null, 2)}
      </pre>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colorClasses = {
    purple: 'border-purple-500 bg-purple-900/20',
    green: 'border-green-500 bg-green-900/20',
    yellow: 'border-yellow-500 bg-yellow-900/20',
    red: 'border-red-500 bg-red-900/20',
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-white text-xl font-bold truncate">{value}</p>
    </div>
  );
}

function DetectionBadge({ label, detected }: { label: string; detected: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${detected ? 'bg-red-900/30 border border-red-500' : 'bg-green-900/30 border border-green-500'}`}>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className={`text-xs ${detected ? 'text-red-300' : 'text-green-300'}`}>
        {detected ? '⚠️ Detected' : '✓ Clear'}
      </p>
    </div>
  );
}

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, monospace, color }: { label: string; value: any; monospace?: boolean; color?: string }) {
  const colorClass = color === 'red' ? 'text-red-300' : color === 'yellow' ? 'text-yellow-300' : color === 'green' ? 'text-green-300' : 'text-purple-200';
  
  return (
    <div className="flex justify-between items-start py-1">
      <span className="text-gray-400">{label}:</span>
      <span className={`${monospace ? 'font-mono text-xs' : ''} ${colorClass} ml-2 text-right break-all max-w-[60%]`}>
        {String(value)}
      </span>
    </div>
  );
}
