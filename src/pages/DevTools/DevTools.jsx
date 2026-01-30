import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, push, set, remove, get, update } from 'firebase/database';
import Logo from '../../components/Logo';
import './DevTools.css';

// --- MASSA DE DADOS PARA RH (28 CASOS) ---
const MOCKS_RH = [
  { nome: "Lucas Mendes", cargo: "Dev. Júnior", setor: "TI", data: "28/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { nome: "Mariana Costa", cargo: "Analista Fin. Jr", setor: "Financeiro", data: "28/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { nome: "Roberto Almeida", cargo: "Suporte N2", setor: "TI", data: "28/01", erro: "Atraso Excessivo", pontos: { e: '10:45', si: '13:00', vi: '14:00', s: '19:00' } },
  { nome: "Fernanda Lima", cargo: "Assistente RH", setor: "RH", data: "28/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '---', vi: '---', s: '17:00' } },
  { nome: "Carlos Eduardo", cargo: "DevOps", setor: "TI", data: "28/01", erro: "Hora Extra N/A", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '22:15' } },
  { nome: "Juliana Paes", cargo: "Controller", setor: "Financeiro", data: "28/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { nome: "Bruno Souza", cargo: "Segurança Info", setor: "TI", data: "27/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { nome: "Patrícia A.", cargo: "Gerente Cultura", setor: "RH", data: "27/01", erro: "Batida Duplicada", pontos: { e: '08:00', si: '08:02', vi: '12:00', s: '18:00' } },
  { nome: "Ricardo O.", cargo: "Analista Fin. Sr", setor: "Financeiro", data: "27/01", erro: "Intervalo < 1h", pontos: { e: '08:00', si: '12:00', vi: '12:35', s: '17:00' } },
  { nome: "Amanda Silva", cargo: "P.O.", setor: "TI", data: "26/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { nome: "Felipe Neto", cargo: "Analista RH", setor: "RH", data: "26/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '---', vi: '---', s: '---' } },
  { nome: "Larissa M.", cargo: "Aux. Financeiro", setor: "Financeiro", data: "26/01", erro: "Atraso Excessivo", pontos: { e: '11:00', si: '13:00', vi: '14:00', s: '18:00' } },
  { nome: "Whindersson", cargo: "Dev Fullstack", setor: "TI", data: "25/01", erro: "Ponto Britânico", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' } },
  { nome: "Tatá Werneck", cargo: "BP RH", setor: "RH", data: "25/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { nome: "Fausto Silva", cargo: "CFO", setor: "Financeiro", data: "25/01", erro: "Marcação Ímpar", pontos: { e: '09:00', si: '13:00', vi: '15:00', s: '---' } },
  { nome: "João Kleber", cargo: "Estagiário TI", setor: "TI", data: "24/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '---', vi: '---', s: '---' } },
  { nome: "Ana Maria", cargo: "Analista Contábil", setor: "Financeiro", data: "24/01", erro: "Batida Duplicada", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' } },
  { nome: "Luciano Huck", cargo: "Gerente Vendas", setor: "Comercial", data: "24/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { nome: "Xuxa Meneghel", cargo: "Analista Mkt", setor: "Marketing", data: "23/01", erro: "Atraso Excessivo", pontos: { e: '10:30', si: '13:00', vi: '14:00', s: '18:00' } },
  { nome: "Gugu Liberato", cargo: "Coord. Projetos", setor: "TI", data: "23/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { nome: "Ivete Sangalo", cargo: "Analista RH", setor: "RH", data: "23/01", erro: "Hora Extra N/A", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '21:00' } },
  { nome: "Pelé Arantes", cargo: "Embaixador", setor: "Marketing", data: "22/01", erro: "Falta Injustificada", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { nome: "Silvio Santos", cargo: "Dono", setor: "Diretoria", data: "22/01", erro: "Ponto Britânico", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' } },
  { nome: "Hebe Camargo", cargo: "Recepção", setor: "Adm", data: "22/01", erro: "Intervalo < 1h", pontos: { e: '08:00', si: '12:00', vi: '12:15', s: '17:00' } },
  { nome: "Ratinho", cargo: "Segurança", setor: "Infra", data: "21/01", erro: "Batida Duplicada", pontos: { e: '08:00', si: '08:01', vi: '---', s: '---' } },
  { nome: "Eliana", cargo: "Secretária", setor: "Adm", data: "21/01", erro: "Marcação Ímpar", pontos: { e: '08:00', si: '---', vi: '---', s: '17:00' } },
  { nome: "Celso Portiolli", cargo: "Trainee", setor: "TI", data: "21/01", erro: "Atraso Excessivo", pontos: { e: '09:45', si: '13:00', vi: '14:00', s: '17:00' } },
  { nome: "Maisa Silva", cargo: "Jovem Aprendiz", setor: "RH", data: "20/01", erro: "Hora Extra N/A", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '18:30' } }
];

export default function DevTools() {
  const navigate = useNavigate();
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

  // --- GERADORES ---
  const gerarViagens = () => {
    if (!userProfile) return addLog("❌ Erro: Usuário não carregado.");
    const viagensRef = ref(db, `viagens/${userProfile.uid}`);
    const mock = { origem: "São Paulo", destino: "Nova York", data_ida: "2025-11-10", data_volta: "2025-11-15", motivo: "Tech Conf", status: "APROVADO", custo: "R$ 8.500,00", voo: "AA-900", hotel: "Hilton" };
    push(viagensRef, { ...mock, id: `TRIP-${Math.floor(Math.random()*10000)}`, createdAt: Date.now() });
    addLog(`✈️ Viagem gerada.`);
  };
  const limparViagens = () => { set(ref(db, `viagens/${userProfile.uid}`), null); addLog("🗑️ Viagens limpas."); };

  // --- GERADOR DE PONTO PESSOAL (MÊS TODO) ---
  const gerarPonto = async () => {
    if (!userProfile) return;
    const updates = {};
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for(let i=1; i <= diasNoMes; i++) {
        const dataAtual = new Date(ano, mes, i);
        const diaSemana = dataAtual.getDay();
        if (diaSemana === 0 || diaSemana === 6) continue;

        const dateKey = dataAtual.toISOString().split('T')[0];
        const isToday = (dataAtual.toDateString() === hoje.toDateString());
        const saida = isToday ? null : "17:00"; 

        updates[`ponto/${userProfile.uid}/${dateKey}`] = {
            data: dateKey, userId: userProfile.uid, entrada: "08:00", almoco_ida: "12:00", almoco_volta: "13:00", saida: saida, timestamp: Date.now()
        };
    }
    await update(ref(db), updates);
    addLog("⏰ Ponto gerado (Mês Completo).");
  };
  const limparPonto = () => { set(ref(db, `ponto/${userProfile.uid}`), null); addLog("🗑️ Ponto pessoal limpo."); };

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

  const gerarConciliacao = () => {
    const dados = [{ cliente: "TechSolutions", valor: "1500.00", vencimento: "2025-10-10", status: "Aberto", id: "FAT-001" }];
    dados.forEach(d => push(ref(db, 'financeiro/contasReceber'), d));
    addLog("🏦 Faturas geradas.");
  };
  const limparConciliacao = () => { set(ref(db, 'financeiro/contasReceber'), null); addLog("🗑️ Financeiro limpo."); };

  // --- GERADOR DE CASOS RH ---
  const gerarCasosRH = async () => {
    const rhRef = ref(db, 'rh/erros_ponto');
    await set(rhRef, null); // Limpa antes
    
    // Insere os 28 casos
    const updates = {};
    MOCKS_RH.forEach(mock => {
      const newKey = push(rhRef).key;
      updates[newKey] = { ...mock, status: "Pendente", createdAt: Date.now() };
    });
    await update(rhRef, updates);
    addLog(`🚨 ${MOCKS_RH.length} Casos de Ponto RH gerados.`);
  };

  // --- AQUI ESTAVA FALTANDO A FUNÇÃO ---
  const limparCasosRH = () => {
    set(ref(db, 'rh/erros_ponto'), null);
    addLog("🗑️ Casos RH limpos.");
  };

  const limparTudo = async () => {
    if(!window.confirm("⚠️ TEM CERTEZA?")) return;
    const updates = {};
    updates[`viagens/${userProfile.uid}`] = null;
    updates[`ponto/${userProfile.uid}`] = null;
    updates[`solicitacoes/helpdesk`] = null; 
    updates[`reembolsos`] = null;
    updates[`solicitacoes/ferias`] = null;
    updates[`rh/erros_ponto`] = null;
    updates[`financeiro/contasReceber`] = null;
    await update(ref(db), updates);
    addLog("☠️ WIPEOUT: Tudo limpo.");
  };

  return (
    <div className="tech-layout-dev">
      <div className="ambient-light light-dev"></div>
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title" style={{color: '#a855f7'}}>DEV CENTER 🛠️</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ao Dashboard ↩</button>
      </header>

      <div className="dev-container">
        <div className="dev-header-block">
          <h2>Fábrica de Dados</h2>
          <p>Painel de controle para simulação e testes.</p>
          <div className="user-info-dev">
            Usuário Alvo: <strong>{userProfile?.email || 'Carregando...'}</strong>
          </div>
        </div>

        <div className="dev-grid">
          {/* CARD RH */}
          <div className="dev-card destaque-rh">
            <div className="card-icon">👮</div>
            <h3>Gestão RH (Mocks)</h3>
            <p>Gera os 28 funcionários fictícios com erros de ponto.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarCasosRH}>+ Gerar 28 Casos</button>
              <button className="btn-del" onClick={limparCasosRH}>🗑️ Limpar</button>
            </div>
          </div>

          <div className="dev-card"><div className="card-icon">⏰</div><h3>Ponto Pessoal</h3><p>Preenche mês todo.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarPonto}>+ Gerar</button><button className="btn-del" onClick={limparPonto}>🗑️</button></div></div>
          <div className="dev-card"><div className="card-icon">✈️</div><h3>Viagens</h3><p>Solicitações.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarViagens}>+ Gerar</button><button className="btn-del" onClick={limparViagens}>🗑️</button></div></div>
          <div className="dev-card"><div className="card-icon">🎧</div><h3>Helpdesk</h3><p>Chamados.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarHelpdesk}>+ Gerar</button></div></div>
          <div className="dev-card"><div className="card-icon">💸</div><h3>Reembolsos</h3><p>Despesas.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarReembolsos}>+ Gerar</button></div></div>
          <div className="dev-card"><div className="card-icon">🌴</div><h3>Férias</h3><p>Solicitações.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarFerias}>+ Gerar</button></div></div>
          <div className="dev-card"><div className="card-icon">🏦</div><h3>Conciliação</h3><p>Faturas.</p><div className="dev-actions"><button className="btn-gen" onClick={gerarConciliacao}>+ Gerar</button><button className="btn-del" onClick={limparConciliacao}>🗑️</button></div></div>
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