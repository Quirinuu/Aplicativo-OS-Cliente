// frontend/src/pages/ServerConfig.jsx
// Tela de configuração do servidor — aparece quando nenhum servidor está configurado
// ou quando o usuário quer trocar o servidor

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Wifi, WifiOff, CheckCircle, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function saveServerConfig(ip, port) {
  const baseURL = `http://${ip}:${port}`;
  const config = { ip, port, baseURL };
  localStorage.setItem('serverConfig', JSON.stringify(config));
  return config;
}

function getSavedConfig() {
  try {
    const saved = localStorage.getItem('serverConfig');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export default function ServerConfig() {
  const navigate = useNavigate();

  const saved = getSavedConfig();
  const [ip, setIp] = useState(saved?.ip || '');
  const [port, setPort] = useState(saved?.port || '5000');
  const [status, setStatus] = useState('idle'); // idle | testing | ok | error
  const [errorMsg, setErrorMsg] = useState('');

  async function testConnection(testIp, testPort) {
    setStatus('testing');
    setErrorMsg('');

    const url = `http://${testIp}:${testPort}/health`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setStatus('ok');
          return true;
        }
      }
      throw new Error('Servidor retornou resposta inesperada');
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg('Tempo esgotado. Verifique o IP e a porta.');
      } else {
        setErrorMsg('Não foi possível conectar. Verifique se o servidor está rodando.');
      }
      setStatus('error');
      return false;
    }
  }

  async function handleConnect() {
    if (!ip.trim()) {
      toast.error('Digite o IP do servidor');
      return;
    }

    const ok = await testConnection(ip.trim(), port.trim() || '5000');

    if (ok) {
      saveServerConfig(ip.trim(), port.trim() || '5000');
      toast.success('Servidor configurado! Redirecionando...');
      setTimeout(() => navigate('/login'), 1000);
    }
  }

  async function handleTestOnly() {
    if (!ip.trim()) {
      toast.error('Digite o IP do servidor');
      return;
    }
    await testConnection(ip.trim(), port.trim() || '5000');
  }

  function handleClearConfig() {
    localStorage.removeItem('serverConfig');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIp('');
    setPort('5000');
    setStatus('idle');
    toast.info('Configuração removida');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Server className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OS Manager</h1>
          <p className="text-slate-400 mt-1">Configure o servidor para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">

          <h2 className="text-lg font-semibold text-slate-800 mb-1">Conexão com o Servidor</h2>
          <p className="text-sm text-slate-500 mb-5">
            Informe o IP e a porta do PC que está rodando o backend na rede local.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ip" className="text-slate-700">IP do Servidor</Label>
              <Input
                id="ip"
                placeholder="ex: 192.168.0.100"
                value={ip}
                onChange={e => { setIp(e.target.value); setStatus('idle'); }}
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>

            <div>
              <Label htmlFor="port" className="text-slate-700">Porta</Label>
              <Input
                id="port"
                placeholder="5000"
                value={port}
                onChange={e => { setPort(e.target.value); setStatus('idle'); }}
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>
          </div>

          {/* Status de conexão */}
          {status !== 'idle' && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm
              ${status === 'testing' ? 'bg-blue-50 text-blue-700' : ''}
              ${status === 'ok' ? 'bg-green-50 text-green-700' : ''}
              ${status === 'error' ? 'bg-red-50 text-red-700' : ''}
            `}>
              {status === 'testing' && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
              {status === 'ok' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {status === 'error' && <WifiOff className="w-4 h-4 flex-shrink-0" />}
              <span>
                {status === 'testing' && 'Testando conexão...'}
                {status === 'ok' && 'Servidor encontrado! Conectado com sucesso.'}
                {status === 'error' && errorMsg}
              </span>
            </div>
          )}

          {/* Botões */}
          <div className="mt-5 space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleConnect}
              disabled={status === 'testing'}
            >
              {status === 'testing' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando...</>
              ) : (
                <><Wifi className="w-4 h-4 mr-2" /> Conectar e Salvar</>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleTestOnly}
              disabled={status === 'testing'}
            >
              Só testar a conexão
            </Button>

            {saved && (
              <Button
                variant="ghost"
                className="w-full text-slate-500 hover:text-red-600"
                onClick={handleClearConfig}
              >
                Limpar configuração salva
              </Button>
            )}
          </div>

          {/* Dica */}
          <div className="mt-5 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            <p className="font-medium text-slate-600 mb-1">Como descobrir o IP do servidor:</p>
            <p>No PC principal (Windows), abra o CMD e digite <code className="bg-slate-200 px-1 rounded">ipconfig</code>. Procure por "Endereço IPv4".</p>
          </div>
        </div>

      </div>
    </div>
  );
}