import React, { useState, useEffect, useRef } from "react";
import { Needle } from "./Needle";

export interface SpectrumSettings {
  barCount: number;
  pillCount: number;
  fftSize?: number;
  smoothingTimeConstant?: number;
}

interface SpectrumVisualizerProps {
  settings: SpectrumSettings;
}

/**
 * Enhanced autocorrelation pitch detection (ACF2+) adapted from PitchDetector.
 * @param buf time-domain signal buffer
 * @param sampleRate sampling rate
 * @returns detected frequency in Hz or -1 if none
 */
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const size = buf.length;
  // Root-mean-square to ignore silence
  let rms = 0;
  for (let i = 0; i < size; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1;

  // Find indices where signal crosses threshold
  let r1 = 0;
  let r2 = size - 1;
  const threshold = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < threshold) {
      r2 = size - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  const len = trimmed.length;
  const c = new Float32Array(len);

  // Autocorrelation
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  // Find first decreasing point
  let d = 0;
  while (d < len - 1 && c[d] > c[d + 1]) {
    d++;
  }

  // Locate peak
  let maxPos = -1;
  let maxVal = -1;
  for (let i = d; i < len; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  if (maxPos < 1) return -1;

  // Parabolic interpolation for sub-sample accuracy
  const x1 = c[maxPos - 1];
  const x2 = c[maxPos];
  const x3 = c[maxPos + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const T0 = a !== 0 ? maxPos - b / (2 * a) : maxPos;

  return sampleRate / T0;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  settings,
}) => {
  const {
    barCount,
    pillCount,
    fftSize = 2048,
    smoothingTimeConstant = 0.8,
  } = settings;

  const [started, setStarted] = useState(false);
  const [levels, setLevels] = useState<boolean[][]>(
    Array.from({ length: barCount }, () => Array(pillCount).fill(false)),
  );
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number>(0);

  const startAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioCtx = window.AudioContext;
    const audioCtx = new AudioCtx();
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    timeDataRef.current = new Float32Array(analyser.fftSize);
    setStarted(true);
  };

  useEffect(() => {
    if (!started) return;
    const tick = () => {
      const analyser = analyserRef.current;
      const freqData = freqDataRef.current;
      const timeData = timeDataRef.current;
      if (!analyser || !freqData || !timeData) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Spectrum bars
      analyser.getByteFrequencyData(freqData);
      const matrix = Array.from({ length: barCount }, (_, i) => {
        const start = Math.floor((i * freqData.length) / barCount);
        const end = Math.floor(((i + 1) * freqData.length) / barCount);
        let sum = 0;
        for (let j = start; j < end; j++) sum += freqData[j];
        const avg = sum / (end - start);
        const count = Math.round((avg / 255) * pillCount);
        return Array.from({ length: pillCount }, (_, idx) => idx < count);
      });
      setLevels(matrix);

      // Pitch detection
      analyser.getFloatTimeDomainData(timeData);
      const sampleRate = audioCtxRef.current!.sampleRate;
      const freq = autoCorrelate(timeData, sampleRate);
      setDetectedFreq(freq > 0 ? freq : null);

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    };
  }, [started, barCount, pillCount, fftSize, smoothingTimeConstant]);

  // Styles
  const wrapperStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    background: "#182837",
    overflow: "hidden",
  };
  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 15,
    width: "calc(100% - 30px)",
    height: "calc(100% - 30px)",
    gap: "10px",
    position: "relative",
  };

  const barWidth = `${100 / barCount}%`;
  const pillHeight = `${100 / pillCount}%`;

  if (!started) {
    return (
      <div style={wrapperStyle}>
        <MicStartButton onStart={startAudio} />
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
        {levels.map((barLevels, i) => (
          <div
            key={i}
            style={{
              width: barWidth,
              display: "flex",
              flexDirection: "column-reverse",
              gap: "6px",
              height: "100%",
            }}
          >
            {barLevels.map((filled, j) => (
              <div
                key={j}
                style={{
                  width: "100%",
                  height: pillHeight,
                  borderRadius: "9999px",
                  backgroundColor: filled
                    ? `rgba(0,204,255,${(1 - j / pillCount) ** 3})`
                    : "transparent",
                  transition: "background-color 0.1s ease",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <Needle measuredHz={detectedFreq ?? 0} />
    </div>
  );
};

interface MicStartButtonProps {
  onStart: () => void;
}
export const MicStartButton: React.FC<MicStartButtonProps> = ({ onStart }) => (
  <button
    onClick={onStart}
    aria-label="Enable Microphone"
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      padding: "1rem 2rem",
      fontSize: "1rem",
      cursor: "pointer",
    }}
  >
    Enable Microphone
  </button>
);
