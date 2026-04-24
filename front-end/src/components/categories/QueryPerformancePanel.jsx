import MetricCard from '../common/MetricCard';

export default function QueryPerformancePanel({ data }) {
  if (!data || data.error) return <p className="placeholder">{data?.error || 'No query performance data available.'}</p>;

  const { slow_queries = 0, total_questions = 0, top_queries = [] } = data;

  return (
    <div>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <MetricCard label="Slow Queries" value={slow_queries} color={slow_queries > 0 ? '#ef4444' : '#10b981'} />
        <MetricCard label="Total Queries Executed" value={total_questions.toLocaleString()} color="#6366f1" />
        <MetricCard label="Top Queries Tracked" value={top_queries.length} color="#3b82f6" />
      </div>

      {top_queries.length > 0 && (
        <div>
          <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: 12 }}>Top Queries by Execution Time</h4>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Query</th>
                  <th>Executions</th>
                  <th>Total Time</th>
                  <th>Avg Time</th>
                  <th>Rows Examined</th>
                  <th>Rows Sent</th>
                  <th>Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {top_queries.map((q, i) => {
                  const examined = q.rows_examined || 0;
                  const sent = q.rows_sent || 0;
                  const ratio = sent > 0 ? (examined / sent) : 0;
                  const isInefficient = ratio > 100;
                  const avgMs = (q.avg_time_s || 0) * 1000;
                  const isSlow = avgMs > 100;

                  return (
                    <tr key={i}>
                      <td>
                        <code style={{
                          display: 'block', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', fontSize: '.75rem', padding: '4px 8px',
                          background: '#f8fafc', borderRadius: 4, border: '1px solid #f1f5f9',
                        }}>
                          {q.query || '--'}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{(q.exec_count || 0).toLocaleString()}</td>
                      <td>
                        <span style={{ color: (q.total_time_s || 0) > 1 ? '#ef4444' : '#1e293b' }}>
                          {(q.total_time_s || 0).toFixed(3)}s
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: '.72rem', fontWeight: 600,
                          background: isSlow ? '#fef2f2' : '#f8fafc',
                          color: isSlow ? '#ef4444' : '#64748b',
                        }}>
                          {avgMs.toFixed(1)}ms
                        </span>
                      </td>
                      <td>{examined.toLocaleString()}</td>
                      <td>{sent.toLocaleString()}</td>
                      <td>
                        {sent > 0 ? (
                          <span style={{
                            padding: '2px 8px', borderRadius: 12, fontSize: '.72rem', fontWeight: 600,
                            background: isInefficient ? '#fef2f2' : '#ecfdf5',
                            color: isInefficient ? '#ef4444' : '#10b981',
                          }}>
                            {ratio.toFixed(0)}:1
                          </span>
                        ) : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: '.75rem', color: '#94a3b8' }}>
            Efficiency = rows examined / rows sent. High ratios (&gt;100:1) indicate full table scans or missing indexes.
          </div>
        </div>
      )}
    </div>
  );
}
