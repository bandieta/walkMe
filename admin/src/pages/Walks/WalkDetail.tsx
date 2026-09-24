import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { walks } from '../../api/resources';
import { AdminWalkDetail } from '../../api/types';
import { Badge, statusTone } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../api/client';

const STATUSES = ['upcoming', 'live', 'ended'];

export const WalkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [walk, setWalk] = useState<AdminWalkDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    if (!id) return;
    walks
      .get(id)
      .then((res) => setWalk(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  };
  useEffect(load, [id]);

  const setStatus = async (status: string) => {
    if (!id) return;
    setBusy(true);
    try {
      await walks.update(id, { status });
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
      await walks.remove(id);
      toast('Walk deleted.', 'success');
      navigate('/walks');
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
      setBusy(false);
    }
  };

  if (error) return <div className="state-message" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!walk) return <div className="state-message">Loading…</div>;

  return (
    <div>
      <Link to="/walks" className="back-link">
        ← All walks
      </Link>

      <div className="detail-header">
        <div>
          <div style={{ fontSize: 19, fontWeight: 500 }}>{walk.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{walk.meetingPoint}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <Badge tone={statusTone(walk.status)}>{walk.status}</Badge>
            <Badge>{walk.category}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUSES.filter((s) => s !== walk.status).map((s) => (
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
          <div className="section-title">Details</div>
          <div className="kv">
            <span className="kv-label">Host</span>
            <Link to={`/users/${walk.host.id}`}>{walk.host.displayName}</Link>
          </div>
          <div className="kv">
            <span className="kv-label">Scheduled</span>
            <span>{new Date(walk.scheduledAt).toLocaleString()}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Duration</span>
            <span>{walk.duration}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Capacity</span>
            <span>
              {walk.participants.length}/{walk.maxParticipants}
            </span>
          </div>
          <div className="kv">
            <span className="kv-label">Coordinates</span>
            <span>
              {walk.meetingLat.toFixed(4)}, {walk.meetingLng.toFixed(4)}
            </span>
          </div>
          {walk.description && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>{walk.description}</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Participants</div>
          {walk.participants.map((p) => (
            <div key={p.id} className="kv">
              <Link to={`/users/${p.id}`}>{p.displayName}</Link>
              <span className="kv-label">{p.email ?? ''}</span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this walk?"
        message="Participants will no longer see it. This cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
