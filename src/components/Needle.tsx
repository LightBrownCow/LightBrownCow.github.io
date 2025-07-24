import React from "react";

interface NeedleProps {
  /** Current measured frequency in Hz */
  measuredHz: number;
  /** Width of the SVG, accepts any CSS length (e.g. "30vw") */
  width?: string;
  /** How many cents away from pitch maps to maxAngle */
  maxCents?: number;
  /** Maximum needle rotation in degrees (both directions) */
  maxAngle?: number;
}

// Map MIDI note numbers to note names
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Given a frequency, find the nearest MIDI note number
const freqToMidi = (freq: number): number =>
  Math.round(12 * Math.log2(freq / 440) + 69);

// Convert a MIDI note number to its frequency (Hz)
const midiToFreq = (midi: number): number =>
  440 * Math.pow(2, (midi - 69) / 12);

// Convert a MIDI note number to its note name (e.g., "A4")
const midiToName = (midi: number): string => {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return name ? `${name}${octave}` : ``;
};

export const Needle: React.FC<NeedleProps> = ({
  measuredHz,
  width = "clamp(300px, 30vw, 450px)",
  maxCents = 50,
  maxAngle = 60,
}) => {
  // Determine nearest note
  const midi = freqToMidi(measuredHz);
  const targetHz = midiToFreq(midi);
  const targetNoteName = midiToName(midi);

  // Calculate difference in cents
  const cents = 1200 * Math.log2(measuredHz / targetHz);

  // Map cents to angle, clamped
  let angle = (cents / maxCents) * maxAngle;
  angle = Math.max(-maxAngle, Math.min(maxAngle, angle));

  // Internal SVG coordinate setup
  const viewWidth = 200;
  const radius = viewWidth / 2;
  const semiHeight = radius;
  const knobRadius = radius * 0.1;
  const totalHeight = semiHeight + knobRadius + 100;
  const cx = radius;
  const cy = semiHeight;

  // Needle dims
  const needleLength = radius * 0.5;
  const baseWidth = knobRadius;
  const tipRadius = 2;
  const pointerBody = needleLength - tipRadius;
  const baseY = cy + knobRadius * 0.5;
  const tipY = cy - knobRadius - pointerBody;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  };

  return (
    <div style={overlayStyle}>
      <div style={{ width, maxWidth: "100%" }}>
        <svg
          viewBox={`0 0 ${viewWidth} ${totalHeight}`}
          width={width}
          style={{ display: "block" }}
        >
          {/* semi‑circle arc */}
          <path
            d={`M 5,${cy} A ${radius - 2},${radius + 5} 0 0,1 ${viewWidth - 5},${cy}`}
            stroke="#FFF"
            strokeWidth={10}
            fill="none"
          />

          {/* rotating needle group */}
          <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
            {/* knob */}
            <circle
              cx={cx}
              cy={cy}
              r={knobRadius}
              fill="#fff"
              stroke="#333"
              strokeWidth={1}
            />
            {/* pointer with rounded tip */}
            <path
              d={
                `M ${cx - baseWidth / 2},${baseY} ` +
                `L ${cx - tipRadius},${tipY + tipRadius} ` +
                `A ${tipRadius},${tipRadius} 0 0,1 ${cx + tipRadius},${tipY + tipRadius} ` +
                `L ${cx + baseWidth / 2},${baseY} Z`
              }
              fill="#fff"
            />
          </g>

          {/* detected note label */}
          <text
            x={cx}
            y={totalHeight - 30}
            textAnchor="middle"
            fontSize={45}
            fontFamily="sans-serif"
            fontWeight="bold"
            fill="#FFF"
          >
            {targetNoteName}
          </text>
          {measuredHz > 0 && (
            <text
              x={cx}
              y={totalHeight}
              textAnchor="middle"
              fontSize={15}
              fontFamily="sans-serif"
              fontWeight="bold"
              fill="#FFF"
            >
              {measuredHz.toFixed(1) + " Hz"}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};
