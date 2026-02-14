import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, ExternalLink, AlertCircle } from "lucide-react";
import PriorityBadge from "@/components/os/PriorityBadge";
import StatusBadge from "@/components/os/StatusBadge";
import { safeFormatDate } from '@/utils/date';

export default function OSCard({ order, index }) {
  if (!order) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left side: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800 truncate">
                    #{order.osNumber}
                  </h3>
                  <p className="text-sm text-slate-600 truncate">
                    {order.equipmentName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={order.priority} />
                  <StatusBadge status={order.currentStatus} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center gap-1 text-slate-600">
                  <User className="w-4 h-4" />
                  <span className="truncate">{order.clientName}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{safeFormatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {order.assignedToUser?.fullName || 'Não atribuído'}
                  </span>
                </div>
                <div className="text-slate-600">
                  <span className="font-medium">Classe: </span>
                  {order.equipmentClass || 'Não informada'}
                </div>
              </div>
            </div>

            {/* Right side: Action */}
            <div className="flex-shrink-0">
              <Link to={`/os/${order.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver Detalhes
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}