import { useState, useCallback } from 'react';
import { fetchOverview } from '../api/client';
import { fetchGroups } from '../api/groups';
import usePolling from '../hooks/usePolling';
import HealthScoreCard from '../components/dashboard/HealthScoreCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STALE_MINUTES = 10;

function isStale(timestamp) {
  if (!timestamp) return true;
  return (Date.now() - new Date(timestamp).getTime()) > STALE_MINUTES * 60 * 1000;
}

export default function Dashboard() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  const fetcher = useCallback(
    () => fetchOverview(groupFilter ? { group_id: Number(groupFilter) } : {}),
    [groupFilter]
  );
  const { data: instances, loading, error } = usePolling(fetcher, 60000);
  const { data: groupsResponse } = usePolling(fetchGroups, 60000);
  const groups = groupsResponse?.data || [];

  const filtered = (instances || []).filter((inst) => {
    if (typeFilter && inst.db_type !== typeFilter) return false;
    const stale = isStale(inst.timestamp);
    if (statusFilter === 'online' && stale) return false;
    if (statusFilter === 'inactive' && !stale) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inst.instance_name.toLowerCase().includes(q) ||
        inst.ip_address.includes(q) ||
        (inst.hostname || '').toLowerCase().includes(q) ||
        inst.db_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const dbTypes = [...new Set((instances || []).map((i) => i.db_type))].sort();
  const onlineCount = (instances || []).filter((i) => !isStale(i.timestamp)).length;
  const inactiveCount = (instances || []).filter((i) => isStale(i.timestamp)).length;

  if (loading && !instances) return <LoadingSpinner />;
  if (error) return <div className="error-banner">Error: {error}</div>;

  return (
    <div>
      <div className="dashboard-summary">
        <div className="summary-card summary-card--total">
          <span className="summary-card__value">{(instances || []).length}</span>
          <span className="summary-card__label">Total Instances</span>
        </div>
        <div className="summary-card summary-card--up">
          <span className="summary-card__value">{onlineCount}</span>
          <span className="summary-card__label">Online</span>
        </div>
        <div className="summary-card summary-card--stale">
          <span className="summary-card__value">{inactiveCount}</span>
          <span className="summary-card__label">Inactive</span>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="input"
          placeholder="Search by name, IP, hostname, or DB type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All DB Types</option>
          {dbTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="input" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="placeholder">
          {(instances || []).length === 0
            ? 'No database instances reporting yet. Configure databases in your agent config.json.'
            : 'No instances match filters.'}
        </p>
      ) : (
        <div className="card-grid">
          {filtered.map((inst) => (
            <HealthScoreCard key={`${inst.ip_address}-${inst.instance_name}`} instance={inst} />
          ))}
        </div>
      )}
    </div>
  );
}
