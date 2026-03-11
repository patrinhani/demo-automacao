import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, push, set, get, update } from 'firebase/database';
import Logo from '../../components/Logo';
import { useUser } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext'; 
import './DevTools.css';

// --- MOTOR DE ALEATORIEDADE PARA RH ---
const NOMES = ["Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Nicolas", "Olívia", "Pedro", "Rafael", "Sofia", "Tiago", "Vinícius", "Vitória"];
const SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];

const DEPARTAMENTOS = [
  { setor: "TI", cargos: ["Dev. Júnior", "Dev Fullstack", "Suporte N2", "Segurança Info", "P.O.", "UX Designer", "DevOps"] },
  { setor: "Financeiro", cargos: ["Analista Fin.", "Controller", "Auxiliar Financeiro", "Especialista Fiscal"] },
  { setor: "RH", cargos: ["Assistente RH", "Analista RH", "BP RH", "Recrutador"] },
  { setor: "Comercial", cargos: ["Vendedor", "Gerente Vendas", "Executivo de Contas", "SDR"] }
];

const TIPOS_ERRO = [
  "Marcação Ímpar", "Falta Injustificada", "Atraso Excessivo", 
  "Batida Duplicada", "Intervalo < 1h", "Ponto Britânico", "Hora Extra N/A"
];

