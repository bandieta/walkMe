import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walks } from '../../api/resources';
import { AdminWalkRow } from '../../api/types';
import { usePaginated } from '../../hooks/usePaginated';
import { DataTable, Column } from '../../components/DataTable';
import { Toolbar, SearchInput, FilterSelect } from '../../components/Toolbar';
import { Badge, statusTone } from '../../components/Badge';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
];

export const WalksList: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const { data, loading, error, page, setPage, q, setQuery } = usePaginated(walks.list, { status });

  const columns: Column<AdminWalkRow>[] = [
    { key: 'title', label: 'Walk', render: (w) => <span style={{ fontWeight: 500 }}>{w.title}</span> },
    { key: 'host', label: 'Host', render: (w) => w.hostName },
    { key: 'when', label: 'Scheduled', render: (w) => new Date(w.scheduledAt).toLocaleString() },
    { key: 'meeting', label: 'Meeting point', render: (w) => <span className="cell-muted">{w.meetingPoint}</span> },
    { key: 'people', label: 'Participants', render: (w) => `${w.participantCount}/${w.maxParticipants}` },
    { key: 'status', label: 'Status', render: (w) => <Badge tone={statusTone(w.status)}>{w.status}</Badge> },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search title or meeting point…" />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
      </Toolbar>
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} onRowClick={(w) => navigate(`/walks/${w.id}`)} rowKey={(w) => w.id} />
    </div>
  );
};
