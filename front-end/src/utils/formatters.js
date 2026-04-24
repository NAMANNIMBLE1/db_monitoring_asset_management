export function formatTs(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
}

export function formatMB(mb) {
  if (mb == null) return '--';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Number(mb).toFixed(1)} MB`;
}

export function formatPct(val) {
  if (val == null) return '--';
  return `${Number(val).toFixed(1)}%`;
}

export function healthColor(score) {
  if (score == null) return '#94a3b8';
  if (score >= 80) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function healthLabel(score) {
  if (score == null) return 'No Data';
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Warning';
  return 'Critical';
}

export const DB_TYPE_ICONS = {
  mysql: '🐬',
  postgresql: '🐘',
  mssql: '🔷',
  mongodb: '🍃',
  cassandra: '👁',
  redis: '🔴',
  oracle: '🔶',
  clickhouse: '⚡',
};
