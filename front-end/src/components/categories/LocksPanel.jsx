import MetricCard from '../common/MetricCard';

export default function LocksPanel({ data }) {
  if (!data || data.error) return <p className="placeholder">{data?.error || 'No lock data available.'}</p>;

  const { active_locks = 0, deadlocks_since_start = 0, row_lock_current_waits = 0, row_lock_avg_wait_ms = 0, blocked_chains = [], waiting_locks = 0 } = data;

  const severity = deadlocks_since_start > 10 || active_locks > 50 ? 'critical' :
    deadlocks_since_start > 0 || row_lock_current_waits > 5 ? 'warning' : 'healthy';

  const severityConfig = {
    critical: { bg: '#fef2f2', border: '#fecaca', color: '#ef4444', label: 'High Contention', icon: '🔴' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#f59e0b', label: 'Moderate Activity', icon: '🟡' },
    healthy: { bg: '#ecfdf5', border: '#bbf7d0', color: '#10b981', label: 'No Issues', icon: '🟢' },
  };
  const sev = severityConfig[severity];

  return (
    <div>
      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        background: sev.bg, borderRadius: 10, border: `1px solid ${sev.border}`, marginBottom: 20,
      }}>
        <span style={{ fontSize: '1.5rem' }}>{sev.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: sev.color }}>{sev.label}</div>
          <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 2 }}>
            {severity === 'critical' ? 'Multiple deadlocks or high active lock count detected'
              : severity === 'warning' ? 'Some lock activity detected — monitor closely'
              : 'No significant lock contention'}
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Active Locks" value={active_locks} color={active_locks > 50 ? '#ef4444' : '#6366f1'} />
        <MetricCard label="Deadlocks (since start)" value={deadlocks_since_start} color={deadlocks_since_start > 0 ? '#ef4444' : '#10b981'} />
        <MetricCard label="Row Lock Waits" value={row_lock_current_waits} color={row_lock_current_waits > 5 ? '#f59e0b' : '#64748b'} />
        <MetricCard label="Avg Lock Wait" value={`${row_lock_avg_wait_ms}ms`} color={row_lock_avg_wait_ms > 1000 ? '#ef4444' : '#64748b'} />
        {waiting_locks > 0 && <MetricCard label="Waiting Locks" value={waiting_locks} color="#f59e0b" />}
      </div>

      {/* Blocking chains (MSSQL/Oracle) */}
      {blocked_chains && blocked_chains.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: 12 }}>Blocking Chains</h4>
          <div className="table-wrapper">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Blocker SID</th>
                  <th>Blocked SID</th>
                  <th>Wait Type</th>
                  <th>Wait Time</th>
                </tr>
              </thead>
              <tbody>
                {blocked_chains.map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{b.blocker || b.blocking_session_id || '--'}</td>
                    <td>{b.blocked || b.session_id || '--'}</td>
                    <td><code>{b.wait_type || '--'}</code></td>
                    <td>{b.wait_time || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
