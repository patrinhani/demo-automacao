import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';
import './Helpdesk.css';

export default function Helpdesk() {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);

  const [chamados, setChamados] = useState([
    { id: 'INC-9901', assunto: 'Servidor de E-mail fora do ar', categoria: 'Infraestrutura', prioridade: 'alta', solicitante: 'Ana RH', sla: '01:20:00', status: 'Aberto' },
    { id: 'REQ-3022', assunto: 'Instalação do Power BI', categoria: 'Software', prioridade: 'media', solicitante: 'Carlos Fin.', sla: '23:00:00', status: 'Em Andamento' },
    { id: 'INC-9903', assunto: 'Reset de Senha SAP', categoria: 'Acesso', prioridade: 'baixa', solicitante: 'Roberto Vendas', sla: '47:00:00', status: 'Aberto' },
    { id: 'INC-9904', assunto: 'Impressora 3º andar travando', categoria: 'Infraestrutura', prioridade: 'media', solicitante: 'Recepção', sla: '04:15:00', status: 'Pendente' },
    { id: 'REQ-3025', assunto: 'Acesso à pasta de Marketing', categoria: 'Acesso', prioridade: 'alta', solicitante: 'Julia Mkt', sla: '00:45:00', status: 'Aberto' },
  ]);

  // Função para classe da prioridade
  const getPrioClass = (prio) => {
    if(prio === 'alta') return 'prio-alta';
    if(prio === 'media') return 'prio-media';
    return 'prio-baixa';
  };

  const resolverChamado = (id) => {
    if(window.confirm("Deseja encerrar este chamado automaticamente?")) {
        setChamados(chamados.filter(c => c.id !== id));
        alert("Chamado encerrado e notificação enviada ao usuário.");
    }
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h2>Central de Serviços de TI</h2>
            <div className="breadcrumbs">Suporte &gt; Meus Chamados &gt; Fila N1</div>
          </div>
          <button className="btn-primary" onClick={() => setModalAberto(true)}>+ Novo Chamado</button>
        </div>

        {/* CARDS DE KPI (Para o robô ler totais) */}
        <div className="ticket-stats">
            <div className="stat-box critico">
                <span className="stat-number">{chamados.filter(c => c.prioridade === 'alta').length}</span>
                <span className="stat-label">Prioridade Alta</span>
            </div>
            <div className="stat-box medio">
                <span className="stat-number">{chamados.filter(c => c.sla.startsWith('00')).length}</span>
                <span className="stat-label">SLA Vencendo</span>
            </div>
            <div className="stat-box aberto">
                <span className="stat-number">{chamados.length}</span>
                <span className="stat-label">Total na Fila</span>
            </div>
        </div>

        {/* TABELA DE CHAMADOS */}
        <table className="ticket-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Assunto</th>
                    <th>Categoria</th>
                    <th>Solicitante</th>
                    <th>SLA Restante</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {chamados.map(ticket => (
                    <tr key={ticket.id} className={getPrioClass(ticket.prioridade)}>
                        <td><strong>{ticket.id}</strong></td>
                        <td>
                            {ticket.assunto}
                            {ticket.prioridade === 'alta' && <span style={{marginLeft:'10px', fontSize:'0.7rem', color:'red'}}>🔥 URGENTE</span>}
                        </td>
                        <td>
                            <span className={`badge ${ticket.categoria.toLowerCase().substring(0,5)}`}>
                                {ticket.categoria}
                            </span>
                        </td>
                        <td>{ticket.solicitante}</td>
                        <td className="sla-timer">{ticket.sla}</td>
                        <td>
                            <button className="btn-secondary" style={{fontSize:'0.8rem', padding:'5px 10px'}} onClick={() => resolverChamado(ticket.id)}>
                                Resolver
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* MODAL NOVO CHAMADO */}
      {modalAberto && (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Abrir Novo Chamado</h3>
                    <button className="modal-close" onClick={() => setModalAberto(false)}>×</button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setModalAberto(false); alert("Chamado criado: INC-9999"); }}>
                    <div className="modal-form-group">
                        <label>Categoria</label>
                        <select id="chamado_cat"><option>Hardware</option><option>Software</option><option>Acesso/Rede</option></select>
                    </div>
                    <div className="modal-form-group">
                        <label>Assunto</label>
                        <input id="chamado_assunto" type="text" placeholder="Resumo do problema" />
                    </div>
                    <div className="modal-form-group">
                        <label>Descrição</label>
                        <textarea id="chamado_desc" rows="3"></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary">Criar Ticket</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}