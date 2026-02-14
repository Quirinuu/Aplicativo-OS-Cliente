import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Wrench,
  Loader2,
  Mail,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api from '@/api/client';

export default function Users() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState('tech');
  const [creating, setCreating] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('tech');
  const [editIsActive, setEditIsActive] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(setCurrentUser)
      .catch(() => {
        // Se não autenticado, redirecionar para login
        // navigate('/login');
      });
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list
  });

  const createMutation = useMutation({
    mutationFn: (userData) => api.users.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowCreateDialog(false);
      setCreateEmail('');
      setCreateFullName('');
      setCreatePassword('');
      setCreateRole('tech');
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowEditDialog(false);
      setEditingUser(null);
      toast.success('Usuário atualizado!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Usuário desativado!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao desativar usuário');
    },
  });

  const handleCreateUser = async () => {
    if (!createEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    
    if (!createPassword.trim()) {
      toast.error('Senha é obrigatória');
      return;
    }
    
    const userData = {
      username: createEmail.split('@')[0],
      email: createEmail,
      fullName: createFullName,
      password: createPassword,
      role: createRole
    };
    
    createMutation.mutate(userData);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFullName(user.fullName || '');
    setEditRole(user.role || 'tech');
    setEditIsActive(user.isActive !== false);
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    const userData = {
      fullName: editFullName,
      role: editRole,
      isActive: editIsActive
    };
    
    updateMutation.mutate({ id: editingUser.id, data: userData });
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.isActive;
    updateMutation.mutate({ 
      id: user.id, 
      data: { isActive: newStatus } 
    });
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Tem certeza que deseja desativar o usuário ${user.fullName || user.email}?`)) {
      return;
    }
    
    deleteMutation.mutate(user.id);
  };

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Acesso Restrito</h2>
            <p className="text-slate-500 mb-6">
              Apenas administradores podem acessar esta página.
            </p>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.isActive !== false).length;
  const admins = users.filter(u => u.role === 'admin').length;
  const techs = users.filter(u => u.role === 'tech').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Gerenciar Usuários</h1>
              <p className="text-slate-500">Adicione, edite ou remova usuários do sistema</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-50 border-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-blue-800">{activeUsers}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Administradores</p>
                  <p className="text-2xl font-bold text-purple-800">{admins}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Técnicos</p>
                  <p className="text-2xl font-bold text-green-800">{techs}</p>
                </div>
                <Wrench className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
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
                      <TableHead className="w-[250px]">Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                              <span className={`font-medium ${
                                user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                              }`}>
                                {(user.fullName || user.email || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-800 block">
                                {user.fullName || 'Sem nome'}
                              </span>
                              <span className="text-xs text-slate-500">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          }>
                            {user.role === 'admin' ? (
                              <><Shield className="w-3 h-3 mr-1" /> Admin</>
                            ) : (
                              <><Wrench className="w-3 h-3 mr-1" /> Técnico</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            user.isActive !== false
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-red-100 text-red-700 hover:bg-red-100'
                          }>
                            {user.isActive !== false ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Ativo</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleUserStatus(user)}
                              className={`h-8 w-8 p-0 ${
                                user.isActive !== false 
                                  ? 'text-red-500 hover:text-red-700' 
                                  : 'text-green-500 hover:text-green-700'
                              }`}
                            >
                              {user.isActive !== false ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário. Uma senha inicial será definida.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="usuario@hospital.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={createRole} onValueChange={setCreateRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Técnico</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {createRole === 'admin' 
                    ? 'Administradores podem gerenciar usuários e todas as OS.'
                    : 'Técnicos podem visualizar e atualizar status das OS.'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUser} 
                disabled={creating || !createEmail || !createPassword}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário {editingUser?.fullName || editingUser?.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editFullName">Nome Completo</Label>
                <Input
                  id="editFullName"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingUser?.email || ''}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">O email não pode ser alterado.</p>
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Técnico</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-4">
                  <div 
                    className={`flex items-center space-x-2 cursor-pointer ${editIsActive ? 'text-green-600' : 'text-slate-400'}`}
                    onClick={() => setEditIsActive(true)}
                  >
                    <div className={`w-4 h-4 rounded-full border ${editIsActive ? 'border-green-600' : 'border-slate-300'}`}>
                      {editIsActive && <div className="w-2 h-2 bg-green-600 rounded-full m-1"></div>}
                    </div>
                    <span>Ativo</span>
                  </div>
                  <div 
                    className={`flex items-center space-x-2 cursor-pointer ${!editIsActive ? 'text-red-600' : 'text-slate-400'}`}
                    onClick={() => setEditIsActive(false)}
                  >
                    <div className={`w-4 h-4 rounded-full border ${!editIsActive ? 'border-red-600' : 'border-slate-300'}`}>
                      {!editIsActive && <div className="w-2 h-2 bg-red-600 rounded-full m-1"></div>}
                    </div>
                    <span>Inativo</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={updateMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}