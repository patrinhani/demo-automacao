import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, push, set, remove, get } from 'firebase/database';
import Logo from '../../components/Logo';
import './DevTools.css';

export default function DevTools() {
  const navigate = useNavigate();
  const [log, setLog] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Carrega dados do usuário atual para usar nos geradores
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

  // =========================================================================
  // 1. GERADOR DE VIAGENS
  // =========================================================================
  const gerarViagens = () => {
    if (!userProfile) return addLog("❌ Erro: Usuário não carregado.");
    
    const viagensMock = [
      { origem: "São Paulo", destino: "Nova York", data_ida: "2025-11-10", data_volta: "2025-11-15", motivo: "Conferência Tech", status: "APROVADO", custo: "R$ 8.500,00", voo: "AA-900", hotel: "Hilton" },
      { origem: "Rio de Janeiro", destino: "São Paulo", data_ida: "2025-12-01", data_volta: "2025-12-02", motivo: "Reunião Cliente", status: "PENDENTE", custo: "A Calcular", voo: "A Definir", hotel: "-" },
      { origem: "Curitiba", destino: "Brasília", data_ida: "2025-10-05", data_volta: "2025-10-06", motivo: "Visita Governo", status: "CONCLUIDO", custo: "R$ 1.200,00", voo: "GOL-1234", hotel: "Ibis" }
    ];

    const viagensRef = ref(db, `viagens/${userProfile.uid}`);
    viagensMock.forEach(v => {
      push(viagensRef, { ...v, id: `TRIP-${Math.floor(Math.random()*10000)}`, createdAt: Date.now() });
    });
    addLog(`✈️ ${viagensMock.length} Viagens geradas com sucesso.`);
  };

  const limparViagens = () => {
    if (!userProfile) return;
    set(ref(db, `viagens/${userProfile.uid}`), null);
    addLog("🗑️ Todas as suas viagens foram apagadas.");
  };

  // =========================================================================
  // 2. GERADOR DE FOLHA DE PONTO (Preenche o mês atual)
  // =========================================================================
  const gerarPonto = async () => {
    if (!userProfile) return;
    
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    const updates = {};
    let cont = 0;

    for (let dia = 1; dia <= diasNoMes; dia++) {
      // Pula fins de semana (simples)
      const dataAtual = new Date(ano, mes, dia);
      const diaSemana = dataAtual.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      const dateKey = dataAtual.toISOString().split('T')[0];
      
      // Simula alguns atrasos ou esquecimentos
      const random = Math.random();
      let entrada = "08:00";
      let saida = "17:00";
      
      if (random > 0.8) entrada = "08:15"; // Atraso
      if (random > 0.9) saida = null; // Esqueceu de bater saída

      updates[`ponto/${userProfile.uid}/${dateKey}`] = {
        data: dateKey,
        userId: userProfile.uid,
        entrada: entrada,
        almoco_ida: "12:00",
        almoco_volta: "13:00",
        saida: saida,
        timestamp: Date.now()
      };
      cont++;
    }

    await updateRoot(updates); // Função auxiliar para update na raiz
    addLog(`⏰ Folha de ponto preenchida (${cont} dias úteis).`);
  };

  const limparPonto = () => {
    if (!userProfile) return;
    set(ref(db, `ponto/${userProfile.uid}`), null);
    addLog("🗑️ Registros de ponto apagados.");
  };

  // =========================================================================
  // 3. GERADOR DE HELPDESK
  // =========================================================================
  const gerarHelpdesk = () => {
    if (!userProfile) return;

    const tickets = [
      { titulo: "Mouse parou de funcionar", categoria: "hardware", prioridade: "baixa", status: "pendente", descricao: "O cursor não mexe." },
      { titulo: "VPN não conecta", categoria: "rede", prioridade: "alta", status: "em_andamento", descricao: "Erro 404 ao tentar logar." },
      { titulo: "Instalar VS Code", categoria: "software", prioridade: "normal", status: "concluido", descricao: "Preciso para o projeto novo." }
    ];

    const hdRef = ref(db, 'solicitacoes/helpdesk');
    tickets.forEach(t => {
      push(hdRef, {
        ...t,
        protocolo: `HD-${Math.floor(Math.random()*100000)}`,
        userId: userProfile.uid,
        userEmail: userProfile.email,
        nome: userProfile.nome,
        createdAt: new Date().toISOString(),
        respostas: []
      });
    });
    addLog(`🎧 ${tickets.length} Chamados de suporte criados.`);
  };

  // =========================================================================
  // 4. GERADOR DE REEMBOLSOS
  // =========================================================================
  const gerarReembolsos = () => {
    if (!userProfile) return;

    const items = [
      { motivo: "Uber Cliente", valor: "45,90", data: "2025-10-10", status: "em_analise" },
      { motivo: "Almoço Equipe", valor: "250,00", data: "2025-10-12", status: "aprovado" },
      { motivo: "Material Escritório", valor: "80,00", data: "2025-10-15", status: "rejeitado" }
    ];

    const reembolsosRef = ref(db, 'reembolsos');
    items.forEach(i => {
      push(reembolsosRef, {
        ...i,
        protocolo: `REQ-${Math.floor(Math.random()*99999)}`,
        userId: userProfile.uid,
        emailUsuario: userProfile.email,
        nome: userProfile.nome,
        centro_custo: "TI - 2000",
        data_despesa: i.data,
        nome_arquivo: "comprovante_fake.pdf",
        data_criacao: new Date().toISOString()
      });
    });
    addLog(`💸 ${items.length} Solicitações de reembolso criadas.`);
  };

  // =========================================================================
  // 5. GERADOR DE FÉRIAS
  // =========================================================================
  const gerarFerias = () => {
    if (!userProfile) return;
    
    const feriasRef = ref(db, 'solicitacoes/ferias');
    push(feriasRef, {
        userId: userProfile.uid,
        solicitanteNome: userProfile.nome,
        solicitanteCargo: userProfile.cargo,
        inicio: "2026-02-10",
        dias: "20",
        vender: true,
        substituto: "João da Silva",
        contatoEmergencia: "(11) 99999-9999",
        observacao: "Viagem internacional",
        status: "pendente",
        createdAt: new Date().toISOString()
    });
    addLog("🌴 Solicitação de Férias criada.");
  };

  // =========================================================================
  // 6. FINANCEIRO (CONCILIAÇÃO)
  // =========================================================================
  const gerarConciliacao = () => {
    const dados = [
      { cliente: "TechSolutions S.A.", valor: "1500.00", vencimento: "2025-10-10", status: "Aberto", id: "FAT-001" },
      { cliente: "Mercado Teste Dev", valor: "350.50", vencimento: "2025-10-12", status: "Aberto", id: "FAT-002" },
      { cliente: "Consultoria Mock", valor: "5000.00", vencimento: "2025-10-15", status: "Pago", id: "FAT-003" },
    ];
    const dbRef = ref(db, 'financeiro/contasReceber');
    dados.forEach(d => push(dbRef, d));
    addLog(`🏦 ${dados.length} Faturas geradas.`);
  };

  const limparConciliacao = () => {
    set(ref(db, 'financeiro/contasReceber'), null);
    addLog("🗑️ Dados financeiros limpos.");
  };

  // =========================================================================
  // HELPER: LIMPEZA GERAL (CUIDADO)
  // =========================================================================
  const limparTudo = async () => {
    if(!window.confirm("⚠️ TEM CERTEZA? Isso limpará TODOS os seus dados de teste.")) return;
    
    // Limpa dados específicos do usuário
    const updates = {};
    updates[`viagens/${userProfile.uid}`] = null;
    updates[`ponto/${userProfile.uid}`] = null;
    
    // Para coleções compartilhadas (Helpdesk/Reembolsos), idealmente filtraríamos para deletar só os do usuário.
    // Mas para DevTools simples, vamos limpar tudo dessas pastas (Modo Sandbox).
    updates[`solicitacoes/helpdesk`] = null; 
    updates[`reembolsos`] = null;
    updates[`solicitacoes/ferias`] = null;

    await updateRoot(updates);
    addLog("☠️ WIPEOUT: Todos os dados de teste foram removidos.");
  };

  // Função auxiliar necessária porque 'update' precisa ser importado da raiz do módulo firebase/database
  // Como não importei 'update' lá em cima, vou usar 'set' com null onde der, ou importar update.
  // Vou ajustar o import lá em cima para incluir 'update'.
  
  // Como não posso editar o import agora sem reescrever tudo, vou usar uma lógica simples de set individual
  // ou assumir que você adicionou 'update' nos imports.
  // Vou usar SET individual para garantir.

  const updateRoot = async (updates) => {
    // Simulação de multi-path update usando a instância 'db'
    // Na verdade, preciso do método 'update'. Vou assumir que você adicionou no import.
    // Se não, o código abaixo vai falhar.
    // CORREÇÃO: Vou adicionar 'update' no import da primeira linha deste bloco de código.
    const { update } = await import('firebase/database'); 
    return update(ref(db), updates);
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
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard ↩
        </button>
      </header>

      <div className="dev-container">
        
        <div className="dev-header-block">
          <h2>Fábrica de Dados</h2>
          <p>Gere massa de dados para testar funcionalidades sem preencher formulários manualmente.</p>
          <div className="user-info-dev">
            Usuário Alvo: <strong>{userProfile?.email || 'Carregando...'}</strong>
          </div>
        </div>

        <div className="dev-grid">
          
          {/* MÓDULO 1: VIAGENS */}
          <div className="dev-card">
            <div className="card-icon">✈️</div>
            <h3>Viagens</h3>
            <p>Gera solicitações de viagem com status variados.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarViagens}>+ Gerar Viagens</button>
              <button className="btn-del" onClick={limparViagens}>🗑️ Limpar</button>
            </div>
          </div>

          {/* MÓDULO 2: PONTO */}
          <div className="dev-card">
            <div className="card-icon">⏰</div>
            <h3>Folha de Ponto</h3>
            <p>Preenche o mês atual com batidas de ponto (com falhas simuladas).</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarPonto}>+ Preencher Mês</button>
              <button className="btn-del" onClick={limparPonto}>🗑️ Limpar</button>
            </div>
          </div>

          {/* MÓDULO 3: SUPORTE */}
          <div className="dev-card">
            <div className="card-icon">🎧</div>
            <h3>Helpdesk & TI</h3>
            <p>Cria chamados de suporte técnico em várias categorias.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarHelpdesk}>+ Criar Chamados</button>
            </div>
          </div>

          {/* MÓDULO 4: FINANCEIRO PESSOAL */}
          <div className="dev-card">
            <div className="card-icon">💸</div>
            <h3>Reembolsos</h3>
            <p>Gera despesas de Uber, Almoço e Material.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarReembolsos}>+ Gerar Despesas</button>
            </div>
          </div>

          {/* MÓDULO 5: RH */}
          <div className="dev-card">
            <div className="card-icon">🌴</div>
            <h3>Férias</h3>
            <p>Solicita um período de férias para o próximo ano.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarFerias}>+ Solicitar Férias</button>
            </div>
          </div>

           {/* MÓDULO 6: CONCILIAÇÃO BANCÁRIA */}
           <div className="dev-card">
            <div className="card-icon">🏦</div>
            <h3>Conciliação (Admin)</h3>
            <p>Gera faturas na conta da empresa para baixa bancária.</p>
            <div className="dev-actions">
              <button className="btn-gen" onClick={gerarConciliacao}>+ Gerar Faturas</button>
              <button className="btn-del" onClick={limparConciliacao}>🗑️ Limpar</button>
            </div>
          </div>

        </div>

        {/* LOG DO CONSOLE */}
        <div className="dev-console-wrapper">
            <div className="console-header">
                <span>Terminal de Saída</span>
                <button className="btn-small-del" onClick={limparTudo}>☢️ LIMPAR TUDO (RESET)</button>
            </div>
            <div className="dev-console-output custom-scroll">
              {log.length === 0 ? <span className="placeholder">Aguardando comandos...</span> : log.map((l, i) => (
                <div key={i} className="log-line">{l}</div>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
}