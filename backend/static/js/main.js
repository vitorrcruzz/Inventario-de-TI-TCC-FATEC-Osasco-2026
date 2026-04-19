let tabelaDispositivos = null;
let tabelaHistorico    = null;
let graficoPie         = null;
let graficoLinha       = null;

// ── Navegação ──────────────────────────────────────────
function mostrarSecao(nome) {
  ['dashboard','dispositivos','historico'].forEach(s => {
    document.getElementById('secao-'+s).style.display = 'none';
  });
  document.getElementById('secao-'+nome).style.display = '';
  document.getElementById('page-title').textContent =
    nome.charAt(0).toUpperCase() + nome.slice(1);
  document.querySelectorAll('#sidebar .nav-link').forEach(el => {
    el.classList.toggle('active',
      el.textContent.trim().toLowerCase().startsWith(nome));
  });
  if (nome === 'dispositivos') carregarDispositivos();
  if (nome === 'historico')    carregarHistorico();
}

// ── Toast ──────────────────────────────────────────────
function mostrarToast(msg, cor = 'bg-success') {
  const t = document.getElementById('toast');
  t.className = `toast align-items-center text-white border-0 ${cor}`;
  document.getElementById('toast-msg').textContent = msg;
  new bootstrap.Toast(t, { delay: 3500 }).show();
}

// ── Estatísticas e gráficos ────────────────────────────
async function carregarStats() {
  const r = await fetch('/api/stats');
  const d = await r.json();

  document.getElementById('stat-total').textContent   = d.total;
  document.getElementById('stat-online').textContent  = d.online;
  document.getElementById('stat-offline').textContent = d.offline;
  document.getElementById('badge-total').textContent  = d.total;

  if (d.ultima_varredura) {
    document.getElementById('stat-varreduras').textContent =
      d.ultima_varredura.id || 0;
    document.getElementById('ultima-varredura-sidebar').textContent =
      d.ultima_varredura.iniciado_em || '—';
  }

  const labels = d.por_tipo.map(t => t.tipo || 'Desconhecido');
  const values = d.por_tipo.map(t => t.quantidade);
  const cores  = ['#2E75B6','#28a745','#fd7e14','#6f42c1','#dc3545','#17a2b8','#ffc107','#20c997'];

  if (graficoPie) graficoPie.destroy();
  graficoPie = new Chart(document.getElementById('grafico-tipos'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: cores, borderWidth: 2 }]
    },
    options: {
      plugins: { legend: { position: 'right', labels: { font: { size: 12 } } } },
      cutout: '60%',
    }
  });
}

