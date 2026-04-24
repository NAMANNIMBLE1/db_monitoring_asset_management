import { useNavigate } from 'react-router-dom';
import { healthColor, healthLabel, formatTs, DB_TYPE_ICONS } from '../../utils/formatters';

const STALE_MINUTES = 10;

function isStale(timestamp) {
  if (!timestamp) return true;
  return (Date.now() - new Date(timestamp).getTime()) > STALE_MINUTES * 60 * 1000;
}

export default function HealthScoreCard({ instance }) {
  const navigate = useNavigate();
  const stale = isStale(instance.timestamp);
  const score = stale ? null : instance.health_score;
  const color = healthColor(score);
  const hostname = instance.hostname || '';

  return (
    <div
      className={`health-card ${stale ? 'health-card--stale' : ''}`}
      onClick={() => navigate(`/device/${encodeURIComponent(instance.ip_address)}/instance/${encodeURIComponent(instance.instance_name)}`)}
    >
      <div className="health-card__header">
        <div className="health-card__icon">{DB_TYPE_ICONS[instance.db_type] || '?'}</div>
        <div>
          <div className="health-card__name">{instance.instance_name}</div>
          <div className="health-card__meta">
            {hostname && <><strong>{hostname}</strong> &middot; </>}
            {instance.db_type.toUpperCase()} &middot; {instance.ip_address}:{instance.db_port}
          </div>
        </div>
      </div>
      <div className="health-card__score">
        <span className="health-card__number" style={{ color }}>
          {score != null ? Math.round(score) : '--'}
        </span>
        <span className="health-card__label">
          {stale ? 'Inactive' : healthLabel(score)}
        </span>
      </div>
      <div className="health-card__footer">
        <span className={`status-badge ${stale ? 'status-badge--stale' : 'status-badge--up'}`}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {stale ? 'Inactive' : 'Online'}
        </span>
        <span className="health-card__ts">{formatTs(instance.timestamp)}</span>
      </div>
    </div>
  );
}
