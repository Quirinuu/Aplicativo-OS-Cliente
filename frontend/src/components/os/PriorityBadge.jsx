import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { createPageUrl } from '@/utils';

const priorityConfig = {
  URGENT: {
    label: "Urgente",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    icon: AlertTriangle
  },
  HIGH: {
    label: "Alta",
    className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
    icon: ArrowUp
  },
  MEDIUM: {
    label: "Média",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    icon: ArrowRight
  },
  LOW: {
    label: "Baixa",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    icon: ArrowDown
  }
};

export default function PriorityBadge({ priority, showIcon = true }) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}