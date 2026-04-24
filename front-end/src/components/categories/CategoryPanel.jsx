import MetricCard from '../common/MetricCard';
import DataTable from '../common/DataTable';
import StorageForecast from './StorageForecast';
import ReplicationPanel from './ReplicationPanel';
import ConnectionsPanel from './ConnectionsPanel';
import QueryPerformancePanel from './QueryPerformancePanel';
import LocksPanel from './LocksPanel';
import BackupPanel from './BackupPanel';
import SecurityPanel from './SecurityPanel';
import ResourcePanel from './ResourcePanel';

// Categories with custom panels
const CUSTOM_PANELS = {
  replication: ReplicationPanel,
  connections: ConnectionsPanel,
  query_performance: QueryPerformancePanel,
  locks: LocksPanel,
  backup: BackupPanel,
  security: SecurityPanel,
  resource_utilization: ResourcePanel,
};

export default function CategoryPanel({ data, category, ip, instanceName }) {
  // Use custom panel if available
  const CustomPanel = CUSTOM_PANELS[category];
  if (CustomPanel) {
    return <CustomPanel data={data} ip={ip} instanceName={instanceName} />;
  }

  if (!data || data.error) {
    return <p className="placeholder">{data?.error || 'No data available for this category.'}</p>;
  }

  // Generic renderer for remaining tabs (storage, index_fragmentation, jobs)
  const simpleEntries = [];
  const arrayEntries = [];

  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      arrayEntries.push({ key, val });
    } else if (typeof val === 'object' && val !== null) {
      for (const [k2, v2] of Object.entries(val)) {
        simpleEntries.push({ key: `${key}.${k2}`, val: v2 });
      }
    } else {
      simpleEntries.push({ key, val });
    }
  }

  return (
    <div className="category-panel">
      {simpleEntries.length > 0 && (
        <div className="metrics-grid">
          {simpleEntries.map(({ key, val }) => (
            <MetricCard
              key={key}
              label={key.replace(/_/g, ' ')}
              value={typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : String(val ?? '--')}
            />
          ))}
        </div>
      )}

      {arrayEntries.map(({ key, val }) => {
        if (!val.length) return null;

        // Array of primitives (strings/numbers) → render as pill list, not table
        const isPrimitiveArray = val.every(v => v === null || typeof v !== 'object');
        if (isPrimitiveArray) {
          return (
            <div key={key} style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {val.map((v, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', background: '#eef2ff', color: '#6366f1',
                    borderRadius: 16, fontSize: '.78rem', fontWeight: 500,
                  }}>
                    {String(v)}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        // Array of objects → render as table
        const cols = Object.keys(val[0]).map((k) => ({
          key: k,
          label: k.replace(/_/g, ' '),
          render: (v) => {
            if (v == null) return '--';
            if (typeof v === 'object') return JSON.stringify(v);
            return String(v);
          },
        }));
        return (
          <div key={key} style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</h4>
            <DataTable columns={cols} rows={val.slice(0, 20)} />
          </div>
        );
      })}

      {category === 'storage' && ip && instanceName && (
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ marginBottom: 12 }}>Storage Growth Forecast</h4>
          <StorageForecast ip={ip} instanceName={instanceName} />
        </div>
      )}
    </div>
  );
}
