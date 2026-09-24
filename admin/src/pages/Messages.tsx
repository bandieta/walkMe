import React, { useState } from 'react';
import { messages } from '../api/resources';
import { AdminMessage } from '../api/types';
import { usePaginated } from '../hooks/usePaginated';
import { DataTable, Column } from '../components/DataTable';
import { Toolbar, SearchInput } from '../components/Toolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

export const Messages: React.FC = () => {
  const { data, loading, error, page, setPage, q, setQuery, reload } = usePaginated(messages.list);
  const [target, setTarget] = useState<AdminMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await messages.remove(target.id);
      toast('Message deleted.', 'success');
      setTarget(null);
      reload();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminMessage>[] = [
    { key: 'sender', label: 'From', render: (m) => m.senderName },
    { key: 'content', label: 'Message', render: (m) => <span style={{ display: 'inline-block', maxWidth: 420 }}>{m.type === 'text' ? m.content : `[${m.type}]`}</span> },
    { key: 'room', label: 'Room', render: (m) => <span className="cell-muted" style={{ fontSize: 12 }}>{m.walkId ? 'Walk' : 'Match'}</span> },
    { key: 'when', label: 'Sent', render: (m) => new Date(m.createdAt).toLocaleString() },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (m) => (
        <button className="btn btn-sm btn-danger" onClick={() => setTarget(m)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search message content…" />
      </Toolbar>
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} rowKey={(m) => m.id} />
      <ConfirmDialog
        open={!!target}
        title="Delete this message?"
        message="It will be permanently removed from the conversation."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};
