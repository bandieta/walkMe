import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { events } from '../../api/resources';
import { AdminEventDetail } from '../../api/types';
import { Badge, statusTone } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../api/client';

const STATUSES = ['upcoming', 'live', 'ended'];

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState<AdminEventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    if (!id) return;
    events
      .get(id)
      .then((res) => setEvent(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  };
  useEffect(load, [id]);

  const setStatus = async (status: string) => {
    if (!id) return;
    setBusy(true);
    try {
      await events.update(id, { status });
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
      await events.remove(id);
      toast('Event deleted.', 'success');
      navigate('/events');
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
      setBusy(false);
    }
  };

  if (error) return <div className="state-message" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!event) return <div className="state-message">Loading…</div>;

  return (
    <div>
      <Link to="/events" className="back-link">
        ← All events
      </Link>

      <div className="detail-header">
        <div>
          <div style={{ fontSize: 19, fontWeight: 500 }}>{event.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{event.location}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            <Badge tone={statusTone(event.status)}>{event.status}</Badge>
            <Badge>{event.category}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUSES.filter((s) => s !== event.status).map((s) => (
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
            <span className="kv-label">Organizer</span>
            <Link to={`/users/${event.organizer.id}`}>{event.organizer.displayName}</Link>
          </div>
          <div className="kv">
            <span className="kv-label">Date</span>
            <span>{new Date(event.date).toLocaleString()}</span>
          </div>
          <div className="kv">
            <span className="kv-label">Capacity</span>
            <span>
              {event.participants.length}/{event.maxParticipants}
            </span>
          </div>
          <div className="kv">
            <span className="kv-label">Coordinates</span>
            <span>
              {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
            </span>
          </div>
          {event.description && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>{event.description}</div>}
        </div>

        <div className="card">
          <div className="section-title">Participants</div>
          {event.participants.map((p) => (
            <div key={p.id} className="kv">
              <Link to={`/users/${p.id}`}>{p.displayName}</Link>
              <span className="kv-label">{p.email ?? ''}</span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this event?"
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
