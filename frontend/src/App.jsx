// frontend/src/App.jsx  ← APP CLIENTE
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import OSDetails from './pages/OSDetails';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ServerConfig from './pages/ServerConfig';
import Layout from './Layout';
import Login from './pages/Login';
import { socketService } from './api/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function isServerConfigured() {
  try {
    const s = localStorage.getItem('serverConfig');
    return !!(s && JSON.parse(s)?.baseURL);
  } catch { return false; }
}

function RequireServer({ children }) {
  if (!isServerConfigured()) return <Navigate to="/setup" replace />;
  return children;
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Gerencia o socket e invalida o cache do React Query em tempo real.
// IMPORTANTE: NÃO desconecta o socket no cleanup — ele deve persistir durante toda
// a sessão. Apenas o destroy() chamado no logout encerra a conexão.
function SocketManager() {
  const qc = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !isServerConfigured()) return;

    socketService.connect(token); // no-op se já estiver conectado

    const onCreated = () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    };

    const onUpdated = ({ order }) => {
      if (order?.id) qc.setQueryData(['order', String(order.id)], order);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    };

    const onDeleted = () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    };

    const onComment = ({ osId }) => {
      if (osId) qc.invalidateQueries({ queryKey: ['order', String(osId)] });
    };

    socketService.on('os:created', onCreated);
    socketService.on('os:updated', onUpdated);
    socketService.on('os:deleted', onDeleted);
    socketService.on('os:comment', onComment);

    return () => {
      // Remove só os listeners deste efeito. NÃO chama disconnect().
      socketService.off('os:created', onCreated);
      socketService.off('os:updated', onUpdated);
      socketService.off('os:deleted', onDeleted);
      socketService.off('os:comment', onComment);
    };
  }, [qc]);

  return null;
}

export default function App() {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        <SocketManager />
        <Routes>
          <Route path="/setup" element={<ServerConfig />} />

          <Route path="/login" element={
            <RequireServer><Login /></RequireServer>
          } />

          <Route path="/dashboard" element={
            <RequireServer><ProtectedRoute>
              <Layout currentPageName="Dashboard"><Dashboard /></Layout>
            </ProtectedRoute></RequireServer>
          } />

          <Route path="/history" element={
            <RequireServer><ProtectedRoute>
              <Layout currentPageName="Histórico"><History /></Layout>
            </ProtectedRoute></RequireServer>
          } />

          <Route path="/os/:id" element={
            <RequireServer><ProtectedRoute>
              <Layout currentPageName="Detalhes da OS"><OSDetails /></Layout>
            </ProtectedRoute></RequireServer>
          } />

          <Route path="/users" element={
            <RequireServer><ProtectedRoute requireAdmin>
              <Layout currentPageName="Usuários"><Users /></Layout>
            </ProtectedRoute></RequireServer>
          } />

          <Route path="/profile" element={
            <RequireServer><ProtectedRoute>
              <Layout currentPageName="Meu Perfil"><Profile /></Layout>
            </ProtectedRoute></RequireServer>
          } />

          <Route path="/settings" element={
            <RequireServer><ProtectedRoute requireAdmin>
              <Layout currentPageName="Configurações"><Settings /></Layout>
            </ProtectedRoute></RequireServer>
          } />

          <Route index element={
            isServerConfigured()
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/setup" replace />
          } />

          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">404 — Página não encontrada</h1>
                <a href="#/dashboard" className="text-blue-600 hover:text-blue-800">Voltar ao Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </QueryClientProvider>
    </HashRouter>
  );
}