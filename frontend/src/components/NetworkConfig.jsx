import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, Settings, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { configureBackendServer } from '@/api/client';
import { socketService } from '@/api/socket';

export default function NetworkConfig() {
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('5000');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    // Carregar configuração salva
    const savedHost = localStorage.getItem('backend_host');
    const savedPort = localStorage.getItem('backend_port');
    
    if (savedHost && savedPort) {
      setServerHost(savedHost);
      setServerPort(savedPort);
      setCurrentConfig({ host: savedHost, port: savedPort });
    }

    // Verificar status do WebSocket
    const interval = setInterval(() => {
      setIsSocketConnected(socketService.isSocketConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTestConnection = async () => {
    if (!serverHost || !serverPort) {
      toast.error('Preencha o IP e a porta do servidor');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const result = await configureBackendServer(serverHost, parseInt(serverPort));
      
      setConnectionStatus({
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        data: result.data
      });
      
      setCurrentConfig({ host: serverHost, port: serverPort });
      
      toast.success('✅ Conectado ao servidor!', {
        description: `${serverHost}:${serverPort}`
      });

      // Reconectar WebSocket com nova configuração
      socketService.disconnect();
      const token = localStorage.getItem('token');
      if (token) {
        setTimeout(() => {
          socketService.connect(token);
        }, 1000);
      }

    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error.message
      });
      
      toast.error('❌ Falha na conexão', {
        description: error.message
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSetLocalhost = () => {
    setServerHost('localhost');
    setServerPort('5000');
  };

  const handleAutoDetect = async () => {
    setIsTestingConnection(true);
    toast.info('🔍 Procurando servidor na rede local...');

    // Lista de IPs comuns em redes locais para tentar
    const commonIPs = [
      '192.168.0.1', '192.168.0.100', '192.168.0.2',
      '192.168.1.1', '192.168.1.100', '192.168.1.2',
      '10.0.0.1', '10.0.0.2',
    ];

    const port = parseInt(serverPort) || 5000;

    for (const ip of commonIPs) {
      try {
        const response = await fetch(`http://${ip}:${port}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
          setServerHost(ip);
          toast.success(`✅ Servidor encontrado em ${ip}:${port}`);
          setIsTestingConnection(false);
          return;
        }
      } catch (error) {
        // Continuar tentando
      }
    }

    toast.error('❌ Servidor não encontrado automaticamente');
    toast.info('💡 Digite o IP manualmente', {
      description: 'Verifique o IP do servidor no computador principal'
    });
    setIsTestingConnection(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle>Configuração de Rede</CardTitle>
              <CardDescription>
                Configure a conexão com o servidor principal
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status de Conexão */}
          <Alert className={isSocketConnected ? 'border-green-500 bg-green-50' : 'border-gray-300'}>
            <div className="flex items-center gap-3">
              {isSocketConnected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-gray-400" />
              )}
              <AlertDescription>
                <span className="font-medium">
                  {isSocketConnected ? 'Conectado e sincronizado' : 'Desconectado'}
                </span>
                {currentConfig && (
                  <span className="text-sm text-slate-500 ml-2">
                    ({currentConfig.host}:{currentConfig.port})
                  </span>
                )}
              </AlertDescription>
            </div>
          </Alert>

          {/* Configuração Rápida */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Configuração Rápida</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSetLocalhost}
                className="flex-1"
              >
                💻 Localhost
              </Button>
              <Button 
                variant="outline" 
                onClick={handleAutoDetect}
                disabled={isTestingConnection}
                className="flex-1"
              >
                {isTestingConnection ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  '🔍 '
                )}
                Auto-detectar
              </Button>
            </div>
          </div>

          {/* Configuração Manual */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Configuração Manual</Label>
            
            <div className="space-y-2">
              <Label htmlFor="serverHost">IP do Servidor</Label>
              <Input
                id="serverHost"
                placeholder="192.168.1.100"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Digite o endereço IP do computador principal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverPort">Porta</Label>
              <Input
                id="serverPort"
                type="number"
                placeholder="5000"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Geralmente é 5000 (verifique no servidor)
              </p>
            </div>
          </div>

          {/* Botão de Teste */}
          <Button 
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando Conexão...
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Testar e Salvar Configuração
              </>
            )}
          </Button>

          {/* Resultado do Teste */}
          {connectionStatus && (
            <Alert className={connectionStatus.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-start gap-3">
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                    {connectionStatus.message}
                  </p>
                  {connectionStatus.data && (
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      <p>Servidor: {connectionStatus.data.serverIp || 'N/A'}</p>
                      <p>Porta: {connectionStatus.data.port || 'N/A'}</p>
                      <p>Status: {connectionStatus.data.status || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Como encontrar o IP do servidor:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>No computador principal, abra o aplicativo</li>
              <li>O IP aparecerá na tela inicial do backend</li>
              <li>Ou execute: <code className="bg-blue-100 px-1 rounded">ipconfig</code> (Windows) ou <code className="bg-blue-100 px-1 rounded">ifconfig</code> (Mac/Linux)</li>
              <li>Procure por "IPv4" ou "inet" - geralmente começa com 192.168.x.x</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
