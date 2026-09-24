import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { events } from '../../api/resources';
import { AdminEventRow } from '../../api/types';
import { usePaginated } from '../../hooks/usePaginated';
import { DataTable, Column } from '../../components/DataTable';
import { Toolbar, SearchInput, FilterSelect } from '../../components/Toolbar';
import { Badge, statusTone } from '../../components/Badge';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
];

export const EventsList: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const { data, loading, error, page, setPage, q, setQuery } = usePaginated(events.list, { status });

  const columns: Column<AdminEventRow>[] = [
    { key: 'title', label: 'Event', render: (e) => <span style={{ fontWeight: 500 }}>{e.emoji ? `${e.emoji} ` : ''}{e.title}</span> },
    { key: 'organizer', label: 'Organizer', render: (e) => e.organizerName },
    { key: 'when', label: 'Date', render: (e) => new Date(e.date).toLocaleString() },
    { key: 'location', label: 'Location', render: (e) => <span className="cell-muted">{e.location}</span> },
    { key: 'people', label: 'Participants', render: (e) => `${e.participantCount}/${e.maxParticipants}` },
    { key: 'status', label: 'Status', render: (e) => <Badge tone={statusTone(e.status)}>{e.status}</Badge> },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search title or location…" />
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
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} onRowClick={(e) => navigate(`/events/${e.id}`)} rowKey={(e) => e.id} />
    </div>
  );
};
