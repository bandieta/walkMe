import React, { useEffect, useState } from 'react';
import { admins } from '../api/resources';
import { AdminMe } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

const emptyForm = { email: '', password: '', displayName: '', role: 'admin' as 'admin' | 'superadmin' };

export const Admins: React.FC = () => {
  const { admin: self } = useAuth();
  const [list, setList] = useState<AdminMe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [target, setTarget] = useState<AdminMe | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () => {
    admins
      .list()
      .then((res) => setList(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  };
  useEffect(load, []);

  const create = async () => {
    setBusy(true);
    try {
      await admins.create(form);
      toast('Admin account created.', 'success');
      setCreating(false);
      setForm(emptyForm);
      load();
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
      await admins.remove(target.id);
      toast('Admin removed.', 'success');
      setTarget(null);
      load();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="state-message" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!list) return <div className="state-message">Loading…</div>;

  return (
    <div>
      <div className="table-toolbar">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + Invite admin
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Role</th>
              <th>Last login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="row-user-name">{a.displayName}</div>
                  <div className="cell-muted" style={{ fontSize: 12 }}>
                    {a.email}
                  </div>
                </td>
                <td>
                  <Badge tone={a.role === 'superadmin' ? 'accent' : 'default'}>{a.role}</Badge>
                </td>
                <td className="cell-muted">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : 'Never'}</td>
                <td>
                  {a.id !== self?.id && (
                    <div className="cell-actions">
                      <button className="btn btn-sm btn-danger" onClick={() => setTarget(a)}>
                        Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Invite an admin" sub="They'll sign in with this email and password." width={400}>
        <div className="field">
          <label className="label">Name</label>
          <input className="input" style={{ width: '100%' }} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" style={{ width: '100%' }} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Temporary password</label>
          <input className="input" style={{ width: '100%' }} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </div>
        <div className="field">
          <label className="label">Role</label>
          <select className="select" style={{ width: '100%' }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'superadmin' })}>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin (can manage other admins)</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setCreating(false)} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={create} disabled={busy || !form.email || form.password.length < 8 || !form.displayName}>
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!target}
        title="Remove this admin?"
        message={`${target?.displayName ?? ''} will lose access to the admin panel immediately.`}
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};
