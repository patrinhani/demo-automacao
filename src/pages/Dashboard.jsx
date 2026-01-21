import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase'; // Importando o banco de dados
import { ref, onValue } from 'firebase/database'; // Importando funções de leitura
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
    // 1. Ouvinte de Tarefas
    const tarefasRef = ref(db, 'tarefas');
    const unsubscribeTarefas = onValue(tarefasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // --- CORREÇÃO AQUI ---
        // Filtra para contar apenas o que NÃO está 'done' (concluído)
        const pendentes = Object.values(data).filter(tarefa => tarefa.status !== 'done').length;
        setKpis(prev => ({ ...prev, tarefas: pendentes }));
      } else {
        setKpis(prev => ({ ...prev, tarefas: 0 }));
      }
    });

    // 2. Ouvinte de Solicitações (Reembolsos)
    const solicitacoesRef = ref(db, 'reembolsos');
    const unsubscribeSolicitacoes = onValue(solicitacoesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setKpis(prev => ({ ...prev, solicitacoes: Object.keys(data).length }));
      } else {
        setKpis(prev => ({ ...prev, solicitacoes: 0 }));
      }
    });

    // 3. Ouvinte de Férias (Lê uma data específica ou calcula)
    const feriasRef = ref(db, 'ferias/proximoPeriodo'); 
    const unsubscribeFerias = onValue(feriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.inicio) {
        // Formata para mostrar Mês/Ano ou Dia/Mês (ex: "Nov/26")
        const dateObj = new Date(data.inicio);
        const mesAno = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        setKpis(prev => ({ ...prev, ferias: mesAno }));
      } else {
        // Fallback se não tiver data marcada
        setKpis(prev => ({ ...prev, ferias: 'A definir' }));
      }
    });

    // Limpa os ouvintes ao sair da tela para não pesar a memória
    return () => {
      unsubscribeTarefas();
      unsubscribeSolicitacoes();
      unsubscribeFerias();
    };
  }, []);

  // --- DADOS DO UI CONECTADOS AO ESTADO ---
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
    // --- BOTÃO DE TAREFAS ---
    { titulo: 'Minhas Tarefas', desc: 'Kanban e organização', icon: '⚡', rota: '/tarefas' },
    // ------------------------
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
      {/* Background Dinâmico */}
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
              <span className="name">Guilherme Silva</span>
              <span className="role">Dev Fullstack</span>
            </div>
            <div className="profile-avatar">GS</div>
          </div>
        </header>

        <div className="tech-scroll-content">
          {/* Cards de Estatísticas com Dados Reais */}
          <section className="stats-row">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="glass-stat-card" 
                style={{ 
                  borderTopColor: stat.cor,
                  // Adiciona cursor pointer se for o card de tarefas
                  cursor: stat.titulo.includes('Tarefas') ? 'pointer' : 'default' 
                }}
                // Navega para tarefas ao clicar no card correspondente
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

          {/* Grid de Módulos */}
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