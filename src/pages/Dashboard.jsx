import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useUser } from '../contexts/UserContext'; 
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // CORREÇÃO 1: Pegamos 'uidAtivo' para garantir que vemos os dados de quem estamos simulando
  const { user, isAdmin, uidAtivo } = useUser();

  const [userProfile, setUserProfile] = useState({ nome: '...', cargo: '...' });

  // Contadores
  const [contagemTarefas, setContagemTarefas] = useState(0);
  const [contagemViagens, setContagemViagens] = useState(0);
  const [contagemGeral, setContagemGeral] = useState(0);
  const [proxFerias, setProxFerias] = useState('---');

  // 1. BUSCAR DADOS VISUAIS (NOME/CARGO) - Agora usa uidAtivo
  useEffect(() => {
    if (!uidAtivo) return; // Só busca se tiver um ID ativo definido
    
    // CORREÇÃO 2: Busca no caminho do uidAtivo, não do user.uid
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

  // 2. TAREFAS (Sempre pessoais do uidAtivo)
  useEffect(() => {
    if (!uidAtivo) return;
    const tarefasRef = ref(db, 'tarefas');
    onValue(tarefasRef, (snapshot) => {
      if (snapshot.exists()) {
        const total = Object.values(snapshot.val())
          // CORREÇÃO 3: Filtra pelo uidAtivo
          .filter(t => t.userId === uidAtivo && t.status !== 'done').length;
        setContagemTarefas(total);
      } else {
        setContagemTarefas(0);
      }
    });
  }, [uidAtivo]);

  // 3. FÉRIAS (Sempre pessoais do uidAtivo)
  useEffect(() => {
    if (!uidAtivo) return;
    // CORREÇÃO 4: Busca férias do uidAtivo
    const feriasRef = ref(db, `ferias/${uidAtivo}`);
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
  }, [uidAtivo]);

  // 4. CONTADORES REATIVOS AO PERFIL
  useEffect(() => {
    if (!uidAtivo) return;

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
                        // Se for Admin, conta tudo. Se não, só as do uidAtivo.
                        if (isAdmin) c++;
                        else if (uid === uidAtivo) c++; // CORREÇÃO 5
                    }
                });
            });
        }
        setContagemViagens(c);
    });

    // B. Solicitações Gerais
    const unsubGerais = onValue(ref(db, 'solicitacoes'), (snap) => {
      let c = 0;
      if (snap.exists()) {
        const data = snap.val();
        Object.values(data).forEach(categoria => {
           if (typeof categoria === 'object') {
               Object.values(categoria).forEach(item => {
                   if (isPendente(item.status)) {
                       if (isAdmin) c++;
                       else if (item.userId === uidAtivo) c++; // CORREÇÃO 6
                   }
               });
           }
        });
      }
      setContagemGeral(prev => c); 
    });
    
    return () => { unsubViagens(); unsubGerais(); };
  }, [uidAtivo, isAdmin]); // Depende de uidAtivo agora

  // Recriando o listener de reembolsos
  const [contagemReembolsos, setContagemReembolsos] = useState(0);
  useEffect(() => {
      if(!uidAtivo) return;
      return onValue(ref(db, 'reembolsos'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            Object.values(snap.val()).forEach(item => {
                const pendente = item.status === 'em_analise';
                // CORREÇÃO 7: Filtro final
                if (isAdmin ? pendente : (item.userId === uidAtivo && pendente)) c++;
            });
        }
        setContagemReembolsos(c);
      });
  }, [uidAtivo, isAdmin]);


  // SOMA TOTAL PARA O CARD
  const totalSolicitacoes = contagemReembolsos + contagemViagens + contagemGeral;

  // --- CONFIGURAÇÃO DOS CARDS ---
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
      { titulo: 'Aprovações Gerais', desc: 'Central Unificada', icon: '✅', rota: '/aprovacoes-gerais' },
      { titulo: 'Conciliação', desc: 'Baixa Bancária', icon: '🏦', rota: '/conciliacao' } 
    ] : []),
    
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
        {/* BARRA DE DEBUG PARA VOCÊ TER CERTEZA (OPCIONAL) */}
        {uidAtivo && (
          <div style={{
            position:'fixed', bottom:0, right:0, 
            background:'rgba(0,0,0,0.8)', color:'#0f0', 
            padding:'5px 10px', fontSize:'10px', zIndex:9999
          }}>
            SIMULANDO: {userProfile.nome} ({uidAtivo})
          </div>
        )}

        <header className="tech-header">
          <div className="header-content">
            <h1>Visão Geral</h1>
            <p>Bem-vindo ao <strong>TechPortal</strong></p>
          </div>
          <div className="tech-profile" onClick={() => navigate('/perfil')}>
            <div className="profile-info">
              {/* CORREÇÃO VISUAL: Agora exibe os dados carregados do perfil correto */}
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
    </div>
  );
}