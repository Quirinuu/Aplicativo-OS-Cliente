import React from 'react';
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from '@/utils';
import { 
  Inbox, 
  Search, 
  Wrench, 
  Clock, 
  PackageCheck, 
  CheckCircle2 
} from "lucide-react";

const statusConfig = {
  RECEIVED: {
    label: "Recebido",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Inbox
  },
  ANALYSIS: {
    label: "Em Análise",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Search
  },
  MAINTENANCE: {
    label: "Manutenção",
    className: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Wrench
  },
  WAITING_PARTS: {
    label: "Aguardando Peças",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock
  },
  READY_FOR_PICKUP: {
    label: "Pronto p/ Retirada",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: PackageCheck
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2
  }
};

export default function StatusBadge({ status, showIcon = true }) {
  const config = statusConfig[status] || statusConfig.RECEIVED;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

export { statusConfig };