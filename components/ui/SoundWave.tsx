
// Self-contained sound wave animation matching audio equalizer bars in black and white
const __SOUNDWAVE_STYLES = `
@keyframes AstraMindsSoundWaveBar {
  0%, 100% {
    transform: scaleY(0.25);
  }
  50% {
    transform: scaleY(1);
  }
}
.AstraMinds-soundwave-bar {
  transform-origin: center;
  border-radius: 9999px;
  display: block;
}
.AstraMinds-sw-1 { animation: AstraMindsSoundWaveBar 0.85s ease-in-out infinite alternate; animation-delay: 0ms; }
.AstraMinds-sw-2 { animation: AstraMindsSoundWaveBar 0.7s ease-in-out infinite alternate; animation-delay: 250ms; }
.AstraMinds-sw-3 { animation: AstraMindsSoundWaveBar 0.95s ease-in-out infinite alternate; animation-delay: 450ms; }
.AstraMinds-sw-4 { animation: AstraMindsSoundWaveBar 0.75s ease-in-out infinite alternate; animation-delay: 150ms; }
`;

if (typeof document !== 'undefined' && !document.getElementById('AstraMinds-soundwave-style')) {
  const style = document.createElement('style');
  style.id = 'AstraMinds-soundwave-style';
  style.textContent = __SOUNDWAVE_STYLES;
  document.head.appendChild(style);
}

export interface SoundWaveProps {
  color?: string;
  barWidth?: number;
  height?: number;
  className?: string;
}

export function SoundWave({
  color = "#ffffff",
  barWidth = 2.5,
  height = 14,
  className = ""
}: SoundWaveProps) {
  return (
    <div
      className={`inline-flex items-center justify-center gap-[2.5px] ${className}`}
      style={{ height: `${height}px` }}
      aria-label="Listening audio wave"
    >
      <span
        className="AstraMinds-soundwave-bar AstraMinds-sw-1"
        style={{
          width: `${barWidth}px`,
          height: `${height}px`,
          backgroundColor: color,
        }}
      />
      <span
        className="AstraMinds-soundwave-bar AstraMinds-sw-2"
        style={{
          width: `${barWidth}px`,
          height: `${height}px`,
          backgroundColor: color,
        }}
      />
      <span
        className="AstraMinds-soundwave-bar AstraMinds-sw-3"
        style={{
          width: `${barWidth}px`,
          height: `${height}px`,
          backgroundColor: color,
        }}
      />
      <span
        className="AstraMinds-soundwave-bar AstraMinds-sw-4"
        style={{
          width: `${barWidth}px`,
          height: `${height}px`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export default SoundWave;

