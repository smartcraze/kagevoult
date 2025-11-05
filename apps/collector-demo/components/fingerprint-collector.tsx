'use client';

import {
  calculateConfidenceScore,
  collectCompleteFingerprint,
  generateCombinedHash,
} from "core";
import { useState, useEffect, useCallback } from 'react';

interface FingerprintData {
  basic?: any;
  canvas?: any;
  webgl?: any;
  audio?: any;
  fonts?: any;
  combined?: {
    hash: string;
    confidence: number;
  };
  timing?: {
    totalTime: number;
  };
  error?: string;
}

export default function FingerprintCollector() {
  const [fingerprint, setFingerprint] = useState<FingerprintData>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const collectFingerprint = useCallback(async () => {
    setLoading(true);
    setFingerprint({});
    
    try {
      const startTime = performance.now();
      
      const fp = await collectCompleteFingerprint({
        timeout: 10000,
      });

      const hash = await generateCombinedHash(fp);
      const confidence = calculateConfidenceScore(fp);
      const endTime = performance.now();

      setFingerprint({
        basic: fp.basic,
        canvas: fp.canvas,
        webgl: fp.webgl,
        audio: fp.audio,
        fonts: fp.fonts,
        combined: {
          hash,
          confidence,
        },
        timing: {
          totalTime: Math.round(endTime - startTime),
        },
      });
    } catch (error) {
      setFingerprint({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-collect on mount
    collectFingerprint();
  }, [collectFingerprint]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          🔐 Kagevoult Fingerprint Demo
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Complete Device Fingerprinting System
        </p>
        <button
          onClick={collectFingerprint}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? '🔄 Collecting...' : '🚀 Collect Fingerprint'}
        </button>
      </div>

      {/* Results Summary */}
      {fingerprint.combined && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-2">Fingerprint ID</div>
            <div className="text-white font-mono text-sm break-all">
              {fingerprint.combined.hash.substring(0, 16)}...
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-2">Confidence Score</div>
            <div className="text-3xl font-bold text-white">
              {fingerprint.combined.confidence}%
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-gray-400 text-sm mb-2">Collection Time</div>
            <div className="text-3xl font-bold text-white">
              {fingerprint.timing?.totalTime}ms
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {fingerprint.error && (
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 mb-8">
          <div className="text-red-300 font-semibold mb-2">❌ Error</div>
          <div className="text-red-200">{fingerprint.error}</div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <div className="text-white text-xl">Collecting fingerprint data...</div>
          <div className="text-gray-400 mt-2">This may take a few seconds</div>
        </div>
      )}

      {/* Tabs */}
      {fingerprint.basic && !loading && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {['overview', 'basic', 'canvas', 'webgl', 'audio', 'fonts', 'raw'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            {activeTab === 'overview' && <OverviewTab fingerprint={fingerprint} />}
            {activeTab === 'basic' && <BasicTab data={fingerprint.basic} />}
            {activeTab === 'canvas' && <CanvasTab data={fingerprint.canvas} />}
            {activeTab === 'webgl' && <WebGLTab data={fingerprint.webgl} />}
            {activeTab === 'audio' && <AudioTab data={fingerprint.audio} />}
            {activeTab === 'fonts' && <FontsTab data={fingerprint.fonts} />}
            {activeTab === 'raw' && <RawTab fingerprint={fingerprint} />}
          </div>
        </>
      )}
    </div>
  );
}

function OverviewTab({ fingerprint }: { fingerprint: FingerprintData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">📊 Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Browser" value={fingerprint.basic?.client?.browserName} icon="🌐" />
        <InfoCard title="Platform" value={fingerprint.basic?.client?.platform} icon="💻" />
        <InfoCard title="Language" value={fingerprint.basic?.client?.language} icon="🗣️" />
        <InfoCard title="Timezone" value={fingerprint.basic?.client?.timezone} icon="🌍" />
        <InfoCard 
          title="Screen Resolution" 
          value={`${fingerprint.basic?.screen?.width}x${fingerprint.basic?.screen?.height}`} 
          icon="📺" 
        />
        <InfoCard 
          title="Hardware Cores" 
          value={fingerprint.basic?.hardware?.hardwareConcurrency} 
          icon="⚙️" 
        />
        <InfoCard title="GPU Vendor" value={fingerprint.webgl?.vendor} icon="🎮" />
        <InfoCard title="Fonts Detected" value={fingerprint.fonts?.fontCount} icon="🔤" />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-4">🔐 Fingerprint Hashes</h3>
        <div className="space-y-2">
          <HashDisplay label="Canvas" hash={fingerprint.canvas?.hash} />
          <HashDisplay label="WebGL" hash={fingerprint.webgl?.hash} />
          <HashDisplay label="Audio" hash={fingerprint.audio?.hash} />
          <HashDisplay label="Fonts" hash={fingerprint.fonts?.hash} />
          <HashDisplay label="Combined" hash={fingerprint.combined?.hash} highlighted />
        </div>
      </div>
    </div>
  );
}

function BasicTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">🔧 Basic Signals</h2>
      
      <Section title="Client Info">
        <DataRow label="User Agent" value={data?.client?.userAgent} />
        <DataRow label="Browser" value={data?.client?.browserName} />
        <DataRow label="Platform" value={data?.client?.platform} />
        <DataRow label="Language" value={data?.client?.language} />
        <DataRow label="Languages" value={data?.client?.languages?.join(', ')} />
        <DataRow label="Timezone" value={data?.client?.timezone} />
        <DataRow label="Timezone Offset" value={data?.client?.timezoneOffset} />
      </Section>

      <Section title="Screen Info">
        <DataRow label="Width x Height" value={`${data?.screen?.width} x ${data?.screen?.height}`} />
        <DataRow label="Available" value={`${data?.screen?.availWidth} x ${data?.screen?.availHeight}`} />
        <DataRow label="Color Depth" value={data?.screen?.colorDepth} />
        <DataRow label="Pixel Depth" value={data?.screen?.pixelDepth} />
        <DataRow label="Device Pixel Ratio" value={data?.screen?.devicePixelRatio} />
      </Section>

      <Section title="Hardware Info">
        <DataRow label="Hardware Concurrency" value={data?.hardware?.hardwareConcurrency} />
        <DataRow label="Max Touch Points" value={data?.hardware?.maxTouchPoints} />
        <DataRow label="Device Memory" value={data?.hardware?.deviceMemory ? `${data.hardware.deviceMemory} GB` : 'N/A'} />
      </Section>

      <Section title="Browser Capabilities">
        <DataRow label="Cookies Enabled" value={data?.capabilities?.cookieEnabled ? '✅' : '❌'} />
        <DataRow label="LocalStorage" value={data?.capabilities?.localStorageEnabled ? '✅' : '❌'} />
        <DataRow label="SessionStorage" value={data?.capabilities?.sessionStorageEnabled ? '✅' : '❌'} />
        <DataRow label="IndexedDB" value={data?.capabilities?.indexedDBEnabled ? '✅' : '❌'} />
        <DataRow label="Do Not Track" value={data?.capabilities?.doNotTrackEnabled ? '✅' : '❌'} />
      </Section>
    </div>
  );
}

function CanvasTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">🎨 Canvas Fingerprint</h2>
      <Section title="Canvas Data">
        <DataRow label="Hash" value={data?.hash} mono />
        <DataRow label="Width" value={data?.width} />
        <DataRow label="Height" value={data?.height} />
        <DataRow label="Test Text" value={data?.text} />
        <DataRow label="Data URL Preview" value={data?.dataUrl} mono />
      </Section>
    </div>
  );
}

function WebGLTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">🎮 WebGL Fingerprint</h2>
      <Section title="WebGL Info">
        <DataRow label="Hash" value={data?.hash} mono />
        <DataRow label="Vendor" value={data?.vendor} />
        <DataRow label="Renderer" value={data?.renderer} />
        <DataRow label="Version" value={data?.version} />
        <DataRow label="Shading Language" value={data?.shadingLanguageVersion} />
        <DataRow label="Unmasked Vendor" value={data?.unmaskedVendor} />
        <DataRow label="Unmasked Renderer" value={data?.unmaskedRenderer} />
      </Section>

      <Section title="WebGL Parameters">
        <DataRow label="Max Texture Size" value={data?.parameters?.maxTextureSize} />
        <DataRow label="Max Vertex Attribs" value={data?.parameters?.maxVertexAttribs} />
        <DataRow label="Max Texture Units" value={data?.parameters?.maxTextureImageUnits} />
        <DataRow label="Max Renderbuffer Size" value={data?.parameters?.maxRenderbufferSize} />
        <DataRow label="Max Anisotropy" value={data?.parameters?.maxAnisotropy} />
      </Section>

      <Section title="Extensions">
        <div className="text-gray-300 text-sm">
          {data?.extensions?.length || 0} extensions detected
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto">
          {data?.extensions?.map((ext: string, i: number) => (
            <div key={i} className="text-gray-400 text-xs font-mono bg-white/5 px-2 py-1 rounded">
              {ext}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AudioTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">🔊 Audio Fingerprint</h2>
      <Section title="Audio Context">
        <DataRow label="Hash" value={data?.hash} mono />
        <DataRow label="Sample Rate" value={`${data?.sampleRate} Hz`} />
        <DataRow label="Max Channel Count" value={data?.maxChannelCount} />
        <DataRow label="Channel Count" value={data?.channelCount} />
        <DataRow label="Channel Count Mode" value={data?.channelCountMode} />
        <DataRow label="Channel Interpretation" value={data?.channelInterpretation} />
        <DataRow label="State" value={data?.state} />
        <DataRow label="Base Latency" value={data?.baseLatency ? `${data.baseLatency}s` : 'N/A'} />
        <DataRow label="Output Latency" value={data?.outputLatency ? `${data.outputLatency}s` : 'N/A'} />
      </Section>
    </div>
  );
}

function FontsTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">🔤 Font Detection</h2>
      <Section title="Font Info">
        <DataRow label="Hash" value={data?.hash} mono />
        <DataRow label="Fonts Detected" value={data?.fontCount} />
      </Section>

      <Section title="Installed Fonts">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-96 overflow-y-auto">
          {data?.installedFonts?.map((font: string, i: number) => (
            <div key={i} className="text-gray-300 text-sm bg-white/5 px-3 py-2 rounded">
              {font}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function RawTab({ fingerprint }: { fingerprint: FingerprintData }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">📄 Raw Data</h2>
      <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 max-h-[600px] overflow-y-auto">
        {JSON.stringify(fingerprint, null, 2)}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(fingerprint, null, 2));
          alert('Copied to clipboard!');
        }}
        className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
      >
        📋 Copy to Clipboard
      </button>
    </div>
  );
}

function InfoCard({ title, value, icon }: { title: string; value: any; icon: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="text-gray-400 text-sm mb-1">{icon} {title}</div>
      <div className="text-white font-semibold text-lg">{value || 'N/A'}</div>
    </div>
  );
}

function HashDisplay({ label, hash, highlighted }: { label: string; hash?: string; highlighted?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${highlighted ? 'bg-purple-500/20 border border-purple-500' : 'bg-white/5'}`}>
      <span className="text-gray-300 font-semibold">{label}:</span>
      <span className="text-gray-400 font-mono text-xs">{hash ? `${hash.substring(0, 20)}...` : 'N/A'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-400 text-sm">{label}:</span>
      <span className={`text-gray-200 text-sm text-right ${mono ? 'font-mono break-all' : ''} max-w-md`}>
        {value !== undefined && value !== null ? String(value) : 'N/A'}
      </span>
    </div>
  );
}
