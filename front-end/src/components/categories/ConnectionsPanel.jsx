import MetricCard from '../common/MetricCard';

function UsageBar({ pct, label }) {
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '.78rem', fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: '.82rem', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 5, transition: 'width .5s ease' }} />
      </div>
    </div>
  );
}

export default function ConnectionsPanel({ data }) {
  if (!data || data.error) return <p className="placeholder">{data?.error || 'No connection data available.'}</p>;

  const { active = 0, running = 0, max = 151, usage_pct = 0, aborted_connects = 0, pool_exhaustion_errors = 0 } = data;

  return (
    <div>
      {/* Connection usage bar */}
      <div style={{ padding: '20px 24px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', marginBottom: 20 }}>
        <UsageBar pct={usage_pct} label={`Connection Pool Usage (${active} / ${max})`} />
      </div>

      {/* Metric cards */}
      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Active Sessions" value={active} color="#6366f1" />
        <MetricCard label="Running Queries" value={running} color="#3b82f6" />
        <MetricCard label="Max Connections" value={max} color="#64748b" />
        <MetricCard label="Pool Usage" value={`${usage_pct}%`} color={usage_pct > 85 ? '#ef4444' : '#10b981'} />
        <MetricCard label="Aborted Connects" value={aborted_connects} color={aborted_connects > 100 ? '#f59e0b' : '#64748b'} />
        <MetricCard label="Pool Exhaustion Errors" value={pool_exhaustion_errors} color={pool_exhaustion_errors > 0 ? '#ef4444' : '#10b981'} />
      </div>

      {/* Status indicators */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: pool_exhaustion_errors > 0 ? '#fef2f2' : '#ecfdf5', borderRadius: 8, border: `1px solid ${pool_exhaustion_errors > 0 ? '#fecaca' : '#bbf7d0'}` }}>
          <div style={{ fontSize: '.75rem', fontWeight: 600, color: pool_exhaustion_errors > 0 ? '#ef4444' : '#10b981', textTransform: 'uppercase', letterSpacing: '.03em' }}>
            {pool_exhaustion_errors > 0 ? 'Pool Exhaustion Detected' : 'Pool Healthy'}
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 4 }}>
            {pool_exhaustion_errors > 0
              ? `${pool_exhaustion_errors} connection(s) rejected due to max_connections limit`
              : 'No connections have been rejected due to pool limits'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: aborted_connects > 50 ? '#fffbeb' : '#f8fafc', borderRadius: 8, border: `1px solid ${aborted_connects > 50 ? '#fde68a' : '#f1f5f9'}` }}>
          <div style={{ fontSize: '.75rem', fontWeight: 600, color: aborted_connects > 50 ? '#f59e0b' : '#64748b', textTransform: 'uppercase', letterSpacing: '.03em' }}>
            Failed Connections
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 4 }}>
            {aborted_connects} aborted connection attempt(s) since server start
          </div>
        </div>
      </div>
    </div>
  );
}
