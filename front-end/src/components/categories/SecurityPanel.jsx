import { useState, useEffect } from 'react';
import MetricCard from '../common/MetricCard';
import { formatTs } from '../../utils/formatters';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

function SchemaHistory({ ip, instanceName }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!ip || !instanceName) return;
    setLoading(true);
    axios.get(`${BASE}/api/v1/db/schema/${encodeURIComponent(ip)}/${encodeURIComponent(instanceName)}?limit=20`)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [ip, instanceName]);

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '.85rem' }}>Loading schema history...</p>;
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '.85rem', background: '#f8fafc', borderRadius: 8 }}>
        No schema changes recorded yet. Changes will appear here when tables, columns, or types are modified.
      </div>
    );
  }

  return (
    <div>
      {history.map((ver, i) => {
        const isExpanded = expanded === ver.id;
        const changes = ver.changes || {};
        const hasChanges = Object.keys(changes).some(k => k !== 'note' && changes[k]?.length > 0);

        return (
          <div key={ver.id} style={{
            border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 10,
            overflow: 'hidden', background: '#fff',
          }}>
            <div
              onClick={() => setExpanded(isExpanded ? null : ver.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 18px', cursor: 'pointer', background: i === 0 ? '#eef2ff' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: '#6366f1', color: '#fff', fontSize: '.75rem',
                  fontWeight: 700,
                }}>
                  v{ver.version}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.85rem' }}>
                    {i === 0 ? 'Current Version' : `Version ${ver.version}`}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#64748b' }}>
                    {formatTs(ver.detected_at)}
                    {changes.note && ` — ${changes.note}`}
                    {hasChanges && ` — ${Object.entries(changes).filter(([k, v]) => Array.isArray(v) && v.length).map(([k, v]) => `${v.length} ${k.replace(/_/g, ' ')}`).join(', ')}`}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '.8rem', color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
              <div style={{ padding: '14px 18px', borderTop: '1px solid #f1f5f9' }}>
                {/* Show changes */}
                {hasChanges && (
                  <div style={{ marginBottom: 16 }}>
                    <h5 style={{ fontSize: '.8rem', fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>Changes</h5>
                    {Object.entries(changes).filter(([k, v]) => Array.isArray(v) && v.length).map(([action, items]) => (
                      <div key={action} style={{ marginBottom: 8 }}>
                        <div style={{
                          fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase',
                          color: action.includes('added') ? '#10b981' : action.includes('dropped') ? '#ef4444' : '#f59e0b',
                          marginBottom: 4,
                        }}>
                          {action.replace(/_/g, ' ')}
                        </div>
                        {items.map((item, j) => (
                          <div key={j} style={{
                            padding: '4px 10px', marginBottom: 2, fontSize: '.78rem',
                            background: action.includes('added') ? '#ecfdf5' : action.includes('dropped') ? '#fef2f2' : '#fffbeb',
                            borderRadius: 4, fontFamily: 'monospace',
                          }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Show snapshot summary */}
                {ver.snapshot?.databases && (
                  <div>
                    <h5 style={{ fontSize: '.8rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Schema Snapshot</h5>
                    {Object.entries(ver.snapshot.databases).map(([dbName, dbData]) => (
                      <div key={dbName} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 4 }}>{dbName}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {Object.entries(dbData.tables || {}).map(([tName, tData]) => (
                            <span key={tName} style={{
                              padding: '2px 8px', background: '#f1f5f9', borderRadius: 4,
                              fontSize: '.72rem', fontFamily: 'monospace',
                            }}>
                              {tName} ({tData.columns?.length || 0} cols)
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: 8 }}>
                  Hash: <code style={{ fontSize: '.68rem' }}>{ver.schema_hash}</code>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SecurityPanel({ data, ip, instanceName }) {
  if (!data || data.error) return <p className="placeholder">{data?.error || 'No security data available.'}</p>;

  const { failed_logins_5min = 0, aborted_connects_total = 0, users_without_password = 0, superusers = [], superuser_count = 0, recent_logins = 0 } = data;

  const hasRisk = users_without_password > 0 || failed_logins_5min > 10;
  const riskLevel = users_without_password > 0 ? 'high' : failed_logins_5min > 10 ? 'medium' : 'low';
  const riskConfig = {
    high: { bg: '#fef2f2', border: '#fecaca', color: '#ef4444', label: 'Security Risk Detected', icon: '🛑' },
    medium: { bg: '#fffbeb', border: '#fde68a', color: '#f59e0b', label: 'Elevated Activity', icon: '⚠️' },
    low: { bg: '#ecfdf5', border: '#bbf7d0', color: '#10b981', label: 'No Issues Detected', icon: '🛡️' },
  };
  const risk = riskConfig[riskLevel];

  return (
    <div>
      {/* Risk banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
        background: risk.bg, borderRadius: 10, border: `1px solid ${risk.border}`, marginBottom: 20,
      }}>
        <span style={{ fontSize: '2rem' }}>{risk.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: risk.color }}>{risk.label}</div>
          <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: 2 }}>
            {users_without_password > 0
              ? `${users_without_password} user(s) have no password set — immediate action required`
              : failed_logins_5min > 10
              ? `${failed_logins_5min} failed login attempts in the last 5 minutes`
              : 'All security checks passed — no immediate concerns'}
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Failed Logins (5min)" value={failed_logins_5min} color={failed_logins_5min > 5 ? '#ef4444' : '#10b981'} />
        <MetricCard label="Aborted Connections" value={aborted_connects_total} color={aborted_connects_total > 100 ? '#f59e0b' : '#64748b'} />
        <MetricCard label="Users Without Password" value={users_without_password} color={users_without_password > 0 ? '#ef4444' : '#10b981'} />
        {recent_logins > 0 && <MetricCard label="Recent Logins (5min)" value={recent_logins} color="#6366f1" />}
        {superuser_count > 0 && <MetricCard label="Superuser Count" value={superuser_count} color={superuser_count > 3 ? '#f59e0b' : '#64748b'} />}
      </div>

      {/* Superuser list (PostgreSQL) */}
      {superusers && superusers.length > 0 && (
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 10 }}>Superuser Accounts</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {superusers.map((u, i) => (
              <span key={i} style={{
                padding: '4px 12px', background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 20, fontSize: '.78rem', fontWeight: 600, color: '#f59e0b',
              }}>
                {u}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Schema Change History (DDL Audit) */}
      {ip && instanceName && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: 12 }}>Schema Change History (DDL Audit)</h4>
          <SchemaHistory ip={ip} instanceName={instanceName} />
        </div>
      )}

      {/* Security checklist */}
      <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
        <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 12 }}>Security Checklist</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { ok: users_without_password === 0, label: 'All users have passwords set', bad: `${users_without_password} user(s) without password` },
            { ok: failed_logins_5min < 5, label: 'No brute-force login attempts', bad: `${failed_logins_5min} failed attempts in 5 min` },
            { ok: aborted_connects_total < 200, label: 'Connection failure rate is normal', bad: `${aborted_connects_total} aborted connections` },
            { ok: !superusers || superusers.length <= 2, label: 'Minimal superuser accounts', bad: `${superusers?.length || 0} superuser accounts` },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.82rem' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: item.ok ? '#ecfdf5' : '#fef2f2', color: item.ok ? '#10b981' : '#ef4444', fontSize: '.7rem', fontWeight: 700,
              }}>
                {item.ok ? '✓' : '✗'}
              </span>
              <span style={{ color: item.ok ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                {item.ok ? item.label : item.bad}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
