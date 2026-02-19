// frontend/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Verifica se o servidor está configurado
function isServerConfigured() {
  try {
    const saved = localStorage.getItem('serverConfig');
    if (!saved) return false;
    const config = JSON.parse(saved);
    return !!config?.baseURL;
  } catch {
    return false;
  }
}

function RequireServer({ children }) {
  if (!isServerConfigured()) {
    return <Navigate to="/setup" replace />;
  }
  return children;
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isServerConfigured()) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        <Routes>

          {/* Configuração do servidor (primeira vez ou troca) */}
          <Route path="/setup" element={<ServerConfig />} />

          {/* Login — requer servidor configurado */}
          <Route path="/login" element={
            <RequireServer>
              <Login />
            </RequireServer>
          } />

          {/* Rotas protegidas */}
          <Route path="/dashboard" element={
            <RequireServer>
              <ProtectedRoute>
                <Layout currentPageName="Dashboard">
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            </RequireServer>
          } />

          <Route path="/history" element={
            <RequireServer>
              <ProtectedRoute>
                <Layout currentPageName="Histórico">
                  <History />
                </Layout>
              </ProtectedRoute>
            </RequireServer>
          } />

          <Route path="/os/:id" element={
            <RequireServer>
              <ProtectedRoute>
                <Layout currentPageName="Detalhes da OS">
                  <OSDetails />
                </Layout>
              </ProtectedRoute>
            </RequireServer>
          } />

          <Route path="/users" element={
            <RequireServer>
              <ProtectedRoute requireAdmin>
                <Layout currentPageName="Usuários">
                  <Users />
                </Layout>
              </ProtectedRoute>
            </RequireServer>
          } />

          <Route path="/profile" element={
            <RequireServer>
              <ProtectedRoute>
                <Layout currentPageName="Meu Perfil">
                  <Profile />
                </Layout>
              </ProtectedRoute>
            </RequireServer>
          } />

          <Route path="/settings" element={
            <RequireServer>
              <ProtectedRoute requireAdmin>
                <Layout currentPageName="Configurações">
                  <Settings />
                </Layout>
              </ProtectedRoute>
            </RequireServer>
          } />

          {/* Redireciona raiz: se não tem servidor → setup, se tem → dashboard */}
          <Route index element={
            isServerConfigured()
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/setup" replace />
          } />

          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">404 - Página não encontrada</h1>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Voltar ao Dashboard</a>
              </div>
            </div>
          } />

        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;