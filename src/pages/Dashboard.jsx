import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useUser } from '../contexts/UserContext'; 
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // 1. PUXANDO AS VARIÁVEIS DO DEVTOOLS E CONTEXTO
  const { isAdmin, uidAtivo, simulatedRole, simulatedSetor, realRole } = useUser();

  const [userProfile, setUserProfile] = useState({ 
    nome: '...', 
    cargo: '...', 
    setor: '', 
    role: '' 
  });

  // Contadores
  const [contagemTarefas, setContagemTarefas] = useState(0);
  const [contagemViagens, setContagemViagens] = useState(0);
  const [contagemGeral, setContagemGeral] = useState(0);
  const [proxFerias, setProxFerias] = useState('---');
  const [contagemReembolsos, setContagemReembolsos] = useState(0);

  // --- LÓGICA DE PERMISSÕES BLINDADA E CONECTADA AO DEVTOOLS ---
  // Tenta ler o 'simulated' primeiro. Se não tiver, cai pro banco.
  const setor = (simulatedSetor || userProfile.setor || '').trim().toLowerCase();
  const role = (simulatedRole || userProfile.role || '').trim().toLowerCase();
  const cargo = (userProfile.cargo || '').trim().toLowerCase();
  
  // REGRA DE OURO (CEOs e Devs): Somente eles podem ver Reembolsos
  const roleAtiva = simulatedRole || realRole || userProfile.role;
  const isSuperAdmin = roleAtiva === 'admin' || roleAtiva === 'dev';

  // MASTERS: Admins, TI ou Devs (Acesso total)
  const isMaster = isAdmin || role === 'admin' || role === 'dev' || setor.includes('ti') || setor.includes('tecnologia') || cargo.includes('dev');
  
  // GESTORES: Cargos de liderança
  const isGestor = isMaster || role === 'gerente' || role === 'gestor' || role === 'diretor' || role === 'coordenador';
  
  // RH: Permissão baseada no setor
  const isRH = isMaster || setor === 'rh' || setor === 'recursos humanos' || setor === 'departamento pessoal' || setor === 'dp';
  
  // FINANCEIRO: Permissão baseada no setor
  const isFinanceiro = isMaster || setor === 'financeiro' || setor === 'faturamento' || setor === 'adm' || setor === 'administrativo';

  // Quem vê aprovações gerais
  const podeVerAprovacoes = isMaster || isGestor || isRH;

  // 1. BUSCAR DADOS EXATOS DO FIREBASE
  useEffect(() => {
    if (!uidAtivo) return; 
    const userRef = ref(db, `users/${uidAtivo}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserProfile({
          nome: data.nome || 'Usuário',
          cargo: data.cargo || 'Cargo não definido',
          setor: data.setor || '',
          role: data.role || 'colaborador' 
        });
      }
    });
    return () => unsubscribe();
  }, [uidAtivo]);

  // 2. TAREFAS
  useEffect(() => {
    if (!uidAtivo) return;
    const tarefasRef = ref(db, 'tarefas');
    const unsubscribe = onValue(tarefasRef, (snapshot) => {
      if (snapshot.exists()) {
        setContagemTarefas(Object.values(snapshot.val()).filter(t => t.userId === uidAtivo && t.status !== 'done').length);
      } else {
        setContagemTarefas(0);
      }
    });
    return () => unsubscribe();
  }, [uidAtivo]);

  // 3. FÉRIAS
  useEffect(() => {
    if (!uidAtivo) return;
    const unsubscribe = onValue(ref(db, `ferias/${uidAtivo}`), (snapshot) => {
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
    return () => unsubscribe();
  }, [uidAtivo]);

  // 4. PENDÊNCIAS
  useEffect(() => {
    if (!uidAtivo) return;
    const filterFunc = (s) => !s || ['pendente','em analise','solicitado','aguardando'].includes(s.toLowerCase());

    const unsubViagens = onValue(ref(db, 'viagens'), (snap) => {
        let c = 0;
        if (snap.exists()) {
            Object.entries(snap.val()).forEach(([uid, viags]) => Object.values(viags).forEach(v => {
                if (filterFunc(v.status) && (podeVerAprovacoes || uid === uidAtivo)) c++;
            }));
        }
        setContagemViagens(c);
    });

    const unsubGerais = onValue(ref(db, 'solicitacoes'), (snap) => {
      let c = 0;
      if (snap.exists()) {
        Object.values(snap.val()).forEach(cat => Object.values(cat).forEach(i => {
            if (filterFunc(i.status) && (podeVerAprovacoes || i.userId === uidAtivo)) c++;
        }));
      }
      setContagemGeral(c); 
    });
    
    const unsubReembolsos = onValue(ref(db, 'reembolsos'), (snap) => {
      let c = 0;
      if (snap.exists()) {
          Object.values(snap.val()).forEach(i => {
              if (i.status === 'em_analise' && (podeVerAprovacoes || i.userId === uidAtivo)) c++;
          });
      }
      setContagemReembolsos(c);
    });
    
    return () => { unsubViagens(); unsubGerais(); unsubReembolsos(); };
  }, [uidAtivo, podeVerAprovacoes]); 

  const totalSolicitacoes = contagemReembolsos + contagemViagens + contagemGeral;

  const stats = [
    { titulo: 'Tarefas Pendentes', valor: contagemTarefas.toString(), icon: '⚡', cor: 'var(--neon-blue)', rota: '/tarefas' },
    { titulo: podeVerAprovacoes ? 'Aprovações Pendentes' : 'Minhas Solicitações', valor: totalSolicitacoes.toString(), icon: podeVerAprovacoes ? '✅' : '📂', cor: 'var(--neon-purple)', rota: podeVerAprovacoes ? '/aprovacoes-gerais' : '/historico-solicitacoes' },
    { titulo: 'Próx. Férias', valor: proxFerias, icon: '🌴', cor: 'var(--neon-green)', rota: '/ferias' },
  ];

  // --- LISTA DE ACESSOS ÚNICA ---
  const todosAcessos = [
    ...(isRH ? [
      { id: 'criar-usuario', titulo: 'Criar Usuário', desc: 'Cadastrar Colaborador', icon: '🔐', rota: '/cadastro-usuario' }
    ] : []),
    ...(podeVerAprovacoes ? [
      { id: 'aprovacoes', titulo: 'Aprovações Gerais', desc: 'Central Unificada', icon: '✅', rota: '/aprovacoes-gerais' }
    ] : []),
    ...(isFinanceiro ? [
      { id: 'conciliacao', titulo: 'Conciliação', desc: 'Baixa Bancária', icon: '🏦', rota: '/conciliacao' },
      { id: 'gerador-nota', titulo: 'Gerador de Nota', desc: 'Emissão de NF de serviço', icon: '🧾', rota: '/gerar-nota' }
    ] : []),
    { id: 'historico', titulo: 'Histórico Geral', desc: 'Ver aprovações', icon: '📜', rota: '/historico-solicitacoes' },
    { id: 'tarefas', titulo: 'Minhas Tarefas', desc: 'Organização de tarefas', icon: '⚡', rota: '/tarefas' },
    
    // O CARD DE REEMBOLSOS SÓ ENTRA NA LISTA SE O USUÁRIO FOR ADMIN OU DEV
    ...(isSuperAdmin ? [
      { id: 'reembolsos', titulo: 'Reembolsos', desc: 'Solicitar Reembolso', icon: '💸', rota: '/solicitacao' }
    ] : []),
    
    { id: 'ferias', titulo: 'Minhas Férias', desc: 'Agendar descanso', icon: '🌴', rota: '/ferias' },
    { id: 'ponto', titulo: 'Ponto Eletrônico', desc: 'Registrar entrada/saída', icon: '⏰', rota: '/folha-ponto' },
    { id: 'holerite', titulo: 'Holerite Online', desc: 'Documentos digitais', icon: '📄', rota: '/holerite' },
    { id: 'comunicacao', titulo: 'Mural & Avisos', desc: 'Notícias internas', icon: '📢', rota: '/comunicacao' },
    { id: 'helpdesk', titulo: 'Helpdesk TI', desc: 'Abrir chamado', icon: '🎧', rota: '/helpdesk' },
    { id: 'reservas', titulo: 'Reserva de Salas', desc: 'Agendar espaço', icon: '📅', rota: '/reservas' },
    { id: 'viagens', titulo: 'Gestão de Viagens', desc: 'Passagens e hotéis', icon: '✈️', rota: '/viagens' },
  ];

  return (
    <div className="tech-layout">
      <div className="ambient-light light-1"></div><div className="ambient-light light-2"></div><div className="ambient-light light-3"></div><div className="ambient-light light-4"></div>
      
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
              <span className="role">{simulatedRole || userProfile.cargo}</span>
            </div>
            <div className="profile-avatar">
              {userProfile.nome && userProfile.nome !== '...' ? userProfile.nome.substring(0,2).toUpperCase() : 'GS'}
            </div>
          </div>
        </header>

        <div className="tech-scroll-content">
          <section className="stats-row">
            {stats.map((stat, i) => (
              <div key={i} className="glass-stat-card" style={{ borderTopColor: stat.cor, cursor: 'pointer', animationDelay: `${0.1 + (i * 0.1)}s` }} onClick={() => stat.rota && navigate(stat.rota)}>
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

          <div className="modules-section" style={{ marginTop: '30px' }}>
            <h2 className="section-title">Ferramentas & Módulos</h2>
            <div className="modules-grid-tech">
              {todosAcessos.map((item, index) => (
                <div 
                  key={item.id} 
                  className="tech-card" 
                  onClick={() => navigate(item.rota)}
                  style={{ animationDelay: `${0.2 + (index * 0.05)}s` }}
                >
                  <div className="tech-icon">{item.icon}</div>
                  <div className="tech-info">
                    <h3>{item.titulo}</h3>
                    <p>{item.desc}</p>
                  </div>
                  <div className="arrow-icon">→</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}