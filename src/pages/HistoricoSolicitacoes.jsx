import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { useUser } from '../contexts/UserContext'; 
import { useAlert } from '../contexts/AlertContext'; 
import './HistoricoSolicitacoes.css';

export default function HistoricoSolicitacoes() {
  const navigate = useNavigate();
  const { user, uidAtivo, isAdmin, isGestor } = useUser(); 
  const { showAlert } = useAlert();
  
  const [listaCompleta, setListaCompleta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  // --- 1. SEGURANÇA: BLOQUEIO DE ACESSO ---
  useEffect(() => {
    if (user && !isAdmin && !isGestor) {
      showAlert("Acesso Negado", "Apenas Administradores e Gestores podem acessar o Histórico Geral.");
      navigate('/dashboard');
    }
  }, [user, isAdmin, isGestor, navigate, showAlert]);

  // --- 2. BUSCA DE DADOS E FILTRAGEM ---
  useEffect(() => {
    if (!user || (!isAdmin && !isGestor)) return;

    const carregarDados = async () => {
      try {
        setLoading(true);

        const usersSnap = await get(ref(db, 'users'));
        const usersMap = {};
        const subordinados = []; 

        if (usersSnap.exists()) {
            usersSnap.forEach((child) => {
                const dados = child.val();
                const childUid = child.key;
                usersMap[childUid] = dados.nome || "Usuário";
                
                if (dados.gestorId === uidAtivo || dados.gestor === user.nome) {
                    subordinados.push(childUid);
                }
            });
        }

        const [feriasSnap, viagensSnap, helpdeskSnap, reembolsosSnap] = await Promise.all([
            get(ref(db, 'solicitacoes/ferias')),
            get(ref(db, 'viagens')), 
            get(ref(db, 'solicitacoes/helpdesk')),
            get(ref(db, 'reembolsos'))
        ]);

        let itens = [];

        const processar = (snap, tipo, isAninhado = false) => {
            if (!snap.exists()) return;

            const processarItem = (id, dados, uidPai = null) => {
                const reqUserId = dados.userId || dados.uid || dados.idUsuario || uidPai || null;

                if (isGestor && !isAdmin) {
                    if (reqUserId !== uidAtivo && !subordinados.includes(reqUserId)) {
                        return; 
                    }
                }

                const dataCriacao = dados.createdAt || dados.data_criacao || new Date().toISOString();
                
                // MÁGICA AQUI: Pega o nome e converte o e-mail em nome caso seja necessário
                let nomeSolicitante = dados.solicitanteNome || dados.nome || (uidPai ? usersMap[uidPai] : 'Desconhecido');
                
                if (nomeSolicitante && typeof nomeSolicitante === 'string' && nomeSolicitante.includes('@')) {
                    // Pega tudo antes do @ e coloca a primeira letra maiúscula
                    nomeSolicitante = nomeSolicitante.split('@')[0];
                    nomeSolicitante = nomeSolicitante.charAt(0).toUpperCase() + nomeSolicitante.slice(1);
                }

                const cargoSolicitante = dados.solicitanteCargo || (dados.matricula ? `Mat: ${dados.matricula}` : 'Colaborador');
                
                const idAprovador = dados.avaliadoPor || dados.aprovadoPor || dados.atendidoPor || dados.resolvidoPor || dados.responsavelId || dados.responsavel;

                let nomeAprovador = null;
                const statusAtual = (dados.status || 'pendente').toLowerCase();
                
                if (idAprovador && usersMap[idAprovador]) {
                    nomeAprovador = usersMap[idAprovador]; 
                } else if (idAprovador && typeof idAprovador === 'string') {
                    nomeAprovador = idAprovador; 
                } else if (['aprovado', 'concluído', 'concluido', 'resolvido'].includes(statusAtual)) {
                    nomeAprovador = "Sistema / Gestão"; 
                }

                itens.push({
                    id,
                    tipo, 
                    originalData: dados, 
                    data: new Date(dataCriacao),
                    solicitante: nomeSolicitante,
                    cargo: cargoSolicitante,
                    status: dados.status || 'pendente',
                    aprovadorNome: nomeAprovador,
                    detalhePrincipal: getDetalhePrincipal(tipo, dados),
                    detalheSecundario: getDetalheSecundario(tipo, dados)
                });
            };

            if (isAninhado) {
                Object.entries(snap.val()).forEach(([uid, viagensDoUsuario]) => {
                    Object.entries(viagensDoUsuario).forEach(([idViagem, dadosViagem]) => {
                        processarItem(idViagem, dadosViagem, uid);
                    });
                });
            } else {
                Object.entries(snap.val()).forEach(([id, dados]) => {
                    processarItem(id, dados);
                });
            }
        };

        processar(feriasSnap, 'Férias');
        processar(viagensSnap, 'Viagens', true); 
        processar(helpdeskSnap, 'Helpdesk');
        
        if (isAdmin) {
            processar(reembolsosSnap, 'Reembolso'); 
        }

        itens.sort((a, b) => b.data - a.data);
        setListaCompleta(itens);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user, uidAtivo, isAdmin, isGestor]);

  const getDetalhePrincipal = (tipo, d) => {
      if (tipo === 'Férias') return `${d.dias} dias`;
      if (tipo === 'Viagens') return `${d.origem || '?'} ➝ ${d.destino || '?'}`;
      if (tipo === 'Helpdesk') return d.assunto || d.titulo || 'Chamado';
      if (tipo === 'Reembolso') return `R$ ${d.valor}`;
      return '---';
  };

  const getDetalheSecundario = (tipo, d) => {
      if (tipo === 'Férias') return `Início: ${d.inicio ? new Date(d.inicio).toLocaleDateString('pt-BR') : '?'}`;
      if (tipo === 'Viagens') return d.motivo || 'Viagem Corporativa';
      if (tipo === 'Helpdesk') return `Prioridade: ${d.prioridade}`;
      if (tipo === 'Reembolso') return d.motivo;
      return '---';
  };

  const getStatusColor = (status) => {
      const s = status.toLowerCase();
      if (s === 'aprovado' || s === 'concluído' || s === 'concluido' || s === 'resolvido') return 'status-success';
      if (s === 'rejeitado' || s === 'negado' || s === 'cancelado') return 'status-danger';
      return 'status-warning';
  };

  const itensVisiveis = filtro === 'todos' 
    ? listaCompleta 
    : listaCompleta.filter(item => {
        const tipoNormalizado = item.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return tipoNormalizado === filtro.toLowerCase();
      });

  const abasFiltro = isAdmin 
    ? ['todos', 'ferias', 'viagens', 'helpdesk', 'reembolso']
    : ['todos', 'ferias', 'viagens', 'helpdesk'];

  if (user && !isAdmin && !isGestor) return null;

  return (
    <div className="historico-layout">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ↩
        </button>
      </header>

      <div className="historico-container">
        <div className="page-header-techHi">
            <h2>Histórico de Solicitações</h2>
            <p>Visualizando registros de <strong>{listaCompleta.length}</strong> operações.</p>
        </div>

        <div className="filter-tabs">
            {abasFiltro.map((f) => (
                <button 
                    key={f} 
                    className={`filter-tab ${filtro === f ? 'active' : ''}`}
                    onClick={() => setFiltro(f)}
                >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
            ))}
        </div>

        {loading ? (
            <div className="loading-state">
                <span className="tech-spinner">🔄</span> Atualizando base de dados...
            </div>
        ) : (
            <div className="table-responsive-glass">
                <table className="tech-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Solicitante</th>
                            <th>Resumo</th>
                            <th>Status</th>
                            <th>Responsável</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itensVisiveis.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div className="date-cell">
                                        <strong>{item.data.toLocaleDateString()}</strong>
                                        <small>{item.data.toLocaleTimeString().slice(0,5)}</small>
                                    </div>
                                </td>
                                <td><span className={`badge-type ${item.tipo.toLowerCase().replace('é','e')}`}>{item.tipo}</span></td>
                                <td>
                                    <div className="user-cell">
                                        <strong>{item.solicitante}</strong>
                                        <small>{item.cargo}</small>
                                    </div>
                                </td>
                                <td className="details-cell">
                                    <strong>{item.detalhePrincipal}</strong>
                                    <small>{item.detalheSecundario}</small>
                                </td>
                                <td>
                                    <span className={`status-pill ${getStatusColor(item.status)}`}>
                                        {item.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    {item.aprovadorNome ? (
                                        <div className="approver-cell">
                                            <span className="check-icon">✔</span> 
                                            {item.aprovadorNome}
                                        </div>
                                    ) : (
                                        <span className="pending-text">⏳ Em análise</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {itensVisiveis.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>Nenhum registro encontrado nesta categoria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}