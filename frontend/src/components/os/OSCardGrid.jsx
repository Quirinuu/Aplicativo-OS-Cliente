import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  User, 
  Clock, 
  ExternalLink, 
  AlertTriangle,
  GripVertical,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/os/StatusBadge";
import { safeFormatDate } from '@/utils/date';

const priorityConfig = {
  URGENT: {
    label: "Urgente",
    bgColor: "bg-red-500",
    borderColor: "border-red-500",
    textColor: "text-red-800",
    lightBg: "bg-red-50",
    icon: AlertTriangle,
    gradient: "from-red-500 to-red-600"
  },
  HIGH: {
    label: "Alta",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-500",
    textColor: "text-orange-800",
    lightBg: "bg-orange-50",
    icon: Zap,
    gradient: "from-orange-500 to-orange-600"
  },
  MEDIUM: {
    label: "Média",
    bgColor: "bg-yellow-500",
    borderColor: "border-yellow-500",
    textColor: "text-yellow-800",
    lightBg: "bg-yellow-50",
    icon: Clock,
    gradient: "from-yellow-500 to-yellow-600"
  },
  LOW: {
    label: "Baixa",
    bgColor: "bg-green-500",
    borderColor: "border-green-500",
    textColor: "text-green-800",
    lightBg: "bg-green-50",
    icon: Clock,
    gradient: "from-green-500 to-green-600"
  }
};

function OSCardGridItem({ order, onPriorityChange }) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!order) return null;

  const config = priorityConfig[order.priority] || priorityConfig.MEDIUM;
  const PriorityIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card 
        className={`h-full border-l-4 ${config.borderColor} hover:shadow-xl transition-all duration-200 ${config.lightBg}`}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header com número da OS e ícone de prioridade */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-slate-800 truncate">
                  #{order.osNumber}
                </h3>
                <p className="text-sm text-slate-600 truncate">
                  {order.equipmentName}
                </p>
              </div>
            </div>
            
            {/* Ícone de Prioridade - grande e colorido */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md hover:shadow-lg transition-all cursor-pointer`}
                  title={`Prioridade: ${config.label}`}
                >
                  <PriorityIcon className="w-6 h-6 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onPriorityChange(order.id, 'URGENT')}
                  className="cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                  Urgente
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPriorityChange(order.id, 'HIGH')}
                  className="cursor-pointer"
                >
                  <Zap className="w-4 h-4 mr-2 text-orange-500" />
                  Alta
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPriorityChange(order.id, 'MEDIUM')}
                  className="cursor-pointer"
                >
                  <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                  Média
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPriorityChange(order.id, 'LOW')}
                  className="cursor-pointer"
                >
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  Baixa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badge de Status */}
          <div className="mb-3">
            <StatusBadge status={order.currentStatus} />
          </div>

          {/* Informações detalhadas */}
          <div className="space-y-2 flex-1 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium">{order.clientName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{safeFormatDate(order.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {order.assignedToUser?.fullName || 'Não atribuído'}
              </span>
            </div>

            {order.equipmentClass && (
              <div className="text-slate-600">
                <span className="font-medium">Classe: </span>
                <span>{order.equipmentClass}</span>
              </div>
            )}
          </div>

          {/* Botão de ação */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <Link to={`/os/${order.id}`} className="w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full hover:bg-slate-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OSCardGrid({ orders, onReorder, onPriorityChange }) {
  return (
    <Reorder.Group
      axis="y"
      values={orders}
      onReorder={onReorder}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {orders.map((order) => (
        <Reorder.Item 
          key={order.id} 
          value={order}
          className="cursor-grab active:cursor-grabbing"
        >
          <OSCardGridItem 
            order={order} 
            onPriorityChange={onPriorityChange}
          />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}