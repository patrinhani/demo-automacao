import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth"; 
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({
    nome: 'Carregando...',
    cargo: '...',
    role: 'colaborador'
  });

  const [kpis, setKpis] = useState({
    tarefas: 0,
    solicitacoes: 0,
    ferias: '---'
  });

  useEffect(() => {
    let dbUnsubscribes = [];

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // --- A. Busca Perfil ---
        const userRef = ref(db, `users/${user.uid}`);
        dbUnsubscribes.push(onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserProfile({
              nome: data.nome || 'Usuário',
              cargo: data.cargo || 'Cargo não definido',
              role: data.role || 'colaborador'
            });
          }
        }));

        // --- B. Busca Tarefas ---
        const tarefasRef = ref(db, 'tarefas');
        dbUnsubscribes.push(onValue(tarefasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const minhasPendentes = Object.values(data).filter(t => 
              t.userId === user.uid && t.status !== 'done'
            ).length;
            setKpis(prev => ({ ...prev, tarefas: minhasPendentes }));
          } else {
            setKpis(prev => ({ ...prev, tarefas: 0 }));
          }
        }));

        // --- C. Busca Solicitações (Reembolsos) ---
        const solicitacoesRef = ref(db, 'reembolsos');
        dbUnsubscribes.push(onValue(solicitacoesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const minhasSolicitacoes = Object.values(data).filter(s => 
              s.userId === user.uid
            ).length;
            setKpis(prev => ({ ...prev, solicitacoes: minhasSolicitacoes }));
          } else {
            setKpis(prev => ({ ...prev, solicitacoes: 0 }));
          }
        }));

        // --- D. Busca Férias (INTEGRAÇÃO FEITA!) ---
        // Agora busca no nó específico do usuário: ferias/UID
        const feriasRef = ref(db, `ferias/${user.uid}`);
        dbUnsubscribes.push(onValue(feriasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Transforma em array e ordena por data (pega a última solicitada)
            const listaFerias = Object.values(data).sort((a, b) => 
              new Date(b.dataInicio) - new Date(a.dataInicio)
            );
            
            // Pega a mais recente
            const ultimaFerias = listaFerias[0];
            
            if (ultimaFerias) {
              const dateObj = new Date(ultimaFerias.dataInicio);
              // Exemplo: "10 de Jan"
              const diaMes = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              setKpis(prev => ({ ...prev, ferias: diaMes }));
            }
          } else {
            setKpis(prev => ({ ...prev, ferias: 'Não agendado' }));
          }
        }));

      } else {
        setUserProfile({ nome: '...', cargo: '...', role: 'colaborador' });
      }
    });

    return () => {
      authUnsubscribe();
      dbUnsubscribes.forEach(unsub => unsub());
    };
  }, [navigate]);

  const stats = [
    { titulo: 'Tarefas Pendentes', valor: kpis.tarefas.toString(), icon: '⚡', cor: 'var(--neon-blue)' },
    { titulo: 'Solicitações', valor: kpis.solicitacoes.toString(), icon: '📂', cor: 'var(--neon-purple)' },
    { titulo: 'Próx. Férias', valor: kpis.ferias, icon: '🌴', cor: 'var(--neon-green)' },
  ];

  const ehAdmin = userProfile.role === 'admin' || userProfile.role === 'gestor' || (userProfile.cargo && userProfile.cargo.toLowerCase().includes('gestor'));

  const acessos = [
    ...(ehAdmin ? [
      { titulo: 'Criar Usuário', desc: 'Cadastrar Colaborador', icon: '🔐', rota: '/cadastro-usuario' },
      { titulo: 'Aprovar Reembolsos', desc: 'Central de Aprovações', icon: '💰', rota: '/gestao-reembolsos' }
    ] : []),
    { titulo: 'Minhas Tarefas', desc: 'Kanban e organização', icon: '⚡', rota: '/tarefas' },
    { titulo: 'Reembolsos', desc: 'Gerenciar pedidos', icon: '💸', rota: '/solicitacao' },
    { titulo: 'Ponto Eletrônico', desc: 'Registrar entrada/saída', icon: '⏰', rota: '/folha-ponto' },
    { titulo: 'Holerite Online', desc: 'Documentos digitais', icon: '📄', rota: '/holerite' },
    { titulo: 'Gerador de Nota', desc: 'Emissão de NF de serviço', icon: '🧾', rota: '/gerar-nota' },
    { titulo: 'Mural & Avisos', desc: 'Notícias internas', icon: '📢', rota: '/comunicacao' },
    { titulo: 'Helpdesk TI', desc: 'Abrir chamado', icon: '🎧', rota: '/helpdesk' },
    { titulo: 'Reserva de Salas', desc: 'Agendar espaço', icon: '📅', rota: '/reservas' },
    { titulo: 'Gestão de Viagens', desc: 'Passagens e hotéis', icon: '✈️', rota: '/viagens' },
    { titulo: 'Minhas Férias', desc: 'Agendar descanso', icon: '🌴', rota: '/ferias' }, // Link adicionado/confirmado
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
                style={{ borderTopColor: stat.cor, cursor: 'default' }}
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