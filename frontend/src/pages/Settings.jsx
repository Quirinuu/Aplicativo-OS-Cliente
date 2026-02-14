import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Save, Globe, Bell, Database, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [settings, setSettings] = useState({
    // Configurações de notificação
    emailNotifications: true,
    pushNotifications: false,
    osUpdates: true,
    newComments: true,
    
    // Configurações do sistema
    autoRefresh: true,
    refreshInterval: 30,
    defaultPriority: 'MEDIUM',
    
    // Configurações de exportação
    exportFormat: 'CSV',
    includeComments: true,
    
    // Segurança
    sessionTimeout: 60,
    requirePasswordChange: false,
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Aqui você salvaria as configurações no backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Configurações</h1>
              <p className="text-slate-500">Personalize o comportamento do sistema</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Notificações por Email</Label>
                    <p className="text-sm text-slate-500">Receba atualizações por email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="osUpdates">Atualizações de OS</Label>
                    <p className="text-sm text-slate-500">Notificar sobre mudanças em OS</p>
                  </div>
                  <Switch
                    id="osUpdates"
                    checked={settings.osUpdates}
                    onCheckedChange={(checked) => setSettings({...settings, osUpdates: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newComments">Novos Comentários</Label>
                    <p className="text-sm text-slate-500">Notificar sobre novos comentários</p>
                  </div>
                  <Switch
                    id="newComments"
                    checked={settings.newComments}
                    onCheckedChange={(checked) => setSettings({...settings, newComments: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Sistema
                </CardTitle>
                <CardDescription>
                  Configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoRefresh">Atualização Automática</Label>
                    <p className="text-sm text-slate-500">Atualizar dados automaticamente</p>
                  </div>
                  <Switch
                    id="autoRefresh"
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => setSettings({...settings, autoRefresh: checked})}
                  />
                </div>

                <Separator />

                {settings.autoRefresh && (
                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Intervalo de Atualização (segundos)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="refreshInterval"
                        type="number"
                        min="10"
                        max="300"
                        value={settings.refreshInterval}
                        onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value) || 30})}
                        className="w-32"
                      />
                      <span className="text-sm text-slate-500">10-300 segundos</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">
            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tempo de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value) || 60})}
                  />
                  <p className="text-xs text-slate-500">Tempo até logout automático</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requirePasswordChange">Exigir Troca de Senha</Label>
                    <p className="text-sm text-slate-500">Forçar troca periódica</p>
                  </div>
                  <Switch
                    id="requirePasswordChange"
                    checked={settings.requirePasswordChange}
                    onCheckedChange={(checked) => setSettings({...settings, requirePasswordChange: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exportação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Exportação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exportFormat">Formato Padrão</Label>
                  <select
                    id="exportFormat"
                    value={settings.exportFormat}
                    onChange={(e) => setSettings({...settings, exportFormat: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="CSV">CSV</option>
                    <option value="Excel">Excel</option>
                    <option value="PDF">PDF</option>
                  </select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="includeComments">Incluir Comentários</Label>
                    <p className="text-sm text-slate-500">Exportar histórico de comentários</p>
                  </div>
                  <Switch
                    id="includeComments"
                    checked={settings.includeComments}
                    onCheckedChange={(checked) => setSettings({...settings, includeComments: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}