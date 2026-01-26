import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import './HistoricoSolicitacoes.css';

export default function HistoricoSolicitacoes() {
  const navigate = useNavigate();
  const [listaCompleta, setListaCompleta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        // 1. Mapear Usuários (ID -> Nome) para saber quem aprovou
        const usersSnap = await get(ref(db, 'users'));
        const usersMap = {};
        if (usersSnap.exists()) {
            usersSnap.forEach((child) => {
                const dados = child.val();
                usersMap[child.key] = dados.nome || "Usuário";
            });
        }

        // 2. Buscar TUDO (Inclusive os Reembolsos antigos)
        const [feriasSnap, viagensSnap, helpdeskSnap, reembolsosSnap] = await Promise.all([
            get(ref(db, 'solicitacoes/ferias')),
            get(ref(db, 'solicitacoes/viagens')),
            get(ref(db, 'solicitacoes/helpdesk')),
            get(ref(db, 'reembolsos')) // <--- Faltava isso!
        ]);

        let itens = [];

        // Função para normalizar os dados (pois o reembolso tem campos diferentes)
        const processar = (snap, tipo) => {
            if (snap.exists()) {
                Object.entries(snap.val()).forEach(([id, dados]) => {
                    // Normalização de campos
                    const dataCriacao = dados.createdAt || dados.data_criacao || new Date().toISOString();
                    const nomeSolicitante = dados.solicitanteNome || dados.nome || 'Desconhecido';
                    const cargoSolicitante = dados.solicitanteCargo || (dados.matricula ? `Mat: ${dados.matricula}` : 'Colaborador');
                    
                    itens.push({
                        id,
                        tipo, // 'Férias', 'Reembolso', etc.
                        originalData: dados, // Guarda os dados brutos se precisar
                        
                        // Campos Padronizados
                        data: new Date(dataCriacao),
                        solicitante: nomeSolicitante,
                        cargo: cargoSolicitante,
                        status: dados.status || 'pendente',
                        
                        // Quem aprovou?
                        aprovadorNome: dados.avaliadoPor ? usersMap[dados.avaliadoPor] : null,
                        
                        // Detalhes específicos para exibição
                        detalhePrincipal: getDetalhePrincipal(tipo, dados),
                        detalheSecundario: getDetalheSecundario(tipo, dados)
                    });
                });
            }
        };

        processar(feriasSnap, 'Férias');
        processar(viagensSnap, 'Viagens');
        processar(helpdeskSnap, 'Helpdesk');
        processar(reembolsosSnap, 'Reembolso'); // <--- Processa os antigos

        // Ordenar do mais recente para o mais antigo
        itens.sort((a, b) => b.data - a.data);

        setListaCompleta(itens);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // --- HELPERS DE TEXTO ---
  const getDetalhePrincipal = (tipo, d) => {
      if (tipo === 'Férias') return `${d.dias} dias`;
      if (tipo === 'Viagens') return `${d.origem} ➝ ${d.destino}`;
      if (tipo === 'Helpdesk') return d.assunto;
      if (tipo === 'Reembolso') return `R$ ${d.valor}`;
      return '---';
  };

  const getDetalheSecundario = (tipo, d) => {
      if (tipo === 'Férias') return `Início: ${new Date(d.inicio).toLocaleDateString('pt-BR')}`;
      if (tipo === 'Viagens') return d.motivo;
      if (tipo === 'Helpdesk') return `Prioridade: ${d.prioridade}`;
      if (tipo === 'Reembolso') return d.motivo;
      return '---';
  };

  const getStatusColor = (status) => {
      const s = status.toLowerCase();
      if (s === 'aprovado' || s === 'concluído') return 'status-success';
      if (s === 'rejeitado' || s === 'negado') return 'status-danger';
      return 'status-warning';
  };

  // Filtragem visual
  const itensVisiveis = filtro === 'todos' 
    ? listaCompleta 
    : listaCompleta.filter(item => item.tipo.toLowerCase() === filtro.toLowerCase());

  return (
    <div className="historico-layout">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Portal da Transparência</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ↩
        </button>
      </header>

      <div className="historico-container">
        <div className="page-header-tech">
            <h2>Histórico de Solicitações</h2>
            <p>Visualizando registros de <strong>{listaCompleta.length}</strong> operações.</p>
        </div>

        {/* Filtros */}
        <div className="filter-tabs">
            {['todos', 'ferias', 'viagens', 'helpdesk', 'reembolso'].map((f) => (
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
                            <th>Aprovado Por</th>
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