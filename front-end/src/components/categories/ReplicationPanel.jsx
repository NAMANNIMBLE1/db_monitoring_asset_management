import MetricCard from '../common/MetricCard';

const ROLE_CONFIG = {
  standalone: { label: 'Standalone', color: '#6366f1', bg: '#eef2ff', icon: '🔹', desc: 'No replication configured' },
  master: { label: 'Primary / Master', color: '#10b981', bg: '#ecfdf5', icon: '👑', desc: 'Accepting writes, serving replicas' },
  replica: { label: 'Replica / Slave', color: '#f59e0b', bg: '#fffbeb', icon: '📋', desc: 'Replicating from primary' },
  cluster: { label: 'Cluster Node', color: '#3b82f6', bg: '#eff6ff', icon: '🔗', desc: 'Part of a cluster' },
  unknown: { label: 'Unknown', color: '#94a3b8', bg: '#f8fafc', icon: '❓', desc: '' },
};

function StatusDot({ ok }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600,
      background: ok ? '#ecfdf5' : '#fef2f2',
      color: ok ? '#10b981' : '#ef4444',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
      {ok ? 'Running' : 'Stopped'}
    </span>
  );
}

export default function ReplicationPanel({ data }) {
  if (!data) return <p className="placeholder">No replication data available.</p>;
  if (data.error) return <p className="placeholder" style={{ color: '#ef4444' }}>{data.error}</p>;

  const role = data.role || 'unknown';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.unknown;

  return (
    <div>
      {/* Role banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px',
        background: config.bg, borderRadius: 10, marginBottom: 20,
        border: `1px solid ${config.color}22`,
      }}>
        <span style={{ fontSize: '2rem' }}>{config.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: config.color }}>{config.label}</div>
          <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 2 }}>{config.desc}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Role" value={role} color={config.color} />
        <MetricCard
          label="Replication Lag"
          value={data.lag_seconds != null ? `${data.lag_seconds}s` : 'N/A'}
          color={data.lag_seconds > 60 ? '#ef4444' : data.lag_seconds > 10 ? '#f59e0b' : '#10b981'}
        />
        <MetricCard label="Connected Replicas" value={data.slaves_connected ?? 'N/A'} />
      </div>

      {/* Replica-specific: IO and SQL thread status */}
      {role === 'replica' && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: 20, marginBottom: 20,
        }}>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: 14 }}>Replication Threads</h4>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '.82rem', color: '#64748b', fontWeight: 500, minWidth: 80 }}>IO Thread:</span>
              <StatusDot ok={data.io_running === 'Yes'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '.82rem', color: '#64748b', fontWeight: 500, minWidth: 80 }}>SQL Thread:</span>
              <StatusDot ok={data.sql_running === 'Yes'} />
            </div>
          </div>
          {data.master_host && (
            <div style={{ marginTop: 14, fontSize: '.82rem', color: '#64748b' }}>
              Replicating from: <strong style={{ color: '#1e293b' }}>{data.master_host}</strong>
            </div>
          )}
          {data.last_error && (
            <div style={{
              marginTop: 14, padding: '10px 14px', background: '#fef2f2',
              borderRadius: 8, fontSize: '.8rem', color: '#ef4444',
              border: '1px solid #fecaca',
            }}>
              Last Error: {data.last_error}
            </div>
          )}
        </div>
      )}

      {/* Master-specific: connected replicas */}
      {(role === 'master' && data.replicas && data.replicas.length > 0) && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: 20, marginBottom: 20,
        }}>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: 14 }}>Connected Replicas</h4>
          <div className="table-wrapper">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Lag (s)</th>
                </tr>
              </thead>
              <tbody>
                {data.replicas.map((r, i) => (
                  <tr key={i}>
                    <td>{r.addr || r.name || '--'}</td>
                    <td style={{ color: (r.lag_seconds || r.replay_lag_s || 0) > 10 ? '#ef4444' : '#10b981' }}>
                      {r.lag_seconds ?? r.replay_lag_s ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cluster-specific: node list */}
      {(role === 'cluster' && (data.up_nodes || data.members)) && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: 20,
        }}>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: 14 }}>Cluster Nodes</h4>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <MetricCard label="Nodes Up" value={data.nodes_up ?? (data.up_nodes || []).length} color="#10b981" />
            <MetricCard label="Nodes Down" value={data.nodes_down ?? (data.down_nodes || []).length} color={data.nodes_down > 0 ? '#ef4444' : '#10b981'} />
            <MetricCard label="Total" value={data.nodes_total ?? '--'} />
          </div>
          {(data.members || data.up_nodes || []).length > 0 && (
            <div className="table-wrapper">
              <table className="table table--compact">
                <thead><tr><th>Node</th><th>State</th><th>Info</th></tr></thead>
                <tbody>
                  {(data.members || data.up_nodes || []).map((n, i) => (
                    <tr key={i}>
                      <td>{n.name || n.address || '--'}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: '.7rem', fontWeight: 600,
                          background: (n.state === 'PRIMARY' || n.health === 1) ? '#ecfdf5' : '#fffbeb',
                          color: (n.state === 'PRIMARY' || n.health === 1) ? '#10b981' : '#f59e0b',
                        }}>
                          {n.state || n.stateStr || 'UP'}
                        </span>
                      </td>
                      <td style={{ fontSize: '.78rem', color: '#64748b' }}>{n.datacenter || n.rack || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Standalone message */}
      {role === 'standalone' && (
        <div style={{
          textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '.85rem',
          background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9',
        }}>
          This database instance has no replication configured. Set up master-slave or cluster replication to see detailed metrics here.
        </div>
      )}
    </div>
  );
}
