import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { matches } from '../api/resources';
import { AdminMatch } from '../api/types';
import { usePaginated } from '../hooks/usePaginated';
import { DataTable, Column } from '../components/DataTable';
import { Toolbar, SearchInput } from '../components/Toolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

export const Matches: React.FC = () => {
  const { data, loading, error, page, setPage, q, setQuery, reload } = usePaginated(matches.list);
  const [target, setTarget] = useState<AdminMatch | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await matches.remove(target.id);
      toast('Match removed.', 'success');
      setTarget(null);
      reload();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminMatch>[] = [
    {
      key: 'pair',
      label: 'Match',
      render: (m) => (
        <span>
          <Link to={`/users/${m.userAId}`}>{m.userAName}</Link> <span className="cell-muted">×</span> <Link to={`/users/${m.userBId}`}>{m.userBName}</Link>
        </span>
      ),
    },
    { key: 'matched', label: 'Matched', render: (m) => new Date(m.matchedAt).toLocaleDateString() },
    { key: 'last', label: 'Last message', render: (m) => <span className="cell-muted">{m.lastMessage || '—'}</span> },
    { key: 'lastAt', label: 'Last activity', render: (m) => new Date(m.lastMessageAt).toLocaleString() },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (m) => (
        <button className="btn btn-sm btn-danger" onClick={() => setTarget(m)}>
          Unmatch
        </button>
      ),
    },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search by name…" />
      </Toolbar>
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} rowKey={(m) => m.id} />
      <ConfirmDialog
        open={!!target}
        title="Unmatch these users?"
        message="Their match and chat thread will be permanently removed."
        confirmLabel="Unmatch"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};
