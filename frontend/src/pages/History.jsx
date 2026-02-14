import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar as CalendarIcon,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Archive,
  X,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import PriorityBadge from "@/components/os/PriorityBadge";
import api from '@/api/client';
import { safeFormatDate } from '@/utils/date';

export default function History() {
  const [filters, setFilters] = useState({
    search: '',
    clientName: '',
    equipmentName: '',
    startDate: '',
    endDate: '',
  });

  // Buscar OS concluídas
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['history', filters],
    queryFn: () => api.serviceOrders.history(filters),
  });

  const handleFilterChange = (key, value) => {
    // Se o valor for "all", limpa o filtro (converte para string vazia)
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      clientName: '',
      equipmentName: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  // Filtragem local adicional (se necessário)
  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        order.osNumber?.toLowerCase().includes(searchLower) ||
        order.clientName?.toLowerCase().includes(searchLower) ||
        order.equipmentName?.toLowerCase().includes(searchLower) ||
        order.serialNumber?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    if (filters.clientName && order.clientName !== filters.clientName) return false;
    if (filters.equipmentName && order.equipmentName !== filters.equipmentName) return false;
    
    return true;
  });

  // Extrair valores únicos para filtros
  const uniqueClients = [...new Set(orders.map(order => order.clientName).filter(Boolean))];
  const uniqueEquipment = [...new Set(orders.map(order => order.equipmentName).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Archive className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Histórico de OS
              </h1>
              <p className="text-slate-500">
                Ordens de serviço concluídas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <h3 className="font-medium text-slate-700">Filtros</h3>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca geral */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Nº OS, cliente, equipamento..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Filtro por cliente */}
              <div className="space-y-2">
                <Label htmlFor="clientName">Cliente</Label>
                <Select
                  value={filters.clientName || 'all'}
                  onValueChange={(value) => handleFilterChange('clientName', value)}
                >
                  <SelectTrigger id="clientName">
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {uniqueClients.map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por equipamento */}
              <div className="space-y-2">
                <Label htmlFor="equipmentName">Equipamento</Label>
                <Select
                  value={filters.equipmentName || 'all'}
                  onValueChange={(value) => handleFilterChange('equipmentName', value)}
                >
                  <SelectTrigger id="equipmentName">
                    <SelectValue placeholder="Todos os equipamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os equipamentos</SelectItem>
                    {uniqueEquipment.map(equipment => (
                      <SelectItem key={equipment} value={equipment}>{equipment}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por data */}
              <div className="space-y-2">
                <Label htmlFor="dateRange">Período</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total de OS</p>
                  <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
                </div>
                <Archive className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Filtradas</p>
                  <p className="text-2xl font-bold text-slate-800">{filteredOrders.length}</p>
                </div>
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Última atualização</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <CalendarIcon className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl border border-slate-200"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {hasActiveFilters ? 'Nenhuma OS encontrada' : 'Nenhuma OS concluída'}
            </h3>
            <p className="text-slate-500 mb-4">
              {hasActiveFilters 
                ? 'Tente ajustar os filtros de busca'
                : 'As OS finalizadas aparecerão aqui automaticamente'
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Limpar filtros
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Nº OS</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Criação</TableHead>
                      <TableHead>Conclusão</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>#{order.osNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.equipmentName}</div>
                            {order.serialNumber && (
                              <div className="text-xs text-slate-500">{order.serialNumber}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.clientName}</TableCell>
                        <TableCell><PriorityBadge priority={order.priority} /></TableCell>
                        <TableCell className="text-slate-500">
                          {safeFormatDate(order.createdAt, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {order.completedAt 
                            ? safeFormatDate(order.completedAt, 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {order.assignedToUser?.fullName || 'Não atribuído'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/os/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Mostrando {filteredOrders.length} de {orders.length} registros
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <Loader2 className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}