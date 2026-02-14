import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Importar páginas
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import OSDetails from './pages/OSDetails';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Layout from './Layout';
import Login from './pages/Login';
import { socketService } from './api/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
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
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout currentPageName="Dashboard">
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute>
              <Layout currentPageName="Histórico">
                <History />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/os/:id" element={
            <ProtectedRoute>
              <Layout currentPageName="Detalhes da OS">
                <OSDetails />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute requireAdmin>
              <Layout currentPageName="Usuários">
                <Users />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout currentPageName="Meu Perfil">
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute requireAdmin>
              <Layout currentPageName="Configurações">
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">404 - Página não encontrada</h1>
                <p className="text-slate-600 mb-4">A página que você está procurando não existe.</p>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Voltar para o Dashboard
                </a>
              </div>
            </div>
          } />
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;