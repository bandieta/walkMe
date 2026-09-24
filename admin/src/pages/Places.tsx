import React, { useState } from 'react';
import { places } from '../api/resources';
import { AdminPlace } from '../api/types';
import { usePaginated } from '../hooks/usePaginated';
import { DataTable, Column } from '../components/DataTable';
import { Toolbar, SearchInput } from '../components/Toolbar';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

const emptyForm = { name: '', category: '', address: '', lat: '', lng: '', emoji: '', description: '', tags: '', isOpen: true };

export const Places: React.FC = () => {
  const { data, loading, error, page, setPage, q, setQuery, reload } = usePaginated(places.list);
  const [editing, setEditing] = useState<AdminPlace | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [target, setTarget] = useState<AdminPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };
  const openEdit = (p: AdminPlace) => {
    setForm({
      name: p.name,
      category: p.category,
      address: p.address,
      lat: String(p.lat),
      lng: String(p.lng),
      emoji: p.emoji ?? '',
      description: p.description ?? '',
      tags: p.tags.join(', '),
      isOpen: p.isOpen,
    });
    setEditing(p);
  };
  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const save = async () => {
    setBusy(true);
    const payload = {
      name: form.name,
      category: form.category,
      address: form.address,
      lat: Number(form.lat),
      lng: Number(form.lng),
      emoji: form.emoji || undefined,
      description: form.description || undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isOpen: form.isOpen,
    };
    try {
      if (editing) {
        await places.update(editing.id, payload);
        toast('Place updated.', 'success');
      } else {
        await places.create(payload);
        toast('Place created.', 'success');
      }
      closeModal();
      reload();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await places.remove(target.id);
      toast('Place removed.', 'success');
      setTarget(null);
      reload();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<AdminPlace>[] = [
    { key: 'name', label: 'Place', render: (p) => <span style={{ fontWeight: 500 }}>{p.emoji ? `${p.emoji} ` : ''}{p.name}</span> },
    { key: 'category', label: 'Category', render: (p) => <span style={{ textTransform: 'capitalize' }}>{p.category}</span> },
    { key: 'address', label: 'Address', render: (p) => <span className="cell-muted">{p.address}</span> },
    { key: 'rating', label: 'Rating', render: (p) => `${p.rating.toFixed(1)} (${p.reviewCount})` },
    { key: 'open', label: 'Open', render: (p) => (p.isOpen ? <Badge tone="success">Open</Badge> : <Badge>Closed</Badge>) },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <div className="cell-actions">
          <button className="btn btn-sm" onClick={() => openEdit(p)}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => setTarget(p)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  const modalOpen = creating || !!editing;

  return (
    <div>
      <Toolbar>
        <SearchInput value={q} onChange={setQuery} placeholder="Search name or address…" />
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openCreate}>
          + Add place
        </button>
      </Toolbar>
      <DataTable columns={columns} data={data} loading={loading} error={error} page={page} onPageChange={setPage} rowKey={(p) => p.id} />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit place' : 'Add a place'} width={480}>
        <div className="field">
          <label className="label">Name</label>
          <input className="input" style={{ width: '100%' }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Category</label>
            <input className="input" style={{ width: '100%' }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="park, cafe, vet…" />
          </div>
          <div className="field" style={{ width: 64 }}>
            <label className="label">Emoji</label>
            <input className="input" style={{ width: '100%' }} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label className="label">Address</label>
          <input className="input" style={{ width: '100%' }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Latitude</label>
            <input className="input" style={{ width: '100%' }} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Longitude</label>
            <input className="input" style={{ width: '100%' }} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label className="label">Tags (comma-separated)</label>
          <input className="input" style={{ width: '100%' }} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Description</label>
          <textarea className="input" style={{ width: '100%' }} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} />
          Currently open
        </label>

        <div className="modal-actions">
          <button className="btn" onClick={closeModal} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !form.name || !form.address}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create place'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!target}
        title="Delete this place?"
        message={`"${target?.name ?? ''}" will be removed from the app.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};
