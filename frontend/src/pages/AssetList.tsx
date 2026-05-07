import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAssets, fetchWorkOrders } from '../api/client';
import type { Asset, WorkOrderRow } from '../types';

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

const woBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '999px',
  background: '#fee2e2',
  color: '#b91c1c',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginRight: '0.5rem',
};

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [woCounts, setWoCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAssets(), fetchWorkOrders()])
      .then(([a, wo]: [Asset[], WorkOrderRow[]]) => {
        setAssets(a);
        const counts: Record<string, number> = {};
        wo.filter((w) => w.status === 'open').forEach((w) => {
          counts[w.asset_id] = (counts[w.asset_id] ?? 0) + 1;
        });
        setWoCounts(counts);
      })
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {woCounts[asset.id] ? (
              <span style={woBadge}>{woCounts[asset.id]} open WO</span>
            ) : null}
            <span style={badge}>{asset.type}</span>
          </div>
        </div>
      ))}
    </>
  );
}
