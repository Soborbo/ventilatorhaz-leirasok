import { useState, useEffect } from 'react';

interface ApiStatusData {
  gemini: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
  claude: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
}

interface StatusDotProps {
  status: 'connected' | 'error' | 'loading' | 'unconfigured';
  label: string;
  error?: string;
}

function StatusDot({ status, label, error }: StatusDotProps) {
  const colors = {
    connected: '#22c55e',     // green
    error: '#ef4444',         // red
    loading: '#f59e0b',       // yellow/orange
    unconfigured: '#6b7280',  // gray
  };

  const statusLabels = {
    connected: 'Aktív',
    error: 'Hiba',
    loading: 'Ellenőrzés...',
    unconfigured: 'Nincs beállítva',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: 'var(--color-bg-secondary)',
        fontSize: '0.75rem',
      }}
      title={error || statusLabels[status]}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors[status],
          boxShadow: status === 'connected' ? `0 0 6px ${colors[status]}` : 'none',
          animation: status === 'loading' ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>
        {statusLabels[status]}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function ApiStatus() {
  const [status, setStatus] = useState<ApiStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/status');
        const data: ApiStatusData = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to check API status:', error);
        setStatus({
          gemini: { configured: false, connected: false, error: 'Kapcsolat hiba' },
          claude: { configured: false, connected: false, error: 'Kapcsolat hiba' },
        });
      } finally {
        setLoading(false);
      }
    }

    checkStatus();

    // Check status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (api: { configured: boolean; connected: boolean; error?: string }): 'connected' | 'error' | 'loading' | 'unconfigured' => {
    if (loading) return 'loading';
    if (!api.configured) return 'unconfigured';
    if (api.connected) return 'connected';
    return 'error';
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <StatusDot
        status={loading ? 'loading' : getStatus(status?.gemini || { configured: false, connected: false })}
        label="Gemini"
        error={status?.gemini?.error}
      />
      <StatusDot
        status={loading ? 'loading' : getStatus(status?.claude || { configured: false, connected: false })}
        label="Claude"
        error={status?.claude?.error}
      />
    </div>
  );
}
