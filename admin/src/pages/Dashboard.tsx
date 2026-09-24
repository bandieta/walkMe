import React, { useEffect, useState } from 'react';
import { dashboard } from '../api/resources';
import { DashboardStats } from '../api/types';
import { StatTile } from '../components/StatTile';
import { Sparkline } from '../components/Sparkline';
import { apiErrorMessage } from '../api/client';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboard
      .stats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  if (error) return <div className="state-message" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!stats) return <div className="state-message">Loading…</div>;

  const last7 = stats.signupsByDay.slice(-7).reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="stat-grid">
        <StatTile label="Total users" value={stats.users.total} sub={`${stats.users.active7d} active this week`} />
        <StatTile label="Suspended / banned" value={stats.users.suspended} />
        <StatTile label="Dogs" value={stats.dogs} />
        <StatTile label="Walks" value={stats.walks.total} sub={stats.walks.live ? `${stats.walks.live} live now` : 'none live now'} />
        <StatTile label="Events" value={stats.events} />
        <StatTile label="Matches" value={stats.matches} />
        <StatTile label="Messages sent" value={stats.messages} />
        <StatTile label="Places listed" value={stats.places} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div className="section-title" style={{ margin: 0 }}>
            Signups, last 30 days
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{last7} in the last 7 days</div>
        </div>
        <Sparkline values={stats.signupsByDay.map((d) => d.count)} />
      </div>
    </div>
  );
};
