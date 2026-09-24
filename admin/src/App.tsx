import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, SuperAdminRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersList } from './pages/Users/UsersList';
import { UserDetail } from './pages/Users/UserDetail';
import { Dogs } from './pages/Dogs';
import { WalksList } from './pages/Walks/WalksList';
import { WalkDetail } from './pages/Walks/WalkDetail';
import { EventsList } from './pages/Events/EventsList';
import { EventDetail } from './pages/Events/EventDetail';
import { Places } from './pages/Places';
import { Matches } from './pages/Matches';
import { Messages } from './pages/Messages';
import { Uploads } from './pages/Uploads';
import { AuditLog } from './pages/AuditLog';
import { Admins } from './pages/Admins';

export const App: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/users/:id" element={<UserDetail />} />
              <Route path="/dogs" element={<Dogs />} />
              <Route path="/walks" element={<WalksList />} />
              <Route path="/walks/:id" element={<WalkDetail />} />
              <Route path="/events" element={<EventsList />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/places" element={<Places />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/uploads" element={<Uploads />} />
              <Route path="/audit" element={<AuditLog />} />
              <Route element={<SuperAdminRoute />}>
                <Route path="/admins" element={<Admins />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
