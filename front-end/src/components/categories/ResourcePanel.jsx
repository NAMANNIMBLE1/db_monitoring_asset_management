import MetricCard from '../common/MetricCard';

function GaugeBar({ label, value, max, unit = '%', thresholds = [70, 90] }) {
  const pct = max > 0 ? (value / max * 100) : value;
  const color = pct >= thresholds[1] ? '#ef4444' : pct >= thresholds[0] ? '#f59e0b' : '#10b981';
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '.78rem', fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: '.85rem', fontWeight: 700, color }}>{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s ease' }} />
      </div>
    </div>
  );
}

export default function ResourcePanel({ data }) {
  if (!data || data.error) return <p className="placeholder">{data?.error || 'No resource data available.'}</p>;

  const {
    buffer_pool_hit_ratio, buffer_pool_used_pct, innodb_log_waits = 0, threads_cached = 0,
    page_life_expectancy, memory_used_mb,
    cache_hit_ratio, cache_used_mb, cache_max_mb,
    resident_mb, virtual_mb, memory_fragmentation_ratio,
    blocks_hit, blocks_read, wal_records, wal_bytes,
    pga_allocated_mb, sga_total_mb,
    keyspace_hits, keyspace_misses, evicted_keys, expired_keys, instantaneous_ops_per_sec,
  } = data;

  const hitRatio = buffer_pool_hit_ratio ?? cache_hit_ratio ?? null;

  return (
    <div>
      {/* Key gauges */}
      <div style={{ padding: '20px 24px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {hitRatio != null && <GaugeBar label="Cache/Buffer Hit Ratio" value={hitRatio} max={100} thresholds={[85, 95]} />}
          {buffer_pool_used_pct != null && <GaugeBar label="Buffer Pool Used" value={buffer_pool_used_pct} max={100} />}
        </div>
      </div>

      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        {hitRatio != null && <MetricCard label="Cache Hit Ratio" value={`${hitRatio.toFixed(2)}%`} color={hitRatio < 90 ? '#ef4444' : '#10b981'} />}
        {buffer_pool_used_pct != null && <MetricCard label="Buffer Pool Used" value={`${buffer_pool_used_pct}%`} color="#6366f1" />}
        {innodb_log_waits != null && <MetricCard label="InnoDB Log Waits" value={innodb_log_waits} color={innodb_log_waits > 0 ? '#f59e0b' : '#10b981'} />}
        {threads_cached != null && <MetricCard label="Threads Cached" value={threads_cached} />}
        {page_life_expectancy != null && <MetricCard label="Page Life Expectancy" value={`${page_life_expectancy}s`} color={page_life_expectancy < 300 ? '#ef4444' : '#10b981'} />}
        {memory_used_mb != null && <MetricCard label="Memory Used" value={`${memory_used_mb} MB`} color="#6366f1" />}
        {resident_mb != null && <MetricCard label="Resident Memory" value={`${resident_mb} MB`} />}
        {virtual_mb != null && <MetricCard label="Virtual Memory" value={`${virtual_mb} MB`} />}
        {cache_used_mb != null && <MetricCard label="Cache Used" value={`${cache_used_mb} MB`} sub={cache_max_mb ? `/ ${cache_max_mb} MB` : ''} />}
        {pga_allocated_mb != null && <MetricCard label="PGA Allocated" value={`${pga_allocated_mb} MB`} />}
        {sga_total_mb != null && <MetricCard label="SGA Total" value={`${sga_total_mb} MB`} />}
        {memory_fragmentation_ratio != null && <MetricCard label="Memory Fragmentation" value={memory_fragmentation_ratio.toFixed(2)} color={memory_fragmentation_ratio > 1.5 ? '#f59e0b' : '#10b981'} />}
      </div>

      {/* Redis-specific performance */}
      {(keyspace_hits != null || instantaneous_ops_per_sec != null) && (
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 12 }}>Performance Counters</h4>
          <div className="metrics-grid">
            {keyspace_hits != null && <MetricCard label="Keyspace Hits" value={keyspace_hits.toLocaleString()} color="#10b981" />}
            {keyspace_misses != null && <MetricCard label="Keyspace Misses" value={keyspace_misses.toLocaleString()} color="#f59e0b" />}
            {evicted_keys != null && <MetricCard label="Evicted Keys" value={evicted_keys.toLocaleString()} color={evicted_keys > 0 ? '#ef4444' : '#64748b'} />}
            {expired_keys != null && <MetricCard label="Expired Keys" value={expired_keys.toLocaleString()} />}
            {instantaneous_ops_per_sec != null && <MetricCard label="Ops/sec" value={instantaneous_ops_per_sec.toLocaleString()} color="#6366f1" />}
          </div>
        </div>
      )}

      {/* PG WAL stats */}
      {wal_records != null && (
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', marginTop: 12 }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 12 }}>WAL Statistics</h4>
          <div className="metrics-grid">
            <MetricCard label="WAL Records" value={wal_records.toLocaleString()} />
            <MetricCard label="WAL Bytes" value={`${(wal_bytes / 1024 / 1024).toFixed(1)} MB`} />
          </div>
        </div>
      )}
    </div>
  );
}
