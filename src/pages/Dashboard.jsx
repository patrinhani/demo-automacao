import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue, get } from 'firebase/database'; // Adicionado 'get'
import { onAuthStateChanged } from "firebase/auth"; 
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Estado do Usuário
  const [userProfile, setUserProfile] = useState({
    nome: 'Carregando...',
    cargo: '...',
    role: 'colaborador'
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Contadores Separados (Para evitar bugs de soma)
  const [contagemTarefas, setContagemTarefas] = useState(0);
  const [contagemReembolsos, setContagemReembolsos] = useState(0);
  const [contagemGeral, setContagemGeral] = useState(0); // Férias, Viagens, Helpdesk
  const [proxFerias, setProxFerias] = useState('---');

  useEffect(() => {
    // Monitora autenticação
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return navigate('/');

      // 1. BUSCAR PERFIL E DEFINIR PERMISSÃO
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserProfile({
            nome: data.nome || 'Usuário',
            cargo: data.cargo || 'Cargo não definido',
            role: data.role || 'colaborador'
          });
          
          // Verifica se é Gestor/CEO
          const ehChefe = data.role === 'admin' || data.role === 'gestor' || (data.cargo && data.cargo.includes('C.E.O'));
          setIsAdmin(ehChefe);
        }
      });

      // 2. BUSCAR TAREFAS (Sempre pessoais)
      const tarefasRef = ref(db, 'tarefas');
      onValue(tarefasRef, (snapshot) => {
        if (snapshot.exists()) {
          const total = Object.values(snapshot.val()).filter(t => t.userId === user.uid && t.status !== 'done').length;
          setContagemTarefas(total);
        } else {
          setContagemTarefas(0);
        }
      });

      // 3. BUSCAR FÉRIAS
      const feriasRef = ref(db, 'ferias/proximoPeriodo'); 
      onValue(feriasRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.inicio) {
          const dateObj = new Date(data.inicio);
          setProxFerias(dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
        } else {
          setProxFerias('A definir');
        }
      });

    });

    return () => authUnsubscribe();
  }, [navigate]);

  // --- 4. USE EFFECT DEDICADO PARA OS CONTADORES DE SOLICITAÇÃO ---
  // Roda sempre que 'isAdmin' mudar ou o usuário mudar, garantindo a lógica correta
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // A. Listener de Reembolsos (Estrutura Antiga)
    const reembolsosRef = ref(db, 'reembolsos');
    const unsubReembolsos = onValue(reembolsosRef, (snapshot) => {
      let count = 0;
      if (snapshot.exists()) {
        Object.values(snapshot.val()).forEach(item => {
          // Admin vê tudo que é 'em_analise' | Colaborador vê tudo que é dele
          if (isAdmin) {
            if (item.status === 'em_analise') count++;
          } else {
            if (item.userId === user.uid) count++;
          }
        });
      }
      setContagemReembolsos(count);
    });

    // B. Listener de Solicitações Gerais (Estrutura Nova: Férias, Viagens, Helpdesk)
    const solicitacoesRef = ref(db, 'solicitacoes');
    const unsubGerais = onValue(solicitacoesRef, (snapshot) => {
      let count = 0;
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Itera sobre categorias (ferias, viagens...)
        Object.values(data).forEach(categoria => {
          // Itera sobre itens
          Object.values(categoria).forEach(item => {
            // Normaliza status para minúsculo para evitar erro de digitação
            const statusItem = item.status ? item.status.toLowerCase() : 'pendente';
            
            if (isAdmin) {
              // Admin conta apenas PENDENTES
              if (statusItem === 'pendente') count++;
            } else {
              // Colaborador conta TUDO que é dele (Aprovado, Pendente, etc) para ter histórico
              if (item.userId === user.uid) count++;
            }
          });
        });
      }
      setContagemGeral(count);
    });

    return () => {
      unsubReembolsos();
      unsubGerais();
    };
  }, [isAdmin]); // Importante: Recalcula quando o status de Admin é carregado

  // --- CONFIGURAÇÃO DOS CARDS E MENU ---
  const totalSolicitacoes = contagemReembolsos + contagemGeral;

  const stats = [
    { 
      titulo: 'Tarefas Pendentes', 
      valor: contagemTarefas.toString(), 
      icon: '⚡', 
      cor: 'var(--neon-blue)',
      rota: '/tarefas'
    },
    { 
      // Muda o título e ícone dinamicamente
      titulo: isAdmin ? 'Aprovações Pendentes' : 'Minhas Solicitações', 
      valor: totalSolicitacoes.toString(), 
      icon: isAdmin ? '✅' : '📂', 
      cor: 'var(--neon-purple)',
      rota: isAdmin ? '/aprovacoes-gerais' : '/historico-solicitacoes' 
    },
    { 
      titulo: 'Próx. Férias', 
      valor: proxFerias, 
      icon: '🌴', 
      cor: 'var(--neon-green)',
      rota: '/ferias'
    },
  ];

  const acessos = [
    ...(isAdmin ? [
      { titulo: 'Criar Usuário', desc: 'Cadastrar Colaborador', icon: '🔐', rota: '/cadastro-usuario' },
      { titulo: 'Aprovações Gerais', desc: 'Férias, Viagens, TI e $', icon: '✅', rota: '/aprovacoes-gerais' }
    ] : []),
    
    { titulo: 'Histórico Geral', desc: 'Ver aprovações', icon: '📜', rota: '/historico-solicitacoes' },
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
                  cursor: 'pointer' 
                }}
                onClick={() => stat.rota && navigate(stat.rota)}
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