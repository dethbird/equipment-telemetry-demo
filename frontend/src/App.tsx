import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.75rem 1.5rem',
  background: '#1e3a5f',
  color: '#fff',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1rem',
  color: '#fff',
  textDecoration: 'none',
};

const mainStyle: React.CSSProperties = {
  maxWidth: '960px',
  margin: '2rem auto',
  padding: '0 1rem',
};

export default function App() {
  return (
    <>
      <nav style={navStyle}>
        <Link to="/assets" style={titleStyle}>
          Equipment Telemetry
        </Link>
        <Link to="/assets" style={{ color: '#93c5fd', fontSize: '0.875rem' }}>
          Assets
        </Link>
      </nav>
      <main style={mainStyle}>
        <Routes>
          <Route path="/" element={<Navigate to="/assets" replace />} />
          <Route path="/assets" element={<AssetList />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
        </Routes>
      </main>
    </>
  );
}
