import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

export const Login: React.FC = () => {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Sign-in failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} className="card" style={{ width: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div className="sidebar-brand-mark">W</div>
          <div style={{ fontSize: 17, fontWeight: 500 }}>walkMe Admin</div>
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="input" style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="input" style={{ width: '100%' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && (
          <div style={{ color: 'var(--error)', fontSize: 12.5, marginBottom: 12 }}>{error}</div>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
