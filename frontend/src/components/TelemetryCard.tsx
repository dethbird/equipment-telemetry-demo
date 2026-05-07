import type { TelemetryReading } from '../types';

interface Props {
  telemetry: TelemetryReading | null;
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '1.25rem',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '1rem',
};

const metricBox: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  padding: '0.75rem',
};

const metricLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '4px',
};

const metricValue: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#111827',
};

const metricUnit: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginLeft: '2px',
};

export default function TelemetryCard({ telemetry }: Props) {
  if (!telemetry) {
    return (
      <div style={card}>
        <p style={{ color: '#9ca3af' }}>No telemetry recorded yet.</p>
      </div>
    );
  }

  const ts = new Date(telemetry.timestamp).toLocaleString();

  return (
    <div style={card}>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
        Recorded: {ts}
      </div>
      <div style={grid}>
        <div style={metricBox}>
          <div style={metricLabel}>Engine Hours</div>
          <div style={metricValue}>
            {Number(telemetry.hours).toFixed(1)}
            <span style={metricUnit}>hrs</span>
          </div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>Mileage</div>
          <div style={metricValue}>
            {Number(telemetry.mileage).toLocaleString()}
            <span style={metricUnit}>mi</span>
          </div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>Engine Temp</div>
          <div
            style={{
              ...metricValue,
              color: Number(telemetry.engine_temp) > 210 ? '#dc2626' : '#111827',
            }}
          >
            {Number(telemetry.engine_temp).toFixed(1)}
            <span style={metricUnit}>°F</span>
          </div>
        </div>
      </div>
    </div>
  );
}
