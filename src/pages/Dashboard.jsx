import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase'; // Importando auth e db
import { ref, onValue } from 'firebase/database';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // --- ESTADO PARA OS DADOS REAIS (KPIs) ---
  const [kpis, setKpis] = useState({
    tarefas: 0,
    solicitacoes: 0,
    ferias: '---'
  });

  // --- EFEITO PARA BUSCAR DADOS DO FIREBASE EM TEMPO REAL ---
  useEffect(() => {
    // Função auxiliar para verificar login
    const user = auth.currentUser;
    if (!user) return; // Se não tiver usuário, não busca nada (ou poderia redirecionar)

    // 1. Ouvinte de Tarefas (COM FILTRO DE USUÁRIO)
    const tarefasRef = ref(db, 'tarefas');
    const unsubscribeTarefas = onValue(tarefasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filtra: (É do meu usuário?) E (Não está concluída?)
        const minhasPendentes = Object.values(data).filter(t => 
          t.userId === user.uid && t.status !== 'done'
        ).length;
        setKpis(prev => ({ ...prev, tarefas: minhasPendentes }));
      } else {
        setKpis(prev => ({ ...prev, tarefas: 0 }));
      }
    });

    // 2. Ouvinte de Solicitações (COM FILTRO DE USUÁRIO)
    const solicitacoesRef = ref(db, 'reembolsos');
    const unsubscribeSolicitacoes = onValue(solicitacoesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filtra apenas as solicitações feitas por MIM
        const minhasSolicitacoes = Object.values(data).filter(s => 
          s.userId === user.uid
        ).length;
        setKpis(prev => ({ ...prev, solicitacoes: minhasSolicitacoes }));
      } else {
        setKpis(prev => ({ ...prev, solicitacoes: 0 }));
      }
    });

    // 3. Ouvinte de Férias (Global ou Pessoal)
    // Se quiser pessoal no futuro, a lógica é a mesma: salvar userId nas férias
    const feriasRef = ref(db, 'ferias/proximoPeriodo'); 
    const unsubscribeFerias = onValue(feriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.inicio) {
        const dateObj = new Date(data.inicio);
        const mesAno = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        setKpis(prev => ({ ...prev, ferias: mesAno }));
      } else {
        setKpis(prev => ({ ...prev, ferias: 'A definir' }));
      }
    });

    return () => {
      unsubscribeTarefas();
      unsubscribeSolicitacoes();
      unsubscribeFerias();
    };
  }, []); // Executa ao montar a tela

  // --- DADOS DO UI ---
  const stats = [
    { 
      titulo: 'Tarefas Pendentes', 
      valor: kpis.tarefas.toString(), 
      icon: '⚡', 
      cor: 'var(--neon-blue)' 
    },
    { 
      titulo: 'Solicitações', 
      valor: kpis.solicitacoes.toString(), 
      icon: '📂', 
      cor: 'var(--neon-purple)' 
    },
    { 
      titulo: 'Próx. Férias', 
      valor: kpis.ferias, 
      icon: '🌴', 
      cor: 'var(--neon-green)' 
    },
  ];

  const acessos = [
    { titulo: 'Minhas Tarefas', desc: 'Kanban e organização', icon: '⚡', rota: '/tarefas' },
    { titulo: 'Ponto Eletrônico', desc: 'Registrar entrada/saída', icon: '⏰', rota: '/folha-ponto' },
    { titulo: 'Holerite Online', desc: 'Documentos digitais', icon: '📄', rota: '/holerite' },
    { titulo: 'Reembolsos', desc: 'Gerenciar pedidos', icon: '💸', rota: '/solicitacao' },
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
              {/* Aqui você pode futuramente puxar o nome do auth também */}
              <span className="name">Guilherme Silva</span>
              <span className="role">Dev Fullstack</span>
            </div>
            <div className="profile-avatar">GS</div>
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