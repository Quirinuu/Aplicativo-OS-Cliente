import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  User,
  Clock,
  ExternalLink,
  AlertTriangle,
  GripVertical,
  Zap,
  ChevronUp,
  ChevronDown
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
    borderColor: "border-red-500",
    lightBg: "bg-red-50",
    icon: AlertTriangle,
    gradient: "from-red-500 to-red-600"
  },
  HIGH: {
    label: "Alta",
    borderColor: "border-orange-500",
    lightBg: "bg-orange-50",
    icon: Zap,
    gradient: "from-orange-500 to-orange-600"
  },
  MEDIUM: {
    label: "Média",
    borderColor: "border-yellow-500",
    lightBg: "bg-yellow-50",
    icon: Clock,
    gradient: "from-yellow-500 to-yellow-600"
  },
  LOW: {
    label: "Baixa",
    borderColor: "border-green-500",
    lightBg: "bg-green-50",
    icon: Clock,
    gradient: "from-green-500 to-green-600"
  }
};

function OSCardGridItem({
  order,
  index,
  total,
  onPriorityChange,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDrop,
  dragOverIndex,
  draggingIndex,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!order) return null;

  const config = priorityConfig[order.priority] || priorityConfig.MEDIUM;
  const PriorityIcon = config.icon;

  const isDragging = draggingIndex === index;
  const isDragOver = dragOverIndex === index && draggingIndex !== index;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(index); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-full transition-all duration-150 rounded-xl
        ${isDragging ? 'opacity-30 scale-95 cursor-grabbing' : 'cursor-default'}
        ${isDragOver ? 'ring-2 ring-blue-400 ring-offset-2 scale-[1.02]' : ''}
      `}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-full"
      >
        <Card
          className={`h-full border-l-4 ${config.borderColor} hover:shadow-xl transition-shadow duration-200 ${config.lightBg}`}
        >
          <CardContent className="p-4 h-full flex flex-col">

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">

                {/* Coluna de controles: ▲ grip ▼ */}
                <div
                  className="flex flex-col items-center gap-0 select-none flex-shrink-0"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
                    disabled={index === 0}
                    className={`p-1 rounded transition-colors
                      ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}
                    `}
                    title="Mover para cima"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <div
                    className="text-slate-300 hover:text-blue-400 cursor-grab active:cursor-grabbing py-0.5 px-1"
                    title="Arrastar para reorganizar"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
                    disabled={index === total - 1}
                    className={`p-1 rounded transition-colors
                      ${index === total - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}
                    `}
                    title="Mover para baixo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 truncate">
                    #{order.osNumber}
                  </h3>
                  <p className="text-sm text-slate-600 truncate">
                    {order.equipmentName}
                  </p>
                </div>
              </div>

              {/* Dropdown de prioridade */}
              <div onMouseDown={(e) => e.stopPropagation()}>
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
                    <DropdownMenuItem onClick={() => onPriorityChange(order.id, 'URGENT')} className="cursor-pointer">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Urgente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPriorityChange(order.id, 'HIGH')} className="cursor-pointer">
                      <Zap className="w-4 h-4 mr-2 text-orange-500" /> Alta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPriorityChange(order.id, 'MEDIUM')} className="cursor-pointer">
                      <Clock className="w-4 h-4 mr-2 text-yellow-500" /> Média
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPriorityChange(order.id, 'LOW')} className="cursor-pointer">
                      <Clock className="w-4 h-4 mr-2 text-green-500" /> Baixa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Status */}
            <div className="mb-3">
              <StatusBadge status={order.currentStatus} />
            </div>

            {/* Detalhes */}
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

            {/* Rodapé — botão só aparece no hover */}
            <div
              className="mt-4 pt-3 border-t border-slate-200"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div
                className={`transition-all duration-200 overflow-hidden ${
                  isHovered ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0'
                }`}
              >
                <Link to={`/os/${order.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full hover:bg-slate-100">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function OSCardGrid({ orders, onReorder, onPriorityChange }) {
  const draggingIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);

  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleMoveUp = useCallback((index) => {
    if (index === 0) return;
    const newOrders = [...orders];
    [newOrders[index], newOrders[index - 1]] = [newOrders[index - 1], newOrders[index]];
    onReorder(newOrders);
  }, [orders, onReorder]);

  const handleMoveDown = useCallback((index) => {
    if (index === orders.length - 1) return;
    const newOrders = [...orders];
    [newOrders[index], newOrders[index + 1]] = [newOrders[index + 1], newOrders[index]];
    onReorder(newOrders);
  }, [orders, onReorder]);

  const handleDragStart = useCallback((e, index) => {
    draggingIndexRef.current = index;
    dragOverIndexRef.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    requestAnimationFrame(() => {
      setDraggingIndex(index);
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    const from = draggingIndexRef.current;
    const to = dragOverIndexRef.current;

    if (from !== null && to !== null && from !== to) {
      const newOrders = [...orders];
      const [removed] = newOrders.splice(from, 1);
      newOrders.splice(to, 0, removed);
      onReorder(newOrders);
    }

    draggingIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [orders, onReorder]);

  const handleDragEnter = useCallback((index) => {
    if (index !== draggingIndexRef.current) {
      dragOverIndexRef.current = index;
      setDragOverIndex(index);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((index) => {
    dragOverIndexRef.current = index;
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orders.map((order, index) => (
        <OSCardGridItem
          key={order.id}
          order={order}
          index={index}
          total={orders.length}
          onPriorityChange={onPriorityChange}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          draggingIndex={draggingIndex}
          dragOverIndex={dragOverIndex}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}