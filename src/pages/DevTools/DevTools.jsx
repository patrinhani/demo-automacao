import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, push, set, get, update } from 'firebase/database'; // 'remove' removido pois não estamos usando direto aqui
import { useUser } from '../../contexts/UserContext';
import Logo from '../../components/Logo';
import './DevTools.css';

// ... (MOCKS_RH MANTIDO IGUAL - NÃO ALTERAR) ...
const MOCKS_RH = [
  { nome: "Lucas Mendes", cargo: "Dev. Júnior", setor: "TI", data: "28/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { nome: "Mariana Costa", cargo: "Analista Fin. Jr", setor: "Financeiro", data: "28/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  // ... (Lista mock continua igual)
];

export default function DevTools() {
  const navigate = useNavigate();
  // Pega o switchRole do Contexto
  const { simulatedRole, switchRole } = useUser(); 
  
  const [log, setLog] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await get(ref(db, `users/${user.uid}`));
        if (snap.exists()) {
          setUserProfile({ uid: user.uid, email: user.email, ...snap.val() });
        } else {
          setUserProfile({ uid: user.uid, email: user.email, nome: 'Dev User', cargo: 'Tester' });
        }
      }
    };
    fetchUser();
  }, []);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLog(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // --- GERADORES (MANTIDOS IGUAIS) ---
  const gerarViagens = () => {
    if (!userProfile) return addLog("❌ Erro: Usuário não carregado.");
    const viagensRef = ref(db, `viagens/${userProfile.uid}`);
    const mock = { origem: "São Paulo", destino: "Nova York", data_ida: "2025-11-10", data_volta: "2025-11-15", motivo: "Tech Conf", status: "APROVADO", custo: "R$ 8.500,00", voo: "AA-900", hotel: "Hilton" };
    push(viagensRef, { ...mock, id: `TRIP-${Math.floor(Math.random()*10000)}`, createdAt: Date.now() });
    addLog(`✈️ Viagem gerada.`);
  };
  const limparViagens = () => { set(ref(db, `viagens/${userProfile.uid}`), null); addLog("🗑️ Viagens limpas."); };

  const gerarPonto = async () => {
    if (!userProfile) return;
    const updates = {};
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    for(let i=1; i <= diasNoMes; i++) {
        const dataAtual = new Date(ano, mes, i);
        if (dataAtual.getDay() === 0 || dataAtual.getDay() === 6) continue;
        const dateKey = dataAtual.toISOString().split('T')[0];
        const isToday = (dataAtual.toDateString() === hoje.toDateString());
        const saida = isToday ? null : "17:00"; 
        updates[`ponto/${userProfile.uid}/${dateKey}`] = {
            data: dateKey, userId: userProfile.uid, entrada: "08:00", almoco_ida: "12:00", almoco_volta: "13:00", saida: saida, timestamp: Date.now()
        };
    }
    await update(ref(db), updates);
    addLog("⏰ Ponto gerado.");
  };
  const limparPonto = () => { set(ref(db, `ponto/${userProfile.uid}`), null); addLog("🗑️ Ponto limpo."); };

  const gerarHelpdesk = () => {
    const tickets = [{ titulo: "Mouse quebrado", categoria: "hardware", prioridade: "baixa", status: "pendente", descricao: "Não clica" }];
    const hdRef = ref(db, 'solicitacoes/helpdesk');
    tickets.forEach(t => push(hdRef, { ...t, protocolo: `HD-${Math.floor(Math.random()*1000)}`, userId: userProfile.uid, userEmail: userProfile.email, nome: userProfile.nome, createdAt: new Date().toISOString() }));
    addLog("🎧 Chamados criados.");
  };

  const gerarReembolsos = () => {
    const items = [{ motivo: "Uber", valor: "45,90", data: "2025-10-10", status: "em_analise" }];
    const reembolsosRef = ref(db, 'reembolsos');
    items.forEach(i => push(reembolsosRef, { ...i, protocolo: `REQ-${Math.floor(Math.random()*999)}`, userId: userProfile.uid, nome: userProfile.nome, createdAt: new Date().toISOString() }));
    addLog("💸 Reembolsos criados.");
  };

  const gerarFerias = () => {
    push(ref(db, 'solicitacoes/ferias'), { userId: userProfile.uid, solicitanteNome: userProfile.nome, inicio: "2026-02-10", dias: "20", status: "pendente", createdAt: new Date().toISOString() });
    addLog("🌴 Férias solicitadas.");
  };

  // --- CONCILIAÇÃO ---
  const gerarConciliacaoCaos = async () => {
    if (!userProfile) return addLog("❌ Erro: Usuário não identificado.");
    const faturas = [
      { id: 1, cliente: "Padaria do João (Filial Norte)", valor: 1250.00, vencimento: "2025-10-10", status: "Pendente" },
      { id: 2, cliente: "Tech Solutions - Serv. Manutenção", valor: 250.00, vencimento: "2025-10-10", status: "Pendente" },
      { id: 3, cliente: "Tech Solutions - Hospedagem", valor: 250.00, vencimento: "2025-10-10", status: "Pendente" },
      { id: 4, cliente: "Papelaria Corporativa Ltda", valor: 890.00, vencimento: "2025-10-10", status: "Pendente" }
    ];
    try {
      await set(ref(db, `users/${userProfile.uid}/financeiro/faturas`), faturas);
      addLog("🏦 Faturas de teste geradas (Modo Caos).");
    } catch (e) { addLog(`❌ Erro: ${e.message}`); }
  };
  const limparConciliacao = async () => {
    if (!userProfile) return;
    await set(ref(db, `users/${userProfile.uid}/financeiro/faturas`), null);
    addLog("🗑️ Módulo de Conciliação limpo.");
  };

  const gerarCasosRH = async () => {
    const rhRef = ref(db, 'rh/erros_ponto');
    await set(rhRef, null); 
    const updates = {};
    MOCKS_RH.forEach(mock => {
      const newKey = push(rhRef).key;
      updates[newKey] = { ...mock, status: "Pendente", createdAt: Date.now() };
    });
    await update(rhRef, updates);
    addLog(`🚨 ${MOCKS_RH.length} Casos de Ponto RH gerados.`);
  };
  const limparCasosRH = () => { set(ref(db, 'rh/erros_ponto'), null); addLog("🗑️ Casos RH limpos."); };

  const limparTudo = async () => {
    if(!window.confirm("⚠️ TEM CERTEZA?")) return;
    const updates = {};
    updates[`viagens/${userProfile.uid}`] = null;
    updates[`ponto/${userProfile.uid}`] = null;
    updates[`solicitacoes/helpdesk`] = null; 
    updates[`reembolsos`] = null;
    updates[`solicitacoes/ferias`] = null;
    updates[`rh/erros_ponto`] = null;
    updates[`users/${userProfile.uid}/financeiro/faturas`] = null;
    updates[`users/${userProfile.uid}/financeiro/extrato`] = null;
    await update(ref(db), updates);
    addLog("☠️ WIPEOUT: Todos os dados de teste removidos.");
  };

  return (
    <div className="tech-layout-dev">
      <div className="ambient-light light-dev"></div>
      
      {/* HEADER ATUALIZADO COM 4 PERFIS */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title" style={{color: '#a855f7'}}>DEV CENTER</span>
        </div>

        {/* BOTÕES DE TROCA DE PERFIL (SETORIZADOS) */}
        <div className="dev-role-switcher">
          <span style={{color: '#94a3b8', fontSize: '0.7rem', marginRight:'8px', letterSpacing:'1px'}}>SIMULAR:</span>
          
          <button onClick={() => switchRole('admin')} className={`btn-role ${simulatedRole === 'admin' ? 'active' : ''}`}>
            ADMIN
          </button>
          
          <button onClick={() => switchRole('rh')} className={`btn-role ${simulatedRole === 'rh' ? 'active' : ''}`}>
            RH
          </button>
          
          <button onClick={() => switchRole('financeiro')} className={`btn-role ${simulatedRole === 'financeiro' ? 'active' : ''}`}>
            FIN
          </button>
          
          <button onClick={() => switchRole('colaborador')} className={`btn-role ${simulatedRole === 'colaborador' ? 'active' : ''}`}>
            COLAB
          </button>
        </div>

        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ao Dashboard ↩</button>
      </header>

      <div className="dev-container">
        <div className="dev-header-block">
          <h2>Fábrica de Dados</h2>
          <p>Painel de controle para simulação e testes.</p>
          <div className="user-info-dev">
            Usuário: <strong>{userProfile?.email || '...'}</strong> <span style={{marginLeft:'10px', color: '#a855f7'}}>({simulatedRole?.toUpperCase()})</span>
          </div>
        </div>

        <div className="dev-grid">
          {/* CARDS DE GERAÇÃO (MANTIDOS) */}
          <div className="dev-card destaque-rh">
            <div className="card-icon">👮</div>
            <h3>Gestão RH (Mocks)</h3>
            <p>Gera os 28 funcionários fictícios.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarCasosRH}>+ Gerar 28</button>
              <button className="btn-del" onClick={limparCasosRH}>🗑️</button>
            </div>
          </div>

          <div className="dev-card">
            <div className="card-icon">⏰</div>
            <h3>Ponto Pessoal</h3>
            <p>Preenche mês.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarPonto}>+ Gerar</button>
              <button className="btn-del" onClick={limparPonto}>🗑️</button>
            </div>
          </div>

          <div className="dev-card">
            <div className="card-icon">✈️</div>
            <h3>Viagens</h3>
            <p>Solicitações.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarViagens}>+ Gerar</button>
              <button className="btn-del" onClick={limparViagens}>🗑️</button>
            </div>
          </div>

          <div className="dev-card"><div className="card-icon">🎧</div><h3>Helpdesk</h3><p>Chamados.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarHelpdesk}>+ Gerar</button></div></div>
          <div className="dev-card"><div className="card-icon">💸</div><h3>Reembolsos</h3><p>Despesas.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarReembolsos}>+ Gerar</button></div></div>
          <div className="dev-card"><div className="card-icon">🌴</div><h3>Férias</h3><p>Solicitações.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarFerias}>+ Gerar</button></div></div>
          
          <div className="dev-card" style={{borderTopColor: '#3b82f6'}}>
            <div className="card-icon" style={{background: '#3b82f6'}}>🏦</div>
            <h3>Conciliação</h3>
            <p>Faturas (Caos).</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarConciliacaoCaos}>+ Gerar</button>
              <button className="btn-del" onClick={limparConciliacao}>🗑️</button>
            </div>
          </div>
        </div>

        <div className="dev-console-wrapper">
            <div className="console-header"><span>Terminal</span><button className="btn-small-del" onClick={limparTudo}>☢️ RESET TOTAL</button></div>
            <div className="dev-console-output custom-scroll">
              {log.map((l, i) => <div key={i} className="log-line">{l}</div>)}
            </div>
        </div>
      </div>
    </div>
  );
}