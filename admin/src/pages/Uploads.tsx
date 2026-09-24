import React, { useEffect, useState } from 'react';
import { uploads } from '../api/resources';
import { AdminUpload } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const Uploads: React.FC = () => {
  const [files, setFiles] = useState<AdminUpload[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<AdminUpload | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () => {
    uploads
      .list()
      .then((res) => setFiles(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  };
  useEffect(load, []);

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await uploads.remove(target.name);
      toast('File deleted.', 'success');
      setTarget(null);
      load();
    } catch (err) {
      toast(apiErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="state-message" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!files) return <div className="state-message">Loading…</div>;

  const totalSize = files.reduce((s, f) => s + f.sizeBytes, 0);

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {files.length} files · {formatBytes(totalSize)} total
      </div>
      {files.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">No uploaded files yet.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {files.map((f) => (
            <div key={f.name} className="card" style={{ padding: 10 }}>
              <div style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: 'var(--bg)', marginBottom: 8 }}>
                <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 4 }}>{f.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatBytes(f.sizeBytes)}</span>
                <button className="btn btn-sm btn-danger" onClick={() => setTarget(f)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        title="Delete this file?"
        message="Any profile, dog, walk, or event photo referencing it will break."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};
