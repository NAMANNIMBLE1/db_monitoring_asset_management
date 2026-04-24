import { useEffect, useState } from 'react';
import { fetchAlertThresholds, updateAlertThreshold } from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';

const METRIC_LABELS = {
  disk: 'Disk Usage',
  cpu: 'CPU Usage',
  memory: 'Memory Usage',
};

const METRIC_HELP = {
  disk: 'disk_critical fires at/above warn. Forecast alerts fire if projected breach of warn is within the forecast window (min 30 days history required).',
  cpu:  'cpu_sustained_high fires when 3 consecutive samples are at/above warn.',
  memory: 'memory_critical fires when the latest sample is at/above warn.',
};

export default function SettingsPage() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [flash, setFlash] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAlertThresholds();
      const byMetric = {};
      for (const r of data) byMetric[r.metric] = r;
      for (const k of ['disk', 'cpu', 'memory']) {
        if (!byMetric[k]) byMetric[k] = { metric: k, warn_threshold: 80, critical_threshold: 90, forecast_days: 15 };
      }
      setRows(byMetric);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (metric, field, value) => {
    setRows((prev) => ({
      ...prev,
      [metric]: { ...prev[metric], [field]: value },
    }));
  };

  const handleSave = async (metric) => {
    const row = rows[metric];
    const payload = {
      warn_threshold: Number(row.warn_threshold),
      critical_threshold: Number(row.critical_threshold),
      forecast_days: Number(row.forecast_days),
    };
    if (Number.isNaN(payload.warn_threshold) || Number.isNaN(payload.critical_threshold) || Number.isNaN(payload.forecast_days)) {
      setFlash({ type: 'error', text: 'All fields must be numbers' });
      return;
    }
    if (payload.critical_threshold < payload.warn_threshold) {
      setFlash({ type: 'error', text: 'Critical must be >= warn' });
      return;
    }
    setSaving(metric);
    try {
      await updateAlertThreshold(metric, payload);
      setFlash({ type: 'success', text: `${METRIC_LABELS[metric]} saved` });
      await load();
    } catch (err) {
      setFlash({ type: 'error', text: err.response?.data?.detail || err.message });
    } finally {
      setSaving(null);
      setTimeout(() => setFlash(null), 3000);
    }
  };

  if (loading && !rows) return <LoadingSpinner />;
  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Alert Thresholds</h2>
      </div>

      <p className="placeholder" style={{ marginBottom: 16 }}>
        Global thresholds applied to every monitored host. Changes take effect within 60 seconds.
      </p>

      {flash && (
        <div className={flash.type === 'error' ? 'error-banner' : 'success-banner'} style={{ marginBottom: 16 }}>
          {flash.text}
        </div>
      )}

      <div className="threshold-grid">
        {['disk', 'cpu', 'memory'].map((metric) => {
          const row = rows[metric];
          return (
            <div key={metric} className="threshold-card">
              <h3>{METRIC_LABELS[metric]}</h3>
              <p className="threshold-help">{METRIC_HELP[metric]}</p>

              <label className="threshold-field">
                <span>Warning %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={row.warn_threshold}
                  onChange={(e) => handleChange(metric, 'warn_threshold', e.target.value)}
                />
              </label>

              <label className="threshold-field">
                <span>Critical %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={row.critical_threshold}
                  onChange={(e) => handleChange(metric, 'critical_threshold', e.target.value)}
                />
              </label>

              {metric === 'disk' && (
                <label className="threshold-field">
                  <span>Forecast horizon (days)</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    value={row.forecast_days}
                    onChange={(e) => handleChange(metric, 'forecast_days', e.target.value)}
                  />
                </label>
              )}

              <button
                className="btn"
                disabled={saving === metric}
                onClick={() => handleSave(metric)}
              >
                {saving === metric ? 'Saving…' : 'Save'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
