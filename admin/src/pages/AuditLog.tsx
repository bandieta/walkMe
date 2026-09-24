import React from 'react';
import { audit } from '../api/resources';
import { AuditEntry } from '../api/types';
import { usePaginated } from '../hooks/usePaginated';
import { DataTable, Column } from '../components/DataTable';

export const AuditLog: React.FC = () => {
  const { data, loading, error, page, setPage } = usePaginated(audit.list);

  const columns: Column<AuditEntry>[] = [
    { key: 'when', label: 'When', render: (a) => new Date(a.createdAt).toLocaleString() },
    { key: 'admin', label: 'Admin', render: (a) => a.adminName },
    { key: 'action', label: 'Action', render: (a) => <code style={{ fontSize: 12 }}>{a.action}</code> },
    { key: 'target', label: 'Target', render: (a) => `${a.targetType} · ${a.targetId.slice(0, 8)}…` },
    { key: 'meta', label: 'Details', render: (a) => <span className="cell-muted" style={{ fontSize: 12 }}>{a.meta ? JSON.stringify(a.meta) : ''}</span> },
  ];

  return <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} rowKey={(a) => a.id} emptyLabel="No admin actions recorded yet." />;
};
