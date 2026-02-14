import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import StatsCards from "@/components/os/StatsCards";
import OSFilters from "@/components/os/OSFilters";
import OSCardGrid from "@/components/os/OSCardGrid";
import OSForm from "@/components/os/OSForm";
import api from '@/api/client';

const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// Funções auxiliares para gerenciar ordem customizada no localStorage
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
  
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(user => {
        setUser(user);
      })
      .catch((error) => {
        console.error('Erro ao carregar usuário:', error);
      });
  }, []);

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
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.serviceOrders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
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
      queryClient.invalidateQueries(['orders']);
      toast.success('Prioridade atualizada!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar prioridade');
    }
  });

  const handleCreateOS = async (data) => {
    await createMutation.mutateAsync(data);
  };

  const handlePriorityChange = async (orderId, newPriority) => {
    await updateMutation.mutateAsync({
      id: orderId,
      data: { priority: newPriority }
    });
  };

  const handleReorder = (newOrder) => {
    // Criar mapa de ordem customizada
    const newOrderMap = {};
    newOrder.forEach((order, index) => {
      newOrderMap[order.id] = index;
    });
    
    setCustomOrderMap(newOrderMap);
    saveCustomOrder(newOrderMap);
  };

  const clearFilters = () => {
    setFilters({ search: '', priority: 'all', status: 'all', equipment: 'all' });
  };

  // Ordenar OSs com lógica: urgentes primeiro, depois por ordem customizada ou data
  const sortedOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      if (order.currentStatus === 'COMPLETED') return false;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchSearch = 
          order.osNumber?.toLowerCase().includes(search) ||
          order.clientName?.toLowerCase().includes(search) ||
          order.equipmentName?.toLowerCase().includes(search);
        if (!matchSearch) return false;
      }
      if (filters.priority !== 'all' && order.priority !== filters.priority) return false;
      if (filters.status !== 'all' && order.currentStatus !== filters.status) return false;
      if (filters.equipment !== 'all' && order.equipmentClass !== filters.equipment) return false;
      return true;
    });

    // Separar urgentes e não-urgentes
    const urgent = filtered.filter(o => o.priority === 'URGENT');
    const nonUrgent = filtered.filter(o => o.priority !== 'URGENT');

    // Ordenar urgentes por ordem customizada ou data
    const sortByCustomOrder = (a, b) => {
      const orderA = customOrderMap[a.id];
      const orderB = customOrderMap[b.id];
      
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      
      // Se não tem ordem customizada, ordenar por data (mais antigas primeiro)
      return new Date(a.createdAt) - new Date(b.createdAt);
    };

    urgent.sort(sortByCustomOrder);
    
    // Ordenar não-urgentes por prioridade e depois por ordem customizada ou data
    nonUrgent.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return sortByCustomOrder(a, b);
    });

    // Urgentes sempre no topo
    return [...urgent, ...nonUrgent];
  }, [orders, filters, customOrderMap]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Ordens de Serviço
            </h1>
            <p className="text-slate-500 mt-1">
              Gestão de manutenção de equipamentos hospitalares
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Stats */}
        <StatsCards orders={orders} />

        {/* Filters */}
        <OSFilters 
          filters={filters} 
          setFilters={setFilters} 
          onClear={clearFilters} 
        />

        {/* Orders Grid */}
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
                : 'Crie uma nova ordem de serviço para começar'}
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
          />
        )}

        {/* Form Modal */}
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