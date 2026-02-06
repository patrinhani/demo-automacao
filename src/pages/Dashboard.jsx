import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TeamsNotification from '../components/TeamsNotification'; 
import { db } from '../firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { useUser } from '../contexts/UserContext'; 
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const { user, isAdmin, uidAtivo } = useUser();

  const [userProfile, setUserProfile] = useState({ nome: '...', cargo: '...' });

  // Contadores
  const [contagemTarefas, setContagemTarefas] = useState(0);
  const [contagemViagens, setContagemViagens] = useState(0);
  const [contagemGeral, setContagemGeral] = useState(0);
  const [proxFerias, setProxFerias] = useState('---');

  // Estado para notificação Teams
  const [showTeams, setShowTeams] = useState(false);
  const [contagemReembolsos, setContagemReembolsos] = useState(0);

  // 1. BUSCAR DADOS VISUAIS (NOME/CARGO) - Baseado no uidAtivo
  useEffect(() => {
    if (!uidAtivo) return; 
    const userRef = ref(db, `users/${uidAtivo}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserProfile({
          nome: data.nome || 'Usuário',
          cargo: data.cargo || 'Cargo não definido'
        });
      }
    });
  }, [uidAtivo]);

  // 2. TAREFAS
  useEffect(() => {
    if (!uidAtivo) return;
    const tarefasRef = ref(db, 'tarefas');
    onValue(tarefasRef, (snapshot) => {
      if (snapshot.exists()) {
        setContagemTarefas(Object.values(snapshot.val()).filter(t => t.userId === uidAtivo && t.status !== 'done').length);
      } else {
        setContagemTarefas(0);
      }
    });
  }, [uidAtivo]);

  // 3. FÉRIAS
  useEffect(() => {
    if (!uidAtivo) return;
    onValue(ref(db, `ferias/${uidAtivo}`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.values(data).sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
        if (lista[0]) {
            setProxFerias(new Date(lista[0].dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
        }
      } else {
        setProxFerias('A definir');
      }
    });
  }, [uidAtivo]);

  // 4. PENDÊNCIAS
  useEffect(() => {
    if (!uidAtivo) return;
    const filterFunc = (s) => !s || ['pendente','em analise','solicitado','aguardando'].includes(s.toLowerCase());

    const unsubViagens = onValue(ref(db, 'viagens'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            Object.entries(snap.val()).forEach(([uid, viags]) => Object.values(viags).forEach(v => {
                if (filterFunc(v.status) && (isAdmin || uid === uidAtivo)) c++;
            }));
        }
        setContagemViagens(c);
    });

    const unsubGerais = onValue(ref(db, 'solicitacoes'), (snap) => {
      let c = 0;
      if (snap.exists()) {
        Object.values(snap.val()).forEach(cat => Object.values(cat).forEach(i => {
            if (filterFunc(i.status) && (isAdmin || i.userId === uidAtivo)) c++;
        }));
      }
      setContagemGeral(c); 
    });
    
    const unsubReembolsos = onValue(ref(db, 'reembolsos'), (snap) => {
      let c = 0;
      if (snap.exists()) {
          Object.values(snap.val()).forEach(i => {
              if (i.status === 'em_analise' && (isAdmin || i.userId === uidAtivo)) c++;
          });
      }
      setContagemReembolsos(c);
    });
    
    return () => { unsubViagens(); unsubGerais(); unsubReembolsos(); };
  }, [uidAtivo, isAdmin]); 

  // 5. MONITORAMENTO DE PONTO (TIMER 40s)
  useEffect(() => {
    if (!user) return;
    const verificarPonto = async () => {
        const hoje = new Date().toISOString().split('T')[0];
        const pontoRef = ref(db, `ponto/${user.uid}/${hoje}`);
        const snapshot = await get(pontoRef);

        if (!snapshot.exists() || !snapshot.val().entrada) {
            console.log("⏳ Timer 40s iniciado...");
            const timer = setTimeout(async () => {
                const checkAgain = await get(pontoRef);
                if (!checkAgain.exists() || !checkAgain.val().entrada) {
                    setShowTeams(true); // ATIVA O ALERTA
                    
                    const userRef = ref(db, `users/${user.uid}`);
                    const userSnap = await get(userRef);
                    const userData = userSnap.val() || {};
                    await set(ref(db, `rh/erros_ponto/${user.uid}`), {
                        nome: userData.nome || user.email,
                        cargo: userData.cargo || 'Colaborador',
                        setor: userData.setor || 'Geral',
                        data: 'Hoje',
                        erro: 'Esquecimento Real',
                        status: 'Pendente',
                        pontos: { e: '---', si: '---', vi: '---', s: '---' },
                        timestamp: Date.now()
                    });
                }
            }, 40000);
            return () => clearTimeout(timer);
        }
    };
    verificarPonto();
  }, [user]);

  const totalSolicitacoes = contagemReembolsos + contagemViagens + contagemGeral;

  const stats = [
    { titulo: 'Tarefas Pendentes', valor: contagemTarefas.toString(), icon: '⚡', cor: 'var(--neon-blue)', rota: '/tarefas' },
    { titulo: isAdmin ? 'Aprovações Pendentes' : 'Minhas Solicitações', valor: totalSolicitacoes.toString(), icon: isAdmin ? '✅' : '📂', cor: 'var(--neon-purple)', rota: isAdmin ? '/aprovacoes-gerais' : '/historico-solicitacoes' },
    { titulo: 'Próx. Férias', valor: proxFerias, icon: '🌴', cor: 'var(--neon-green)', rota: '/ferias' },
  ];

  const acessos = [
    ...(isAdmin ? [{ titulo: 'Criar Usuário', desc: 'Cadastrar Colaborador', icon: '🔐', rota: '/cadastro-usuario' },{ titulo: 'Aprovações Gerais', desc: 'Central Unificada', icon: '✅', rota: '/aprovacoes-gerais' },{ titulo: 'Conciliação', desc: 'Baixa Bancária', icon: '🏦', rota: '/conciliacao' }] : []),
    { titulo: 'Histórico Geral', desc: 'Ver aprovações', icon: '📜', rota: '/historico-solicitacoes' },{ titulo: 'Minhas Tarefas', desc: 'Organização de tarefas', icon: '⚡', rota: '/tarefas' },{ titulo: 'Reembolsos', desc: 'Solicitar Reembolso', icon: '💸', rota: '/solicitacao' },{ titulo: 'Minhas Férias', desc: 'Agendar descanso', icon: '🌴', rota: '/ferias' },{ titulo: 'Ponto Eletrônico', desc: 'Registrar entrada/saída', icon: '⏰', rota: '/folha-ponto' },{ titulo: 'Holerite Online', desc: 'Documentos digitais', icon: '📄', rota: '/holerite' },{ titulo: 'Gerador de Nota', desc: 'Emissão de NF de serviço', icon: '🧾', rota: '/gerar-nota' },{ titulo: 'Mural & Avisos', desc: 'Notícias internas', icon: '📢', rota: '/comunicacao' },{ titulo: 'Helpdesk TI', desc: 'Abrir chamado', icon: '🎧', rota: '/helpdesk' },{ titulo: 'Reserva de Salas', desc: 'Agendar espaço', icon: '📅', rota: '/reservas' },{ titulo: 'Gestão de Viagens', desc: 'Passagens e hotéis', icon: '✈️', rota: '/viagens' },{ titulo: 'TechBank', desc: 'Conta Salário', icon: '🏦', rota: '/banco-login' }
  ];

  return (
    <div className="tech-layout">
      <div className="ambient-light light-1"></div><div className="ambient-light light-2"></div><div className="ambient-light light-3"></div><div className="ambient-light light-4"></div>
      
      <Sidebar />
      
      <main className="tech-main">
        {/* BARRA DE DEBUG REMOVIDA DAQUI */}

        <header className="tech-header">
          <div className="header-content">
            <h1>Visão Geral</h1>
            <p>Bem-vindo ao <strong>TechPortal</strong></p>
          </div>
          <div className="tech-profile" onClick={() => navigate('/perfil')}>
            <div className="profile-info">
              <span className="name">{userProfile.nome}</span>
              <span className="role">{userProfile.cargo}</span>
            </div>
            <div className="profile-avatar">
              {userProfile.nome && userProfile.nome !== '...' ? userProfile.nome.substring(0,2).toUpperCase() : 'GS'}
            </div>
          </div>
        </header>

        <div className="tech-scroll-content">
          <section className="stats-row">
            {stats.map((stat, i) => (
              <div key={i} className="glass-stat-card" style={{ borderTopColor: stat.cor, cursor: 'pointer' }} onClick={() => stat.rota && navigate(stat.rota)}>
                <div className="stat-icon" style={{ background: stat.cor, boxShadow: `0 0 20px ${stat.cor}` }}>
                    {stat.icon}
                </div>
                <div className="stat-info">
                    <h3>{stat.valor}</h3>
                    <span>{stat.titulo}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="modules-section">
            <h2 className="section-title">Acesso Rápido</h2>
            <div className="modules-grid-tech">
              {acessos.map((item, index) => (
                <div key={index} className="tech-card" onClick={() => navigate(item.rota)}>
                  <div className="tech-icon">{item.icon}</div>
                  <div className="tech-info">
                    <h3>{item.titulo}</h3>
                    <p>{item.desc}</p>
                  </div>
                  <div className="arrow-icon">→</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <TeamsNotification 
        show={showTeams} 
        onClose={() => setShowTeams(false)}
        title="RH - Monitoramento Automático"
        message="Detectamos uma inconsistência no seu registro de ponto (Ausência de Entrada). Em breve o RH entrará em contato."
      />
    </div>
  );
}