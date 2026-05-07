import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAssets } from '../api/client';
import type { Asset } from '../types';

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '1.25rem',
  marginBottom: '0.75rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '999px',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'capitalize',
};

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets()
      .then(setAssets)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading assets…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!assets.length) return <p>No assets found.</p>;

  return (
    <>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
        Assets ({assets.length})
      </h1>
      {assets.map((asset) => (
        <div key={asset.id} style={card}>
          <div>
            <Link
              to={`/assets/${asset.id}`}
              style={{ fontWeight: 600, fontSize: '0.95rem' }}
            >
              {asset.name}
            </Link>
            <div style={{ marginTop: '0.25rem', color: '#6b7280', fontSize: '0.8rem' }}>
              Device:{' '}
              {asset.device ? (
                <code>{asset.device.serial_number}</code>
              ) : (
                <em>no device</em>
              )}
            </div>
          </div>
          <span style={badge}>{asset.type}</span>
        </div>
      ))}
    </>
  );
}
