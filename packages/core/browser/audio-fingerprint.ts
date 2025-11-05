/**
 * Audio Context Fingerprinting
 * 
 * Generates a unique fingerprint based on how the device's audio hardware
 * processes sound through the Web Audio API.
 * 
 * Different audio cards, drivers, and processors produce slightly different
 * outputs when processing the same audio signal. This creates a stable
 * identifier that's difficult to spoof.
 * 
 * The technique:
 * 1. Create an audio oscillator
 * 2. Process it through various audio nodes
 * 3. Capture the output using an analyzer
 * 4. Hash the frequency/time domain data
 */

export interface AudioFingerprint {
  hash: string;
  sampleRate: number;
  maxChannelCount: number;
  channelCount: number;
  channelCountMode: string;
  channelInterpretation: string;
  state: string;
  baseLatency?: number;
  outputLatency?: number;
}

/**
 * Check if Web Audio API is supported
 */
export function isAudioFingerprintingSupported(): boolean {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    return !!AudioContext;
  } catch {
    return false;
  }
}

/**
 * Create an audio context with error handling
 */
function createAudioContext(): AudioContext | null {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    return new AudioContext();
  } catch {
    return null;
  }
}

/**
 * Generate audio signal and capture its fingerprint
 */
async function generateAudioSignal(audioContext: AudioContext): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    try {
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;

      // Create compressor for additional processing
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      // Create analyzer to capture output
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      // Connect nodes: oscillator -> compressor -> analyser -> destination
      oscillator.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(audioContext.destination);

      // Start oscillator
      oscillator.start(0);

      // Wait a bit for processing
      setTimeout(() => {
        try {
          // Capture frequency data
          const frequencyData = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(frequencyData);

          // Stop oscillator
          oscillator.stop();
          oscillator.disconnect();
          compressor.disconnect();
          analyser.disconnect();

          resolve(frequencyData);
        } catch (error) {
          reject(error);
        }
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Alternative signal generation using time domain data
 */
async function generateAudioSignalTimeDomain(audioContext: AudioContext): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      // Create oscillator with different settings
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 1000;

      // Create gain node for amplitude control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.5;

      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;

      // Connect: oscillator -> gain -> analyser -> destination
      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);

      oscillator.start(0);

      setTimeout(() => {
        try {
          // Capture time domain data
          const timeData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteTimeDomainData(timeData);

          oscillator.stop();
          oscillator.disconnect();
          gainNode.disconnect();
          analyser.disconnect();

          resolve(timeData);
        } catch (error) {
          reject(error);
        }
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Hash audio data using SHA-256
 */
async function hashAudioData(data: Float32Array | Uint8Array): Promise<string> {
  // Convert array to string for hashing
  const dataString = Array.from(data).join(',');
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return simpleHash(dataString);
    }
  }
  
  return simpleHash(dataString);
}

/**
 * Fallback simple hash
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
 * Generate complete audio fingerprint
 */
export async function generateAudioFingerprint(): Promise<AudioFingerprint> {
  const audioContext = createAudioContext();
  
  if (!audioContext) {
    throw new Error('Web Audio API not supported');
  }

  try {
    // Generate audio signal and capture data
    const frequencyData = await generateAudioSignal(audioContext);
    
    // Also get time domain data for more entropy
    const timeData = await generateAudioSignalTimeDomain(audioContext);
    
    // Combine both datasets for hashing
    const combinedData = new Float32Array(frequencyData.length + timeData.length);
    combinedData.set(frequencyData, 0);
    combinedData.set(Array.from(timeData), frequencyData.length);
    
    const hash = await hashAudioData(combinedData);

    const fingerprint: AudioFingerprint = {
      hash,
      sampleRate: audioContext.sampleRate,
      maxChannelCount: audioContext.destination.maxChannelCount,
      channelCount: audioContext.destination.channelCount,
      channelCountMode: audioContext.destination.channelCountMode,
      channelInterpretation: audioContext.destination.channelInterpretation,
      state: audioContext.state,
    };

    // Add latency info if available (newer browsers)
    if ('baseLatency' in audioContext) {
      fingerprint.baseLatency = (audioContext as any).baseLatency;
    }
    if ('outputLatency' in audioContext) {
      fingerprint.outputLatency = (audioContext as any).outputLatency;
    }

    // Close context to free resources
    await audioContext.close();

    return fingerprint;
  } catch (error) {
    // Make sure to close context even on error
    try {
      await audioContext.close();
    } catch {
      // Ignore close errors
    }
    throw new Error(`Audio fingerprint generation failed: ${error}`);
  }
}

/**
 * Get lightweight audio hash only (no details)
 */
export async function getAudioHash(): Promise<string> {
  try {
    const fingerprint = await generateAudioFingerprint();
    return fingerprint.hash;
  } catch {
    return 'audio-not-supported';
  }
}

/**
 * Detect if audio fingerprinting is being blocked
 * Some privacy tools add noise to audio output
 */
export async function detectAudioSpoofing(): Promise<boolean> {
  try {
    // Generate fingerprint twice
    const fp1 = await getAudioHash();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const fp2 = await getAudioHash();
    
    // If hashes differ, audio is being randomized
    return fp1 !== fp2;
  } catch {
    return true; // Assume spoofed if error
  }
}

/**
 * Get audio context capabilities without generating full fingerprint
 * Useful for quick checks
 */
export interface AudioCapabilities {
  isSupported: boolean;
  sampleRate?: number;
  maxChannelCount?: number;
  baseLatency?: number;
  outputLatency?: number;
  state?: string;
}

export function getAudioCapabilities(): AudioCapabilities {
  const audioContext = createAudioContext();
  
  if (!audioContext) {
    return {
      isSupported: false,
    };
  }

  const capabilities: AudioCapabilities = {
    isSupported: true,
    sampleRate: audioContext.sampleRate,
    maxChannelCount: audioContext.destination.maxChannelCount,
    state: audioContext.state,
  };

  // Add latency if available
  if ('baseLatency' in audioContext) {
    capabilities.baseLatency = (audioContext as any).baseLatency;
  }
  if ('outputLatency' in audioContext) {
    capabilities.outputLatency = (audioContext as any).outputLatency;
  }

  // Close context
  audioContext.close().catch(() => {
    // Ignore close errors
  });

  return capabilities;
}

/**
 * Quick audio check - faster but less accurate
 * Only captures frequency data, not time domain
 */
export async function quickAudioFingerprint(): Promise<string> {
  const audioContext = createAudioContext();
  
  if (!audioContext) {
    return 'audio-not-supported';
  }

  try {
    const frequencyData = await generateAudioSignal(audioContext);
    const hash = await hashAudioData(frequencyData);
    await audioContext.close();
    return hash;
  } catch (error) {
    try {
      await audioContext.close();
    } catch {
      // Ignore
    }
    return 'audio-error';
  }
}
