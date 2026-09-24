import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { users } from '../../api/resources';
import { AdminUserDetail, UserStatus } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Badge, statusTone } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../api/client';

const STATUSES: UserStatus[] = ['active', 'suspended', 'banned'];

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    if (!id) return;
    users
      .get(id)
      .then((res) => setUser(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  };

  useEffect(load, [id]);

  const setStatus = async (status: UserStatus) => {
    if (!id) return;
    setBusy(true);
    try {
      await users.update(id, { status });
      toast(`Marked ${status}.`, 'success');
      load();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await users.remove(id);
      toast('User deleted.', 'success');
      navigate('/users');
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
      setBusy(false);
    }
  };

  if (error) return <div className="state-message" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!user) return <div className="state-message">Loading…</div>;

  return (
    <div>
      <Link to="/users" className="back-link">
        ← All users
      </Link>

      <div className="detail-header">
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar name={user.displayName} photoUrl={user.photoUrl} size={56} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 500 }}>{user.displayName}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.email ?? 'No email on file'}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <Badge tone={statusTone(user.status)}>{user.status}</Badge>
              <Badge>{user.provider}</Badge>
              {user.onboarded && <Badge tone="accent">onboarded</Badge>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUSES.filter((s) => s !== user.status).map((s) => (
            <button key={s} className="btn btn-sm" disabled={busy} onClick={() => setStatus(s)}>
              Mark {s}
            </button>
          ))}
          <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="section-title">Profile</div>
          <div className="kv">
            <span className="kv-label">Bio</span>
            <span>{user.bio || '—'}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Location</span>
            <span>{user.location || '—'}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Joined</span>
            <span>{new Date(user.createdAt).toLocaleString()}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Dogs</span>
            <span>{user.dogCount}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Walks hosted / joined</span>
            <span>
              {user.walksHosted} / {user.walksJoined}
            </span>
          </div>
          <div className="kv">
            <span className="kv-label">Matches</span>
            <span>{user.matchCount}</span>
          </div>

          {user.dogs.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 18 }}>
                Dogs
              </div>
              {user.dogs.map((d) => (
                <div key={d.id} className="kv">
                  <span>{d.name}</span>
                  <span className="kv-label">{d.breed}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="card">
          <div className="section-title">Recent hosted walks</div>
          {user.hostedWalks.length === 0 ? (
            <div className="cell-muted">None yet.</div>
          ) : (
            user.hostedWalks.map((w) => (
              <div key={w.id} className="kv">
                <Link to={`/walks/${w.id}`}>{w.title}</Link>
                <Badge tone={statusTone(w.status)}>{w.status}</Badge>
              </div>
            ))
          )}

          <div className="section-title" style={{ marginTop: 18 }}>
            Recent joined walks
          </div>
          {user.joinedWalks.length === 0 ? (
            <div className="cell-muted">None yet.</div>
          ) : (
            user.joinedWalks.map((w) => (
              <div key={w.id} className="kv">
                <Link to={`/walks/${w.id}`}>{w.title}</Link>
                <Badge tone={statusTone(w.status)}>{w.status}</Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this user?"
        message="This permanently removes their profile, dogs, and hosted walks. This cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