// Gera horários coerentes com o tipo de erro sorteado
const gerarHorariosPorErro = (erro) => {
  let base = { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' };
  switch(erro) {
      case "Falta Injustificada": return { e: '---', si: '---', vi: '---', s: '---' };
      case "Marcação Ímpar":
          const chaves = ['e', 'si', 'vi', 's'];
          base[chaves[Math.floor(Math.random() * chaves.length)]] = '---';
          return base;
      case "Atraso Excessivo":
          base.e = ['09:45', '10:30', '11:15', '10:00', '10:50'][Math.floor(Math.random() * 5)];
          return base;
      case "Batida Duplicada":
          return { e: '08:00', si: '08:02', vi: '12:00', s: '17:00' };
      case "Intervalo < 1h":
          base.vi = ['12:35', '12:40', '12:45'][Math.floor(Math.random() * 3)];
          return base;
      case "Hora Extra N/A":
          base.s = ['19:30', '20:15', '21:00', '22:45', '23:10'][Math.floor(Math.random() * 5)];
          return base;
      default: return base;
  }
};

export default function DevTools() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert(); 
  
  // --- CONTEXTO DE USUÁRIO (Simulação) ---
  const { 
    realRole, simulatedRole, switchRole, 
    realSetor, simulatedSetor, switchSetor 
  } = useUser();

  const [log, setLog] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Estados do Modal de Limpeza Seletiva
  const [showModalLimpeza, setShowModalLimpeza] = useState(false);
  const [usuariosComDados, setUsuariosComDados] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const limparHistoricoPontoUnificado = async () => {
    const confirmou = await showConfirm("Atenção", "⚠️ ATENÇÃO: Isso apagará o ponto pessoal E os registros de erro (RH). Continuar?");
    if (!confirmou) return;
    
    try {
        const updates = {};
        updates[`ponto/${userProfile.uid}`] = null;
        updates['rh/erros_ponto'] = null;

        await update(ref(db), updates);
        addLog("🧹 Histórico COMPLETO (Ponto + RH) removido.");
    } catch (e) {
        addLog(`❌ Erro ao limpar histórico unificado: ${e.message}`);
    }
  };

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

  // --- FUNÇÕES GLOBAIS DE CONCILIAÇÃO ---
  const gerarConciliacaoCaos = async () => {
    const faturas = [
      { id: 1, cliente: "Padaria do João (Filial Norte)", valor: 1250.00, vencimento: "2025-10-10", status: "Pendente" },
      { id: 2, cliente: "Tech Solutions - Serv. Manutenção", valor: 250.00, vencimento: "2025-10-10", status: "Pendente" },
      { id: 3, cliente: "Tech Solutions - Hospedagem", valor: 250.00, vencimento: "2025-10-10", status: "Pendente" },
      { id: 4, cliente: "Papelaria Corporativa Ltda", valor: 890.00, vencimento: "2025-10-10", status: "Pendente" }
    ];
    
    try {
      const snap = await get(ref(db, 'users'));
      if (snap.exists()) {
        const updates = {};
        const usuarios = snap.val();
        
        Object.keys(usuarios).forEach(uid => {
          updates[`users/${uid}/financeiro/faturas`] = faturas;
        });
        
        await update(ref(db), updates);
        addLog("🏦 Faturas de teste geradas para TODOS os usuários (Modo Caos).");
      }
    } catch (e) {
      addLog(`❌ Erro ao gerar conciliação: ${e.message}`);
    }
  };

  const abrirModalLimpeza = async () => {
    setShowModalLimpeza(true);
    setLoadingUsers(true);
    try {
      const snap = await get(ref(db, 'users'));
      if (snap.exists()) {
        const usuarios = snap.val();
        const lista = [];
        
        Object.keys(usuarios).forEach(uid => {
          const user = usuarios[uid];
          if (user.financeiro && user.financeiro.faturas) {
            lista.push({
              uid: uid,
              email: user.email,
              nome: user.nome || 'Sem Nome',
              qtd: Object.keys(user.financeiro.faturas).length
            });
          }
        });
        
        setUsuariosComDados(lista);
      }
    } catch (e) {
      addLog(`❌ Erro ao buscar usuários: ${e.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- ATUALIZADO: Limpa o usuário no ERP e no Banco ---
  const limparUsuarioEspecifico = async (uidAlvo, nomeAlvo) => {
    try {
      const updates = {};
      // 1. Apaga as faturas da conciliação
      updates[`users/${uidAlvo}/financeiro/faturas`] = null;
      
      // 2. Busca e apaga as transações do extrato bancário desse usuário
      const snapBanco = await get(ref(db, 'banco_mock/transacoes'));
      if (snapBanco.exists()) {
        const transacoes = snapBanco.val();
        Object.keys(transacoes).forEach(key => {
          if (transacoes[key].uid === uidAlvo) {
            updates[`banco_mock/transacoes/${key}`] = null;
          }
        });
      }

      await update(ref(db), updates);
      
      addLog(`🗑️ Faturas e Extrato limpos para a conta: ${nomeAlvo}`);
      setUsuariosComDados(prev => prev.filter(u => u.uid !== uidAlvo));
    } catch (e) {
      addLog(`❌ Erro ao limpar conta ${nomeAlvo}: ${e.message}`);
    }
  };

  // --- ATUALIZADO: Limpa todos no ERP e no Banco ---
  const limparTodos = async () => {
    const confirmou = await showConfirm("Atenção", "Apagar faturas E extratos de TODOS os usuários listados?");
    if (!confirmou) return;

    try {
      const updates = {};
      
      // 1. Apaga as faturas de cada usuário listado
      usuariosComDados.forEach(u => {
        updates[`users/${u.uid}/financeiro/faturas`] = null;
      });
      
      // 2. Apaga TODO o extrato bancário (de todos os usuários)
      updates['banco_mock/transacoes'] = null;

      await update(ref(db), updates);
      addLog("🗑️ Faturas e Extratos limpos para TODOS os usuários.");
      setUsuariosComDados([]);
    } catch (e) {
      addLog(`❌ Erro ao limpar todos: ${e.message}`);
    }
  };

  // --- NOVA LÓGICA DE GERAÇÃO GLOBAL PARA RH ---
  const gerarCasosRH = async () => {
    try {
      const snap = await get(ref(db, 'users'));
      if (!snap.exists()) return addLog("❌ Nenhum utilizador encontrado no banco de dados.");

      const usuarios = snap.val();
      const rhRef = ref(db, 'rh/erros_ponto');
      
      // Apagamos os casos antigos para não acumular lixo
      await set(rhRef, null); 
      
      const updates = {};
      let totalGerados = 0;

      // Percorre todos os utilizadores da plataforma
      Object.keys(usuarios).forEach(uid => {
        const u = usuarios[uid];
        const setor = (u.setor || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        
        // Se a pessoa for do RH ou Administrador, gera a fila dela!
        if (setor.includes('rh') || setor.includes('recursos humanos') || role === 'admin' || role === 'dev') {
          // Gera 12 casos dinâmicos para esta pessoa específica
          for (let i = 0; i < 50; i++) {
            const nome = NOMES[Math.floor(Math.random() * NOMES.length)];
            const sobrenome = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
            const dept = DEPARTAMENTOS[Math.floor(Math.random() * DEPARTAMENTOS.length)];
            const cargo = dept.cargos[Math.floor(Math.random() * dept.cargos.length)];
            const erro = TIPOS_ERRO[Math.floor(Math.random() * TIPOS_ERRO.length)];
            const pontos = gerarHorariosPorErro(erro);

            const newKey = push(rhRef).key;
            updates[newKey] = {
                nome: `${nome} ${sobrenome}`,
                cargo: cargo,
                setor: dept.setor,
                erro: erro,
                pontos: pontos,
                donoUid: uid, // 🔒 Vincula o caso ao UID do avaliador
                status: "Pendente",
                createdAt: Date.now()
            };
            totalGerados++;
          }
        }
      });

      await update(rhRef, updates);
      addLog(`🚨 ${totalGerados} Casos dinâmicos gerados para todas as contas de RH/Admin.`);
    } catch (e) {
      addLog(`❌ Erro ao gerar casos RH: ${e.message}`);
    }
  };

  const limparCasosRH = async () => {
    try {
        const updates = {};
        updates['rh/erros_ponto'] = null;
        updates['chats/direto'] = null;
        updates['chats/geral'] = null;
        await update(ref(db), updates);
        localStorage.removeItem('mocksAtivos');
        addLog("🗑️ TODOS os Casos RH e Histórico de Chats excluídos.");
    } catch (e) {
        addLog(`❌ Erro: ${e.message}`);
    }
  };

  // --- ATUALIZADO: Wipeout geral agora inclui banco_mock ---
  const limparTudo = async () => {
    const confirmou = await showConfirm("Atenção", "⚠️ TEM CERTEZA? ISSO APAGARÁ TUDO!");
    if(!confirmou) return;

    const updates = {};
    updates[`viagens/${userProfile.uid}`] = null;
    updates[`ponto/${userProfile.uid}`] = null;
    updates[`solicitacoes/helpdesk`] = null; 
    updates[`reembolsos`] = null;
    updates[`solicitacoes/ferias`] = null;
    updates[`rh/erros_ponto`] = null;
    updates[`users/${userProfile.uid}/financeiro/faturas`] = null;
    updates[`users/${userProfile.uid}/financeiro/extrato`] = null;
    updates['banco_mock'] = null; // <-- ADICIONADO AQUI
    updates['chats/direto'] = null; 
    updates['chats/geral'] = null;  
    updates['users'] = null;
    
    await update(ref(db), updates);
    localStorage.removeItem('mocksAtivos'); 
    
    addLog("☠️ WIPEOUT: Todos os dados e cache limpos.");
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
            <br />
            <span style={{fontSize: '0.8rem', opacity: 0.7, color: '#a855f7'}}>
              Status Atual: {simulatedSetor || 'Nenhum'} ({simulatedRole})
            </span>
          </div>
        </div>

        <div className="dev-grid">
          
          {/* --- CARD SIMULAÇÃO --- */}
          <div className="dev-card" style={{ borderTop: '4px solid #a855f7' }}>
            <div className="card-icon" style={{ background: '#a855f7' }}>🎭</div>
            <h3>Simular Identidade</h3>
            <p>Alterne cargos e setores em tempo real.</p>
            
            <div className="dev-actions" style={{ flexDirection: 'column', gap: '10px' }}>
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '0.8rem', color: '#888' }}>Cargo</label>
                <select 
                  className="tech-input" 
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e1e2e', color: '#fff', border: '1px solid #333' }}
                  value={simulatedRole || ''} 
                  onChange={(e) => switchRole(e.target.value)}
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Admin</option>
                  <option value="dev">Dev</option>
                </select>
              </div>

              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '0.8rem', color: '#888' }}>Setor</label>
                <select 
                  className="tech-input"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e1e2e', color: '#fff', border: '1px solid #333' }}
                  value={simulatedSetor || ''} 
                  onChange={(e) => switchSetor(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Recursos Humanos">RH (Recursos Humanos)</option>

                  {simulatedSetor && simulatedSetor !== 'Financeiro' && simulatedSetor !== 'Recursos Humanos' && (
                    <option value={simulatedSetor} disabled>
                      {simulatedSetor} (Atual - Não listado)
                    </option>
                  )}
                </select>
              </div>

              <button 
                className="btn-del" 
                style={{ width: '100%', marginTop: '5px' }}
                onClick={() => { switchRole(realRole); switchSetor(realSetor); }}
              >
                ↺ Resetar para Original
              </button>
            </div>
          </div>

          {/* CARD RH (ATUALIZADO) */}
          <div className="dev-card destaque-rh">
            <div className="card-icon">👮</div>
            <h3>Gestão RH (Global)</h3>
            <p>Gera casos únicos p/ todos do RH.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarCasosRH}>+ Gerar Casos Dinâmicos</button>
              <button className="btn-del" onClick={limparCasosRH}>🗑️ Limpar Casos & Chats</button>
            </div>
          </div>

          {/* CARD PONTO */}
          <div className="dev-card">
            <div className="card-icon">⏰</div>
            <h3>Ponto Pessoal</h3>
            <p>Preenche mês todo.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarPonto}>+ Gerar</button>
              <button className="btn-del" onClick={limparPonto}>🗑️ Pessoal</button>
              
              <button 
                className="btn-danger-solid" 
                onClick={limparHistoricoPontoUnificado}
              >
                🧨 Limpar Tudo (Ponto + RH)
              </button>
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

          <div className="dev-card">
            <div className="card-icon">🎧</div>
            <h3>Helpdesk</h3>
            <p>Chamados.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarHelpdesk}>+ Gerar</button>
            </div>
          </div>

          <div className="dev-card">
            <div className="card-icon">💸</div>
            <h3>Reembolsos</h3>
            <p>Despesas.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarReembolsos}>+ Gerar</button>
            </div>
          </div>

          <div className="dev-card">
            <div className="card-icon">🌴</div>
            <h3>Férias</h3>
            <p>Solicitações.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarFerias}>+ Gerar</button>
            </div>
          </div>

          {/* CARD CONCILIAÇÃO */}
          <div className="dev-card" style={{borderTopColor: '#3b82f6'}}>
            <div className="card-icon" style={{background: '#3b82f6'}}>🏦</div>
            <h3>Conciliação (Caos)</h3>
            <p>Gera faturas conflitantes.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarConciliacaoCaos}>+ Gerar Caos (Todos)</button>
              <button className="btn-del" onClick={abrirModalLimpeza}>🗑️ Escolher quem Limpar</button>
            </div>
          </div>

          <div className="dev-card" style={{borderTop: '4px solid #ef4444'}}>
             <div className="card-icon" style={{background: '#ef4444'}}>☠️</div>
             <h3>Zona de Perigo</h3>
             <div className="dev-actions">
                <button className="btn-del" onClick={limparTudo}>Limpar Tudo</button>
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

      {/* --- MODAL DE LIMPEZA SELETIVA --- */}
      {showModalLimpeza && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{background: '#1e1e2e', padding: '25px', borderRadius: '12px', width: '450px', border: '1px solid #3b82f6', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'}}>
            <h3 style={{marginTop: 0, color: '#60a5fa', display: 'flex', justifyContent: 'space-between'}}>
              <span>Escolher Conta para Limpar</span>
              <button onClick={() => setShowModalLimpeza(false)} style={{background:'transparent', border:'none', color:'white', cursor:'pointer', fontSize:'1.2rem'}}>×</button>
            </h3>
            
            {loadingUsers ? (
              <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>A procurar contas com faturas...</div>
            ) : usuariosComDados.length === 0 ? (
              <div style={{textAlign: 'center', padding: '20px', color: '#10b981'}}>Nenhuma conta possui faturas pendentes no momento! 🎉</div>
            ) : (
              <>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px'}}>
                  {usuariosComDados.map(u => (
                    <div key={u.uid} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
                      <div>
                        <strong style={{display: 'block', fontSize: '1rem'}}>{u.nome}</strong>
                        <small style={{color: '#94a3b8'}}>{u.email}</small>
                      </div>
                      <button 
                        onClick={() => limparUsuarioEspecifico(u.uid, u.nome)}
                        className="btn-del"
                        style={{padding: '6px 12px', fontSize: '0.85rem', width: 'auto', margin: 0}}
                      >
                        🗑️ Limpar ({u.qtd})
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333', display: 'flex', gap: '10px'}}>
                   <button onClick={limparTodos} style={{flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                      🧨 Limpar Todos
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}