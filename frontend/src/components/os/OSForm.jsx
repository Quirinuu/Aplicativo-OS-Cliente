import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

export default function OSForm({ open, onOpenChange, onSubmit, users = [] }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    osNumber: '',
    equipmentName: '',
    clientName: '',
    priority: 'MEDIUM',
    accessories: '',
    serialNumber: '',
    hasPreviousDefect: false,
    previousDefectDescription: '',
    currentStatus: 'RECEIVED',
    equipmentClass: 'MONITORING', // Valor padrão, não vazio
    optionalDescription: '',
    assignedToUserId: null, // Usar null em vez de string vazia
  });

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setFormData({
        osNumber: '',
        equipmentName: '',
        clientName: '',
        priority: 'MEDIUM',
        accessories: '',
        serialNumber: '',
        hasPreviousDefect: false,
        previousDefectDescription: '',
        currentStatus: 'RECEIVED',
        equipmentClass: 'MONITORING', // Valor padrão
        optionalDescription: '',
        assignedToUserId: null, // Usar null
      });
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.osNumber || !formData.equipmentName || !formData.clientName) {
      toast.error('Preencha os campos obrigatórios: Número da OS, Equipamento e Cliente');
      return;
    }

    if (formData.hasPreviousDefect && !formData.previousDefectDescription) {
      toast.error('Se tem defeito prévio, a descrição é obrigatória');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for backend
      const dataToSend = {
        ...formData,
        // Ensure assignedToUserId is null if empty
        assignedToUserId: formData.assignedToUserId || null,
        // Se equipmentClass for vazio, enviar null
        equipmentClass: formData.equipmentClass || null,
      };
      
      await onSubmit(dataToSend);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar OS:', error);
      toast.error(error.message || 'Erro ao criar OS');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Converter valor nulo para string vazia para o Select
  const getSelectValue = (value) => {
    return value === null ? '' : value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados da nova ordem de serviço. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Número da OS */}
            <div className="space-y-2">
              <Label htmlFor="osNumber">Número da OS *</Label>
              <Input
                id="osNumber"
                value={formData.osNumber}
                onChange={(e) => handleChange('osNumber', e.target.value)}
                placeholder="Ex: OS-2024-001"
                required
              />
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Cliente *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Nome do cliente/hospital"
                required
              />
            </div>

            {/* Equipamento */}
            <div className="space-y-2">
              <Label htmlFor="equipmentName">Equipamento *</Label>
              <Input
                id="equipmentName"
                value={formData.equipmentName}
                onChange={(e) => handleChange('equipmentName', e.target.value)}
                placeholder="Nome do equipamento"
                required
              />
            </div>

            {/* Número de Série */}
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleChange('serialNumber', e.target.value)}
                placeholder="Número de série do equipamento"
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade *</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="currentStatus">Status *</Label>
              <Select value={formData.currentStatus} onValueChange={(value) => handleChange('currentStatus', value)}>
                <SelectTrigger id="currentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVED">Recebida</SelectItem>
                  <SelectItem value="ANALYSIS">Em Análise</SelectItem>
                  <SelectItem value="MAINTENANCE">Em Manutenção</SelectItem>
                  <SelectItem value="WAITING_PARTS">Aguardando Peças</SelectItem>
                  <SelectItem value="READY_FOR_PICKUP">Pronta para Retirada</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Classe do Equipamento */}
            <div className="space-y-2">
              <Label htmlFor="equipmentClass">Classe do Equipamento</Label>
              <Select value={formData.equipmentClass} onValueChange={(value) => handleChange('equipmentClass', value)}>
                <SelectTrigger id="equipmentClass">
                  <SelectValue placeholder="Selecione a classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONITORING">Monitoramento</SelectItem>
                  <SelectItem value="LIFE_SUPPORT">Suporte à Vida</SelectItem>
                  <SelectItem value="EMERGENCY">Emergência</SelectItem>
                  <SelectItem value="DIAGNOSTIC">Diagnóstico</SelectItem>
                  <SelectItem value="SURGERY">Cirurgia</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Técnico Responsável */}
            <div className="space-y-2">
              <Label htmlFor="assignedToUserId">Técnico Responsável</Label>
              <Select 
                value={getSelectValue(formData.assignedToUserId)} 
                onValueChange={(value) => handleChange('assignedToUserId', value === '' ? null : value)}
              >
                <SelectTrigger id="assignedToUserId">
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-assigned">Não atribuído</SelectItem>
                  {users
                    .filter(user => user.role === 'tech' && user.isActive)
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Acessórios */}
          <div className="space-y-2">
            <Label htmlFor="accessories">Acessórios</Label>
            <Textarea
              id="accessories"
              value={formData.accessories}
              onChange={(e) => handleChange('accessories', e.target.value)}
              placeholder="Liste os acessórios do equipamento (separados por vírgula)"
              rows={2}
            />
          </div>

          {/* Descrição Opcional */}
          <div className="space-y-2">
            <Label htmlFor="optionalDescription">Descrição Opcional</Label>
            <Textarea
              id="optionalDescription"
              value={formData.optionalDescription}
              onChange={(e) => handleChange('optionalDescription', e.target.value)}
              placeholder="Descrição adicional sobre a OS..."
              rows={3}
            />
          </div>

          {/* Defeito Anterior */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hasPreviousDefect" className="text-base">Tem defeito anterior?</Label>
                <p className="text-sm text-slate-500">Marque se o equipamento já teve defeito anteriormente</p>
              </div>
              <Switch
                id="hasPreviousDefect"
                checked={formData.hasPreviousDefect}
                onCheckedChange={(checked) => handleChange('hasPreviousDefect', checked)}
              />
            </div>

            {formData.hasPreviousDefect && (
              <div className="space-y-2">
                <Label htmlFor="previousDefectDescription">Descrição do Defeito Anterior *</Label>
                <Textarea
                  id="previousDefectDescription"
                  value={formData.previousDefectDescription}
                  onChange={(e) => handleChange('previousDefectDescription', e.target.value)}
                  placeholder="Descreva o defeito anterior do equipamento..."
                  rows={3}
                  required={formData.hasPreviousDefect}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar OS'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}