async function carregarGraficoHistorico() {
  const r = await fetch('/api/historico');
  const lista = await r.json();
  const recentes = lista.slice(0, 10).reverse();

  const labels  = recentes.map(h => h.iniciado_em.slice(11, 16));
  const online  = recentes.map(h => h.total_online);
  const offline = recentes.map(h => h.total_offline);

  if (graficoLinha) graficoLinha.destroy();
  graficoLinha = new Chart(document.getElementById('grafico-historico'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Online',  data: online,  backgroundColor: '#28a74599' },
        { label: 'Offline', data: offline, backgroundColor: '#dc354599' },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// ── Modal de detalhes ──────────────────────────────────
function abrirModal(d) {
  const statusBadge = d.status === 'online'
    ? '<span class="badge badge-online px-2 py-1">● Online</span>'
    : '<span class="badge badge-offline px-2 py-1">○ Offline</span>';

  document.getElementById('modal-titulo').textContent =
    `${d.hostname} — ${d.ip}`;

  document.getElementById('modal-corpo').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge bg-light text-dark border fs-6">${d.tipo}</span>
          ${statusBadge}
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-cpu me-1"></i>Hardware</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">Modelo</td>
                <td><strong>${d.modelo}</strong></td></tr>
            <tr><td class="text-muted">Processador</td>
                <td><strong>${d.processador}</strong></td></tr>
            <tr><td class="text-muted">Memória</td>
                <td><strong>${d.memoria}</strong></td></tr>
            <tr><td class="text-muted">Armazenamento</td>
                <td><strong>${d.armazenamento}</strong></td></tr>
          </table>
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-hdd-network me-1"></i>Rede</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">IP</td>
                <td><code>${d.ip}</code></td></tr>
            <tr><td class="text-muted">Hostname</td>
                <td><strong>${d.hostname}</strong></td></tr>
            <tr><td class="text-muted">Interfaces</td>
                <td><strong>${d.interfaces ?? '—'}</strong></td></tr>
            <tr><td class="text-muted">Uptime</td>
                <td><strong>${d.uptime}</strong></td></tr>
          </table>
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-display me-1"></i>Sistema</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">Sistema Op.</td>
                <td><strong>${d.sistema_op}</strong></td></tr>
            <tr><td class="text-muted">Descrição</td>
                <td><small>${d.descricao}</small></td></tr>
          </table>
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-geo-alt me-1"></i>Localização</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">Local</td>
                <td><strong>${d.localizacao}</strong></td></tr>
            <tr><td class="text-muted">Contato</td>
                <td><small>${d.contato}</small></td></tr>
            <tr><td class="text-muted">Última varredura</td>
                <td><small>${d.ultima_vez}</small></td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('modalDetalhes')).show();
}

// ── Tabela de dispositivos ─────────────────────────────
function badgeLicenca(d) {
  if (d.licenca_expira === '—' || d.licenca_expira === null) {
    return '<span class="badge bg-secondary">Sem licença</span>';
  }
  const sl = d.status_licenca;
  if (sl === 'expirada') {
    return `<span class="badge bg-danger">Expirada</span>`;
  }
  if (sl === 'critica') {
    return `<span class="badge bg-danger">${d.dias_para_expirar}d restantes</span>`;
  }
  if (sl === 'atencao') {
    return `<span class="badge bg-warning text-dark">${d.dias_para_expirar}d restantes</span>`;
  }
  return `<span class="badge bg-success">${d.dias_para_expirar}d restantes</span>`;
}

function abrirModal(d) {
  const statusBadge = d.status === 'online'
    ? '<span class="badge badge-online px-2 py-1">● Online</span>'
    : '<span class="badge badge-offline px-2 py-1">○ Offline</span>';

  document.getElementById('modal-titulo').textContent =
    `${d.hostname} — ${d.ip}`;

  document.getElementById('modal-corpo').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge bg-light text-dark border fs-6">${d.tipo}</span>
          ${statusBadge}
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-cpu me-1"></i>Hardware</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">Modelo</td>
                <td><strong>${d.modelo}</strong></td></tr>
            <tr><td class="text-muted">Processador</td>
                <td><strong>${d.processador}</strong></td></tr>
            <tr><td class="text-muted">Memória</td>
                <td><strong>${d.memoria}</strong></td></tr>
            <tr><td class="text-muted">Armazenamento</td>
                <td><strong>${d.armazenamento}</strong></td></tr>
          </table>
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-hdd-network me-1"></i>Rede</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">IP</td>
                <td><code>${d.ip}</code></td></tr>
            <tr><td class="text-muted">Hostname</td>
                <td><strong>${d.hostname}</strong></td></tr>
            <tr><td class="text-muted">Interfaces</td>
                <td><strong>${d.interfaces ?? '—'}</strong></td></tr>
            <tr><td class="text-muted">Uptime</td>
                <td><strong>${d.uptime}</strong></td></tr>
          </table>
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-display me-1"></i>Sistema</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">Sistema Op.</td>
                <td><strong>${d.sistema_op}</strong></td></tr>
            <tr><td class="text-muted">Descrição</td>
                <td><small>${d.descricao}</small></td></tr>
          </table>
        </div>
      </div>

      <div class="col-md-6">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-key me-1"></i>Licença</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:45%">Software</td>
                <td><strong>${d.licenca_software}</strong></td></tr>
            <tr><td class="text-muted">Expira em</td>
                <td><strong>${d.licenca_expira}</strong></td></tr>
            <tr><td class="text-muted">Status</td>
                <td>${badgeLicenca(d)}</td></tr>
          </table>
        </div>
      </div>

      <div class="col-12">
        <div class="info-card">
          <div class="info-label"><i class="bi bi-geo-alt me-1"></i>Localização e contato</div>
          <table class="table table-sm table-borderless mb-0">
            <tr><td class="text-muted" style="width:20%">Local</td>
                <td><strong>${d.localizacao}</strong></td></tr>
            <tr><td class="text-muted">Contato</td>
                <td><small>${d.contato}</small></td></tr>
            <tr><td class="text-muted">Última varredura</td>
                <td><small>${d.ultima_vez}</small></td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('modalDetalhes')).show();
}

async function carregarDispositivos() {
  const tipo   = document.getElementById('filtro-tipo').value;
  const status = document.getElementById('filtro-status').value;
  let url = '/api/dispositivos?';
  if (tipo)   url += `tipo=${encodeURIComponent(tipo)}&`;
  if (status) url += `status=${status}`;

  const r = await fetch(url);
  const lista = await r.json();

  if (tabelaDispositivos) {
    tabelaDispositivos.destroy();
    tabelaDispositivos = null;
    document.querySelector('#tabela-dispositivos tbody').innerHTML = '';
  }

  const tbody = document.querySelector('#tabela-dispositivos tbody');
  lista.forEach(d => {
    const badge = d.status === 'online'
      ? '<span class="badge badge-online px-2 py-1">● Online</span>'
      : '<span class="badge badge-offline px-2 py-1">○ Offline</span>';
    tbody.innerHTML += `
      <tr style="cursor:pointer" onclick='abrirModal(${JSON.stringify(d)})'>
        <td><code>${d.ip}</code></td>
        <td><strong>${d.hostname}</strong></td>
        <td><span class="badge bg-light text-dark border">${d.tipo}</span></td>
        <td>${badge}</td>
        <td><small>${d.modelo}</small></td>
        <td><small>${d.sistema_op}</small></td>
        <td><small>${d.processador}</small></td>
        <td><small>${d.memoria}</small></td>
        <td><small>${d.armazenamento}</small></td>
        <td>${badgeLicenca(d)}</td>
        <td>${d.uptime}</td>
        <td><small class="text-muted">${d.ultima_vez}</small></td>
      </tr>`;
  });

  tabelaDispositivos = new DataTable('#tabela-dispositivos', {
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' },
    pageLength: 15,
    order: [[3, 'desc']],
    scrollX: true,
  });
}
function filtrarTabela() { carregarDispositivos(); }

// ── Tabela histórico ───────────────────────────────────
async function carregarHistorico() {
  const r = await fetch('/api/historico');
  const lista = await r.json();

  if (tabelaHistorico) {
    tabelaHistorico.destroy();
    tabelaHistorico = null;
    document.querySelector('#tabela-historico tbody').innerHTML = '';
  }

  const tbody = document.querySelector('#tabela-historico tbody');
  lista.forEach(h => {
    const origem = h.disparado_por === 'manual'
      ? '<span class="badge bg-info text-dark">Manual</span>'
      : '<span class="badge bg-secondary">Automático</span>';
    tbody.innerHTML += `
      <tr>
        <td>${h.id}</td>
        <td>${h.iniciado_em}</td>
        <td>${h.finalizado_em}</td>
        <td class="text-center">${h.total_escaneado}</td>
        <td class="text-center text-success fw-bold">${h.total_online}</td>
        <td class="text-center text-danger">${h.total_offline}</td>
        <td>${origem}</td>
      </tr>`;
  });

  tabelaHistorico = new DataTable('#tabela-historico', {
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' },
    pageLength: 15,
    order: [[0, 'desc']],
  });
}

// ── Varredura manual ───────────────────────────────────
async function dispararVarredura() {
  const btn     = document.getElementById('btn-scan');
  const spinner = document.getElementById('scan-spinner');
  btn.classList.add('scanning');
  spinner.classList.add('visible');

  try {
    const r = await fetch('/api/scan', { method: 'POST' });
    const d = await r.json();
    mostrarToast(
      `Varredura concluída: ${d.online} online, ${d.offline} offline`,
      'bg-success'
    );
    await carregarStats();
    await carregarGraficoHistorico();
  } catch (e) {
    mostrarToast('Erro ao realizar varredura.', 'bg-danger');
  } finally {
    btn.classList.remove('scanning');
    spinner.classList.remove('visible');
  }
}

// ── Init ───────────────────────────────────────────────
(async () => {
  await carregarStats();
  await carregarGraficoHistorico();
  setInterval(async () => {
    await carregarStats();
    await carregarGraficoHistorico();
  }, 30000);
})();