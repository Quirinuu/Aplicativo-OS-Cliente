import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from '@/utils';
import { 
  ClipboardList, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";

export default function StatsCards({ orders = [] }) {
  const stats = {
    total: orders.filter(o => o.currentStatus !== 'COMPLETED').length,
    urgent: orders.filter(o => o.priority === 'URGENT' && o.currentStatus !== 'COMPLETED').length,
  };

  const cards = [
    {
      title: "OS Abertas",
      value: stats.total,
      icon: ClipboardList,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50"
    },
    {
      title: "Urgentes",
      value: stats.urgent,
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
      bgLight: "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${card.bgLight} border-none overflow-hidden`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}