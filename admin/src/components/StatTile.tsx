import React from 'react';

export const StatTile: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => (
  <div className="stat-tile">
    <div className="stat-tile-label">{label}</div>
    <div className="stat-tile-value">{value}</div>
    {sub && <div className="stat-tile-sub">{sub}</div>}
  </div>
);
