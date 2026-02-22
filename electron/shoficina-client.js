// electron/shoficina-client.js
// Roda no processo principal do Electron — lê MDB local e envia para o servidor

const { execFileSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const os    = require('os');
const http  = require('http');
const https = require('https');

const MDB_PATH      = process.env.SHOFICINA_PATH     || 'C:\\SHARMAQ\\SHOficina\\dados.mdb';
const MDB_PASS      = process.env.SHOFICINA_PASS     || '!(&&!!)&';
const POLL_INTERVAL = parseInt(process.env.SHOFICINA_INTERVAL || '5000');

// Fila local para OS que falharam ao enviar (servidor offline)
const QUEUE_FILE = path.join(os.homedir(), 'AppData', 'Roaming', 'os-manager-cliente', 'sho_queue.json');

function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  } catch {}
  return [];
}

function saveQueue(queue) {
  try {
    const dir = path.dirname(QUEUE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
  } catch (e) {
    console.error('[SHOficina-C] Erro ao salvar fila:', e.message);
  }
}

// ── HTTP helper ────────────────────────────────────────────────────────────────
function apiRequest(serverUrl, token, method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const url    = new URL(endpoint, serverUrl);
    const data   = body ? JSON.stringify(body) : null;
    const lib    = url.protocol === 'https:' ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port:     url.port,
      path:     url.pathname,
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

// ── PowerShell MDB ─────────────────────────────────────────────────────────────
function runPS1(scriptContent) {
  const tmpFile = path.join(os.tmpdir(), `shoc_${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, '\uFEFF' + scriptContent, { encoding: 'utf8' });
    const result = execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tmpFile,
    ], { timeout: 15000, encoding: 'utf8' });
    return result.trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

function buildConnScript(body) {
  return `
$ErrorActionPreference = 'Stop'
$pass = @'
${MDB_PASS}
'@
$pass = $pass.Trim()
$src = @'
${MDB_PATH}
'@
$src = $src.Trim()
$conn = New-Object System.Data.OleDb.OleDbConnection
$conn.ConnectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source='$src';Jet OLEDB:Database Password='$pass';"
try { $conn.Open() } catch {
  $conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source='$src';Jet OLEDB:Database Password='$pass';"
  $conn.Open()
}
${body}
$conn.Close()
`.trim();
}

function queryMDB(sql) {
  const body = `
$cmd = $conn.CreateCommand()
$cmd.CommandText = @'
${sql}
'@
$reader = $cmd.ExecuteReader()
$rows = [System.Collections.Generic.List[object]]::new()
while ($reader.Read()) {
  $row = @{}
  for ($i = 0; $i -lt $reader.FieldCount; $i++) {
    $row[$reader.GetName($i)] = if ($reader.IsDBNull($i)) { $null } else { $reader.GetValue($i).ToString() }
  }
  $rows.Add([PSCustomObject]$row)
}
$reader.Close()
if ($rows.Count -eq 0) { Write-Output '[]' } else { $rows | ConvertTo-Json -Depth 2 -Compress }
`;
  try {
    const out = runPS1(buildConnScript(body));
    if (!out || out === '[]' || out === 'null') return [];
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error('[SHOficina-C] Erro MDB:', err.message.split('\n')[0]);
    return null;
  }
}

// ── Mapeamento ─────────────────────────────────────────────────────────────────
function mapStatus(situacao, pronto) {
  if (String(pronto || '').trim().toUpperCase() === 'S') return 'COMPLETED';
  if (!situacao) return 'RECEIVED';
  const v = String(situacao).toLowerCase().trim();
  if (v.includes('conclu') || v.includes('pronto') || v.includes('entreg')) return 'COMPLETED';
  if (v.includes('andamento') || v.includes('execu') || v.includes('reparo'))  return 'IN_PROGRESS';
  if (v.includes('aguard') || v.includes('espera'))                             return 'WAITING';
  return 'RECEIVED';
}

function mapPriority(p) {
  if (!p) return 'MEDIUM';
  const v = String(p).toLowerCase();
  if (v === 's' || v === '1' || v.includes('urg')) return 'URGENT';
  if (v.includes('alta') || v === '2')              return 'HIGH';
  if (v.includes('baixa') || v === '4')             return 'LOW';
  return 'MEDIUM';
}

function rowToOS(row) {
  const aparelho  = String(row['APARELHO']    || '').trim();
  const marca     = String(row['MARCA']       || '').trim();
  const modelo    = String(row['MODELO']      || '').trim();
  const equipment = [aparelho, marca, modelo].filter(Boolean).join(' — ') || 'Equipamento';

  const serial    = String(row['SERIE']       || '').trim() || null;
  const patrim    = String(row['PATRIMONIO']  || '').trim();
  const acess     = String(row['ACESSORIO']   || '').trim();
  const accParts  = [acess, patrim ? `Patrimônio: ${patrim}` : null].filter(Boolean);

  const defect    = String(row['DEFEITO']     || '').trim() || null;
  const obs       = String(row['OBS_SERVICO'] || '').trim() || null;
  const extId     = String(row['CODIGO']      || '').trim();
  const status    = mapStatus(row['SITUACAO'], row['PRONTO']);
  const priority  = mapPriority(row['PRIOR']);
  const clientName = String(row['NOME_CLIENTE'] || row['COD_CLIENTE'] || '').trim() || 'Cliente SHOficina';

  return {
    osNumber:                 extId,
    clientName,
    equipmentName:            equipment,
    serialNumber:             serial,
    accessories:              accParts.join(' | ') || null,
    hasPreviousDefect:        !!defect,
    previousDefectDescription: defect,
    optionalDescription:      `[shoficina:${extId}]${obs ? ' ' + obs : ''}`.trim(),
    priority,
    currentStatus:            status,
    _extId:                   extId,   // campo auxiliar, não vai para API
    _status:                  status,  // idem
  };
}

// ── Classe principal ───────────────────────────────────────────────────────────
class SHOficinaClient {
  constructor() {
    this.timer      = null;
    this.lastCheck  = new Date(0).toISOString();
    this.isWindows  = process.platform === 'win32';
    this.serverUrl  = null;
    this.token      = null;
    this.queue      = loadQueue();  // OS pendentes para envio
  }

  // Chamado pelo main.js após login ou ao iniciar com token salvo
  start({ serverUrl, token }) {
    if (!this.isWindows) return;
    if (!fs.existsSync(MDB_PATH)) {
      console.log('[SHOficina-C] MDB não encontrado — sync desativado neste PC.');
      return;
    }

    this.serverUrl = serverUrl;
    this.token     = token;

    console.log('[SHOficina-C] Iniciando sync local → servidor');
    console.log(`[SHOficina-C] MDB: ${MDB_PATH}`);

    // Tenta enviar fila pendente imediatamente
    this._flushQueue();

    this.timer = setInterval(() => this._poll(), POLL_INTERVAL);
    this._poll();
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  updateToken(token) {
    this.token = token;
    if (token) this._flushQueue(); // ao reconectar, tenta enviar pendentes
  }

  updateServerUrl(serverUrl) {
    this.serverUrl = serverUrl;
  }

  async _poll() {
    const d   = new Date(this.lastCheck);
    const fmt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const rows = queryMDB(`
      SELECT O.*, C.NOME AS NOME_CLIENTE
      FROM [ORDEMS] O
      LEFT JOIN [CLIENTES] C ON C.CODIGO = O.COD_CLIENTE
      WHERE O.[ENTRADA] >= #${fmt}#
    `);

    if (rows === null) return; // erro de leitura MDB

    this.lastCheck = new Date().toISOString();

    for (const row of rows) {
      const osData = rowToOS(row);
      if (!osData.osNumber) continue;
      await this._sendOS(osData);
    }

    // Sempre tenta enviar pendentes da fila
    await this._flushQueue();
  }

  async _sendOS(osData) {
    if (!this.serverUrl || !this.token) {
      this._enqueue(osData);
      return;
    }

    const { _extId, _status, ...payload } = osData;

    try {
      // Verifica se já existe pelo número da OS
      const check = await apiRequest(this.serverUrl, this.token, 'GET', `/api/os?search=${_extId}`, null);

      // Busca OS existente com esse número
      const existing = check.body?.orders?.find(o =>
        o.osNumber === _extId || o.optionalDescription?.includes(`[shoficina:${_extId}]`)
      );

      if (!existing) {
        // Cria nova OS
        await apiRequest(this.serverUrl, this.token, 'POST', '/api/os', payload);
        console.log(`[SHOficina-C] ✅ OS enviada: #${_extId} — ${osData.clientName}`);
      } else if (existing.currentStatus !== _status) {
        // Atualiza status
        await apiRequest(this.serverUrl, this.token, 'PUT', `/api/os/${existing.id}`, {
          currentStatus: _status,
          completedAt:   _status === 'COMPLETED' ? new Date().toISOString() : null,
        });
        console.log(`[SHOficina-C] 🔄 OS atualizada: #${_extId} → ${_status}`);
      }
    } catch (err) {
      console.warn(`[SHOficina-C] ⚠️  Servidor offline — OS #${_extId} na fila`);
      this._enqueue(osData);
    }
  }

  _enqueue(osData) {
    // Evita duplicatas na fila pelo extId
    const already = this.queue.find(q => q._extId === osData._extId);
    if (!already) {
      this.queue.push(osData);
      saveQueue(this.queue);
    } else {
      // Atualiza se status mudou
      if (already._status !== osData._status) {
        Object.assign(already, osData);
        saveQueue(this.queue);
      }
    }
  }

  async _flushQueue() {
    if (!this.serverUrl || !this.token || this.queue.length === 0) return;

    console.log(`[SHOficina-C] 📤 Enviando ${this.queue.length} OS da fila...`);
    const failed = [];

    for (const osData of this.queue) {
      try {
        await this._sendOS(osData);
        // Se chegou aqui sem exception, foi enviado — remove da fila
        // (o _sendOS vai tentar enqueue de novo se falhar, então não removemos aqui)
      } catch {
        failed.push(osData);
      }
    }

    // Remove da fila os que foram enviados com sucesso
    // (os que falharam foram re-enfileirados pelo _sendOS)
    // Recarrega a fila do arquivo para pegar o estado atual
    this.queue = loadQueue();
  }
}

// Singleton
const shoClient = new SHOficinaClient();
module.exports = { shoClient };