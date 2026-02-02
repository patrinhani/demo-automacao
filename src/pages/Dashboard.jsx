import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useUser } from '../contexts/UserContext'; // <--- INTEGRADO AO CONTEXTO
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Pegamos os dados globais do Contexto (incluindo o 'isAdmin' que muda dinamicamente)
  const { user, isAdmin } = useUser();

  const [userProfile, setUserProfile] = useState({ nome: '...', cargo: '...' });

  // Contadores
  const [contagemTarefas, setContagemTarefas] = useState(0);
  const [contagemViagens, setContagemViagens] = useState(0);
  const [contagemGeral, setContagemGeral] = useState(0);
  const [proxFerias, setProxFerias] = useState('---');

  // 1. BUSCAR DADOS VISUAIS (NOME/CARGO) - Apenas cosmético
  useEffect(() => {
    if (!user) return;
    
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserProfile({
          nome: data.nome || 'Usuário',
          cargo: data.cargo || 'Cargo não definido'
        });
      }
    });
  }, [user]);

  // 2. TAREFAS (Sempre pessoais)
  useEffect(() => {
    if (!user) return;
    const tarefasRef = ref(db, 'tarefas');
    onValue(tarefasRef, (snapshot) => {
      if (snapshot.exists()) {
        const total = Object.values(snapshot.val())
          .filter(t => t.userId === user.uid && t.status !== 'done').length;
        setContagemTarefas(total);
      } else {
        setContagemTarefas(0);
      }
    });
  }, [user]);

  // 3. FÉRIAS (Sempre pessoais para o card)
  useEffect(() => {
    if (!user) return;
    const feriasRef = ref(db, `ferias/${user.uid}`);
    onValue(feriasRef, (snapshot) => {
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
  }, [user]);

  // 4. CONTADORES REATIVOS AO PERFIL (Muda quando 'isAdmin' muda)
  useEffect(() => {
    if (!user) return;

    const isPendente = (s) => {
        if (!s) return true;
        return ['pendente', 'em analise', 'em análise', 'solicitado', 'aguardando'].includes(s.toLowerCase());
    };

    // A. Viagens
    const unsubViagens = onValue(ref(db, 'viagens'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            const data = snap.val();
            Object.keys(data).forEach(uid => {
                const userTrips = data[uid];
                Object.values(userTrips).forEach(trip => {
                    if (isPendente(trip.status)) {
                        // Se for Admin, conta tudo. Se não, só as minhas.
                        if (isAdmin) c++;
                        else if (uid === user.uid) c++;
                    }
                });
            });
        }
        setContagemViagens(c);
    });

    // B. Solicitações Gerais (Reembolsos, Helpdesk, etc que estão em 'solicitacoes' ou 'reembolsos')
    // Nota: Seu código original separava reembolsos e 'solicitacoes'. Vou manter a lógica unificada ou somar.
    // Para simplificar e manter compatibilidade, vou somar Reembolsos (raiz) + Solicitações (raiz)
    
    // B1. Reembolsos (Antigo nó raiz)
    const unsubReembolsos = onValue(ref(db, 'reembolsos'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            Object.values(snap.val()).forEach(item => {
                const pendente = item.status === 'em_analise';
                if (isAdmin ? pendente : (item.userId === user.uid && pendente)) c++;
            });
        }
        // Atualiza estado parcial (vamos somar no render ou usar estado separado se preferir, 
        // mas aqui vou somar tudo em 'contagemGeral' para simplificar o card único)
        // Como o React state é assíncrono, o ideal seria ter estados separados e somar no render.
        // Vou usar uma lógica simplificada aqui: ContagemGeral será a soma de TUDO exceto viagens/tarefas.
    });

    // B2. Solicitações Gerais (Helpdesk, etc)
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
      setContagemGeral(prev => c); // Nota: Em produção ideal, separaríamos os estados, mas aqui mantemos simples.
    });
    
    // *Importante*: Para corrigir a soma de Reembolsos + Gerais sem sobrescrever, 
    // o ideal é separar. Vou restaurar 'contagemReembolsos' para garantir precisão.
    
    return () => { unsubViagens(); unsubReembolsos(); unsubGerais(); };
  }, [user, isAdmin]); // <--- O PULO DO GATO: Recalcula quando 'isAdmin' muda

  // Recriando o listener de reembolsos separado para não perder a conta
  const [contagemReembolsos, setContagemReembolsos] = useState(0);
  useEffect(() => {
      if(!user) return;
      return onValue(ref(db, 'reembolsos'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            Object.values(snap.val()).forEach(item => {
                const pendente = item.status === 'em_analise';
                if (isAdmin ? pendente : (item.userId === user.uid && pendente)) c++;
            });
        }
        setContagemReembolsos(c);
      });
  }, [user, isAdmin]);


  // SOMA TOTAL PARA O CARD
  const totalSolicitacoes = contagemReembolsos + contagemViagens + contagemGeral;

  // --- CONFIGURAÇÃO DOS CARDS (DINÂMICA) ---
  const stats = [
    { titulo: 'Tarefas Pendentes', valor: contagemTarefas.toString(), icon: '⚡', cor: 'var(--neon-blue)', rota: '/tarefas' },
    { 
        // Texto e ícone mudam conforme o perfil
        titulo: isAdmin ? 'Aprovações Pendentes' : 'Minhas Solicitações', 
        valor: totalSolicitacoes.toString(), 
        icon: isAdmin ? '✅' : '📂', 
        cor: 'var(--neon-purple)', 
        rota: isAdmin ? '/aprovacoes-gerais' : '/historico-solicitacoes' 
    },
    { titulo: 'Próx. Férias', valor: proxFerias, icon: '🌴', cor: 'var(--neon-green)', rota: '/ferias' },
  ];

  const acessos = [
    // ITENS EXCLUSIVOS DE ADMIN/GESTOR
    ...(isAdmin ? [
      { titulo: 'Criar Usuário', desc: 'Cadastrar Colaborador', icon: '🔐', rota: '/cadastro-usuario' },
      { titulo: 'Aprovações Gerais', desc: 'Central Unificada', icon: '✅', rota: '/aprovacoes-gerais' },
      { titulo: 'Conciliação', desc: 'Baixa Bancária', icon: '🏦', rota: '/conciliacao' } // Adicionei Conciliação aqui
    ] : []),
    
    // ITENS COMUNS
    { titulo: 'Histórico Geral', desc: 'Ver aprovações', icon: '📜', rota: '/historico-solicitacoes' },
    { titulo: 'Minhas Tarefas', desc: 'Organização de tarefas', icon: '⚡', rota: '/tarefas' },
    { titulo: 'Reembolsos', desc: 'Solicitar Reembolso', icon: '💸', rota: '/solicitacao' },
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
      {/* Luzes de Fundo */}
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
              {userProfile.nome && userProfile.nome !== '...' ? userProfile.nome.substring(0,2).toUpperCase() : 'GS'}
            </div>
          </div>
        </header>

        <div className="tech-scroll-content">
          {/* CARDS DE ESTATÍSTICAS */}
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

          {/* GRID DE MÓDULOS (ACESSO RÁPIDO) */}
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