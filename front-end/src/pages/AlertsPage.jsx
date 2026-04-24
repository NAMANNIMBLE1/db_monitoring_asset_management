import { useState, useCallback } from 'react';
import { fetchAlerts, resolveAlert } from '../api/client';
import usePolling from '../hooks/usePolling';
import { formatTs } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AlertsPage() {
  const [showResolved, setShowResolved] = useState(false);

  const fetcher = useCallback(
    () => fetchAlerts({ resolved: showResolved ? undefined : false, limit: 200 }),
    [showResolved]
  );
  const { data: alerts, loading, error, refresh } = usePolling(fetcher, 30000, [showResolved]);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      refresh();
    } catch (err) {
      alert('Failed to resolve: ' + err.message);
    }
  };

  if (loading && !alerts) return <LoadingSpinner />;
  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div>
      <div className="page-header">
        <h2>DB Monitoring Alerts</h2>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Show resolved
        </label>
      </div>

      {(!alerts || alerts.length === 0) ? (
        <p className="placeholder">No alerts to show.</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Instance</th>
                <th>IP</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Message</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className={a.severity === 'critical' ? 'row--critical' : ''}>
                  <td>{formatTs(a.created_at)}</td>
                  <td>{a.instance_name || <span className="muted">host</span>}</td>
                  <td>{a.ip_address}</td>
                  <td><code>{a.alert_type}</code></td>
                  <td>
                    <span className={`severity severity--${a.severity}`}>{a.severity}</span>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.message}
                  </td>
                  <td>{a.is_resolved ? 'Resolved' : 'Open'}</td>
                  <td>
                    {!a.is_resolved && (
                      <button className="btn btn--small" onClick={() => handleResolve(a.id)}>
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
