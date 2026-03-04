import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Loader2, Wifi, WifiOff, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import StatsCards from "@/components/os/StatsCards";
import OSFilters from "@/components/os/OSFilters";
import OSCardGrid from "@/components/os/OSCardGrid";
import OSForm from "@/components/os/OSForm";
import api from '@/api/client';
import { socketService } from '@/api/socket';

const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const getCustomOrder = () => {
  try {
    const stored = localStorage.getItem('osCustomOrder');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveCustomOrder = (orderMap) => {
  localStorage.setItem('osCustomOrder', JSON.stringify(orderMap));
};

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    status: 'all',
    equipment: 'all'
  });
  const [user, setUser] = useState(null);
  const [customOrderMap, setCustomOrderMap] = useState(getCustomOrder());
  const [isSocketConnected, setIsSocketConnected] = useState(socketService.isConnected);
  const [zoomLevel, setZoomLevel] = useState(0);       // -2 mini … 0 padrão … 2 grande
  const [isFullscreen, setIsFullscreen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(u => setUser(u))
      .catch((error) => console.error('Erro ao carregar usuário:', error));
  }, []);

  // Sync estado fullscreen com tecla ESC
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ============== WEBSOCKET ==============
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) socketService.connect(token);

    const statusInterval = setInterval(() => {
      setIsSocketConnected(socketService.isConnected);
    }, 1000);

    const handleOSCreated = (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.info('Nova OS criada!', {
        description: `#${data?.order?.osNumber} - ${data?.order?.equipmentName}`,
        duration: 3000
      });
    };

    const handleOSUpdated = (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.info('OS atualizada!', {
        description: `#${data?.order?.osNumber}`,
        duration: 2000
      });
    };

    const handleOSDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.info('OS removida', { duration: 2000 });
    };

    const handleOSComment = (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.info('Novo comentário', {
        description: `OS #${data?.osId}`,
        duration: 2000
      });
    };

    socketService.on('os:created', handleOSCreated);
    socketService.on('os:updated', handleOSUpdated);
    socketService.on('os:deleted', handleOSDeleted);
    socketService.on('os:comment', handleOSComment);

    return () => {
      clearInterval(statusInterval);
      socketService.off('os:created', handleOSCreated);
      socketService.off('os:updated', handleOSUpdated);
      socketService.off('os:deleted', handleOSDeleted);
      socketService.off('os:comment', handleOSComment);
    };
  }, [queryClient]);

  // ============== QUERIES ==============
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const searchFilters = {};
      if (filters.search) {
        searchFilters.clientName = filters.search;
        searchFilters.equipmentName = filters.search;
      }
      if (filters.priority !== 'all') searchFilters.priority = filters.priority;
      if (filters.status !== 'all') searchFilters.status = filters.status;
      return api.serviceOrders.list(searchFilters);
    },
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.serviceOrders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowForm(false);
      toast.success('OS criada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar OS');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.serviceOrders.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Prioridade atualizada!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar prioridade');
    }
  });

  const handleCreateOS = async (data) => { await createMutation.mutateAsync(data); };

  const handlePriorityChange = async (orderId, newPriority) => {
    await updateMutation.mutateAsync({ id: orderId, data: { priority: newPriority } });
  };

  const handleReorder = (newOrder) => {
    const newOrderMap = {};
    newOrder.forEach((order, index) => { newOrderMap[order.id] = index; });
    setCustomOrderMap(newOrderMap);
    saveCustomOrder(newOrderMap);
  };

  const clearFilters = () => {
    setFilters({ search: '', priority: 'all', status: 'all', equipment: 'all' });
  };

  // ============== ORDENAÇÃO ==============
  const sortedOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      if (order.currentStatus === 'COMPLETED') return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const match =
          order.osNumber?.toLowerCase().includes(search) ||
          order.clientName?.toLowerCase().includes(search) ||
          order.equipmentName?.toLowerCase().includes(search);
        if (!match) return false;
      }
      if (filters.priority !== 'all' && order.priority !== filters.priority) return false;
      if (filters.status !== 'all' && order.currentStatus !== filters.status) return false;
      if (filters.equipment !== 'all' && order.equipmentClass !== filters.equipment) return false;
      return true;
    });

    const urgent = filtered.filter(o => o.priority === 'URGENT');
    const nonUrgent = filtered.filter(o => o.priority !== 'URGENT');

    const sortByCustomOrder = (a, b) => {
      const orderA = customOrderMap[a.id];
      const orderB = customOrderMap[b.id];
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    };

    urgent.sort(sortByCustomOrder);
    nonUrgent.sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return diff !== 0 ? diff : sortByCustomOrder(a, b);
    });

    return [...urgent, ...nonUrgent];
  }, [orders, filters, customOrderMap]);

  const isAdmin = user?.role === 'admin';

  // ============== FULLSCREEN MODE ==============
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Toolbar fullscreen */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-sm">OS Manager</span>
            <span className="text-slate-400 text-xs">{sortedOrders.length} ordem{sortedOrders.length !== 1 ? 's' : ''} em aberto</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isSocketConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {isSocketConnected
                ? <><Wifi className="w-3 h-3" /><span>Sync</span></>
                : <><WifiOff className="w-3 h-3" /><span>Offline</span></>
              }
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(z => Math.max(-2, z - 1))}
              className="p-1.5 rounded text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Reduzir cards"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 w-6 text-center">{zoomLevel > 0 ? `+${zoomLevel}` : zoomLevel}</span>
            <button
              onClick={() => setZoomLevel(z => Math.min(2, z + 1))}
              className="p-1.5 rounded text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Ampliar cards"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Sair da tela cheia"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid de cards */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p className="text-lg font-medium">Nenhuma OS em aberto</p>
              <p className="text-sm mt-1">Todas as ordens foram concluídas</p>
            </div>
          ) : (
            <OSCardGrid
              orders={sortedOrders}
              onReorder={handleReorder}
              onPriorityChange={handlePriorityChange}
              zoomLevel={zoomLevel}
            />
          )}
        </div>
      </div>
    );
  }

  // ============== MODO NORMAL ==============
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Ordens de Serviço
              </h1>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                isSocketConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {isSocketConnected
                  ? <><Wifi className="w-3 h-3" /><span>Sincronizado</span></>
                  : <><WifiOff className="w-3 h-3" /><span>Offline</span></>
                }
              </div>
            </div>
            <p className="text-slate-500 mt-1">
              Gestão de manutenção de equipamentos hospitalares
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Controles de zoom */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
              <button
                onClick={() => setZoomLevel(z => Math.max(-2, z - 1))}
                disabled={zoomLevel <= -2}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Reduzir cards"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 w-5 text-center">{zoomLevel > 0 ? `+${zoomLevel}` : zoomLevel}</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(2, z + 1))}
                disabled={zoomLevel >= 2}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Ampliar cards"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Tela cheia */}
            <Button variant="outline" size="sm" onClick={toggleFullscreen} title="Tela cheia">
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            {isAdmin && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova OS
              </Button>
            )}
          </div>
        </motion.div>

        <StatsCards orders={orders} />

        <OSFilters
          filters={filters}
          setFilters={setFilters}
          onClear={clearFilters}
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : sortedOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl border border-slate-200"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Nenhuma OS encontrada
            </h3>
            <p className="text-slate-500 mb-4">
              {filters.search || filters.priority !== 'all' || filters.status !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Conectado ao servidor. Aguardando ordens de serviço.'}
            </p>
            {isAdmin && filters.priority === 'all' && filters.status === 'all' && !filters.search && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar OS
              </Button>
            )}
          </motion.div>
        ) : (
          <OSCardGrid
            orders={sortedOrders}
            onReorder={handleReorder}
            onPriorityChange={handlePriorityChange}
            zoomLevel={zoomLevel}
          />
        )}

        <OSForm
          open={showForm}
          onOpenChange={setShowForm}
          onSubmit={handleCreateOS}
          users={users}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}