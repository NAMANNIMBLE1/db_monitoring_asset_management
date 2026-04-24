import MetricCard from '../common/MetricCard';

function timeSince(isoOrEpoch) {
  if (!isoOrEpoch) return null;
  let ts;
  if (typeof isoOrEpoch === 'number') {
    ts = isoOrEpoch > 1e12 ? isoOrEpoch : isoOrEpoch * 1000;
  } else {
    ts = new Date(isoOrEpoch).getTime();
  }
  if (isNaN(ts) || ts === 0) return null;
  const diffMs = Date.now() - ts;
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ago`;
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diffMs / 60000);
  return `${mins}m ago`;
}

export default function BackupPanel({ data }) {
  if (!data || data.error) return <p className="placeholder">{data?.error || 'No backup data available.'}</p>;

  const { last_backup_time, backup_method, backup_type, rdb_last_save_epoch, rdb_bgsave_in_progress, rdb_last_status, aof_enabled, last_archived_wal } = data;

  const hasBackup = last_backup_time || rdb_last_save_epoch;
  const age = timeSince(last_backup_time || rdb_last_save_epoch);
  const isOld = !hasBackup; // Simplified — no backup at all

  return (
    <div>
      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
        background: hasBackup ? '#ecfdf5' : '#fef2f2',
        borderRadius: 10, border: `1px solid ${hasBackup ? '#bbf7d0' : '#fecaca'}`,
        marginBottom: 20,
      }}>
        <span style={{ fontSize: '2rem' }}>{hasBackup ? '✅' : '⚠️'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: hasBackup ? '#10b981' : '#ef4444' }}>
            {hasBackup ? 'Backup Available' : 'No Backup Information'}
          </div>
          <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: 2 }}>
            {hasBackup
              ? `Last backup: ${age || last_backup_time || 'Available'}`
              : 'No backup records found. Configure and run a backup to ensure data safety.'}
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Last Backup" value={age || last_backup_time || 'None'} color={hasBackup ? '#10b981' : '#ef4444'} />
        {backup_method && <MetricCard label="Backup Method" value={backup_method} />}
        {backup_type && <MetricCard label="Backup Type" value={backup_type === 'D' ? 'Full' : backup_type === 'I' ? 'Differential' : backup_type === 'L' ? 'Log' : backup_type} />}
        {last_archived_wal && <MetricCard label="Last Archived WAL" value={last_archived_wal} />}
      </div>

      {/* Redis-specific backup info */}
      {(rdb_last_save_epoch !== undefined || aof_enabled !== undefined) && (
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 12 }}>Redis Persistence</h4>
          <div className="metrics-grid">
            {rdb_last_save_epoch != null && (
              <MetricCard label="RDB Last Save" value={age || String(rdb_last_save_epoch)} />
            )}
            {rdb_bgsave_in_progress != null && (
              <MetricCard label="BGSAVE In Progress" value={rdb_bgsave_in_progress ? 'Yes' : 'No'} color={rdb_bgsave_in_progress ? '#f59e0b' : '#64748b'} />
            )}
            {rdb_last_status != null && (
              <MetricCard label="Last BGSAVE Status" value={rdb_last_status} color={rdb_last_status === 'ok' ? '#10b981' : '#ef4444'} />
            )}
            {aof_enabled != null && (
              <MetricCard label="AOF Enabled" value={aof_enabled ? 'Yes' : 'No'} color={aof_enabled ? '#10b981' : '#64748b'} />
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!hasBackup && (
        <div style={{ marginTop: 20, padding: '16px 20px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>Recommendations</h4>
          <ul style={{ fontSize: '.82rem', color: '#64748b', paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Set up automated daily backups using mysqldump, pg_dump, or your DB's native backup tool</li>
            <li>Configure backup retention policy (e.g., keep 7 daily + 4 weekly backups)</li>
            <li>Test restore procedures regularly to verify backup integrity</li>
            <li>Consider replication as an additional data protection layer</li>
          </ul>
        </div>
      )}
    </div>
  );
}
