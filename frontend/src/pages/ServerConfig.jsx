// frontend/src/pages/ServerConfig.jsx  ← APP CLIENTE
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Server, Wifi, WifiOff, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

function getSavedConfig() {
  try {
    const s = localStorage.getItem('serverConfig');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export default function ServerConfig() {
  const navigate = useNavigate();
  const saved = getSavedConfig();

  const [ip, setIp] = useState(saved?.ip || '');
  const [port, setPort] = useState(saved?.port || '5000');
  const [status, setStatus] = useState('idle'); // idle | testing | ok | error
  const [errorMsg, setErrorMsg] = useState('');

  function validateIP(value) {
    const v = value.trim().toLowerCase();
    if (v === 'localhost' || v === '127.0.0.1') {
      return 'Use o IP da rede (ex: 192.168.0.100), não localhost. Este app conecta a outro PC.';
    }
    if (!v) return 'Digite o IP do servidor';
    return null;
  }

  async function testConnection(testIp, testPort) {
    setStatus('testing');
    setErrorMsg('');

    const url = `http://${testIp.trim()}:${testPort.trim()}/health`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') { setStatus('ok'); return true; }
      }
      throw new Error('Resposta inesperada');
    } catch (err) {
      setErrorMsg(err.name === 'AbortError'
        ? 'Tempo esgotado. Verifique se o IP está correto e o servidor está ligado.'
        : 'Não foi possível conectar. Verifique IP, porta e se o servidor está rodando.');
      setStatus('error');
      return false;
    }
  }

  async function handleConnect() {
    const validationError = validateIP(ip);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const ok = await testConnection(ip, port || '5000');
    if (ok) {
      const config = {
        ip: ip.trim(),
        port: (port || '5000').trim(),
        baseURL: `http://${ip.trim()}:${(port || '5000').trim()}`
      };
      localStorage.setItem('serverConfig', JSON.stringify(config));
      // Limpa sessão anterior (era de outro servidor)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Servidor configurado!');
      setTimeout(() => navigate('/login'), 800);
    }
  }

  function handleClear() {
    localStorage.removeItem('serverConfig');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIp(''); setPort('5000'); setStatus('idle');
    toast.info('Configuração removida');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Server className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OS Manager</h1>
          <p className="text-slate-400 mt-1">Configure o servidor para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conexão com o Servidor</CardTitle>
            <CardDescription>
              Informe o IP e porta do PC que roda o backend na rede local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <Label htmlFor="ip">IP do Servidor</Label>
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
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                placeholder="5000"
                value={port}
                onChange={e => { setPort(e.target.value); setStatus('idle'); }}
                className="mt-1"
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>

            {/* Aviso se digitou localhost */}
            {(ip.trim().toLowerCase() === 'localhost' || ip.trim() === '127.0.0.1') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Use o <strong>IP da rede</strong> do servidor (ex: 192.168.0.100), não localhost. Este app conecta a outro computador.</span>
              </div>
            )}

            {status !== 'idle' && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm
                ${status === 'testing' ? 'bg-blue-50 text-blue-700' : ''}
                ${status === 'ok'      ? 'bg-green-50 text-green-700' : ''}
                ${status === 'error'   ? 'bg-red-50 text-red-700' : ''}
              `}>
                {status === 'testing' && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
                {status === 'ok'      && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {status === 'error'   && <WifiOff className="w-4 h-4 flex-shrink-0" />}
                <span>
                  {status === 'testing' && 'Testando conexão...'}
                  {status === 'ok'      && 'Servidor encontrado! Redirecionando...'}
                  {status === 'error'   && errorMsg}
                </span>
              </div>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleConnect}
              disabled={status === 'testing'}
            >
              {status === 'testing'
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Conectando...</>
                : <><Wifi className="w-4 h-4 mr-2" />Conectar e Salvar</>
              }
            </Button>

            {saved && (
              <Button variant="ghost" className="w-full text-slate-500 hover:text-red-600" onClick={handleClear}>
                Limpar configuração salva
              </Button>
            )}

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-600">Como descobrir o IP do servidor:</p>
              <p>No PC com o backend, abra o CMD e digite <code className="bg-slate-200 px-1 rounded">ipconfig</code>. Procure "Endereço IPv4".</p>
              <p>Exemplo: <code className="bg-slate-200 px-1 rounded">192.168.0.105</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}