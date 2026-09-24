import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

const NAV: { to: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
];

const COMMUNITY_NAV: { to: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/dogs', label: 'Dogs', icon: 'dog' },
  { to: '/walks', label: 'Walks', icon: 'walk' },
  { to: '/events', label: 'Events', icon: 'event' },
  { to: '/places', label: 'Places', icon: 'place' },
];

const MODERATION_NAV: { to: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { to: '/matches', label: 'Matches', icon: 'match' },
  { to: '/messages', label: 'Messages', icon: 'chat' },
  { to: '/uploads', label: 'Uploads', icon: 'upload' },
];

const SYSTEM_NAV: { to: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [{ to: '/audit', label: 'Audit log', icon: 'log' }];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/dogs': 'Dogs',
  '/walks': 'Walks',
  '/events': 'Events',
  '/places': 'Places',
  '/matches': 'Matches',
  '/messages': 'Messages',
  '/uploads': 'Uploads',
  '/audit': 'Audit log',
  '/admins': 'Admin accounts',
};

function NavGroup({ title, items }: { title: string; items: typeof NAV }) {
  return (
    <>
      <div className="sidebar-section">{title}</div>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export const Layout: React.FC = () => {
  const { admin, logout } = useAuth();

  const title = PAGE_TITLES[location.pathname.replace(import.meta.env.BASE_URL.slice(0, -1), '') || '/'] ?? 'walkMe Admin';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">W</div>
          <div className="sidebar-brand-name">walkMe Admin</div>
        </div>

        <NavGroup title="Overview" items={NAV} />
        <NavGroup title="Community" items={COMMUNITY_NAV} />
        <NavGroup title="Moderation" items={MODERATION_NAV} />
        <NavGroup title="System" items={SYSTEM_NAV} />
        {admin?.role === 'superadmin' && (
          <>
            <div className="sidebar-section">Admin</div>
            <NavLink to="/admins" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon name="shield" />
              Admin accounts
            </NavLink>
          </>
        )}

        <div className="sidebar-footer">
          <button className="nav-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }} onClick={logout}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-user">
            {admin?.displayName} · <Badge role={admin?.role} />
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

function Badge({ role }: { role?: string }) {
  return <span style={{ textTransform: 'capitalize', color: 'var(--accent-300)' }}>{role}</span>;
}
