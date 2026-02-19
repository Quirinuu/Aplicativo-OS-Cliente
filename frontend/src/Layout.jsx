// frontend/src/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  ClipboardList,
  Archive,
  Users,
  LogOut,
  User,
  Menu,
  X,
  Wrench,
  Shield,
  Settings,
  Home,
  Wifi,
  WifiOff,
  Server,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from '@/api/client';
import { socketService } from '@/api/socket';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.auth.me()
      .then(userData => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      })
      .catch(() => {
        if (location.pathname !== '/login') navigate('/login');
      });
  }, [navigate, location.pathname]);

  // Monitora status do WebSocket
  useEffect(() => {
    setIsConnected(socketService.isConnected);
    const cleanup = socketService.onConnectionChange(setIsConnected);
    return cleanup;
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    socketService.disconnect();
    navigate('/login');
    toast.success('Logout realizado');
  };

  const handleChangeServer = () => {
    // Limpa tudo e manda pra tela de configuração
    api.auth.logout();
    socketService.disconnect();
    localStorage.removeItem('serverConfig');
    navigate('/setup');
    toast.info('Configure o servidor');
  };

  const isAdmin = user?.role === 'admin';

  // Verifica se existe tela de setup (app cliente)
  const hasSetupPage = !!localStorage.getItem('serverConfig');

  const navItems = [
    { name: 'Dashboard', label: 'OS Abertas', icon: ClipboardList, path: '/dashboard' },
    { name: 'History', label: 'Histórico', icon: Archive, path: '/history' },
    ...(isAdmin ? [{ name: 'Users', label: 'Usuários', icon: Users, path: '/users' }] : [])
  ];

  const getPageTitle = () => {
    if (currentPageName) return currentPageName;
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/history': return 'Histórico';
      case '/users': return 'Usuários';
      case '/profile': return 'Meu Perfil';
      default: return 'OS Manager';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">

          {/* Logo e Menu Mobile */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <span className="hidden md:inline text-xl font-bold text-gray-900">OS Manager</span>
              <span className="md:hidden text-xl font-bold text-gray-900">OS</span>
            </Link>
          </div>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center space-x-6 ml-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Título da página */}
          <div className="flex-1 flex justify-center md:justify-start md:ml-10">
            <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>

          {/* Indicador de conexão + Menu usuário */}
          <div className="flex items-center space-x-3">

            {/* Badge de status WebSocket */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
              title={isConnected ? 'Sincronização em tempo real ativa' : 'Sem conexão com o servidor'}
            >
              {isConnected
                ? <><Wifi className="w-3 h-3" /> Online</>
                : <><WifiOff className="w-3 h-3" /> Offline</>
              }
            </div>

            {/* Avatar + Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs leading-none text-gray-500">{user?.email}</p>
                    <div className="flex items-center mt-1">
                      {user?.role === 'admin' ? (
                        <><Shield className="w-3 h-3 mr-1 text-blue-600" /><span className="text-xs text-blue-600">Administrador</span></>
                      ) : (
                        <><User className="w-3 h-3 mr-1 text-gray-500" /><span className="text-xs text-gray-500">Técnico</span></>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Home className="w-4 h-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" /> Meu Perfil
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/users')}>
                      <Users className="w-4 h-4 mr-2" /> Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="w-4 h-4 mr-2" /> Configurações
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Opção de trocar servidor — visível quando serverConfig existe (app cliente) */}
                {hasSetupPage && (
                  <DropdownMenuItem onClick={handleChangeServer} className="text-orange-600">
                    <Server className="w-4 h-4 mr-2" /> Trocar Servidor
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Menu Mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-white"
            >
              <div className="px-4 py-3 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block py-2 text-sm font-medium ${
                      location.pathname === item.path
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-4 border-t">
                  {/* Status mobile */}
                  <div className={`flex items-center gap-1.5 mb-2 text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? <><Wifi className="w-3 h-3" /> Online</> : <><WifiOff className="w-3 h-3" /> Offline</>}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
                  {hasSetupPage && (
                    <button
                      onClick={handleChangeServer}
                      className="w-full text-left py-2 text-sm text-orange-600 hover:text-orange-800"
                    >
                      Trocar Servidor
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}