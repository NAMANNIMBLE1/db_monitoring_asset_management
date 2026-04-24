import { useState, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { formatMB } from '../../utils/formatters';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const TREND_CONFIG = {
  growing: { color: '#ef4444', bg: '#fef2f2', icon: '📈', label: 'Growing' },
  shrinking: { color: '#10b981', bg: '#ecfdf5', icon: '📉', label: 'Shrinking' },
  stable: { color: '#6366f1', bg: '#eef2ff', icon: '➡️', label: 'Stable' },
};

const CONFIDENCE_CONFIG = {
  high: { color: '#10b981', label: 'High Confidence' },
  medium: { color: '#f59e0b', label: 'Medium Confidence' },
  low: { color: '#ef4444', label: 'Low Confidence' },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.1)',
      fontSize: '.82rem',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#1e293b' }}>{label}</div>
      {payload.map((p, i) => (
        p.value != null && (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: p.color,
              display: 'inline-block', border: p.name === 'Forecast' ? '2px dashed ' + p.color : 'none',
            }} />
            <span style={{ color: '#64748b' }}>{p.name}:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{formatMB(p.value)}</span>
          </div>
        )
      ))}
    </div>
  );
}

export default function StorageForecast({ ip, instanceName }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(90);

  const loadForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${BASE}/api/v1/db/monitor/${encodeURIComponent(ip)}/${encodeURIComponent(instanceName)}/forecast`,
        { params: { days, forecast_days: forecastDays } }
      );
      if (data.error) setError(data.error);
      else setForecast(data);
    } catch (err) {
      setError(err.message || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  }, [ip, instanceName, days, forecastDays]);

  // Build chart data: history has actual + trendline, forecast has predicted
  const chartData = [];
  let dividerDate = null;

  if (forecast) {
    const histLen = forecast.history.length;
    forecast.history.forEach((p, i) => {
      chartData.push({ date: p.date, actual: p.size_mb, forecast: null, trend: null });
    });

    if (histLen > 0) {
      dividerDate = forecast.history[histLen - 1].date;
      // Bridge: connect actual to forecast
      const lastActual = forecast.history[histLen - 1].size_mb;
      if (forecast.forecast.length > 0) {
        chartData[chartData.length - 1].forecast = lastActual;
      }
    }

    forecast.forecast.forEach(p => {
      chartData.push({ date: p.date, actual: null, forecast: p.predicted_size_mb });
    });
  }

  const trend = TREND_CONFIG[forecast?.trend] || TREND_CONFIG.stable;
  const conf = CONFIDENCE_CONFIG[forecast?.confidence] || CONFIDENCE_CONFIG.medium;

  return (
    <div className="forecast-panel">
      <div className="forecast-controls">
        <div className="forecast-controls__group">
          <label className="forecast-label">
            <span>History Window</span>
            <select className="input" value={days} onChange={e => setDays(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <label className="forecast-label">
            <span>Forecast Horizon</span>
            <select className="input" value={forecastDays} onChange={e => setForecastDays(Number(e.target.value))}>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </label>
        </div>
        <button className="btn btn--forecast" onClick={loadForecast} disabled={loading}>
          {loading ? (
            <><span className="spinner" /> Analyzing...</>
          ) : (
            <><span style={{ fontSize: '1rem' }}>🔮</span> Run Forecast</>
          )}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {forecast && (
        <>
          {/* KPI strip */}
          <div className="forecast-kpis">
            <div className="forecast-kpi">
              <div className="forecast-kpi__icon" style={{ background: '#eff6ff' }}>📊</div>
              <div>
                <div className="forecast-kpi__label">Current Size</div>
                <div className="forecast-kpi__value">{formatMB(forecast.current_size_mb)}</div>
              </div>
            </div>
            <div className="forecast-kpi">
              <div className="forecast-kpi__icon" style={{ background: trend.bg }}>{trend.icon}</div>
              <div>
                <div className="forecast-kpi__label">Predicted in {forecastDays}d</div>
                <div className="forecast-kpi__value" style={{ color: trend.color }}>{formatMB(forecast.predicted_size_mb)}</div>
              </div>
            </div>
            <div className="forecast-kpi">
              <div className="forecast-kpi__icon" style={{ background: trend.bg }}>{trend.icon}</div>
              <div>
                <div className="forecast-kpi__label">Daily Growth</div>
                <div className="forecast-kpi__value">{forecast.growth_rate_mb_per_day.toFixed(2)} MB/day</div>
              </div>
            </div>
            <div className="forecast-kpi">
              <div className="forecast-kpi__icon" style={{ background: trend.bg }}>{trend.icon}</div>
              <div>
                <div className="forecast-kpi__label">Trend</div>
                <div className="forecast-kpi__value" style={{ color: trend.color }}>{trend.label}</div>
              </div>
            </div>
            <div className="forecast-kpi">
              <div className="forecast-kpi__icon" style={{ background: conf.color + '15' }}>🎯</div>
              <div>
                <div className="forecast-kpi__label">Model Confidence</div>
                <div className="forecast-kpi__value" style={{ color: conf.color }}>
                  {conf.label} <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>R²={forecast.r_squared}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="forecast-chart-wrapper">
              <div className="forecast-chart-header">
                <h4>Storage Growth Timeline</h4>
                <div className="forecast-chart-legend">
                  <span className="legend-item"><span className="legend-dot" style={{ background: '#6366f1' }} /> Actual</span>
                  <span className="legend-item"><span className="legend-dot legend-dot--dashed" style={{ background: '#f97316' }} /> Forecast</span>
                  {dividerDate && <span className="legend-item legend-item--muted">| Today: {dividerDate}</span>}
                </div>
              </div>
              <div style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                    <defs>
                      <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#cbd5e1"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      interval={Math.max(0, Math.floor(chartData.length / 8))}
                      angle={-35}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      stroke="#cbd5e1"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => v >= 1024 ? `${(v/1024).toFixed(1)}G` : `${v}M`}
                      width={50}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {dividerDate && (
                      <ReferenceLine
                        x={dividerDate}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'Today',
                          position: 'top',
                          fill: '#64748b',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#gradActual)"
                      dot={false}
                      activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                      name="Actual"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      fill="url(#gradForecast)"
                      dot={false}
                      activeDot={{ r: 5, stroke: '#f97316', strokeWidth: 2, fill: '#fff' }}
                      name="Forecast"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {!forecast && !loading && !error && (
        <div className="forecast-empty">
          <div className="forecast-empty__icon">🔮</div>
          <h4>Storage Growth Forecast</h4>
          <p>Analyze historical storage trends using linear regression to predict future capacity needs and plan ahead.</p>
          <button className="btn btn--primary" onClick={loadForecast}>
            Run Forecast
          </button>
        </div>
      )}
    </div>
  );
}
