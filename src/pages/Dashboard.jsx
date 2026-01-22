import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth"; // Importante para o carregamento
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Dados do Perfil
  const [userProfile, setUserProfile] = useState({
    nome: 'Carregando...',
    cargo: '...',
    role: 'colaborador'
  });

  // KPIs (Indicadores)
  const [kpis, setKpis] = useState({
    tarefas: 0,
    solicitacoes: 0,
    ferias: '---'
  });

  useEffect(() => {
    let dbUnsubscribes = [];

    // 1. VIGIA A AUTENTICAÇÃO (Evita carregamento infinito)
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      
      if (user) {
        // --- A. Busca Perfil ---
        const userRef = ref(db, `users/${user.uid}`);
        const unsubUser = onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserProfile({
              nome: data.nome || 'Usuário',
              cargo: data.cargo || 'Cargo não definido',
              role: data.role || 'colaborador'
            });
          }
        });
        dbUnsubscribes.push(unsubUser);

        // --- B. Busca Tarefas (Filtradas) ---
        const tarefasRef = ref(db, 'tarefas');
        const unsubTarefas = onValue(tarefasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const minhasPendentes = Object.values(data).filter(t => 
              t.userId === user.uid && t.status !== 'done'
            ).length;
            setKpis(prev => ({ ...prev, tarefas: minhasPendentes }));
          } else {
            setKpis(prev => ({ ...prev, tarefas: 0 }));
          }
        });
        dbUnsubscribes.push(unsubTarefas);

        // --- C. Busca Solicitações (Filtradas) ---
        const solicitacoesRef = ref(db, 'reembolsos');
        const unsubSolicitacoes = onValue(solicitacoesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const minhasSolicitacoes = Object.values(data).filter(s => 
              s.userId === user.uid
            ).length;
            setKpis(prev => ({ ...prev, solicitacoes: minhasSolicitacoes }));
          } else {
            setKpis(prev => ({ ...prev, solicitacoes: 0 }));
          }
        });
        dbUnsubscribes.push(unsubSolicitacoes);

        // --- D. Busca Férias ---
        const feriasRef = ref(db, 'ferias/proximoPeriodo'); 
        const unsubFerias = onValue(feriasRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.inicio) {
            const dateObj = new Date(data.inicio);
            const mesAno = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            setKpis(prev => ({ ...prev, ferias: mesAno }));
          } else {
            setKpis(prev => ({ ...prev, ferias: 'A definir' }));
          }
        });
        dbUnsubscribes.push(unsubFerias);

      } else {
        // Se deslogou
        setUserProfile({ nome: '...', cargo: '...', role: 'colaborador' });
      }
    });

    // LIMPEZA
    return () => {
      authUnsubscribe();
      dbUnsubscribes.forEach(unsub => unsub());
    };
  }, [navigate]);

  // --- CARDS DE ESTATÍSTICA ---
  const stats = [
    { titulo: 'Tarefas Pendentes', valor: kpis.tarefas.toString(), icon: '⚡', cor: 'var(--neon-blue)' },
    { titulo: 'Solicitações', valor: kpis.solicitacoes.toString(), icon: '📂', cor: 'var(--neon-purple)' },
    { titulo: 'Próx. Férias', valor: kpis.ferias, icon: '🌴', cor: 'var(--neon-green)' },
  ];

  // --- LÓGICA DE PERMISSÃO ---
  const ehAdmin = userProfile.role === 'admin' || userProfile.role === 'gestor' || (userProfile.cargo && userProfile.cargo.toLowerCase().includes('gestor'));

  // --- MENU DE ACESSO RÁPIDO ---
  const acessos = [
    // BLOCO EXCLUSIVO DO GESTOR
    ...(ehAdmin ? [
      { 
        titulo: 'Criar Usuário', 
        desc: 'Cadastrar Colaborador', 
        icon: '🔐', 
        rota: '/cadastro-usuario' 
      },
      { 
        titulo: 'Aprovar Reembolsos', 
        desc: 'Central de Aprovações', 
        icon: '💰', 
        rota: '/gestao-reembolsos' 
      }
    ] : []),
    
    // BLOCO COMUM
    { titulo: 'Minhas Tarefas', desc: 'Kanban e organização', icon: '⚡', rota: '/tarefas' },
    { titulo: 'Reembolsos', desc: 'Gerenciar pedidos', icon: '💸', rota: '/solicitacao' },
    { titulo: 'Ponto Eletrônico', desc: 'Registrar entrada/saída', icon: '⏰', rota: '/folha-ponto' },
    { titulo: 'Holerite Online', desc: 'Documentos digitais', icon: '📄', rota: '/holerite' },
    { titulo: 'Gerador de Nota', desc: 'Emissão de NF de serviço', icon: '🧾', rota: '/gerar-nota' },
    { titulo: 'Mural & Avisos', desc: 'Notícias internas', icon: '📢', rota: '/comunicacao' },
    { titulo: 'Helpdesk TI', desc: 'Abrir chamado', icon: '🎧', rota: '/helpdesk' },
    { titulo: 'Reserva de Salas', desc: 'Agendar espaço', icon: '📅', rota: '/reservas' },
    { titulo: 'Gestão de Viagens', desc: 'Passagens e hotéis', icon: '✈️', rota: '/viagens' },
  ];

  return (
    <div className="tech-layout">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>
      <div className="ambient-light light-4"></div>

      <Sidebar />

      <main className="tech-main">
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
              {userProfile.nome ? userProfile.nome.substring(0,2).toUpperCase() : 'GS'}
            </div>
          </div>
        </header>

        <div className="tech-scroll-content">
          <section className="stats-row">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="glass-stat-card" 
                style={{ 
                  borderTopColor: stat.cor,
                  cursor: stat.titulo.includes('Tarefas') ? 'pointer' : 'default' 
                }}
                onClick={() => stat.titulo.includes('Tarefas') && navigate('/tarefas')}
              >
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
    </div>
  );
}