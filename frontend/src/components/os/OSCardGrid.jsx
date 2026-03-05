import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  User,
  Clock,
  Timer,
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
  URGENT: { label: "Urgente", borderColor: "border-red-500",    lightBg: "bg-red-50",    icon: AlertTriangle, gradient: "from-red-500 to-red-600"    },
  HIGH:   { label: "Alta",    borderColor: "border-orange-500", lightBg: "bg-orange-50", icon: Zap,           gradient: "from-orange-500 to-orange-600" },
  MEDIUM: { label: "Média",   borderColor: "border-yellow-500", lightBg: "bg-yellow-50", icon: Clock,         gradient: "from-yellow-500 to-yellow-600" },
  LOW:    { label: "Baixa",   borderColor: "border-green-500",  lightBg: "bg-green-50",  icon: Clock,         gradient: "from-green-500 to-green-600"  },
};

// Calcula o tempo decorrido desde createdAt (que vem do campo ENTRADA do SHOficina)
function useElapsedTime(createdAt) {
  const [elapsed, setElapsed] = React.useState('');

  React.useEffect(() => {
    function calc() {
      if (!createdAt) return setElapsed('');
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) return setElapsed('< 1min');
      const mins  = Math.floor(diff / 60);
      const hours = Math.floor(mins / 60);
      const days  = Math.floor(hours / 24);
      if (days >= 1) {
        const remH = hours % 24;
        setElapsed(remH > 0 ? `${days}d ${remH}h` : `${days}d`);
      } else if (hours >= 1) {
        const remM = mins % 60;
        setElapsed(remM > 0 ? `${hours}h ${remM}min` : `${hours}h`);
      } else {
        setElapsed(`${mins}min`);
      }
    }
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [createdAt]);

  return elapsed;
}

// zoomLevel: -2 (mini) … 0 (padrão) … +2 (grande)
function getGridClass(zoomLevel) {
  switch (zoomLevel) {
    case -2: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9';
    case -1: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
    case  0: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    case  1: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';
    case  2: return 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2';
    default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
}

function OSCardGridItem({
  order, index, total, onPriorityChange,
  onMoveUp, onMoveDown,
  onDragStart, onDragEnd, onDragEnter, onDragOver, onDrop,
  dragOverIndex, draggingIndex, compact,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const elapsed = useElapsedTime(order?.createdAt);
  const navigate = useNavigate();

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
        <Card className={`h-full border-l-4 ${config.borderColor} hover:shadow-xl transition-shadow duration-200 ${config.lightBg}`}>
          <CardContent className={`h-full flex flex-col ${compact ? 'p-2' : 'p-4'}`}>

            {/* Header: número + ícone prioridade */}
            <div className={`flex items-start justify-between ${compact ? 'mb-1' : 'mb-3'}`}>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">

                {/* Controles de ordem — só no modo normal */}
                {!compact && (
                  <div
                    className="flex flex-col items-center gap-0 select-none flex-shrink-0"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-slate-300 hover:text-blue-400 cursor-grab active:cursor-grabbing py-0.5 px-1">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
                      disabled={index === total - 1}
                      className={`p-1 rounded transition-colors ${index === total - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer truncate ${compact ? 'text-xs' : 'text-lg'}`}
                    onClick={(e) => { e.stopPropagation(); navigate(`/os/${order.id}`); }}
                    title="Ver detalhes da OS"
                  >
                    #{order.osNumber}
                  </h3>
                  {!compact && (
                    <p className="text-sm text-slate-600 truncate">{order.equipmentName}</p>
                  )}
                </div>
              </div>

              {/* Dropdown de prioridade */}
              <div onMouseDown={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex-shrink-0 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md hover:shadow-lg transition-all cursor-pointer ${compact ? 'w-7 h-7' : 'w-12 h-12'}`}
                      title={`Prioridade: ${config.label}`}
                    >
                      <PriorityIcon className={compact ? 'w-3.5 h-3.5 text-white' : 'w-6 h-6 text-white'} />
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
            <div className={compact ? 'mb-1' : 'mb-3'}>
              <StatusBadge status={order.currentStatus} />
            </div>

            {/* Detalhes */}
            {compact ? (
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-700 truncate font-medium">{order.clientName}</div>
                {elapsed && (
                  <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1 font-semibold">
                    <Timer className="w-3 h-3 flex-shrink-0" />
                    <span>{elapsed}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 flex-1 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-medium">{order.clientName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{safeFormatDate(order.createdAt)}</span>
                </div>
                {elapsed && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 flex-shrink-0 text-blue-500" />
                    <span className="font-semibold text-blue-700">{elapsed}</span>
                    <span className="text-xs text-slate-400">em aberto</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{order.assignedToUser?.fullName || 'Não atribuído'}</span>
                </div>
              </div>
            )}

            {/* Rodapé — botão aparece no hover, só no modo normal */}
            {!compact && (
              <div
                className="mt-4 pt-3 border-t border-slate-200"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className={`transition-all duration-200 overflow-hidden ${isHovered ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0'}`}>
                  <Link to={`/os/${order.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full hover:bg-slate-100">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function OSCardGrid({ orders, onReorder, onPriorityChange, zoomLevel = 0 }) {
  const draggingIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const compact = zoomLevel <= -1;

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
    requestAnimationFrame(() => setDraggingIndex(index));
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
    <div className={`grid gap-3 ${getGridClass(zoomLevel)}`}>
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
          compact={compact}
        />
      ))}
    </div>
  );
}