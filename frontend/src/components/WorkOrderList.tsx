import type { MaintenanceWorkOrder } from '../types';

interface Props {
  workOrders: MaintenanceWorkOrder[];
}

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  overflow: 'hidden',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 1rem',
  background: '#f9fafb',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  borderBottom: '1px solid #e5e7eb',
};

const td: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '0.875rem',
  verticalAlign: 'top',
};

const openBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '999px',
  background: '#fee2e2',
  color: '#b91c1c',
  fontSize: '0.7rem',
  fontWeight: 700,
};

export default function WorkOrderList({ workOrders }: Props) {
  if (!workOrders.length) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '1.25rem',
          color: '#9ca3af',
        }}
      >
        No open work orders.
      </div>
    );
  }

  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Status</th>
          <th style={th}>Reason</th>
          <th style={th}>Created</th>
        </tr>
      </thead>
      <tbody>
        {workOrders.map((wo) => (
          <tr key={wo.id}>
            <td style={td}>
              <span style={openBadge}>{wo.status}</span>
            </td>
            <td style={td}>{wo.reason}</td>
            <td style={{ ...td, whiteSpace: 'nowrap', color: '#9ca3af' }}>
              {new Date(wo.created_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
