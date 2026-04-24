import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInstanceHistory, exportCsv } from '../api/client';
import usePolling from '../hooks/usePolling';
import { CATEGORIES, TIME_RANGES } from '../utils/constants';
import { formatTs, healthColor, DB_TYPE_ICONS, formatPct, formatMB } from '../utils/formatters';
import CategoryPanel from '../components/categories/CategoryPanel';
import MetricCard from '../components/common/MetricCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function InstanceDetail() {
  const { ip, instanceName } = useParams();
  const [hours, setHours] = useState(24);
  const [activeTab, setActiveTab] = useState('connections');

  const fetcher = useCallback(
    () => fetchInstanceHistory(ip, instanceName, { hours }),
    [ip, instanceName, hours]
  );
  const { data: history, loading, error } = usePolling(fetcher, 60000, [hours]);

  const latest = history && history.length > 0 ? history[0] : null;
  const metrics = latest?.metrics || {};
  const score = latest?.health_score;

  if (loading && !history) return <LoadingSpinner />;
  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">Dashboard</Link> &rsaquo; {ip} &rsaquo; {instanceName}
      </div>

      {latest && (
        <div className="instance-header">
          <div className="instance-header__info">
            <span className="instance-header__icon">{DB_TYPE_ICONS[latest.db_type] || '?'}</span>
            <div>
              <h2>{instanceName}</h2>
              <p className="text-muted">
                {latest.hostname && <><strong>{latest.hostname}</strong> &middot; </>}
                {latest.db_type} &middot; {latest.db_host}:{latest.db_port} &middot; {ip}
              </p>
            </div>
          </div>
          <div className="instance-header__score" style={{ color: healthColor(score) }}>
            <span className="score-number">{score != null ? Math.round(score) : '--'}</span>
            <span className="score-label">Health</span>
          </div>
        </div>
      )}

      <div className="instance-summary">
        <MetricCard label="Status" value={latest?.is_reachable ? 'UP' : 'DOWN'}
          color={latest?.is_reachable ? '#22c55e' : '#ef4444'} />
        <MetricCard label="Last Seen" value={formatTs(latest?.timestamp)} />
        <MetricCard label="Connections" value={metrics.connections?.active ?? '--'}
          sub={metrics.connections?.max ? `/ ${metrics.connections.max}` : ''} />
        <MetricCard label="Cache Hit" value={
          formatPct(metrics.resource_utilization?.buffer_pool_hit_ratio ?? metrics.resource_utilization?.cache_hit_ratio)
        } />
        <MetricCard label="Storage" value={formatMB(metrics.storage?.total_size_mb)} />
        <MetricCard label="Replication" value={metrics.replication?.role ?? '--'}
          sub={metrics.replication?.lag_seconds != null ? `Lag: ${metrics.replication.lag_seconds}s` : ''} />
      </div>

      <div className="filter-bar" style={{ marginTop: 16 }}>
        {TIME_RANGES.map((r) => (
          <button
            key={r.value}
            className={`btn btn--small ${hours === r.value ? 'btn--primary' : ''}`}
            onClick={() => setHours(r.value)}
          >
            {r.label}
          </button>
        ))}
        <button className="btn btn--small" onClick={() => exportCsv(ip, instanceName, { hours })}>
          Export CSV
        </button>
      </div>

      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`tab-btn ${activeTab === cat.key ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="category-content">
        <CategoryPanel data={metrics[activeTab]} category={activeTab} ip={ip} instanceName={instanceName} />
      </div>

      {history && history.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <h3>History ({history.length} records)</h3>
          <div className="table-wrapper">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Reachable</th>
                  <th>Health</th>
                  <th>Connections</th>
                  <th>Cache Hit %</th>
                  <th>Storage MB</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 50).map((row, i) => {
                  const m = row.metrics || {};
                  return (
                    <tr key={i} style={!row.is_reachable ? { background: '#fef2f2' } : undefined}>
                      <td>{formatTs(row.timestamp)}</td>
                      <td>{row.is_reachable ? 'Yes' : 'No'}</td>
                      <td style={{ color: healthColor(row.health_score) }}>
                        {row.health_score != null ? Math.round(row.health_score) : '--'}
                      </td>
                      <td>{m.connections?.active ?? '--'}</td>
                      <td>{formatPct(m.resource_utilization?.buffer_pool_hit_ratio ?? m.resource_utilization?.cache_hit_ratio)}</td>
                      <td>{m.storage?.total_size_mb != null ? Number(m.storage.total_size_mb).toFixed(1) : '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
