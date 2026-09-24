import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { users } from '../../api/resources';
import { AdminUserRow } from '../../api/types';
import { usePaginated } from '../../hooks/usePaginated';
import { DataTable, Column } from '../../components/DataTable';
import { Toolbar, SearchInput, FilterSelect } from '../../components/Toolbar';
import { Avatar } from '../../components/Avatar';
import { Badge, statusTone } from '../../components/Badge';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
];
const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'apple', label: 'Apple' },
  { value: 'dev', label: 'Dev' },
];

export const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const { data, loading, error, page, setPage, q, setQuery } = usePaginated(users.list, { status, provider });

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'user',
      label: 'User',
      render: (u) => (
        <div className="row-user">
          <Avatar name={u.displayName} photoUrl={u.photoUrl} size={30} />
          <div>
            <div className="row-user-name">{u.displayName}</div>
            <div className="cell-muted" style={{ fontSize: 12 }}>
              {u.email ?? '—'}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'provider', label: 'Provider', render: (u) => <span style={{ textTransform: 'capitalize' }}>{u.provider}</span> },
    { key: 'status', label: 'Status', render: (u) => <Badge tone={statusTone(u.status)}>{u.status}</Badge> },
    { key: 'dogs', label: 'Dogs', render: (u) => u.dogCount },
    { key: 'walks', label: 'Walks hosted', render: (u) => u.walksHosted },
    { key: 'joined', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search name or email…" />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={provider}
          onChange={(v) => {
            setProvider(v);
            setPage(1);
          }}
          options={PROVIDER_OPTIONS}
          placeholder="All providers"
        />
      </Toolbar>
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} onRowClick={(u) => navigate(`/users/${u.id}`)} rowKey={(u) => u.id} />
    </div>
  );
};
