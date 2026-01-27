import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth"; 
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({ nome: '...', cargo: '...', role: 'colaborador' });
  const [isAdmin, setIsAdmin] = useState(false);

  // Contadores Separados para garantir a soma correta
  const [contagemTarefas, setContagemTarefas] = useState(0);
  const [contagemReembolsos, setContagemReembolsos] = useState(0); // Antigo
  const [contagemViagens, setContagemViagens] = useState(0);       // Novo (Root)
  const [contagemGeral, setContagemGeral] = useState(0);           // Novos (Solicitações)
  const [proxFerias, setProxFerias] = useState('---');

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return navigate('/');

      // 1. Perfil
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserProfile({
            nome: data.nome || 'Usuário',
            cargo: data.cargo || 'Cargo não definido',
            role: data.role || 'colaborador'
          });
          const ehChefe = data.role === 'admin' || data.role === 'gestor' || (data.cargo && data.cargo.includes('C.E.O'));
          setIsAdmin(ehChefe);
        }
      });

      // 2. Tarefas
      onValue(ref(db, 'tarefas'), (snapshot) => {
        if (snapshot.exists()) {
          setContagemTarefas(Object.values(snapshot.val()).filter(t => t.userId === user.uid && t.status !== 'done').length);
        } else setContagemTarefas(0);
      });

      // 3. Férias
      onValue(ref(db, `ferias/${user.uid}`), (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lista = Object.values(data).sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
          if (lista[0]) setProxFerias(new Date(lista[0].dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
        } else setProxFerias('A definir');
      });
    });
    return () => authUnsubscribe();
  }, [navigate]);

  // --- 4. CONTADORES UNIFICADOS ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Helper: Verifica se status é pendente (considera várias grafias)
    const isPendente = (s) => {
        if (!s) return true;
        return ['pendente', 'em analise', 'em análise', 'solicitado', 'aguardando'].includes(s.toLowerCase());
    };

    // A. Reembolsos (Antigo)
    const unsubReembolsos = onValue(ref(db, 'reembolsos'), (snap) => {
      let c = 0;
      if (snap.exists()) {
        Object.values(snap.val()).forEach(item => {
          const pendente = item.status === 'em_analise';
          if (isAdmin ? pendente : (item.userId === user.uid && pendente)) c++;
        });
      }
      setContagemReembolsos(c);
    });

    // B. Viagens (Estrutura Aninhada: viagens/{uid}/{tripId})
    const unsubViagens = onValue(ref(db, 'viagens'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            const data = snap.val();
            Object.keys(data).forEach(uid => {
                const userTrips = data[uid];
                Object.values(userTrips).forEach(trip => {
                    if (isPendente(trip.status)) {
                        if (isAdmin) c++;
                        else if (uid === user.uid) c++;
                    }
                });
            });
        }
        setContagemViagens(c);
    });

    // C. Solicitações Gerais (Férias, Helpdesk - Estrutura Plana)
    const unsubGerais = onValue(ref(db, 'solicitacoes'), (snap) => {
      let c = 0;
      if (snap.exists()) {
        const data = snap.val();
        Object.values(data).forEach(categoria => {
           if (typeof categoria === 'object') {
               Object.values(categoria).forEach(item => {
                   if (isPendente(item.status)) {
                       if (isAdmin) c++;
                       else if (item.userId === user.uid) c++;
                   }
               });
           }
        });
      }
      setContagemGeral(c);
    });

    return () => { unsubReembolsos(); unsubViagens(); unsubGerais(); };
  }, [isAdmin]);

  // Soma Total
  const totalSolicitacoes = contagemReembolsos + contagemViagens + contagemGeral;

  const stats = [
    { titulo: 'Tarefas Pendentes', valor: contagemTarefas.toString(), icon: '⚡', cor: 'var(--neon-blue)', rota: '/tarefas' },
    { 
        titulo: isAdmin ? 'Aprovações Pendentes' : 'Minhas Solicitações', 
        valor: totalSolicitacoes.toString(), 
        icon: isAdmin ? '✅' : '📂', 
        cor: 'var(--neon-purple)', 
        rota: isAdmin ? '/aprovacoes-gerais' : '/historico-solicitacoes' 
    },
    { titulo: 'Próx. Férias', valor: proxFerias, icon: '🌴', cor: 'var(--neon-green)', rota: '/ferias' },
  ];

  const acessos = [
    ...(isAdmin ? [
      { titulo: 'Criar Usuário', desc: 'Cadastrar Colaborador', icon: '🔐', rota: '/cadastro-usuario' },
      { titulo: 'Aprovações Gerais', desc: 'Central Unificada', icon: '✅', rota: '/aprovacoes-gerais' }
    ] : []),
    { titulo: 'Histórico Geral', desc: 'Ver aprovações', icon: '📜', rota: '/historico-solicitacoes' },
    { titulo: 'Minhas Tarefas', desc: 'Kanban e organização', icon: '⚡', rota: '/tarefas' },
    { titulo: 'Reembolsos', desc: 'Gerenciar pedidos', icon: '💸', rota: '/solicitacao' },
    { titulo: 'Minhas Férias', desc: 'Agendar descanso', icon: '🌴', rota: '/ferias' },
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
          <div className="header-content"><h1>Visão Geral</h1><p>Bem-vindo ao <strong>TechPortal</strong></p></div>
          <div className="tech-profile" onClick={() => navigate('/perfil')}>
            <div className="profile-info"><span className="name">{userProfile.nome}</span><span className="role">{userProfile.cargo}</span></div>
            <div className="profile-avatar">{userProfile.nome ? userProfile.nome.substring(0,2).toUpperCase() : 'GS'}</div>
          </div>
        </header>
        <div className="tech-scroll-content">
          <section className="stats-row">
            {stats.map((stat, i) => (
              <div key={i} className="glass-stat-card" style={{ borderTopColor: stat.cor, cursor: 'pointer' }} onClick={() => stat.rota && navigate(stat.rota)}>
                <div className="stat-icon" style={{ background: stat.cor, boxShadow: `0 0 20px ${stat.cor}` }}>{stat.icon}</div>
                <div className="stat-info"><h3>{stat.valor}</h3><span>{stat.titulo}</span></div>
              </div>
            ))}
          </section>
          <section className="modules-section">
            <h2 className="section-title">Acesso Rápido</h2>
            <div className="modules-grid-tech">
              {acessos.map((item, index) => (
                <div key={index} className="tech-card" onClick={() => navigate(item.rota)}>
                  <div className="tech-icon">{item.icon}</div>
                  <div className="tech-info"><h3>{item.titulo}</h3><p>{item.desc}</p></div>
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