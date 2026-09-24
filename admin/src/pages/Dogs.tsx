import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dogs } from '../api/resources';
import { AdminDog } from '../api/types';
import { usePaginated } from '../hooks/usePaginated';
import { DataTable, Column } from '../components/DataTable';
import { Toolbar, SearchInput } from '../components/Toolbar';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

export const Dogs: React.FC = () => {
  const { data, loading, error, page, setPage, q, setQuery, reload } = usePaginated(dogs.list);
  const [target, setTarget] = useState<AdminDog | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await dogs.remove(target.id);
      toast('Dog removed.', 'success');
      setTarget(null);
      reload();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminDog>[] = [
    {
      key: 'dog',
      label: 'Dog',
      render: (d) => (
        <div className="row-user">
          <Avatar name={d.name} photoUrl={d.photoUrl} size={30} />
          <div>
            <div className="row-user-name">{d.name}</div>
            <div className="cell-muted" style={{ fontSize: 12 }}>
              {d.breed}
              {d.age ? ` · ${d.age}y` : ''}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'owner', label: 'Owner', render: (d) => <Link to={`/users/${d.ownerId}`}>{d.ownerName}</Link> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (d) => (
        <div className="cell-actions">
          <button className="btn btn-sm btn-danger" onClick={() => setTarget(d)}>
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search name or breed…" />
      </Toolbar>
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} rowKey={(d) => d.id} />
      <ConfirmDialog
        open={!!target}
        title="Remove this dog's profile?"
        message={`${target?.name ?? ''} will be removed from ${target?.ownerName ?? 'its owner'}'s profile.`}
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};
