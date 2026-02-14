import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Key, Save, Shield, Calendar, AlertCircle } from "lucide-react";
import api from '@/api/client';
import { safeFormatDate } from '@/utils/date';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Carregar dados do usuário
  useEffect(() => {
    api.auth.me()
      .then(userData => {
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          fullName: userData.fullName || '',
          username: userData.username || '',
          email: userData.email || '',
        }));
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.users.update(user.id, data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setErrors({});
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: (data) => {
      // Aqui você precisaria de um endpoint específico para alterar senha
      // Por enquanto, vou usar o update mesmo
      return api.users.update(user.id, {
        password: data.newPassword,
        // Em um sistema real, você precisaria enviar a senha atual também
      });
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso! Faça login novamente.');
      api.auth.logout();
      navigate('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'A senha deve ter pelo menos 6 caracteres';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'As senhas não coincidem';
      }
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Digite sua senha atual';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const updateData = {
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
    };

    // Se há nova senha, adiciona ao update
    if (formData.newPassword && formData.currentPassword) {
      // Em um sistema real, você enviaria currentPassword para validação
      updateData.password = formData.newPassword;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (window.confirm('Tem certeza que deseja alterar sua senha? Você será desconectado.')) {
      changePasswordMutation.mutate({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const isChangingPassword = formData.newPassword || formData.currentPassword || formData.confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Meu Perfil</h1>
              <p className="text-slate-500">Gerencie suas informações de conta</p>
            </div>
          </div>
          <Button
            variant={editing ? "default" : "outline"}
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={updateProfileMutation.isPending || changePasswordMutation.isPending}
          >
            {editing ? (
              <>
                {updateProfileMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </>
            ) : (
              'Editar Perfil'
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Informações básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {editing ? (
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        disabled={updateProfileMutation.isPending}
                      />
                    ) : (
                      <span className="text-slate-700">{user.fullName || 'Não informado'}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  {editing ? (
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={updateProfileMutation.isPending}
                    />
                  ) : (
                    <span className="font-medium text-slate-700">{user.username}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={updateProfileMutation.isPending}
                      />
                    ) : (
                      <span className="text-slate-700">{user.email || 'Não informado'}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alteração de senha */}
            <Card>
              <CardHeader>
                <CardTitle>Alteração de Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        Senha Atual
                        {errors.currentPassword && (
                          <span className="text-red-500 text-sm ml-2">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {errors.currentPassword}
                          </span>
                        )}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" />
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, currentPassword: e.target.value });
                            if (errors.currentPassword) setErrors({...errors, currentPassword: ''});
                          }}
                          placeholder="Digite sua senha atual"
                          disabled={updateProfileMutation.isPending}
                          className={errors.currentPassword ? 'border-red-500' : ''}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        Nova Senha
                        {errors.newPassword && (
                          <span className="text-red-500 text-sm ml-2">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {errors.newPassword}
                          </span>
                        )}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, newPassword: e.target.value });
                          if (errors.newPassword) setErrors({...errors, newPassword: ''});
                        }}
                        placeholder="Digite a nova senha"
                        disabled={updateProfileMutation.isPending}
                        className={errors.newPassword ? 'border-red-500' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirmar Nova Senha
                        {errors.confirmPassword && (
                          <span className="text-red-500 text-sm ml-2">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {errors.confirmPassword}
                          </span>
                        )}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                        }}
                        placeholder="Confirme a nova senha"
                        disabled={updateProfileMutation.isPending}
                        className={errors.confirmPassword ? 'border-red-500' : ''}
                      />
                    </div>

                    {isChangingPassword && (
                      <Button
                        onClick={handleChangePassword}
                        disabled={changePasswordMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {changePasswordMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Key className="w-4 h-4 mr-2" />
                        )}
                        Alterar Senha e Sair
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditing(true);
                        setFormData(prev => ({
                          ...prev,
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        }));
                      }}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna da direita - Informações da conta */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Função</span>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${
                      user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                    <span className="font-medium">
                      {user.role === 'admin' ? 'Administrador' : 'Técnico'}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Status da Conta</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Membro desde</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {user.createdAt
                        ? safeFormatDate(user.createdAt, 'dd/MM/yyyy')
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Última atualização</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {user.updatedAt
                        ? safeFormatDate(user.updatedAt, 'dd/MM/yyyy')
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {editing && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">Atenção!</p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• Ao salvar alterações básicas, seus dados serão atualizados</li>
                        <li>• Ao alterar a senha, você será desconectado</li>
                        <li>• Certifique-se de que os dados estão corretos antes de salvar</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}