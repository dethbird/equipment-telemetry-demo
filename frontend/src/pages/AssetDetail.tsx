import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAssetDetail } from '../api/client';
import TelemetryCard from '../components/TelemetryCard';
import WorkOrderList from '../components/WorkOrderList';
import type { AssetDetail as AssetDetailType } from '../types';

const section: React.CSSProperties = {
  marginBottom: '2rem',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '0.75rem',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '1.25rem',
};

const row: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  flexWrap: 'wrap',
};

const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const label: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const value: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.95rem',
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AssetDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAssetDetail(id)
      .then(setDetail)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!detail) return <p>Asset not found.</p>;

  const { asset, device, latestTelemetry, workOrders } = detail;

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/assets" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          ← All assets
        </Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>
          {asset.name}
        </h1>
      </div>

      <div style={section}>
        <div style={sectionTitle}>Asset Info</div>
        <div style={card}>
          <div style={row}>
            <div style={field}>
              <span style={label}>Type</span>
              <span style={value}>{asset.type}</span>
            </div>
            <div style={field}>
              <span style={label}>Device Serial</span>
              <span style={value}>
                {device ? <code>{device.serial_number}</code> : '—'}
              </span>
            </div>
            <div style={field}>
              <span style={label}>Asset ID</span>
              <span style={{ ...value, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {asset.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={section}>
        <div style={sectionTitle}>Latest Telemetry</div>
        <TelemetryCard telemetry={latestTelemetry} />
      </div>

      <div style={section}>
        <div style={sectionTitle}>
          Open Work Orders ({workOrders.length})
        </div>
        <WorkOrderList workOrders={workOrders} />
      </div>
    </>
  );
}
