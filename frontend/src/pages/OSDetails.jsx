import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  Wrench,
  CheckCircle,
  Clock,
  Edit,
  Save,
  X,
  MessageSquare,
  ClipboardList,
  Package,
  Hash,
  Building,
  Cpu,
  History,
  Trash2
} from "lucide-react";
import CommentTimeline from "@/components/os/CommentTimeline";
import PriorityBadge from "@/components/os/PriorityBadge";
import StatusBadge from "@/components/os/StatusBadge";
import api from '@/api/client';
import { safeFormatDate } from '@/utils/date';

export default function OSDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableOS, setEditableOS] = useState(null);
  const [newComment, setNewComment] = useState({ type: 'NOTE', content: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Carregar usuário atual
  useEffect(() => {
    api.auth.me()
      .then(user => {
        setCurrentUser(user);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  // Buscar OS
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.serviceOrders.getById(id),
    enabled: !!id,
  });

  // Buscar usuários para o select
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  });

  // Mutation para atualizar OS
  const updateMutation = useMutation({
    mutationFn: (updates) => api.serviceOrders.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']);
      setIsEditing(false);
      toast.success('OS atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar OS');
    },
  });

  // Mutation para adicionar comentário
  const commentMutation = useMutation({
    mutationFn: (commentData) => api.serviceOrders.addComment(id, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      setNewComment({ type: 'NOTE', content: '' });
      toast.success('Comentário adicionado!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao adicionar comentário');
    },
  });

  // Mutation para deletar OS
  const deleteOSMutation = useMutation({
    mutationFn: () => api.serviceOrders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('OS finalizada!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao finalizar OS');
    },
  });

  const handleSave = () => {
    if (!editableOS) return;
    
    // Remover campos que não devem ser enviados
    const { assignedToUser, createdByUser, comments, ...updates } = editableOS;
    
    // Ajustar nomes dos campos se necessário
    const formattedUpdates = {
      ...updates,
      assignedToUserId: editableOS.assignedToUserId || null,
    };

    updateMutation.mutate(formattedUpdates);
  };

  const handleAddComment = () => {
    if (!newComment.content.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    commentMutation.mutate({
      commentType: newComment.type,
      content: newComment.content,
    });
  };

  const handleCompleteOS = () => {
    updateMutation.mutate({
      currentStatus: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });
  };

  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando OS...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">OS não encontrada</h1>
          <p className="text-slate-600 mb-4">A ordem de serviço solicitada não existe.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const osData = isEditing ? editableOS : order;

  // Função para iniciar edição
  const startEditing = () => {
    setIsEditing(true);
    setEditableOS({ ...order });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">OS #{order.osNumber}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-2">
                <PriorityBadge priority={order.priority} />
                <StatusBadge status={order.currentStatus} />
                {order.completedAt && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Concluída em {safeFormatDate(order.completedAt, 'dd/MM/yyyy')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {isAdmin && !order.completedAt && (
              <>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={isEditing ? handleSave : startEditing}
                  size="sm"
                >
                  {isEditing ? (
                    <><Save className="w-4 h-4 mr-2" /> Salvar</>
                  ) : (
                    <><Edit className="w-4 h-4 mr-2" /> Editar</>
                  )}
                </Button>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </Button>
                )}
              </>
            )}
            {!order.completedAt && order.currentStatus !== 'COMPLETED' && (
              <Button onClick={handleCompleteOS} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar OS
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - OS Details */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5" />
                  Informações da OS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Número da OS */}
                  <div>
                    <Label htmlFor="osNumber" className="text-sm text-slate-500">Número da OS</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="font-medium" id="osNumber">{order.osNumber}</span>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div>
                    <Label htmlFor="clientName" className="text-sm text-slate-500">Cliente</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-4 h-4 text-slate-400" />
                      {isEditing ? (
                        <Input
                          id="clientName"
                          name="clientName"
                          value={osData.clientName || ''}
                          onChange={(e) => setEditableOS({ ...osData, clientName: e.target.value })}
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium" id="clientName">{order.clientName}</span>
                      )}
                    </div>
                  </div>

                  {/* Equipamento */}
                  <div>
                    <Label htmlFor="equipmentName" className="text-sm text-slate-500">Equipamento</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      {isEditing ? (
                        <Input
                          id="equipmentName"
                          name="equipmentName"
                          value={osData.equipmentName || ''}
                          onChange={(e) => setEditableOS({ ...osData, equipmentName: e.target.value })}
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium" id="equipmentName">{order.equipmentName}</span>
                      )}
                    </div>
                  </div>

                  {/* Número de Série */}
                  <div>
                    <Label htmlFor="serialNumber" className="text-sm text-slate-500">Número de Série</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Package className="w-4 h-4 text-slate-400" />
                      {isEditing ? (
                        <Input
                          id="serialNumber"
                          name="serialNumber"
                          value={osData.serialNumber || ''}
                          onChange={(e) => setEditableOS({ ...osData, serialNumber: e.target.value })}
                          className="h-8"
                          placeholder="Não informado"
                        />
                      ) : (
                        <span className="font-medium" id="serialNumber">{order.serialNumber || 'Não informado'}</span>
                      )}
                    </div>
                  </div>

                  {/* Prioridade */}
                  <div>
                    <Label htmlFor="priority" className="text-sm text-slate-500">Prioridade</Label>
                    {isEditing && isAdmin ? (
                      <Select
                        value={osData.priority}
                        onValueChange={(value) => setEditableOS({ ...osData, priority: value })}
                      >
                        <SelectTrigger id="priority" className="h-8 mt-1">
                          <SelectValue placeholder="Selecionar prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="URGENT">Urgente</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="LOW">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1" id="priority">
                        <PriorityBadge priority={order.priority} />
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <Label htmlFor="currentStatus" className="text-sm text-slate-500">Status</Label>
                    {isEditing ? (
                      <Select
                        value={osData.currentStatus}
                        onValueChange={(value) => setEditableOS({ ...osData, currentStatus: value })}
                      >
                        <SelectTrigger id="currentStatus" className="h-8 mt-1">
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
                    ) : (
                      <div className="mt-1" id="currentStatus">
                        <StatusBadge status={order.currentStatus} />
                      </div>
                    )}
                  </div>

                  {/* Técnico Responsável */}
                  <div>
                    <Label htmlFor="assignedToUserId" className="text-sm text-slate-500">Técnico Responsável</Label>
                    {isEditing && isAdmin ? (
                      <Select
                        value={osData.assignedToUserId?.toString() || 'unassigned'}
                        onValueChange={(value) => setEditableOS({ ...osData, assignedToUserId: value === 'unassigned' ? null : value })}
                      >
                        <SelectTrigger id="assignedToUserId" className="h-8 mt-1">
                          <SelectValue placeholder="Selecionar técnico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Não atribuído</SelectItem>
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
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <span id="assignedToUserId">
                          {order.assignedToUser?.fullName || 'Não atribuído'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Acessórios */}
                <div>
                  <Label htmlFor="accessories" className="text-sm text-slate-500">Acessórios</Label>
                  {isEditing ? (
                    <Textarea
                      id="accessories"
                      name="accessories"
                      value={osData.accessories || ''}
                      onChange={(e) => setEditableOS({ ...osData, accessories: e.target.value })}
                      placeholder="Cabo de energia, sensores, etc."
                      rows={2}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-slate-700" id="accessories">{order.accessories || 'Nenhum acessório informado'}</p>
                  )}
                </div>

                {/* Descrição Opcional */}
                <div>
                  <Label htmlFor="optionalDescription" className="text-sm text-slate-500">Descrição Opcional</Label>
                  {isEditing ? (
                    <Textarea
                      id="optionalDescription"
                      name="optionalDescription"
                      value={osData.optionalDescription || ''}
                      onChange={(e) => setEditableOS({ ...osData, optionalDescription: e.target.value })}
                      placeholder="Informações adicionais sobre a OS..."
                      rows={3}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-slate-700" id="optionalDescription">{order.optionalDescription || 'Nenhuma descrição adicional'}</p>
                  )}
                </div>

                {/* Defeito Anterior */}
                {order.hasPreviousDefect && (
                  <div>
                    <Label htmlFor="previousDefectDescription" className="text-sm text-slate-500">Defeito Anterior</Label>
                    {isEditing ? (
                      <Textarea
                        id="previousDefectDescription"
                        name="previousDefectDescription"
                        value={osData.previousDefectDescription || ''}
                        onChange={(e) => setEditableOS({ ...osData, previousDefectDescription: e.target.value })}
                        placeholder="Descrição do defeito anterior..."
                        rows={3}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-700" id="previousDefectDescription">{order.previousDefectDescription}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-sm text-slate-500 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Criada em: {safeFormatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Atualizada em: {safeFormatDate(order.updatedAt)}</span>
                  </div>
                  {order.completedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Concluída em: {safeFormatDate(order.completedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5" />
                  Timeline de Comentários ({order.comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentTimeline comments={order.comments || []} />
                
                {/* Add Comment Form */}
                <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                  <Label htmlFor="new_comment" className="text-sm font-medium">Adicionar Comentário</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Select 
                      value={newComment.type} 
                      onValueChange={(value) => setNewComment({...newComment, type: value})}
                    >
                      <SelectTrigger id="comment_type" className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOTE">Observação</SelectItem>
                        <SelectItem value="DIAGNOSIS">Diagnóstico</SelectItem>
                        <SelectItem value="REPAIR">Reparo</SelectItem>
                        <SelectItem value="FINAL">Finalização</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      id="new_comment"
                      name="new_comment"
                      value={newComment.content}
                      onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                      placeholder="Digite seu comentário..."
                      className="flex-1 min-h-[80px]"
                    />
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!newComment.content.trim() || commentMutation.isPending}
                      className="sm:self-start"
                    >
                      {commentMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <MessageSquare className="w-4 h-4 mr-2" />
                      )}
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & History */}
          <div className="space-y-4 md:space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="w-5 h-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!order.completedAt && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setNewComment({ type: 'DIAGNOSIS', content: '' });
                        document.getElementById('new_comment')?.focus();
                      }}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Registrar Diagnóstico
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setNewComment({ type: 'REPAIR', content: '' });
                        document.getElementById('new_comment')?.focus();
                      }}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Registrar Reparo
                    </Button>
                    {order.currentStatus !== 'WAITING_PARTS' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          updateMutation.mutate({ currentStatus: 'WAITING_PARTS' });
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Aguardando Peças
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Lista
                </Button>
              </CardContent>
            </Card>

            {/* Status History Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="w-5 h-5" />
                  Histórico de Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Criada</span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {safeFormatDate(order.createdAt, 'dd/MM/yyyy')}
                    </span>
                  </div>
                  {order.completedAt && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Concluída</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {safeFormatDate(order.completedAt, 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar OS #{order.osNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar esta ordem de serviço?
              Esta ação marcará a OS como concluída e moverá para o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOSMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Finalizar OS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}